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
    const { questionText, category, jobRole, difficulty } = await req.json();

    const existing = await prisma.savedQuestion.findFirst({
      where: { userId, questionText },
    });

    if (existing) {
      return NextResponse.json({ message: "Already saved", id: existing.id });
    }

    const saved = await prisma.savedQuestion.create({
      data: { userId, questionText, category, jobRole, difficulty },
    });

    return NextResponse.json(saved);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
