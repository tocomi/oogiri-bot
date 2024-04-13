import { KnownBlock, WebClient } from '@slack/web-api'
import { getCharacterMessage } from '../../message'
import { postMessage } from '../../slack/postMessage'
import { OdaiUseCase } from '../OdaiUseCase'

export const inspireNewOdai = async ({
  slackTeamId,
  client,
}: {
  slackTeamId: string
  client: WebClient
}) => {
  const odaiUseCase = new OdaiUseCase()
  const result = await odaiUseCase.getCurrent({ slackTeamId }).catch((error) => {
    if (error.response.data.message === 'No Active Odai') {
      return 'noActiveOdai'
    }
    console.error(error.response.config)
  })
  // NOTE: アクティブなお題がない場合のみ投稿する
  if (result !== 'noActiveOdai') return

  const blocks: KnownBlock[] = []
  blocks.push(
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: getCharacterMessage('odai-inspire-001'),
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: getCharacterMessage('odai-inspire-002'),
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: getCharacterMessage('odai-inspire-003'),
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: getCharacterMessage('odai-inspire-004'),
      },
    },
    {
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: 'お題を設定する！',
          },
          style: 'primary',
          action_id: 'oogiri-create-odai',
        },
      ],
    }
  )
  await postMessage({ client, blocks })
}
