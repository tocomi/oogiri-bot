import { openai } from './openai'
import { Kotae } from '../kotae/Kotae'
import { CountStat, PointStat } from '../odai/Odai'

export async function generateCommentary({
  odaiTitle,
  kotaeList,
  pointStats,
  countStats,
}: {
  odaiTitle: string
  kotaeList: Kotae[]
  pointStats: PointStat[]
  countStats: CountStat[]
}): Promise<string> {
  const prompt = `
大喜利の結果について、面白く、ユーモアのある講評を作成してください。

講評は以下の点を含めてください：
1. 上位回答の特徴や傾向
2. 特に面白かった回答へのコメント（ランキング外の回答も含む）
3. お題に対する回答の全体的な傾向
4. 次回への期待

講評は3〜4段落程度で、フレンドリーかつユーモアのある口調で作成してください。

【お題】
${odaiTitle}

【ポイントランキング上位】
${pointStats.map((s) => `${s.point}P - ${s.kotaeContent}`).join('\n')}

【投票数ランキング上位】
${countStats.map((s) => `${s.votedCount}票 - ${s.kotaeContent}`).join('\n')}

【全回答リスト】
${kotaeList.map((k) => k.content).join('\n')}
`

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content:
          'あなたは大喜利の結果を講評する専門家です。ユーモアがあり、的確な講評を提供します。',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.7,
    max_tokens: 2048,
  })

  return response.choices[0].message.content || '講評を生成できませんでした。'
}
