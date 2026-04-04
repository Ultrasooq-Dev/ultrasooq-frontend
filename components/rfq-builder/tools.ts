/**
 * Free tools for RFQ Builder — no AI credits needed.
 * OCR, Barcode Scanner, Excel/CSV Parser
 */

// ─── OCR: Extract text from image OR PDF ────────────────────────
export async function extractTextFromImage(file: File): Promise<string> {
  if (file.type === "application/pdf") {
    return extractTextFromPdf(file);
  }
  // Image: use tesseract OCR
  const url = URL.createObjectURL(file);
  try {
    const { createWorker } = await import("tesseract.js");
    const worker = await createWorker("eng");
    try {
      const { data } = await worker.recognize(url);
      return data.text.trim();
    } finally {
      await worker.terminate();
    }
  } finally {
    URL.revokeObjectURL(url);
  }
}

// ─── PDF: Extract text directly (no OCR needed for text PDFs) ───
async function extractTextFromPdf(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();

  // Use legacy build — no worker needed
  const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");

  // Point worker to local file to avoid CDN fetch
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/legacy/build/pdf.worker.min.mjs",
    import.meta.url,
  ).toString();

  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const textParts: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item: any) => item.str)
      .join(" ");
    if (pageText.trim()) textParts.push(pageText.trim());
  }

  // If text found, return it
  if (textParts.join("").trim().length > 10) {
    return textParts.join("\n");
  }

  // Scanned PDF — render pages to canvas and OCR them
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("eng");
  const ocrParts: string[] = [];

  try {
    const maxPages = Math.min(pdf.numPages, 5); // Limit to 5 pages for speed
    for (let i = 1; i <= maxPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 2 }); // 2x for better OCR quality
      const canvas = document.createElement("canvas");
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext("2d")!;
      await page.render({ canvasContext: ctx, viewport, canvas } as any).promise;

      const { data } = await worker.recognize(canvas);
      if (data.text.trim()) ocrParts.push(data.text.trim());
    }
  } finally {
    await worker.terminate();
  }

  if (ocrParts.length === 0) {
    throw new Error("Could not extract text from this PDF.");
  }

  return ocrParts.join("\n");
}

// ─── Excel/CSV Parser ───────────────────────────────────────────
export async function parseSpreadsheet(file: File): Promise<string[]> {
  const text = await file.text();
  const Papa = await import("papaparse");
  const result = Papa.default.parse(text, { header: false, skipEmptyLines: true });

  const items: string[] = [];
  for (const row of result.data as string[][]) {
    if (!row || row.length === 0) continue;
    const first = (row[0] ?? "").trim();
    if (!first || /^(#|no|item|product|name|sku|id)$/i.test(first)) continue;

    const qty = row[1] ? parseInt(row[1]) : 0;
    if (qty > 0 && first) {
      items.push(`${qty} ${first}`);
    } else if (first) {
      items.push(first);
    }
  }
  return items;
}

// ─── Barcode/QR Scanner from image ──────────────────────────────
export async function scanBarcodeFromImage(file: File): Promise<string | null> {
  try {
    const { Html5Qrcode } = await import("html5-qrcode");
    const tempId = `qr-scan-${Date.now()}`;
    const div = document.createElement("div");
    div.id = tempId;
    div.style.display = "none";
    document.body.appendChild(div);
    try {
      const scanner = new Html5Qrcode(tempId);
      const result = await scanner.scanFile(file, false);
      scanner.clear();
      return result;
    } finally {
      div.remove();
    }
  } catch {
    return null;
  }
}
