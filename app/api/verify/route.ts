import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { manualVerifySchema } from "@/lib/validation";
import { extractVerificationCode } from "@/lib/utils";
import type { VerificationResult } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = manualVerifySchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return NextResponse.json(
        { error: firstError?.message || "Invalid verification code." },
        { status: 400 },
      );
    }

    const code = extractVerificationCode(parsed.data.code);
    const now = new Date();

    const qr = await prisma.qRCode.findUnique({
      where: { code },
      include: { product: true, batch: true },
    });

    let status: string;
    let message: string;
    let riskLevel: string;
    let riskReason: string | undefined;
    let recommendation: string | undefined;

    if (!qr) {
      status = "INVALID";
      message =
        "This verification code was not found in our system. Please double-check the code or scan the QR code again.";
      riskLevel = "HIGH";
      riskReason = "Unknown code";
      recommendation =
        "If you purchased this product recently, contact customer support to report a potential counterfeit.";

      const verifiedAt = now.toISOString();
      const fakeId =
        "inv_" +
        Math.random().toString(36).slice(2, 10) +
        Date.now().toString(36);

      const result: VerificationResult = {
        status,
        verificationId: fakeId,
        code,
        product: null,
        batch: null,
        verifiedAt,
        scanCount: 0,
        firstScannedAt: null,
        message,
        riskReason,
        recommendation,
      };

      return NextResponse.json(result, { status: 200 });
    }

    if (qr.status === "REVOKED") {
      status = "REVOKED";
      message =
        "This QR code has been revoked by the manufacturer. It is no longer valid for product verification.";
      riskLevel = "HIGH";
      riskReason = "Code revoked by manufacturer";
      recommendation =
        "Do not purchase or consume this product. Contact customer support immediately.";
    } else if (
      qr.status === "EXPIRED" ||
      (qr.expiresAt && qr.expiresAt < now)
    ) {
      status = "EXPIRED";
      message =
        "This verification code has expired. Product authenticity can no longer be confirmed through this code.";
      riskLevel = "MEDIUM";
      riskReason = "Code expired";
      recommendation =
        "Check the product packaging for a newer batch or contact the retailer for details.";
    } else if (qr.scanCount >= 1) {
      status = "SUSPICIOUS";
      message =
        "Unusual activity detected: this QR code has already been scanned before. While the product matches our records, multiple scans from different locations can indicate tampering or counterfeit reuse.";
      riskLevel = "MEDIUM";
      riskReason = `Previously scanned ${qr.scanCount} time(s)`;
      recommendation =
        "If you are the first and only owner of this product, contact customer support to investigate further.";
    } else {
      status = "VALID";
      message =
        "Product verified successfully. This is an authentic SEMEK product with a valid, first-time scan.";
      riskLevel = "LOW";
    }

    const updatedQr = await prisma.qRCode.update({
      where: { id: qr.id },
      data: {
        scanCount: { increment: 1 },
        firstScannedAt: qr.firstScannedAt ?? now,
        lastScannedAt: now,
      },
      include: { product: true, batch: true },
    });

    const scanEvent = await prisma.scanEvent.create({
      data: {
        codeId: qr.id,
        code,
        productId: qr.productId,
        batchId: qr.batchId ?? undefined,
        result: status as never,
        riskLevel: riskLevel as never,
      },
    });

    const result: VerificationResult = {
      status,
      verificationId: scanEvent.id,
      code,
      product: qr.product
        ? {
            id: qr.product.id,
            name: qr.product.name,
            type: qr.product.type,
            size: qr.product.size,
            sku: qr.product.sku,
            imageUrl: qr.product.imageUrl,
          }
        : null,
      batch: qr.batch
        ? {
            id: qr.batch.id,
            number: qr.batch.number,
            productionDate: qr.batch.productionDate.toISOString(),
            expiryDate: qr.batch.expiryDate?.toISOString() ?? null,
          }
        : null,
      verifiedAt: scanEvent.timestamp.toISOString(),
      scanCount: updatedQr.scanCount,
      firstScannedAt: updatedQr.firstScannedAt?.toISOString() ?? null,
      message,
      riskReason,
      recommendation,
    };

    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    console.error("[API /api/verify]", err);
    return NextResponse.json(
      {
        error:
          "We could not complete the verification right now. Please try again in a moment.",
      },
      { status: 500 },
    );
  }
}
