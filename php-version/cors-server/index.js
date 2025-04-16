const express = require('express');
const cors = require('cors');
const axios = require('axios');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const app = express();

// Configuration Constants
const PORT = 8080;
const API_KEY = 'AIzaSyD-30W7hICtjmb-x_JiUQo89sKjZAa3VEw';
const CX = '351cf2068915748d9';
const ALLOWED_ORIGINS = [
  'http://localhost:8080',
  'http://localhost:8000',
  process.env.NODE_ENV === 'production' && 'https://your-production-domain.com'
].filter(Boolean);

// TensorFlow.js compatible image types (as per tfjs documentation)
const ALLOWED_IMAGE_EXTENSIONS = /\.(jpe?g|png|bmp|gif|webp)$/i;
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/bmp',
  'image/gif',
  'image/webp'
]);

// Security Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https://*.googleusercontent.com"]
    }
  }
}));
app.use(express.json({ limit: '10kb' }));

// CORS Configuration
app.use(cors({
  origin: ALLOWED_ORIGINS,
  methods: ['GET'],
  allowedHeaders: ['Content-Type'],
  optionsSuccessStatus: 200
}));

// Rate Limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true
});

// API Routes
// In index.js, update the /api/search route
app.get('/api/search', apiLimiter, async (req, res) => {
    try {
        const query = validateSearchQuery(req.query.q);
        const num = Math.min(parseInt(req.query.num) || 6, 10);
        
        const response = await axios.get('https://www.googleapis.com/customsearch/v1', {
            params: {
                key: API_KEY,
                cx: CX,
                q: query,
                searchType: 'image',
                num: num,
                safe: 'active',
                imgSize: 'medium'
            },
            timeout: 5000
        });

        // Check if Google API returned an error
        if (response.data.error) {
            throw new Error(response.data.error.message || 'Google API Error');
        }

        // Ensure items exist, default to empty array
        const items = response.data.items || [];
        
        // Change this in your /api/search endpoint
        res.json({
            success: true,
            results: items.map(item => ({
                url: item.link,  // Full size image URL
                title: item.title,
                thumbnail: item.image?.thumbnailLink,  // Thumbnail URL
                context: item.image?.contextLink
            }))
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
app.get('/api/image-proxy', apiLimiter, async (req, res) => {
    try {
        const imageUrl = validateImageUrl(req.query.url);
        
        // Try the original URL first
        try {
            const response = await axios.get(imageUrl, {
                responseType: 'stream',
                timeout: 3000,
                headers: {
                    'User-Agent': 'OceanGuardAI/1.0',
                    'Referer': 'http://localhost:8080/'
                }
            });

            const contentType = response.headers['content-type']?.split(';')[0];
            if (!ALLOWED_MIME_TYPES.has(contentType)) {
                throw new Error(`Unsupported image type: ${contentType}`);
            }

            res.set({
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=86400'
            });

            return response.data.pipe(res);
        } catch (originalError) {
            console.log(`Original image failed, trying thumbnail fallback: ${imageUrl}`);
            
            // If original fails, try to extract thumbnail URL if it's a Google image
            if (imageUrl.includes('googleusercontent.com')) {
                const thumbUrl = imageUrl.replace(/=.*$/, '=s300'); // Medium thumbnail
                const thumbResponse = await axios.get(thumbUrl, {
                    responseType: 'stream',
                    timeout: 3000
                });
                
                res.set({
                    'Content-Type': thumbResponse.headers['content-type'],
                    'Cache-Control': 'public, max-age=86400'
                });
                
                return thumbResponse.data.pipe(res);
            }
            
            throw originalError;
        }
    } catch (error) {
        console.error(`Image proxy error: ${error.message}`);
        res.status(500).json({
            success: false,
            error: 'Failed to load image'
        });
    }
});

// Validation Helpers
function validateSearchQuery(query) {
  if (!query || query.trim().length < 2) {
    throw new Error('Query must be 2+ characters');
  }
  if (!/^[\w\s-]+$/.test(query)) {
    throw new Error('Invalid query format');
  }
  return query.trim();
}

function validateImageUrl(url) {
  try {
    const parsed = new URL(url);
    
    // Validate protocol
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new Error('Invalid protocol');
    }
    
    // Validate file extension
    if (!ALLOWED_IMAGE_EXTENSIONS.test(parsed.pathname)) {
      throw new Error('Unsupported image format');
    }
    
    return url;
  } catch (error) {
    throw new Error('Invalid image URL');
  }
}

// Service Functions
async function fetchGoogleImages(query) {
  const response = await axios.get('https://www.googleapis.com/customsearch/v1', {
    params: {
      key: API_KEY,
      cx: CX,
      q: query,
      searchType: 'image',
      num: 6,
      safe: 'active',
      imgSize: 'medium'
    },
    timeout: 5000
  });

  return {
    query,
    results: response.data.items?.map(item => ({
      link: item.link,
      title: item.title,
      thumbnail: item.image?.thumbnailLink,
      context: item.image?.contextLink,
      mime: item.mime,
      dimensions: {
        width: item.image?.width,
        height: item.image?.height
      }
    })) || [],
    meta: response.data.searchInformation
  };
}

async function fetchImageStream(url) {
  const response = await axios.get(url, {
    responseType: 'stream',
    timeout: 3000,
    headers: {
      'User-Agent': 'OceanGuardAI/1.0',
      Referer: 'http://localhost:8080/'
    }
  });

  // Validate content type
  const contentType = response.headers['content-type']?.split(';')[0];
  if (!ALLOWED_MIME_TYPES.has(contentType)) {
    throw new Error(`Unsupported image type: ${contentType}`);
  }

  return {
    data: response.data,
    contentType: response.headers['content-type']
  };
}

// Error Handling
function handleApiError(res, error) {
  console.error(`API Error: ${error.message}`);
  const statusCode = error.response?.status || 500;
  const message = error.response?.data?.error?.message || error.message;
  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
}

// Server Initialization
app.use((req, res) => res.status(404).json({ success: false, error: 'Endpoint not found' }));
app.use((err, req, res, next) => handleApiError(res, err));

app.listen(PORT, () => {
  console.log(`🚀 Server operational on port ${PORT}`);
  console.log(`🌐 Access endpoints at: http://localhost:${PORT}/api`);
});