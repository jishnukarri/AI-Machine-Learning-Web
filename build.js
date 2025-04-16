const fs = require('fs');
const path = require('path');

// Load environment variables
const apiKey = process.env.GOOGLE_API_KEY;
const cx = process.env.CUSTOM_SEARCH_ENGINE_ID;

if (!apiKey || !cx) {
  console.error('Missing environment variables. Please set GOOGLE_API_KEY and CUSTOM_SEARCH_ENGINE_ID.');
  process.exit(1);
}

// Define source and destination directories
const sourceDir = './'; // Root directory of your project
const outputDir = './dist'; // Output directory for deployment

// Ensure the output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

// Copy required files to the output directory
function copyFile(sourcePath, destPath) {
  if (fs.existsSync(sourcePath)) {
    fs.copyFileSync(sourcePath, destPath);
    console.log(`Copied: ${sourcePath} -> ${destPath}`);
  } else {
    console.warn(`File not found: ${sourcePath}`);
  }
}

// Replace placeholders in index.html and save it to the output directory
function replacePlaceholdersAndCopyIndexHtml() {
  const indexPath = path.join(sourceDir, 'index.html');
  let htmlContent = fs.readFileSync(indexPath, 'utf8');

  // Replace placeholders with actual values
  htmlContent = htmlContent.replace('{{ GOOGLE_API_KEY }}', apiKey);
  htmlContent = htmlContent.replace('{{ CUSTOM_SEARCH_ENGINE_ID }}', cx);

  // Write the updated content to the output directory
  const outputPath = path.join(outputDir, 'index.html');
  fs.writeFileSync(outputPath, htmlContent);
  console.log(`Updated and copied: ${indexPath} -> ${outputPath}`);
}

// Copy the TensorFlow.js model files
function copyModelFiles() {
  const modelDir = path.join(sourceDir, 'model-new');
  const outputModelDir = path.join(outputDir, 'model-new');

  if (fs.existsSync(modelDir)) {
    // Recursively copy the model directory
    fs.cpSync(modelDir, outputModelDir, { recursive: true });
    console.log(`Copied model files: ${modelDir} -> ${outputModelDir}`);
  } else {
    console.warn(`Model directory not found: ${modelDir}`);
  }
}

// Main build process
try {
  console.log('Starting build process...');
  
  // Step 1: Copy index.html with placeholders replaced
  replacePlaceholdersAndCopyIndexHtml();

  // Step 2: Copy TensorFlow.js model files
  copyModelFiles();

  // Step 3: Copy other required static assets (if any)
  const staticAssets = ['favicon.ico', 'style.css']; // Add other files as needed
  staticAssets.forEach((asset) => {
    const sourcePath = path.join(sourceDir, asset);
    const destPath = path.join(outputDir, asset);
    copyFile(sourcePath, destPath);
  });

  console.log('Build completed successfully!');
} catch (error) {
  console.error('Error during build process:', error);
  process.exit(1);
}