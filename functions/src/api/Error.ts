export type ApiError = {
  status: 400 | 422 | 500
  code: string
  message: string
}

export const hasError = (response: Record<string, unknown> | 'ok'): response is ApiError => {
  if (response === 'ok') return false
  return 'status' in response && 'code' in response && 'message' in response
}

export const InternalServerError: ApiError = {
  status: 500,
  code: 'error',
  message: 'Internal Server Error',
}

export const IllegalArgumentError: ApiError = {
  status: 422,
  code: 'illegalArgument',
  message: 'Illegal Argument Error',
}

export const OdaiDuplicationError: ApiError = {
  status: 400,
  code: 'odaiDuplication',
  message: 'Odai Duplication',
}

export const NoActiveOdaiError: ApiError = {
  status: 400,
  code: 'noActiveOdai',
  message: 'No Active Odai',
}

export const NoPostingOdaiError: ApiError = {
  status: 400,
  code: 'noPostingOdai',
  message: 'No Posting Odai',
}

export const NoVotingOdaiError: ApiError = {
  status: 400,
  code: 'noVotingOdai',
  message: 'No Voting Odai',
}

export const NoFinishedOdaiError: ApiError = {
  status: 400,
  code: 'noFinishedOdai',
  message: 'No Finished Odai',
}

export const NoTargetKotaeError: ApiError = {
  status: 400,
  code: 'noTargetKotae',
  message: 'No Target Kotae',
}

export const AlreadyVotedError: ApiError = {
  status: 400,
  code: 'alreadyVoted',
  message: 'Already Voted',
}
