import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: { sessionId: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = (session.user as any).id;

    const interviewSession = await prisma.interviewSession.findUnique({
      where: { id: params.sessionId },
      include: { questions: { orderBy: { orderIndex: "asc" } } },
    });

    if (!interviewSession || interviewSession.userId !== userId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const scoreData = await prisma.scoreHistory.findFirst({
      where: { sessionId: params.sessionId },
    });

    return NextResponse.json({ ...interviewSession, scoreHistory: scoreData ? [scoreData] : [] });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
