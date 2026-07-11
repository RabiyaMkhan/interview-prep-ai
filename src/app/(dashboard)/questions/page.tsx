"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Search, Bookmark, BookmarkCheck, RotateCcw, Filter } from "lucide-react";

interface Question {
  id?: string;
  questionText: string;
  category?: string;
  jobRole?: string;
  difficulty?: string;
  isMastered?: boolean;
  attempts?: number;
  bestScore?: number;
}

const CATEGORIES = [
  { value: "all", label: "All Categories" },
  { value: "general", label: "General" },
  { value: "behavioral", label: "Behavioral" },
  { value: "technical", label: "Technical" },
  { value: "motivation", label: "Motivation" },
  { value: "hr", label: "HR" },
];

const ROLES = [
  "all", "Software Engineer", "Data Analyst", "Project Manager", "Marketing Manager", "UX Designer", "Sales Representative"
];

export default function QuestionsPage() {
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [savedQuestions, setSavedQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [role, setRole] = useState("all");
  const [difficulty, setDifficulty] = useState("all");
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    fetchQuestions();
    fetchSaved();
  }, [category, role, difficulty]);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (category !== "all") params.set("category", category);
      if (role !== "all") params.set("role", role);
      if (difficulty !== "all") params.set("difficulty", difficulty);
      const res = await fetch(`/api/questions?${params.toString()}`);
      const data = await res.json();
      setQuestions(Array.isArray(data) ? data : []);
    } catch {}
    setLoading(false);
  };

  const fetchSaved = async () => {
    try {
      const res = await fetch("/api/questions?saved=true");
      const data = await res.json();
      setSavedQuestions(Array.isArray(data) ? data : []);
    } catch {}
  };

  const saveQuestion = async (q: Question) => {
    setSavingId(q.questionText);
    try {
      await fetch(`/api/questions/${encodeURIComponent(q.questionText)}/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionText: q.questionText,
          category: q.category,
          jobRole: q.jobRole,
          difficulty: q.difficulty,
        }),
      });
      fetchSaved();
    } catch {}
    setSavingId(null);
  };

  const filteredQuestions = questions.filter(q =>
    searchQuery === "" || q.questionText.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isSaved = (text: string) => savedQuestions.some(sq => sq.questionText === text);

  const getDifficultyColor = (d?: string) => {
    if (d === "entry") return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    if (d === "mid") return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
    if (d === "senior") return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
    return "bg-slate-100 text-slate-800";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold dark:text-white">Question Bank</h1>
        <p className="text-slate-600 dark:text-slate-400">Browse and save practice questions by category</p>
      </div>

      <Tabs defaultValue="browse">
        <TabsList>
          <TabsTrigger value="browse">Browse Questions</TabsTrigger>
          <TabsTrigger value="saved">My Saved ({savedQuestions.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-500" />
              <span className="text-sm font-medium dark:text-white">Filters:</span>
            </div>
            <div className="relative flex-1" style={{ minWidth: "200px" }}>
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input placeholder="Search questions..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
            </div>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Category" /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Job Role" /></SelectTrigger>
              <SelectContent>
                {ROLES.map(r => <SelectItem key={r} value={r}>{r === "all" ? "All Roles" : r}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={difficulty} onValueChange={setDifficulty}>
              <SelectTrigger className="w-[140px]"><SelectValue placeholder="Difficulty" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="entry">Entry Level</SelectItem>
                <SelectItem value="mid">Mid Level</SelectItem>
                <SelectItem value="senior">Senior</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Questions List */}
          <div className="space-y-3">
            {loading ? (
              <div className="py-12 text-center text-slate-500">
                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
              </div>
            ) : filteredQuestions.length === 0 ? (
              <div className="py-12 text-center text-slate-500">
                <Search className="mx-auto mb-4 h-12 w-12 opacity-30" />
                <p>No questions match your filters</p>
              </div>
            ) : (
              filteredQuestions.map((q, i) => (
                <Card key={i} className="transition-colors hover:border-blue-200 dark:hover:border-blue-800">
                  <CardContent className="flex items-start justify-between gap-4 p-4">
                    <div className="flex-1">
                      <p className="font-medium dark:text-white">{q.questionText}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className="text-xs capitalize">{q.category}</Badge>
                        <Badge variant="outline" className="text-xs">{q.jobRole === "all" ? "All Roles" : q.jobRole}</Badge>
                        <Badge variant="outline" className={`text-xs ${getDifficultyColor(q.difficulty)}`}>{q.difficulty}</Badge>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => saveQuestion(q)} disabled={savingId === q.questionText}
                      className={isSaved(q.questionText) ? "text-blue-600" : ""}>
                      {isSaved(q.questionText) ? <BookmarkCheck className="h-5 w-5" /> : <Bookmark className="h-5 w-5" />}
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="saved" className="space-y-4">
          {savedQuestions.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              <Bookmark className="mx-auto mb-4 h-12 w-12 opacity-30" />
              <p className="text-lg font-medium">No saved questions yet</p>
              <p className="text-sm">Browse questions and save ones you want to practice</p>
            </div>
          ) : (
            savedQuestions.map((q) => (
              <Card key={q.id}>
                <CardContent className="flex items-start justify-between gap-4 p-4">
                  <div className="flex-1">
                    <p className="font-medium dark:text-white">{q.questionText}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      {q.category && <Badge variant="outline" className="text-xs capitalize">{q.category}</Badge>}
                      {q.difficulty && <Badge variant="outline" className={`text-xs ${getDifficultyColor(q.difficulty)}`}>{q.difficulty}</Badge>}
                      {q.attempts !== undefined && q.attempts > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          <RotateCcw className="mr-1 h-3 w-3" /> {q.attempts} attempts
                          {q.bestScore !== null && q.bestScore !== undefined && ` | Best: ${q.bestScore}`}
                        </Badge>
                      )}
                      {q.isMastered && <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-xs">Mastered</Badge>}
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => router.push("/interview/new")}>
                    Practice
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
