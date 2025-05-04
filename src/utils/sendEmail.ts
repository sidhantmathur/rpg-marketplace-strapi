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
    console.log("Attempting to send email to:", to);
    console.log("Subject:", subject);
    const result = await resend.emails.send({
      from: "RPG Marketplace <onboarding@resend.dev>",
      to,
      subject,
      html,
    });
    console.log("Email sent successfully:", result);
    return result;
  } catch (error) {
    console.error("Email sending failed:", error);
    console.error("Email details:", { to, subject });
    throw error; // Rethrow the error to handle it in the calling function
  }
};
