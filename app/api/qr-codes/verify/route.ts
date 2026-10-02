import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const scannedCode = typeof body?.scannedCode === "string" ? body.scannedCode.trim() : "";
    if (!scannedCode || scannedCode.length > 128) {
      return NextResponse.json({ valid: false, message: "Invalid / Not Generated From This System" }, { status: 200 });
    }
    const record = await prisma.adminGeneratedQRCode.findUnique({ where: { code: scannedCode } });
    const expired = !!record?.expiresAt && record.expiresAt <= new Date();
    const valid = !!record && record.status === "VALID" && !expired;
    return NextResponse.json({
      valid,
      message: valid ? "Valid Code" : "Invalid / Not Generated From This System",
      ...(valid ? { data: record.data } : {}),
    });
  } catch (error) {
    console.error("[API /api/qr-codes/verify]", error);
    return NextResponse.json({ valid: false, message: "Verification is temporarily unavailable." }, { status: 500 });
  }
}
