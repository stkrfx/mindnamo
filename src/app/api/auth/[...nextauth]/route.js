import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { connectToDatabase } from "@/lib/db";
import User from "@/models/User";

/**
 * Helper to find user and run common validation checks (existence, ban status).
 */
async function findAndValidateUser(email, extraFields = "") {
  await connectToDatabase();
  // Select +isBanned explicitly as it might be excluded by default or needed for logic
  const user = await User.findOne({ email }).select(`+isBanned ${extraFields}`);

  if (!user) throw new Error("User not found.");

  if (user.isBanned) {
    throw new Error("Your account has been suspended. Contact support.");
  }

  return user;
}

export const authOptions = {
  providers: [
    // 1. Google OAuth
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    
    // 2. Standard Password Login
    CredentialsProvider({
      id: "credentials",
      name: "Credentials",
      credentials: { email: {}, password: {} },
      async authorize(credentials) {
        const user = await findAndValidateUser(credentials.email, "+password");
        
        if (user.authProvider === "google") {
          throw new Error("Please sign in with Google.");
        }
        
        const isValid = await user.comparePassword(credentials.password);
        if (!isValid) throw new Error("Invalid password.");
        
        if (!user.isVerified) {
          throw new Error("Email not verified.");
        }
        
        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          image: user.profilePicture,
        };
      },
    }),

    // 3. OTP Login (Used for verifying registration & passwordless entry)
    CredentialsProvider({
      id: "otp-credentials",
      name: "OTP Login",
      credentials: { email: {}, otp: {} },
      async authorize(credentials) {
        const user = await findAndValidateUser(
          credentials.email,
          "+otp +otpExpiry"
        );

        if (!user.otp || user.otp !== credentials.otp) {
          throw new Error("Invalid or expired OTP.");
        }

        if (user.otpExpiry < new Date()) {
          throw new Error("OTP has expired.");
        }

        // OTP Valid: Clear it and verify user
        user.otp = undefined;
        user.otpExpiry = undefined;
        if (!user.isVerified) user.isVerified = true;
        await user.save();

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          image: user.profilePicture,
        };
      },
    }),
  ],

  callbacks: {
    async signIn({ user, account }) {
      // Handle Google Sign-in logic (Upsert User)
      if (account.provider === "google") {
        await connectToDatabase();

        let existingUser = await User.findOne({ email: user.email });

        if (!existingUser) {
          // Create new user from Google profile
          existingUser = await User.create({
            name: user.name,
            email: user.email,
            profilePicture: user.image,
            authProvider: "google",
            isVerified: true, // Google emails are verified by definition
          });
        } else {
          // Update profile pic if missing
          if (!existingUser.profilePicture) {
            existingUser.profilePicture = user.image;
            await existingUser.save();
          }
        }

        if (existingUser.isBanned) return false; // Block banned users

        // Attach DB ID to the user object for the JWT callback
        user.id = existingUser._id.toString();
      }
      return true;
    },

    async jwt({ token, user, trigger, session }) {
      // Initial sign in
      if (user) {
        token.id = user.id;
        token.picture = user.image;
      }
      
      // Allow client-side session updates (e.g., changing profile pic)
      if (trigger === "update" && session) {
        token.name = session.name || token.name;
        token.picture = session.image || token.picture;
      }
      return token;
    },

    async session({ session, token }) {
      // Expose the User ID to the client
      if (session.user) {
        session.user.id = token.id;
        session.user.image = token.picture;
      }
      return session;
    },
  },

  pages: { 
    signIn: "/login", 
    error: "/login" // Redirect errors back to login page
  },
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };