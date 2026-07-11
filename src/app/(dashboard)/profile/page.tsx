"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { JOB_ROLES } from "@/lib/utils";
import { User, Save, Upload, Target } from "lucide-react";

export default function ProfilePage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    name: "",
    targetJobRole: "",
    industry: "",
    experienceLevel: "",
    weeklyGoal: 3,
    resumeText: "",
  });

  useEffect(() => {
    fetch("/api/profile").then(r => r.json()).then(data => {
      if (!data.error) {
        setForm({
          name: data.user?.name || "",
          targetJobRole: data.targetJobRole || "",
          industry: data.industry || "",
          experienceLevel: data.experienceLevel || "",
          weeklyGoal: data.weeklyGoal || 3,
          resumeText: data.resumeText || "",
        });
      }
    }).catch(() => {});
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch {}
    setLoading(false);
  };

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("resume", file);
    try {
      const res = await fetch("/api/resume", { method: "POST", body: formData });
      const data = await res.json();
      if (data.text) {
        setForm(f => ({ ...f, resumeText: data.text }));
      }
    } catch {}
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold dark:text-white">Profile</h1>
        <p className="text-slate-600 dark:text-slate-400">Manage your profile and preferences</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><User className="h-5 w-5" /> Personal Info</CardTitle>
          <CardDescription>Your basic information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Full Name</Label>
            <Input value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Your name" />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={session?.user?.email || ""} disabled />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Target className="h-5 w-5" /> Interview Preferences</CardTitle>
          <CardDescription>Help AI tailor questions to your goals</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Target Job Role</Label>
            <Select value={form.targetJobRole} onValueChange={(v) => setForm(f => ({ ...f, targetJobRole: v }))}>
              <SelectTrigger><SelectValue placeholder="Select your target role" /></SelectTrigger>
              <SelectContent>
                {JOB_ROLES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Industry</Label>
            <Input value={form.industry} onChange={(e) => setForm(f => ({ ...f, industry: e.target.value }))} placeholder="e.g. Technology, Finance, Healthcare" />
          </div>
          <div className="space-y-2">
            <Label>Experience Level</Label>
            <Select value={form.experienceLevel} onValueChange={(v) => setForm(f => ({ ...f, experienceLevel: v }))}>
              <SelectTrigger><SelectValue placeholder="Select your experience level" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="entry">Entry Level (0-2 years)</SelectItem>
                <SelectItem value="mid">Mid Level (3-5 years)</SelectItem>
                <SelectItem value="senior">Senior (6+ years)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Weekly Practice Goal (sessions per week)</Label>
            <Input type="number" min={1} max={20} value={form.weeklyGoal} onChange={(e) => setForm(f => ({ ...f, weeklyGoal: parseInt(e.target.value) || 3 }))} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Upload className="h-5 w-5" /> Resume</CardTitle>
          <CardDescription>Upload your resume for AI-aware interviewing</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <input type="file" accept=".pdf,.txt" onChange={handleResumeUpload} className="block w-full text-sm text-slate-500 file:mr-4 file:rounded-md file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-blue-700 hover:file:bg-blue-100" />
          </div>
          {form.resumeText && (
            <div className="space-y-2">
              <Label>Resume Content (parsed)</Label>
              <Textarea value={form.resumeText.substring(0, 500) + (form.resumeText.length > 500 ? "..." : "")} readOnly rows={6} />
              <Badge variant="secondary">Resume loaded ({form.resumeText.length} chars)</Badge>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
          <Save className="mr-2 h-4 w-4" />
          {loading ? "Saving..." : saved ? "Saved!" : "Save Profile"}
        </Button>
      </div>
    </div>
  );
}
