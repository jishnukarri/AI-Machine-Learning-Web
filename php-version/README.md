# A.Q.U.A. Project - Ocean Waste Recognition Demo

## Overview
The A.Q.U.A. (Aquatic Quality Understanding & Analysis) Project is an AI-powered web application designed to identify and classify ocean waste versus marine life. This project aims to raise awareness about marine pollution and facilitate cleanup efforts by leveraging artificial intelligence.

## Features
- **Image Upload**: Drag and drop or browse to upload images for analysis.
- **Image Search**: Search for ocean-related images using Google Custom Search API.
- **AI Analysis**: Classify images as "Ocean Waste" or "Marine Life" with confidence scores.
- **Detailed Results**: View analysis explanations, confidence levels, and recommended actions.
- **Statistics**: Summarize AI model performance with waste and marine life counts, average confidence, and processing time.

## Technologies Used
- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Node.js, Express.js
- **AI Model**: TensorFlow.js
- **APIs**: Google Custom Search API

## Installation

### Prerequisites
- Node.js (v14 or later)
- npm (Node Package Manager)

### Steps
1. Clone the repository:
   ```bash
   git clone https://github.com/your-repo/AI-Machine-Learning-Web.git
   cd AI-Machine-Learning-Web/php-version
   ```
2. Install dependencies for the CORS server:
   ```bash
   cd cors-server
   npm install
   ```
3. Set up environment variables:
   - Create a `.env` file in the `php-version` directory with the following content:
     ```env
     GOOGLE_API_KEY=your-google-api-key
     CUSTOM_SEARCH_ENGINE_ID=your-custom-search-engine-id
     ```
4. Start the CORS server:
   ```bash
   node index.js
   ```
5. Open `index.php` in a local server or deploy it to a web server.

## Usage
1. **Upload Images**: Drag and drop images into the upload area or click to browse files.
2. **Search Images**: Use the search bar to find ocean-related images online.
3. **Analyze Images**: Click the "Analyze Images" button to process selected images.
4. **View Results**: Review classification results, confidence scores, and recommended actions.

## Project Structure
- `demo-script.js`: Main JavaScript functionality for the frontend.
- `demo-styles.css`: Styling for the web interface.
- `index.php`: Main PHP file for the web interface.
- `cors-server/`: Node.js server for handling CORS and API requests.

## License
This project is licensed under the MIT License. See the LICENSE file for details.

## Acknowledgments
- Google Custom Search API for image search functionality.
- TensorFlow.js for AI model integration.

## Contact
For questions or contributions, please contact [Your Name] at [your-email@example.com].