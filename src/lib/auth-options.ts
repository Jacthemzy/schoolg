import type { NextAuthOptions, Session, User as NextAuthUser } from "next-auth";
import type { JWT } from "next-auth/jwt";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import { connectMongoose } from "@/lib/mongoose";
import { User, type UserRole } from "@/models/User";

type StudentUser = {
  id: string;
  name: string;
  role: "student";
  dmsNumber?: string;
  className?: string;
};

type AdminUser = {
  id: string;
  name: string;
  role: "admin";
  email?: string;
};

type AppUser = (NextAuthUser & StudentUser) | (NextAuthUser & AdminUser);

type AppJWT = JWT & {
  role?: UserRole;
  dmsNumber?: string;
  className?: string;
  id?: string;
};

type AppSession = Session & {
  user?: {
    id?: string;
    name?: string | null;
    email?: string | null;
    role?: UserRole;
    dmsNumber?: string;
    className?: string;
  };
};

export const authOptions: NextAuthOptions = {
  pages: {
    signIn: "/",
  },
  providers: [
    Credentials({
      id: "student-credentials",
      name: "Student Login",
      credentials: {
        dmsNumber: { label: "DMS Number", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials): Promise<AppUser | null> {
        try {
          if (!credentials?.dmsNumber || !credentials?.password) return null;

          await connectMongoose();
          const user = await User.findOne({
            dmsNumber: credentials.dmsNumber,
            role: "student",
          });
          if (!user) return null;

          const ok = await bcrypt.compare(credentials.password, user.password);
          if (!ok) return null;

          const appUser: AppUser = {
            id: String(user._id),
            name: user.fullName,
            role: user.role,
            dmsNumber: user.dmsNumber,
            className: user.className,
          };

          return appUser;
        } catch (error) {
          console.error("Student login failed:", error);
          return null;
        }
      },
    }),
    Credentials({
      id: "admin-credentials",
      name: "Admin Login",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials): Promise<AppUser | null> {
        try {
          if (!credentials?.email || !credentials?.password) return null;
          const email = credentials.email.toLowerCase().trim();

          await connectMongoose();
          const user = await User.findOne({
            email,
            role: "admin",
          });
          if (!user) return null;

          const ok = await bcrypt.compare(credentials.password, user.password);
          if (!ok) return null;

          const appUser: AppUser = {
            id: String(user._id),
            name: user.fullName,
            role: user.role,
            email: user.email,
          };

          return appUser;
        } catch (error) {
          console.error("Admin login failed:", error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }): Promise<AppJWT> {
      const typedToken = token as AppJWT;
      if (user) {
        const u = user as AppUser;
        typedToken.role = u.role;
        typedToken.dmsNumber = "dmsNumber" in u ? u.dmsNumber : undefined;
        typedToken.className = "className" in u ? u.className : undefined;
        typedToken.id = u.id;
      }
      return typedToken;
    },
    async session({ session, token }): Promise<AppSession> {
      const typedSession = session as AppSession;
      const t = token as AppJWT;
      if (typedSession.user) {
        typedSession.user.role = t.role;
        typedSession.user.dmsNumber = t.dmsNumber;
        typedSession.user.className = t.className;
        typedSession.user.id = t.id || t.sub;
      }
      return typedSession;
    },
  },
};

