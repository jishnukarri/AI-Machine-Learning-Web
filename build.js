require('dotenv').config(); // Load local .env file
const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Load API credentials
const apiKey = process.env.GOOGLE_API_KEY;
const cx = process.env.CUSTOM_SEARCH_ENGINE_ID;

if (!apiKey || !cx) {
  console.error('Missing API credentials. Check your .env file or GitHub Secrets.');
  process.exit(1);
}

// Directories
const outputDir = './dist';
const imagesDir = path.join(outputDir, 'images');
const modelDir = path.join(outputDir, 'model-new');

// Ensure directories exist
[outputDir, imagesDir, modelDir].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Copy model files to dist/
function copyModelFiles() {
  try {
    const modelFiles = fs.readdirSync('./model-new');
    modelFiles.forEach(file => {
      fs.copyFileSync(
        path.join('./model-new', file),
        path.join(modelDir, file)
      );
    });
    console.log('Model files copied to dist/');
  } catch (error) {
    console.error('Failed to copy model files:', error);
  }
}

// Fetch images via Google Custom Search API
async function fetchImages(keyword, count = 10) {
  try {
    const response = await axios.get(
      `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(keyword)}&searchType=image&num=${count}`
    );
    if (response.data.error) {
      console.error(`API Error for "${keyword}":`, response.data.error.message);
      return [];
    }
    return response.data.items.map(item => item.link.replace('http://', 'https://'));
  } catch (error) {
    console.error(`Failed to fetch "${keyword}" images:`, error.message);
    return [];
  }
}

// Download images to local directories
async function downloadImages(urls, folder) {
  const validExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
  const validImages = [];

  for (const url of urls) {
    try {
      const ext = path.extname(new URL(url).pathname).toLowerCase();
      if (!validExtensions.includes(ext)) continue;
      const { data } = await axios.get(url, { responseType: 'arraybuffer' });
      const fileName = `image_${Date.now()}${ext}`;
      fs.writeFileSync(path.join(folder, fileName), data);
      validImages.push(fileName);
      console.log(`Downloaded: ${fileName}`);
    } catch (error) {
      console.error(`Failed to download ${url}:`, error.message);
    }
  }
  return validImages;
}

// Generate images.json with local paths
function saveImagePaths(garbage, marine) {
  const data = {
    garbage: garbage.map(file => `images/garbage/${file}`),
    marine: marine.map(file => `images/marine_life/${file}`)
  };
  fs.writeFileSync(path.join(outputDir, 'images.json'), JSON.stringify(data, null, 2));
  console.log('Image paths saved to images.json');
}

// Main build process
(async () => {
  console.log('Starting build...');
  
  // Step 1: Copy model files
  copyModelFiles();

  // Step 2: Fetch images
  const garbageUrls = await fetchImages('garbage in ocean');
  const marineUrls = await fetchImages('marine life underwater');

  // Step 3: Download images
  const garbageImages = await downloadImages(garbageUrls, path.join(imagesDir, 'garbage'));
  const marineImages = await downloadImages(marineUrls, path.join(imagesDir, 'marine_life'));

  // Step 4: Save image paths
  saveImagePaths(garbageImages, marineImages);

  console.log('Build completed!');
})();