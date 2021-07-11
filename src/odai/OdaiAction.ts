import { App } from '@slack/bolt'
import { KnownBlock, WebClient } from '@slack/web-api'
import { VoteUseCase } from '../vote/VoteUseCase'
import { OdaiUseCase } from './OdaiUseCase'

const postMessage = async (client: WebClient, blocks: KnownBlock[]) => {
  await client.chat.postMessage({
    channel: 'C026ZJX56AC',
    blocks,
  })
}

const postEphemeral = async (client: WebClient, user: string, text: string) => {
  await client.chat.postEphemeral({
    channel: 'C026ZJX56AC',
    user,
    text,
  })
}

export const createOdai = (app: App) => {
  const CALLBACK_ID = 'create-odai'
  const BLOCK_ID = 'create-odai-block'
  const ACTION_ID = 'input'
  app.shortcut('oogiri-create-odai', async ({ ack, body, client, logger }) => {
    const result = await client.views
      .open({
        trigger_id: body.trigger_id,
        view: {
          type: 'modal',
          callback_id: CALLBACK_ID,
          title: {
            type: 'plain_text',
            text: 'お題の設定',
          },
          submit: {
            type: 'plain_text',
            text: '送信',
          },
          close: {
            type: 'plain_text',
            text: 'キャンセル',
          },
          blocks: [
            {
              type: 'input',
              block_id: BLOCK_ID,
              element: {
                type: 'plain_text_input',
                action_id: ACTION_ID,
                placeholder: {
                  type: 'plain_text',
                  text: '例: こんな結婚式は嫌だ',
                },
              },
              label: {
                type: 'plain_text',
                text: 'お題',
              },
            },
          ],
        },
      })
      .catch(async (e) => {
        logger.error(e)
      })
    if (result && result.error) {
      logger.error(result.error)
    }
    await ack()
  })

  app.view(CALLBACK_ID, async ({ ack, view, client, body, logger }) => {
    const newOdai = view.state.values[BLOCK_ID][ACTION_ID].value
    // NOTE: 型の絞り込みのため。slack側で必須入力になっている。
    if (!newOdai) return

    const odaiUseCase = new OdaiUseCase()
    const success = await odaiUseCase
      .create({
        slackTeamId: view.team_id,
        title: newOdai,
        createdBy: body.user.id,
      })
      .then(() => true)
      .catch((error) => {
        logger.error(error)
        return false
      })
    await ack()
    if (!success) return

    const blocks: KnownBlock[] = [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `<!here>`,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `:mega: :mega: :mega: 新しいお題が設定されました！ :mega: :mega: :mega:`,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `:speech_balloon: *お題: ${newOdai}*`,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: 'お題に回答するには入力欄左の :zap: マークから *お題に回答する* を選んでください！',
        },
      },
    ]
    await postMessage(client, blocks)
  })
}

export const startVoting = (app: App) => {
  const CALLBACK_ID = 'start-voting'
  const ACTION_ID = 'vote-kotae'
  app.shortcut('oogiri-start-voting', async ({ ack, body, client, logger }) => {
    const result = await client.views
      .open({
        trigger_id: body.trigger_id,
        view: {
          type: 'modal',
          callback_id: CALLBACK_ID,
          title: {
            type: 'plain_text',
            text: '投票の開始 :ticket:',
          },
          submit: {
            type: 'plain_text',
            text: 'OK',
          },
          close: {
            type: 'plain_text',
            text: 'キャンセル',
          },
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: '投票を開始します。お題への回答は締め切られます。',
              },
            },
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: 'よろしいですか？',
              },
            },
          ],
        },
      })
      .catch(async (e) => {
        logger.error(e)
      })
    if (result && result.error) {
      logger.error(result.error)
    }
    await ack()
  })

  app.view(CALLBACK_ID, async ({ ack, view, client, logger }) => {
    const odaiUseCase = new OdaiUseCase()
    const result = await odaiUseCase
      .startVoting({
        slackTeamId: view.team_id,
      })
      .then((result) => result)
      .catch((error) => {
        logger.error(error)
        return undefined
      })
    await ack()
    if (!result || !result.odaiTitle || !result.kotaeList.length) return

    const blocks: KnownBlock[] = [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '<!here>',
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: ':mega: :mega: :mega: *投票が開始されました！* :mega: :mega: :mega:',
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '面白いと思った回答に投票しましょう！',
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '回答の右のボタンを押すと投票できます :punch:',
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `:speech_balloon: *お題: ${result.odaiTitle}*`,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '---',
        },
      },
    ]
    await postMessage(client, blocks)

    // NOTE: 答えの一覧をチャンネルに投稿
    await Promise.all(
      result.kotaeList.map(async (kotae) => {
        const blocks: KnownBlock[] = [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `:speaking_head_in_silhouette: *${kotae.content}*`,
            },
            accessory: {
              type: 'button',
              action_id: ACTION_ID,
              text: {
                type: 'plain_text',
                text: '草',
              },
            },
          },
        ]
        await postMessage(client, blocks)
      })
    )
  })

  app.action(ACTION_ID, async ({ ack, body, client, logger }) => {
    // NOTE: 投票ボタンが押された回答のテキストを抽出
    // 何故か型が無いので仕方なくts-ignoreを仕様
    // text -> ':speaking_head_in_silhouette: *kotae*'
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const text: string = body.message.blocks[0].text.text
    // NOTE: textから回答部分のみを抜き出し。正規表現でバシッとできた方が良いけど。。
    const content = text.replace(':speaking_head_in_silhouette: ', '').replace(/\*/g, '')
    const voteUseCase = new VoteUseCase()
    const slackTeamId = body.team?.id || ''
    const user = body.user.id
    const result = await voteUseCase.create({
      slackTeamId,
      content,
      votedBy: user,
    })
    await ack()
    if (result.message === 'Already Voted') {
      await postEphemeral(client, user, `この回答は投票済みです :sunglasses:`)
      return
    }
    if (result.error) {
      logger.error(result.message)
      return
    }
    await postEphemeral(client, user, `投票を受け付けました！ 回答: ${content}`)
  })
}
