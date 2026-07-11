import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = (session.user as any).id;

    const existing = await prisma.savedQuestion.findUnique({ where: { id: params.id } });
    if (!existing || existing.userId !== userId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const { score } = await req.json();
    const numScore = typeof score === "number" ? Math.min(Math.max(score, 0), 100) : null;

    const saved = await prisma.savedQuestion.update({
      where: { id: params.id },
      data: {
        attempts: { increment: 1 },
        ...(numScore !== null && {
          bestScore: Math.max(numScore, existing.bestScore ?? 0),
          isMastered: (numScore >= 80 || existing.isMastered) ? true : undefined,
        }),
      },
    });

    return NextResponse.json(saved);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
