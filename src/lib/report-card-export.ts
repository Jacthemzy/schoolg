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
  const tableTop = 355;
  const maxRows = Math.max(report.subjects.length, 10);
  const height = tableTop + maxRows * rowHeight + 280;
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
      <circle cx="1090" cy="112" r="78" fill="#fde8f0" fill-opacity="0.75" stroke="#881337" stroke-opacity="0.62" stroke-width="4"/>
      <circle cx="1090" cy="112" r="63" fill="none" stroke="#881337" stroke-opacity="0.48" stroke-width="2"/>
      <text x="1090" y="82" ${textStyle(12, 700, "middle", "#7f1d1d", "1.5px")}>OFFICIAL STAMP</text>
      <text x="1090" y="106" ${textStyle(16, 700, "middle", "#7f1d1d")}>${esc(report.schoolName.toUpperCase())}</text>
      <text x="1090" y="128" ${textStyle(10, 700, "middle", "#7f1d1d", "1.2px")}>GENERATED</text>
      <text x="1090" y="148" ${textStyle(11, 600, "middle", "#7f1d1d")}>${esc(generatedLabel)}</text>
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
      <line x1="60" y1="${height - 40}" x2="370" y2="${height - 40}" ${lineStyle()}/>
      <line x1="830" y1="${height - 40}" x2="1140" y2="${height - 40}" ${lineStyle()}/>
      <text x="60" y="${height - 18}" ${textStyle(17, 400)}>${esc(report.teacherName || "Class Teacher")}</text>
      <text x="830" y="${height - 18}" ${textStyle(17, 400)}>Principal</text>
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

export async function renderReportCardRaster(
  report: ReportCardView,
  format: "png" | "jpeg",
): Promise<Uint8Array> {
  const svg = renderReportCardSvg(report);
  const renderer = sharp(Buffer.from(svg));
  const raster =
    format === "jpeg"
      ? await renderer.jpeg({ quality: 92 }).toBuffer()
      : await renderer.png().toBuffer();

  return new Uint8Array(raster);
}

export async function renderReportCardPdf(report: ReportCardView): Promise<Uint8Array> {
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
  jpegBuffer: Uint8Array;
  imageWidth: number;
  imageHeight: number;
  pageWidth: number;
  pageHeight: number;
  drawWidth: number;
  drawHeight: number;
  x: number;
  y: number;
}): Uint8Array {
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

  return new Uint8Array(Buffer.concat([...parts, Buffer.from(trailer)]));
}
