/*
 * File: src/app/api/cron/reminders/route.js
 * SR-DEV: Cron Job for Session Reminders
 * Checks for appointments starting in 10 minutes and sends emails.
 * Uses Redis for idempotency (prevent duplicate emails).
 */

import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Appointment from "@/models/Appointment";
import User from "@/models/User"; // Ensure registered
import Expert from "@/models/Expert"; // Ensure registered
import { sendEmail } from "@/lib/nodemailer";
import { Redis } from "@upstash/redis";

// Initialize Redis for idempotency checks
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export const dynamic = 'force-dynamic'; // Prevent caching

export async function GET(req) {
  try {
    // 1. Security Check (Optional: Verify CRON_SECRET header if set)
    // const authHeader = req.headers.get('authorization');
    // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    //   return new NextResponse('Unauthorized', { status: 401 });
    // }

    await connectToDatabase();

    const now = new Date();
    const tenMinutesFromNow = new Date(now.getTime() + 10 * 60 * 1000);
    
    // We fetch a slightly wider window to handle cron execution delays
    // E.g., Appointments scheduled for "Today"
    // Since appointmentDate is stored as 00:00:00 UTC of the day,
    // and appointmentTime is a string "HH:MM", we have to process carefully.
    
    // Strategy: Fetch all 'confirmed' appointments for the relevant dates
    // then filter in-memory for exact time match.
    // Optimization: Range query on appointmentDate (Yesterday, Today, Tomorrow) to be safe with timezones
    const rangeStart = new Date(now);
    rangeStart.setDate(rangeStart.getDate() - 1);
    const rangeEnd = new Date(now);
    rangeEnd.setDate(rangeEnd.getDate() + 1);

    const appointments = await Appointment.find({
      status: "confirmed",
      appointmentDate: { $gte: rangeStart, $lte: rangeEnd },
    })
    .populate("userId", "name email")
    .populate("expertId", "name");

    let sentCount = 0;

    for (const appt of appointments) {
      if (!appt.userId || !appt.expertId) continue;

      // Reconstruct the full Date object for the appointment
      // appt.appointmentDate is 00:00:00Z. 
      // appt.appointmentTime is "14:30".
      // We assume standard ISO combining.
      const [hours, minutes] = appt.appointmentTime.split(":").map(Number);
      const apptDateTime = new Date(appt.appointmentDate);
      apptDateTime.setUTCHours(hours, minutes, 0, 0); // Assuming times are stored/booked in UTC or consistent offset

      // Calculate difference in minutes
      const diffInMs = apptDateTime.getTime() - now.getTime();
      const diffInMins = diffInMs / (1000 * 60);

      // Check if it's starting effectively "now" (between 5 and 15 mins)
      if (diffInMins >= 5 && diffInMins <= 15) {
        
        // Idempotency: Check Redis if we already sent a reminder for this ID
        const redisKey = `reminder_sent:${appt._id}`;
        const alreadySent = await redis.get(redisKey);

        if (!alreadySent) {
          // Send Email
          const emailResult = await sendEmail({
            to: appt.userId.email,
            slug: "session-reminder",
            data: {
              name: appt.userId.name,
              expertName: appt.expertId.name,
              link: appt.meetingLink || `${process.env.APP_URL}/appointments`,
            },
          });

          if (emailResult.success) {
            // Mark as sent in Redis (expire in 24h)
            await redis.set(redisKey, "true", { ex: 86400 });
            sentCount++;
            console.log(`[Cron] Reminder sent for Appointment ${appt._id}`);
          }
        }
      }
    }

    return NextResponse.json({ success: true, processed: appointments.length, sent: sentCount });

  } catch (error) {
    console.error("[Cron] Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}