import type { CapacitorConfig } from "@capacitor/cli"

const config: CapacitorConfig = {
  appId: "com.lovecemetery.app",
  appName: "명예의전당",
  webDir: "out",
  server: {
    // 개발 시 로컬 서버 사용 (프로덕션에서는 제거)
    // url: "http://localhost:3000",
    // 프로덕션: Vercel URL 사용
    url: "https://love-cemetery.vercel.app",
    cleartext: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#0c0c14",
      showSpinner: false,
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#0c0c14",
    },
  },
  ios: {
    scheme: "명예의전당",
  },
  android: {
    allowMixedContent: true,
  },
}

export default config
