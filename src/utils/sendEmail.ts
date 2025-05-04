// utils/sendEmail.ts
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendEmail = async ({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) => {
  try {
    console.warn("[Email] Sending email to:", to);
    console.warn("[Email] Subject:", subject);
    const result = await resend.emails.send({
      from: "RPG Marketplace <onboarding@resend.dev>",
      to,
      subject,
      html,
    });
    console.warn("[Email] Successfully sent:", result);
    return result;
  } catch (error) {
    console.error("[Email] Failed to send:", error);
    console.error("[Email] Failed attempt details:", { to, subject });
    throw error; // Rethrow the error to handle it in the calling function
  }
};
