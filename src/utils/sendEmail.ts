// utils/sendEmail.ts
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// Get the from address from environment variable or use default
const FROM_EMAIL = process.env.EMAIL_FROM_ADDRESS || "RPG Marketplace <onboarding@resend.dev>";

export const sendEmail = async ({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) => {
  if (!process.env.RESEND_API_KEY) {
    console.error("[Email] RESEND_API_KEY is not set");
    throw new Error("Email service is not configured");
  }

  if (!to) {
    console.error("[Email] No recipient email provided");
    throw new Error("No recipient email provided");
  }

  try {
    console.log("[Email] Attempting to send email:", {
      to,
      subject,
      from: FROM_EMAIL,
      hasHtml: !!html,
      apiKeyPresent: !!process.env.RESEND_API_KEY
    });

    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
    });

    if (result.error) {
      // Check if it's a domain verification error
      if (result.error.message?.includes("verify a domain")) {
        console.error("[Email] Domain verification required. Please verify your domain at resend.com/domains");
        throw new Error("Email domain not verified. Please verify your domain at resend.com/domains");
      }
      throw result.error;
    }

    console.log("[Email] Successfully sent:", {
      result,
      to,
      subject
    });

    return result;
  } catch (error) {
    console.error("[Email] Failed to send:", {
      error,
      to,
      subject,
      errorMessage: error instanceof Error ? error.message : "Unknown error",
      errorStack: error instanceof Error ? error.stack : undefined
    });
    throw error;
  }
};
