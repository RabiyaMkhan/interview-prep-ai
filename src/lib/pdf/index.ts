import jsPDF from "jspdf";

interface ReportData {
  sessionDate: string;
  jobRole: string;
  interviewType: string;
  difficulty: string;
  overallScore: number;
  clarityScore: number;
  relevanceScore: number;
  confidenceScore: number;
  structureScore: number;
  technicalScore: number;
  summary: string;
  questions: {
    question: string;
    answer: string;
    score: number;
    feedback: string;
    suggestedAnswer: string;
    strengths: string;
    improvements: string;
  }[];
}

export function generatePDFReport(data: ReportData): jsPDF {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const checkNewPage = (needed: number) => {
    if (y + needed > doc.internal.pageSize.getHeight() - margin) {
      doc.addPage();
      y = margin;
    }
  };

  // Header
  doc.setFillColor(59, 130, 246);
  doc.rect(0, 0, pageWidth, 40, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("InterviewPrep AI - Performance Report", margin, 25);
  doc.setFontSize(10);
  doc.text(`Generated on ${data.sessionDate}`, margin, 33);

  y = 50;

  // Session Info
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Session Details", margin, y);
  y += 8;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Job Role: ${data.jobRole}`, margin, y); y += 6;
  doc.text(`Interview Type: ${data.interviewType}`, margin, y); y += 6;
  doc.text(`Difficulty: ${data.difficulty}`, margin, y); y += 10;

  // Overall Score
  checkNewPage(40);
  doc.setFillColor(243, 244, 246);
  doc.roundedRect(margin, y, contentWidth, 30, 3, 3, "F");
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(`Overall Score: ${data.overallScore}/100`, margin + 10, y + 12);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const scoreLabel = data.overallScore >= 80 ? "Excellent" : data.overallScore >= 60 ? "Good" : "Needs Improvement";
  doc.text(`Rating: ${scoreLabel}`, margin + 10, y + 20);
  y += 38;

  // Score Breakdown
  checkNewPage(50);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Score Breakdown", margin, y);
  y += 10;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);

  const scores = [
    ["Clarity", data.clarityScore],
    ["Relevance", data.relevanceScore],
    ["Confidence", data.confidenceScore],
    ["Structure", data.structureScore],
    ["Technical Accuracy", data.technicalScore],
  ];

  for (const [label, scoreVal] of scores) {
    const score = Number(scoreVal) || 0;
    doc.text(`${label}:`, margin + 5, y);
    doc.text(`${score}/100`, margin + 80, y);

    // Bar
    doc.setFillColor(229, 231, 235);
    doc.roundedRect(margin + 95, y - 3, 60, 4, 1, 1, "F");
    const barColor = score >= 80 ? [34, 197, 94] : score >= 60 ? [234, 179, 8] : [239, 68, 68];
    doc.setFillColor(barColor[0], barColor[1], barColor[2]);
    doc.roundedRect(margin + 95, y - 3, (score / 100) * 60, 4, 1, 1, "F");

    y += 8;
  }
  y += 8;

  // Summary
  checkNewPage(30);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Performance Summary", margin, y);
  y += 8;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const summaryLines = doc.splitTextToSize(data.summary, contentWidth);
  doc.text(summaryLines, margin, y);
  y += summaryLines.length * 5 + 10;

  // Questions Breakdown
  for (let i = 0; i < data.questions.length; i++) {
    const q = data.questions[i];
    checkNewPage(60);

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(`Question ${i + 1} (Score: ${q.score}/100)`, margin, y);
    y += 7;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);

    const qLines = doc.splitTextToSize(`Q: ${q.question}`, contentWidth - 5);
    doc.text(qLines, margin + 5, y);
    y += qLines.length * 4 + 3;

    const aLines = doc.splitTextToSize(`A: ${q.answer || "No answer provided"}`, contentWidth - 5);
    doc.text(aLines, margin + 5, y);
    y += aLines.length * 4 + 3;

    if (q.feedback) {
      const fLines = doc.splitTextToSize(`Feedback: ${q.feedback}`, contentWidth - 5);
      checkNewPage(fLines.length * 4 + 5);
      doc.setFont("helvetica", "italic");
      doc.text(fLines, margin + 5, y);
      doc.setFont("helvetica", "normal");
      y += fLines.length * 4 + 3;
    }

    if (q.suggestedAnswer) {
      const sLines = doc.splitTextToSize(`Suggested: ${q.suggestedAnswer}`, contentWidth - 5);
      checkNewPage(sLines.length * 4 + 5);
      doc.setTextColor(59, 130, 246);
      doc.text(sLines, margin + 5, y);
      doc.setTextColor(0, 0, 0);
      y += sLines.length * 4 + 5;
    }

    y += 5;
  }

  // Footer
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `InterviewPrep AI | Page ${i} of ${totalPages}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: "center" }
    );
  }

  return doc;
}
