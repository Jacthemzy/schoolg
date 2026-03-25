import sharp from "sharp";
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
  const tableTop = 290;
  const maxRows = Math.max(report.subjects.length, 10);
  const height = tableTop + maxRows * rowHeight + 280;

  const rows = report.subjects
    .map((item, index) => {
      const y = tableTop + (index + 1) * rowHeight;
      return `
        <text x="70" y="${y}" class="cell">${index + 1}</text>
        <text x="125" y="${y}" class="cell">${esc(item.subject)}</text>
        <text x="620" y="${y}" class="cell center">${item.classWork}</text>
        <text x="740" y="${y}" class="cell center">${item.examScore}</text>
        <text x="860" y="${y}" class="cell center">${item.total}</text>
        <text x="980" y="${y}" class="cell center">${esc(item.grade)}</text>
        <text x="1095" y="${y}" class="cell center">${esc(item.remark)}</text>
      `;
    })
    .join("");

  const rowLines = Array.from({ length: maxRows + 1 }, (_, index) => {
    const y = tableTop - 18 + index * rowHeight;
    return `<line x1="50" y1="${y}" x2="1190" y2="${y}" class="rule"/>`;
  }).join("");

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <style>
        .title { font: 700 32px Arial, sans-serif; fill: #000; }
        .subtitle { font: 700 16px Arial, sans-serif; fill: #000; }
        .meta { font: 400 17px Arial, sans-serif; fill: #000; }
        .head { font: 700 16px Arial, sans-serif; fill: #000; }
        .cell { font: 400 15px Arial, sans-serif; fill: #000; dominant-baseline: middle; }
        .center { text-anchor: middle; }
        .rule { stroke: #000; stroke-width: 1; }
        .box { fill: #fff; stroke: #000; stroke-width: 2; }
      </style>
      <rect width="100%" height="100%" fill="#fff"/>
      <rect x="30" y="30" width="1180" height="${height - 60}" class="box"/>
      <text x="620" y="80" text-anchor="middle" class="title">STUDENT REPORT CARD</text>
      <text x="620" y="110" text-anchor="middle" class="subtitle">Nigerian Continuous Assessment Format</text>

      <text x="60" y="160" class="meta">Student Name: ${esc(report.studentName)}</text>
      <text x="760" y="160" class="meta">DMS No: ${esc(report.studentDmsNumber || "-")}</text>
      <text x="60" y="195" class="meta">Class: ${esc(report.className)}</text>
      <text x="360" y="195" class="meta">Term: ${esc(report.term)}</text>
      <text x="600" y="195" class="meta">Session: ${esc(report.sessionLabel)}</text>
      <text x="900" y="195" class="meta">Attendance: ${esc(String(report.attendanceDays ?? "-"))}</text>
      <text x="60" y="230" class="meta">No. of Subjects: ${report.subjectCount}</text>
      <text x="360" y="230" class="meta">Total Score: ${report.totalObtained}</text>
      <text x="600" y="230" class="meta">Average: ${report.average.toFixed(2)}%</text>
      <text x="900" y="230" class="meta">Next Term Begins: ${esc(report.nextTermBegins || "-")}</text>

      <line x1="50" y1="255" x2="1190" y2="255" class="rule"/>
      <text x="70" y="272" class="head">S/N</text>
      <text x="125" y="272" class="head">Subject</text>
      <text x="620" y="272" class="head center">CA</text>
      <text x="740" y="272" class="head center">Exam</text>
      <text x="860" y="272" class="head center">Total</text>
      <text x="980" y="272" class="head center">Grade</text>
      <text x="1095" y="272" class="head center">Remark</text>
      ${rowLines}
      <line x1="100" y1="255" x2="100" y2="${tableTop - 18 + maxRows * rowHeight}" class="rule"/>
      <line x1="580" y1="255" x2="580" y2="${tableTop - 18 + maxRows * rowHeight}" class="rule"/>
      <line x1="680" y1="255" x2="680" y2="${tableTop - 18 + maxRows * rowHeight}" class="rule"/>
      <line x1="800" y1="255" x2="800" y2="${tableTop - 18 + maxRows * rowHeight}" class="rule"/>
      <line x1="920" y1="255" x2="920" y2="${tableTop - 18 + maxRows * rowHeight}" class="rule"/>
      <line x1="1040" y1="255" x2="1040" y2="${tableTop - 18 + maxRows * rowHeight}" class="rule"/>
      ${rows}

      <text x="60" y="${height - 190}" class="head">Teacher's Comment</text>
      <text x="60" y="${height - 160}" class="meta">${esc(report.teacherComment)}</text>
      <text x="60" y="${height - 110}" class="head">Principal's Comment</text>
      <text x="60" y="${height - 80}" class="meta">${esc(report.principalComment)}</text>
      <line x1="60" y1="${height - 40}" x2="370" y2="${height - 40}" class="rule"/>
      <line x1="830" y1="${height - 40}" x2="1140" y2="${height - 40}" class="rule"/>
      <text x="60" y="${height - 18}" class="meta">Class Teacher</text>
      <text x="830" y="${height - 18}" class="meta">Principal</text>
    </svg>
  `;
}

export async function renderReportCardRaster(
  report: ReportCardView,
  format: "png" | "jpeg",
) {
  const svg = renderReportCardSvg(report);
  const renderer = sharp(Buffer.from(svg));

  if (format === "jpeg") {
    return renderer.jpeg({ quality: 92 }).toBuffer();
  }

  return renderer.png().toBuffer();
}

export async function renderReportCardPdf(report: ReportCardView) {
  const image = await renderReportCardRaster(report, "jpeg");
  const metadata = await sharp(image).metadata();
  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const imageWidth = metadata.width ?? 1240;
  const imageHeight = metadata.height ?? 1754;
  const ratio = Math.min(pageWidth / imageWidth, pageHeight / imageHeight);
  const drawWidth = imageWidth * ratio;
  const drawHeight = imageHeight * ratio;
  const x = (pageWidth - drawWidth) / 2;
  const y = (pageHeight - drawHeight) / 2;

  return buildPdfWithJpeg({
    jpegBuffer: image,
    imageWidth,
    imageHeight,
    pageWidth,
    pageHeight,
    drawWidth,
    drawHeight,
    x,
    y,
  });
}

function buildPdfWithJpeg({
  jpegBuffer,
  imageWidth,
  imageHeight,
  pageWidth,
  pageHeight,
  drawWidth,
  drawHeight,
  x,
  y,
}: {
  jpegBuffer: Buffer;
  imageWidth: number;
  imageHeight: number;
  pageWidth: number;
  pageHeight: number;
  drawWidth: number;
  drawHeight: number;
  x: number;
  y: number;
}) {
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

  addObject(1, "<< /Type /Catalog /Pages 2 0 R >>");
  addObject(2, "<< /Type /Pages /Kids [3 0 R] /Count 1 >>");
  addObject(
    3,
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth.toFixed(2)} ${pageHeight.toFixed(
      2,
    )}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>`,
  );

  const imageHeader = Buffer.from(
    `<< /Type /XObject /Subtype /Image /Width ${imageWidth} /Height ${imageHeight} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBuffer.length} >>\nstream\n`,
  );
  const imageFooter = Buffer.from("\nendstream");
  addObject(4, Buffer.concat([imageHeader, jpegBuffer, imageFooter]));

  const contentStream = `q\n${drawWidth.toFixed(2)} 0 0 ${drawHeight.toFixed(
    2,
  )} ${x.toFixed(2)} ${y.toFixed(2)} cm\n/Im0 Do\nQ`;
  addObject(
    5,
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

  return Buffer.concat([...parts, Buffer.from(trailer)]);
}
