import { NextResponse } from "next/server";
import { loginAdmin } from "@/lib/auth";
import { loginSchema } from "@/lib/validation";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input: " + parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const user = await loginAdmin(parsed.data.email, parsed.data.password);
    return NextResponse.json({ user });
  } catch (err) {
    const error = err as Error & { status?: number };
    const status = error.status ?? 500;
    const message =
      status === 401 || status === 403
        ? error.message
        : "Login failed. Please try again.";
    return NextResponse.json({ error: message }, { status });
  }
}
