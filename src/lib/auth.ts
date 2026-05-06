import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import crypto from "crypto"

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        nickname: {},
        password: {},
      },
      async authorize(credentials) {
        const nickname = credentials?.nickname
        const password = credentials?.password

        if (typeof nickname !== "string" || typeof password !== "string") return null
        if (!nickname || !password || password.length < 4) return null

        // User 모델에서 bcrypt 검증 시도
        try {
          const mongoose = (await import("mongoose")).default
          const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/love-cemetery"

          if (mongoose.connection.readyState === 0) {
            await mongoose.connect(MONGODB_URI)
          }

          const { User } = await import("@/lib/db/models")
          const bcrypt = (await import("bcryptjs")).default

          const user = await User.findOne({ nickname })
          if (user) {
            // 등록된 유저: bcrypt 검증
            const match = await bcrypt.compare(password, user.hashedPassword)
            if (!match) return null
            return { id: user.userId, name: nickname }
          }
        } catch {
          // DB 연결 실패 시 폴백
        }

        // 미등록 유저: 기존 해시 방식으로 허용 (하위 호환)
        const hash = crypto.createHash("sha256").update(nickname + ":" + password).digest("hex")
        const id = "user_" + hash.substring(0, 16)
        return { id, name: nickname }
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.userId = user.id
      return token
    },
    async session({ session, token }) {
      if (session.user && token.userId) {
        (session.user as { id?: string }).id = token.userId as string
      }
      return session
    },
  },
  session: { strategy: "jwt" },
  trustHost: true,
  secret: process.env.NEXTAUTH_SECRET,
})
