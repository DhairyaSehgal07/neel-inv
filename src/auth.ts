import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/dbConnect';
import UserModel from '@/model/User';
import { signInSchema } from '@/schemas/signInSchema';
import type { JWTCallbackParams, SessionCallbackParams } from '@/types/nextAuth';
import type { User } from 'next-auth';

export const { auth, handlers } = NextAuth({
  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: 'Credentials',
      credentials: {
        mobileNumber: { label: 'Mobile Number', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials): Promise<User | null> {
        try {
          // ✅ Validate input with Zod
          const parsed = signInSchema.safeParse(credentials);
          if (!parsed.success) {
            const errors = parsed.error.flatten().fieldErrors;
            throw new Error(errors.mobileNumber?.[0] || errors.password?.[0] || 'Invalid input');
          }

          const { mobileNumber, password } = parsed.data;

          // 🟡 Manual login check (bypass DB)
          if (mobileNumber === '8437702351' && password === '123456') {
            return {
              _id: 'de7e51c8-6f50-48d3-97c8-b52e364b1b09',
              name: 'Aseem',
              mobileNumber,
              role: 'Admin',
              isActive: true,
            } as User;
          }

          // 🗃️ Commented out DB logic for now
          /*
          await dbConnect();

          // 🔍 1️⃣ Find user by mobile number
          const user = await UserModel.findOne({ mobileNumber });

          if (!user) {
            throw new Error('No user found with this mobile number');
          }

          if (!user.isActive) {
            throw new Error('Your account has been deactivated');
          }

          // 🔑 2️⃣ Verify password
          const isPasswordCorrect = await bcrypt.compare(password, user.password);

          if (!isPasswordCorrect) {
            throw new Error('Incorrect password');
          }

          // ✅ Return user in NextAuth format
          return {
            id: user._id?.toString() || '',
            _id: user._id?.toString(),
            name: user.name,
            mobileNumber: user.mobileNumber,
            role: user.role,
            isActive: user.isActive,
          } as User;
          */

          throw new Error('Invalid credentials');
        } catch (err) {
          const error = err as Error;
          throw new Error(error?.message || 'Authentication failed');
        }
      },
    }),
  ],

  // 🧩 JWT + Session Callbacks
  callbacks: {
    async jwt({ token, user }: JWTCallbackParams) {
      if (user) {
        token._id = user._id?.toString();
        token.mobileNumber = user.mobileNumber;
        token.name = user.name;
        token.role = user.role;
        token.isActive = user.isActive;
      }
      return token;
    },
    async session({ session, token }: SessionCallbackParams) {
      if (token) {
        session.user = {
          _id: token._id,
          mobileNumber: token.mobileNumber,
          name: token.name,
          role: token.role,
          isActive: token.isActive,
        };
      }
      return session;
    },
  },

  session: {
    strategy: 'jwt',
  } as const,

  secret: process.env.NEXTAUTH_SECRET,

  pages: {
    signIn: '/sign-in',
  },
});
