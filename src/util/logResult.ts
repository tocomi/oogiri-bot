export const logResult = <T>(label: string, result: T): T => {
  console.log(`[service] ${label}: ${JSON.stringify(result)}`)
  return result
}
