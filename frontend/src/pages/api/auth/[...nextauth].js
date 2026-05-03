import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "mock-client-id",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "mock-client-secret",
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      console.log("SignIn callback triggered for:", user?.email);
      return true; 
    },
    async session({ session, token }) {
      session.user.id = token.sub;
      return session;
    }
  },
  debug: true,
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET || "super-secret-development-key",
}

export default NextAuth(authOptions)
