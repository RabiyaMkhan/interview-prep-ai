import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const profileSchema = z.object({
  name: z.string().min(2).optional(),
  targetJobRole: z.string().optional(),
  industry: z.string().optional(),
  experienceLevel: z.string().optional(),
  weeklyGoal: z.number().min(1).max(20).optional(),
});

export const interviewSetupSchema = z.object({
  jobRole: z.string().min(1, "Please select a job role"),
  interviewType: z.string().min(1, "Please select an interview type"),
  difficulty: z.string().min(1, "Please select a difficulty level"),
  duration: z.string().min(1, "Please select a duration"),
  jobDescription: z.string().optional(),
});

export const answerSchema = z.object({
  answer: z.string().min(1, "Please provide an answer"),
  isVoiceInput: z.boolean().optional().default(false),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
export type InterviewSetupInput = z.infer<typeof interviewSetupSchema>;
export type AnswerInput = z.infer<typeof answerSchema>;
