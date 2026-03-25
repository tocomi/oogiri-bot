import { App } from '@slack/bolt'
import { OdaiService } from '../../odai/OdaiService'
import { KotaeService } from '../../kotae/KotaeService'
import { VoteService } from '../../vote/VoteService'
import { registerOdaiHandlers } from './odai/OdaiHandler'
import { registerKotaeHandlers } from './kotae/KotaeHandler'
import { registerVoteHandlers } from './vote/VoteHandler'

export const registerHandlers = ({
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
  registerOdaiHandlers({ app, odaiService, kotaeService, voteService })
  registerKotaeHandlers({ app, kotaeService, odaiService })
  registerVoteHandlers({ app, voteService })
}
