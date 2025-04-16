const fs = require('fs');
const path = require('path');
const axios = require('axios');
require('dotenv').config();

const apiKey = process.env.GOOGLE_API_KEY;
const cx = process.env.CUSTOM_SEARCH_ENGINE_ID;
const outputDir = './dist';

// Create directories
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Fetch image URLs from Google API
async function fetchImageUrls(keyword, count = 30) {
  try {
    const batchSize = 10;
    let results = [];
    for (let i = 0; i < Math.ceil(count / batchSize); i++) {
      const currentCount = Math.min(batchSize, count - i * batchSize);
      const response = await axios.get(
        `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(
          keyword
        )}&searchType=image&num=${currentCount}`
      );
      if (response.data.error) {
        console.error(`API Error: ${response.data.error.message}`);
        continue;
      }
      const validUrls = response.data.items
        .map((item) => item.link.replace('http://', 'https://'))
        .filter((url) => /\.(jpg|jpeg|png|webp)$/i.test(url));
      results.push(...validUrls);
    }
    return results;
  } catch (error) {
    console.error(`Failed to fetch ${keyword} images: ${error.message}`);
    return [];
  }
}

// Build function
async function build() {
  try {
    // Fetch image URLs
    const garbageUrls = await fetchImageUrls('garbage in ocean', 30);
    const marineUrls = await fetchImageUrls('marine life underwater', 30);

    // Write to images.json
    fs.writeFileSync(
      path.join(outputDir, 'images.json'),
      JSON.stringify({
        garbage: garbageUrls,
        marine: marineUrls
      })
    );
    console.log('Build completed successfully!');
  } catch (error) {
    console.error('Build failed:', error);
  }
}

build();