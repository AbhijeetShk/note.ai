import { loadPdf } from "../loadPdf.js";

async function main() {
  try {
    const pdfPath = process.argv[2];

    if (!pdfPath) {
      throw new Error(
        "Usage: npm run ingest <pdf-path>",
      );
    }

    console.log(
      `Starting ingestion: ${pdfPath}`,
    );

    await loadPdf(pdfPath);

    console.log(
      "Ingestion completed successfully",
    );
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

main();