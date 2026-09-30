import { NextResponse } from "next/server";
import { contactSchema } from "@/lib/validation";
import { sendContactFormToCompany } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = contactSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return NextResponse.json(
        { error: firstError?.message || "Please check the form and try again." },
        { status: 400 },
      );
    }

    void sendContactFormToCompany({
      fullName: parsed.data.fullName,
      email: parsed.data.email,
      phone: parsed.data.phone || undefined,
      subject: parsed.data.subject,
      message: parsed.data.message,
    }).catch(console.error);

    return NextResponse.json(
      {
        ok: true,
      },
      { status: 200 },
    );
  } catch (err) {
    console.error("[API /api/contact]", err);
    return NextResponse.json(
      {
        error:
          "We could not send your message right now. Please try again in a moment.",
      },
      { status: 500 },
    );
  }
}
