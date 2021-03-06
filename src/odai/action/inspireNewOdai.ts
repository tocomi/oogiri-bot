import { KnownBlock, WebClient } from '@slack/web-api'
import { postMessage } from '../../message/postMessage'
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
        text: 'おはようございます！',
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '今週もお仕事頑張っていきましょう〜！',
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '新しいお題、お待ちしていますね:blush:',
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
