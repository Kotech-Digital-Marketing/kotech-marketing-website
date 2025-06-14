// / debug-optimize-images.js
import fs from "fs/promises";
import path from "path";
import sharp from "sharp";
import readline from "readline";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function askQuestion(query, def) {
  return new Promise((resolve) => {
    rl.question(`${query} ${def ? `(default: ${def})` : ""}: `, (answer) => {
      resolve(answer || def);
    });
  });
}

async function getAllImagePaths(dir, extensions, files = []) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await getAllImagePaths(fullPath, extensions, files);
    } else if (
      extensions.includes(path.extname(entry.name).toLowerCase().slice(1))
    ) {
      files.push(fullPath);
    }
  }
  return files;
}

async function main() {
  console.log("--- Debug Image Optimizer (Recursive) ---");

  const inputDir = await askQuestion("INPUT directory", "public/assets/images");
  const outputDir = await askQuestion(
    "OUTPUT directory",
    "public/assets/images-optimized"
  );
  const extInput = await askQuestion(
    "SOURCE file extensions (comma-separated)",
    "png,jpg,jpeg,webp,avif,svg"
  );
  const extensions = extInput.split(",").map((e) => e.trim().toLowerCase());
  const targetFormat = await askQuestion(
    "TARGET format (webp, avif, jpg, png, skip)",
    "webp"
  );
  const useLossless =
    (await askQuestion("Use lossless WebP? (y/n)", "n")).toLowerCase() === "y";
  const quality = parseInt(await askQuestion("WebP quality (0-100)", "80"));
  const maxWidth = parseInt(
    await askQuestion("MAX width to resize (px) or blank to skip", "1920")
  );
  const overwrite =
    (
      await askQuestion("Overwrite existing files in output? (y/n)", "y")
    ).toLowerCase() === "y";

  const files = await getAllImagePaths(inputDir, extensions);
  console.log("Found files:", files);

  let processed = 0,
    errors = 0;
  for (const file of files) {
    try {
      const relPath = path.relative(inputDir, file);
      const newExt =
        targetFormat === "skip" ? path.extname(file) : `.${targetFormat}`;
      const outputPath = path
        .join(outputDir, relPath)
        .replace(path.extname(file), newExt);

      await fs.mkdir(path.dirname(outputPath), { recursive: true });
      if (!overwrite && (await fs.stat(outputPath).catch(() => false)))
        continue;

      const img = sharp(file);
      if (maxWidth) img.resize({ width: maxWidth, withoutEnlargement: true });

      if (targetFormat === "webp") {
        await img.webp({ quality, lossless: useLossless }).toFile(outputPath);
      } else if (targetFormat === "avif") {
        await img.avif({ quality }).toFile(outputPath);
      } else if (targetFormat === "jpg" || targetFormat === "jpeg") {
        await img.jpeg({ quality }).toFile(outputPath);
      } else if (targetFormat === "png") {
        await img.png({ quality }).toFile(outputPath);
      } else if (targetFormat === "skip") {
        await fs.copyFile(file, outputPath);
      }

      console.log(`✅ Converted: ${file} -> ${outputPath}`);
      processed++;
    } catch (err) {
      console.error(`❌ Error processing ${file}:`, err);
      errors++;
    }
  }

  console.log("\n--- Summary ---");
  console.log(`Processed: ${processed}`);
  console.log(`Errors: ${errors}`);
  console.log(`Output: ${outputDir}`);
  rl.close();
}

main();
