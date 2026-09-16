import fs from "node:fs/promises";
import path from "node:path";
import { PDFDocument, StandardFonts, degrees, rgb } from "pdf-lib";

const outputDir = path.resolve(process.env.PDFBRIGHT_QA_DIR || ".qa-corpus");
const tinyPng = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9ZlJQAAAAASUVORK5CYII=",
  "base64",
);

await fs.rm(outputDir, { recursive: true, force: true });
await fs.mkdir(outputDir, { recursive: true });

const manifest = [];

async function savePdf(name, doc, expectations = {}) {
  const bytes = await doc.save();
  await fs.writeFile(path.join(outputDir, name), bytes);
  manifest.push({ name, kind: "pdf", ...expectations });
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
  await savePdf("long-25-pages.pdf", doc, { pages: 25 });
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