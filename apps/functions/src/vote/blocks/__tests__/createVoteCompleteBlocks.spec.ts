import { describe, expect, it } from 'vitest'

import { createVoteCompleteBlocks } from '../createVoteCompleteBlocks'

const texts = (blocks: ReturnType<typeof createVoteCompleteBlocks>) =>
  blocks.map((b) => (b.type === 'section' ? b.text?.text : undefined))

describe('createVoteCompleteBlocks', () => {
  it('新規投票は受け付けメッセージだけを返す', () => {
    const blocks = createVoteCompleteBlocks({
      content: '回答C',
      voteRank: 1,
      demotedVotes: [],
    })

    expect(texts(blocks)).toEqual([
      ':white_check_mark: *投票の登録が完了しました！* 回答: 回答C 投票: :first_place_medal:',
    ])
  })

  it('付け替えと玉突きは 1 件ずつ別の section で返す', () => {
    const blocks = createVoteCompleteBlocks({
      content: '回答C',
      voteRank: 1,
      previousRank: 3,
      demotedVotes: [
        { id: 'a', kotaeId: 'A', kotaeContent: '回答A', from: 1, to: 2 },
        { id: 'b', kotaeId: 'B', kotaeContent: '回答B', from: 2, to: 3 },
      ],
    })

    expect(texts(blocks)).toEqual([
      ':white_check_mark: *投票の変更が完了しました！* 回答: 回答C 投票: :third_place_medal: → :first_place_medal:',
      ':arrow_down: 回答: 回答A 投票: :first_place_medal: → :second_place_medal:',
      ':arrow_down: 回答: 回答B 投票: :second_place_medal: → :third_place_medal:',
    ])
  })

  it('長い回答が並んでも各 section は Slack の 3,000 文字上限に収まる', () => {
    const long = 'あ'.repeat(1000)
    const blocks = createVoteCompleteBlocks({
      content: long,
      voteRank: 1,
      previousRank: 3,
      demotedVotes: [
        { id: 'a', kotaeId: 'A', kotaeContent: long, from: 1, to: 2 },
        { id: 'b', kotaeId: 'B', kotaeContent: long, from: 2, to: 3 },
      ],
    })

    expect(texts(blocks).every((t) => (t?.length ?? 0) <= 3000)).toBe(true)
  })
})
