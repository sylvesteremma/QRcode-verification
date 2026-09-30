/* =============================================================================
   Resend Email Service — server-only module.
   Delivers customer feedback + complaints directly to the SEMEK company inbox,
   and sends a polite acknowledgement to the submitting customer.
   Replaces the previous SendGrid integration; API surface is intentionally
   identical so call-sites require zero changes.
   ============================================================================= */

import { Resend } from "resend";

const API_KEY = process.env.RESEND_API_KEY || "";
const FROM_EMAIL = process.env.FROM_EMAIL || "noreply@semek.example.com";
const FROM_NAME = process.env.COMPANY_EMAIL_NAME || "SEMEK Company";
const COMPANY_EMAIL = process.env.COMPANY_EMAIL || "support@semek.example.com";

let resendClient: Resend | null = null;
if (API_KEY) {
  resendClient = new Resend(API_KEY);
}

interface MailParams {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
  replyToName?: string;
}

/**
 * Low-level send — wraps the Resend SDK with graceful fallbacks.
 * If Resend is misconfigured/unavailable we log and do NOT throw;
 * the platform still captures the message in the database.
 */
export async function sendMail(params: MailParams): Promise<boolean> {
  if (!resendClient || !API_KEY) {
    console.warn(
      "[EMAIL] RESEND_API_KEY not set — skipping email delivery. DB write was preserved.",
    );
    return false;
  }
  try {
    const payload: any = {
      to: params.to,
      from: { email: FROM_EMAIL, name: FROM_NAME },
      subject: params.subject,
      html: params.html,
    };
    if (params.replyTo) {
      payload.replyTo = params.replyToName
        ? { email: params.replyTo, name: params.replyToName }
        : params.replyTo;
    }
    const result = await resendClient.emails.send(payload);
    const ok = Boolean(result && !(result as any).error);
    if (!ok) {
      console.warn(
        `[EMAIL] Resend responded with an error for subject "${params.subject}":`,
        (result as any).error || result,
      );
    }
    return ok;
  } catch (err) {
    console.error(
      `[EMAIL] Failed to send subject "${params.subject}":`,
      err instanceof Error ? err.message : err,
    );
    return false;
  }
}

/* -------------------------- Public feedback -------------------------- */

export async function sendFeedbackToCompany(params: {
  newsPostTitle?: string;
  name: string;
  email: string;
  message: string;
}) {
  const html = `
  <div style="font-family:Arial,sans-serif;max-width:640px;margin:auto;padding:24px;color:#0f172a">
    <div style="background:#2563EB;color:white;padding:18px 24px;border-radius:10px 10px 0 0">
      <h2 style="margin:0;font-size:20px">New Customer Feedback — SEMEK Platform</h2>
    </div>
    <div style="padding:24px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 10px 10px;background:#fafafa">
      ${params.newsPostTitle ? `<p style="margin:0 0 12px"><strong>On article:</strong> ${escape(params.newsPostTitle)}</p>` : ""}
      <p style="margin:0 0 12px"><strong>From:</strong> ${escape(params.name)} &lt;${escape(params.email)}&gt;</p>
      <div style="background:#fff;padding:16px;border-radius:8px;border:1px solid #e2e8f0;white-space:pre-wrap">${escape(params.message)}</div>
      <p style="margin-top:20px;color:#475569;font-size:13px">Received ${new Date().toLocaleString()}</p>
    </div>
  </div>`;
  return sendMail({
    to: COMPANY_EMAIL,
    subject: `[SEMEK Feedback] ${params.name} — ${params.newsPostTitle || "Website"}`,
    html,
    replyTo: params.email,
    replyToName: params.name,
  });
}

export async function sendContactFormToCompany(params: {
  fullName: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}) {
  const html = `
  <div style="font-family:Arial,sans-serif;max-width:640px;margin:auto;padding:24px;color:#0f172a">
    <div style="background:#2563EB;color:white;padding:18px 24px;border-radius:10px 10px 0 0">
      <h2 style="margin:0;font-size:20px">New Website Contact Message</h2>
    </div>
    <div style="padding:24px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 10px 10px;background:#fafafa">
      <p style="margin:0 0 8px"><strong>Subject:</strong> ${escape(params.subject)}</p>
      <p style="margin:0 0 8px"><strong>From:</strong> ${escape(params.fullName)} &lt;${escape(params.email)}&gt;</p>
      ${params.phone ? `<p style="margin:0 0 12px"><strong>Phone:</strong> ${escape(params.phone)}</p>` : ""}
      <div style="background:#fff;padding:16px;border-radius:8px;border:1px solid #e2e8f0;white-space:pre-wrap">${escape(params.message)}</div>
      <p style="margin-top:20px;color:#475569;font-size:13px">Received ${new Date().toLocaleString()}</p>
    </div>
  </div>`;
  return sendMail({
    to: COMPANY_EMAIL,
    subject: `[SEMEK Contact] ${params.subject}`,
    html,
    replyTo: params.email,
    replyToName: params.fullName,
  });
}

/* -------------------------- Complaints -------------------------- */

export async function sendComplaintToCompany(params: {
  reference: string;
  fullName: string;
  email: string;
  phone?: string;
  category: string;
  subject: string;
  message: string;
  batchNumber?: string;
  verificationCode?: string;
}) {
  const html = `
  <div style="font-family:Arial,sans-serif;max-width:640px;margin:auto;padding:24px;color:#0f172a">
    <div style="background:#2563EB;color:white;padding:18px 24px;border-radius:10px 10px 0 0">
      <h2 style="margin:0;font-size:20px">New Customer Complaint — Reference ${escape(params.reference)}</h2>
    </div>
    <div style="padding:24px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 10px 10px;background:#fafafa">
      <table style="width:100%;border-collapse:collapse;margin-bottom:16px">
        <tr><td style="padding:6px 10px 6px 0;vertical-align:top;width:30%"><strong>Reference</strong></td><td style="padding:6px 0">${escape(params.reference)}</td></tr>
        <tr><td style="padding:6px 10px 6px 0;vertical-align:top"><strong>Customer</strong></td><td style="padding:6px 0">${escape(params.fullName)} &lt;${escape(params.email)}&gt;</td></tr>
        ${params.phone ? `<tr><td style="padding:6px 10px 6px 0;vertical-align:top"><strong>Phone</strong></td><td style="padding:6px 0">${escape(params.phone)}</td></tr>` : ""}
        <tr><td style="padding:6px 10px 6px 0;vertical-align:top"><strong>Category</strong></td><td style="padding:6px 0">${escape(params.category)}</td></tr>
        <tr><td style="padding:6px 10px 6px 0;vertical-align:top"><strong>Subject</strong></td><td style="padding:6px 0">${escape(params.subject)}</td></tr>
        ${params.batchNumber ? `<tr><td style="padding:6px 10px 6px 0;vertical-align:top"><strong>Batch #</strong></td><td style="padding:6px 0">${escape(params.batchNumber)}</td></tr>` : ""}
        ${params.verificationCode ? `<tr><td style="padding:6px 10px 6px 0;vertical-align:top"><strong>Verification</strong></td><td style="padding:6px 0">${escape(params.verificationCode)}</td></tr>` : ""}
      </table>
      <div style="background:#fff;padding:16px;border-radius:8px;border:1px solid #e2e8f0;white-space:pre-wrap">${escape(params.message)}</div>
      <p style="margin-top:20px;color:#475569;font-size:13px">Logged ${new Date().toLocaleString()}</p>
    </div>
  </div>`;
  return sendMail({
    to: COMPANY_EMAIL,
    subject: `[SEMEK Complaint] ${params.reference} — ${params.subject}`,
    html,
    replyTo: params.email,
    replyToName: params.fullName,
  });
}

export async function sendComplaintAcknowledgement(params: {
  toName: string;
  toEmail: string;
  reference: string;
  subject: string;
}) {
  const html = `
  <div style="font-family:Arial,sans-serif;max-width:640px;margin:auto;padding:24px;color:#0f172a">
    <div style="background:#2563EB;color:white;padding:18px 24px;border-radius:10px 10px 0 0">
      <h2 style="margin:0;font-size:20px">Thank you for contacting SEMEK</h2>
    </div>
    <div style="padding:24px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 10px 10px;background:#fafafa">
      <p style="margin:0 0 8px">Dear ${escape(params.toName)},</p>
      <p style="margin:0 0 8px">We have received your message and our team will review it shortly.</p>
      <div style="background:#eff6ff;padding:14px;border-radius:8px;margin:16px 0">
        <p style="margin:0 0 6px"><strong>Reference:</strong> ${escape(params.reference)}</p>
        <p style="margin:0"><strong>Subject:</strong> ${escape(params.subject)}</p>
      </div>
      <p style="margin:0">You can track the progress of your complaint on our website using the reference above. We appreciate your feedback and will respond as quickly as possible.</p>
      <p style="margin-top:24px;color:#475569;font-size:13px">— SEMEK Customer Care</p>
    </div>
  </div>`;
  return sendMail({
    to: params.toEmail,
    subject: `We received your complaint — ${params.reference}`,
    html,
  });
}

/* -------------------------- Helpers -------------------------- */

function escape(s: string | undefined | null): string {
  if (!s) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
