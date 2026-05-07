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
            // 등록된 유저: bcrypt 검증만 → 실패 시 로그인 거부 (다른 비번 차단)
            const match = await bcrypt.compare(password, user.hashedPassword)
            if (!match) return null
            return { id: user.userId, name: nickname }
          }
        } catch {
          // DB 연결 실패
          return null
        }

        // 미등록 유저 → 로그인 거부 (회원가입 필요)
        return null
      },
    }),
  ],
  pages: { signIn: "/login" },
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
