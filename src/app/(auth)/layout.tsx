import { Brain } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800">
      <div className="w-full max-w-md px-4">
        <div className="mb-8 text-center">
          <Brain className="mx-auto h-12 w-12 text-blue-600" />
          <h1 className="mt-4 text-2xl font-bold text-slate-900 dark:text-white">InterviewPrep AI</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Master your next interview with AI</p>
        </div>
        {children}
      </div>
    </div>
  );
}
