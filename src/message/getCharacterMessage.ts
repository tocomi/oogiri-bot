import { shizue } from './character'
import { CHARACTER_MESSAGE_KEYS, CHARACTER_TYPE } from './types'

const characterType: CHARACTER_TYPE = 'tanukichi'
const characterMessages = getCharacterMessages(characterType)

/**
 * キャラクターのメッセージを取得する。
 * - key に指定されたメッセージからランダムでメッセージを取得する。
 */
export const getCharacterMessage = (key: CHARACTER_MESSAGE_KEYS): string => {
  const messages = characterMessages[key]
  const index = Math.floor(Math.random() * messages.length)
  return messages[index]
}

function getCharacterMessages(characterType: CHARACTER_TYPE) {
  switch (characterType) {
    case 'shizue':
      return shizue
    default:
      throw new Error(`指定されたキャラクターは存在しません。 characterType: ${characterType}`)
  }
}
