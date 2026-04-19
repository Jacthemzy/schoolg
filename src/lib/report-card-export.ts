import { getGradePalette, type ReportCardView } from "@/lib/report-card";

function esc(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatGeneratedDate(date: Date) {
  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function renderReportCardSvg(report: ReportCardView) {
  const width = 1240;
  const height = 1754;
  const rowHeight = 46;
  const tableTop = 496;
  const maxRows = Math.max(report.subjects.length, 10);
  const behaviourTop = tableTop + maxRows * rowHeight + 72;
  const generatedLabel = formatGeneratedDate(report.generatedAt);

  const rows = report.subjects
    .map((item, index) => {
      const y = tableTop + index * rowHeight;
      const palette = getGradePalette(item.grade);
      return `
        <line x1="58" y1="${y}" x2="1182" y2="${y}" stroke="#cbd5e1" stroke-width="1"/>
        <text x="82" y="${y + 29}" ${textStyle(18, 600, "start", "#0f172a")}>${esc(item.subject)}</text>
        <text x="665" y="${y + 29}" ${textStyle(17, 500, "middle", "#334155")}>${item.classWork}</text>
        <text x="775" y="${y + 29}" ${textStyle(17, 500, "middle", "#334155")}>${item.examScore}</text>
        <text x="885" y="${y + 29}" ${textStyle(17, 500, "middle", "#334155")}>${item.total}</text>
        <rect x="930" y="${y + 9}" width="78" height="28" rx="14" fill="${palette.bg}" stroke="${palette.border}"/>
        <text x="969" y="${y + 28}" ${textStyle(15, 700, "middle", palette.text)}>${esc(item.grade)}</text>
        <text x="1094" y="${y + 29}" ${textStyle(16, 500, "middle", "#334155")}>${esc(item.remark)}</text>
      `;
    })
    .join("");

  const behaviourRows = report.behaviourRatings
    .map((item, index) => {
      const column = index % 2;
      const row = Math.floor(index / 2);
      const x = 84 + column * 550;
      const y = behaviourTop + 18 + row * 52;
      return `
        <rect x="${x - 18}" y="${y - 14}" width="510" height="38" rx="18" fill="#f8fafc" stroke="#cbd5e1"/>
        <text x="${x}" y="${y + 10}" ${textStyle(15, 600, "start", "#334155")}>${esc(item.label)}</text>
        <text x="${x + 450}" y="${y + 10}" ${textStyle(15, 700, "end", "#0f172a")}>${esc(item.rating || "Not rated")}</text>
      `;
    })
    .join("");

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <rect width="100%" height="100%" fill="#edf2f7"/>
      <rect x="28" y="28" width="1184" height="1698" rx="34" fill="#ffffff" stroke="#cbd5e1" stroke-width="2"/>
      <rect x="58" y="58" width="1124" height="150" rx="30" fill="#0f172a"/>
      <text x="92" y="114" ${textStyle(16, 700, "start", "#a7f3d0", "4px")}>EDUCATION FOR SUCCESS AND PEACE</text>
      <text x="92" y="154" ${textStyle(34, 700, "start", "#ffffff")}>${esc(report.schoolName.toUpperCase())}</text>
      <text x="92" y="190" ${textStyle(22, 600, "start", "#ffffff")}>STUDENT REPORT CARD</text>
      <text x="820" y="106" ${textStyle(14, 600, "start", "#d1fae5")}>Generated</text>
      <text x="820" y="134" ${textStyle(18, 700, "start", "#ffffff")}>${esc(generatedLabel)}</text>
      <text x="820" y="164" ${textStyle(17, 500, "start", "#ffffff")}>${esc(report.term)} • ${esc(report.sessionLabel)}</text>
      ${stampSvg(1072, 132, 78, report.schoolName, generatedLabel)}

      <rect x="58" y="236" width="1124" height="108" rx="24" fill="#ecfdf5" stroke="#a7f3d0"/>
      <text x="88" y="270" ${textStyle(13, 700, "start", "#047857", "2px")}>STUDENT NAME</text>
      <text x="88" y="314" ${textStyle(32, 700, "start", "#0f172a")}>${esc(report.studentName)}</text>
      <text x="760" y="314" ${textStyle(17, 600, "start", "#334155")}>${esc(report.className)} • ${esc(report.term)} • ${esc(report.sessionLabel)}</text>

      <rect x="58" y="372" width="540" height="170" rx="28" fill="#f8fafc" stroke="#cbd5e1"/>
      <rect x="642" y="372" width="540" height="170" rx="28" fill="#f8fafc" stroke="#cbd5e1"/>
      ${detailLine(92, 414, "DMS Number", report.studentDmsNumber || "N/A")}
      ${detailLine(92, 454, "Gender", report.gender || "Not provided")}
      ${detailLine(92, 494, "Attendance", String(report.attendanceDays ?? "-"))}
      ${detailLine(676, 414, "Teacher", report.teacherName || "Class Teacher")}
      ${detailLine(676, 454, "Next Term", report.nextTermBegins || "-")}
      ${detailLine(676, 494, "Resumption", report.resumptionDate || "-")}

      <text x="58" y="470" ${textStyle(16, 700, "start", "#334155", "2px")}>ACADEMIC PERFORMANCE</text>
      <rect x="58" y="${tableTop - 42}" width="1124" height="42" rx="18" fill="#e2e8f0"/>
      <text x="82" y="${tableTop - 15}" ${textStyle(15, 700, "start", "#334155")}>Subject</text>
      <text x="665" y="${tableTop - 15}" ${textStyle(15, 700, "middle", "#334155")}>CA</text>
      <text x="775" y="${tableTop - 15}" ${textStyle(15, 700, "middle", "#334155")}>Exam</text>
      <text x="885" y="${tableTop - 15}" ${textStyle(15, 700, "middle", "#334155")}>Total</text>
      <text x="969" y="${tableTop - 15}" ${textStyle(15, 700, "middle", "#334155")}>Grade</text>
      <text x="1094" y="${tableTop - 15}" ${textStyle(15, 700, "middle", "#334155")}>Remark</text>
      ${rows}
      <line x1="58" y1="${tableTop + maxRows * rowHeight}" x2="1182" y2="${tableTop + maxRows * rowHeight}" stroke="#cbd5e1" stroke-width="1"/>

      <rect x="58" y="${behaviourTop - 20}" width="1124" height="156" rx="28" fill="#ffffff" stroke="#cbd5e1"/>
      <text x="82" y="${behaviourTop + 8}" ${textStyle(16, 700, "start", "#334155", "2px")}>BEHAVIOUR RATINGS</text>
      ${behaviourRows}

      <rect x="58" y="${behaviourTop + 164}" width="540" height="186" rx="28" fill="#f8fafc" stroke="#cbd5e1"/>
      <rect x="642" y="${behaviourTop + 164}" width="540" height="186" rx="28" fill="#f8fafc" stroke="#cbd5e1"/>
      <text x="82" y="${behaviourTop + 198}" ${textStyle(15, 700, "start", "#334155", "2px")}>TEACHER'S COMMENT</text>
      <foreignObject x="82" y="${behaviourTop + 216}" width="480" height="110">
        <div xmlns="http://www.w3.org/1999/xhtml" style="font: 500 18px Arial, sans-serif; color: #334155; line-height: 1.5;">${esc(report.teacherComment)}</div>
      </foreignObject>
      <text x="666" y="${behaviourTop + 198}" ${textStyle(15, 700, "start", "#334155", "2px")}>PRINCIPAL'S COMMENT</text>
      <foreignObject x="666" y="${behaviourTop + 216}" width="480" height="110">
        <div xmlns="http://www.w3.org/1999/xhtml" style="font: 500 18px Arial, sans-serif; color: #334155; line-height: 1.5;">${esc(report.principalComment)}</div>
      </foreignObject>

      ${signatureBlock(58, behaviourTop + 378, "Class Teacher", report.teacherName || "Class Teacher", report.teacherSignature)}
      ${signatureBlock(642, behaviourTop + 378, "Principal", report.schoolName, report.principalSignature)}

      <rect x="58" y="1570" width="1124" height="90" rx="28" fill="#0f172a"/>
      <text x="92" y="1624" ${textStyle(18, 600, "start", "#ffffff")}>Subjects: ${report.subjectCount}</text>
      <text x="406" y="1624" ${textStyle(18, 600, "start", "#ffffff")}>Total Score: ${report.totalObtained}</text>
      <text x="760" y="1624" ${textStyle(18, 700, "start", "#a7f3d0")}>Average: ${report.average.toFixed(2)}%</text>
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
        ? `<image href="${signature}" x="${x + 24}" y="${y + 48}" width="220" height="72" preserveAspectRatio="xMinYMid meet"/>`
        : `<text x="${x + 24}" y="${y + 96}" ${textStyle(16, 500, "start", "#94a3b8")}>No signature added</text>`
    }
    <line x1="${x + 24}" y1="${y + 126}" x2="${x + 240}" y2="${y + 126}" stroke="#94a3b8" stroke-width="1.5"/>
    <text x="${x + 24}" y="${y + 154}" ${textStyle(16, 600, "start", "#0f172a")}>${esc(name)}</text>
  `;
}

function stampSvg(
  cx: number,
  cy: number,
  radius: number,
  schoolName: string,
  generatedLabel: string,
) {
  return `
    <g opacity="0.95">
      <circle cx="${cx}" cy="${cy}" r="${radius}" fill="#f0fdf4" stroke="#166534" stroke-width="4"/>
      <circle cx="${cx}" cy="${cy}" r="${radius - 14}" fill="none" stroke="#166534" stroke-width="2" stroke-dasharray="5 4"/>
      <text x="${cx}" y="${cy - 28}" ${textStyle(10, 700, "middle", "#14532d", "2px")}>OFFICIAL</text>
      <text x="${cx}" y="${cy - 12}" ${textStyle(10, 700, "middle", "#14532d", "2px")}>STAMP</text>
      <text x="${cx}" y="${cy + 10}" ${textStyle(12, 700, "middle", "#14532d")}>${esc(schoolName.toUpperCase())}</text>
      <text x="${cx}" y="${cy + 28}" ${textStyle(8, 600, "middle", "#14532d")}>${esc(generatedLabel)}</text>
    </g>
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
  const rowHeight = 24;
  const tableTop = 340;
  const maxRows = Math.max(report.subjects.length, 10);
  const behaviourTop = tableTop + maxRows * rowHeight + 46;
  const generatedLabel = formatGeneratedDate(report.generatedAt);
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
  const rectFill = (x: number, y: number, w: number, h: number, r: number, g: number, b: number) =>
    `${r} ${g} ${b} rg ${x.toFixed(2)} ${top(y + h).toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re f`;
  const rectStroke = (x: number, y: number, w: number, h: number) =>
    `0.79 0.85 0.91 RG ${x.toFixed(2)} ${top(y + h).toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re S`;
  const line = (x1: number, y1: number, x2: number, y2: number) =>
    `0.79 0.85 0.91 RG ${x1.toFixed(2)} ${top(y1).toFixed(2)} m ${x2.toFixed(2)} ${top(y2).toFixed(2)} l S`;
  const text = (
    x: number,
    y: number,
    value: string,
    size: number,
    font: "F1" | "F2" = "F1",
    color: [number, number, number] = [0, 0, 0],
  ) =>
    `${color[0]} ${color[1]} ${color[2]} rg BT /${font} ${size} Tf 1 0 0 1 ${x.toFixed(2)} ${top(y).toFixed(2)} Tm (${pdfEsc(
      value,
    )}) Tj ET`;
  const circle = (cx: number, cy: number, radius: number) => {
    const c = 0.552284749831 * radius;
    const y = top(cy);
    return [
      `${(cx + radius).toFixed(2)} ${y.toFixed(2)} m`,
      `${(cx + radius).toFixed(2)} ${(y + c).toFixed(2)} ${(cx + c).toFixed(2)} ${(y + radius).toFixed(2)} ${cx.toFixed(2)} ${(y + radius).toFixed(2)} c`,
      `${(cx - c).toFixed(2)} ${(y + radius).toFixed(2)} ${(cx - radius).toFixed(2)} ${(y + c).toFixed(2)} ${(cx - radius).toFixed(2)} ${y.toFixed(2)} c`,
      `${(cx - radius).toFixed(2)} ${(y - c).toFixed(2)} ${(cx - c).toFixed(2)} ${(y - radius).toFixed(2)} ${cx.toFixed(2)} ${(y - radius).toFixed(2)} c`,
      `${(cx + c).toFixed(2)} ${(y - radius).toFixed(2)} ${(cx + radius).toFixed(2)} ${(y - c).toFixed(2)} ${(cx + radius).toFixed(2)} ${y.toFixed(2)} c`,
      "S",
    ].join("\n");
  };
  const stamp = (cx: number, cy: number, radius: number) =>
    [
      "0.09 0.33 0.18 RG",
      "0.94 0.99 0.96 rg",
      circle(cx, cy, radius),
      "0.09 0.33 0.18 RG",
      circle(cx, cy, radius - 12),
      text(cx - 24, cy - 18, "STAMP", 9, "F2", [0.09, 0.33, 0.18]),
      text(cx - 32, cy + 4, "DMS", 12, "F2", [0.09, 0.33, 0.18]),
    ].join("\n");

  const contentParts = [
    rectFill(0, 0, pageWidth, pageHeight, 0.94, 0.96, 0.98),
    rectFill(20, 20, 802, 1151, 1, 1, 1),
    rectStroke(20, 20, 802, 1151),

    rectFill(40, 40, 762, 110, 0.06, 0.09, 0.16),
    text(56, 78, "EDUCATION FOR SUCCESS AND PEACE", 11, "F2", [0.65, 0.95, 0.82]),
    text(56, 104, report.schoolName.toUpperCase(), 20, "F2", [1, 1, 1]),
    text(56, 128, "STUDENT REPORT CARD", 15, "F2", [1, 1, 1]),
    text(560, 78, "Generated", 9, "F2", [0.82, 0.98, 0.9]),
    text(560, 102, generatedLabel, 11, "F2", [1, 1, 1]),
    text(560, 126, `${report.term} - ${report.sessionLabel}`, 10, "F1", [1, 1, 1]),
    stamp(728, 95, 38),

    rectFill(40, 170, 762, 70, 0.93, 0.99, 0.96),
    rectStroke(40, 170, 762, 70),
    text(56, 192, "STUDENT NAME", 9, "F2", [0.02, 0.47, 0.34]),
    text(56, 220, report.studentName, 18, "F2", [0.06, 0.09, 0.16]),
    text(500, 220, `${report.className} - ${report.term} - ${report.sessionLabel}`, 10, "F2", [0.2, 0.25, 0.32]),

    rectFill(40, 258, 360, 118, 0.97, 0.98, 0.99),
    rectFill(442, 258, 360, 118, 0.97, 0.98, 0.99),
    rectStroke(40, 258, 360, 118),
    rectStroke(442, 258, 360, 118),
    text(56, 286, `DMS Number: ${report.studentDmsNumber || "N/A"}`, 11, "F2", [0.06, 0.09, 0.16]),
    text(56, 312, `Gender: ${report.gender || "Not provided"}`, 11, "F1", [0.2, 0.25, 0.32]),
    text(56, 338, `Attendance: ${String(report.attendanceDays ?? "-")}`, 11, "F1", [0.2, 0.25, 0.32]),
    text(458, 286, `Teacher: ${report.teacherName || "Class Teacher"}`, 11, "F2", [0.06, 0.09, 0.16]),
    text(458, 312, `Next Term: ${report.nextTermBegins || "-"}`, 11, "F1", [0.2, 0.25, 0.32]),
    text(458, 338, `Resumption: ${report.resumptionDate || "-"}`, 11, "F1", [0.2, 0.25, 0.32]),

    text(40, tableTop - 20, "ACADEMIC PERFORMANCE", 10, "F2", [0.2, 0.25, 0.32]),
    rectFill(40, tableTop, 762, 24, 0.89, 0.91, 0.94),
    text(52, tableTop + 16, "Subject", 9, "F2", [0.2, 0.25, 0.32]),
    text(470, tableTop + 16, "CA", 9, "F2", [0.2, 0.25, 0.32]),
    text(544, tableTop + 16, "Exam", 9, "F2", [0.2, 0.25, 0.32]),
    text(620, tableTop + 16, "Total", 9, "F2", [0.2, 0.25, 0.32]),
    text(694, tableTop + 16, "Grade", 9, "F2", [0.2, 0.25, 0.32]),
    text(748, tableTop + 16, "Remark", 9, "F2", [0.2, 0.25, 0.32]),
  ];

  for (let index = 0; index <= maxRows; index += 1) {
    contentParts.push(line(40, tableTop + 24 + index * rowHeight, 802, tableTop + 24 + index * rowHeight));
  }

  report.subjects.forEach((item, index) => {
    const y = tableTop + 41 + index * rowHeight;
    contentParts.push(text(52, y, item.subject, 9, "F2", [0.06, 0.09, 0.16]));
    contentParts.push(text(470, y, String(item.classWork), 9, "F1", [0.2, 0.25, 0.32]));
    contentParts.push(text(544, y, String(item.examScore), 9, "F1", [0.2, 0.25, 0.32]));
    contentParts.push(text(620, y, String(item.total), 9, "F1", [0.2, 0.25, 0.32]));
    contentParts.push(text(694, y, item.grade, 9, "F2", [0.06, 0.09, 0.16]));
    contentParts.push(text(748, y, item.remark, 9, "F1", [0.2, 0.25, 0.32]));
  });

  contentParts.push(rectFill(40, behaviourTop, 762, 110, 1, 1, 1));
  contentParts.push(rectStroke(40, behaviourTop, 762, 110));
  contentParts.push(text(52, behaviourTop + 20, "BEHAVIOUR RATINGS", 10, "F2", [0.2, 0.25, 0.32]));
  report.behaviourRatings.forEach((item, index) => {
    const col = index % 2;
    const row = Math.floor(index / 2);
    const x = 52 + col * 370;
    const y = behaviourTop + 48 + row * 22;
    contentParts.push(text(x, y, `${item.label}: ${item.rating || "Not rated"}`, 9, "F1", [0.2, 0.25, 0.32]));
  });

  contentParts.push(rectFill(40, behaviourTop + 128, 360, 120, 0.97, 0.98, 0.99));
  contentParts.push(rectFill(442, behaviourTop + 128, 360, 120, 0.97, 0.98, 0.99));
  contentParts.push(rectStroke(40, behaviourTop + 128, 360, 120));
  contentParts.push(rectStroke(442, behaviourTop + 128, 360, 120));
  contentParts.push(text(52, behaviourTop + 148, "TEACHER'S COMMENT", 10, "F2", [0.2, 0.25, 0.32]));
  contentParts.push(text(52, behaviourTop + 174, truncateText(report.teacherComment, 56), 9, "F1", [0.2, 0.25, 0.32]));
  contentParts.push(text(454, behaviourTop + 148, "PRINCIPAL'S COMMENT", 10, "F2", [0.2, 0.25, 0.32]));
  contentParts.push(text(454, behaviourTop + 174, truncateText(report.principalComment, 56), 9, "F1", [0.2, 0.25, 0.32]));

  contentParts.push(rectFill(40, behaviourTop + 266, 360, 118, 1, 1, 1));
  contentParts.push(rectFill(442, behaviourTop + 266, 360, 118, 1, 1, 1));
  contentParts.push(rectStroke(40, behaviourTop + 266, 360, 118));
  contentParts.push(rectStroke(442, behaviourTop + 266, 360, 118));
  contentParts.push(text(52, behaviourTop + 286, "CLASS TEACHER", 10, "F2", [0.2, 0.25, 0.32]));
  contentParts.push(text(52, behaviourTop + 360, report.teacherName || "Class Teacher", 9, "F1", [0.06, 0.09, 0.16]));
  contentParts.push(text(454, behaviourTop + 286, "PRINCIPAL", 10, "F2", [0.2, 0.25, 0.32]));
  contentParts.push(text(454, behaviourTop + 360, report.schoolName, 9, "F1", [0.06, 0.09, 0.16]));
  contentParts.push(line(52, behaviourTop + 340, 220, behaviourTop + 340));
  contentParts.push(line(454, behaviourTop + 340, 622, behaviourTop + 340));

  contentParts.push(rectFill(40, 1088, 762, 58, 0.06, 0.09, 0.16));
  contentParts.push(text(56, 1122, `Subjects: ${report.subjectCount}`, 11, "F2", [1, 1, 1]));
  contentParts.push(text(250, 1122, `Total Score: ${report.totalObtained}`, 11, "F2", [1, 1, 1]));
  contentParts.push(text(520, 1122, `Average: ${report.average.toFixed(2)}%`, 11, "F2", [0.65, 0.95, 0.82]));

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

function truncateText(value: string, length: number) {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= length) {
    return normalized;
  }

  return `${normalized.slice(0, Math.max(0, length - 3))}...`;
}

function pdfEsc(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}
