import { App, KnownBlock } from '@slack/bolt'
import { VoteUseCase } from './VoteUseCase'
import { createIppon, createWin } from '../ippon/IpponAction'
import { VOTE_KOTAE_IPPON_ACTION_ID } from '../kotae/blocks/kotaeIpponCreatedBlocks'
import { postEphemeral, postInternalErrorMessage } from '../slack/postMessage'
import { getSlackUserList } from '../util/getSlackUserList'
import { decodeHtmlEntities } from '../util/decodeHtmlEntities'
import { countVote } from './action/countVote'
import { createVoteAlreadyBlocks, createVoteCompleteBlocks } from './blocks'

export const countVoteAction = (app: App) => {
  app.command('/oogiri-count-kusa', async ({ ack, body, client }) => {
    await ack()
    await countVote({ slackTeamId: body.team_id, userId: body.user_id, client })
  })
}

export const checkVoteResult = (app: App) => {
  app.command('/oogiri-check-my-fans', async ({ ack, body, client, logger }) => {
    await ack()
    const voteUseCase = new VoteUseCase()
    const result = await voteUseCase
      .getVoteResult({
        slackTeamId: body.team_id,
        userId: body.user_id,
      })
      .catch((error) => {
        logger.error(error.response.config)
        postInternalErrorMessage({ client, user: body.user.id })
        return undefined
      })
    if (!result) return

    // NOTE: 対象はそれぞれ 5 件まで
    const _recent5timesCount = result.recent5timesCount.slice(0, 5)
    const _allCount = result.allCount.slice(0, 5)

    const userInfoMap = await getSlackUserList({
      client,
      userIdList: [..._recent5timesCount, ..._allCount].map((count) => count.votedBy),
    })

    const headerBlocks: KnownBlock[] = [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `:smiling_face_with_3_hearts: :smiling_face_with_3_hearts: :smiling_face_with_3_hearts: *あなたの回答に投票した人 TOP5* :smiling_face_with_3_hearts: :smiling_face_with_3_hearts: :smiling_face_with_3_hearts:`,
        },
      },
    ]
    const resultBlocks: KnownBlock[] = []

    // 直近 5 戦
    resultBlocks.push(
      {
        type: 'divider',
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `:timer_clock: *直近 5 戦*`,
        },
      }
    )
    if (!_recent5timesCount.length) {
      resultBlocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `結果がありません :smiling_face_with_tear`,
        },
      })
    } else {
      for (const count of _recent5timesCount) {
        const user = userInfoMap[count.votedBy]

        // NOTE: ワークスペースにいない人はスキップ
        if (!user) continue

        resultBlocks.push({
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `*${count.voteCount}票*`,
            },
            {
              type: 'image',
              image_url: user.profile?.image_32 || '',
              alt_text: 'user_image',
            },
            {
              type: 'mrkdwn',
              text: `*${user.profile?.display_name}*`,
            },
          ],
        })
      }
    }

    // 累積
    resultBlocks.push(
      {
        type: 'divider',
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `:chart_with_upwards_trend: *累計*`,
        },
      }
    )
    if (!_allCount.length) {
      resultBlocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `結果がありません :smiling_face_with_tear`,
        },
      })
    } else {
      for (const count of _allCount) {
        const user = userInfoMap[count.votedBy]

        // NOTE: ワークスペースにいない人はスキップ
        if (!user) continue

        resultBlocks.push({
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `*${count.voteCount}票*`,
            },
            {
              type: 'image',
              image_url: user.profile?.image_32 || '',
              alt_text: 'user_image',
            },
            {
              type: 'mrkdwn',
              text: `*${user.profile?.display_name}*`,
            },
          ],
        })
      }
    }

    const blocks = [...headerBlocks, ...resultBlocks]
    await postEphemeral({ client, user: body.user_id, blocks })
  })
}

export const voteKotaeIppon = (app: App) => {
  app.action(VOTE_KOTAE_IPPON_ACTION_ID, async ({ ack, body, client, logger }) => {
    await ack()
    // NOTE: 投票ボタンが押された回答のテキストを抽出
    // 何故か型が無いので仕方なくts-ignoreを使用
    // text -> ':speaking_head_in_silhouette: *kotae*'
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const text: string = body.message.blocks[0].text.text
    // NOTE: textから回答部分のみを抜き出し。正規表現でバシッとできた方が良いけど。。
    const content = decodeHtmlEntities(text.replace(/.*\n/, '').replace(/\*/g, ''))

    // TODO: ランクはないが暫定的に3を入れておく
    const voteRank = 3

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
        } else {
          logger.error(error.response.config)
          postInternalErrorMessage({ client, user })
        }
        return undefined
      })
    if (!result) return
    const blocks = createVoteCompleteBlocks({ content, voteRank })
    await postEphemeral({ client, user, blocks })

    // NOTE: IPPON の場合の通知
    if (result.ippon) {
      createIppon({ client, userId: result.ippon.userId, kotaeContent: content })
    }

    // NOTE: 勝負が決まってない場合は継続
    if (!result.winResult) return

    // NOTE: 勝負が決まった場合は結果を通知
    const {
      odaiTitle,
      odaiImageUrl,
      kotaeCount,
      kotaeUserCount,
      voteCount,
      voteUserCount,
      ipponResult: ipponCountList,
    } = result.winResult
    const userInfoMap = await getSlackUserList({
      client,
      userIdList: ipponCountList.map((ippon) => ippon.userId),
    })
    createWin({
      client,
      odaiTitle,
      odaiImageUrl,
      kotaeCounts: { kotaeCount, uniqueUserCount: kotaeUserCount },
      voteCounts: { voteCount, uniqueUserCount: voteUserCount },
      ipponCountList,
      userInfoMap,
    })
  })
}
