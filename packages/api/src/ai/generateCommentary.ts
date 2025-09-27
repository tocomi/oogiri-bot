import { openai } from './openai'
import { Kotae } from '../kotae/Kotae'
import { CountStat, PointStat, CommentatorCommentary } from '../odai/Odai'

const MODEL = 'gpt-5'

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
}): Promise<CommentatorCommentary> {
  const baseData = `
【お題】
${odaiTitle}

【ポイントランキング上位】
${pointStats.map((s) => `${s.point}P - ${s.kotaeContent}`).join('\n')}

【投票数ランキング上位】
${countStats.map((s) => `${s.votedCount}票 - ${s.kotaeContent}`).join('\n')}

【全回答リスト】
${kotaeList.map((k) => k.content).join('\n')}
`

  // 3人分の講評を並行生成
  const [matsumotoResponse, bakarismResponse, kawashimaResponse] = await Promise.all([
    // 松本人志スタイル
    openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: 'system',
          content:
            'あなたは松本人志として大喜利の講評をします。関西弁で厳しく鋭い指摘をし、ダメなものはダメとはっきり言う辛口講評をしてください。「あかん」「センスない」「全然おもんない」などの表現を使って、歯に衣着せぬコメントをお願いします。',
        },
        {
          role: 'user',
          content: `大喜利の結果について、松本人志らしい厳しく鋭い講評を100文字程度で作成してください。関西弁で、良いものは褒めて、ダメなものは厳しく指摘してください。
          
重要：必ず全回答リストの中から具体的にお気に入りの回答を一つ以上挙げて「○○」の形で引用し、その回答について詳しくコメントしてください。

${baseData}`,
        },
      ],
      max_completion_tokens: 300,
    }),

    // バカリズムスタイル
    openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: 'system',
          content:
            'あなたはバカリズムとして大喜利の講評をします。論理的で冷静な分析を行い、ボケの構造やパターンを技術的に解説してください。「これは○○系のボケですね」「構造的に見ると」などの表現を使った知的な講評をお願いします。',
        },
        {
          role: 'user',
          content: `大喜利の結果について、バカリズムらしい論理的で技術的な講評を100文字程度で作成してください。ボケの構造やパターンを分析的に解説してください。

重要：必ず全回答リストの中から具体的にお気に入りの回答を一つ以上挙げて「○○」の形で引用し、その回答のボケの構造や技術的な面白さについて分析してください。

${baseData}`,
        },
      ],
      max_completion_tokens: 300,
    }),

    // 麒麟川島スタイル
    openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: 'system',
          content:
            'あなたは麒麟川島として大喜利の講評をします。優しく包み込むような温かい講評で、すべての回答の良い面を見つけて褒めてください。「これもいいですねー」「みんな頑張りました」「素晴らしい発想」などの表現を使った励ましの講評をお願いします。',
        },
        {
          role: 'user',
          content: `大喜利の結果について、麒麟川島らしい優しく温かい講評を100文字程度で作成してください。全ての回答の良い面を見つけて、励ましの言葉をかけてください。

重要：必ず全回答リストの中から具体的にお気に入りの回答を一つ以上挙げて「○○」の形で引用し、その回答の良い面や発想の素晴らしさについて優しくコメントしてください。

${baseData}`,
        },
      ],
      max_completion_tokens: 300,
    }),
  ])

  return {
    matsumoto: matsumotoResponse.choices[0].message.content || 'あかん、講評でけへん。',
    bakarism:
      bakarismResponse.choices[0].message.content ||
      '講評の生成に失敗しました。技術的な問題ですね。',
    kawashima:
      kawashimaResponse.choices[0].message.content ||
      'あー、講評が作れませんでした。でも大丈夫です！',
  }
}
