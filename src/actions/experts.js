/*
 * File: src/actions/experts.js
 * SR-DEV: Server Action for Paged Expert Search and Dynamic Filter Extraction.
 * Features: Pagination, Sorting, Advanced Filtering, Dynamic Filter Options.
 */

"use server";

import { connectToDatabase } from "@/lib/db";
import Expert from "@/models/Expert";
import mongoose from "mongoose";

/**
 * Helper to build the MongoDB filter object from client params.
 */
function buildFilterQuery(filters) {
  const query = { isVerified: true, isBanned: false };

  // 1. Search Query
  if (filters.q) {
    const searchRegex = new RegExp(filters.q, 'i');
    query.$or = [
      { name: searchRegex },
      { specialization: searchRegex },
      { location: searchRegex },
      { treatmentTags: searchRegex },
    ];
  }

  // 2. Role/Specialization
  if (filters.roles && filters.roles.length > 0) {
    query.specialization = { $in: filters.roles };
  }

  // 3. Language
  if (filters.langs && filters.langs.length > 0) {
    query.languages = { $in: filters.langs };
  }

  // 4. Gender
  if (filters.gender && filters.gender.length > 0) {
    query.gender = { $in: filters.gender };
  }
  
  // 5. Rating
  if (filters.minRating && filters.minRating > 0) {
    query.rating = { $gte: Number(filters.minRating) };
  }

  // 6. Experience Range
  if (filters.expRange) {
    const [minExp, maxExp] = filters.expRange.split('-').map(Number);
    query.experienceYears = { $gte: minExp };
    if (maxExp < 100) {
        query.experienceYears.$lte = maxExp;
    }
  }
  
  // Price filtering logic is complex due to nested sub-documents (services array).
  // For query simplicity, price range filtering is left to the client in the current implementation,
  // but the framework is ready to integrate a server-side aggregation pipeline here if required.

  return query;
}

/**
 * @name getExpertsAction
 * @description Fetches experts with pagination and dynamic filtering.
 */
export async function getExpertsAction({ page = 1, limit = 10, filters = {}, sort = 'recommended' }) {
  try {
    await connectToDatabase();
    
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const query = buildFilterQuery(filters);
    
    // 1. Build Sort Options
    let sortOptions = {};
    if (sort === 'price-low') {
      sortOptions.startingPrice = 1; 
    } else if (sort === 'price-high') {
      sortOptions.startingPrice = -1;
    } else if (sort === 'rating') {
      sortOptions.rating = -1;
    } else if (sort === 'exp-high') {
      sortOptions.experienceYears = -1;
    } else { // recommended (default)
      sortOptions = { rating: -1, reviewCount: -1 };
    }

    // --- Execute Queries ---
    
    // 2. Fetch Paginated Experts
    const experts = await Expert.find(query)
      .select("-leaves -availability -reviews -workExperience -awards -registrations") // Exclude heavy/unnecessary data
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum)
      .lean();
    
    // 3. Get Total Count
    const totalExperts = await Expert.countDocuments(query);
    
    // 4. Extract Dynamic Filter Options (Aggregation)
    // We fetch all unique values to populate the filter sidebar dynamically.
    const filterAggregation = await Expert.aggregate([
        { $match: { isVerified: true, isBanned: false } },
        { $unwind: { path: "$languages", preserveNullAndEmptyArrays: true } },
        { 
            $group: {
                _id: null,
                allSpecializations: { $addToSet: "$specialization" },
                allLanguages: { $addToSet: "$languages" },
                minExperience: { $min: "$experienceYears" },
                maxExperience: { $max: "$experienceYears" },
            }
        }
    ]);
    
    const dynamicFilters = filterAggregation[0] || {};
    
    // --- Return Results ---
    
    // Must serialize to JSON for safe transfer from Server Component
    const results = JSON.parse(JSON.stringify(experts));

    return {
      success: true,
      experts: results,
      total: totalExperts,
      hasMore: (pageNum * limitNum) < totalExperts,
      currentPage: pageNum,
      dynamicFilters: {
        specializations: dynamicFilters.allSpecializations || [],
        languages: dynamicFilters.allLanguages?.filter(l => l) || [], // Filter out null/empty strings
        minExp: dynamicFilters.minExperience || 0,
        maxExp: dynamicFilters.maxExperience || 0,
        minPrice: 0, // Mock for client-side filter consistency
        maxPrice: 5000, // Mock for client-side filter consistency
      },
    };

  } catch (error) {
    console.error("[ExpertsAction] Error fetching experts:", error);
    return { success: false, experts: [], total: 0, hasMore: false, message: error.message };
  }
}