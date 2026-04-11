import type { ReportCardView } from "@/lib/report-card";

function esc(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function renderReportCardSvg(report: ReportCardView) {
  const width = 1240;
  const rowHeight = 34;
  const tableTop = 355;
  const maxRows = Math.max(report.subjects.length, 10);
  const height = tableTop + maxRows * rowHeight + 340;
  const generatedLabel = new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(report.generatedAt);

  const rows = report.subjects
    .map((item, index) => {
      const y = tableTop + (index + 1) * rowHeight;
      return `
        <text x="70" y="${y}" ${cellTextStyle()}>${index + 1}</text>
        <text x="125" y="${y}" ${cellTextStyle()}>${esc(item.subject)}</text>
        <text x="620" y="${y}" ${cellTextStyle("middle")}>${item.classWork}</text>
        <text x="740" y="${y}" ${cellTextStyle("middle")}>${item.examScore}</text>
        <text x="860" y="${y}" ${cellTextStyle("middle")}>${item.total}</text>
        <text x="980" y="${y}" ${cellTextStyle("middle")}>${esc(item.grade)}</text>
        <text x="1095" y="${y}" ${cellTextStyle("middle")}>${esc(item.remark)}</text>
      `;
    })
    .join("");

  const rowLines = Array.from({ length: maxRows + 1 }, (_, index) => {
    const y = tableTop - 18 + index * rowHeight;
    return `<line x1="50" y1="${y}" x2="1190" y2="${y}" ${lineStyle()}/>`;
  }).join("");

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="Student report card">
      <rect width="100%" height="100%" fill="#fff"/>
      <rect x="30" y="30" width="1180" height="${height - 60}" fill="#fff" stroke="#000" stroke-width="2"/>
      <g opacity="0.12" transform="rotate(-14 620 480)">
        <circle cx="620" cy="480" r="190" fill="#dcfce7" stroke="#166534" stroke-width="7"/>
        <circle cx="620" cy="480" r="154" fill="none" stroke="#166534" stroke-width="4" stroke-dasharray="10 8"/>
        <text x="620" y="412" ${textStyle(18, 700, "middle", "#14532d", "4px")}>OFFICIAL STAMP</text>
        <text x="620" y="452" ${textStyle(28, 700, "middle", "#14532d")}>${esc(report.schoolName.toUpperCase())}</text>
        <text x="620" y="488" ${textStyle(14, 700, "middle", "#14532d", "1.6px")}>EDUCATION FOR SUCCESS AND PEACE</text>
        <text x="620" y="524" ${textStyle(11, 700, "middle", "#14532d", "2px")}>GENERATED ON</text>
        <text x="620" y="552" ${textStyle(13, 600, "middle", "#14532d")}>${esc(generatedLabel)}</text>
      </g>
      <circle cx="1090" cy="112" r="82" fill="#f0fdf4" fill-opacity="0.96" stroke="#166534" stroke-opacity="0.7" stroke-width="4"/>
      <circle cx="1090" cy="112" r="66" fill="none" stroke="#166534" stroke-opacity="0.55" stroke-width="2" stroke-dasharray="6 4"/>
      <text x="1090" y="76" ${textStyle(10, 700, "middle", "#14532d", "2px")}>OFFICIAL</text>
      <text x="1090" y="91" ${textStyle(10, 700, "middle", "#14532d", "2px")}>STAMP</text>
      <text x="1090" y="111" ${textStyle(13, 700, "middle", "#14532d")}>${esc(report.schoolName.toUpperCase())}</text>
      <text x="1090" y="131" ${textStyle(7.6, 700, "middle", "#14532d", "0.6px")}>EDUCATION FOR SUCCESS</text>
      <text x="1090" y="143" ${textStyle(7.6, 700, "middle", "#14532d", "0.6px")}>AND PEACE</text>
      <text x="1090" y="160" ${textStyle(8, 600, "middle", "#14532d")}>${esc(generatedLabel)}</text>
      <text x="620" y="60" ${textStyle(32, 700, "middle")}>${esc(report.schoolName.toUpperCase())}</text>
      <text x="620" y="88" ${textStyle(16, 700, "middle")}>Education for Success and Peace</text>
      <text x="620" y="112" ${textStyle(17, 400, "middle")}>08164039006, 08106565953</text>
      <text x="620" y="138" ${textStyle(17, 400, "middle")}>STUDENT REPORT CARD</text>

      <text x="60" y="175" ${textStyle(17, 400)}>Student Name: ${esc(report.studentName)}</text>
      <text x="760" y="175" ${textStyle(17, 400)}>DMS No: ${esc(report.studentDmsNumber || "-")}</text>
      <text x="60" y="205" ${textStyle(17, 400)}>Gender: ${esc(report.gender || "-")}</text>
      <text x="360" y="205" ${textStyle(17, 400)}>Class: ${esc(report.className)}</text>
      <text x="760" y="205" ${textStyle(17, 400)}>Teacher: ${esc(report.teacherName || "-")}</text>
      <text x="60" y="235" ${textStyle(17, 400)}>Term: ${esc(report.term)}</text>
      <text x="360" y="235" ${textStyle(17, 400)}>Session: ${esc(report.sessionLabel)}</text>
      <text x="760" y="235" ${textStyle(17, 400)}>Attendance: ${esc(String(report.attendanceDays ?? "-"))}</text>
      <text x="60" y="265" ${textStyle(17, 400)}>No. of Subjects: ${report.subjectCount}</text>
      <text x="360" y="265" ${textStyle(17, 400)}>Total Score: ${report.totalObtained}</text>
      <text x="600" y="265" ${textStyle(17, 400)}>Average: ${report.average.toFixed(2)}%</text>
      <text x="900" y="265" ${textStyle(17, 400)}>Next Term Begins: ${esc(report.nextTermBegins || "-")}</text>
      <text x="900" y="295" ${textStyle(17, 400)}>Resumption Date: ${esc(report.resumptionDate || "-")}</text>

      <line x1="50" y1="320" x2="1190" y2="320" ${lineStyle()}/>
      <text x="70" y="337" ${textStyle(16, 700)}>S/N</text>
      <text x="125" y="337" ${textStyle(16, 700)}>Subject</text>
      <text x="620" y="337" ${textStyle(16, 700, "middle")}>CA</text>
      <text x="740" y="337" ${textStyle(16, 700, "middle")}>Exam</text>
      <text x="860" y="337" ${textStyle(16, 700, "middle")}>Total</text>
      <text x="980" y="337" ${textStyle(16, 700, "middle")}>Grade</text>
      <text x="1095" y="337" ${textStyle(16, 700, "middle")}>Remark</text>
      ${rowLines}
      <line x1="100" y1="255" x2="100" y2="${tableTop - 18 + maxRows * rowHeight}" ${lineStyle()}/>
      <line x1="580" y1="255" x2="580" y2="${tableTop - 18 + maxRows * rowHeight}" ${lineStyle()}/>
      <line x1="680" y1="255" x2="680" y2="${tableTop - 18 + maxRows * rowHeight}" ${lineStyle()}/>
      <line x1="800" y1="255" x2="800" y2="${tableTop - 18 + maxRows * rowHeight}" ${lineStyle()}/>
      <line x1="920" y1="255" x2="920" y2="${tableTop - 18 + maxRows * rowHeight}" ${lineStyle()}/>
      <line x1="1040" y1="255" x2="1040" y2="${tableTop - 18 + maxRows * rowHeight}" ${lineStyle()}/>
      ${rows}

      <text x="60" y="${height - 190}" ${textStyle(16, 700)}>Teacher's Comment</text>
      <text x="60" y="${height - 160}" ${textStyle(17, 400)}>${esc(report.teacherComment)}</text>
      <text x="60" y="${height - 110}" ${textStyle(16, 700)}>Principal's Comment</text>
      <text x="60" y="${height - 80}" ${textStyle(17, 400)}>${esc(report.principalComment)}</text>
      <text x="60" y="${height - 42}" ${textStyle(30, 600, "start", "#111827")}>${esc(
        makeSignature(report.teacherName || "Class Teacher"),
      )}</text>
      <text x="830" y="${height - 42}" ${textStyle(30, 600, "start", "#111827")}>${esc(
        makeSignature("Divine Mission School"),
      )}</text>
      <line x1="60" y1="${height - 24}" x2="370" y2="${height - 24}" ${lineStyle()}/>
      <line x1="830" y1="${height - 24}" x2="1140" y2="${height - 24}" ${lineStyle()}/>
      <text x="60" y="${height - 2}" ${textStyle(12, 700, "start", "#475569", "1.4px")}>CLASS TEACHER</text>
      <text x="60" y="${height + 16}" ${textStyle(13, 400, "start", "#111827")}>${esc(
        report.teacherName || "Class Teacher",
      )}</text>
      <text x="60" y="${height + 34}" ${textStyle(11, 400, "start", "#475569")}>Signed ${esc(
        generatedLabel,
      )}</text>
      <text x="830" y="${height - 2}" ${textStyle(12, 700, "start", "#475569", "1.4px")}>PRINCIPAL</text>
      <text x="830" y="${height + 16}" ${textStyle(13, 400, "start", "#111827")}>Divine Mission School</text>
      <text x="830" y="${height + 34}" ${textStyle(11, 400, "start", "#475569")}>Signed ${esc(
        generatedLabel,
      )}</text>
    </svg>
  `;
}

function textStyle(
  size: number,
  weight: number,
  anchor?: "start" | "middle" | "end",
  fill = "#000",
  letterSpacing?: string,
) {
  return [
    'font-family="Arial, sans-serif"',
    `font-size="${size}"`,
    `font-weight="${weight}"`,
    `fill="${fill}"`,
    anchor ? `text-anchor="${anchor}"` : "",
    letterSpacing ? `letter-spacing="${letterSpacing}"` : "",
  ]
    .filter(Boolean)
    .join(" ");
}

function cellTextStyle(anchor?: "start" | "middle" | "end") {
  return `${textStyle(15, 400, anchor)} dominant-baseline="middle"`;
}

function lineStyle() {
  return 'stroke="#000" stroke-width="1" shape-rendering="crispEdges"';
}

export async function renderReportCardPdf(report: ReportCardView): Promise<Uint8Array> {
  return buildReportCardPdf(report);
}

function buildReportCardPdf(report: ReportCardView): Uint8Array {
  const pageWidth = 842;
  const rowHeight = 22;
  const tableTop = 265;
  const maxRows = Math.max(report.subjects.length, 10);
  const pageHeight = tableTop + maxRows * rowHeight + 250;
  const generatedLabel = new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(report.generatedAt);
  const header = Buffer.from("%PDF-1.4\n%\xFF\xFF\xFF\xFF\n", "binary");
  const parts: Buffer[] = [header];
  const offsets: number[] = [0];
  let length = header.length;

  const addObject = (objectNumber: number, body: Buffer | string) => {
    const header = Buffer.from(`${objectNumber} 0 obj\n`);
    const footer = Buffer.from(`\nendobj\n`);
    const bodyBuffer = typeof body === "string" ? Buffer.from(body) : body;
    offsets[objectNumber] = length;
    const objectBuffer = Buffer.concat([header, bodyBuffer, footer]);
    parts.push(objectBuffer);
    length += objectBuffer.length;
  };

  const top = (value: number) => pageHeight - value;
  const line = (x1: number, y1: number, x2: number, y2: number) =>
    `${x1.toFixed(2)} ${top(y1).toFixed(2)} m ${x2.toFixed(2)} ${top(y2).toFixed(2)} l S`;
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
  const text = (
    x: number,
    y: number,
    value: string,
    size: number,
    font: "F1" | "F2" = "F1",
  ) =>
    `BT /${font} ${size} Tf 1 0 0 1 ${x.toFixed(2)} ${top(y).toFixed(2)} Tm (${pdfEsc(
      value,
    )}) Tj ET`;
  const centeredText = (
    x: number,
    y: number,
    value: string,
    size: number,
    font: "F1" | "F2" = "F1",
  ) =>
    `BT /${font} ${size} Tf 1 0 0 1 ${x.toFixed(2)} ${top(y).toFixed(
      2,
    )} Tm ${textWidth(value, size, font).toFixed(2)} 0 Td (${pdfEsc(value)}) Tj ET`;
  const stampCircle = (x: number, y: number, radius: number, dashed = false) =>
    [
      "0.09 0.33 0.18 RG",
      dashed ? "[5 4] 0 d" : "[] 0 d",
      dashed ? "1.6 w" : "2.4 w",
      circle(x, y, radius),
      "[] 0 d",
      "1 w",
      "0 0 0 RG",
    ].join("\n");
  const watermarkCircle = (x: number, y: number, radius: number, dashed = false) =>
    [
      "0.82 0.93 0.85 RG",
      dashed ? "[8 6] 0 d" : "[] 0 d",
      dashed ? "2.2 w" : "4 w",
      circle(x, y, radius),
      "[] 0 d",
      "1 w",
      "0 0 0 RG",
    ].join("\n");

  const contentParts = [
    "0 0 0 RG",
    "0 0 0 rg",
    "1 w",
    line(20, 20, pageWidth - 20, 20),
    line(pageWidth - 20, 20, pageWidth - 20, pageHeight - 20),
    line(pageWidth - 20, pageHeight - 20, 20, pageHeight - 20),
    line(20, pageHeight - 20, 20, 20),
    text(245, 48, report.schoolName.toUpperCase(), 20, "F2"),
    text(292, 70, "Education for Success and Peace", 11, "F2"),
    text(315, 88, "08164039006, 08106565953", 11),
    text(325, 108, "STUDENT REPORT CARD", 11),
    watermarkCircle(421, 405, 132),
    watermarkCircle(421, 405, 108, true),
    centeredText(421, 360, "OFFICIAL STAMP", 11.5, "F2"),
    centeredText(421, 387, report.schoolName.toUpperCase(), 16, "F2"),
    centeredText(421, 411, "EDUCATION FOR SUCCESS AND PEACE", 8, "F2"),
    centeredText(421, 434, "GENERATED ON", 7.5, "F2"),
    centeredText(421, 451, generatedLabel, 8),
    stampCircle(680, 74, 53),
    stampCircle(680, 74, 41, true),
    centeredText(680, 44, "OFFICIAL", 7, "F2"),
    centeredText(680, 55, "STAMP", 7, "F2"),
    centeredText(680, 70, report.schoolName.toUpperCase(), 8.2, "F2"),
    centeredText(680, 84, "EDUCATION FOR", 5.4, "F2"),
    centeredText(680, 93, "SUCCESS AND PEACE", 5.4, "F2"),
    centeredText(680, 105, generatedLabel, 6.4),
    text(40, 140, `Student Name: ${report.studentName}`, 11),
    text(430, 140, `DMS No: ${report.studentDmsNumber || "-"}`, 11),
    text(40, 162, `Gender: ${report.gender || "-"}`, 11),
    text(220, 162, `Class: ${report.className}`, 11),
    text(430, 162, `Teacher: ${report.teacherName || "-"}`, 11),
    text(40, 184, `Term: ${report.term}`, 11),
    text(220, 184, `Session: ${report.sessionLabel}`, 11),
    text(430, 184, `Attendance: ${String(report.attendanceDays ?? "-")}`, 11),
    text(40, 206, `No. of Subjects: ${String(report.subjectCount)}`, 11),
    text(220, 206, `Total Score: ${String(report.totalObtained)}`, 11),
    text(400, 206, `Average: ${report.average.toFixed(2)}%`, 11),
    text(560, 206, `Next Term Begins: ${report.nextTermBegins || "-"}`, 11),
    text(560, 226, `Resumption Date: ${report.resumptionDate || "-"}`, 11),
    line(35, 245, pageWidth - 35, 245),
    text(45, 260, "S/N", 10, "F2"),
    text(90, 260, "Subject", 10, "F2"),
    text(435, 260, "CA", 10, "F2"),
    text(510, 260, "Exam", 10, "F2"),
    text(590, 260, "Total", 10, "F2"),
    text(665, 260, "Grade", 10, "F2"),
    text(730, 260, "Remark", 10, "F2"),
    line(70, 192, 70, tableTop + maxRows * rowHeight),
    line(400, 192, 400, tableTop + maxRows * rowHeight),
    line(475, 192, 475, tableTop + maxRows * rowHeight),
    line(555, 192, 555, tableTop + maxRows * rowHeight),
    line(635, 192, 635, tableTop + maxRows * rowHeight),
    line(705, 192, 705, tableTop + maxRows * rowHeight),
  ];

  for (let index = 0; index <= maxRows; index += 1) {
    const y = tableTop + index * rowHeight;
    contentParts.push(line(35, y, pageWidth - 35, y));
  }

  report.subjects.forEach((item, index) => {
    const y = tableTop + 16 + index * rowHeight;
    contentParts.push(text(45, y, String(index + 1), 10));
    contentParts.push(text(90, y, item.subject, 10));
    contentParts.push(text(435, y, String(item.classWork), 10));
    contentParts.push(text(510, y, String(item.examScore), 10));
    contentParts.push(text(590, y, String(item.total), 10));
    contentParts.push(text(665, y, item.grade, 10));
    contentParts.push(text(730, y, item.remark, 10));
  });

  const commentTop = tableTop + maxRows * rowHeight + 35;
  contentParts.push(text(40, commentTop, "Teacher's Comment", 10, "F2"));
  contentParts.push(text(40, commentTop + 18, report.teacherComment, 10));
  contentParts.push(text(40, commentTop + 50, "Principal's Comment", 10, "F2"));
  contentParts.push(text(40, commentTop + 68, report.principalComment, 10));
  contentParts.push(text(40, pageHeight - 84, makeSignature(report.teacherName || "Class Teacher"), 20));
  contentParts.push(text(600, pageHeight - 84, makeSignature("Divine Mission School"), 20));
  contentParts.push(line(40, pageHeight - 68, 250, pageHeight - 68));
  contentParts.push(line(600, pageHeight - 68, 790, pageHeight - 68));
  contentParts.push(text(40, pageHeight - 52, "CLASS TEACHER", 9, "F2"));
  contentParts.push(text(40, pageHeight - 38, report.teacherName || "Class Teacher", 10));
  contentParts.push(text(40, pageHeight - 22, `Signed ${generatedLabel}`, 8));
  contentParts.push(text(600, pageHeight - 52, "PRINCIPAL", 9, "F2"));
  contentParts.push(text(600, pageHeight - 38, "Divine Mission School", 10));
  contentParts.push(text(600, pageHeight - 22, `Signed ${generatedLabel}`, 8));

  const contentStream = contentParts.join("\n");

  addObject(1, "<< /Type /Catalog /Pages 2 0 R >>");
  addObject(2, "<< /Type /Pages /Kids [3 0 R] /Count 1 >>");
  addObject(
    3,
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth.toFixed(2)} ${pageHeight.toFixed(
      2,
    )}] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>`,
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

function textWidth(value: string, size: number, font: "F1" | "F2") {
  const factor = font === "F2" ? 0.285 : 0.27;
  return -value.length * size * factor;
}

function makeSignature(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}
