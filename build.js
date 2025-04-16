const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Load environment variables
const apiKey = process.env.GOOGLE_API_KEY;
const cx = process.env.CUSTOM_SEARCH_ENGINE_ID;

if (!apiKey || !cx) {
  console.error('Missing environment variables. Please set GOOGLE_API_KEY and CUSTOM_SEARCH_ENGINE_ID.');
  process.exit(1);
}

// Define directories
const sourceDir = './';
const outputDir = './dist';
const imagesDir = path.join(outputDir, 'images');
const modelDir = path.join(outputDir, 'model-new');

// Ensure directories exist
[outputDir, imagesDir, modelDir].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Copy model files to dist/
function copyModelFiles() {
  const modelFiles = fs.readdirSync(path.join(sourceDir, 'model-new'));
  modelFiles.forEach(file => {
    fs.copyFileSync(
      path.join(sourceDir, 'model-new', file),
      path.join(modelDir, file)
    );
  });
  console.log('Copied model files to dist/');
}

// Replace placeholders in index.html
function updateIndexHtml() {
  let html = fs.readFileSync(path.join(sourceDir, 'index.html'), 'utf8');
  html = html.replace('{{ GOOGLE_API_KEY }}', apiKey);
  html = html.replace('{{ CUSTOM_SEARCH_ENGINE_ID }}', cx);
  fs.writeFileSync(path.join(outputDir, 'index.html'), html);
  console.log('Updated index.html with secrets.');
}

// Fetch and download images (as before)
async function fetchAndDownloadImages(keyword, folder, count = 50) {
  try {
    const response = await axios.get(
      `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(keyword)}&searchType=image&num=${count}`
    );
    const imageUrls = response.data.items.map(item => item.link.replace('http://', 'https://'));
    for (let i = 0; i < imageUrls.length; i++) {
      try {
        const url = new URL(imageUrls[i]);
        const ext = path.extname(url.pathname).toLowerCase();
        if (!['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) continue;
        const buffer = await axios.get(url.href, { responseType: 'arraybuffer' });
        fs.writeFileSync(path.join(folder, `image_${i}${ext}`), buffer.data);
        console.log(`Downloaded: ${url.href}`);
      } catch (error) {
        console.error(`Failed to download ${imageUrls[i]}:`, error.message);
      }
    }
  } catch (error) {
    console.error(`Error fetching ${keyword} images:`, error.message);
  }
}

// Main build process
(async () => {
  console.log('Starting build...');
  
  // Step 1: Copy model files to dist/
  copyModelFiles();

  // Step 2: Update index.html with secrets
  updateIndexHtml();

  // Step 3: Download images
  await fetchAndDownloadImages('garbage in ocean', path.join(imagesDir, 'garbage'), 50);
  await fetchAndDownloadImages('marine life underwater', path.join(imagesDir, 'marine_life'), 50);

  console.log('Build completed!');
})();