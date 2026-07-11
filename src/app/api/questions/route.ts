import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const QUESTION_BANK = [
  { questionText: "Tell me about yourself and your background.", category: "general", jobRole: "all", difficulty: "entry" },
  { questionText: "Why are you interested in this role?", category: "motivation", jobRole: "all", difficulty: "entry" },
  { questionText: "What are your greatest strengths?", category: "general", jobRole: "all", difficulty: "entry" },
  { questionText: "What is your biggest weakness?", category: "general", jobRole: "all", difficulty: "entry" },
  { questionText: "Describe a challenging project you worked on and how you handled it.", category: "behavioral", jobRole: "all", difficulty: "mid" },
  { questionText: "Tell me about a time you had a conflict with a coworker. How did you resolve it?", category: "behavioral", jobRole: "all", difficulty: "mid" },
  { questionText: "Where do you see yourself in 5 years?", category: "motivation", jobRole: "all", difficulty: "entry" },
  { questionText: "Why should we hire you for this position?", category: "general", jobRole: "all", difficulty: "entry" },
  { questionText: "Describe a time when you had to learn something quickly.", category: "behavioral", jobRole: "all", difficulty: "mid" },
  { questionText: "Tell me about a time you went above and beyond at work.", category: "behavioral", jobRole: "all", difficulty: "mid" },
  { questionText: "How do you handle pressure and tight deadlines?", category: "general", jobRole: "all", difficulty: "entry" },
  { questionText: "What experience do you have with our technology stack?", category: "technical", jobRole: "Software Engineer", difficulty: "mid" },
  { questionText: "Explain a complex technical concept to a non-technical person.", category: "technical", jobRole: "Software Engineer", difficulty: "entry" },
  { questionText: "How would you design a URL shortening service?", category: "technical", jobRole: "Software Engineer", difficulty: "senior" },
  { questionText: "What is your experience with agile methodologies?", category: "general", jobRole: "all", difficulty: "entry" },
  { questionText: "How do you prioritize tasks when managing multiple projects?", category: "general", jobRole: "Project Manager", difficulty: "mid" },
  { questionText: "Describe your experience with data visualization tools.", category: "technical", jobRole: "Data Analyst", difficulty: "mid" },
  { questionText: "How do you approach user research in your design process?", category: "technical", jobRole: "UX Designer", difficulty: "mid" },
  { questionText: "Walk me through your approach to developing a marketing strategy.", category: "technical", jobRole: "Marketing Manager", difficulty: "senior" },
  { questionText: "How do you handle rejection in sales?", category: "general", jobRole: "Sales Representative", difficulty: "entry" },
];

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const role = searchParams.get("role");
    const category = searchParams.get("category");
    const difficulty = searchParams.get("difficulty");
    const saved = searchParams.get("saved");

    const session = await getServerSession(authOptions);

    if (saved === "true" && session?.user) {
      const userId = (session.user as any).id;
      const savedQuestions = await prisma.savedQuestion.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json(savedQuestions);
    }

    let filtered = [...QUESTION_BANK];

    if (role && role !== "all") {
      filtered = filtered.filter(q => q.jobRole === "all" || q.jobRole === role);
    }
    if (category) {
      filtered = filtered.filter(q => q.category === category);
    }
    if (difficulty) {
      filtered = filtered.filter(q => q.difficulty === difficulty);
    }

    return NextResponse.json(filtered);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
