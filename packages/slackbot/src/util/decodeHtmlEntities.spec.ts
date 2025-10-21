import { decodeHtmlEntities } from './decodeHtmlEntities'

describe('decodeHtmlEntities', () => {
  it('decodes basic html entities', () => {
    expect(decodeHtmlEntities('欽ちゃん&amp;香取慎吾に全員採点される')).toBe('欽ちゃん&香取慎吾に全員採点される')
  })

  it('decodes multiple entities in one string', () => {
    expect(decodeHtmlEntities('&lt;Test&gt; &amp; &quot;Quote&quot; &#39;Single&#39;')).toBe("<Test> & \"Quote\" 'Single'")
  })

  it('returns original string when no entities present', () => {
    expect(decodeHtmlEntities('そのまま')).toBe('そのまま')
  })
})
