import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = (session.user as any).id;

    const formData = await req.formData();
    const file = formData.get("resume") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large. Maximum size is 5MB." }, { status: 400 });
    }

    let text = "";

    if (file.type === "text/plain" || file.name.endsWith(".txt")) {
      text = await file.text();
    } else if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
      text = "[PDF uploaded - please paste your resume content as text for best results]";
    } else {
      return NextResponse.json({ error: "Unsupported file type. Please upload PDF or TXT." }, { status: 400 });
    }

    await prisma.profile.upsert({
      where: { userId },
      update: { resumeText: text },
      create: { userId, resumeText: text },
    });

    return NextResponse.json({ text, filename: file.name });
  } catch (error) {
    console.error("Resume upload error:", error);
    return NextResponse.json({ error: "Internal server server error" }, { status: 500 });
  }
}
