/*
 * File: src/actions/organizations.js
 * SR-DEV: Server Actions for Organization Data Fetching.
 * Purpose: Provides data for the /organizations and /organizations/[slug] pages.
 */

"use server";

import { connectToDatabase } from "@/lib/db";
import Organization from "@/models/Organization";
import Expert from "@/models/Expert";
import { revalidatePath } from "next/cache";

/**
 * @name getOrganizationsAction
 * @description Fetches all active partner organizations for the listing page.
 */
export async function getOrganizationsAction() {
    try {
        await connectToDatabase();
        
        // Fetch organizations, only populating the number of affiliated experts (for count display)
        const organizations = await Organization.find({ isActive: true })
            .select("name slug logoUrl mission focusTags affiliatedExperts")
            .populate({
                path: 'affiliatedExperts',
                select: '_id', // Only need the IDs to get the count
                model: Expert
            })
            .lean();

        // Map the result to include the count and clean up IDs
        const cleanedOrganizations = organizations.map(org => ({
            ...org,
            _id: org._id.toString(),
            expertCount: org.affiliatedExperts.length,
            affiliatedExperts: undefined // Remove the large array of IDs
        }));

        return { success: true, organizations: JSON.parse(JSON.stringify(cleanedOrganizations)) };
    } catch (error) {
        console.error("[OrganizationsAction] Fetch All Error:", error);
        return { success: false, organizations: [], message: "Failed to fetch organizations." };
    }
}

/**
 * @name getOrganizationBySlugAction
 * @description Fetches a single organization's details and its full list of affiliated experts.
 * @param {string} slug - The organization's slug.
 */
export async function getOrganizationBySlugAction(slug) {
    if (!slug) return { success: false, organization: null, experts: [], message: "Slug is required." };

    try {
        await connectToDatabase();

        const organization = await Organization.findOne({ slug, isActive: true })
            .lean();

        if (!organization) {
            return { success: false, organization: null, experts: [], message: "Organization not found." };
        }
        
        // Fetch the details of the affiliated experts
        const affiliatedExperts = await Expert.find({
            _id: { $in: organization.affiliatedExperts },
            isVerified: true,
            isBanned: false
        })
        .select("-leaves -availability") // Exclude heavy data not needed for card view
        .sort({ rating: -1, reviewCount: -1 })
        .lean();

        return { 
            success: true, 
            organization: JSON.parse(JSON.stringify(organization)),
            experts: JSON.parse(JSON.stringify(affiliatedExperts)),
        };
    } catch (error) {
        console.error(`[OrganizationsAction] Fetch By Slug (${slug}) Error:`, error);
        return { success: false, organization: null, experts: [], message: "Failed to fetch organization details." };
    }
}