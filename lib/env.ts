export const env = {
  DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY ?? '',
  DEEPSEEK_BASE_URL: process.env.DEEPSEEK_BASE_URL ?? '',
  DEEPSEEK_MODEL: process.env.DEEPSEEK_MODEL ?? 'deepseek-chat',
  FREECHAT_DEFAULT: process.env.FREECHAT_DEFAULT ?? 'true',
  EMOTION_MODE: process.env.EMOTION_MODE ?? 'keyword',
  UPLOAD_DIR: process.env.UPLOAD_DIR ?? './public/uploads',
}

export function isDev() {
  return process.env.NODE_ENV !== 'production'
}

