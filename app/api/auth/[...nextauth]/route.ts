import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import type { NextRequest } from "next/server";

const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async signIn() {
      return true;
    },
    async jwt({ token }: { token: any }) {
      return token;
    },
    async session({ session }: { session: any }) {
      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export async function GET(req: NextRequest, context: any) {
  return handler(req, context);
}

export async function POST(req: NextRequest, context: any) {
  return handler(req, context);
}
