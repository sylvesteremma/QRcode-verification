import { NextResponse } from "next/server";
import { hashPassword, requireAdmin, serializeUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { adminUserSchema } from "@/lib/validation";
import type { AdminUserJson, Paginated } from "@/lib/types";

export async function GET(req: Request) {
  try {
    await requireAdmin("ADMIN");

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const pageSize = Math.max(
      1,
      Math.min(100, parseInt(searchParams.get("pageSize") ?? "20", 10))
    );
    const search = searchParams.get("search")?.trim() ?? "";

    const skip = (page - 1) * pageSize;

    const where = search
      ? {
          OR: [
            { email: { contains: search, mode: "insensitive" as const } },
            { fullName: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : undefined;

    const [users, total] = await Promise.all([
      prisma.adminUser.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: "desc" },
      }),
      prisma.adminUser.count({ where }),
    ]);

    const data: AdminUserJson[] = users.map((u) => {
      const s = serializeUser(u);
      return {
        id: s.id,
        email: s.email,
        fullName: s.fullName,
        role: s.role,
        status: s.status,
        lastLoginAt: s.lastLoginAt ? s.lastLoginAt.toISOString() : null,
        createdAt: s.createdAt.toISOString(),
        updatedAt: s.updatedAt.toISOString(),
      };
    });

    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    const result: Paginated<AdminUserJson> = {
      data,
      page,
      pageSize,
      total,
      totalPages,
    };

    return NextResponse.json(result);
  } catch (err) {
    const error = err as Error & { status?: number };
    const status = error.status ?? 500;
    const message =
      status === 401
        ? "Authentication required."
        : status === 403
        ? "Admin privileges required."
        : "Failed to retrieve users.";
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(req: Request) {
  try {
    await requireAdmin("ADMIN");

    const body = await req.json();
    const parsed = adminUserSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input: " + parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const existing = await prisma.adminUser.findUnique({
      where: { email: parsed.data.email },
    });

    if (existing) {
      return NextResponse.json(
        { error: "A user with this email already exists." },
        { status: 409 }
      );
    }

    const password = parsed.data.password?.trim();
    if (!password) {
      return NextResponse.json(
        { error: "Password is required when creating a user." },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(password);

    const created = await prisma.adminUser.create({
      data: {
        fullName: parsed.data.fullName,
        email: parsed.data.email,
        passwordHash,
        role: parsed.data.role,
        status: parsed.data.status,
      },
    });

    const s = serializeUser(created);
    const userJson: AdminUserJson = {
      id: s.id,
      email: s.email,
      fullName: s.fullName,
      role: s.role,
      status: s.status,
      lastLoginAt: s.lastLoginAt ? s.lastLoginAt.toISOString() : null,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    };

    return NextResponse.json({ user: userJson }, { status: 201 });
  } catch (err) {
    const error = err as Error & { status?: number };
    const status = error.status ?? 500;
    const message =
      status === 401
        ? "Authentication required."
        : status === 403
        ? "Admin privileges required."
        : status === 400 || status === 409
        ? error.message
        : "Failed to create user.";
    return NextResponse.json({ error: message }, { status });
  }
}
