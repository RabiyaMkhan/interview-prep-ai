import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = (session.user as any).id;

    const profile = await prisma.profile.findUnique({
      where: { userId },
      include: { user: { select: { name: true, email: true, image: true } } },
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    return NextResponse.json(profile);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = (session.user as any).id;
    const data = await req.json();

    const profile = await prisma.profile.upsert({
      where: { userId },
      update: {
        ...(data.targetJobRole !== undefined && { targetJobRole: data.targetJobRole }),
        ...(data.industry !== undefined && { industry: data.industry }),
        ...(data.experienceLevel !== undefined && { experienceLevel: data.experienceLevel }),
        ...(data.weeklyGoal !== undefined && { weeklyGoal: data.weeklyGoal }),
      },
      create: {
        userId,
        targetJobRole: data.targetJobRole,
        industry: data.industry,
        experienceLevel: data.experienceLevel,
        weeklyGoal: data.weeklyGoal || 3,
      },
    });

    if (data.name && data.name.trim()) {
      await prisma.user.update({ where: { id: userId }, data: { name: data.name.trim() } });
    }

    return NextResponse.json(profile);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
