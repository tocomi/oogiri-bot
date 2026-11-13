import { describe, expect, it, vi } from 'vitest'

import { registerKotaeHandlers } from '../KotaeHandler'
import {
  KOTAE_CREATE_ACTION_ID,
  KOTAE_CREATE_BLOCK_ID,
  KOTAE_CREATE_CALLBACK_ID,
} from '../view/KotaeCreateView'

describe('回答モーダルの入力検証', () => {
  it.each([null, '回答😀'])(
    '入力 %s は即時に 1 回だけ ack する',
    async (value) => {
      const app = {
        shortcut: vi.fn(),
        action: vi.fn(),
        view: vi.fn(),
        command: vi.fn(),
      }
      const create = vi.fn()
      registerKotaeHandlers({
        app: app as unknown as Parameters<
          typeof registerKotaeHandlers
        >[0]['app'],
        kotaeService: { create } as unknown as Parameters<
          typeof registerKotaeHandlers
        >[0]['kotaeService'],
      })
      const [callbackId, handler] = app.view.mock.calls[0]
      expect(callbackId).toBe(KOTAE_CREATE_CALLBACK_ID)
      const ack = vi.fn(async () => {})
      const client = { chat: { postEphemeral: vi.fn() } }

      await handler({
        ack,
        view: {
          state: {
            values: {
              [KOTAE_CREATE_BLOCK_ID]: {
                [KOTAE_CREATE_ACTION_ID]: { value },
              },
            },
          },
        },
        client,
        body: { user: { id: 'user' } },
        logger: { info: vi.fn() },
      })

      expect(ack).toHaveBeenCalledTimes(1)
      if (value) {
        expect(ack).toHaveBeenCalledWith({
          response_action: 'errors',
          errors: {
            [KOTAE_CREATE_BLOCK_ID]:
              'まだ絵文字は未対応なのです、ごめんなさい。',
          },
        })
      } else {
        expect(ack).toHaveBeenCalledWith()
      }
      expect(create).not.toHaveBeenCalled()
      expect(client.chat.postEphemeral).not.toHaveBeenCalled()
    },
  )
})
