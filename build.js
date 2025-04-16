const fs = require('fs');
const apiKey = process.env.GOOGLE_API_KEY;
const cx = process.env.CUSTOM_SEARCH_ENGINE_ID;

if (!apiKey || !cx) {
  console.error('Missing environment variables. Please set GOOGLE_API_KEY and CUSTOM_SEARCH_ENGINE_ID.');
  process.exit(1);
}

// Read the index.html file
let htmlContent = fs.readFileSync('index.html', 'utf8');

// Replace placeholders with actual values
htmlContent = htmlContent.replace('{{ GOOGLE_API_KEY }}', apiKey);
htmlContent = htmlContent.replace('{{ CUSTOM_SEARCH_ENGINE_ID }}', cx);

// Write the updated content back to the file
fs.writeFileSync('dist/index.html', htmlContent);

console.log('Build completed successfully!');