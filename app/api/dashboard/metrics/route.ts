import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { DashboardMetrics } from "@/lib/types";

export async function GET(req: Request) {
  try {
    await requireAdmin("AUDITOR");

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [
      totalProducts,
      activeProducts,
      totalBatches,
      totalQrCodes,
      activeQrCodes,
      scansToday,
      validScans,
      suspiciousScans,
      invalidScans,
      openComplaints,
      pendingFeedback,
      publishedNews,
      activeAlerts,
    ] = await Promise.all([
      prisma.product.count(),
      prisma.product.count({ where: { status: "ACTIVE" } }),
      prisma.batch.count(),
      prisma.qRCode.count(),
      prisma.qRCode.count({ where: { status: "ACTIVE" } }),
      prisma.scanEvent.count({ where: { timestamp: { gte: todayStart } } }),
      prisma.scanEvent.count({ where: { result: "VALID" } }),
      prisma.scanEvent.count({ where: { result: "SUSPICIOUS" } }),
      prisma.scanEvent.count({
        where: {
          OR: [{ result: "INVALID" }, { result: "REVOKED" }, { result: "EXPIRED" }],
        },
      }),
      prisma.complaint.count({
        where: {
          NOT: {
            status: { in: ["RESOLVED", "CLOSED"] },
          },
        },
      }),
      prisma.feedback.count({ where: { status: "PENDING" } }),
      prisma.newsPost.count({ where: { status: "PUBLISHED" } }),
      prisma.alert.count({
        where: {
          NOT: { status: "RESOLVED" },
        },
      }),
    ]);

    const metrics: DashboardMetrics = {
      totalProducts,
      activeProducts,
      totalBatches,
      totalQrCodes,
      activeQrCodes,
      scansToday,
      validScans,
      suspiciousScans,
      invalidScans,
      openComplaints,
      pendingFeedback,
      publishedNews,
      activeAlerts,
    };

    return NextResponse.json(metrics);
  } catch (err) {
    const error = err as Error & { status?: number };
    const status = error.status ?? 500;
    const message =
      status === 401
        ? "Authentication required."
        : status === 403
        ? "Admin privileges required."
        : "Failed to retrieve dashboard metrics.";
    return NextResponse.json({ error: message }, { status });
  }
}
