import { App } from '@slack/bolt'
import { hasError } from '../../../api/Error'
import {
  postEphemeral,
  postInternalErrorMessage,
  postMessage,
} from '../../postMessage'
import { isImageUrl } from '../../../util/isImageUrl'
import { getSlackUserList } from '../../../util/getSlackUserList'
import { OdaiService } from '../../../odai/OdaiService'
import { KotaeService } from '../../../kotae/KotaeService'
import { VoteService } from '../../../vote/VoteService'
import {
  create,
  CREATE_ODAI_CALLBACK_ID,
  DUE_DATE_ACTION_ID,
  DUE_DATE_BLOCK_ID,
  IMAGE_URL_ACTION_ID,
  IMAGE_URL_BLOCK_ID,
  TITLE_ACTION_ID,
  TITLE_BLOCK_ID,
} from './action/createOdai'
import {
  createIppon as createIpponModal,
  CREATE_ODAI_IPPON_CALLBACK_ID,
  IPPON_VOTE_COUNT_ACTION_ID,
  IPPON_VOTE_COUNT_BLOCK_ID,
  WIN_IPPON_COUNT_ACTION_ID,
  WIN_IPPON_COUNT_BLOCK_ID,
} from './action/createOdaiIppon'
import { start, START_VOTING_CALLBACK_ID } from './action/startVoting'
import { finish, FINISH_ODAI_CALLBACK_ID } from './action/finishOdai'
import { inspireNewOdai } from './action/inspireNewOdai'
import {
  createOdaiCreateBlocks,
  createOdaiDuplicationBlocks,
  createOdaiNothingBlocks,
} from '../../../odai/blocks'
import { createOdaiIpponCreateBlocks } from '../../../odai/blocks/createOdaiIpponCreateBlocks'
import {
  createVoteStartHeaderBlocks,
  createVoteSectionBlocks,
  createVoteStartFooterBlocks,
  createVoteResultHeaderBlocks,
  createVoteResultContentBlocks,
  createVoteResultFooterBlocks,
} from '../../../vote/blocks'
import { createAiCommentaryBlocks } from '../../../vote/blocks/createAiCommentaryBlocks'
import { makePointRanking } from '../../../kotae/rank/makePointRanking'
import { makeVotedCountRanking } from '../../../kotae/rank/makeVotedCountRanking'

export const START_VOTING_ACTION_ID = 'oogiri-start-voting'
export const FINISH_ODAI_ACTION_ID = 'oogiri-finish'

export const registerOdaiHandlers = ({
  app,
  odaiService,
  kotaeService,
  voteService,
}: {
  app: App
  odaiService: OdaiService
  kotaeService: KotaeService
  voteService: VoteService
}) => {
  // NOTE: ショートカット/ボタンからのお題作成モーダルオープン
  app.shortcut('oogiri-create-odai', async ({ ack, body, client, logger }) => {
    await ack()
    await create({ body, client, logger })
  })
  app.shortcut(
    'oogiri-create-odai-ippon',
    async ({ ack, body, client, logger }) => {
      await ack()
      await createIpponModal({ body, client, logger })
    },
  )
  app.action('oogiri-create-odai', async ({ ack, body, client, logger }) => {
    await ack()
    if ('trigger_id' in body) await create({ body, client, logger })
  })
  app.action(
    'oogiri-create-odai-ippon',
    async ({ ack, body, client, logger }) => {
      await ack()
      if ('trigger_id' in body) await createIpponModal({ body, client, logger })
    },
  )

  // NOTE: 通常のお題の作成
  app.view(
    CREATE_ODAI_CALLBACK_ID,
    async ({ ack, view, client, body, logger }) => {
      await ack()
      const title = view.state.values[TITLE_BLOCK_ID][TITLE_ACTION_ID].value
      const dueDate =
        view.state.values[DUE_DATE_BLOCK_ID][DUE_DATE_ACTION_ID].selected_date
      const imageUrl =
        view.state.values[IMAGE_URL_BLOCK_ID][IMAGE_URL_ACTION_ID].value || ''

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
          overrideMessage:
            ':warning: URLは画像の拡張子(.jpg等)で終わるもののみが有効です :warning:',
        })
        return
      }

      const result = await odaiService.create({
        type: 'normal',
        slackTeamId: view.team_id,
        title,
        imageUrl,
        dueDate: new Date(dueDate).getTime(),
        createdBy: body.user.id,
      })
      if (hasError(result)) {
        if (result.message === 'Odai Duplication') {
          logger.warn(result.message)
          const blocks = createOdaiDuplicationBlocks()
          postEphemeral({ client, user: body.user.id, blocks })
        } else {
          logger.error(result.message)
          postInternalErrorMessage({ client, user: body.user.id })
        }
        return
      }

      const blocks = createOdaiCreateBlocks({ title, dueDate, imageUrl })
      await postMessage({ client, blocks })
    },
  )

  // NOTE: IPPON グランプリモードでのお題の作成
  app.view(
    CREATE_ODAI_IPPON_CALLBACK_ID,
    async ({ ack, view, client, body, logger }) => {
      await ack()
      const title = view.state.values[TITLE_BLOCK_ID][TITLE_ACTION_ID].value
      const _ipponVoteCount =
        view.state.values[IPPON_VOTE_COUNT_BLOCK_ID][IPPON_VOTE_COUNT_ACTION_ID]
          .value
      const _winIpponCount =
        view.state.values[WIN_IPPON_COUNT_BLOCK_ID][WIN_IPPON_COUNT_ACTION_ID]
          .value
      const imageUrl =
        view.state.values[IMAGE_URL_BLOCK_ID][IMAGE_URL_ACTION_ID].value || ''

      if (!title || !_ipponVoteCount || !_winIpponCount) {
        logger.error(view.state.values)
        postInternalErrorMessage({ client, user: body.user.id })
        return
      }

      if (imageUrl && !isImageUrl(imageUrl)) {
        logger.error(view.state.values)
        postInternalErrorMessage({
          client,
          user: body.user.id,
          overrideMessage:
            ':warning: URLは画像の拡張子(.jpg等)で終わるもののみが有効です :warning:',
        })
        return
      }

      const ipponVoteCount = Number(_ipponVoteCount)
      const winIpponCount = Number(_winIpponCount)
      const result = await odaiService.create({
        type: 'ippon',
        slackTeamId: view.team_id,
        title,
        ipponVoteCount,
        winIpponCount,
        imageUrl,
        createdBy: body.user.id,
      })
      if (hasError(result)) {
        if (result.message === 'Odai Duplication') {
          logger.warn(result.message)
          const blocks = createOdaiDuplicationBlocks()
          postEphemeral({ client, user: body.user.id, blocks })
        } else {
          logger.error(result.message)
          postInternalErrorMessage({ client, user: body.user.id })
        }
        return
      }

      const blocks = createOdaiIpponCreateBlocks({
        title,
        ipponVoteCount,
        winIpponCount,
        imageUrl,
      })
      await postMessage({ client, blocks })
    },
  )

  // NOTE: 投票開始モーダルオープン
  app.shortcut(
    START_VOTING_ACTION_ID,
    async ({ ack, body, client, logger }) => {
      await ack()
      await start({ body, client, logger })
    },
  )
  app.action(START_VOTING_ACTION_ID, async ({ ack, body, client, logger }) => {
    await ack()
    if ('trigger_id' in body) await start({ body, client, logger })
  })

  // NOTE: 投票開始
  app.view(
    START_VOTING_CALLBACK_ID,
    async ({ ack, view, client, body, logger }) => {
      await ack()
      const slackTeamId = view.team_id

      const kotaeResult = await kotaeService.getAllOfCurrentOdai({
        slackTeamId,
      })
      if (hasError(kotaeResult)) {
        if (
          kotaeResult.message === 'No Active Odai' ||
          kotaeResult.message === 'No Posting Odai'
        ) {
          logger.warn(kotaeResult.message)
          const blocks = createOdaiDuplicationBlocks()
          postEphemeral({ client, user: body.user.id, blocks })
        } else {
          logger.error(kotaeResult.message)
          postInternalErrorMessage({ client, user: body.user.id })
        }
        return
      }

      const putResult = await odaiService.startVoting({ slackTeamId })
      if (hasError(putResult)) {
        if (
          putResult.message === 'No Active Odai' ||
          putResult.message === 'No Posting Odai'
        ) {
          logger.warn(putResult.message)
          const blocks = createOdaiDuplicationBlocks()
          postEphemeral({ client, user: body.user.id, blocks })
        } else {
          logger.error(putResult.message)
          postInternalErrorMessage({ client, user: body.user.id })
        }
        return
      }

      if (!kotaeResult.odaiTitle || !kotaeResult.kotaeList.length) return

      const headerBlocks = createVoteStartHeaderBlocks({
        title: kotaeResult.odaiTitle,
        imageUrl: kotaeResult.odaiImageUrl,
      })
      await postMessage({ client, blocks: headerBlocks })

      await Promise.all(
        kotaeResult.kotaeList.map(async (kotae) => {
          const blocks = createVoteSectionBlocks({
            kotaeContent: kotae.content,
          })
          await postMessage({ client, blocks })
        }),
      )

      const footerBlocks = createVoteStartFooterBlocks()
      await postMessage({ client, blocks: footerBlocks })
    },
  )

  // NOTE: 結果発表モーダルオープン
  app.shortcut(FINISH_ODAI_ACTION_ID, async ({ ack, body, client, logger }) => {
    await ack()
    await finish({ body, client, logger })
  })
  app.action(FINISH_ODAI_ACTION_ID, async ({ ack, body, client, logger }) => {
    await ack()
    if ('trigger_id' in body) await finish({ body, client, logger })
  })

  // NOTE: 結果発表
  app.view(
    FINISH_ODAI_CALLBACK_ID,
    async ({ ack, view, client, body, logger }) => {
      await ack()
      const slackTeamId = view.team_id

      const kotaeResult = await kotaeService.getAllOfCurrentOdai({
        slackTeamId,
      })
      if (hasError(kotaeResult)) {
        if (
          kotaeResult.message === 'No Active Odai' ||
          kotaeResult.message === 'No Voting Odai'
        ) {
          logger.warn(kotaeResult.message)
          const blocks = createOdaiNothingBlocks()
          postEphemeral({ client, user: body.user.id, blocks })
        } else {
          logger.error(kotaeResult.message)
          postInternalErrorMessage({ client, user: body.user.id })
        }
        return
      }

      const voteCountResult = await voteService.getVoteCount({ slackTeamId })
      if (hasError(voteCountResult)) {
        if (
          voteCountResult.message === 'No Active Odai' ||
          voteCountResult.message === 'No Voting Odai'
        ) {
          logger.warn(voteCountResult.message)
          const blocks = createOdaiNothingBlocks()
          postEphemeral({ client, user: body.user.id, blocks })
        } else {
          logger.error(voteCountResult.message)
          postInternalErrorMessage({ client, user: body.user.id })
        }
        return
      }

      const finishResult = await odaiService.finish({
        slackTeamId,
        kotaeList: kotaeResult.kotaeList,
      })
      if (hasError(finishResult)) {
        if (
          finishResult.message === 'No Active Odai' ||
          finishResult.message === 'No Voting Odai'
        ) {
          logger.warn(finishResult.message)
          const blocks = createOdaiNothingBlocks()
          postEphemeral({ client, user: body.user.id, blocks })
        } else {
          logger.error(finishResult.message)
          postInternalErrorMessage({ client, user: body.user.id })
        }
        return
      }

      if (!kotaeResult.odaiTitle || !kotaeResult.kotaeList.length) return

      const kotaeCounts = {
        kotaeCount: kotaeResult.kotaeList.length,
        uniqueUserCount: [
          ...new Set(kotaeResult.kotaeList.map((k) => k.createdBy)),
        ].length,
      }
      const headerBlocks = createVoteResultHeaderBlocks({
        odaiTitle: kotaeResult.odaiTitle,
        imageUrl: kotaeResult.odaiImageUrl,
        kotaeCount: kotaeCounts,
        voteCount: voteCountResult,
      })
      const footerBlocks = createVoteResultFooterBlocks()

      const pointRankedList = makePointRanking({
        kotaeList: kotaeResult.kotaeList,
      })
      const votedCountRankedList = makeVotedCountRanking({
        kotaeList: kotaeResult.kotaeList,
      })
      const userInfoMap = await getSlackUserList({
        client,
        userIdList: [...pointRankedList, ...votedCountRankedList].map(
          (ranked) => ranked.createdBy,
        ),
      })

      const pointRankingBlocks = createVoteResultContentBlocks({
        rankedList: pointRankedList,
        resultType: 'point',
        userInfoMap,
      })
      const votedCountRankingBlocks = createVoteResultContentBlocks({
        rankedList: votedCountRankedList,
        resultType: 'votedCount',
        userInfoMap,
      })
      const aiCommentaryBlocks = createAiCommentaryBlocks(
        finishResult.aiCommentary,
      )

      const blocks = [
        ...headerBlocks,
        ...pointRankingBlocks,
        ...votedCountRankingBlocks,
        ...aiCommentaryBlocks,
        ...footerBlocks,
      ]
      await postMessage({ client, blocks })
    },
  )

  // NOTE: コマンドから新しいお題への呼びかけ
  app.command('/oogiri-inspire-new-odai', async ({ ack, body, client }) => {
    await ack()
    await inspireNewOdai({ slackTeamId: body.team_id, client, odaiService })
  })
}
