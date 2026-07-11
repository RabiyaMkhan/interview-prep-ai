"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { generatePDFReport } from "@/lib/pdf";
import { getScoreColor, getScoreLabel, formatDate } from "@/lib/utils";
import { ArrowLeft, Download, TrendingUp, BarChart3, RotateCcw, CheckCircle2, AlertTriangle } from "lucide-react";

interface QuestionData {
  id: string;
  questionText: string;
  answerText: string;
  aiFeedback: string;
  score: number;
  strengths: string;
  improvements: string;
  suggestedAnswer: string;
}

interface SessionData {
  id: string;
  jobRole: string;
  interviewType: string;
  difficulty: string;
  duration: string;
  overallScore: number;
  summary: string;
  startedAt: string;
  completedAt: string;
  questions: QuestionData[];
  scoreHistory?: {
    overallScore: number;
    clarityScore: number;
    relevanceScore: number;
    confidenceScore: number;
    structureScore: number;
    technicalScore: number;
  }[];
}

export default function ReportPage() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<SessionData | null>(null);
  const [expandedQ, setExpandedQ] = useState<number | null>(null);

  useEffect(() => {
    fetchSession();
  }, []);

  const fetchSession = async () => {
    try {
      const res = await fetch(`/api/interview/${params.sessionId}`);
      if (!res.ok) { router.push("/dashboard"); return; }
      const data = await res.json();
      setSession(data);
      if (data.status !== "completed") { router.push(`/interview/${params.sessionId}`); return; }
    } catch { router.push("/dashboard"); }
    setLoading(false);
  };

  const handleDownloadPDF = () => {
    if (!session) return;
    const answeredQuestions = session.questions.filter(q => q.answerText);
    const report = generatePDFReport({
      sessionDate: formatDate(session.completedAt || session.startedAt),
      jobRole: session.jobRole,
      interviewType: session.interviewType,
      difficulty: session.difficulty,
      overallScore: session.overallScore || 0,
      clarityScore: 0,
      relevanceScore: 0,
      confidenceScore: 0,
      structureScore: 0,
      technicalScore: 0,
      summary: session.summary || "No summary available.",
      questions: answeredQuestions.map(q => ({
        question: q.questionText,
        answer: q.answerText || "",
        score: q.score || 0,
        feedback: q.aiFeedback || "",
        suggestedAnswer: q.suggestedAnswer || "",
        strengths: q.strengths || "",
        improvements: q.improvements || "",
      })),
    });
    report.save(`InterviewPrep-Report-${session.jobRole}-${formatDate(new Date())}.pdf`);
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="mt-4 text-slate-600">Loading report...</p>
        </div>
      </div>
    );
  }

  if (!session) return null;

  const answeredQuestions = session.questions.filter(q => q.answerText);
  const avgScore = session.overallScore || 0;
  const scoreData = session.scoreHistory?.[0];
  const scoreCategories = [
    { label: "Clarity", score: scoreData?.clarityScore || Math.round(avgScore * 0.95) },
    { label: "Relevance", score: scoreData?.relevanceScore || Math.round(avgScore * 0.9) },
    { label: "Confidence", score: scoreData?.confidenceScore || Math.round(avgScore * 0.85) },
    { label: "Structure", score: scoreData?.structureScore || Math.round(avgScore * 0.92) },
    { label: "Technical", score: scoreData?.technicalScore || Math.round(avgScore * 0.88) },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Button variant="ghost" onClick={() => router.push("/dashboard")} className="mb-2">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold dark:text-white">Interview Report</h1>
          <p className="text-slate-600 dark:text-slate-400">{session.jobRole} &middot; {session.interviewType} &middot; {session.difficulty}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push("/interview/new")}>
            <RotateCcw className="mr-2 h-4 w-4" /> New Interview
          </Button>
          <Button onClick={handleDownloadPDF} className="bg-blue-600 hover:bg-blue-700">
            <Download className="mr-2 h-4 w-4" /> Download PDF
          </Button>
        </div>
      </div>

      {/* Overall Score */}
      <Card className="border-0 bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
        <CardContent className="flex items-center justify-between p-8">
          <div>
            <h2 className="text-lg font-medium opacity-90">Overall Score</h2>
            <div className="flex items-baseline gap-2">
              <span className="text-6xl font-bold">{Math.round(avgScore)}</span>
              <span className="text-xl opacity-75">/100</span>
            </div>
            <p className="mt-2 text-lg opacity-90">{getScoreLabel(avgScore)}</p>
          </div>
          <div className="text-right">
            <p className="text-sm opacity-75">{answeredQuestions.length} Questions Answered</p>
            <p className="text-sm opacity-75">{formatDate(session.startedAt)}</p>
            <div className="mt-4 flex gap-2">
              <Badge className="bg-white/20 text-white">{session.difficulty}</Badge>
              <Badge className="bg-white/20 text-white capitalize">{session.interviewType}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Score Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5" /> Score Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {scoreCategories.map((cat) => (
            <div key={cat.label} className="flex items-center gap-4">
              <span className="w-28 text-sm font-medium dark:text-white">{cat.label}</span>
              <div className="flex-1">
                <Progress value={cat.score} className="h-3" />
              </div>
              <span className={`w-12 text-right text-sm font-bold ${getScoreColor(cat.score)}`}>{cat.score}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5" /> Performance Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-line text-slate-700 dark:text-slate-300">{session.summary || "No summary available."}</p>
        </CardContent>
      </Card>

      {/* Weak Areas & Recommendations */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-lg">Areas to Improve</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {(session as any).weakAreas?.map((area: string, i: number) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-orange-500" />
                  {area}
                </li>
              )) || <li className="text-sm text-slate-500">Keep practicing to identify areas!</li>}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-lg">Recommendations</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {(session as any).recommendations?.map((rec: string, i: number) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                  {rec}
                </li>
              )) || <li className="text-sm text-slate-500">Complete more sessions for personalized recommendations.</li>}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Question-by-Question Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Question-by-Question Breakdown</CardTitle>
          <CardDescription>Click on a question to see details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {answeredQuestions.map((q, i) => (
            <div key={q.id} className="rounded-lg border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setExpandedQ(expandedQ === i ? null : i)}
                className="flex w-full items-center justify-between p-4 text-left"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold dark:text-white">Q{i + 1}.</span>
                    <span className="text-sm dark:text-slate-300 line-clamp-1">{q.questionText}</span>
                  </div>
                  {!expandedQ && q.answerText && (
                    <p className="mt-1 text-xs text-slate-500 line-clamp-1">A: {q.answerText}</p>
                  )}
                </div>
                <div className="ml-4 flex items-center gap-2">
                  <Badge variant={q.score && q.score >= 70 ? "default" : "destructive"}>
                    {q.score || 0}/100
                  </Badge>
                </div>
              </button>

              {expandedQ === i && (
                <div className="border-t border-slate-200 p-4 dark:border-slate-700">
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-xs font-semibold uppercase text-slate-500">Your Answer</h4>
                      <p className="mt-1 text-sm dark:text-slate-300">{q.answerText}</p>
                    </div>
                    {q.strengths && (
                      <div>
                        <h4 className="text-xs font-semibold uppercase text-green-600">Strengths</h4>
                        <p className="mt-1 text-sm dark:text-slate-300">{q.strengths}</p>
                      </div>
                    )}
                    {q.improvements && (
                      <div>
                        <h4 className="text-xs font-semibold uppercase text-orange-600">Improvements</h4>
                        <p className="mt-1 text-sm dark:text-slate-300">{q.improvements}</p>
                      </div>
                    )}
                    {q.suggestedAnswer && (
                      <div>
                        <h4 className="text-xs font-semibold uppercase text-blue-600">Suggested Answer</h4>
                        <p className="mt-1 text-sm italic dark:text-slate-300">{q.suggestedAnswer}</p>
                      </div>
                    )}
                    {q.aiFeedback && (
                      <div>
                        <h4 className="text-xs font-semibold uppercase text-slate-500">AI Feedback</h4>
                        <p className="mt-1 text-sm dark:text-slate-300">{q.aiFeedback}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
