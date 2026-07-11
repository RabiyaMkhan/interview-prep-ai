import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function getScoreColor(score: number): string {
  if (score >= 80) return "text-green-500";
  if (score >= 60) return "text-yellow-500";
  return "text-red-500";
}

export function getScoreLabel(score: number): string {
  if (score >= 90) return "Excellent";
  if (score >= 80) return "Very Good";
  if (score >= 70) return "Good";
  if (score >= 60) return "Fair";
  if (score >= 50) return "Needs Improvement";
  return "Poor";
}

export const JOB_ROLES = [
  "Software Engineer",
  "Data Scientist",
  "Data Analyst",
  "Product Manager",
  "Marketing Manager",
  "Sales Representative",
  "UX Designer",
  "Business Analyst",
  "DevOps Engineer",
  "Project Manager",
  "HR Specialist",
  "Financial Analyst",
  "Consultant",
  "Customer Success Manager",
  "Graphic Designer",
  "Content Writer",
  "IT Support Specialist",
  "Cybersecurity Analyst",
  "AI/ML Engineer",
  "Full Stack Developer",
] as const;

export const INTERVIEW_TYPES = [
  { value: "technical", label: "Technical", description: "Coding, system design, technical concepts" },
  { value: "behavioral", label: "Behavioral", description: "STAR method, past experiences, soft skills" },
  { value: "hr", label: "HR/General", description: "Culture fit, motivation, general questions" },
  { value: "mixed", label: "Mixed", description: "Combination of all types" },
] as const;

export const DIFFICULTY_LEVELS = [
  { value: "entry", label: "Entry Level", description: "0-2 years experience" },
  { value: "mid", label: "Mid Level", description: "3-5 years experience" },
  { value: "senior", label: "Senior", description: "6+ years experience" },
] as const;

export const DURATION_OPTIONS = [
  { value: "quick", label: "Quick", questions: 5, description: "~10 minutes" },
  { value: "standard", label: "Standard", questions: 10, description: "~20 minutes" },
  { value: "full", label: "Full", questions: 15, description: "~35 minutes" },
] as const;
