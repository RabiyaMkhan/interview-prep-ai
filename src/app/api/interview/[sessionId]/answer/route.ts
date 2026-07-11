import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateQuestion, generateFeedback, generateFollowUp, type InterviewContext } from "@/lib/ai";

export async function POST(req: Request, { params }: { params: { sessionId: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = (session.user as any).id;

    const interviewSession = await prisma.interviewSession.findUnique({
      where: { id: params.sessionId },
    });

    if (!interviewSession || interviewSession.userId !== userId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (interviewSession.status === "completed") {
      return NextResponse.json({ error: "Session already completed" }, { status: 400 });
    }

    const body = await req.json();
    const { answer, questionId, isVoiceInput } = body;

    const durationMap: Record<string, number> = { quick: 5, standard: 10, full: 15 };
    const totalNeeded = durationMap[interviewSession.duration] || 10;

    let savedFeedback = null;

    if (questionId && answer) {
      const context = {
        interviewType: interviewSession.interviewType,
        jobRole: interviewSession.jobRole,
        difficulty: interviewSession.difficulty,
      };

      const existingQuestion = await prisma.question.findFirst({ where: { id: questionId, sessionId: params.sessionId } });
      if (!existingQuestion) {
        return NextResponse.json({ error: "Question not found in this session" }, { status: 404 });
      }

      const fb = await generateFeedback(
        existingQuestion?.questionText || "",
        answer,
        context
      );

      await prisma.question.update({
        where: { id: existingQuestion.id },
        data: {
          answerText: answer,
          isVoiceInput: isVoiceInput || false,
          aiFeedback: fb.feedback,
          score: fb.score,
          strengths: fb.strengths,
          improvements: fb.improvements,
          suggestedAnswer: fb.suggestedAnswer,
          fillerWords: JSON.stringify(fb.fillerWords),
        },
      });

      savedFeedback = fb;

      const followUp = await generateFollowUp(
        existingQuestion?.questionText || "",
        answer,
        context
      );

      if (followUp.shouldFollowUp) {
        const freshCount = await prisma.question.count({ where: { sessionId: params.sessionId } });
        if (freshCount < totalNeeded + 2) {
          const followUpQ = await prisma.question.create({
            data: {
              sessionId: params.sessionId,
              questionText: followUp.followUpQuestion,
              questionType: "follow_up",
              orderIndex: freshCount,
            },
          });
          return NextResponse.json({
            feedback: savedFeedback,
            nextQuestion: { id: followUpQ.id, text: followUp.followUpQuestion, type: "follow_up" },
          });
        }
      }
    }

    const freshCount = await prisma.question.count({ where: { sessionId: params.sessionId } });

    if (freshCount >= totalNeeded) {
      return NextResponse.json({
        feedback: savedFeedback,
        nextQuestion: null,
        sessionComplete: true,
      });
    }

    const allQuestions = await prisma.question.findMany({
      where: { sessionId: params.sessionId },
      orderBy: { orderIndex: "asc" },
    });

    const conversationHistory: { role: "user" | "assistant" | "system"; content: string }[] = [];
    for (const q of allQuestions) {
      conversationHistory.push({ role: "assistant", content: q.questionText });
      if (q.answerText) {
        conversationHistory.push({ role: "user", content: q.answerText });
      }
    }

    const aiContext: InterviewContext = {
      jobRole: interviewSession.jobRole,
      interviewType: interviewSession.interviewType,
      difficulty: interviewSession.difficulty,
      jobDescription: interviewSession.jobDescription || undefined,
      resumeText: interviewSession.resumeText || undefined,
      conversationHistory,
      questionNumber: freshCount + 1,
      totalQuestions: totalNeeded,
    };

    const questionText = await generateQuestion(aiContext);

    const newQuestion = await prisma.question.create({
      data: {
        sessionId: params.sessionId,
        questionText,
        questionType: interviewSession.interviewType,
        orderIndex: freshCount,
      },
    });

    return NextResponse.json({
      feedback: savedFeedback,
      nextQuestion: { id: newQuestion.id, text: questionText, type: interviewSession.interviewType },
    });
  } catch (error) {
    console.error("Answer submission error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
