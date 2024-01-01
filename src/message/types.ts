export type CHARACTER_TYPE = 'shizue' | 'tanukichi'

export type CHARACTER_MESSAGE_KEYS = 'odai-start'

export type CharacterMessages = {
  [key in CHARACTER_MESSAGE_KEYS]: string[]
}
