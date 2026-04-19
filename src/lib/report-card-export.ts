import { getGradePalette, type ReportCardView } from "@/lib/report-card";

function esc(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function renderReportCardSvg(report: ReportCardView) {
  const width = 1240;
  const height = 1754;
  const rowHeight = 46;
  const tableTop = 440;
  const behaviourTop = tableTop + Math.max(report.subjects.length, 10) * rowHeight + 70;

  const rows = report.subjects
    .map((item, index) => {
      const y = tableTop + index * rowHeight;
      const palette = getGradePalette(item.grade);
      return `
        <rect x="58" y="${y}" width="1124" height="${rowHeight}" fill="#ffffff"/>
        <text x="80" y="${y + 29}" ${textStyle(18, 600)}>${esc(item.subject)}</text>
        <text x="660" y="${y + 29}" ${textStyle(17, 500, "middle")}>${item.classWork}</text>
        <text x="770" y="${y + 29}" ${textStyle(17, 500, "middle")}>${item.examScore}</text>
        <text x="880" y="${y + 29}" ${textStyle(17, 500, "middle")}>${item.total}</text>
        <rect x="930" y="${y + 8}" width="78" height="30" rx="15" fill="${palette.bg}" stroke="${palette.border}"/>
        <text x="969" y="${y + 28}" ${textStyle(15, 700, "middle", palette.text)}>${esc(item.grade)}</text>
        <text x="1090" y="${y + 29}" ${textStyle(16, 500, "middle")}>${esc(item.remark)}</text>
      `;
    })
    .join("");

  const behaviourRows = report.behaviourRatings
    .map(
      (item, index) => `
        <rect x="${58 + (index % 2) * 560}" y="${behaviourTop + Math.floor(index / 2) * 54}" width="530" height="40" rx="18" fill="#f8fafc" stroke="#cbd5e1"/>
        <text x="${84 + (index % 2) * 560}" y="${behaviourTop + Math.floor(index / 2) * 54 + 25}" ${textStyle(15, 600, "start", "#334155")}>${esc(item.label)}</text>
        <text x="${530 + (index % 2) * 560}" y="${behaviourTop + Math.floor(index / 2) * 54 + 25}" ${textStyle(15, 700, "end", "#0f172a")}>${esc(item.rating || "Not rated")}</text>
      `,
    )
    .join("");

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <rect width="100%" height="100%" fill="#edf2f7"/>
      <rect x="28" y="28" width="1184" height="1698" rx="34" fill="#ffffff" stroke="#cbd5e1" stroke-width="2"/>
      <rect x="58" y="58" width="1124" height="124" rx="30" fill="#0f172a"/>
      <text x="92" y="112" ${textStyle(18, 700, "start", "#a7f3d0", "4px")}>DIVINE MISSION SCHOOL</text>
      <text x="92" y="152" ${textStyle(36, 700, "start", "#ffffff")}>STUDENT REPORT CARD</text>
      <text x="1090" y="112" ${textStyle(15, 600, "end", "#d1fae5")}>A4 FORMAT</text>
      <text x="1090" y="148" ${textStyle(17, 500, "end", "#ffffff")}>${esc(report.term)} • ${esc(report.sessionLabel)}</text>

      <rect x="58" y="214" width="540" height="170" rx="28" fill="#f8fafc" stroke="#cbd5e1"/>
      <rect x="642" y="214" width="540" height="170" rx="28" fill="#f8fafc" stroke="#cbd5e1"/>
      ${detailLine(92, 258, "Student", report.studentName)}
      ${detailLine(92, 296, "DMS Number", report.studentDmsNumber || "N/A")}
      ${detailLine(92, 334, "Class", report.className)}
      ${detailLine(92, 372, "Gender", report.gender || "Not provided")}
      ${detailLine(676, 258, "Attendance", String(report.attendanceDays ?? "-"))}
      ${detailLine(676, 296, "Teacher", report.teacherName || "Class Teacher")}
      ${detailLine(676, 334, "Next Term", report.nextTermBegins || "-")}
      ${detailLine(676, 372, "Resumption", report.resumptionDate || "-")}

      <text x="58" y="420" ${textStyle(16, 700, "start", "#334155", "2px")}>ACADEMIC PERFORMANCE</text>
      <rect x="58" y="${tableTop - 44}" width="1124" height="44" rx="18" fill="#e2e8f0"/>
      <text x="80" y="${tableTop - 16}" ${textStyle(15, 700, "start", "#334155")}>Subject</text>
      <text x="660" y="${tableTop - 16}" ${textStyle(15, 700, "middle", "#334155")}>CA</text>
      <text x="770" y="${tableTop - 16}" ${textStyle(15, 700, "middle", "#334155")}>Exam</text>
      <text x="880" y="${tableTop - 16}" ${textStyle(15, 700, "middle", "#334155")}>Total</text>
      <text x="969" y="${tableTop - 16}" ${textStyle(15, 700, "middle", "#334155")}>Grade</text>
      <text x="1090" y="${tableTop - 16}" ${textStyle(15, 700, "middle", "#334155")}>Remark</text>
      ${rows}

      <rect x="58" y="${behaviourTop - 28}" width="1124" height="170" rx="28" fill="#ffffff" stroke="#cbd5e1"/>
      <text x="82" y="${behaviourTop - 4}" ${textStyle(16, 700, "start", "#334155", "2px")}>BEHAVIOUR RATINGS</text>
      ${behaviourRows}

      <rect x="58" y="${behaviourTop + 180}" width="540" height="180" rx="28" fill="#f8fafc" stroke="#cbd5e1"/>
      <rect x="642" y="${behaviourTop + 180}" width="540" height="180" rx="28" fill="#f8fafc" stroke="#cbd5e1"/>
      <text x="82" y="${behaviourTop + 214}" ${textStyle(15, 700, "start", "#334155", "2px")}>TEACHER'S COMMENT</text>
      <text x="82" y="${behaviourTop + 254}" ${textStyle(17, 500, "start", "#334155")}>${esc(report.teacherComment)}</text>
      <text x="666" y="${behaviourTop + 214}" ${textStyle(15, 700, "start", "#334155", "2px")}>PRINCIPAL'S COMMENT</text>
      <text x="666" y="${behaviourTop + 254}" ${textStyle(17, 500, "start", "#334155")}>${esc(report.principalComment)}</text>

      ${signatureBlock(58, behaviourTop + 392, "Class Teacher", report.teacherName || "Class Teacher", report.teacherSignature)}
      ${signatureBlock(642, behaviourTop + 392, "Principal", report.schoolName, report.principalSignature)}

      <rect x="58" y="1548" width="1124" height="112" rx="28" fill="#0f172a"/>
      <text x="92" y="1600" ${textStyle(18, 600, "start", "#ffffff")}>Subjects: ${report.subjectCount}</text>
      <text x="400" y="1600" ${textStyle(18, 600, "start", "#ffffff")}>Total Score: ${report.totalObtained}</text>
      <text x="760" y="1600" ${textStyle(18, 700, "start", "#a7f3d0")}>Average: ${report.average.toFixed(2)}%</text>
      <text x="92" y="1640" ${textStyle(14, 500, "start", "#cbd5e1")}>Generated from the Divine Mission School CBT examination system.</text>
    </svg>
  `;
}

function signatureBlock(
  x: number,
  y: number,
  role: string,
  name: string,
  signature?: string,
) {
  return `
    <rect x="${x}" y="${y}" width="540" height="180" rx="28" fill="#ffffff" stroke="#cbd5e1"/>
    <text x="${x + 24}" y="${y + 34}" ${textStyle(15, 700, "start", "#334155", "2px")}>${esc(role.toUpperCase())}</text>
    ${
      signature
        ? `<image href="${signature}" x="${x + 24}" y="${y + 46}" width="220" height="72" preserveAspectRatio="xMinYMid meet"/>`
        : `<text x="${x + 24}" y="${y + 94}" ${textStyle(16, 500, "start", "#94a3b8")}>No signature added</text>`
    }
    <line x1="${x + 24}" y1="${y + 124}" x2="${x + 240}" y2="${y + 124}" stroke="#94a3b8" stroke-width="1.5"/>
    <text x="${x + 24}" y="${y + 152}" ${textStyle(16, 600, "start", "#0f172a")}>${esc(name)}</text>
  `;
}

function detailLine(x: number, y: number, label: string, value: string) {
  return `
    <text x="${x}" y="${y}" ${textStyle(13, 700, "start", "#64748b", "1.8px")}>${esc(label.toUpperCase())}</text>
    <text x="${x}" y="${y + 24}" ${textStyle(20, 600, "start", "#0f172a")}>${esc(value)}</text>
  `;
}

function textStyle(
  size: number,
  weight: number,
  anchor: "start" | "middle" | "end" = "start",
  fill = "#000",
  letterSpacing?: string,
) {
  return [
    'font-family="Arial, sans-serif"',
    `font-size="${size}"`,
    `font-weight="${weight}"`,
    `fill="${fill}"`,
    `text-anchor="${anchor}"`,
    letterSpacing ? `letter-spacing="${letterSpacing}"` : "",
  ]
    .filter(Boolean)
    .join(" ");
}

export async function renderReportCardPdf(report: ReportCardView): Promise<Uint8Array> {
  return buildReportCardPdf(report);
}

function buildReportCardPdf(report: ReportCardView): Uint8Array {
  const pageWidth = 842;
  const pageHeight = 1191;
  const rowHeight = 22;
  const tableTop = 255;
  const behaviourTop = tableTop + Math.max(report.subjects.length, 10) * rowHeight + 50;
  const header = Buffer.from("%PDF-1.4\n%\xFF\xFF\xFF\xFF\n", "binary");
  const parts: Buffer[] = [header];
  const offsets: number[] = [0];
  let length = header.length;

  const addObject = (objectNumber: number, body: Buffer | string) => {
    const objectBuffer = Buffer.concat([
      Buffer.from(`${objectNumber} 0 obj\n`),
      typeof body === "string" ? Buffer.from(body) : body,
      Buffer.from("\nendobj\n"),
    ]);
    offsets[objectNumber] = length;
    parts.push(objectBuffer);
    length += objectBuffer.length;
  };

  const top = (value: number) => pageHeight - value;
  const line = (x1: number, y1: number, x2: number, y2: number) =>
    `${x1.toFixed(2)} ${top(y1).toFixed(2)} m ${x2.toFixed(2)} ${top(y2).toFixed(2)} l S`;
  const rect = (x: number, y: number, w: number, h: number) =>
    `${x.toFixed(2)} ${top(y + h).toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re S`;
  const text = (x: number, y: number, value: string, size: number, font: "F1" | "F2" = "F1") =>
    `BT /${font} ${size} Tf 1 0 0 1 ${x.toFixed(2)} ${top(y).toFixed(2)} Tm (${pdfEsc(value)}) Tj ET`;

  const contentParts = [
    "0.94 0.96 0.98 rg",
    "0 0 842 1191 re f",
    "0 0 0 RG",
    "1 w",
    rect(20, 20, 802, 1151),
    "0.06 0.09 0.16 rg",
    "40 1070 762 80 re f",
    text(58, 1104, report.schoolName.toUpperCase(), 11, "F2"),
    text(58, 1080, "STUDENT REPORT CARD", 20, "F2"),
    text(640, 1104, "A4 FORMAT", 10, "F2"),
    text(600, 1080, `${report.term} - ${report.sessionLabel}`, 10),
    "0 0 0 rg",
    rect(40, 900, 360, 120),
    rect(442, 900, 360, 120),
    text(56, 996, `Student: ${report.studentName}`, 11, "F2"),
    text(56, 972, `DMS Number: ${report.studentDmsNumber || "N/A"}`, 11),
    text(56, 948, `Class: ${report.className}`, 11),
    text(56, 924, `Gender: ${report.gender || "Not provided"}`, 11),
    text(458, 996, `Attendance: ${String(report.attendanceDays ?? "-")}`, 11, "F2"),
    text(458, 972, `Teacher: ${report.teacherName || "Class Teacher"}`, 11),
    text(458, 948, `Next Term: ${report.nextTermBegins || "-"}`, 11),
    text(458, 924, `Resumption: ${report.resumptionDate || "-"}`, 11),
    text(40, 870, "ACADEMIC PERFORMANCE", 10, "F2"),
    rect(40, tableTop - 22, 762, 22),
    text(50, tableTop - 7, "Subject", 9, "F2"),
    text(470, tableTop - 7, "CA", 9, "F2"),
    text(545, tableTop - 7, "Exam", 9, "F2"),
    text(620, tableTop - 7, "Total", 9, "F2"),
    text(695, tableTop - 7, "Grade", 9, "F2"),
    text(750, tableTop - 7, "Remark", 9, "F2"),
  ];

  for (let index = 0; index <= Math.max(report.subjects.length, 10); index += 1) {
    contentParts.push(line(40, tableTop + index * rowHeight, 802, tableTop + index * rowHeight));
  }

  report.subjects.forEach((item, index) => {
    const y = tableTop + 15 + index * rowHeight;
    contentParts.push(text(50, y, item.subject, 9));
    contentParts.push(text(470, y, String(item.classWork), 9));
    contentParts.push(text(545, y, String(item.examScore), 9));
    contentParts.push(text(620, y, String(item.total), 9));
    contentParts.push(text(695, y, item.grade, 9, "F2"));
    contentParts.push(text(750, y, item.remark, 9));
  });

  contentParts.push(rect(40, behaviourTop, 762, 120));
  contentParts.push(text(50, behaviourTop + 20, "BEHAVIOUR RATINGS", 10, "F2"));
  report.behaviourRatings.forEach((item, index) => {
    const col = index % 2;
    const row = Math.floor(index / 2);
    const x = 56 + col * 370;
    const y = behaviourTop + 46 + row * 24;
    contentParts.push(text(x, y, `${item.label}: ${item.rating || "Not rated"}`, 9));
  });

  contentParts.push(rect(40, behaviourTop + 146, 360, 120));
  contentParts.push(rect(442, behaviourTop + 146, 360, 120));
  contentParts.push(text(50, behaviourTop + 168, "TEACHER'S COMMENT", 10, "F2"));
  contentParts.push(text(50, behaviourTop + 194, report.teacherComment, 9));
  contentParts.push(text(452, behaviourTop + 168, "PRINCIPAL'S COMMENT", 10, "F2"));
  contentParts.push(text(452, behaviourTop + 194, report.principalComment, 9));
  contentParts.push(rect(40, behaviourTop + 286, 360, 120));
  contentParts.push(rect(442, behaviourTop + 286, 360, 120));
  contentParts.push(text(50, behaviourTop + 308, "CLASS TEACHER", 10, "F2"));
  contentParts.push(text(50, behaviourTop + 380, report.teacherName || "Class Teacher", 9));
  contentParts.push(text(452, behaviourTop + 308, "PRINCIPAL", 10, "F2"));
  contentParts.push(text(452, behaviourTop + 380, report.schoolName, 9));
  contentParts.push(line(50, behaviourTop + 360, 220, behaviourTop + 360));
  contentParts.push(line(452, behaviourTop + 360, 622, behaviourTop + 360));

  contentParts.push("0.06 0.09 0.16 rg");
  contentParts.push("40 60 762 70 re f");
  contentParts.push(text(56, 100, `Subjects: ${report.subjectCount}`, 11, "F2"));
  contentParts.push(text(240, 100, `Total Score: ${report.totalObtained}`, 11, "F2"));
  contentParts.push(text(520, 100, `Average: ${report.average.toFixed(2)}%`, 11, "F2"));

  const contentStream = contentParts.join("\n");

  addObject(1, "<< /Type /Catalog /Pages 2 0 R >>");
  addObject(2, "<< /Type /Pages /Kids [3 0 R] /Count 1 >>");
  addObject(
    3,
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>`,
  );
  addObject(4, "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  addObject(5, "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>");
  addObject(
    6,
    `<< /Length ${Buffer.byteLength(contentStream)} >>\nstream\n${contentStream}\nendstream`,
  );

  const xrefOffset = length;
  const xrefEntries = Array.from({ length: offsets.length }, (_, index) => offsets[index] ?? 0)
    .map((offset, index) =>
      index === 0
        ? "0000000000 65535 f "
        : `${String(offset).padStart(10, "0")} 00000 n `,
    )
    .join("\n");

  const trailer = `xref\n0 ${offsets.length}\n${xrefEntries}\ntrailer\n<< /Size ${offsets.length} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return new Uint8Array(Buffer.concat([...parts, Buffer.from(trailer)]));
}

function pdfEsc(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}
