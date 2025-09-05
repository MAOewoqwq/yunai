// Simple voice mapping: map specific lines (and optional emotion) to audio files under /public/audio/voice

export function matchVoice(text: string, emotion?: string | null): string | null {
  const emo = (emotion || '').toLowerCase()

  // If emotion is 'change', randomly pick one of the two angry lines
  if (emo === 'change') {
    const angry = [
      '/audio/voice/[yunai]（生气）什么！.mp3',
      '/audio/voice/[yunai]（生气）开什么玩笑.mp3',
    ]
    const idx = Math.floor(Math.random() * angry.length)
    return angry[idx]
  }

  const t = (text || '').trim()
  if (!t) return null

  // Opening lines -> specific voice files
  if (t.includes('有点想吃狐狸乌冬了呢')) {
    return '/audio/voice/[yunai]狐狸乌冬mp3.mp3'
  }
  if (t.includes('需要一些穿搭上的建议吗')) {
    return '/audio/voice/[yunai]如果有穿搭的问题.mp3'
  }
  if (t.includes('有事吗')) {
    return '/audio/voice/[yunai]有事儿吗？.mp3'
  }
  if (t.includes('今天想试试什么感觉')) {
    return '/audio/voice/[yunai]今天是什么心情？.mp3'
  }

  // Relationship/affection positive sentiments -> happy talking voice
  if (
    t.includes('和你关系变好了') ||
    t.includes('关系变好了') ||
    t.includes('喜欢你') ||
    t.includes('喜欢上你') ||
    t.includes('成为朋友') ||
    t.includes('做朋友') ||
    t.includes('我们是朋友') ||
    t.includes('成为了朋友') ||
    t.includes('更亲近')
  ) {
    return '/audio/voice/[yunai]和你说话很开心.mp3'
  }

  // Rule: self-introduction line -> dedicated voice file
  if (t.includes('自我介绍？好吧，我叫東嘉弥真 御奈。如果你有任何时尚方面的问题想问我，随时欢迎')) {
    return '/audio/voice/[yunai]自己紹介mp3.mp3'
  }

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
