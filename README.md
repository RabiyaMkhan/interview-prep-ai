# InterviewPrep AI

AI-powered mock interview practice platform with real-time feedback, voice support, and detailed analytics.

## Quick Start

### Prerequisites
- Node.js 18+ 
- An Anthropic API key (for Claude AI)

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
# Edit .env and add your ANTHROPIC_API_KEY
# Optionally add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET for Google OAuth

# 3. Initialize the database
npx prisma migrate dev

# 4. Start the development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

### Google OAuth Setup (Optional)
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create credentials > OAuth 2.0 Client ID
3. Add `http://localhost:3000/api/auth/callback/google` as authorized redirect URI
4. Copy Client ID and Client Secret to `.env`

## Architecture

### Tech Stack
- **Framework**: Next.js 14 (App Router, TypeScript)
- **Database**: SQLite with Prisma ORM (swap to PostgreSQL by changing `provider` in `prisma/schema.prisma`)
- **Styling**: Tailwind CSS + shadcn/ui (Radix UI primitives)
- **Auth**: NextAuth.js v4 (Credentials + Google OAuth)
- **AI**: Anthropic Claude API (claude-sonnet-4-20250514)
- **Charts**: Recharts
- **PDF**: jsPDF

### Folder Structure

```
src/
├── app/
│   ├── (auth)/              # Auth pages (login, register)
│   │   ├── login/
│   │   └── register/
│   ├── (dashboard)/         # Authenticated pages
│   │   ├── dashboard/       # Main analytics dashboard
│   │   ├── interview/
│   │   │   ├── new/         # Interview setup wizard
│   │   │   ├── [sessionId]/ # Live interview session
│   │   │   └── report/[sessionId]/  # End-of-interview report
│   │   ├── questions/       # Question bank library
│   │   └── profile/         # User profile settings
│   ├── api/                 # API routes
│   │   ├── auth/            # NextAuth + registration
│   │   ├── badges/          # Badge/gamification API
│   │   ├── dashboard/       # Dashboard analytics data
│   │   ├── interview/       # Interview CRUD + answer processing
│   │   ├── profile/         # Profile management
│   │   ├── questions/       # Question bank + saved questions
│   │   └── resume/          # Resume upload/parsing
│   └── layout.tsx           # Root layout with providers
├── components/
│   ├── ui/                  # shadcn/ui components
│   ├── auth/                # Auth form components
│   ├── dashboard/           # Dashboard-specific components
│   ├── interview/           # Interview flow components
│   ├── layout/              # Navbar, Providers
│   └── question-bank/       # Question bank components
├── hooks/                   # Custom React hooks
├── lib/
│   ├── ai/                  # Claude API integration
│   ├── auth/                # NextAuth configuration
│   ├── pdf/                 # PDF report generation
│   ├── prisma.ts            # Prisma client singleton
│   ├── speech/              # Web Speech API integration
│   ├── utils/               # Shared utilities & constants
│   └── validators/          # Zod validation schemas
└── generated/prisma/        # Auto-generated Prisma client
```

## AI Prompt Design Strategy

### Multi-Turn Conversation Management

The AI interview engine maintains conversation context through a structured prompt architecture:

1. **System Prompt**: Sets the AI's persona as a professional interviewer, including:
   - Job role and industry context
   - Difficulty level calibration (entry/mid/senior)
   - Interview type rules (technical, behavioral, HR, mixed)
   - Optional job description tailoring
   - Optional resume context for personalized questions

2. **Conversation History**: Full message history is passed to Claude on each call:
   ```
   System: [Interviewer persona + context]
   Assistant: [Previous questions]
   User: [Candidate's previous answers]
   Assistant: [Follow-up or next question]
   ...
   ```

3. **Dynamic Follow-ups**: After each answer, a separate lightweight API call determines if a follow-up question would add value (~30% probability), creating realistic back-and-forth dialogue.

### Prompt Architecture

| Function | Model | Purpose | Token Budget |
|----------|-------|---------|-------------|
| `generateQuestion` | Claude Sonnet | Generate contextual interview question | 1024 |
| `generateFeedback` | Claude Sonnet | Evaluate answer with structured JSON feedback | 2048 |
| `generateFollowUp` | Claude Sonnet | Decide if follow-up needed + generate it | 512 |
| `generateSessionReport` | Claude Sonnet | End-of-session comprehensive analysis | 3000 |

### Rate Limiting & Cost Optimization
- First questions are cached by role/type/difficulty to reduce redundant calls
- Feedback uses structured JSON output to minimize token usage
- Follow-up decisions use minimal tokens with binary branching

## Key Features

### 1. Interview Flow
- Chat-style UI with AI typing indicators
- Text input + voice input (Web Speech API)
- Text-to-speech for questions (optional)
- Live timer per session
- Thinking time before answering

### 2. Real-Time Feedback
- Per-answer score (0-100)
- Strengths and improvements identified
- Filler word detection (umm, like, you know)
- Suggested improved answers
- STAR method structure checking

### 3. End-of-Interview Report
- Overall score with category breakdown
- Question-by-question detailed analysis
- Downloadable PDF report
- AI-generated performance summary

### 4. Analytics Dashboard
- Score trend line chart over time
- Radar chart for category performance
- Bar chart comparing job roles practiced
- Weekly goal progress tracking
- Practice streak counter

### 5. Resume-Aware Interviewing
- Upload PDF or text resume
- AI references specific projects and skills
- Questions tailored to claimed experience

### 6. Gamification
- Achievement badges (First Interview, Score 90+, etc.)
- Practice streak tracking
- Weekly goals with progress visualization

## Database Schema

Key models:
- **User**: Auth accounts, linked to profile and sessions
- **Profile**: Target role, experience, resume, streak data
- **InterviewSession**: Session config, status, scores
- **Question**: Individual Q&A with feedback and scores
- **ScoreHistory**: Historical scores for analytics
- **SavedQuestion**: User's saved question library
- **Badge/UserBadge**: Achievement system
- **QuestionBank**: Pre-stored fallback questions

## Environment Variables

```env
DATABASE_URL="file:./dev.db"                          # SQLite (or PostgreSQL URL)
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-here"                     # Generate with: openssl rand -base64 32
ANTHROPIC_API_KEY="sk-ant-..."                         # Required for AI features
GOOGLE_CLIENT_ID=""                                    # Optional - Google OAuth
GOOGLE_CLIENT_SECRET=""                                # Optional - Google OAuth
```

## Switching to PostgreSQL

1. Edit `prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
2. Update `.env`: `DATABASE_URL="postgresql://user:password@localhost:5432/interviewprep"`
3. Run: `npx prisma migrate dev --name init`

## Browser Support

- **Voice features**: Chrome, Edge, Safari (latest)
- **Core features**: All modern browsers
- Graceful fallback when Web Speech API is unavailable
