import { createUploadthing } from "uploadthing/next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const f = createUploadthing();

/**
 * Shared Auth Middleware
 * Verifies the user is logged in via NextAuth before allowing upload.
 */
const handleAuth = async () => {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    throw new Error("Unauthorized");
  }
  return { userId: session.user.id };
};

export const ourFileRouter = {
  // 1. Chat Attachments (Images, Audio, PDF)
  chatAttachment: f({
    image: { maxFileSize: "8MB", maxFileCount: 1 },
    audio: { maxFileSize: "16MB", maxFileCount: 1 }, // Larger for voice notes
    pdf: { maxFileSize: "16MB", maxFileCount: 1 },
  })
    .middleware(async () => await handleAuth())
    .onUploadComplete(async ({ metadata, file }) => {
      console.log(`[UploadThing] Chat file uploaded by ${metadata.userId}: ${file.url}`);
      return { uploadedBy: metadata.userId, url: file.url };
    }),

  // 2. User Profile Picture (Strictly Images)
  profilePicture: f({
    image: { maxFileSize: "4MB", maxFileCount: 1 },
  })
    .middleware(async () => await handleAuth())
    .onUploadComplete(async ({ metadata, file }) => {
      console.log(`[UploadThing] Profile pic uploaded by ${metadata.userId}: ${file.url}`);
      return { uploadedBy: metadata.userId, url: file.url };
    }),
};