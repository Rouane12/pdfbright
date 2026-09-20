import fs from "node:fs/promises";
import path from "node:path";
import { deflateSync } from "node:zlib";
import { PDFDocument, StandardFonts, degrees, rgb } from "pdf-lib";

const outputDir = path.resolve(process.env.PDFBRIGHT_QA_DIR || ".qa-corpus");
const fixturesDir = path.resolve("tests/fixtures");
const tinyPng = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9ZlJQAAAAASUVORK5CYII=",
  "base64",
);

const CRC_TABLE = Array.from({ length: 256 }, (_, value) => {
  let crc = value;
  for (let bit = 0; bit < 8; bit += 1) {
    crc = (crc & 1) !== 0 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
  }
  return crc >>> 0;
});

function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const typeBytes = Buffer.from(type, "ascii");
  const payload = Buffer.concat([typeBytes, data]);
  const chunk = Buffer.alloc(12 + data.length);
  chunk.writeUInt32BE(data.length, 0);
  typeBytes.copy(chunk, 4);
  data.copy(chunk, 8);
  chunk.writeUInt32BE(crc32(payload), 8 + data.length);
  return chunk;
}

function encodeRgbPng(width, height, pixelAt) {
  const stride = 1 + width * 3;
  const raw = Buffer.alloc(stride * height);

  for (let y = 0; y < height; y += 1) {
    const row = y * stride;
    raw[row] = 0;
    for (let x = 0; x < width; x += 1) {
      const [red, green, blue] = pixelAt(x, y);
      const offset = row + 1 + x * 3;
      raw[offset] = red;
      raw[offset + 1] = green;
      raw[offset + 2] = blue;
    }
  }

  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  header[9] = 2;

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk("IHDR", header),
    pngChunk("IDAT", deflateSync(raw, { level: 6 })),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

const OCR_BITMAP_FONT = {
  A: ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
  B: ["11110", "10001", "10001", "11110", "10001", "10001", "11110"],
  C: ["01111", "10000", "10000", "10000", "10000", "10000", "01111"],
  E: ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
  H: ["10001", "10001", "10001", "11111", "10001", "10001", "10001"],
  L: ["10000", "10000", "10000", "10000", "10000", "10000", "11111"],
  R: ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
  S: ["01111", "10000", "10000", "01110", "00001", "00001", "11110"],
  T: ["11111", "00100", "00100", "00100", "00100", "00100", "00100"],
  X: ["10001", "10001", "01010", "00100", "01010", "10001", "10001"],
  " ": ["00000", "00000", "00000", "00000", "00000", "00000", "00000"],
};

function makeSyntheticOcrPng() {
  const width = 1200;
  const height = 650;
  const scale = 8;
  const characterWidth = 5 * scale;
  const characterHeight = 7 * scale;
  const gap = 2 * scale;
  const lineGap = 70;
  const lines = ["SEARCHABLE TEXT", "SEARCHABLE TEST"];
  const ink = new Uint8Array(width * height);
  let y = 210;

  for (const line of lines) {
    const lineWidth = line.length * characterWidth + (line.length - 1) * gap;
    let x = Math.floor((width - lineWidth) / 2);

    for (const character of line) {
      const glyph = OCR_BITMAP_FONT[character];
      if (!glyph) throw new Error(`Missing synthetic OCR glyph for ${character}`);

      for (let row = 0; row < glyph.length; row += 1) {
        for (let column = 0; column < glyph[row].length; column += 1) {
          if (glyph[row][column] !== "1") continue;
          for (let dy = 0; dy < scale; dy += 1) {
            for (let dx = 0; dx < scale; dx += 1) {
              const pixelX = x + column * scale + dx;
              const pixelY = y + row * scale + dy;
              ink[pixelY * width + pixelX] = 1;
            }
          }
        }
      }
      x += characterWidth + gap;
    }
    y += characterHeight + lineGap;
  }

  return encodeRgbPng(width, height, (x, y) =>
    ink[y * width + x] ? [0, 0, 0] : [255, 255, 255],
  );
}

function makeSyntheticNoisePng(width, height) {
  const stride = 1 + width * 3;
  const raw = Buffer.alloc(stride * height);
  let seed = 0x50444642;

  for (let y = 0; y < height; y += 1) {
    const row = y * stride;
    raw[row] = 0;
    for (let x = 0; x < width; x += 1) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      const offset = row + 1 + x * 3;
      const value = seed >>> 24;
      raw[offset] = value;
      raw[offset + 1] = (value + ((seed >>> 16) & 63)) & 0xff;
      raw[offset + 2] = (value + ((seed >>> 8) & 31)) & 0xff;
    }
  }

  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  header[9] = 2;
  header[10] = 0;
  header[11] = 0;
  header[12] = 0;

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk("IHDR", header),
    pngChunk("IDAT", deflateSync(raw, { level: 6 })),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

await fs.rm(outputDir, { recursive: true, force: true });
await fs.mkdir(outputDir, { recursive: true });

const ocrScanPng = makeSyntheticOcrPng();
const ocrLowConfidencePng = await fs.readFile(path.join(fixturesDir, "ocr-low-confidence.png"));
const encryptedPdf = await fs.readFile(path.join(fixturesDir, "password-protected.pdf"));

const manifest = [];

async function savePdf(name, doc, expectations = {}) {
  const bytes = await doc.save();
  await fs.writeFile(path.join(outputDir, name), bytes);
  manifest.push({ name, kind: "pdf", ...expectations });
  return bytes;
}

async function addTextPage(doc, text, size = [612, 792]) {
  const page = doc.addPage(size);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  page.drawText(text, { x: 54, y: size[1] - 72, size: 18, font, color: rgb(0.08, 0.12, 0.18) });
  page.drawText("PDFBright M11 synthetic non-sensitive QA fixture", {
    x: 54,
    y: size[1] - 104,
    size: 10,
    font,
    color: rgb(0.32, 0.38, 0.48),
  });
  return page;
}

{
  const doc = await PDFDocument.create();
  await addTextPage(doc, "Native text — page 1");
  await addTextPage(doc, "Native text — page 2");
  await savePdf("native-text.pdf", doc, { pages: 2, searchable: true });
}

{
  const doc = await PDFDocument.create();
  const rotated = await addTextPage(doc, "Rotation metadata fixture");
  rotated.setRotation(degrees(90));
  await addTextPage(doc, "Landscape fixture", [792, 612]);
  await savePdf("rotated-and-landscape.pdf", doc, { pages: 2, rotatedPage: 1, landscapePage: 2 });
}

{
  const doc = await PDFDocument.create();
  doc.addPage([612, 792]);
  const nearBlank = doc.addPage([612, 792]);
  const font = await doc.embedFont(StandardFonts.HelveticaOblique);
  nearBlank.drawText("faint signature", {
    x: 420,
    y: 92,
    size: 8,
    font,
    color: rgb(0.88, 0.88, 0.88),
    opacity: 0.35,
  });
  await savePdf("blank-and-near-blank.pdf", doc, { pages: 2, blankPage: 1, nearBlankPage: 2 });
}

{
  const doc = await PDFDocument.create();
  await addTextPage(doc, "A4 page", [595.28, 841.89]);
  await addTextPage(doc, "US Letter page", [612, 792]);
  await addTextPage(doc, "Wide page", [841.89, 595.28]);
  await savePdf("mixed-page-sizes.pdf", doc, { pages: 3, distinctPageSizes: 3 });
}

{
  const doc = await PDFDocument.create();
  for (let index = 1; index <= 25; index += 1) {
    await addTextPage(doc, `Long document — page ${index}`);
  }
  await savePdf("long-25-pages.pdf", doc, { pages: 25, freeMustReject: true });
}

{
  const doc = await PDFDocument.create();
  await addTextPage(doc, "Unsafe page dimension fixture", [7_201, 792]);
  await savePdf("unsafe-page-dimensions.pdf", doc, {
    pages: 1,
    unsafePageDimension: true,
    mustReject: true,
  });
}

{
  const doc = await PDFDocument.create();
  await addTextPage(doc, "Free file-size limit fixture");
  const validBytes = await doc.save();
  const targetSize = 10 * 1024 * 1024 + 1;
  const padded = Buffer.alloc(targetSize);
  Buffer.from(validBytes).copy(padded, 0);
  await fs.writeFile(path.join(outputDir, "free-file-size-limit.pdf"), padded);
  manifest.push({
    name: "free-file-size-limit.pdf",
    kind: "pdf",
    pages: 1,
    paddedBytes: targetSize,
    freeMustReject: true,
  });
}

{
  const doc = await PDFDocument.create();
  const image = await doc.embedPng(tinyPng);
  const page = doc.addPage([612, 792]);
  page.drawImage(image, { x: 0, y: 0, width: 612, height: 792 });
  await savePdf("image-only-scan.pdf", doc, { pages: 1, imageOnly: true });
}

{
  const doc = await PDFDocument.create();
  const image = await doc.embedPng(ocrScanPng);
  const page = doc.addPage([650, 360]);
  page.drawImage(image, { x: 0, y: 0, width: 650, height: 360 });
  await savePdf("ocr-image-only.pdf", doc, {
    pages: 1,
    imageOnly: true,
    ocrExpected: true,
  });
}

{
  const doc = await PDFDocument.create();
  const image = await doc.embedPng(ocrLowConfidencePng);
  const page = doc.addPage([650, 360]);
  page.drawImage(image, { x: 0, y: 0, width: 650, height: 360 });
  await savePdf("ocr-low-confidence.pdf", doc, {
    pages: 1,
    imageOnly: true,
    lowConfidenceOcr: true,
    mustRejectOcr: true,
  });
}

{
  const doc = await PDFDocument.create();
  await addTextPage(doc, "Mixed document native text must survive", [650, 360]);
  const image = await doc.embedPng(ocrScanPng);
  const page = doc.addPage([650, 360]);
  page.drawImage(image, { x: 0, y: 0, width: 650, height: 360 });
  await savePdf("mixed-native-and-ocr-scan.pdf", doc, {
    pages: 2,
    mixedTextAndImage: true,
    ocrExpected: true,
  });
}

{
  const doc = await PDFDocument.create();
  const noisePng = makeSyntheticNoisePng(900, 1200);
  const image = await doc.embedPng(noisePng);
  const page = doc.addPage([612, 792]);
  page.drawImage(image, { x: 0, y: 0, width: 612, height: 792 });
  await savePdf("scan-heavy-noise.pdf", doc, {
    pages: 1,
    imageOnly: true,
    minBytes: 250_000,
    compressionExpected: true,
  });
}

{
  const doc = await PDFDocument.create();
  for (let pageIndex = 0; pageIndex < 10; pageIndex += 1) {
    const noisePng = makeSyntheticNoisePng(450, 600);
    const image = await doc.embedPng(noisePng);
    const page = doc.addPage([612, 792]);
    page.drawImage(image, { x: 0, y: 0, width: 612, height: 792 });
  }
  await savePdf("near-limit-scan-10-pages.pdf", doc, {
    pages: 10,
    imageOnly: true,
    minBytes: 7_000_000,
    maxBytes: 10 * 1024 * 1024,
    stressFixture: true,
  });
}

{
  const doc = await PDFDocument.create();
  const image = await doc.embedPng(ocrScanPng);
  for (let pageIndex = 0; pageIndex < 3; pageIndex += 1) {
    const page = doc.addPage([650, 360]);
    page.drawImage(image, { x: 0, y: 0, width: 650, height: 360 });
  }
  await savePdf("ocr-three-pages.pdf", doc, {
    pages: 3,
    imageOnly: true,
    ocrExpected: true,
    stressFixture: true,
  });
}

{
  const doc = await PDFDocument.create();
  await addTextPage(doc, "Mixed document native-text page");
  const image = await doc.embedPng(tinyPng);
  const page = doc.addPage([612, 792]);
  page.drawImage(image, { x: 0, y: 0, width: 612, height: 792 });
  await savePdf("mixed-text-and-scan.pdf", doc, { pages: 2, mixedTextAndImage: true });
}

{
  const doc = await PDFDocument.create();
  const page = await addTextPage(doc, "Interactive form fixture");
  const form = doc.getForm();
  const field = form.createTextField("qa.name");
  field.setText("Synthetic QA");
  field.addToPage(page, { x: 54, y: 620, width: 220, height: 28 });
  await savePdf("form.pdf", doc, { pages: 1, formFields: 1 });
}

await fs.writeFile(path.join(outputDir, "password-protected.pdf"), encryptedPdf);
manifest.push({
  name: "password-protected.pdf",
  kind: "encrypted",
  mustReject: true,
});

await fs.writeFile(
  path.join(outputDir, "malformed.pdf"),
  "PDFBright M11 intentionally invalid fixture — no PDF header or structure.\n",
  "utf8",
);
manifest.push({ name: "malformed.pdf", kind: "malformed", mustReject: true });

await fs.writeFile(
  path.join(outputDir, "manifest.json"),
  `${JSON.stringify({ generatedAt: new Date().toISOString(), fixtures: manifest }, null, 2)}\n`,
  "utf8",
);

console.log(`Generated ${manifest.length} synthetic QA fixtures in ${outputDir}`);