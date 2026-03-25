import { App } from '@slack/bolt'
import { registerKotaeHandlers } from './kotae/KotaeHandler'
import { registerOdaiHandlers } from './odai/OdaiHandler'
import { registerVoteHandlers } from './vote/VoteHandler'
import { KotaeService } from '../../kotae/KotaeService'
import { OdaiService } from '../../odai/OdaiService'
import { VoteService } from '../../vote/VoteService'

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
