import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { complaintTrackSchema } from "@/lib/validation";
import type { ComplaintJson } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = complaintTrackSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return NextResponse.json(
        { error: firstError?.message || "Please enter a valid reference and email." },
        { status: 400 },
      );
    }

    const complaint = await prisma.complaint.findFirst({
      where: {
        reference: parsed.data.reference,
        email: parsed.data.email,
      },
    });

    if (!complaint) {
      return NextResponse.json(
        {
          error:
            "No complaint found with this reference number and email combination.",
        },
        { status: 404 },
      );
    }

    const result: ComplaintJson = {
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

    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    console.error("[API /api/complaints/track]", err);
    return NextResponse.json(
      {
        error:
          "We could not load your complaint details right now. Please try again in a moment.",
      },
      { status: 500 },
    );
  }
}
