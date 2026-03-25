import { KnownBlock, WebClient } from '@slack/web-api'
import { hasError } from '../../../../api/Error'
import { getCharacterMessage } from '../../../../message'
import { OdaiService } from '../../../../odai/OdaiService'
import { postMessage } from '../../../postMessage'

export const inspireNewOdai = async ({
  slackTeamId,
  client,
  odaiService,
}: {
  slackTeamId: string
  client: WebClient
  odaiService: OdaiService
}) => {
  const result = await odaiService.getCurrent({ slackTeamId })
  // NOTE: アクティブなお題がない場合のみ投稿する
  if (!hasError(result)) return

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
    },
  )
  await postMessage({ client, blocks })
}
