const regex = new RegExp('^https?://.+.(jpg|jpeg|png|gif)$')

export const isImageUrl = (url: string) => {
  return regex.test(url)
}
