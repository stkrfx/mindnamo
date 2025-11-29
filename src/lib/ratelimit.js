/*
 * File: src/lib/ratelimit.js
 * SR-DEV: Enterprise Dual-Layer Rate Limiting
 */
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Ensure Redis connection is only created if env vars exist
// This prevents build errors during static generation if envs are missing
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || "https://fake-url.upstash.io",
  token: process.env.UPSTASH_REDIS_REST_TOKEN || "fake-token",
});

/**
 * 1. Global IP Limit (The "Bot" Blocker)
 * Prevents one IP from making too many requests, regardless of the email used.
 * Policy: 10 requests per hour per IP.
 */
export const authIpLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "1 h"),
  analytics: true,
  prefix: "@upstash/ratelimit/auth_ip",
});

/**
 * 2. Specific Target Limit (The "Spam" Blocker)
 * Prevents a single email/user from being spammed with OTPs.
 * Policy: 3 requests per hour per Identifier (Email/Phone).
 */
export const authUserLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, "1 h"),
  analytics: true,
  prefix: "@upstash/ratelimit/auth_user",
});