import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const SEED_BADGES = [
  { name: "First Interview", description: "Complete your first interview", category: "milestone", requirement: "complete_1", icon: "trophy" },
  { name: "5 Interviews Done", description: "Complete 5 interviews", category: "milestone", requirement: "complete_5", icon: "trophy" },
  { name: "10 Interviews Done", description: "Complete 10 interviews", category: "milestone", requirement: "complete_10", icon: "trophy" },
  { name: "25 Interviews Done", description: "Complete 25 interviews", category: "milestone", requirement: "complete_25", icon: "trophy" },
  { name: "Score 80+", description: "Score 80 or above in an interview", category: "performance", requirement: "score_80", icon: "star" },
  { name: "Score 90+", description: "Score 90 or above in an interview", category: "performance", requirement: "score_90", icon: "star" },
  { name: "Perfect Score", description: "Score 100 in an interview", category: "performance", requirement: "score_100", icon: "star" },
  { name: "Streak Master", description: "7-day practice streak", category: "consistency", requirement: "streak_7", icon: "flame" },
];

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = (session.user as any).id;

    // Seed badges safely using upsert
    for (const badge of SEED_BADGES) {
      try {
        await prisma.badge.upsert({
          where: { name: badge.name },
          create: badge,
          update: {},
        });
      } catch { /* already exists */ }
    }

    const allBadges = await prisma.badge.findMany({ orderBy: { name: "asc" } });
    const userBadges = await prisma.userBadge.findMany({
      where: { userId },
      include: { badge: true },
    });

    const earnedBadgeIds = new Set(userBadges.map(ub => ub.badgeId));
    const earnedAtMap = new Map(userBadges.map(ub => [ub.badgeId, ub.earnedAt]));

    const result = allBadges.map(badge => ({
      ...badge,
      earned: earnedBadgeIds.has(badge.id),
      earnedAt: earnedAtMap.get(badge.id) || null,
    }));

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
