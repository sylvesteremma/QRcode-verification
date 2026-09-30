import { NextResponse } from "next/server";
import { getCurrentSession, requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { newsSchema } from "@/lib/validation";
import type { NewsPostJson } from "@/lib/types";

export async function GET(
  req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const post = await prisma.newsPost.findUnique({
      where: { id: params.id },
    });

    if (!post) {
      return NextResponse.json(
        { error: "News post not found." },
        { status: 404 },
      );
    }

    if (post.status !== "PUBLISHED") {
      const session = await getCurrentSession();
      const hierarchy: Record<string, number> = {
        AUDITOR: 1,
        OPERATIONS: 2,
        ADMIN: 3,
      };
      if (!session || hierarchy[session.role] < hierarchy["AUDITOR"]) {
        return NextResponse.json(
          { error: "News post not found." },
          { status: 404 },
        );
      }
    }

    const data: NewsPostJson = {
      id: post.id,
      slug: post.slug,
      title: post.title,
      excerpt: post.excerpt,
      content: post.content,
      featuredImageUrl: post.featuredImageUrl,
      status: post.status,
      authorName: post.authorName,
      publishedAt: post.publishedAt ? post.publishedAt.toISOString() : null,
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
    };

    return NextResponse.json(data);
  } catch (err) {
    const error = err as Error & { status?: number };
    const status = error.status ?? 500;
    const message =
      status === 401
        ? "Authentication required."
        : status === 403
          ? "Admin privileges required."
          : status === 404
            ? error.message
            : "Failed to retrieve news post.";
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  try {
    await requireAdmin("OPERATIONS");

    const existing = await prisma.newsPost.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "News post not found." },
        { status: 404 },
      );
    }

    const body = await req.json();
    const partialSchema = newsSchema.partial();
    const parsed = partialSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input: " + parsed.error.issues[0].message },
        { status: 400 },
      );
    }

    if (parsed.data.slug && parsed.data.slug !== existing.slug) {
      const slugTaken = await prisma.newsPost.findUnique({
        where: { slug: parsed.data.slug },
      });
      if (slugTaken) {
        return NextResponse.json(
          { error: "A post with this slug already exists." },
          { status: 409 },
        );
      }
    }

    const data = parsed.data;
    const updateData: any = {};

    if (data.title !== undefined) updateData.title = data.title;
    if (data.slug !== undefined) updateData.slug = data.slug;
    if (data.excerpt !== undefined) updateData.excerpt = data.excerpt;
    if (data.content !== undefined) updateData.content = data.content;
    if (data.featuredImageUrl !== undefined)
      updateData.featuredImageUrl = data.featuredImageUrl || undefined;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.authorName !== undefined)
      updateData.authorName = data.authorName || undefined;

    const currentStatus = data.status;
    if (currentStatus === "PUBLISHED") {
      if (data.publishedAt) {
        updateData.publishedAt = new Date(data.publishedAt);
      } else if (!existing.publishedAt) {
        updateData.publishedAt = new Date();
      }
    } else if (currentStatus !== undefined) {
      updateData.publishedAt = null;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update." },
        { status: 400 },
      );
    }

    const updated = await prisma.newsPost.update({
      where: { id: params.id },
      data: updateData,
    });

    const postJson: NewsPostJson = {
      id: updated.id,
      slug: updated.slug,
      title: updated.title,
      excerpt: updated.excerpt,
      content: updated.content,
      featuredImageUrl: updated.featuredImageUrl,
      status: updated.status,
      authorName: updated.authorName,
      publishedAt: updated.publishedAt
        ? updated.publishedAt.toISOString()
        : null,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };

    return NextResponse.json(postJson);
  } catch (err) {
    const error = err as Error & { status?: number };
    const status = error.status ?? 500;
    const message =
      status === 401
        ? "Authentication required."
        : status === 403
          ? "Admin privileges required."
          : status === 400 || status === 409 || status === 404
            ? error.message
            : "Failed to update news post.";
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } },
) {
  try {
    await requireAdmin("ADMIN");

    const existing = await prisma.newsPost.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "News post not found." },
        { status: 404 },
      );
    }

    await prisma.newsPost.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    const error = err as Error & { status?: number };
    const status = error.status ?? 500;
    const message =
      status === 401
        ? "Authentication required."
        : status === 403
          ? "Admin privileges required."
          : status === 404
            ? error.message
            : "Failed to delete news post.";
    return NextResponse.json({ error: message }, { status });
  }
}
