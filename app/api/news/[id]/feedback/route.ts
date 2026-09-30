import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { feedbackSchema } from "@/lib/validation";
import { sendFeedbackToCompany } from "@/lib/email";

type Params = { params: { id: string } };

export async function POST(request: Request, { params }: Params) {
  try {
    const { id: postId } = params;
    const body = await request.json();
    const parsed = feedbackSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return NextResponse.json(
        { error: firstError?.message || "Please check your feedback and try again." },
        { status: 400 },
      );
    }

    const newsPost = await prisma.newsPost.findUnique({
      where: { id: postId },
    });

    if (!newsPost) {
      return NextResponse.json(
        { error: "The article you are commenting on no longer exists." },
        { status: 404 },
      );
    }

    const feedback = await prisma.feedback.create({
      data: {
        newsPostId: postId,
        name: parsed.data.name,
        email: parsed.data.email,
        message: parsed.data.message,
        status: "PENDING" as never,
      },
    });

    void sendFeedbackToCompany({
      newsPostTitle: newsPost.title,
      name: parsed.data.name,
      email: parsed.data.email,
      message: parsed.data.message,
    }).catch(console.error);

    return NextResponse.json(
      {
        ok: true,
        status: "PENDING",
      },
      { status: 200 },
    );
  } catch (err) {
    console.error("[API /api/news/[id]/feedback]", err);
    return NextResponse.json(
      {
        error:
          "We could not submit your feedback right now. Please try again in a moment.",
      },
      { status: 500 },
    );
  }
}
