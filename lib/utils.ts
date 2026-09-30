/* =============================================================================
   Shared utilities — pure functions, safe for both server & browser.
   ============================================================================= */

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type {
  VerificationStatus as V,
  ComplaintStatus as C,
  AlertSeverity as A,
  FeedbackStatus as F,
  RiskLevel as R,
} from "@prisma/client";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/* ---------------- Formatting ---------------- */

export function formatDate(input: string | Date | undefined | null): string {
  if (!input) return "—";
  const d = typeof input === "string" ? new Date(input) : input;
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(
  input: string | Date | undefined | null,
): string {
  if (!input) return "—";
  const d = typeof input === "string" ? new Date(input) : input;
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatNumber(n: number | undefined | null): string {
  if (n === undefined || n === null) return "0";
  return new Intl.NumberFormat().format(n);
}

export function generateComplaintReference(): string {
  const n = Math.floor(100000 + Math.random() * 900000);
  return `SEM-${n}`;
}

export function extractVerificationCode(raw: string): string {
  const t = raw.trim();
  const url = t.match(/[?&]code=([^&]+)/i) || t.match(/\/verify\/([^?#/]+)/i);
  if (url && url[1]) {
    try {
      return decodeURIComponent(url[1]);
    } catch {
      return url[1];
    }
  }
  return t;
}

export function buildQuery(params: Record<string, unknown>): string {
  const parts: string[] = [];
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "") continue;
    parts.push(`${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
  }
  return parts.length ? `?${parts.join("&")}` : "";
}

export function debounce<T extends (...a: Parameters<T>) => void>(
  fn: T,
  wait = 300,
): (...a: Parameters<T>) => void {
  let to: ReturnType<typeof setTimeout> | null = null;
  return (...a: Parameters<T>) => {
    if (to) clearTimeout(to);
    to = setTimeout(() => fn(...a), wait);
  };
}

export function isPresent<T>(v: T | null | undefined): v is T {
  return v !== null && v !== undefined;
}

/* ---------------- Error messaging ---------------- */

export function httpStatusMessage(status: number): string {
  switch (status) {
    case 400:
      return "The information you provided is not valid.";
    case 401:
      return "Your session has expired. Please sign in again.";
    case 403:
      return "You do not have permission to perform this action.";
    case 404:
      return "The requested resource could not be found.";
    case 409:
      return "A conflict occurred. Please refresh and try again.";
    case 422:
      return "Some of the information you provided is invalid.";
    case 429:
      return "Too many requests. Please wait a moment and try again.";
    case 500:
      return "Something went wrong on our side. Please try again shortly.";
    case 503:
      return "Our services are temporarily unavailable. Please try again in a few minutes.";
    default:
      return "An unexpected error occurred. Please try again.";
  }
}

export function getErrorMessage(err: unknown): string {
  if (!err) return "An unexpected error occurred.";
  if (typeof err === "string") return err;
  if (typeof err === "object") {
    const e = err as { message?: unknown; status?: unknown };
    if (typeof e.message === "string") return e.message;
    if (typeof e.status === "number") return httpStatusMessage(e.status);
  }
  return "An unexpected error occurred. Please try again.";
}

/* ---------------- Badge class helpers ---------------- */

export function verificationBadge(status: V): string {
  switch (status) {
    case "VALID":
      return "bg-emerald-50 text-emerald-700 border-emerald-100";
    case "SUSPICIOUS":
      return "bg-amber-50 text-amber-700 border-amber-100";
    case "INVALID":
    case "REVOKED":
    case "EXPIRED":
      return "bg-red-50 text-red-700 border-red-100";
  }
}

export function complaintBadge(status: C): string {
  switch (status) {
    case "SUBMITTED":
      return "bg-slate-50 text-slate-700 border-slate-200";
    case "RECEIVED":
    case "IN_PROGRESS":
      return "bg-blue-50 text-blue-700 border-blue-100";
    case "UNDER_REVIEW":
      return "bg-amber-50 text-amber-700 border-amber-100";
    case "AWAITING_CUSTOMER":
      return "bg-sky-50 text-sky-700 border-sky-100";
    case "RESOLVED":
    case "CLOSED":
      return "bg-emerald-50 text-emerald-700 border-emerald-100";
  }
}

export function severityBadge(severity: A | R): string {
  switch (severity) {
    case "LOW":
      return "bg-slate-50 text-slate-700 border-slate-200";
    case "MEDIUM":
      return "bg-amber-50 text-amber-700 border-amber-100";
    case "HIGH":
      return "bg-red-50 text-red-600 border-red-100";
    case "CRITICAL":
      return "bg-red-100 text-red-700 border-red-200";
  }
}

export function feedbackBadge(status: F): string {
  switch (status) {
    case "PENDING":
      return "bg-amber-50 text-amber-700 border-amber-100";
    case "APPROVED":
      return "bg-emerald-50 text-emerald-700 border-emerald-100";
    case "REJECTED":
      return "bg-slate-100 text-slate-600 border-slate-200";
  }
}
