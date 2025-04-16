const fs = require('fs');
const path = require('path');
const axios = require('axios');

const apiKey = process.env.GOOGLE_API_KEY;
const cx = process.env.CUSTOM_SEARCH_ENGINE_ID;

if (!apiKey || !cx) {
  console.error('Missing environment variables. Please set GOOGLE_API_KEY and CUSTOM_SEARCH_ENGINE_ID.');
  process.exit(1);
}

const outputDir = './dist';
const imagesDir = path.join(outputDir, 'images');
const garbageDir = path.join(imagesDir, 'garbage');
const marineLifeDir = path.join(imagesDir, 'marine_life');

// Create directories if they don't exist
[outputDir, imagesDir, garbageDir, marineLifeDir].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Replace placeholders in index.html
function replacePlaceholders() {
  const html = fs.readFileSync('index.html', 'utf8')
    .replace('{{ GOOGLE_API_KEY }}', apiKey)
    .replace('{{ CUSTOM_SEARCH_ENGINE_ID }}', cx);
  fs.writeFileSync(path.join(outputDir, 'index.html'), html);
}

// Fetch and download images
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
  replacePlaceholders();
  await fetchAndDownloadImages('garbage in ocean', garbageDir, 50);
  await fetchAndDownloadImages('marine life underwater', marineLifeDir, 50);
  console.log('Build completed!');
})();