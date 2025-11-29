import { connectToDatabase } from "@/lib/db";
import EmailTemplate from "@/models/EmailTemplate";

// Shared Email CSS Styles
const styles = {
  body: "margin:0; padding:0; background-color:#f4f4f5; font-family:'Helvetica Neue', Helvetica, Arial, sans-serif; -webkit-font-smoothing:antialiased;",
  container: "width:100%; background-color:#f4f4f5; padding:40px 0;",
  card: "max-width:500px; margin:0 auto; background-color:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 4px 20px rgba(0,0,0,0.05);",
  header: "background-color:#18181b; padding:30px 40px; text-align:center;",
  brand: "color:#ffffff; font-size:22px; font-weight:700; text-decoration:none; letter-spacing:0.5px; display:inline-block;",
  content: "padding:40px 40px 30px;",
  heading: "color:#18181b; font-size:24px; font-weight:700; margin:0 0 16px; letter-spacing:-0.5px;",
  text: "color:#52525b; font-size:16px; line-height:1.6; margin:0 0 24px;",
  otpBox: "background-color:#f4f4f5; border-radius:12px; padding:24px; text-align:center; margin:32px 0;",
  otpText: "font-family:'Courier New', monospace; font-size:32px; font-weight:700; letter-spacing:8px; color:#18181b; display:block;",
  button: "background-color:#18181b; color:#ffffff; text-decoration:none; padding:14px 32px; border-radius:50px; font-weight:600; display:inline-block; font-size:16px;",
  buttonContainer: "text-align:center; margin:32px 0;",
  infoBox: "background-color:#fafafa; border:1px solid #e4e4e7; border-radius:8px; padding:20px; margin-bottom:24px;",
  footer: "background-color:#fafafa; padding:24px 40px; text-align:center; border-top:1px solid #f4f4f5;",
  footerText: "color:#a1a1aa; font-size:12px; line-height:1.5; margin:0;",
};

const DEFAULTS = {
  // 1. OTP / Verification
  "verification-code": {
    subject: "Verify your Mind Namo account",
    body: `
      <!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head><body style="${styles.body}"><table border="0" cellpadding="0" cellspacing="0" width="100%" style="${styles.container}"><tr><td align="center"><table border="0" cellpadding="0" cellspacing="0" width="100%" style="${styles.card}"><tr><td style="${styles.header}"><span style="${styles.brand}">Mind Namo</span></td></tr><tr><td style="${styles.content}"><h1 style="${styles.heading}">Verify your email</h1><p style="${styles.text}">Hello <strong>{{name}}</strong>,<br><br>Thank you for starting your journey with Mind Namo. Please enter the verification code below to secure your account.</p><div style="${styles.otpBox}"><span style="${styles.otpText}">{{otp}}</span></div><p style="${styles.text}" style="font-size:14px; color:#71717a;">This code will expire in <strong>10 minutes</strong>. If you did not request this, please ignore this email.</p></td></tr><tr><td style="${styles.footer}"><p style="${styles.footerText}">&copy; ${new Date().getFullYear()} Mind Namo. All rights reserved.</p></td></tr></table></td></tr></table></body></html>
    `,
  },
  
  // 2. Password Reset
  "reset-password": {
    subject: "Reset your Password",
    body: `
      <!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head><body style="${styles.body}"><table border="0" cellpadding="0" cellspacing="0" width="100%" style="${styles.container}"><tr><td align="center"><table border="0" cellpadding="0" cellspacing="0" width="100%" style="${styles.card}"><tr><td style="${styles.header}"><span style="${styles.brand}">Mind Namo</span></td></tr><tr><td style="${styles.content}"><h1 style="${styles.heading}">Reset Password</h1><p style="${styles.text}">Hello <strong>{{name}}</strong>,<br><br>We received a request to reset the password for your Mind Namo account. Click the button below to create a new password.</p><div style="${styles.buttonContainer}"><a href="{{link}}" style="${styles.button}">Reset Password</a></div><p style="${styles.text}" style="font-size:14px; color:#71717a;">This link is valid for <strong>1 hour</strong>. If you did not request this, you can safely ignore this email.</p></td></tr><tr><td style="${styles.footer}"><p style="${styles.footerText}">&copy; ${new Date().getFullYear()} Mind Namo. All rights reserved.</p></td></tr></table></td></tr></table></body></html>
    `,
  },

  // 3. Booking Confirmed
  "booking-confirmed": {
    subject: "Booking Confirmed: {{serviceName}} with {{expertName}}",
    body: `
      <!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head><body style="${styles.body}"><table border="0" cellpadding="0" cellspacing="0" width="100%" style="${styles.container}"><tr><td align="center"><table border="0" cellpadding="0" cellspacing="0" width="100%" style="${styles.card}"><tr><td style="${styles.header}"><span style="${styles.brand}">Mind Namo</span></td></tr><tr><td style="${styles.content}"><h1 style="${styles.heading}">Booking Confirmed!</h1><p style="${styles.text}">Hello <strong>{{name}}</strong>,<br><br>Your appointment has been successfully scheduled. We look forward to seeing you.</p><div style="${styles.infoBox}"><p style="margin:0 0 8px 0; font-size:14px;"><strong>Expert:</strong> {{expertName}}</p><p style="margin:0 0 8px 0; font-size:14px;"><strong>Service:</strong> {{serviceName}} ({{type}})</p><p style="margin:0 0 8px 0; font-size:14px;"><strong>Date:</strong> {{date}}</p><p style="margin:0; font-size:14px;"><strong>Time:</strong> {{time}}</p></div><div style="${styles.buttonContainer}"><a href="{{link}}" style="${styles.button}">View Appointment</a></div></td></tr><tr><td style="${styles.footer}"><p style="${styles.footerText}">&copy; ${new Date().getFullYear()} Mind Namo. All rights reserved.</p></td></tr></table></td></tr></table></body></html>
    `,
  },

  // 4. Booking Cancelled
  "booking-cancelled": {
    subject: "Appointment Cancelled",
    body: `
      <!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head><body style="${styles.body}"><table border="0" cellpadding="0" cellspacing="0" width="100%" style="${styles.container}"><tr><td align="center"><table border="0" cellpadding="0" cellspacing="0" width="100%" style="${styles.card}"><tr><td style="${styles.header}"><span style="${styles.brand}">Mind Namo</span></td></tr><tr><td style="${styles.content}"><h1 style="${styles.heading}">Booking Cancelled</h1><p style="${styles.text}">Hello <strong>{{name}}</strong>,<br><br>Your appointment with <strong>{{expertName}}</strong> on <strong>{{date}}</strong> at <strong>{{time}}</strong> has been cancelled.</p><div style="${styles.infoBox}"><p style="margin:0; font-size:14px; color:#71717a;">The refund process has been initiated and will reflect in your account within 5-7 business days.</p></div><div style="${styles.buttonContainer}"><a href="{{link}}" style="${styles.button}">Book Again</a></div></td></tr><tr><td style="${styles.footer}"><p style="${styles.footerText}">&copy; ${new Date().getFullYear()} Mind Namo. All rights reserved.</p></td></tr></table></td></tr></table></body></html>
    `,
  },

  // 5. Session Reminder (Cron Job)
  "session-reminder": {
    subject: "Reminder: Your session starts in 10 minutes",
    body: `
      <!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head><body style="${styles.body}"><table border="0" cellpadding="0" cellspacing="0" width="100%" style="${styles.container}"><tr><td align="center"><table border="0" cellpadding="0" cellspacing="0" width="100%" style="${styles.card}"><tr><td style="${styles.header}"><span style="${styles.brand}">Mind Namo</span></td></tr><tr><td style="${styles.content}"><h1 style="${styles.heading}">Starting Soon</h1><p style="${styles.text}">Hello <strong>{{name}}</strong>,<br><br>Your session with <strong>{{expertName}}</strong> is about to begin. Please be ready in a quiet environment.</p><div style="${styles.buttonContainer}"><a href="{{link}}" style="${styles.button}">Join Session Now</a></div><p style="${styles.text}" style="font-size:14px; color:#71717a;">If you have trouble joining, please contact support immediately.</p></td></tr><tr><td style="${styles.footer}"><p style="${styles.footerText}">&copy; ${new Date().getFullYear()} Mind Namo. All rights reserved.</p></td></tr></table></td></tr></table></body></html>
    `,
  },
};

/**
 * Replaces {{key}} in text with value from data object.
 */
const interpolate = (text, data) => {
  return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return data[key] !== undefined ? data[key] : match;
  });
};

/**
 * Fetches the email template from DB (if exists) or falls back to DEFAULTS.
 * @param {string} slug - The template identifier
 * @param {object} data - Data to inject
 */
export async function getCompiledTemplate(slug, data = {}) {
  let template = DEFAULTS[slug];

  try {
    // Try to fetch dynamic template from DB (allows Admin CMS updates)
    await connectToDatabase();
    const dbTemplate = await EmailTemplate.findOne({ slug, isActive: true }).lean();
    if (dbTemplate) {
      template = { subject: dbTemplate.subject, body: dbTemplate.bodyContent };
    }
  } catch (error) {
    // Fallback to defaults if DB fails
    console.warn(`[EmailTemplates] DB fetch failed for ${slug}, using default.`);
  }

  if (!template) {
    // Fallback for missing template
    return { 
      subject: "Notification from Mind Namo", 
      html: `<p>${JSON.stringify(data)}</p>` 
    };
  }

  return {
    subject: interpolate(template.subject, data),
    html: interpolate(template.body, data),
  };
}