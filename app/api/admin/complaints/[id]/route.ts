import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { ComplaintJson } from "@/lib/types";

export async function GET(
  req: Request,
  { params }: { params: { id: string } },
) {
  try {
    await requireAdmin("AUDITOR");

    const complaint = await prisma.complaint.findUnique({
      where: { id: params.id },
    });

    if (!complaint) {
      return NextResponse.json(
        { error: "Complaint not found." },
        { status: 404 },
      );
    }

    const data: ComplaintJson = {
      id: complaint.id,
      reference: complaint.reference,
      fullName: complaint.fullName,
      email: complaint.email,
      phone: complaint.phone,
      category: complaint.category,
      subject: complaint.subject,
      message: complaint.message,
      productId: complaint.productId,
      batchNumber: complaint.batchNumber,
      verificationCode: complaint.verificationCode,
      status: complaint.status,
      statusMessage: complaint.statusMessage,
      submittedAt: complaint.submittedAt.toISOString(),
      lastUpdatedAt: complaint.lastUpdatedAt.toISOString(),
    };

    return NextResponse.json(data);
  } catch (err) {
    const error = err as Error & { status?: number };
    const status = error.status ?? 500;
    const message =
      status === 401
        ? "Authentication required."
        : status === 403
          ? "Admin privileges required."
          : status === 404
            ? error.message
            : "Failed to retrieve complaint.";
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  try {
    await requireAdmin("OPERATIONS");

    const body = await req.json();
    const { status, statusMessage } = body;

    const validStatuses = [
      "SUBMITTED",
      "RECEIVED",
      "UNDER_REVIEW",
      "IN_PROGRESS",
      "AWAITING_CUSTOMER",
      "RESOLVED",
      "CLOSED",
    ] as const;

    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Invalid complaint status." },
        { status: 400 },
      );
    }

    const updateData: any = {};
    if (status !== undefined) updateData.status = status;
    if (statusMessage !== undefined) updateData.statusMessage = statusMessage;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update." },
        { status: 400 },
      );
    }

    const updated = await prisma.complaint.update({
      where: { id: params.id },
      data: updateData,
    });

    const data: ComplaintJson = {
      id: updated.id,
      reference: updated.reference,
      fullName: updated.fullName,
      email: updated.email,
      phone: updated.phone,
      category: updated.category,
      subject: updated.subject,
      message: updated.message,
      productId: updated.productId,
      batchNumber: updated.batchNumber,
      verificationCode: updated.verificationCode,
      status: updated.status,
      statusMessage: updated.statusMessage,
      submittedAt: updated.submittedAt.toISOString(),
      lastUpdatedAt: updated.lastUpdatedAt.toISOString(),
    };

    return NextResponse.json(data);
  } catch (err) {
    const error = err as Error & { status?: number };
    const status = error.status ?? 500;
    const message =
      status === 401
        ? "Authentication required."
        : status === 403
          ? "Admin privileges required."
          : "Failed to update complaint.";
    return NextResponse.json({ error: message }, { status });
  }
}
