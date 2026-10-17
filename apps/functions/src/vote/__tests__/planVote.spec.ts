import { describe, expect, it } from 'vitest'

import { planVote } from '../planVote'
import { MyVote } from '../Vote'

const myVote = (kotaeId: string, rank: MyVote['rank']): MyVote => ({
  id: `vote-${kotaeId}`,
  kotaeId,
  kotaeContent: `回答${kotaeId}`,
  rank,
})

const demoted = (
  kotaeId: string,
  from: MyVote['rank'],
  to: MyVote['rank'],
) => ({
  id: `vote-${kotaeId}`,
  kotaeId,
  kotaeContent: `回答${kotaeId}`,
  from,
  to,
})

describe('planVote', () => {
  it('未投票の回答への投票は新規作成になる', () => {
    expect(planVote({ myVotes: [], kotaeId: 'A', rank: 1 })).toEqual({
      current: undefined,
      demotedVotes: [],
    })
  })

  it('同じ回答に同じ賞を選ぶと alreadyVoted', () => {
    expect(planVote({ myVotes: [myVote('A', 3)], kotaeId: 'A', rank: 3 })).toBe(
      'alreadyVoted',
    )
  })

  it('投票済みの回答に別の賞を選ぶと付け替えになる', () => {
    expect(
      planVote({ myVotes: [myVote('A', 3)], kotaeId: 'A', rank: 1 }),
    ).toEqual({ current: myVote('A', 3), demotedVotes: [] })
  })

  it('rank1 を別の回答に入れ直すと元の rank1 は rank2 に下がる', () => {
    expect(
      planVote({ myVotes: [myVote('A', 1)], kotaeId: 'B', rank: 1 }),
    ).toEqual({ current: undefined, demotedVotes: [demoted('A', 1, 2)] })
  })

  it('rank2 を別の回答に入れ直すと元の rank2 は rank3 に下がる', () => {
    expect(
      planVote({ myVotes: [myVote('A', 2)], kotaeId: 'B', rank: 2 }),
    ).toEqual({ current: undefined, demotedVotes: [demoted('A', 2, 3)] })
  })

  it('rank1 を入れ直すと rank1 → rank2 → rank3 と玉突きで下がる', () => {
    expect(
      planVote({
        myVotes: [myVote('A', 1), myVote('B', 2), myVote('C', 3)],
        kotaeId: 'C',
        rank: 1,
      }),
    ).toEqual({
      current: myVote('C', 3),
      demotedVotes: [demoted('A', 1, 2), demoted('B', 2, 3)],
    })
  })

  it('rank2 の回答を rank1 に上げると元の rank1 と入れ替わる', () => {
    expect(
      planVote({
        myVotes: [myVote('A', 1), myVote('B', 2)],
        kotaeId: 'B',
        rank: 1,
      }),
    ).toEqual({ current: myVote('B', 2), demotedVotes: [demoted('A', 1, 2)] })
  })

  it('rank3 は何票でも入れられ、他の票を下げない', () => {
    expect(
      planVote({
        myVotes: [myVote('A', 1), myVote('B', 2), myVote('C', 3)],
        kotaeId: 'D',
        rank: 3,
      }),
    ).toEqual({ current: undefined, demotedVotes: [] })
  })

  it('rank1 の回答を rank3 に下げても他の票は動かない', () => {
    expect(
      planVote({
        myVotes: [myVote('A', 1), myVote('B', 2)],
        kotaeId: 'A',
        rank: 3,
      }),
    ).toEqual({ current: myVote('A', 1), demotedVotes: [] })
  })
})
