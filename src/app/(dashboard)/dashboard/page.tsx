"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, BarChart, Bar, Legend } from "recharts";
import { formatDate, getScoreColor } from "@/lib/utils";
import { Plus, Trophy, Target, Flame, TrendingUp, Clock, MessageSquare, ArrowRight } from "lucide-react";

interface Session {
  id: string;
  jobRole: string;
  interviewType: string;
  difficulty: string;
  overallScore: number | null;
  status: string;
  startedAt: string;
  completedAt: string | null;
  questions: any[];
}

interface ScoreEntry {
  id: string;
  overallScore: number;
  clarityScore: number | null;
  relevanceScore: number | null;
  confidenceScore: number | null;
  structureScore: number | null;
  technicalScore: number | null;
  jobRole: string;
  interviewType: string;
  difficulty: string;
  createdAt: string;
}

interface BadgeData {
  id: string;
  name: string;
  description: string;
  icon: string | null;
  earned: boolean;
  earnedAt: string | null;
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [scoreHistory, setScoreHistory] = useState<ScoreEntry[]>([]);
  const [badges, setBadges] = useState<BadgeData[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/interview").then(r => r.json()),
      fetch("/api/dashboard").then(r => r.json()),
      fetch("/api/badges").then(r => r.json()),
      fetch("/api/profile").then(r => r.json()),
    ]).then(([sessionsData, dashData, badgesData, profileData]) => {
      setSessions(Array.isArray(sessionsData) ? sessionsData : []);
      if (dashData.scoreHistory) setScoreHistory(dashData.scoreHistory);
      if (Array.isArray(badgesData)) setBadges(badgesData);
      setProfile(profileData);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const completedSessions = sessions.filter(s => s.status === "completed");
  const totalSessions = completedSessions.length;
  const avgScore = totalSessions > 0
    ? Math.round(completedSessions.reduce((sum, s) => sum + (s.overallScore || 0), 0) / totalSessions)
    : 0;

  const lineData = scoreHistory
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .slice(-20)
    .map((s, i) => ({
      name: `#${i + 1}`,
      score: s.overallScore,
      date: formatDate(s.createdAt),
    }));

  const radarData = scoreHistory.length > 0 ? [
    { subject: "Clarity", value: Math.round(scoreHistory.reduce((s, h) => s + (h.clarityScore || 0), 0) / scoreHistory.length) },
    { subject: "Relevance", value: Math.round(scoreHistory.reduce((s, h) => s + (h.relevanceScore || 0), 0) / scoreHistory.length) },
    { subject: "Confidence", value: Math.round(scoreHistory.reduce((s, h) => s + (h.confidenceScore || 0), 0) / scoreHistory.length) },
    { subject: "Structure", value: Math.round(scoreHistory.reduce((s, h) => s + (h.structureScore || 0), 0) / scoreHistory.length) },
    { subject: "Technical", value: Math.round(scoreHistory.reduce((s, h) => s + (h.technicalScore || 0), 0) / scoreHistory.length) },
  ] : [];

  const roleData = (() => {
    const roles: Record<string, { count: number; totalScore: number }> = {};
    scoreHistory.forEach(s => {
      if (!roles[s.jobRole]) roles[s.jobRole] = { count: 0, totalScore: 0 };
      roles[s.jobRole].count++;
      roles[s.jobRole].totalScore += s.overallScore;
    });
    return Object.entries(roles).map(([role, data]) => ({
      role: role.substring(0, 15),
      sessions: data.count,
      avgScore: Math.round(data.totalScore / data.count),
    }));
  })();

  const weeklyGoal = profile?.weeklyGoal || 3;
  const currentStreak = profile?.currentStreak || 0;
  const thisWeekSessions = completedSessions.filter(s => {
    const d = new Date(s.completedAt || s.startedAt);
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return d >= weekAgo;
  }).length;

  const allBadges = [
    { name: "First Interview", description: "Complete your first interview", earned: totalSessions >= 1 },
    { name: "5 Interviews Done", description: "Complete 5 interviews", earned: totalSessions >= 5 },
    { name: "10 Interviews Done", description: "Complete 10 interviews", earned: totalSessions >= 10 },
    { name: "Score 80+", description: "Score 80 or above", earned: completedSessions.some(s => (s.overallScore || 0) >= 80) },
    { name: "Score 90+", description: "Score 90 or above", earned: completedSessions.some(s => (s.overallScore || 0) >= 90) },
    { name: "Streak Master", description: "7-day practice streak", earned: currentStreak >= 7 },
  ];

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="mt-4 text-slate-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold dark:text-white">
            Welcome back, {session?.user?.name?.split(" ")[0] || "there"}!
          </h1>
          <p className="text-slate-600 dark:text-slate-400">Here&apos;s your interview practice overview</p>
        </div>
        <Button onClick={() => router.push("/interview/new")} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="mr-2 h-4 w-4" /> New Interview
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Total Interviews</p>
                <p className="text-3xl font-bold dark:text-white">{totalSessions}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-blue-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Average Score</p>
                <p className={`text-3xl font-bold ${getScoreColor(avgScore)}`}>{avgScore}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Current Streak</p>
                <p className="text-3xl font-bold text-orange-600">{currentStreak} days</p>
              </div>
              <Flame className="h-8 w-8 text-orange-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Weekly Goal</p>
                <p className="text-3xl font-bold text-purple-600">{thisWeekSessions}/{weeklyGoal}</p>
              </div>
              <Target className="h-8 w-8 text-purple-600 opacity-50" />
            </div>
            <Progress value={(thisWeekSessions / weeklyGoal) * 100} className="mt-3 h-2" />
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Score Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Score Trend</CardTitle>
            <CardDescription>Your performance over time</CardDescription>
          </CardHeader>
          <CardContent>
            {lineData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={lineData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                  <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={12} />
                  <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0" }} />
                  <Line type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[300px] items-center justify-center text-sm text-slate-500">
                Complete interviews to see your score trend
              </div>
            )}
          </CardContent>
        </Card>

        {/* Radar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Performance Breakdown</CardTitle>
            <CardDescription>Average scores by category</CardDescription>
          </CardHeader>
          <CardContent>
            {radarData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12 }} />
                  <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <Radar name="Score" dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[300px] items-center justify-center text-sm text-slate-500">
                Complete interviews to see breakdown
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Role Comparison */}
      {roleData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Performance by Job Role</CardTitle>
            <CardDescription>Compare your practice across different roles</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={roleData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="role" stroke="#94a3b8" fontSize={12} />
                <YAxis yAxisId="left" domain={[0, 100]} stroke="#94a3b8" fontSize={12} />
                <YAxis yAxisId="right" orientation="right" stroke="#94a3b8" fontSize={12} />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="avgScore" fill="#3b82f6" name="Avg Score" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="right" dataKey="sessions" fill="#10b981" name="Sessions" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Badges */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Trophy className="h-5 w-5 text-yellow-500" /> Achievements
          </CardTitle>
          <CardDescription>Your earned badges</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {allBadges.map((b) => {
              const badge = badges.find(eb => eb.name === b.name);
              const isEarned = badge?.earned || false;
              return (
                <div key={b.name}
                  className={`rounded-lg border p-4 text-center transition-all ${isEarned ? "border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20" : "border-slate-200 bg-slate-50 opacity-50 dark:border-slate-700 dark:bg-slate-800"}`}>
                  <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/40">
                    <Trophy className={`h-5 w-5 ${isEarned ? "text-yellow-600" : "text-slate-400"}`} />
                  </div>
                  <p className="text-xs font-semibold dark:text-white">{b.name}</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">{b.description}</p>
                  {isEarned && <Badge variant="secondary" className="mt-1 text-[10px]">Earned!</Badge>}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recent Sessions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">Recent Sessions</CardTitle>
            <CardDescription>Your latest interview practice sessions</CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={() => router.push("/questions")}>
            View All <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          {sessions.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              <MessageSquare className="mx-auto mb-4 h-12 w-12 opacity-30" />
              <p className="text-lg font-medium">No sessions yet</p>
              <p className="text-sm">Start your first interview to see results here</p>
              <Button onClick={() => router.push("/interview/new")} className="mt-4 bg-blue-600 hover:bg-blue-700">
                Start Interview
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.slice(0, 5).map((s) => (
                <div key={s.id}
                  className="flex cursor-pointer items-center justify-between rounded-lg border border-slate-200 p-4 transition-colors hover:bg-slate-50 dark:border-slate-700 hover:dark:bg-slate-800"
                  onClick={() => s.status === "completed" ? router.push(`/interview/report/${s.id}`) : router.push(`/interview/${s.id}`)}>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold dark:text-white">{s.jobRole}</span>
                      <Badge variant="outline" className="text-xs capitalize">{s.interviewType}</Badge>
                      <Badge variant="outline" className="text-xs">{s.difficulty}</Badge>
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-sm text-slate-500">
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {formatDate(s.startedAt)}</span>
                      <span>{s.questions.length} questions</span>
                    </div>
                  </div>
                  <div className="text-right">
                    {s.status === "completed" ? (
                      <div className={`text-2xl font-bold ${getScoreColor(s.overallScore || 0)}`}>
                        {Math.round(s.overallScore || 0)}
                      </div>
                    ) : (
                      <Badge variant="secondary">In Progress</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
