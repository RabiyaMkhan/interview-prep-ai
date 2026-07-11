import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateSessionReport } from "@/lib/ai";

export async function POST(req: Request, { params }: { params: { sessionId: string } }) {
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

    if (interviewSession.status === "completed") {
      return NextResponse.json({ error: "Session already completed" }, { status: 400 });
    }

    const answeredQuestions = interviewSession.questions.filter(q => q.answerText);

    if (answeredQuestions.length === 0) {
      return NextResponse.json({ error: "No answers to evaluate" }, { status: 400 });
    }

    const report = await generateSessionReport(
      answeredQuestions.map(q => ({
        question: q.questionText,
        answer: q.answerText || "",
        score: q.score || 0,
        feedback: q.aiFeedback || "",
      })),
      {
        jobRole: interviewSession.jobRole,
        interviewType: interviewSession.interviewType,
        difficulty: interviewSession.difficulty,
      }
    );

    await prisma.interviewSession.update({
      where: { id: params.sessionId },
      data: {
        status: "completed",
        overallScore: report.overallScore,
        summary: report.summary,
        completedAt: new Date(),
      },
    });

    await prisma.scoreHistory.create({
      data: {
        userId,
        sessionId: params.sessionId,
        overallScore: report.overallScore,
        clarityScore: report.clarityScore,
        relevanceScore: report.relevanceScore,
        confidenceScore: report.confidenceScore,
        structureScore: report.structureScore,
        technicalScore: report.technicalScore,
        jobRole: interviewSession.jobRole,
        interviewType: interviewSession.interviewType,
        difficulty: interviewSession.difficulty,
      },
    });

    // Check and award badges
    const totalSessions = await prisma.interviewSession.count({
      where: { userId, status: "completed" },
    });

    const badgesToCheck = [
      { name: "First Interview", requirement: "Complete your first interview", check: totalSessions >= 1 },
      { name: "5 Interviews Done", requirement: "Complete 5 interviews", check: totalSessions >= 5 },
      { name: "10 Interviews Done", requirement: "Complete 10 interviews", check: totalSessions >= 10 },
      { name: "25 Interviews Done", requirement: "Complete 25 interviews", check: totalSessions >= 25 },
      { name: "Score 90+", requirement: "Score 90 or above", check: report.overallScore >= 90 },
      { name: "Score 80+", requirement: "Score 80 or above", check: report.overallScore >= 80 },
      { name: "Perfect Score", requirement: "Score 100", check: report.overallScore >= 100 },
    ];

    for (const bc of badgesToCheck) {
      if (bc.check) {
        const badge = await prisma.badge.findFirst({ where: { name: bc.name } });
        if (badge) {
          await prisma.userBadge.upsert({
            where: { userId_badgeId: { userId, badgeId: badge.id } },
            create: { userId, badgeId: badge.id },
            update: {},
          });
        }
      }
    }

    // Update streak
    const profile = await prisma.profile.findUnique({ where: { userId } });
    if (profile) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const lastPractice = profile.lastPracticeDate;
      let newStreak = profile.currentStreak;

      if (lastPractice) {
        const lastDay = new Date(lastPractice);
        lastDay.setHours(0, 0, 0, 0);
        const diffDays = Math.floor((today.getTime() - lastDay.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          newStreak = profile.currentStreak + 1;
        } else if (diffDays > 1) {
          newStreak = 1;
        }
      } else {
        newStreak = 1;
      }

      await prisma.profile.update({
        where: { userId },
        data: { currentStreak: newStreak, lastPracticeDate: new Date() },
      });
    }

    return NextResponse.json({
      report,
      sessionId: params.sessionId,
    });
  } catch (error) {
    console.error("Session completion error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
