import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

function errorResponse(error: unknown) {
  const status = (error as { status?: number })?.status;
  if (status === 401 || status === 403) {
    return NextResponse.json({ error: status === 401 ? "Authentication required." : "Admin access required." }, { status });
  }
  console.error("[API /api/admin/qr-codes]", error);
  return NextResponse.json({ error: "Could not process QR codes." }, { status: 500 });
}

export async function GET() {
  try {
    await requireAdmin("ADMIN");
    const codes = await prisma.adminGeneratedQRCode.findMany({
      orderBy: { createdAt: "desc" },
      include: { admin: { select: { fullName: true, email: true } } },
    });
    return NextResponse.json(codes);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin("ADMIN");
    const body = await request.json();
    const data = typeof body?.data === "string" ? body.data.trim() : "";
    if (!data || data.length > 1000) {
      return NextResponse.json({ error: "Enter a label or data value up to 1000 characters." }, { status: 400 });
    }
    const code = randomUUID();
    const saved = await prisma.adminGeneratedQRCode.create({
      data: { code, data, generatedBy: admin.userId },
      include: { admin: { select: { fullName: true, email: true } } },
    });
    const qrDataURL = await QRCode.toDataURL(code);
    return NextResponse.json({ ...saved, qrDataURL }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
