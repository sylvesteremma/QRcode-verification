import { NextResponse } from "next/server";
import { getCurrentSession, requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { newsSchema } from "@/lib/validation";
import type { NewsPostJson, Paginated } from "@/lib/types";

export async function GET(req: Request) {
  try {
    const session = await getCurrentSession();
    const hierarchy: Record<string, number> = {
      AUDITOR: 1,
      OPERATIONS: 2,
      ADMIN: 3,
    };
    const canViewDrafts = session
      ? hierarchy[session.role] >= hierarchy["AUDITOR"]
      : false;

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const pageSize = Math.max(
      1,
      Math.min(100, parseInt(searchParams.get("pageSize") ?? "20", 10)),
    );
    const search = searchParams.get("search")?.trim() ?? "";

    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (!canViewDrafts) {
      where.status = "PUBLISHED";
    }
    if (search) {
      where.title = { contains: search, mode: "insensitive" as const };
    }

    const [posts, total] = await Promise.all([
      prisma.newsPost.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: "desc" },
      }),
      prisma.newsPost.count({ where }),
    ]);

    const data: NewsPostJson[] = posts.map((p: any) => ({
      id: p.id,
      slug: p.slug,
      title: p.title,
      excerpt: p.excerpt,
      content: p.content,
      featuredImageUrl: p.featuredImageUrl,
      status: p.status,
      authorName: p.authorName,
      publishedAt: p.publishedAt ? p.publishedAt.toISOString() : null,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    }));

    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    const response: Paginated<NewsPostJson> = {
      data,
      page,
      pageSize,
      total,
      totalPages,
    };

    return NextResponse.json(response);
  } catch (err) {
    const error = err as Error & { status?: number };
    const status = error.status ?? 500;
    const message =
      status === 401
        ? "Authentication required."
        : status === 403
          ? "Admin privileges required."
          : "Failed to retrieve news posts.";
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(req: Request) {
  try {
    await requireAdmin("OPERATIONS");

    const body = await req.json();
    const parsed = newsSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input: " + parsed.error.issues[0].message },
        { status: 400 },
      );
    }

    const existingSlug = await prisma.newsPost.findUnique({
      where: { slug: parsed.data.slug },
    });

    if (existingSlug) {
      return NextResponse.json(
        { error: "A post with this slug already exists." },
        { status: 409 },
      );
    }

    const data = parsed.data;
    let publishedAt: Date | null | undefined = undefined;
    if (data.status === "PUBLISHED" && data.publishedAt) {
      publishedAt = new Date(data.publishedAt);
    } else if (data.status === "PUBLISHED" && !data.publishedAt) {
      publishedAt = new Date();
    }

    const created = await prisma.newsPost.create({
      data: {
        title: data.title,
        slug: data.slug,
        excerpt: data.excerpt,
        content: data.content,
        featuredImageUrl: data.featuredImageUrl || undefined,
        status: data.status,
        authorName: data.authorName || undefined,
        publishedAt,
      },
    });

    const postJson: NewsPostJson = {
      id: created.id,
      slug: created.slug,
      title: created.title,
      excerpt: created.excerpt,
      content: created.content,
      featuredImageUrl: created.featuredImageUrl,
      status: created.status,
      authorName: created.authorName,
      publishedAt: created.publishedAt
        ? created.publishedAt.toISOString()
        : null,
      createdAt: created.createdAt.toISOString(),
      updatedAt: created.updatedAt.toISOString(),
    };

    return NextResponse.json({ post: postJson }, { status: 201 });
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
            : "Failed to create news post.";
    return NextResponse.json({ error: message }, { status });
  }
}
