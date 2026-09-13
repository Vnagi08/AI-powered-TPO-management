import nodemailer from "nodemailer";
import { Resend } from "resend";
import { env } from "./env.js";
import { logger } from "./logger.js";

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

// Zero-domain fallback for a deployment with no verified sending domain (see
// DEPLOYMENT.md §4a): real delivery via a Gmail account + App Password, no
// Resend/DNS setup required. Only used when RESEND_API_KEY is unset.
const gmailTransport =
  !resend && env.GMAIL_USER && env.GMAIL_APP_PASSWORD
    ? nodemailer.createTransport({
        service: "gmail",
        auth: { user: env.GMAIL_USER, pass: env.GMAIL_APP_PASSWORD },
      })
    : null;

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
}

/** Whether sendEmail() can actually deliver, as opposed to just logging. Used to
 * gate registration auto-verify (see auth.service.ts) — that shortcut only makes
 * sense when there's truly no way to deliver a verification link. */
export const hasEmailProvider = Boolean(resend) || Boolean(gmailTransport);

/**
 * Sends via Resend when configured, falls back to Gmail SMTP, and otherwise
 * logs the email instead of sending it — the same dev-stand-in pattern used
 * for verification/reset links since before an email provider existed (see
 * auth.service.ts).
 */
export async function sendEmail(input: SendEmailInput): Promise<void> {
  if (resend) {
    const result = await resend.emails.send({
      from: env.EMAIL_FROM ?? "no-reply@your-domain.com",
      to: input.to,
      subject: input.subject,
      html: input.html,
    });
    if (result.error) {
      logger.error({ to: input.to, error: result.error }, "Failed to send email via Resend");
    }
    return;
  }

  if (gmailTransport) {
    try {
      await gmailTransport.sendMail({
        from: `"${env.COLLEGE_NAME}" <${env.GMAIL_USER}>`,
        to: input.to,
        subject: input.subject,
        html: input.html,
      });
    } catch (err) {
      logger.error({ to: input.to, err }, "Failed to send email via Gmail SMTP");
    }
    return;
  }

  logger.info({ to: input.to, subject: input.subject, html: input.html }, "Email (dev stand-in — no email provider configured, logging instead of sending)");
}
