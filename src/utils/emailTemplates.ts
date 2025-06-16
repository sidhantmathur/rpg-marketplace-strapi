import { sendEmail } from "./sendEmail";

interface SessionInfo {
  title: string;
  date: Date;
  id: number;
}

interface UserInfo {
  email: string;
  name?: string;
}

export const sendSessionReminder = async (session: SessionInfo, users: UserInfo[]) => {
  for (const user of users) {
    if (user.email) {
      await sendEmail({
        to: user.email,
        subject: `Reminder: ${session.title} starts soon`,
        html: `<p>This is a reminder that your session <strong>${session.title}</strong> is coming up soon.</p>`,
      });
    }
  }
};

export const sendSessionCancellation = async (
  session: SessionInfo,
  users: UserInfo[],
  reason?: string
) => {
  for (const user of users) {
    if (user.email) {
      await sendEmail({
        to: user.email,
        subject: `Session Cancelled: ${session.title}`,
        html: `<p>The session <strong>${session.title}</strong> has been cancelled.${reason ? ` Reason: ${reason}` : ""}</p>`,
      });
    }
  }
};

export const sendReviewRequest = async (session: SessionInfo, user: UserInfo) => {
  if (user.email) {
    await sendEmail({
      to: user.email,
      subject: `Please review: ${session.title}`,
      html: `<p>Your session <strong>${session.title}</strong> has ended. Please take a moment to leave a review.</p>`,
    });
  }
};

export const sendSessionModification = async (
  session: SessionInfo,
  users: UserInfo[],
  changes: string
) => {
  for (const user of users) {
    if (user.email) {
      await sendEmail({
        to: user.email,
        subject: `Session Updated: ${session.title}`,
        html: `<p>The session <strong>${session.title}</strong> has been updated. Changes: ${changes}</p>`,
      });
    }
  }
};

export const sendWelcomeEmail = async (user: UserInfo) => {
  if (user.email) {
    await sendEmail({
      to: user.email,
      subject: "Welcome to Adarle 20!",
      html: `<p>Welcome to Adarle 20! We're excited to have you join our community.</p>`,
    });
  }
};
