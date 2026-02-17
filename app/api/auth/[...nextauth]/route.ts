import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      // Removed sensitive scopes - only using basic profile
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      // Allow all Google sign-ins
      return true;
    },
    async jwt({ token, account, profile }) {
      // Removed Google People API call for phone/DOB
      return token;
    },
    async session({ session, token }) {
      // Removed phone number and date of birth from session
      return session;
    },
  },
});

export { handler as GET, handler as POST };
