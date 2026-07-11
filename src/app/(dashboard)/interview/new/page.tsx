"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { JOB_ROLES, INTERVIEW_TYPES, DIFFICULTY_LEVELS, DURATION_OPTIONS } from "@/lib/utils";
import { MessageSquare, Zap, Clock, FileText, ArrowRight, Sparkles } from "lucide-react";

export default function InterviewSetupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [setup, setSetup] = useState({
    jobRole: "",
    interviewType: "",
    difficulty: "",
    duration: "",
    jobDescription: "",
  });

  const handleStart = async () => {
    if (!setup.jobRole || !setup.interviewType || !setup.difficulty || !setup.duration) return;
    setLoading(true);
    try {
      const res = await fetch("/api/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(setup),
      });
      const data = await res.json();
      if (data.sessionId) {
        router.push(`/interview/${data.sessionId}`);
      }
    } catch {}
    setLoading(false);
  };

  const step4Done = setup.duration !== "";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold dark:text-white">New Interview Session</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">Configure your AI mock interview</p>
      </div>

      {/* Step 1: Job Role */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><MessageSquare className="h-5 w-5 text-blue-600" /> Step 1: Job Role</CardTitle>
          <CardDescription>What position are you preparing for?</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {JOB_ROLES.map(role => (
              <Badge key={role} variant={setup.jobRole === role ? "default" : "outline"}
                className={`cursor-pointer transition-all hover:scale-105 ${setup.jobRole === role ? "bg-blue-600 text-white" : ""}`}
                onClick={() => setSetup(s => ({ ...s, jobRole: role }))}>
                {role}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Step 2: Interview Type */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Zap className="h-5 w-5 text-blue-600" /> Step 2: Interview Type</CardTitle>
          <CardDescription>What type of interview practice do you need?</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {INTERVIEW_TYPES.map(type => (
              <div key={type.value}
                className={`cursor-pointer rounded-lg border-2 p-4 transition-all hover:border-blue-500 ${setup.interviewType === type.value ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20" : "border-slate-200 dark:border-slate-700"}`}
                onClick={() => setSetup(s => ({ ...s, interviewType: type.value }))}>
                <div className="font-semibold dark:text-white">{type.label}</div>
                <div className="text-sm text-slate-500 dark:text-slate-400">{type.description}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Step 3: Difficulty */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-blue-600" /> Step 3: Difficulty Level</CardTitle>
          <CardDescription>Select your experience level</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {DIFFICULTY_LEVELS.map(level => (
              <div key={level.value}
                className={`cursor-pointer rounded-lg border-2 p-4 text-center transition-all hover:border-blue-500 ${setup.difficulty === level.value ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20" : "border-slate-200 dark:border-slate-700"}`}
                onClick={() => setSetup(s => ({ ...s, difficulty: level.value }))}>
                <div className="font-semibold dark:text-white">{level.label}</div>
                <div className="text-sm text-slate-500 dark:text-slate-400">{level.description}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Step 4: Duration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5 text-blue-600" /> Step 4: Duration</CardTitle>
          <CardDescription>How many questions do you want?</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {DURATION_OPTIONS.map(opt => (
              <div key={opt.value}
                className={`cursor-pointer rounded-lg border-2 p-4 text-center transition-all hover:border-blue-500 ${setup.duration === opt.value ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20" : "border-slate-200 dark:border-slate-700"}`}
                onClick={() => setSetup(s => ({ ...s, duration: opt.value }))}>
                <div className="font-semibold dark:text-white">{opt.label}</div>
                <div className="text-2xl font-bold text-blue-600">{opt.questions}</div>
                <div className="text-sm text-slate-500 dark:text-slate-400">{opt.description}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Step 5: Job Description (Optional) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5 text-blue-600" /> Step 5: Job Description (Optional)</CardTitle>
          <CardDescription>Paste the job posting for tailored questions</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea placeholder="Paste the job description here..." value={setup.jobDescription} onChange={(e) => setSetup(s => ({ ...s, jobDescription: e.target.value }))} rows={5} />
        </CardContent>
      </Card>

      {/* Start Button */}
      <div className="flex justify-center pb-8">
        <Button size="lg" onClick={handleStart} disabled={loading || !step4Done}
          className="bg-blue-600 hover:bg-blue-700 px-8 text-lg">
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Setting up...
            </div>
          ) : (
            <div className="flex items-center gap-2">
              Start Interview <ArrowRight className="h-5 w-5" />
            </div>
          )}
        </Button>
      </div>
    </div>
  );
}
