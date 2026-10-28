import { SlackParams } from '../api/Api'
import { ApiError } from '../api/Error'
import { OdaiStatus } from '../odai/Odai'

export type VoteRank = 1 | 2 | 3

type VoteBase = {
  votedBy: string
  rank: VoteRank
}

export type Vote = VoteBase & {
  createdAt: Date | number
  kotaeId: string
  kotaeContent: string
  kotaeCreatedBy: string
}

export type MyVotesOfOdaiParams = SlackParams & {
  votedBy: string
  odaiId: string
}

// NOTE: 同一お題における自分の投票
export type MyVote = {
  id: string
  kotaeId: string
  kotaeContent: string
  rank: VoteRank
}

export type VoteRankChange = Omit<MyVote, 'rank'> & {
  from: VoteRank
  to: VoteRank
}

export type VoteCreateRequest = SlackParams &
  VoteBase & {
    id: string
    content: string
  }
export type VoteCreateResponse =
  | {
      vote: Vote
      // NOTE: 投票済みの回答の賞を付け替えたときの元の賞
      previousRank?: VoteRank
      // NOTE: 金・銀を入れ直したことで一段下がった自分の投票
      demotedVotes: VoteRankChange[]
    }
  | ApiError

export type VoteOfCurrentOdaiParams = SlackParams

export type VoteOfCurrentOdaiResponse = Omit<Vote, 'kotaeContent'>[]

export type VoteCount = {
  odaiTitle: string
  odaiImageUrl?: string
  odaiStatus: OdaiStatus
  uniqueUserCount: number
  voteCount: number
}

export type VoteCountParams = SlackParams

export type VoteCountResponse = VoteCount | ApiError

export type VoteCountByUserParams = SlackParams & {
  userId: string
}

export type VoteCountByUser = {
  votedBy: string
  voteCount: number
}

export type VoteCountByUserResponse =
  | {
      allCount: VoteCountByUser[]
      recent5timesCount: VoteCountByUser[]
    }
  | ApiError
