const fs = require('fs');
const path = require('path');
const axios = require('axios');
require('dotenv').config();

const apiKey = process.env.GOOGLE_API_KEY;
const cx = process.env.CUSTOM_SEARCH_ENGINE_ID;
const outputDir = './dist';
const imagesDir = path.join(outputDir, 'images');
const garbageDir = path.join(imagesDir, 'garbage');
const marineDir = path.join(imagesDir, 'marine_life');
const modelDir = path.join(outputDir, 'model-new');

// Create directories
[outputDir, imagesDir, garbageDir, marineDir, modelDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Function to copy and inject encoded keys into index.html
function copyStaticFiles() {
  // Read index.html
  const indexHtml = fs.readFileSync('index.html', 'utf8');
  // Encode API keys
  const encodedApiKey = Buffer.from(apiKey).toString('base64');
  const encodedCx = Buffer.from(cx).toString('base64');
  // Inject encoded keys into HTML
  const updatedHtml = indexHtml
    .replace('{{ENCODED_API_KEY}}', encodedApiKey)
    .replace('{{ENCODED_CX_ID}}', encodedCx);
  // Write to dist
  fs.writeFileSync(path.join(outputDir, 'index.html'), updatedHtml);
  console.log('Copied and updated index.html to dist/');
  
  // Copy model files
  const modelFiles = fs.readdirSync('model-new');
  modelFiles.forEach((file) => {
    fs.copyFileSync(
      path.join('model-new', file),
      path.join(modelDir, file)
    );
  });
  console.log('Copied model files to dist/');
}

// Function to download images with CORS proxy
async function downloadImage(url, folder, counter) {
  try {
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const ext = path.extname(new URL(url).pathname).toLowerCase();
    const fileName = `image${counter > 0 ? `_${counter}` : ''}${ext}`;
    fs.writeFileSync(path.join(folder, fileName), response.data);
    return fileName;
  } catch (error) {
    console.error(`Failed to download ${url}: ${error.message}`);
    return null;
  }
}

// Function to fetch and process image URLs
async function fetchAndProcessImages(keyword, folder, count = 30) {
  try {
    const batchSize = 10;
    let results = [];
    for (let i = 0; i < Math.ceil(count / batchSize); i++) {
      const currentCount = Math.min(batchSize, count - i * batchSize);
      const response = await axios.get(
        `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(keyword)}&searchType=image&num=${currentCount}`
      );
      if (response.data.error) {
        console.error(`API Error: ${response.data.error.message}`);
        return results;
      }
      const urls = response.data.items.map((item) => item.link.replace('http://', 'https://'));
      const validUrls = urls.filter((url) => /\.(jpg|jpeg|png|webp)$/i.test(url));
      let counter = i * batchSize;
      for (const url of validUrls) {
        const fileName = await downloadImage(url, folder, counter);
        if (fileName) results.push(fileName);
        counter++;
      }
    }
    return results;
  } catch (error) {
    console.error(`Failed to process ${keyword} images: ${error.message}`);
    return [];
  }
}

// Main build function
async function build() {
  try {
    copyStaticFiles();
    // Fetch and download images
    const garbageImages = await fetchAndProcessImages('garbage in ocean', garbageDir, 30);
    const marineImages = await fetchAndProcessImages('marine life underwater', marineDir, 30);
    // Write image paths to JSON
    fs.writeFileSync(
      path.join(outputDir, 'images.json'),
      JSON.stringify({
        garbage: garbageImages.map((f) => `images/garbage/${f}`),
        marine: marineImages.map((f) => `images/marine_life/${f}`)
      })
    );
    console.log('Build completed successfully!');
  } catch (error) {
    console.error('Build failed:', error);
  }
}

build();