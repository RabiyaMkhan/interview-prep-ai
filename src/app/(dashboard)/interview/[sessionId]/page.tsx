"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { isSpeechRecognitionSupported, startRecognition, stopRecognition, speak } from "@/lib/speech";
import { formatDuration } from "@/lib/utils";
import { Send, Mic, MicOff, Volume2, VolumeX, Clock, ArrowRight, Loader2, Star, AlertTriangle, CheckCircle2, Bot, User } from "lucide-react";

interface Question { id: string; questionText: string; questionType?: string; }
interface Feedback { feedback: string; score: number; strengths: string; improvements: string; suggestedAnswer: string; fillerWords: string[]; }
type ChatMsg = { role: "assistant" | "user" | "system"; content: string; feedback?: Feedback };

function getSeconds(dur: string) { return dur === "quick" ? 600 : dur === "full" ? 2100 : 1200; }
function getTotal(dur: string) { return dur === "quick" ? 5 : dur === "full" ? 15 : 10; }

export default function InterviewSessionPage({ params }: { params: { sessionId: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [sessionData, setSessionData] = useState<any>(null);
  const [currentQ, setCurrentQ] = useState<Question | null>(null);
  const [answer, setAnswer] = useState("");
  const [done, setDone] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [recording, setRecording] = useState(false);
  const [tts, setTts] = useState(true);
  const [speechOk, setSpeechOk] = useState(true);
  const [answered, setAnswered] = useState(0);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const recogRef = useRef<any>(null);
  const chatRef = useRef<HTMLDivElement>(null);
  const initRef = useRef(false);

  useEffect(() => {
    setSpeechOk(isSpeechRecognitionSupported());
    if (initRef.current) return;
    initRef.current = true;
    loadSession();
  }, []);

  useEffect(() => {
    chatRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, generating]);

  useEffect(() => {
    if (timeLeft <= 0 || done) return;
    const t = setInterval(() => setTimeLeft(p => { if (p <= 1) { setDone(true); return 0; } return p - 1; }), 1000);
    return () => clearInterval(t);
  }, [timeLeft, done]);

  async function loadSession() {
    try {
      const res = await fetch(`/api/interview/${params.sessionId}`);
      if (!res.ok) { router.push("/dashboard"); return; }
      const data = await res.json();
      setSessionData(data);
      if (data.status === "completed") { router.push(`/interview/report/${params.sessionId}`); return; }

      const total = getTotal(data.duration);
      setTimeLeft(getSeconds(data.duration));

      const qs = (data.questions || []) as any[];
      const doneQs = qs.filter((q: any) => q.answerText);
      setAnswered(doneQs.length);

      if (doneQs.length >= total) {
        setDone(true);
        setLoading(false);
        return;
      }

      if (qs.length > 0) {
        const next = qs.find((q: any) => !q.answerText);
        if (next) {
          const hist: ChatMsg[] = [];
          for (const q of qs) {
            hist.push({ role: "assistant", content: q.questionText });
            if (q.answerText) hist.push({ role: "user", content: q.answerText });
            if (q.aiFeedback && q.score) {
              hist.push({ role: "system", content: q.aiFeedback, feedback: {
                feedback: q.aiFeedback, score: q.score, strengths: q.strengths || "",
                improvements: q.improvements || "", suggestedAnswer: q.suggestedAnswer || "",
                fillerWords: (() => { try { return q.fillerWords ? JSON.parse(q.fillerWords) : []; } catch { return []; } })()
              }});
            }
          }
          setMessages(hist);
          setCurrentQ({ id: next.id, questionText: next.questionText, questionType: next.questionType });
        } else {
          await fetchNextQuestion();
        }
      } else {
        await fetchNextQuestion();
      }
    } catch { router.push("/dashboard"); }
    setLoading(false);
  }

  async function fetchNextQuestion() {
    setGenerating(true);
    try {
      const res = await fetch(`/api/interview/${params.sessionId}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answer: null, questionId: null }),
      });
      const data = await res.json();
      if (data.sessionComplete || !data.nextQuestion) { setDone(true); setGenerating(false); return; }

      const q: Question = { id: data.nextQuestion.id, questionText: data.nextQuestion.text, questionType: data.nextQuestion.type };
      setCurrentQ(q);
      setMessages(prev => [...prev, { role: "assistant", content: q.questionText }]);
      if (tts) { speak(q.questionText); }
    } catch (e) { console.error(e); }
    setGenerating(false);
  }

  async function sendAnswer() {
    if (!answer.trim() || !currentQ || submitting) return;
    const userAns = answer.trim();
    setSubmitting(true);
    setAnswer("");

    setMessages(prev => [...prev, { role: "user", content: userAns }]);

    try {
      const res = await fetch(`/api/interview/${params.sessionId}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answer: userAns, questionId: currentQ.id, isVoiceInput: recording }),
      });
      const data = await res.json();

      const newCount = answered + 1;
      setAnswered(newCount);

      if (data.feedback) {
        setMessages(prev => [...prev, {
          role: "system", content: data.feedback.feedback || "Good answer!",
          feedback: {
            feedback: data.feedback.feedback || "",
            score: data.feedback.score || 0,
            strengths: data.feedback.strengths || "",
            improvements: data.feedback.improvements || "",
            suggestedAnswer: data.feedback.suggestedAnswer || "",
            fillerWords: data.feedback.fillerWords || [],
          }
        }]);
      }

      if (data.sessionComplete || !data.nextQuestion) {
        setDone(true);
      } else {
        const q: Question = { id: data.nextQuestion.id, questionText: data.nextQuestion.text, questionType: data.nextQuestion.type };
        setCurrentQ(q);
        setMessages(prev => [...prev, { role: "assistant", content: q.questionText }]);
        if (tts) { speak(q.questionText); }
      }
    } catch (e) { console.error(e); }
    setSubmitting(false);
  }

  async function completeSession() {
    try {
      const res = await fetch(`/api/interview/${params.sessionId}/complete`, { method: "POST" });
      const data = await res.json();
      if (data.sessionId) router.push(`/interview/report/${params.sessionId}`);
    } catch {}
  }

  function toggleRecording() {
    if (recording) {
      stopRecognition(recogRef.current);
      recogRef.current = null;
      setRecording(false);
    } else {
      recogRef.current = startRecognition(
        (t, final) => { if (final) setAnswer(p => (p + " " + t).trim()); },
        () => setRecording(false),
        () => setRecording(false)
      );
      setRecording(true);
    }
  }

  const total = getTotal(sessionData?.duration || "standard");
  const pct = Math.min((answered / total) * 100, 100);

  if (loading) return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="text-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" />
        <p className="mt-4 text-slate-600">Loading interview...</p>
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <div>
          <h1 className="font-semibold dark:text-white">{sessionData?.jobRole}</h1>
          <p className="text-sm text-slate-500 capitalize">{sessionData?.interviewType} &middot; {sessionData?.difficulty}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-1 font-mono text-sm ${timeLeft < 60 ? "text-red-500 font-bold" : "text-slate-600 dark:text-slate-400"}`}>
            <Clock className="h-4 w-4" />{formatDuration(timeLeft)}
          </div>
          <Badge variant="outline">{answered}/{total}</Badge>
          {speechOk && (
            <Button variant="ghost" size="icon" onClick={() => setTts(!tts)}>
              {tts ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </Button>
          )}
        </div>
      </div>

      <Progress value={pct} className="h-2" />

      {/* Chat */}
      <div ref={chatRef} className="space-y-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950" style={{ minHeight: 200, maxHeight: "50vh", overflowY: "auto" }}>
        {messages.length === 0 && !generating && (
          <div className="py-8 text-center text-slate-500">
            <Loader2 className="mx-auto h-6 w-6 animate-spin text-blue-600" />
            <p className="mt-2 text-sm">Preparing your first question...</p>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex gap-3 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            {m.role !== "user" && (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                <Bot className="h-4 w-4 text-blue-600" />
              </div>
            )}
            <div className={`max-w-[80%] rounded-lg px-4 py-3 text-sm ${
              m.role === "user" ? "bg-blue-600 text-white"
              : m.role === "system" ? "border border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20 dark:text-white"
              : "bg-slate-100 dark:bg-slate-800 dark:text-white"
            }`}>
              {m.role === "system" && m.feedback ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 font-semibold">
                    <Star className="h-4 w-4 text-yellow-500" />Score: {m.feedback.score}/100
                  </div>
                  <p>{m.feedback.feedback}</p>
                  {m.feedback.strengths && (
                    <div className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-green-500" />{m.feedback.strengths}
                    </div>
                  )}
                  {m.feedback.improvements && (
                    <div className="flex items-start gap-2 text-sm">
                      <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-orange-500" />{m.feedback.improvements}
                    </div>
                  )}
                  {m.feedback.fillerWords?.length > 0 && (
                    <p className="text-xs text-orange-600">Filler words: {m.feedback.fillerWords.join(", ")}</p>
                  )}
                  {m.feedback.suggestedAnswer && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-xs font-medium text-blue-600">Suggested answer</summary>
                      <p className="mt-1 text-sm italic">{m.feedback.suggestedAnswer}</p>
                    </details>
                  )}
                </div>
              ) : (
                <p className="whitespace-pre-wrap">{m.content}</p>
              )}
            </div>
            {m.role === "user" && (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                <User className="h-4 w-4 text-green-600" />
              </div>
            )}
          </div>
        ))}

        {generating && (
          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
              <Bot className="h-4 w-4 text-blue-600" />
            </div>
            <div className="rounded-lg bg-slate-100 px-4 py-3 dark:bg-slate-800">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                <span className="text-sm text-slate-500">Preparing question...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      {!done && (
        <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <Textarea
            ref={undefined}
            placeholder={generating ? "Loading question..." : "Type your answer... (Enter to send)"}
            value={answer}
            onChange={e => setAnswer(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendAnswer(); } }}
            rows={3}
            disabled={submitting || generating}
            className="resize-none"
          />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {speechOk && (
                <Button variant={recording ? "destructive" : "outline"} size="icon" onClick={toggleRecording} disabled={submitting || generating}>
                  {recording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </Button>
              )}
              {recording && <Badge variant="destructive" className="animate-pulse">Recording...</Badge>}
            </div>
            <Button onClick={sendAnswer} disabled={!answer.trim() || submitting || generating} className="bg-blue-600 hover:bg-blue-700">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="mr-2 h-4 w-4" />Send</>}
            </Button>
          </div>
        </div>
      )}

      {/* Done */}
      {done && (
        <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <h3 className="font-semibold text-green-800 dark:text-green-200">
                {timeLeft <= 0 ? "Time's Up!" : "Interview Complete!"}
              </h3>
              <p className="text-sm text-green-600 dark:text-green-400">You answered {answered} questions.</p>
            </div>
            <Button onClick={completeSession} className="bg-green-600 hover:bg-green-700">
              View Report <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
