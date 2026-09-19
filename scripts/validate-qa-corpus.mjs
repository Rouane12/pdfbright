import fs from "node:fs/promises";
import path from "node:path";
import { PDFDocument } from "pdf-lib";

const corpusDir = path.resolve(process.env.PDFBRIGHT_QA_DIR || ".qa-corpus");
const manifest = JSON.parse(await fs.readFile(path.join(corpusDir, "manifest.json"), "utf8"));
const failures = [];

function fail(name, message) {
  failures.push(`${name}: ${message}`);
}

for (const fixture of manifest.fixtures) {
  const filePath = path.join(corpusDir, fixture.name);
  const bytes = await fs.readFile(filePath);

  if (fixture.minBytes && bytes.length < fixture.minBytes) {
    fail(fixture.name, `expected at least ${fixture.minBytes} bytes, got ${bytes.length}`);
  }

  if (fixture.kind === "malformed" || fixture.kind === "encrypted") {
    try {
      await PDFDocument.load(bytes, { ignoreEncryption: false });
      fail(
        fixture.name,
        fixture.kind === "encrypted"
          ? "encrypted fixture unexpectedly parsed without a password"
          : "malformed fixture unexpectedly parsed successfully",
      );
    } catch {
      // Expected safe rejection.
    }
    continue;
  }

  try {
    const doc = await PDFDocument.load(bytes, { ignoreEncryption: false });
    const pages = doc.getPages();

    if (typeof fixture.pages === "number" && pages.length !== fixture.pages) {
      fail(fixture.name, `expected ${fixture.pages} pages, got ${pages.length}`);
    }

    if (fixture.rotatedPage) {
      const rotation = pages[fixture.rotatedPage - 1]?.getRotation().angle;
      if (rotation !== 90) fail(fixture.name, `expected page ${fixture.rotatedPage} rotation 90, got ${rotation}`);
    }

    if (fixture.landscapePage) {
      const page = pages[fixture.landscapePage - 1];
      if (!page || page.getWidth() <= page.getHeight()) {
        fail(fixture.name, `expected page ${fixture.landscapePage} to be landscape`);
      }
    }

    if (fixture.distinctPageSizes) {
      const sizes = new Set(pages.map((page) => `${Math.round(page.getWidth())}x${Math.round(page.getHeight())}`));
      if (sizes.size !== fixture.distinctPageSizes) {
        fail(fixture.name, `expected ${fixture.distinctPageSizes} distinct page sizes, got ${sizes.size}`);
      }
    }

    if (fixture.formFields) {
      const fields = doc.getForm().getFields();
      if (fields.length !== fixture.formFields) {
        fail(fixture.name, `expected ${fixture.formFields} form fields, got ${fields.length}`);
      }
    }
  } catch (error) {
    fail(fixture.name, `valid fixture failed to parse: ${error instanceof Error ? error.message : String(error)}`);
  }
}

if (failures.length) {
  console.error("QA corpus validation failed:\n- " + failures.join("\n- "));
  process.exit(1);
}

console.log(`Validated ${manifest.fixtures.length} synthetic QA fixtures.`);
