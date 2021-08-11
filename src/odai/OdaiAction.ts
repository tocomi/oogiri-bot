import { App } from '@slack/bolt'
import { KnownBlock } from '@slack/web-api'
import { makeRanking } from '../kotae/makeRanking'
import { postMessage, postEphemeral, postInternalErrorMessage } from '../message/postMessage'
import { VoteUseCase } from '../vote/VoteUseCase'
import { OdaiUseCase } from './OdaiUseCase'
import { milliSecondsToYYYYMMDD } from '../util/DateUtil'

export const createOdai = (app: App) => {
  const CALLBACK_ID = 'create-odai'
  const TITLE_ACTION_ID = 'title'
  const TITLE_BLOCK_ID = 'title-block'
  const DUE_DATE_ACTION_ID = 'due-date'
  const DUE_DATE_BLOCK_ID = 'due-date-block'
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
              block_id: TITLE_BLOCK_ID,
              element: {
                type: 'plain_text_input',
                action_id: TITLE_ACTION_ID,
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
            {
              type: 'input',
              block_id: DUE_DATE_BLOCK_ID,
              element: {
                type: 'datepicker',
                action_id: DUE_DATE_ACTION_ID,
                placeholder: {
                  type: 'plain_text',
                  text: 'いつまで回答を受け付けますか？',
                  emoji: true,
                },
              },
              label: {
                type: 'plain_text',
                text: '回答期限(目安。自動的に回答が締め切られることはありません)',
                emoji: true,
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
    await ack()
    const title = view.state.values[TITLE_BLOCK_ID][TITLE_ACTION_ID].value
    const dueDate = view.state.values[DUE_DATE_BLOCK_ID][DUE_DATE_ACTION_ID].selected_date

    if (!title || !dueDate) {
      logger.error(view.state.values)
      postInternalErrorMessage({ client, user: body.user.id })
      return
    }

    const odaiUseCase = new OdaiUseCase()
    const success = await odaiUseCase
      .create({
        slackTeamId: view.team_id,
        title,
        dueDate: new Date(dueDate).getTime(),
        createdBy: body.user.id,
      })
      .then(() => true)
      .catch((error) => {
        if (error.response.data.message === 'Odai Duplication') {
          logger.warn(error.response.data.message)
          const blocks: KnownBlock[] = [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: ':warning: 他のお題がオープンされています :warning:',
              },
            },
          ]
          postEphemeral({ client, user: body.user.id, blocks })
        } else {
          logger.error(error.response.config)
          postInternalErrorMessage({ client, user: body.user.id })
        }
        return false
      })
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
          text: `:speech_balloon: *お題: ${title}*`,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `:calendar: *回答期限: ${milliSecondsToYYYYMMDD(dueDate)}*`,
        },
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'お題に回答する (複数回答可)',
            },
            style: 'primary',
            action_id: 'oogiri-create-kotae',
          },
        ],
      },
    ]
    await postMessage({ client, blocks })
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

  app.view(CALLBACK_ID, async ({ ack, view, client, body, logger }) => {
    await ack()
    const odaiUseCase = new OdaiUseCase()
    const result = await odaiUseCase
      .startVoting({
        slackTeamId: view.team_id,
      })
      .then((result) => result)
      .catch((error) => {
        if (
          error.response.data.message === 'No Active Odai' ||
          error.response.data.message === 'No Posting Odai'
        ) {
          logger.warn(error.response.data.message)
          const blocks: KnownBlock[] = [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: ':warning: 他のお題がオープンされています :warning:',
              },
            },
          ]
          postEphemeral({ client, user: body.user.id, blocks })
        } else {
          logger.error(error.response.config)
          postInternalErrorMessage({ client, user: body.user.id })
        }
        return undefined
      })
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
          text: '回答の右のボタンを押すと投票できます:punch: (複数投票可)',
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
    await postMessage({ client, blocks })

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
        await postMessage({ client, blocks })
      })
    )
  })

  app.action(ACTION_ID, async ({ ack, body, client, logger }) => {
    await ack()
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
    const result = await voteUseCase
      .create({
        slackTeamId,
        content,
        votedBy: user,
      })
      .catch((error) => {
        if (error.response.data.message === 'Already Voted') {
          logger.warn(error.response.data.message)
          const blocks: KnownBlock[] = [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `:warning: この答えは既に投票済みです :warning: 回答: ${content}`,
              },
            },
          ]
          postEphemeral({
            client,
            user,
            blocks,
          })
        } else {
          logger.error(error.response.config)
          postInternalErrorMessage({ client, user })
        }
        return undefined
      })
    if (!result) return
    const blocks: KnownBlock[] = [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `:point_up: 投票を受け付けました！ 回答: ${content}`,
        },
      },
    ]
    await postEphemeral({ client, user, blocks })
  })
}

export const finish = (app: App) => {
  const CALLBACK_ID = 'finish'
  app.shortcut('oogiri-finish', async ({ ack, body, client, logger }) => {
    const result = await client.views
      .open({
        trigger_id: body.trigger_id,
        view: {
          type: 'modal',
          callback_id: CALLBACK_ID,
          title: {
            type: 'plain_text',
            text: '結果発表 :mega:',
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
                text: '結果発表をします。回答への投票は締め切られます。',
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

  app.view(CALLBACK_ID, async ({ ack, view, client, body, logger }) => {
    await ack()
    const odaiUseCase = new OdaiUseCase()
    const result = await odaiUseCase
      .finish({
        slackTeamId: view.team_id,
      })
      .then((result) => result)
      .catch((error) => {
        if (
          error.response.data.message === 'No Active Odai' ||
          error.response.data.message === 'No Voting Odai'
        ) {
          logger.warn(error.response.data.message)
          const blocks: KnownBlock[] = [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: ':warning: 投票受付中のお題がありません :warning:',
              },
            },
          ]
          postEphemeral({ client, user: body.user.id, blocks })
        } else {
          logger.error(error.response.config)
          postInternalErrorMessage({ client, user: body.user.id })
        }
        return undefined
      })
    if (!result || !result.odaiTitle || !result.kotaeList.length) return

    const rankedList = makeRanking(result.kotaeList)

    const headerBlocks: KnownBlock[] = [
      {
        type: 'image',
        image_url:
          'https://stat.ameba.jp/user_images/20200706/09/lymph2/9e/3e/j/o1280072014784922530.jpg',
        alt_text: 'inspiration',
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
    const footerBlocks: KnownBlock[] = [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '入賞者の方々おめでとうございます！ :clap: :clap: :clap:',
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '次回も奮ってご参加ください！ :muscle: :muscle: :muscle:',
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '個人の結果はコマンド `/oogiri-check-my-result` で確認できます。(他の人には見えません)',
        },
      },
    ]
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const rankingBlocks: KnownBlock[] = rankedList
      .map((ranked) => {
        const medalEmoji = () => {
          switch (ranked.rank) {
            case 1:
              return ':first_place_medal:'
            case 2:
              return ':second_place_medal:'
            case 3:
              return ':third_place_medal:'
          }
        }
        return [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `${medalEmoji()} *第${ranked.rank}位* <@${ranked.createdBy}>`,
            },
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `:point_up: 票数 *${ranked.votedCount}票*`,
            },
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `:speaking_head_in_silhouette: *${ranked.content}*`,
            },
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `-`,
            },
          },
        ]
      })
      .flat()
    const blocks = [...headerBlocks, ...rankingBlocks, ...footerBlocks]
    await postMessage({ client, blocks })
  })
}
