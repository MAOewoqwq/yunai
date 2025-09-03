// Simple voice mapping: map specific lines (and optional emotion) to audio files under /public/audio/voice

export function matchVoice(text: string, emotion?: string | null): string | null {
  const t = (text || '').trim()
  if (!t) return null

  const emo = (emotion || '').toLowerCase()

  // Rule: flowers line -> voice file
  // Use includes to be tolerant of trailing punctuation differences
  if (t.includes('呀，这花好香……谢谢你，我会好好珍惜的')) {
    return '/audio/voice/voice_flower_like.mp3'
  }

  // Rule: another gift line mapping to existing public file
  if (t.includes('是为我挑的吗？那我就笑一下，嗯。')) {
    return '/audio/voice/[yunai]为我选的花.mp3'
  }

  // Rule: gift line "今天的心情，果然更好了。" -> mapped voice
  if (t.includes('今天的心情，果然更好了')) {
    return '/audio/voice/[yunai]感觉今天会很开心.mp3'
  }

  // Rule: gift line for hot udon invitation
  if (t.includes('看起来热腾腾的……要一起吃吗？')) {
    return '/audio/voice/[yunai]热呼呼的狐狸乌冬.mp3'
  }

  // Rule: hot warning and sharing bite
  if (t.includes('小心烫，你先吹一吹……我也尝一口。')) {
    return '/audio/voice/[yunai]热呼呼的狐狸乌冬.mp3'
  }

  // Rule: gift line praising taste
  if (t.includes('你知道我喜欢这个口味？还挺会的嘛。')) {
    return '/audio/voice/[yunai]你知道我喜欢这个味道！mp3.mp3'
  }

  // Rule: cake sweet mood line
  if (t.includes('甜甜的……像现在的心情一样')) {
    return '/audio/voice/[yunai]好甜.mp3'
  }

  // Rule: cake accept line
  if (t.includes('不是节日也可以收蛋糕吗？那我就不客气了。')) {
    // Actual file on disk has an exclamation mark
    return '/audio/voice/[yunai]蛋糕蛋糕！.mp3'
  }

  // Rule: share half of cake
  if (t.includes('谢谢，我会分一半给你……一小半')) {
    return '/audio/voice/[yunai]分你一半蛋糕吧.mp3'
  }

  // Rule: ginger dislike apology
  if (t.includes('抱歉...我不太习惯这个味道')) {
    return '/audio/voice/[yunai]不习惯生姜的味道.mp3'
  }

  // Rule: ginger "苦手" line
  if (t.includes('谢谢你的礼物，但是泡姜我有点苦手')) {
    return '/audio/voice/[yunai]泡姜苦手.mp3'
  }

  return null
}
