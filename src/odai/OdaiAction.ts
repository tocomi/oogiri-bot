import { App, BlockAction, InteractiveMessage, SlackShortcut, WorkflowStepEdit } from '@slack/bolt'
import { Logger, WebClient } from '@slack/web-api'
import { KotaeUseCase } from '../kotae/KotaeUseCase'
import { makePointRanking } from '../kotae/rank/makePointRanking'
import { makeVotedCountRanking } from '../kotae/rank/makeVotedCountRanking'
import { postMessage, postEphemeral, postInternalErrorMessage } from '../message/postMessage'
import { getSlackUserList } from '../util/getSlackUserList'
import { isImageUrl } from '../util/isImageUrl'
import { VoteUseCase } from '../vote/VoteUseCase'
import {
  createVoteAlreadyBlocks,
  createVoteAlreadySameRankBlocks,
  createVoteCompleteBlocks,
  createVoteResultContentBlocks,
  createVoteResultFooterBlocks,
  createVoteResultHeaderBlocks,
  createVoteSectionBlocks,
  createVoteStartFooterBlocks,
  createVoteStartHeaderBlocks,
} from '../vote/blocks'
import { convertVoteRank } from '../vote/convertVoteValue'
import { OdaiUseCase } from './OdaiUseCase'
import {
  createOdaiCreateBlocks,
  createOdaiDuplicationBlocks,
  createOdaiNothingBlocks,
} from './blocks'

const CREATE_ODAI_CALLBACK_ID = 'create-odai'
const TITLE_ACTION_ID = 'title'
const TITLE_BLOCK_ID = 'title-block'
const DUE_DATE_ACTION_ID = 'due-date'
const DUE_DATE_BLOCK_ID = 'due-date-block'
const IMAGE_URL_ACTION_ID = 'image-url'
const IMAGE_URL_BLOCK_ID = 'image-url-block'

export const START_VOTING_ACTION_ID = 'oogiri-start-voting'
const START_VOTING_CALLBACK_ID = 'start-voting'
const VOTING_ACTION_ID = 'vote-kotae'

const create = async ({
  body,
  client,
  logger,
}: {
  body: SlackShortcut | BlockAction | InteractiveMessage | WorkflowStepEdit
  client: WebClient
  logger: Logger
}) => {
  const result = await client.views
    .open({
      trigger_id: body.trigger_id,
      view: {
        type: 'modal',
        callback_id: CREATE_ODAI_CALLBACK_ID,
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
              },
            },
            label: {
              type: 'plain_text',
              text: '回答期限 (目安。自動的に回答が締め切られることはありません)',
            },
          },
          {
            type: 'input',
            block_id: IMAGE_URL_BLOCK_ID,
            optional: true,
            element: {
              type: 'plain_text_input',
              action_id: IMAGE_URL_ACTION_ID,
              placeholder: {
                type: 'plain_text',
                text: 'https://img.yakkun.com/poke/icon960/n110.png',
              },
            },
            label: {
              type: 'plain_text',
              text: '画像URL (画像系のお題のみ)',
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
}

export const createOdai = (app: App) => {
  // NOTE: ショートカットからの作成
  app.shortcut('oogiri-create-odai', async ({ ack, body, client, logger }) => {
    await ack()
    await create({ body, client, logger })
  })
  // NOTE: ボタンからの作成
  app.action('oogiri-create-odai', async ({ ack, body, client, logger }) => {
    await ack()
    if ('trigger_id' in body) {
      await create({ body, client, logger })
    }
  })

  app.view(CREATE_ODAI_CALLBACK_ID, async ({ ack, view, client, body, logger }) => {
    await ack()
    const title = view.state.values[TITLE_BLOCK_ID][TITLE_ACTION_ID].value
    const dueDate = view.state.values[DUE_DATE_BLOCK_ID][DUE_DATE_ACTION_ID].selected_date
    const imageUrl = view.state.values[IMAGE_URL_BLOCK_ID][IMAGE_URL_ACTION_ID].value || ''

    if (!title || !dueDate) {
      logger.error(view.state.values)
      postInternalErrorMessage({ client, user: body.user.id })
      return
    }

    if (imageUrl && !isImageUrl(imageUrl)) {
      logger.error(view.state.values)
      postInternalErrorMessage({
        client,
        user: body.user.id,
        overrideMessage: ':warning: URLは画像の拡張子(.jpg等)で終わるもののみが有効です :warning:',
      })
      return
    }

    const odaiUseCase = new OdaiUseCase()
    const success = await odaiUseCase
      .create({
        slackTeamId: view.team_id,
        title,
        imageUrl,
        dueDate: new Date(dueDate).getTime(),
        createdBy: body.user.id,
      })
      .then(() => true)
      .catch((error) => {
        if (error.response.data.message === 'Odai Duplication') {
          logger.warn(error.response.data.message)
          const blocks = createOdaiDuplicationBlocks()
          postEphemeral({ client, user: body.user.id, blocks })
        } else {
          logger.error(error.response.config)
          postInternalErrorMessage({ client, user: body.user.id })
        }
        return false
      })
    if (!success) return

    const blocks = createOdaiCreateBlocks({ title, dueDate, imageUrl })
    await postMessage({ client, blocks })
  })
}

const start = async ({
  body,
  client,
  logger,
}: {
  body: SlackShortcut | BlockAction | InteractiveMessage | WorkflowStepEdit
  client: WebClient
  logger: Logger
}) => {
  const result = await client.views
    .open({
      trigger_id: body.trigger_id,
      view: {
        type: 'modal',
        callback_id: START_VOTING_CALLBACK_ID,
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
}

export const startVoting = (app: App) => {
  // NOTE: ショートカットからの実行
  app.shortcut(START_VOTING_ACTION_ID, async ({ ack, body, client, logger }) => {
    await ack()
    await start({ body, client, logger })
  })

  // NOTE: ボタンからの実行
  app.action(START_VOTING_ACTION_ID, async ({ ack, body, client, logger }) => {
    await ack()
    if ('trigger_id' in body) {
      await start({ body, client, logger })
    }
  })

  app.view(START_VOTING_CALLBACK_ID, async ({ ack, view, client, body, logger }) => {
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
          const blocks = createOdaiDuplicationBlocks()
          postEphemeral({ client, user: body.user.id, blocks })
        } else {
          logger.error(error.response.config)
          postInternalErrorMessage({ client, user: body.user.id })
        }
        return undefined
      })
    if (!result || !result.odaiTitle || !result.kotaeList.length) return

    const headerBlocks = createVoteStartHeaderBlocks({
      title: result.odaiTitle,
      imageUrl: result.odaiImageUrl,
    })
    await postMessage({ client, blocks: headerBlocks })

    // NOTE: 答えの一覧をチャンネルに投稿
    await Promise.all(
      result.kotaeList.map(async (kotae) => {
        const blocks = createVoteSectionBlocks({ kotaeContent: kotae.content })
        await postMessage({ client, blocks })
      })
    )

    const footerBlocks = createVoteStartFooterBlocks()
    await postMessage({ client, blocks: footerBlocks })
  })

  app.action(VOTING_ACTION_ID, async ({ ack, action, body, client, logger }) => {
    await ack()
    // NOTE: 投票ボタンが押された回答のテキストを抽出
    // 何故か型が無いので仕方なくts-ignoreを仕様
    // text -> ':speaking_head_in_silhouette: *kotae*'
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const text: string = body.message.blocks[0].text.text
    // NOTE: textから回答部分のみを抜き出し。正規表現でバシッとできた方が良いけど。。
    const content = text.replace(':speaking_head_in_silhouette: ', '').replace(/\*/g, '')

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const voteRankText = action.selected_option.value
    const voteRank = convertVoteRank(voteRankText)

    const voteUseCase = new VoteUseCase()
    const slackTeamId = body.team?.id || ''
    const user = body.user.id
    const result = await voteUseCase
      .create({
        slackTeamId,
        content,
        rank: voteRank,
        votedBy: user,
      })
      .catch((error) => {
        if (error.response.data.message === 'Already Voted') {
          logger.warn(error.response.data.message)
          const blocks = createVoteAlreadyBlocks({ content })
          postEphemeral({
            client,
            user,
            blocks,
          })
        } else if (error.response.data.message === 'Already Same Rank Voted') {
          logger.warn(error.response.data.message)
          const blocks = createVoteAlreadySameRankBlocks({ voteRank })
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
    const blocks = createVoteCompleteBlocks({ content, voteRank })
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleError = (error: any) => {
      if (
        error.response.data.message === 'No Active Odai' ||
        error.response.data.message === 'No Voting Odai'
      ) {
        logger.warn(error.response.data.message)
        const blocks = createOdaiNothingBlocks()
        postEphemeral({ client, user: body.user.id, blocks })
      } else {
        logger.error(error.response.config)
        postInternalErrorMessage({ client, user: body.user.id })
      }
      return undefined
    }

    const kotaeUseCase = new KotaeUseCase()
    const kotaeCount = await kotaeUseCase
      .getKotaeCount({ slackTeamId: view.team_id })
      .catch(handleError)
    if (!kotaeCount) return

    const voteUseCase = new VoteUseCase()
    const voteCount = await voteUseCase
      .getVoteCount({ slackTeamId: view.team_id })
      .catch(handleError)
    if (!voteCount) return

    const odaiUseCase = new OdaiUseCase()
    const result = await odaiUseCase
      .finish({
        slackTeamId: view.team_id,
      })
      .then((result) => result)
      .catch(handleError)
    if (!result || !result.odaiTitle || !result.kotaeList.length) return

    const headerBlocks = createVoteResultHeaderBlocks({
      odaiTitle: result.odaiTitle,
      imageUrl: result.odaiImageUrl,
      kotaeCount,
      voteCount,
    })
    const footerBlocks = createVoteResultFooterBlocks()

    const pointRankedList = makePointRanking({ kotaeList: result.kotaeList })
    const votedCountRankedList = makeVotedCountRanking({ kotaeList: result.kotaeList })
    const userInfoMap = await getSlackUserList({
      client,
      userIdList: [...pointRankedList, ...votedCountRankedList].map((ranked) => ranked.createdBy),
    })

    const pointRankingBlocks = createVoteResultContentBlocks({
      rankedList: pointRankedList,
      resultType: 'point',
      userInfoMap,
    })

    // NOTE: 内容量が多すぎるので一旦除外する
    // const voted1stCountRankedList = makeVoted1stCountRanking({ kotaeList: result.kotaeList })
    // const voted1stCountRankingBlocks = createVoteResultContentBlocks({
    //   rankedList: voted1stCountRankedList,
    //   resultType: 'voted1stCount',
    // })

    const votedCountRankingBlocks = createVoteResultContentBlocks({
      rankedList: votedCountRankedList,
      resultType: 'votedCount',
      userInfoMap,
    })

    const blocks = [
      ...headerBlocks,
      ...pointRankingBlocks,
      // ...voted1stCountRankingBlocks,
      ...votedCountRankingBlocks,
      ...footerBlocks,
    ]
    await postMessage({ client, blocks })
  })
}
