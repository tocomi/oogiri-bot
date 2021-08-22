import { App, KnownBlock } from '@slack/bolt'
import { postEphemeral, postInternalErrorMessage, postMessage } from '../message/postMessage'
import { VoteUseCase } from './VoteUseCase'

export const countVote = (app: App) => {
  app.command('/oogiri-count-kusa', async ({ ack, body, client, logger }) => {
    await ack()
    const voteUseCase = new VoteUseCase()
    const result = await voteUseCase.getVoteCount({ slackTeamId: body.team_id }).catch((error) => {
      if (error.response.data.message === 'No Active Odai') {
        logger.warn(error.response.data.message)
        const blocks: KnownBlock[] = [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: ':warning: お題が開始されていません :warning:',
            },
          },
        ]
        postEphemeral({ client, user: body.user_id, blocks })
      } else if (
        error.response.data.message === 'No Voting Odai' ||
        error.response.data.message === 'No Target Kotae'
      ) {
        logger.warn(error.response.data.message)
        const blocks: KnownBlock[] = [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: ':warning: この投票は締め切られています :warning:',
            },
          },
        ]
        postEphemeral({ client, user: body.user_id, blocks })
      } else {
        logger.error(error.response.config)
        postInternalErrorMessage({ client, user: body.user_id })
      }
      return undefined
    })
    if (!result) return
    const blocks: KnownBlock[] = [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: ':mega: *現在の投票状況* :mega:',
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `:speech_balloon: お題: ${result.odaiTitle}`,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `:male_genie: *参加者: ${result.uniqueUserCount}人* :point_up: *投票数: ${result.voteCount}*`,
        },
      },
    ]
    await postMessage({ client, blocks })
  })
}
