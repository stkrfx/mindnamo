import { connectToDatabase } from "@/lib/db";
import Expert from "@/models/Expert";
import Organization from "@/models/Organization";

export default async function sitemap() {
  const baseUrl = process.env.APP_URL || 'https://mindnamo.com';

  // 1. Define Static Routes
  const routes = [
    '',
    '/experts',
    '/organizations',
    '/support',
    '/terms',
    '/privacy',
    '/login',
    '/register',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: route === '' ? 1 : 0.8,
  }));

  // 2. Fetch Dynamic Data
  let expertUrls = [];
  let orgUrls = [];

  try {
    await connectToDatabase();

    // Fetch all verified Experts
    const experts = await Expert.find({ isVerified: true })
      .select('_id updatedAt')
      .lean();

    expertUrls = experts.map((expert) => ({
      url: `${baseUrl}/experts/${expert._id}`,
      lastModified: expert.updatedAt || new Date(),
      changeFrequency: 'daily',
      priority: 0.9, // High priority for core content
    }));

    // Fetch all active Organizations
    const organizations = await Organization.find({ isActive: true })
      .select('slug updatedAt')
      .lean();

    orgUrls = organizations.map((org) => ({
      url: `${baseUrl}/organizations/${org.slug}`,
      lastModified: org.updatedAt || new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    }));

  } catch (error) {
    console.error("[Sitemap] Error generating dynamic routes:", error);
  }

  // 3. Combine and Return
  return [...routes, ...expertUrls, ...orgUrls];
}