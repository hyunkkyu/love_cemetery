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

        // SHA-256 기반 고유 ID 생성 (기존 해시와 호환을 위해 둘 다 확인 가능)
        const hash = crypto.createHash("sha256")
          .update(`${nickname}:${password}`)
          .digest("hex")
        const id = `user_${hash.substring(0, 16)}`

        return { id, name: nickname }
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id
      }
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
