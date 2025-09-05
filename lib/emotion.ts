// Very simple, keyword-driven emotion inference for zh text
// Returns one of: 'happy' | 'angry' | 'sad' | 'shy' | 'neutral'
export type Emotion = 'happy' | 'angry' | 'sad' | 'shy' | 'neutral'

const dict: Array<{ keys: RegExp; emo: Emotion }> = [
  { keys: /(开心|高兴|喜欢|爱你|太棒|好耶|耶|帅|可爱|喜欢你)/i, emo: 'happy' },
  { keys: /(生气|愤怒|气死|怒|讨厌|别走|滚|闭嘴)/i, emo: 'angry' },
  { keys: /(难过|伤心|委屈|悲伤|流泪|哭)/i, emo: 'sad' },
  { keys: /(害羞|羞|脸红|尴尬|不要看|嗯…)/i, emo: 'shy' },
]

export function inferEmotion(text: string, affection: number): Emotion {
  const t = (text || '').trim()
  if (!t) {
    if (affection >= 70) return 'happy'
    if (affection <= 20) return 'angry'
    return 'neutral'
  }
  for (const rule of dict) {
    if (rule.keys.test(t)) return rule.emo
  }
  // 当文本非空且未命中关键词时：
  // - 默认返回 neutral，避免因低好感度导致误判为 angry
  // - 仅在极高好感度时轻微偏向 happy
  if (affection >= 90) return 'happy'
  return 'neutral'
}
