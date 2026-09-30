import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { complaintSchema } from "@/lib/validation";
import { generateComplaintReference } from "@/lib/utils";
import {
  sendComplaintToCompany,
  sendComplaintAcknowledgement,
} from "@/lib/email";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = complaintSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return NextResponse.json(
        { error: firstError?.message || "Please check the form and try again." },
        { status: 400 },
      );
    }

    const reference = generateComplaintReference();
    const data = parsed.data;

    const complaint = await prisma.complaint.create({
      data: {
        reference,
        fullName: data.fullName,
        email: data.email,
        phone: data.phone || undefined,
        category: data.category as never,
        subject: data.subject,
        message: data.message,
        productId: data.productId || undefined,
        batchNumber: data.batchNumber || undefined,
        verificationCode: data.verificationCode || undefined,
      },
    });

    void sendComplaintToCompany({
      reference,
      fullName: data.fullName,
      email: data.email,
      phone: data.phone || undefined,
      category: data.category,
      subject: data.subject,
      message: data.message,
      batchNumber: data.batchNumber || undefined,
      verificationCode: data.verificationCode || undefined,
    }).catch(console.error);

    void sendComplaintAcknowledgement({
      toName: data.fullName,
      toEmail: data.email,
      reference,
      subject: data.subject,
    }).catch(console.error);

    return NextResponse.json(
      {
        reference,
        status: "SUBMITTED",
      },
      { status: 200 },
    );
  } catch (err) {
    console.error("[API /api/complaints]", err);
    return NextResponse.json(
      {
        error:
          "We could not submit your complaint right now. Please try again in a moment.",
      },
      { status: 500 },
    );
  }
}
