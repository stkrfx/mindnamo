/*
 * File: src/app/api/uploadthing/route.js
 * SR-DEV: UploadThing Route Handler
 * Exposes the GET and POST endpoints required by the UploadThing client.
 */

import { createRouteHandler } from "uploadthing/next";
import { ourFileRouter } from "./core";

// Export routes for Next.js App Router
export const { GET, POST } = createRouteHandler({
  router: ourFileRouter,
  // config: { ... } // Optional: Add config here if needed (e.g. callbackUrl)
});