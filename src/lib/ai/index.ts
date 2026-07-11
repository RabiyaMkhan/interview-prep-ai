let anthropic: any = null;

async function getAnthropic() {
  if (!anthropic && process.env.ANTHROPIC_API_KEY) {
    try {
      const sdk = await import("@anthropic-ai/sdk");
      const Anthropic = sdk.default || sdk;
      anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    } catch { /* fallback */ }
  }
  return anthropic;
}

function hasApiKey(): boolean {
  return !!(process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY.length > 10);
}

export interface InterviewContext {
  jobRole: string;
  interviewType: string;
  difficulty: string;
  jobDescription?: string;
  resumeText?: string;
  conversationHistory: { role: "user" | "assistant" | "system"; content: string }[];
  questionNumber: number;
  totalQuestions: number;
}

const FALLBACK_QUESTIONS: Record<string, Record<string, string[]>> = {
  general: {
    entry: [
      "Tell me about yourself and your background.",
      "Why are you interested in this role?",
      "What are your greatest strengths?",
      "What is your biggest weakness?",
      "Where do you see yourself in 5 years?",
      "Why should we hire you for this position?",
      "Tell me about a time you had to learn something new quickly.",
      "How do you handle pressure and tight deadlines?",
      "What motivates you in your work?",
      "Describe your ideal work environment.",
    ],
    mid: [
      "Walk me through your career progression so far.",
      "Tell me about a challenging project you led. What was your approach?",
      "How do you prioritize tasks when managing multiple projects?",
      "Describe a time you had to influence without authority.",
      "What's the biggest lesson you've learned in your career so far?",
      "Tell me about a time you failed. How did you recover?",
      "How do you stay updated with industry trends?",
      "Describe a situation where you had to adapt to significant change.",
      "How do you approach mentoring junior team members?",
      "What unique value do you bring to a team?",
    ],
    senior: [
      "How would you describe your leadership style?",
      "Tell me about a time you had to make a difficult strategic decision.",
      "How do you balance stakeholder expectations with team capacity?",
      "Describe a situation where you had to drive organizational change.",
      "How do you approach building and scaling a team?",
      "Tell me about your experience with budget management.",
      "How do you handle disagreements with senior leadership?",
      "What's your approach to knowledge transfer and succession planning?",
      "Describe a time you had to pivot your strategy mid-execution.",
      "How do you measure success in your role?",
    ],
  },
  behavioral: {
    entry: [
      "Tell me about a time you worked as part of a team to accomplish a goal.",
      "Describe a situation where you went above and beyond at work.",
      "Tell me about a time you had to deal with a difficult colleague.",
      "Give an example of when you showed initiative.",
      "Tell me about a time you had to manage competing priorities.",
      "Describe a situation where you had to adapt to a new situation quickly.",
      "Tell me about a time you received constructive criticism. How did you respond?",
      "Give an example of when you had to solve a problem creatively.",
      "Tell me about a time you had to explain something complex to someone.",
      "Describe a situation where you had to meet a tight deadline.",
    ],
    mid: [
      "Tell me about a time you led a project from start to finish.",
      "Describe a situation where you had to resolve a conflict in your team.",
      "Tell me about a time you had to make a decision with incomplete information.",
      "Give an example of when you improved a process significantly.",
      "Tell me about a time you had to push back on a request. How did you handle it?",
      "Describe a situation where you had to collaborate across departments.",
      "Tell me about a time you had to manage a difficult stakeholder.",
      "Give an example of when you mentored someone successfully.",
      "Tell me about a time you identified and solved a problem no one else noticed.",
      "Describe a situation where you had to balance quality with speed.",
    ],
    senior: [
      "Tell me about a time you transformed a team's performance.",
      "Describe a situation where you had to make an unpopular decision for the greater good.",
      "Tell me about a time you had to navigate office politics to achieve a goal.",
      "Give an example of when you built a high-performing team from scratch.",
      "Tell me about a time you had to manage a crisis situation.",
      "Describe a situation where you had to influence C-level executives.",
      "Tell me about a time you had to let someone go. How did you handle it?",
      "Give an example of when you drove innovation in your organization.",
      "Tell me about a time you had to balance competing business priorities.",
      "Describe how you've built a culture of accountability in your team.",
    ],
  },
  technical: {
    entry: [
      "Explain a technical concept you recently learned to someone non-technical.",
      "Walk me through your approach to debugging a problem you've never seen before.",
      "How do you ensure code quality in your work?",
      "Describe a technical project you're most proud of and why.",
      "How do you approach learning new technologies?",
      "What's your experience with version control systems?",
      "How do you handle technical debt?",
      "Describe your approach to writing documentation.",
      "What development methodologies have you worked with?",
      "How do you approach testing in your projects?",
    ],
    mid: [
      "Describe a time you had to optimize a system for better performance.",
      "How do you approach system design decisions?",
      "Tell me about a technical challenge you recently overcame.",
      "How do you balance technical excellence with business requirements?",
      "Describe your approach to code reviews.",
      "How do you handle disagreements about technical approaches?",
      "Tell me about a time you had to migrate a legacy system.",
      "How do you approach scalability in your designs?",
      "Describe your experience with monitoring and observability.",
      "How do you evaluate and introduce new tools to your team?",
    ],
    senior: [
      "How do you approach architectural decisions for complex systems?",
      "Describe a time you had to redesign a critical system under pressure.",
      "How do you balance innovation with stability in production systems?",
      "Tell me about your approach to technical strategy and roadmapping.",
      "How do you ensure your team follows best practices at scale?",
      "Describe a time you had to make a build-vs-buy decision.",
      "How do you approach disaster recovery planning?",
      "Tell me about a time you had to resolve a major production incident.",
      "How do you evaluate technical risk in project planning?",
      "Describe your approach to building a technical culture.",
    ],
  },
  hr: {
    entry: [
      "Why do you want to work at our company?",
      "What do you know about our company?",
      "How would your previous manager describe you?",
      "What are your salary expectations?",
      "Are you comfortable working overtime when needed?",
      "Where do you see yourself in 3 years?",
      "What questions do you have for us?",
      "How do you handle stress outside of work?",
      "What would your coworkers say about you?",
      "Do you have any other offers?",
    ],
    mid: [
      "Why are you looking to leave your current position?",
      "How do you handle work-life balance?",
      "What's the most important thing you're looking for in your next role?",
      "How would you handle a situation where your values conflict with company policy?",
      "Describe your management style preference.",
      "What's your approach to professional development?",
      "How do you handle feedback from peers?",
      "What would make you leave this job?",
      "How do you handle ethical dilemmas at work?",
      "What questions do you have about the role?",
    ],
    senior: [
      "What's your leadership philosophy?",
      "How do you handle the transition from individual contributor to leader?",
      "Describe your approach to building relationships with executive teams.",
      "How do you manage your professional network?",
      "What's your approach to work-life integration?",
      "How do you handle confidential information?",
      "What does your ideal company culture look like?",
      "How do you approach compensation negotiations with your team?",
      "What's the most challenging organizational issue you've faced?",
      "Where do you see the industry heading in the next 5 years?",
    ],
  },
};

function getFallbackQuestion(context: InterviewContext): string {
  const type = context.interviewType === "mixed" ? "general" : context.interviewType;
  const typeQs = FALLBACK_QUESTIONS[type] || FALLBACK_QUESTIONS.general;
  const difficultyQs = typeQs[context.difficulty] || typeQs.entry;

  const idx = Math.min(context.questionNumber - 1, difficultyQs.length - 1);
  return difficultyQs[idx >= 0 ? idx : 0];
}

function getFallbackFeedback(question: string, answer: string): {
  feedback: string;
  score: number;
  strengths: string;
  improvements: string;
  suggestedAnswer: string;
  fillerWords: string[];
  structureCheck: string;
} {
  const lower = answer.toLowerCase().trim();
  const words = answer.trim().split(/\s+/).length;
  const fillerWords: string[] = [];
  ["umm", "uhh", "like", "you know", "basically", "actually", "um", "uh"].forEach(fw => {
    if (lower.includes(fw)) fillerWords.push(fw);
  });

  const dontKnow = ["i don't know", "idk", "no idea", "not sure", "don't know", "i have no idea", "no clue"];
  if (dontKnow.some(p => lower === p || lower.startsWith(p))) {
    return {
      feedback: "This answer shows no preparation. Even a basic attempt is better than saying you don't know.",
      score: 5,
      strengths: "None identified.",
      improvements: "Always attempt an answer. For technical questions, explain your thought process. For behavioral, share a relevant experience.",
      suggestedAnswer: "Try to provide at least a general approach or relevant experience, even if unsure.",
      fillerWords,
      structureCheck: "No structured answer provided.",
    };
  }

  if (words < 5) {
    return {
      feedback: "Your answer is too short to be evaluated properly. Interviewers expect detailed responses.",
      score: 10,
      strengths: "None identified.",
      improvements: "Provide a much more detailed answer. Use specific examples, situations, and outcomes. Aim for at least 3-4 sentences.",
      suggestedAnswer: "Expand your answer with context, action, and result.",
      fillerWords,
      structureCheck: "Answer is too brief for any structure.",
    };
  }

  if (words < 15) {
    return {
      feedback: "Very brief answer. Lacks depth and specific examples.",
      score: 25,
      strengths: "Provided a direct response.",
      improvements: "Add specific examples, explain your reasoning, and describe outcomes. Use the STAR method for behavioral questions.",
      suggestedAnswer: "Start with context, describe what you did, and explain the result.",
      fillerWords,
      structureCheck: "Answer needs significant expansion.",
    };
  }

  const hasExample = /for example|for instance|such as|like when|one time|last time|in my (previous|last|current|past)/i.test(answer);
  const hasStructure = /first|second|finally|also|additionally|moreover|however|because|therefore|result|outcome/i.test(answer);
  const hasAction = /i (did|built|created|managed|led|developed|implemented|solved|designed|improved|increased|reduced|organized|coordinated)/i.test(answer);

  let score = 0;
  let feedback = "";
  let strengths = "";
  let improvements = "";

  if (words < 30) {
    score = 35;
    feedback = "Answer is short and lacks specific examples or detailed explanation.";
    improvements = "Provide more detail about your experience. Include specific examples with context, action taken, and results achieved.";
  } else if (words < 50) {
    score = 45;
    feedback = "Moderate answer but could use more depth and concrete examples.";
    improvements = "Add at least one specific example. Explain what you did and what the outcome was.";
  } else if (words < 80) {
    score = 55;
    feedback = "Good length. Could benefit from more specific examples and clear structure.";
    improvements = "Include concrete examples with measurable results. Structure your answer using STAR method.";
  } else {
    score = 60;
    feedback = "Detailed answer. Make sure all content is relevant to the question.";
    strengths = "Good level of detail.";
    improvements = "Ensure examples are specific and results are measurable.";
  }

  if (hasExample) { score = Math.min(score + 10, 90); strengths = strengths ? strengths + " Includes specific examples." : "Includes specific examples."; }
  if (hasStructure) { score = Math.min(score + 5, 90); strengths = strengths ? strengths + " Well-structured." : "Well-structured answer."; }
  if (hasAction) { score = Math.min(score + 5, 90); strengths = strengths ? strengths + " Shows clear action taken." : "Shows clear action taken."; }

  if (fillerWords.length > 0) { score = Math.max(score - (fillerWords.length * 3), 10); improvements += ` Reduce filler words: ${fillerWords.join(", ")}.`; }

  if (lower === lower.charAt(0) + lower.slice(1).repeat(1) && words > 5) {
    score = Math.max(score - 20, 10);
  }

  const repeatedWords = lower.split(/\s+/);
  const uniqueWords = new Set(repeatedWords);
  if (repeatedWords.length > 10 && uniqueWords.size / repeatedWords.length < 0.3) {
    score = Math.max(score - 25, 10);
    feedback = "Answer appears repetitive. Provide varied, substantive content instead of repeating the same words.";
    improvements = "Focus on providing new information with each sentence. Use specific examples rather than repeating general statements.";
  }

  score = Math.max(5, Math.min(score, 90));

  return {
    feedback,
    score,
    strengths: strengths || "No significant strengths identified. Keep practicing!",
    improvements: improvements || "Add specific examples and use structured frameworks like STAR.",
    suggestedAnswer: "Structure your answer: Start with context (Situation/Task), describe your approach (Action), and share the outcome (Result).",
    fillerWords,
    structureCheck: hasStructure ? "Answer has some logical structure." : "Try organizing your answer with clear structure (STAR method recommended).",
  };
}

function getFallbackSummary(scores: number[]): string {
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  if (avg >= 80) return "Excellent performance! You demonstrated strong communication skills and provided well-structured, detailed answers. Keep up the great work and continue refining your responses with specific examples.";
  if (avg >= 65) return "Good performance overall. You showed solid understanding and communication skills. Focus on providing more specific examples and structuring your answers using frameworks like STAR for even better results.";
  if (avg >= 50) return "Decent effort. Your answers showed some good points but could benefit from more depth and structure. Practice using the STAR method for behavioral questions and add more concrete examples to strengthen your responses.";
  return "You completed the interview session! To improve, focus on structuring your answers clearly, providing specific examples from your experience, and practicing regularly. Every interview is a learning opportunity.";
}

export async function generateQuestion(context: InterviewContext): Promise<string> {
  if (!hasApiKey()) {
    return getFallbackQuestion(context);
  }

  try {
    const client = await getAnthropic();
    const systemPrompt = buildSystemPrompt(context);
    const userPrompt = buildQuestionPrompt(context);

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: systemPrompt,
      messages: [
        ...context.conversationHistory,
        { role: "user", content: userPrompt },
      ],
    });

    const textBlock = message.content.find((b: any) => b.type === "text");
    return textBlock ? textBlock.text : getFallbackQuestion(context);
  } catch (err) {
    console.error("AI question generation failed, using fallback:", err);
    return getFallbackQuestion(context);
  }
}

export async function generateFeedback(
  question: string,
  answer: string,
  context: { interviewType: string; jobRole: string; difficulty: string }
): Promise<{
  feedback: string;
  score: number;
  strengths: string;
  improvements: string;
  suggestedAnswer: string;
  fillerWords: string[];
  structureCheck: string;
}> {
  if (!hasApiKey()) {
    return getFallbackFeedback(question, answer);
  }

  try {
    const client = await getAnthropic();
    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      system: `You are an expert interview coach. Evaluate the candidate's answer and provide structured feedback.
You MUST respond in valid JSON format with these exact fields:
{
  "feedback": "brief overall feedback (1-2 sentences)",
  "score": number 0-100,
  "strengths": "what they did well",
  "improvements": "specific areas to improve",
  "suggestedAnswer": "an improved version of their answer",
  "fillerWords": ["list", "of", "filler", "words", "detected"],
  "structureCheck": "feedback on answer structure (STAR method, etc)"
}
No markdown, no code blocks, just raw JSON.`,
      messages: [
        {
          role: "user",
          content: `Evaluate this interview answer:\n\nQuestion: ${question}\nAnswer: ${answer}\nJob Role: ${context.jobRole}\nInterview Type: ${context.interviewType}\nDifficulty: ${context.difficulty}\n\nProvide evaluation in the exact JSON format specified.`,
        },
      ],
    });

    const textBlock = message.content.find((b: any) => b.type === "text");
    const text = textBlock?.text || "{}";

    try {
      return JSON.parse(text);
    } catch {
      return getFallbackFeedback(question, answer);
    }
  } catch (err) {
    console.error("AI feedback failed, using fallback:", err);
    return getFallbackFeedback(question, answer);
  }
}

export async function generateSessionReport(
  questions: { question: string; answer: string; score: number; feedback: string }[],
  context: { jobRole: string; interviewType: string; difficulty: string }
): Promise<{
  overallScore: number;
  clarityScore: number;
  relevanceScore: number;
  confidenceScore: number;
  structureScore: number;
  technicalScore: number;
  summary: string;
  weakAreas: string[];
  recommendations: string[];
}> {
  const scores = questions.map(q => q.score || 0);
  const overallScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);

  if (!hasApiKey()) {
    const variation = () => Math.min(100, Math.max(20, overallScore + Math.round((Math.random() - 0.5) * 20)));
    return {
      overallScore,
      clarityScore: variation(),
      relevanceScore: variation(),
      confidenceScore: variation(),
      structureScore: variation(),
      technicalScore: variation(),
      summary: getFallbackSummary(scores),
      weakAreas: overallScore < 60
        ? ["Provide more detailed answers", "Use structured frameworks like STAR", "Add specific examples"]
        : overallScore < 80
        ? ["Include more concrete examples", "Improve answer structure"]
        : ["Fine-tune answer conciseness"],
      recommendations: [
        "Practice answering common interview questions regularly",
        "Use the STAR method for behavioral questions",
        "Record yourself answering to identify filler words",
        "Research the company thoroughly before interviews",
      ],
    };
  }

  try {
    const client = await getAnthropic();
    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 3000,
      system: `You are an expert interview analyst. Generate a comprehensive report based on the interview performance.
You MUST respond in valid JSON format:
{
  "overallScore": number 0-100,
  "clarityScore": number 0-100,
  "relevanceScore": number 0-100,
  "confidenceScore": number 0-100,
  "structureScore": number 0-100,
  "technicalScore": number 0-100,
  "summary": "detailed 3-4 paragraph performance summary",
  "weakAreas": ["area1", "area2"],
  "recommendations": ["rec1", "rec2", "rec3"]
}
No markdown, just raw JSON.`,
      messages: [
        {
          role: "user",
          content: `Generate a comprehensive interview report for a ${context.difficulty} level ${context.jobRole} ${context.interviewType} interview.\n\nQuestions and Performance:\n${questions.map((q, i) => `${i + 1}. Q: ${q.question}\n   A: ${q.answer}\n   Score: ${q.score}/100\n   Feedback: ${q.feedback}`).join("\n\n")}\n\nProvide the report in the exact JSON format specified.`,
        },
      ],
    });

    const textBlock = message.content.find((b: any) => b.type === "text");
    const text = textBlock?.text || "{}";

    try {
      return JSON.parse(text);
    } catch {
      const variation = () => Math.min(100, Math.max(20, overallScore + Math.round((Math.random() - 0.5) * 20)));
      return {
        overallScore, clarityScore: variation(), relevanceScore: variation(),
        confidenceScore: variation(), structureScore: variation(), technicalScore: variation(),
        summary: getFallbackSummary(scores),
        weakAreas: ["Needs more practice"], recommendations: ["Practice more interview questions"],
      };
    }
  } catch (err) {
    console.error("AI report failed, using fallback:", err);
    const variation = () => Math.min(100, Math.max(20, overallScore + Math.round((Math.random() - 0.5) * 20)));
    return {
      overallScore, clarityScore: variation(), relevanceScore: variation(),
      confidenceScore: variation(), structureScore: variation(), technicalScore: variation(),
      summary: getFallbackSummary(scores),
      weakAreas: ["Needs more practice"], recommendations: ["Practice more interview questions"],
    };
  }
}

export async function generateFollowUp(
  originalQuestion: string,
  answer: string,
  context: { jobRole: string; interviewType: string; difficulty: string }
): Promise<{ shouldFollowUp: boolean; followUpQuestion: string }> {
  if (!hasApiKey()) {
    return { shouldFollowUp: false, followUpQuestion: "" };
  }

  try {
    const client = await getAnthropic();
    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 512,
      system: `You are an interview coach deciding whether to ask a follow-up question.
You MUST respond in valid JSON:
{"shouldFollowUp": boolean, "followUpQuestion": "the follow-up question or empty string"}
No markdown, just raw JSON.`,
      messages: [
        {
          role: "user",
          content: `Original question: ${originalQuestion}\nCandidate's answer: ${answer}\nJob Role: ${context.jobRole}\nInterview Type: ${context.interviewType}\n\nDecide if a follow-up question would be valuable (30% chance). If yes, create a relevant follow-up.`,
        },
      ],
    });

    const textBlock = message.content.find((b: any) => b.type === "text");
    const text = textBlock?.text || "{}";

    try {
      return JSON.parse(text);
    } catch {
      return { shouldFollowUp: false, followUpQuestion: "" };
    }
  } catch {
    return { shouldFollowUp: false, followUpQuestion: "" };
  }
}

function buildSystemPrompt(context: InterviewContext): string {
  let prompt = `You are a professional, experienced interview conductor for ${context.jobRole} positions.

INTERVIEW RULES:
1. Ask ONE question at a time, numbered as ${context.questionNumber} of ${context.totalQuestions}
2. The difficulty level is ${context.difficulty} (entry/mid/senior)
3. Interview type: ${context.interviewType}
4. Be professional but encouraging
5. For technical interviews: ask about relevant technical concepts, coding problems, system design
6. For behavioral interviews: use STAR method framework, ask about past experiences
7. For HR interviews: ask about motivation, culture fit, career goals
8. For mixed interviews: balance all types
IMPORTANT: Only output the question, nothing else. Be concise.`;

  if (context.jobDescription) {
    prompt += `\n\nThe candidate is applying for this specific job:\n${context.jobDescription}\nTailor your questions to this role.`;
  }

  if (context.resumeText) {
    prompt += `\n\nThe candidate's resume:\n${context.resumeText}\nReference their specific experience and projects in your questions.`;
  }

  return prompt;
}

function buildQuestionPrompt(context: InterviewContext): string {
  if (context.conversationHistory.length <= 1) {
    return `Start the interview with your first question (question ${context.questionNumber} of ${context.totalQuestions}). This is the opening question.`;
  }

  return `Based on the conversation so far, ask the next question (question ${context.questionNumber} of ${context.totalQuestions}). ${context.questionNumber === context.totalQuestions ? "This should be the final question." : ""}`;
}
