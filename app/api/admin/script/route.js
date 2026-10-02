import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { cookies } from "next/headers";
import { isValidSession } from "@/app/api/admin/auth/route";

const ADMIN_COOKIE_NAME = "dkk_admin_session";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;

    if (!isValidSession(token)) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const scriptPath = path.join(process.cwd(), "google-apps-script", "Code.gs");
    if (fs.existsSync(scriptPath)) {
      const code = fs.readFileSync(scriptPath, "utf8");
      return new NextResponse(code, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      });
    }

    return NextResponse.json({ error: "Script template file not found" }, { status: 404 });
  } catch (error) {
    console.error("Error reading script template:", error);
    return NextResponse.json({ error: "Failed to load script" }, { status: 500 });
  }
}
