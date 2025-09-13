import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        try {
          const auth = await prisma.authentication.findUnique({
            where: { email: credentials.email },
            include: { user: true },
          });
          if (!auth) return null;

          // TODO: заменишь на хэш-проверку
          if (auth.password !== credentials.password) return null;

          return {
            id: auth.user.id,
            email: auth.email,
            name: auth.user.name,
            role: auth.user.type.toLowerCase(), // "landlord" | "tenant"
          };
        } catch (error) {
          console.error("Authentication error:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // при логине
      if (user) {
        token.id = (user as any).id;
        token.role = (user as any).role; // "landlord" | "tenant"
      }
      // на последующих запросах — держим id и роль
      token.id = (token as any).id ?? token.sub ?? null;
      token.role =
        (token as any).role ?? (token as any).user?.role ?? undefined;
      return token;
    },
    async session({ session, token }) {
      const id = (token as any).id ?? token.sub ?? null;
      const role = (token as any).role ?? null;

      if (session.user) {
        (session.user as any).id = id;
        (session.user as any).role = role;
      }
      (session as any).role = role;

      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
});

export { handler as GET, handler as POST };
