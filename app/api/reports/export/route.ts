import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function escapeCsvField(value: any): string {
  const str = value === null || value === undefined ? "" : String(value);
  if (
    str.includes(",") ||
    str.includes('"') ||
    str.includes("\n") ||
    str.includes("\r")
  ) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

function buildCsv(headers: string[], rows: any[][]): string {
  const lines = [
    headers.map(escapeCsvField).join(","),
    ...rows.map((row) => row.map(escapeCsvField).join(",")),
  ];
  return lines.join("\r\n");
}

export async function GET(req: Request) {
  try {
    await requireAdmin("AUDITOR");

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type")?.trim();

    if (!type || !["scans", "complaints", "products"].includes(type)) {
      return NextResponse.json(
        {
          error:
            "Invalid export type. Must be 'scans', 'complaints', or 'products'.",
        },
        { status: 400 },
      );
    }

    let csv = "";
    let filename = "";

    if (type === "scans") {
      const scans = await prisma.scanEvent.findMany({
        take: 1000,
        orderBy: { timestamp: "desc" },
        include: {
          product: { select: { name: true } },
          batch: { select: { number: true } },
        },
      });

      const headers = [
        "ID",
        "Timestamp",
        "Code",
        "Product ID",
        "Product Name",
        "Batch ID",
        "Batch Number",
        "Result",
        "Risk Level",
        "Country",
        "City",
        "Device Type",
      ];

      const rows = scans.map((s: any) => [
        s.id,
        s.timestamp.toISOString(),
        s.code,
        s.productId,
        s.product?.name ?? "",
        s.batchId ?? "",
        s.batch?.number ?? "",
        s.result,
        s.riskLevel ?? "",
        s.country ?? "",
        s.city ?? "",
        s.deviceType ?? "",
      ]);

      csv = buildCsv(headers, rows);
      filename = `scans-${new Date().toISOString().slice(0, 10)}.csv`;
    } else if (type === "complaints") {
      const complaints = await prisma.complaint.findMany({
        take: 1000,
        orderBy: { submittedAt: "desc" },
      });

      const headers = [
        "ID",
        "Reference",
        "Full Name",
        "Email",
        "Phone",
        "Category",
        "Subject",
        "Message",
        "Product ID",
        "Batch Number",
        "Verification Code",
        "Status",
        "Status Message",
        "Submitted At",
        "Last Updated At",
      ];

      const rows = complaints.map((c: any) => [
        c.id,
        c.reference,
        c.fullName,
        c.email,
        c.phone ?? "",
        c.category,
        c.subject,
        c.message,
        c.productId ?? "",
        c.batchNumber ?? "",
        c.verificationCode ?? "",
        c.status,
        c.statusMessage ?? "",
        c.submittedAt.toISOString(),
        c.lastUpdatedAt.toISOString(),
      ]);

      csv = buildCsv(headers, rows);
      filename = `complaints-${new Date().toISOString().slice(0, 10)}.csv`;
    } else if (type === "products") {
      const products = await prisma.product.findMany({
        take: 1000,
        orderBy: { createdAt: "desc" },
      });

      const headers = [
        "ID",
        "Name",
        "Type",
        "Size",
        "SKU",
        "Description",
        "Image URL",
        "Status",
        "Created At",
        "Updated At",
      ];

      const rows = products.map((p: any) => [
        p.id,
        p.name,
        p.type,
        p.size ?? "",
        p.sku,
        p.description ?? "",
        p.imageUrl ?? "",
        p.status,
        p.createdAt.toISOString(),
        p.updatedAt.toISOString(),
      ]);

      csv = buildCsv(headers, rows);
      filename = `products-${new Date().toISOString().slice(0, 10)}.csv`;
    }

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    const error = err as Error & { status?: number };
    const status = error.status ?? 500;
    const message =
      status === 401
        ? "Authentication required."
        : status === 403
          ? "Admin privileges required."
          : status === 400
            ? error.message
            : "Failed to generate export.";
    return NextResponse.json({ error: message }, { status });
  }
}
