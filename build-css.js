// build-css.js
const { PurgeCSS } = require("purgecss");
const fs = require("fs");
const path = require("path");
const { glob } = require("glob");

// --- Configuration ---
const config = {
  // These are the files PurgeCSS will scan for used CSS classes.
  content: [
    "./*.html", // Scans all .html files in the root folder
    "./assets/js/main.js", // Scans your main JS file
  ],

  // This is the path to your original, large CSS file.
  css: ["./assets/css/main.css"],

  // Safelist to prevent removing dynamically added classes.
  safelist: {
    standard: [
      "sticky",
      "active",
      "active-link",
      "active-progress",
      "open",
      "show",
      "hide",
      "fade",
      "collapse",
      "collapsing",
      "dropdown-padding",
      "sr-only",
      "visually-hidden",
      "mfp-hide",
      "aos-init",
      "aos-animate",
      "split-line",
    ],
    greedy: [/^owl-/, /^slick-/, /^nice-select/, /^col-/, /^container/, /^nav-/, /^tab-/, /^fa-/, /^aniamtion-key-/, /^keyframe/],
    keyframes: [
      "animation-1",
      "animation-2",
      "animation-3",
      "animation-4",
      "animation-5",
      "animation-6",
      "animation-7",
      "animation-8",
      "fade-in-down",
      "pulse-border",
      "pulse-border1",
      "marquee",
      "marquee-2",
      "rotate-loading",
      "progress",
    ],
  },

  // This helps find classes with special characters.
  defaultExtractor: content => content.match(/[\w-/:]+(?<!:)/g) || [],
};
// --- End Configuration ---

// --- The Build Function ---
async function build() {
  console.log("Starting CSS purge...");

  try {
    const purgeCSSResult = await new PurgeCSS().purge(config);

    // Create the output directory if it doesn't exist
    const outputDir = path.dirname(config.output || "./assets/css/purged.main.css");
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Write the purged CSS to a file
    purgeCSSResult.forEach(result => {
      const outputPath = path.join(outputDir, "purged.main.css");
      fs.writeFileSync(outputPath, result.css, "utf-8");
      console.log(`✅ Successfully purged CSS. Output file created at: ${outputPath}`);

      // Calculate savings
      const originalSize = fs.statSync(result.file).size / 1024;
      const newSize = result.css.length / 1024;
      const savings = 100 - (newSize / originalSize) * 100;

      console.log(`\nOriginal size: ${originalSize.toFixed(2)} KB`);
      console.log(`New size: ${newSize.toFixed(2)} KB`);
      console.log(`Savings: ${savings.toFixed(2)}%`);
    });
  } catch (error) {
    console.error("❌ Error during CSS purge:", error);
  }
}

// Run the build
build();
