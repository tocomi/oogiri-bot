export const getActionLabel = (body: Record<string, unknown>): string => {
  const type = (body.type as string) ?? 'unknown'
  if (type === 'block_actions') {
    const actions = body.actions as Array<{ action_id: string }> | undefined
    const actionIds = actions?.map((a) => a.action_id).join(', ') ?? ''
    return `${type} [${actionIds}]`
  }
  if (type === 'shortcut' || type === 'message_action') {
    return `${type} [${body.callback_id as string}]`
  }
  if (type === 'view_submission' || type === 'view_closed') {
    const view = body.view as { callback_id: string } | undefined
    return `${type} [${view?.callback_id}]`
  }
  if (body.command) {
    return `slash_command [${body.command as string}]`
  }
  return type
}
