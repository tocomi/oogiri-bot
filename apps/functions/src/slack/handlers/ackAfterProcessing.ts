export const ackAfterProcessing = async (
  handlerName: string,
  ack: () => Promise<void>,
  process: () => Promise<void>,
): Promise<void> => {
  // NOTE: Cloud Run は HTTP レスポンス後に CPU が制限されるため、DB・Slack API の処理を終えてから ack する
  // Slack の 3 秒制限に収まるか確認できるよう、ack までの所要時間を記録する
  const startedAt = Date.now()
  try {
    await process()
  } finally {
    await ack()
    console.log(
      `[timing] ${handlerName} acked after ${Date.now() - startedAt}ms`,
    )
  }
}
