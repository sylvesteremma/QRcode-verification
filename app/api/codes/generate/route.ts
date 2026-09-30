import { NextResponse } from "next/server";
import crypto from "crypto";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { codeGenerateSchema } from "@/lib/validation";
import { appConfig } from "@/lib/config";

const MAX_RETURNED_CODES = 200;

function generateOneCode(): string {
  const hex = crypto.randomBytes(12).toString("hex").toUpperCase();
  return `SMK-${hex}`;
}

function hashToken(code: string): string {
  const secret = process.env.QR_SIGNING_SECRET || "dev-secret";
  return crypto.createHmac("sha256", secret).update(code).digest("hex");
}

function buildQrUrl(code: string): string {
  const base = appConfig.apiUrl.replace(/\/+$/, "");
  return `${base}/qrcode?code=${encodeURIComponent(code)}`;
}

export async function POST(req: Request) {
  try {
    await requireAdmin("OPERATIONS");

    const body = await req.json();
    const parsed = codeGenerateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input: " + parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const productExists = await prisma.product.findUnique({
      where: { id: parsed.data.productId },
    });
    if (!productExists) {
      return NextResponse.json(
        { error: "The specified product does not exist." },
        { status: 404 }
      );
    }

    const batchExists = await prisma.batch.findUnique({
      where: { id: parsed.data.batchId },
    });
    if (!batchExists) {
      return NextResponse.json(
        { error: "The specified batch does not exist." },
        { status: 404 }
      );
    }

    if (batchExists.productId !== parsed.data.productId) {
      return NextResponse.json(
        { error: "The specified batch does not belong to this product." },
        { status: 400 }
      );
    }

    let expiresAt: Date | null = null;
    if (parsed.data.expiresAt) {
      expiresAt = new Date(parsed.data.expiresAt);
      if (Number.isNaN(expiresAt.getTime())) {
        return NextResponse.json(
          { error: "Invalid expiresAt date format." },
          { status: 400 }
        );
      }
    }

    const quantity = parsed.data.quantity;
    const seen = new Set<string>();
    const attemptsPerCode = 10;
    const codeData: Array<{
      code: string;
      tokenHash: string;
      productId: string;
      batchId: string;
      expiresAt: Date | null;
    }> = [];

    for (let i = 0; i < quantity; i++) {
      let code = "";
      let found = false;
      for (let j = 0; j < attemptsPerCode; j++) {
        code = generateOneCode();
        if (!seen.has(code)) {
          seen.add(code);
          found = true;
          break;
        }
      }
      if (!found) {
        break;
      }
      codeData.push({
        code,
        tokenHash: hashToken(code),
        productId: parsed.data.productId,
        batchId: parsed.data.batchId,
        expiresAt,
      });
    }

    let createdCount = 0;
    if (codeData.length > 0) {
      const result = await prisma.qRCode.createMany({
        data: codeData,
        skipDuplicates: true,
      });
      createdCount = result.count;
    }

    if (createdCount > 0 && parsed.data.batchId) {
      await prisma.batch.update({
        where: { id: parsed.data.batchId },
        data: {
          generatedCodes: {
            increment: createdCount,
          },
        },
      });
    }

    const returnedCodes = codeData
      .slice(0, Math.min(MAX_RETURNED_CODES, createdCount))
      .map(({ code }) => ({
        code,
        qrUrl: buildQrUrl(code),
      }));

    return NextResponse.json(
      { count: createdCount, codes: returnedCodes },
      { status: 201 }
    );
  } catch (err) {
    const error = err as Error & { status?: number };
    const status = error.status ?? 500;
    const message =
      status === 401
        ? "Authentication required."
        : status === 403
        ? "OPERATIONS privileges required."
        : status === 400 || status === 404
        ? error.message
        : "Failed to generate QR codes.";
    return NextResponse.json({ error: message }, { status });
  }
}
