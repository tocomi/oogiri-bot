export type CHARACTER_TYPE = 'shizue' | 'tanukichi'

export type CHARACTER_MESSAGE_KEYS =
  | 'odai-start'
  | 'odai-inspire-001'
  | 'odai-inspire-002'
  | 'odai-inspire-003'
  | 'kotae-status'
  | 'vote-start'
  | 'vote-description'
  | 'vote-status'
  | 'vote-result-001'
  | 'vote-result-002'
  | 'vote-result-003'
  | 'ippon-odai-start'

export type CharacterMessages = {
  // NOTE: 空配列を許容しないようにしている
  [key in CHARACTER_MESSAGE_KEYS]: [string, ...string[]]
}
