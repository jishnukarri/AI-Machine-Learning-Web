require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const app = express();
const upnp = require('nat-upnp');
const client = upnp.createClient();

// Configuration from environment variables
const PORT = process.env.PORT || 3000; // Render provides PORT automatically
const API_KEY = process.env.GOOGLE_API_KEY;
const CX = process.env.GOOGLE_CX;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Allowed origins from environment variable (comma-separated)
const allowedOrigins = [
  'http://aqua.jishnukarri.me:5000',
  'http://aqua.jishnukarri.me:8081',
  'http://192.168.0.22:5000',
  'http://86.23.213.26:5000',
  'http://aqua.jishnukarri.me',
  'http://aqua.jishnukarri.me',
];

// TensorFlow.js compatible image types
const ALLOWED_IMAGE_EXTENSIONS = /\.(jpe?g|png|bmp|gif|webp)$/i;
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/bmp',
  'image/gif',
  'image/webp'
]);

// Validate required environment variables
if (!API_KEY) throw new Error('GOOGLE_API_KEY environment variable is required');
if (!CX) throw new Error('GOOGLE_CX environment variable is required');

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

app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'OPTIONS']
}));

// Rate Limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true
});

// API Routes
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

        if (response.data.error) {
            throw new Error(response.data.error.message || 'Google API Error');
        }

        const items = response.data.items || [];
        
        res.json({
            success: true,
            results: items.map(item => ({
                url: item.link,
                title: item.title,
                thumbnail: item.image?.thumbnailLink,
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
        
        try {
            const response = await axios.get(imageUrl, {
                responseType: 'stream',
                timeout: 3000,
                headers: {
                    'User-Agent': 'OceanGuardAI/1.0',
                    'Referer': `http://localhost:${PORT}/`
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
            
            if (imageUrl.includes('googleusercontent.com')) {
                const thumbUrl = imageUrl.replace(/=.*$/, '=s300');
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
    
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new Error('Invalid protocol');
    }
    
    if (!ALLOWED_IMAGE_EXTENSIONS.test(parsed.pathname)) {
      throw new Error('Unsupported image format');
    }
    
    return url;
  } catch (error) {
    throw new Error('Invalid image URL');
  }
}

// Error Handling
app.use((req, res) => res.status(404).json({ success: false, error: 'Endpoint not found' }));
app.use((err, req, res, next) => {
  console.error(`API Error: ${err.message}`);
  const statusCode = err.response?.status || 500;
  const message = err.response?.data?.error?.message || err.message;
  res.status(statusCode).json({
    success: false,
    error: message,
    ...(NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Health check endpoint
app.get('/healthz', (req, res) => {
  res.status(200).json({ 
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});


// Server Initialization
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server ready on internal port ${PORT}`);
});