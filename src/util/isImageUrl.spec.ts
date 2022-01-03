import { isImageUrl } from './isImageUrl'

describe('画像URLのチェック', () => {
  test('画像の拡張子で終わるURLのみ有効', () => {
    expect(isImageUrl('http://hoge.jpg')).toBeTruthy()
    expect(isImageUrl('https://hoge.jpg')).toBeTruthy()
    expect(isImageUrl('http://hoge.png')).toBeTruthy()
    expect(isImageUrl('https://hoge.png')).toBeTruthy()

    expect(isImageUrl('https://hoge')).toBeFalsy()
    expect(isImageUrl('https://hoge.pdf')).toBeFalsy()
    expect(isImageUrl('https://.jpg')).toBeFalsy()
  })
})
