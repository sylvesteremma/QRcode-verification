import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    await requireAdmin("ADMIN");
    const record = await prisma.adminGeneratedQRCode.findUnique({ where: { id: params.id } });
    if (!record) return NextResponse.json({ error: "QR code not found." }, { status: 404 });
    const image = await QRCode.toBuffer(record.code, { type: "png", width: 512, margin: 2 });
    return new NextResponse(new Uint8Array(image), {
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": `attachment; filename="${record.code}.png"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    const status = (error as { status?: number })?.status;
    if (status === 401 || status === 403) return NextResponse.json({ error: "Admin access required." }, { status });
    console.error("[API QR code download]", error);
    return NextResponse.json({ error: "Could not download QR code." }, { status: 500 });
  }
}
