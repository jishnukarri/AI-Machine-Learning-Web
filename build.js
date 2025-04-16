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
const outputDir = './dist';
const imagesDir = path.join(outputDir, 'images');
const modelDir = path.join(outputDir, 'model-new');

// Ensure directories exist
[outputDir, imagesDir, modelDir].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Copy model files to dist/
function copyModelFiles() {
  const modelFiles = fs.readdirSync('./model-new');
  modelFiles.forEach(file => {
    fs.copyFileSync(
      path.join('./model-new', file),
      path.join(modelDir, file)
    );
  });
  console.log('Copied model files to dist/');
}

// Replace placeholders in index.html
function updateIndexHtml() {
  let html = fs.readFileSync('index.html', 'utf8')
    .replace('{{ GOOGLE_API_KEY }}', apiKey)
    .replace('{{ CUSTOM_SEARCH_ENGINE_ID }}', cx);
  fs.writeFileSync(path.join(outputDir, 'index.html'), html);
  console.log('Updated index.html with secrets.');
}

// Fetch and download images
async function fetchAndDownloadImages(keyword, folder, count = 50) {
  try {
    const response = await axios.get(
      `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(keyword)}&searchType=image&num=${count}`
    );
    const imageUrls = response.data.items.map(item => item.link.replace('http://', 'https://'));
    const validExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
    const downloadedImages = [];

    for (let i = 0; i < imageUrls.length; i++) {
      try {
        const url = new URL(imageUrls[i]);
        const ext = path.extname(url.pathname).toLowerCase();
        if (!validExtensions.includes(ext)) continue;
        const buffer = await axios.get(url.href, { responseType: 'arraybuffer' });
        const fileName = `image_${i}${ext}`;
        fs.writeFileSync(path.join(folder, fileName), buffer.data);
        downloadedImages.push(fileName);
        console.log(`Downloaded: ${fileName}`);
      } catch (error) {
        console.error(`Failed to download ${imageUrls[i]}:`, error.message);
      }
    }
    return downloadedImages;
  } catch (error) {
    console.error(`Error fetching ${keyword} images:`, error.message);
    return [];
  }
}

// Save image paths to a JSON file
function saveImagePaths(garbageImages, marineImages) {
  const outputPath = path.join(outputDir, 'images.json');
  fs.writeFileSync(outputPath, JSON.stringify({
    garbage: garbageImages.map(file => `images/garbage/${file}`),
    marine: marineImages.map(file => `images/marine_life/${file}`)
  }));
  console.log(`Saved image paths to: ${outputPath}`);
}

// Main build process
(async () => {
  console.log('Starting build...');
  
  // Step 1: Copy model files to dist/
  copyModelFiles();

  // Step 2: Update index.html with secrets
  updateIndexHtml();

  // Step 3: Download images
  const garbageImages = await fetchAndDownloadImages('garbage in ocean', path.join(imagesDir, 'garbage'), 50);
  const marineImages = await fetchAndDownloadImages('marine life underwater', path.join(imagesDir, 'marine_life'), 50);

  // Step 4: Save image paths to JSON
  saveImagePaths(garbageImages, marineImages);

  console.log('Build completed!');
})();