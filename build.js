require('dotenv').config();
const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Load API credentials
const apiKey = process.env.GOOGLE_API_KEY;
const cx = process.env.CUSTOM_SEARCH_ENGINE_ID;

// Directories
const outputDir = './dist';
const imagesDir = path.join(outputDir, 'images');
const modelDir = path.join(outputDir, 'model-new');

// Ensure directories exist
[outputDir, imagesDir, modelDir].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Copy index.html and model files to dist/
function copyStaticFiles() {
  // Copy index.html
  fs.copyFileSync('index.html', path.join(outputDir, 'index.html'));
  console.log('Copied index.html to dist/');

  // Copy model files
  const modelFiles = fs.readdirSync('model-new');
  modelFiles.forEach(file => {
    fs.copyFileSync(
      path.join('model-new', file),
      path.join(modelDir, file)
    );
  });
  console.log('Copied model files to dist/');
}

// Download images with sequential naming
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

// Fetch and process images
async function fetchAndProcessImages(keyword, folder, count = 10) {
  try {
    const response = await axios.get(
      `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(keyword)}&searchType=image&num=${count}`
    );
    if (response.data.error) {
      console.error(`API Error: ${response.data.error.message}`);
      return [];
    }
    const urls = response.data.items.map(item => item.link.replace('http://', 'https://'));
    const validUrls = urls.filter(url => /\.(jpg|jpeg|png|webp)$/i.test(url));
    
    let counter = 0;
    const results = [];
    for (const url of validUrls) {
      const fileName = await downloadImage(url, folder, counter);
      if (fileName) results.push(fileName);
      counter++;
    }
    return results;
  } catch (error) {
    console.error(`Failed to process ${keyword} images: ${error.message}`);
    return [];
  }
}

// Main build process
(async () => {
  console.log('Starting build...');
  
  // Step 1: Copy static files
  copyStaticFiles();

  // Step 2: Fetch images
  const garbageImages = await fetchAndProcessImages('garbage in ocean', path.join(imagesDir, 'garbage'), 10);
  const marineImages = await fetchAndProcessImages('marine life underwater', path.join(imagesDir, 'marine_life'), 10);

  // Step 3: Save image paths to JSON
  fs.writeFileSync(
    path.join(outputDir, 'images.json'),
    JSON.stringify({
      garbage: garbageImages.map(f => `images/garbage/${f}`),
      marine: marineImages.map(f => `images/marine_life/${f}`)
    })
  );
  console.log('Image paths saved to images.json');

  console.log('Build completed!');
})();