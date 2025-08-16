declare global {
  namespace NodeJS {
    interface ProcessEnv {
      MONGO_URI: string
      PORT: string
      EXPOSURE_API_URL: string
      EXPOSURE_API_KEY: string
    }
  }
}

export {}
