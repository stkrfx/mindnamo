import nodemailer from "nodemailer";
import { getCompiledTemplate } from "@/lib/emailTemplates";

const {
  SMTP_HOST,
  SMTP_PORT = "587",
  SMTP_SECURE, // "true" or "false"
  APP_NAME = "Mind Namo",
  EMAIL_ID,
  EMAIL_PASS,
} = process.env;

/**
 * Configure the transporter based on environment variables.
 * Falls back to 'gmail' service if no specific host is provided (easier for dev).
 */
const transporter = nodemailer.createTransport(
  SMTP_HOST
    ? {
        host: SMTP_HOST,
        port: Number(SMTP_PORT),
        secure: SMTP_SECURE === "true",
        auth: {
          user: EMAIL_ID,
          pass: EMAIL_PASS,
        },
      }
    : {
        service: "gmail",
        auth: {
          user: EMAIL_ID,
          pass: EMAIL_PASS,
        },
      }
);

/**
 * Sends a transactional email using a pre-defined template.
 * @param {Object} params
 * @param {string} params.to - Recipient email
 * @param {string} params.slug - Template key (e.g. 'verification-code')
 * @param {Object} params.data - Dynamic data to inject into template (e.g. { name: 'John', otp: '1234' })
 */
export const sendEmail = async ({ to, slug, data }) => {
  try {
    // 1. Get the compiled HTML and Subject from our template engine
    const { subject, html } = await getCompiledTemplate(slug, data);

    // 2. Send the email
    const info = await transporter.sendMail({
      from: `"${APP_NAME}" <${EMAIL_ID}>`,
      to,
      subject,
      html,
    });

    console.log(`[Email Sent] Message ID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("[Email Error] Failed to send:", error);
    // Return false so the calling action knows it failed (e.g., to show a toast)
    return { success: false, error: error.message };
  }
};