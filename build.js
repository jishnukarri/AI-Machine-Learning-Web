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

// Create directories if they don't exist
[outputDir, imagesDir, garbageDir, marineDir].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

async function downloadImage(url, folder, counter) {
  try {
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      headers: { 'User-Agent': 'Mozilla/5.0' } // Bypass 403 errors
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

async function build() {
  try {
    // Fetch and download images with sequential naming
    const garbageImages = await fetchAndProcessImages('garbage in ocean', garbageDir, 10);
    const marineImages = await fetchAndProcessImages('marine life underwater', marineDir, 10);

    // Save image paths to JSON
    fs.writeFileSync(path.join(outputDir, 'images.json'), JSON.stringify({
      garbage: garbageImages.map(f => `images/garbage/${f}`),
      marine: marineImages.map(f => `images/marine_life/${f}`)
    }));
    
    console.log('Build completed successfully!');
  } catch (error) {
    console.error('Build failed:', error);
  }
}

build();