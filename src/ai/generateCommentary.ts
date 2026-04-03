import type { ChatModel } from 'openai/resources/shared'
import { COMMENTATORS } from './commentators'
import { openai } from './openai'
import { Kotae } from '../kotae/Kotae'
import { CommentatorCommentary } from '../odai/Odai'

const MODEL: ChatModel = 'gpt-5.4'
const MAX_TOKENS = 600

type CommentaryMode = 'group' | 'personal'

async function generateCommentaryInternal(
  odaiTitle: string,
  kotaeList: Kotae[],
  mode: CommentaryMode,
): Promise<CommentatorCommentary> {
  const kotaeContents = kotaeList.map((k) => k.content)

  const results = await Promise.all(
    COMMENTATORS.map((c) =>
      openai.chat.completions
        .create({
          model: MODEL,
          max_completion_tokens: MAX_TOKENS,
          messages: [
            { role: 'system', content: c.systemPrompt },
            {
              role: 'user',
              content:
                mode === 'group'
                  ? c.buildGroupUserPrompt(odaiTitle, kotaeContents)
                  : c.buildPersonalUserPrompt(odaiTitle, kotaeContents),
            },
          ],
        })
        .then((res) => ({
          id: c.id,
          content: res.choices[0].message.content || c.fallbackMessage,
        })),
    ),
  )

  return results.reduce(
    (acc, { id, content }) => ({ ...acc, [id]: content }),
    {} as CommentatorCommentary,
  )
}

export const generateCommentary = ({
  odaiTitle,
  kotaeList,
}: {
  odaiTitle: string
  kotaeList: Kotae[]
}): Promise<CommentatorCommentary> =>
  generateCommentaryInternal(odaiTitle, kotaeList, 'group')

export const generatePersonalCommentary = ({
  odaiTitle,
  kotaeList,
}: {
  odaiTitle: string
  kotaeList: Kotae[]
}): Promise<CommentatorCommentary> =>
  generateCommentaryInternal(odaiTitle, kotaeList, 'personal')
