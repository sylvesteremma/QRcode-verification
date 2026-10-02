/* =============================================================================
   Shared config & named route constants (to avoid magic strings).
   ============================================================================= */

export const appConfig = {
  companyName: "SEMEK",
  companyFull: "SEMEK Company",
  tagline: "Pure Water You Can Trust",
  appUrl: process.env.NEXT_PUBLIC_APP_URL || "",
  apiUrl: process.env.NEXT_PUBLIC_API_URL || "/api",
  companyEmail: process.env.COMPANY_EMAIL || "support@semek.example.com",
  companyPhone: "+234 000 000 0000",
  companyAddress: "SEMEK Company Headquarters",
};

export const ROUTES = {
  home: "/",
  verify: "/verify",
  verifyResult: "/verify/result",
  report: "/report",
  complaints: "/complaints",
  complaintSuccess: "/complaints/success",
  complaintTrack: "/complaints/track",
  news: "/news",
  newsDetail: (s: string) => `/news/${s}`,
  help: "/help",
  contact: "/contact",
  feedback: "/feedback",
  dashboard: "/dashboard",
  admin: {
    login: "/admin/login",
    dashboard: "/admin",
    products: "/admin/products",
    productCreate: "/admin/products/create",
    productEdit: (id: string) => `/admin/products/${id}/edit`,
    batches: "/admin/batches",
    batchCreate: "/admin/batches/create",
    codes: "/admin/codes",
    codeGenerate: "/admin/codes/generate",
    scans: "/admin/scans",
    alerts: "/admin/alerts",
    complaints: "/admin/complaints",
    news: "/admin/news",
    newsCreate: "/admin/news/create",
    newsEdit: (id: string) => `/admin/news/${id}/edit`,
    feedback: "/admin/feedback",
    reports: "/admin/reports",
    users: "/admin/users",
    auditLogs: "/admin/audit-logs",
    settings: "/admin/settings",
  },
} as const;
