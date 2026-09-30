/* =============================================================================
   SEMEK QR Verification — Database Seed
   -----------------------------------------------------------------------------
   Seeds the first super-admin with the credentials from env vars, a couple
   of sample products, batches, a few QR codes, sample news and the necessary
   skeleton data so the dashboard is usable on first run.
   ============================================================================= */

import {
  PrismaClient,
  AdminRole,
  ProductStatus,
  BatchStatus,
  NewsStatus,
} from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const prisma = new PrismaClient();

async function main() {
  console.log("[SEED] Starting database seed...");

  const adminEmail = process.env.INITIAL_ADMIN_EMAIL || "admin@semek.com";
  const adminName = process.env.INITIAL_ADMIN_NAME || "Super Admin";
  const adminPassword =
    process.env.INITIAL_ADMIN_PASSWORD || "change-me-please";
  const passwordHash = await bcrypt.hash(adminPassword, 10);

  const existing = await prisma.adminUser.findUnique({
    where: { email: adminEmail },
  });
  if (existing) {
    console.log(`[SEED] Admin user ${adminEmail} already exists — skipping.`);
  } else {
    await prisma.adminUser.create({
      data: {
        email: adminEmail,
        fullName: adminName,
        passwordHash,
        role: AdminRole.ADMIN,
      },
    });
    console.log(`[SEED] Created super-admin: ${adminEmail}`);
  }

  const tableWater = await prisma.product.upsert({
    where: { sku: "SEMEK-TW-75" },
    update: {},
    create: {
      name: "SEMEK Premium Table Water",
      type: "Table Water",
      size: "75cl",
      sku: "SEMEK-TW-75",
      description: "Premium purified table water in a 75cl bottle.",
      status: ProductStatus.ACTIVE,
    },
  });

  const sachetWater = await prisma.product.upsert({
    where: { sku: "SEMEK-SW-500" },
    update: {},
    create: {
      name: "SEMEK Sachet Water",
      type: "Sachet Water",
      size: "500ml",
      sku: "SEMEK-SW-500",
      description: "Pure drinking water in a hygienic 500ml sachet.",
      status: ProductStatus.ACTIVE,
    },
  });

  const now = new Date();
  const productionDate = new Date();
  productionDate.setDate(productionDate.getDate() - 14);
  const expiryDate = new Date();
  expiryDate.setFullYear(expiryDate.getFullYear() + 1);

  const batchA = await prisma.batch.upsert({
    where: { number: "BATCH-2026-001" },
    update: {},
    create: {
      number: "BATCH-2026-001",
      productId: tableWater.id,
      productionDate,
      expiryDate,
      quantity: 10000,
      generatedCodes: 2,
      status: BatchStatus.ACTIVE,
    },
  });

  const makeCode = () => {
    const r = crypto.randomBytes(12).toString("hex").toUpperCase();
    return `SMK-${r}`;
  };

  const code1 = makeCode();
  const code2 = makeCode();
  const hash1 = crypto
    .createHmac("sha256", process.env.QR_SIGNING_SECRET || "dev-secret")
    .update(code1)
    .digest("hex");
  const hash2 = crypto
    .createHmac("sha256", process.env.QR_SIGNING_SECRET || "dev-secret")
    .update(code2)
    .digest("hex");

  await prisma.qRCode.upsert({
    where: { code: code1 },
    update: {},
    create: {
      code: code1,
      tokenHash: hash1,
      productId: tableWater.id,
      batchId: batchA.id,
    },
  });

  await prisma.qRCode.upsert({
    where: { code: code2 },
    update: {},
    create: {
      code: code2,
      tokenHash: hash2,
      productId: sachetWater.id,
      batchId: batchA.id,
    },
  });

  await prisma.newsPost.upsert({
    where: { slug: "welcome-to-semek" },
    update: {},
    create: {
      slug: "welcome-to-semek",
      title: "Welcome to the SEMEK Verification Platform",
      excerpt:
        "Introducing our new QR-based verification system — giving every customer the power to verify product authenticity.",
      content:
        "At SEMEK, the safety and trust of our customers come first. Our new verification platform lets you scan any SEMEK product QR code and receive an instant, authoritative authenticity result directly from our secure systems.\n\nWe produce both table water and sachet water to the highest standards. Every batch is tracked and every product is uniquely identified.\n\nIf you ever have questions about a product, please contact us. We are here to help.",
      status: NewsStatus.PUBLISHED,
      authorName: adminName,
      publishedAt: now,
    },
  });

  await prisma.newsPost.upsert({
    where: { slug: "product-authenticity-tips" },
    update: {},
    create: {
      slug: "product-authenticity-tips",
      title: "5 Quick Tips To Spot Genuine SEMEK Products",
      excerpt:
        "From packaging seals to QR verification — here is everything you need to confirm that your SEMEK product is real.",
      content:
        "1. Check the seal — tamper-evident seals should be intact.\n2. Read the label — spelling mistakes, blurry logos or incorrect sizes are red flags.\n3. Scan the QR — always scan to receive our official verification result.\n4. Buy from authorised distributors — avoid questionable sources.\n5. Report anything suspicious — we investigate every report personally.",
      status: NewsStatus.PUBLISHED,
      authorName: adminName,
      publishedAt: now,
    },
  });

  console.log("[SEED] Seed complete.");
  console.log(
    `[SEED] Sample QR codes: ${code1}, ${code2} (use these to test verification)`,
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
