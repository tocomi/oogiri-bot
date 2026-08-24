import { describe, expect, test, vi } from 'vitest'
import { render } from 'vitest-browser-react'

import { AdminUserAnonymityToggle } from '../AdminUserAnonymityToggle'

const push = vi.fn()

vi.mock('next/navigation', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next/navigation')>()),
  useRouter: () => ({ push }),
}))

describe('AdminUserAnonymityToggle', () => {
  test('オフから匿名モードを有効にする', async () => {
    push.mockClear()
    const screen = await render(
      <AdminUserAnonymityToggle anonymous={false} period="2026" sort="kotae" />,
    )

    await expect
      .element(screen.getByRole('button', { name: '匿名モード: オフ' }))
      .toHaveAttribute('aria-pressed', 'false')

    await screen.getByRole('button', { name: '匿名モード: オフ' }).click()

    expect(push).toHaveBeenCalledWith(
      '/users?period=2026&sort=kotae&anonymous=1',
    )
  })

  test('オンから匿名モードを解除する', async () => {
    push.mockClear()
    const screen = await render(
      <AdminUserAnonymityToggle anonymous period="all" sort="vote" />,
    )

    await expect
      .element(screen.getByRole('button', { name: '匿名モード: オン' }))
      .toHaveAttribute('aria-pressed', 'true')

    await screen.getByRole('button', { name: '匿名モード: オン' }).click()

    expect(push).toHaveBeenCalledWith('/users?period=all&sort=vote')
  })
})
