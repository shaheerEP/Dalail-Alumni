import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const ADMIN_COOKIE_NAME = "dkk_admin_session";

function getExpectedCredentials() {
  const username = process.env.ADMIN_USERNAME || "admin";
  const password = process.env.ADMIN_PASSWORD || "admin";
  return { username, password };
}

function generateSessionToken(username) {
  const payload = JSON.stringify({
    u: username,
    t: Date.now(),
    role: "admin",
  });
  return Buffer.from(payload).toString("base64");
}

export function isValidSession(token) {
  if (!token) return false;
  try {
    const raw = Buffer.from(token, "base64").toString("utf8");
    const parsed = JSON.parse(raw);
    const { username } = getExpectedCredentials();
    return parsed.u === username && parsed.role === "admin";
  } catch (e) {
    return false;
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { username, password } = body;
    const creds = getExpectedCredentials();

    if (username?.trim() === creds.username && password?.trim() === creds.password) {
      const token = generateSessionToken(creds.username);
      const cookieStore = await cookies();
      cookieStore.set(ADMIN_COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });

      return NextResponse.json({
        success: true,
        username: creds.username,
      });
    }

    return NextResponse.json(
      { error: "Invalid username or password." },
      { status: 401 }
    );
  } catch (error) {
    console.error("Admin login error:", error);
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
    const authenticated = isValidSession(token);
    const creds = getExpectedCredentials();

    return NextResponse.json({
      authenticated,
      username: authenticated ? creds.username : null,
    });
  } catch (error) {
    return NextResponse.json({ authenticated: false });
  }
}

export async function DELETE() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete(ADMIN_COOKIE_NAME);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Logout failed" }, { status: 500 });
  }
}
