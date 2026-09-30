import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/auth";

export async function POST() {
  try {
    clearSessionCookie();
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Logout failed. Please try again." },
      { status: 500 }
    );
  }
}
