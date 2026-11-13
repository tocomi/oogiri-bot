import { afterEach, describe, expect, it, vi } from 'vitest'

import { ackAfterProcessing } from '../ackAfterProcessing'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('ackAfterProcessing', () => {
  it('非同期処理が終わってから 1 回だけ ack し、所要時間を記録する', async () => {
    const events: string[] = []
    const log = vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(Date, 'now').mockReturnValueOnce(100).mockReturnValueOnce(350)
    const ack = vi.fn(async () => {
      events.push('ack')
    })

    await ackAfterProcessing('/test', ack, async () => {
      events.push('start')
      await Promise.resolve()
      expect(ack).not.toHaveBeenCalled()
      events.push('end')
    })

    expect(events).toEqual(['start', 'end', 'ack'])
    expect(ack).toHaveBeenCalledTimes(1)
    expect(log).toHaveBeenCalledWith('[timing] /test acked after 250ms')
  })

  it('処理が例外になっても ack の完了後に同じ例外を投げ直す', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => {})
    const error = new Error('processing failed')
    const events: string[] = []
    const ack = vi.fn(async () => {
      await Promise.resolve()
      events.push('ack')
    })

    await expect(
      ackAfterProcessing('/test', ack, async () => {
        throw error
      }).catch((caught) => {
        events.push('rethrow')
        throw caught
      }),
    ).rejects.toBe(error)

    expect(ack).toHaveBeenCalledTimes(1)
    expect(events).toEqual(['ack', 'rethrow'])
  })

  it('処理が早期 return しても ack する', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => {})
    const ack = vi.fn(async () => {})

    await ackAfterProcessing('/test', ack, async () => {
      return
    })

    expect(ack).toHaveBeenCalledTimes(1)
  })

  it('ack が失敗した場合は再試行せず例外を伝える', async () => {
    const error = new Error('ack failed')
    const ack = vi.fn().mockRejectedValue(error)

    await expect(ackAfterProcessing('/test', ack, async () => {})).rejects.toBe(
      error,
    )

    expect(ack).toHaveBeenCalledTimes(1)
  })
})
