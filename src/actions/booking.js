/*
 * File: src/actions/booking.js
 * SR-DEV: Secure Booking Logic (Server Actions)
 * Includes: Validation, Creation, Cancellation, Payment Confirmation.
 */

"use server";

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectToDatabase } from "@/lib/db";
import Expert from "@/models/Expert";
import Appointment from "@/models/Appointment";
import { revalidatePath } from "next/cache";
import { sendEmail } from "@/lib/nodemailer";

/**
 * @name validateBookingRequest
 * @description Verifies availability, price, and logic before DB writes.
 * Does NOT create a booking. Just checks if it's possible.
 */
export async function validateBookingRequest(expertId, serviceName, type, date, time) {
  try {
    await connectToDatabase();

    // 1. Fetch Expert with relevant fields
    const expert = await Expert.findById(expertId).select(
      "name profilePicture services availability leaves specialization"
    );

    if (!expert) return { error: "Expert not found." };

    // 2. Validate Service
    const service = expert.services.find((s) => s.name === serviceName);
    if (!service) return { error: "Service not found or no longer offered." };

    // 3. Validate Price/Type availability
    const price = type === "Video Call" ? service.videoPrice : service.clinicPrice;
    if (price === null || price === undefined) return { error: "This appointment type is not available." };

    // 4. Validate Date (Past check)
    const bookingDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (bookingDate < today) return { error: "Cannot book dates in the past." };

    // 5. Check Leaves
    const isOnLeave = expert.leaves.some((leave) => {
      const start = new Date(leave.startDate);
      const end = new Date(leave.endDate);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      return bookingDate >= start && bookingDate <= end;
    });

    if (isOnLeave) return { error: "Expert is on leave during this date." };

    // 6. Check Availability Pattern (Day of Week)
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const dayName = days[bookingDate.getDay()];
    
    const isAvailableDay = expert.availability.some((slot) => slot.dayOfWeek === dayName);
    if (!isAvailableDay) return { error: `${expert.name} is not available on ${dayName}s.` };

    // 7. Check for Double Booking (Database Query)
    const existingBooking = await Appointment.findOne({
      expertId,
      appointmentDate: bookingDate,
      appointmentTime: time,
      status: { $in: ["confirmed", "pending"] }, // Ignore cancelled
    });

    if (existingBooking) return { error: "This time slot has already been booked." };

    // Success: Return safe data for the frontend to use in the next step
    return {
      success: true,
      data: {
        expertName: expert.name,
        expertImage: expert.profilePicture,
        specialization: expert.specialization,
        serviceName: service.name,
        duration: service.duration,
        price: price,
        date: bookingDate.toISOString(),
        time: time,
      },
    };
  } catch (error) {
    console.error("Validate Error:", error);
    return { error: "Validation failed due to a server error." };
  }
}

// --- CLIENT-FACING ACTIONS ---

/**
 * @name createAppointmentAction
 * @description "Confirm & Pay" action called by CheckoutClient.
 * Validates, Creates (Confirmed), Sends Email, and Redirects.
 */
export async function createAppointmentAction(bookingData) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return { success: false, message: "Authentication failed. Please log in." };
  }

  // 1. Re-Validate (Security: Never trust client input alone)
  const validation = await validateBookingRequest(
    bookingData.expertId,
    bookingData.serviceName,
    bookingData.type, // Note: Client sends 'type', schema expects 'appointmentType'
    bookingData.date,
    bookingData.time
  );

  if (validation.error) return { success: false, message: validation.error };

  const { data } = validation;

  try {
    await connectToDatabase();

    // 2. Create Appointment
    // In a real app, 'status' would be 'pending' until payment webhook confirms it.
    // For this demo, we assume payment success immediately.
    const newAppointment = await Appointment.create({
      userId: session.user.id,
      expertId: bookingData.expertId,
      appointmentDate: data.date,
      appointmentTime: data.time,
      
      // Snapshot Data
      serviceName: data.serviceName,
      appointmentType: bookingData.type,
      duration: data.duration,
      price: data.price,
      
      status: "confirmed", 
      paymentStatus: "paid",
      
      // Generate link if video
      meetingLink: bookingData.type === "Video Call" ? generateMeetingLink() : null,
    });

    // 3. Send Confirmation Email (Async - don't block)
    const formattedDate = new Date(data.date).toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric'
    });

    sendEmail({
      to: session.user.email,
      slug: "booking-confirmed",
      data: {
        name: session.user.name,
        expertName: data.expertName,
        serviceName: data.serviceName,
        date: formattedDate,
        time: data.time,
        type: bookingData.type,
        link: `${process.env.APP_URL}/appointments` // Link to dashboard
      },
    });

    // 4. Revalidate & Return
    revalidatePath("/appointments");
    return { success: true, appointmentId: newAppointment._id.toString() };

  } catch (error) {
    console.error("CreateAction Error:", error);
    // Handle race condition unique index error (MongoDB error code 11000)
    if (error.code === 11000) {
        return { success: false, message: "This slot was just booked by someone else." };
    }
    return { success: false, message: "Failed to create appointment." };
  }
}

/**
 * @name cancelAppointmentAction
 * @description Cancels a booking. Securely verifies ownership.
 */
export async function cancelAppointmentAction({ appointmentId, reason }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { success: false, message: "Unauthorized." };

  if (!appointmentId || !reason) return { success: false, message: "Missing details." };

  try {
    await connectToDatabase();

    // 1. Find & Verify Ownership
    // We populate 'expertId' to get the expert's name for the email notification
    const appointment = await Appointment.findOne({
      _id: appointmentId,
      userId: session.user.id, // Security Check: User must own this appt
    }).populate('expertId', 'name');

    if (!appointment) return { success: false, message: "Appointment not found." };

    if (appointment.status === "cancelled") {
        return { success: false, message: "Appointment is already cancelled." };
    }

    // 2. Update Status
    appointment.status = "cancelled";
    appointment.paymentStatus = "refunded"; // Simulate refund
    appointment.cancellationReason = reason;
    appointment.cancelledBy = "user";
    await appointment.save();

    // 3. Send Cancellation Email
    const formattedDate = new Date(appointment.appointmentDate).toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric'
    });

    sendEmail({
      to: session.user.email,
      slug: "booking-cancelled",
      data: {
        name: session.user.name,
        expertName: appointment.expertId?.name || "Expert",
        date: formattedDate,
        time: appointment.appointmentTime,
        link: `${process.env.APP_URL}/experts` // Link to find new expert
      },
    });

    revalidatePath("/appointments");
    return { success: true, message: "Appointment cancelled." };

  } catch (error) {
    console.error("CancelAction Error:", error);
    return { success: false, message: "Cancellation failed." };
  }
}

// --- Private Helpers ---

function generateMeetingLink() {
  // In production, call Zoom/Agora API. 
  // Here we use our internal video route.
  return `${process.env.APP_URL}/video-call/${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}