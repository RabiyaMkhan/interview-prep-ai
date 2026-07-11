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

    const { jobRole, interviewType, difficulty, duration, jobDescription } = await req.json();

    if (!jobRole || !interviewType || !difficulty || !duration) {
      return NextResponse.json({ error: "All fields required" }, { status: 400 });
    }

    const profile = await prisma.profile.findUnique({ where: { userId } });
    const resumeText = profile?.resumeText || null;

    const interviewSession = await prisma.interviewSession.create({
      data: {
        userId,
        jobRole,
        interviewType,
        difficulty,
        duration,
        jobDescription: jobDescription || null,
        resumeText,
      },
    });

    return NextResponse.json({ sessionId: interviewSession.id });
  } catch (error) {
    console.error("Interview creation error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = (session.user as any).id;

    const sessions = await prisma.interviewSession.findMany({
      where: { userId },
      include: { questions: true },
      orderBy: { startedAt: "desc" },
    });

    return NextResponse.json(sessions);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
