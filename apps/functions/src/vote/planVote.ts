import { MyVote, VoteRank, VoteRankChange } from './Vote'

export type VotePlan =
  | 'alreadyVoted'
  | {
      // NOTE: 対象の回答に投票済みならその票。未投票なら undefined で新規作成する
      current?: MyVote
      demotedVotes: VoteRankChange[]
    }

/**
 * 同一お題における自分の投票状況から、新しい投票で何が変わるかを決める。
 *
 * - 投票済みの回答に別の賞を選ぶと、その回答の賞を付け替える
 * - rank1 / rank2 は 1 お題につき 1 票なので、別の回答で使っていればその回答を一段下げる
 *   （下げた先の賞も使用済みなら、さらに玉突きで下げる）
 */
export const planVote = ({
  myVotes,
  kotaeId,
  rank,
}: {
  myVotes: MyVote[]
  kotaeId: string
  rank: VoteRank
}): VotePlan => {
  const current = myVotes.find((v) => v.kotaeId === kotaeId)
  if (current?.rank === rank) return 'alreadyVoted'

  const others = myVotes.filter((v) => v.kotaeId !== kotaeId)
  const demotedVotes: VoteRankChange[] = []
  let incoming: VoteRank = rank
  while (incoming !== 3) {
    const displaced = others.find((v) => v.rank === incoming)
    if (!displaced) break
    const to: VoteRank = incoming === 1 ? 2 : 3
    demotedVotes.push({
      id: displaced.id,
      kotaeId: displaced.kotaeId,
      kotaeContent: displaced.kotaeContent,
      from: incoming,
      to,
    })
    incoming = to
  }

  return { current, demotedVotes }
}
