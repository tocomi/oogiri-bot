import { decodeHtmlEntities } from './decodeHtmlEntities'

describe('decodeHtmlEntities', () => {
  it('正しくデコードされる', () => {
    expect(decodeHtmlEntities('欽ちゃん&amp;香取慎吾に全員採点される')).toBe(
      '欽ちゃん&香取慎吾に全員採点される'
    )
  })

  it('複数のエンティティが正しくデコードされる', () => {
    expect(decodeHtmlEntities('&lt;Test&gt; &amp; &quot;Quote&quot; &#39;Single&#39;')).toBe(
      '<Test> & "Quote" \'Single\''
    )
  })

  it('エンティティがない場合はそのまま返す', () => {
    expect(decodeHtmlEntities('欽ちゃん香取慎吾に全員採点される')).toBe(
      '欽ちゃん香取慎吾に全員採点される'
    )
  })
})
