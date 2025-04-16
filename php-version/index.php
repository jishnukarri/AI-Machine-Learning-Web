<?php
// Enable error reporting
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Configuration
define('MODEL_DIR', __DIR__ . '/model');
define('UPLOAD_DIR', __DIR__ . '/uploads');
define('API_BASE', 'http://localhost:8080');
define('ALLOWED_MIME_TYPES', ['image/jpeg', 'image/png', 'image/webp']);

// Create upload directory if not exists
if (!file_exists(UPLOAD_DIR)) {
    mkdir(UPLOAD_DIR, 0755, true);
}

// Handle file upload
$uploaded_files = [];
if ($_SERVER['REQUEST_METHOD'] === 'POST' && !empty($_FILES['image'])) {
    foreach ($_FILES['image']['tmp_name'] as $key => $tmp_name) {
        try {
            $finfo = new finfo(FILEINFO_MIME_TYPE);
            $mime = $finfo->file($tmp_name);
            
            if (!in_array($mime, ALLOWED_MIME_TYPES)) {
                throw new Exception("Invalid file type: $mime");
            }

            $extension = explode('/', $mime)[1];
            $filename = uniqid('img_') . '.' . $extension;
            $target_path = UPLOAD_DIR . '/' . $filename;
            
            if (!move_uploaded_file($tmp_name, $target_path)) {
                throw new Exception("Failed to move uploaded file");
            }

            $uploaded_files[] = [
                'name' => basename($_FILES['image']['name'][$key]),
                'path' => $target_path,
                'url' => "uploads/$filename"
            ];

        } catch (Exception $e) {
            error_log("Upload error: " . $e->getMessage());
        }
    }
}

// Handle image proxy
if (isset($_GET['proxy'])) {
    try {
        $url = urldecode($_GET['url']);
        $parsed = parse_url($url);
        
        if (!in_array($parsed['scheme'], ['http', 'https'])) {
            throw new Exception("Invalid URL scheme");
        }

        $image = file_get_contents($url);
        if ($image === false) {
            throw new Exception("Failed to fetch image");
        }

        header('Content-Type: ' . (new finfo(FILEINFO_MIME_TYPE))->buffer($image));
        exit($image);

    } catch (Exception $e) {
        http_response_code(400);
        exit(json_encode(['error' => $e->getMessage()]));
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>OceanGuard AI</title>
    <script src="https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@3.18.0/dist/tf.min.js"></script>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <div id="loadingScreen" class="loading-screen">
        <div class="loading-content">
            <div class="loading-spinner">
                <div class="spinner-circle"></div>
                <div class="spinner-inner">
                    <span class="spinner-text">Loading</span>
                </div>
            </div>
            <div class="loading-progress">
                <div id="loadingProgressBar" class="loading-progress-fill"></div>
            </div>
            <p id="loadingStage" class="loading-stage">Initializing AI System</p>
        </div>
    </div>

    <div id="mainContent" class="hidden">
        <header class="header">
            <div class="container header-content">
                <h1 class="logo-text">
                    <span class="logo-primary">OCEAN</span><span class="logo-secondary">GUARD</span>
                    <span class="logo-tertiary">AI Waste Recognition</span>
                </h1>
            </div>
        </header>

        <main class="main-content">
            <div class="container main-grid">
            <section class="card analysis-panel">
                <!-- Add Search Bar Here -->
                <div class="search-container">
                    <input type="text" id="searchInput" 
                        class="search-input" 
                        placeholder="Search marine images...">
                    <button id="searchButton" class="btn btn-primary">
                        Search
                    </button>
                </div>
                
                <h2 class="card-title">Marine Analysis</h2>
                    <div class="drag-drop-zone" id="dropZone">
                        <div class="upload-icon">
                            <svg viewBox="0 0 24 24" width="64" height="64" fill="currentColor">
                                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                            </svg>
                        </div>
                        <p>Drag & Drop or Click to Analyze</p>
                        <input type="file" id="imageInput" accept="image/*" multiple>
                    </div>
                    <button id="analyzeButton" class="btn btn-primary" disabled>Analyze</button>
                </section>

                <section class="card results-panel">
                    <div class="results-header">
                        <h2 class="card-title">Results</h2>
                        <div class="results-meta">
                            <span id="resultsCount">0 items analyzed</span>
                            <div class="processing-indicator hidden" id="processingIndicator">
                                <div class="processing-spinner"></div>
                            </div>
                        </div>
                    </div>
                    <div id="resultsGrid" class="results-grid"></div>
                </section>
            </div>
        </main>
    </div>

    <script>
    class OceanGuardAI {
        apiBase = '<?php echo API_BASE; ?>';
        searchTerms = {
            marineLife: [
                'high resolution coral reef underwater',
                'sea turtles swimming in clear ocean',
                'bottlenose dolphins jumping in ocean',
                'colorful clownfish in anemone',
                'great white shark in deep sea',
                'stingray gliding over sandy ocean floor',
                'octopus camouflaging underwater',
                'seahorses floating near coral',
                'glowing jellyfish in dark ocean',
                'blue whale breaching surface',
                'humpback whale underwater dive',
                'orca pod swimming in arctic waters',
                'manatee in coastal spring',
                'seal pup on ice',
                'California sea lion on rock',
                'bright red starfish close-up',
                'anemone with clownfish interaction',
                'plankton bloom in ocean water',
                'manta ray in open ocean',
                'crabs crawling on seabed',
                'lobster underwater habitat',
                'moray eel peeking from rock',
                'angler fish deep sea glow',
                'nudibranch colorful macro photo',
                'sea cucumber resting on reef',
                'giant squid deep sea creature',
                'tuna school underwater shot',
                'sardines shoaling movement',
                'wild salmon in freshwater stream',
                'barracuda open water predator',
                'blue marlin underwater chase',
                'parrotfish feeding on coral',
                'lionfish fins spread warning',
                'triggerfish close-up photo',
                'inflated pufferfish defensive',
                'sunfish near surface sunlight',
                'massive grouper near wreck',
                'eel garden at night',
                'banded sea snake underwater',
                'penguins swimming beneath ice',
                'arctic underwater marine life',
                'antarctic sea life under ice',
                'marine mammals diving',
                'coral reef ecosystem diversity',
                'tropical fish shoal reef',
                'deep ocean bioluminescence',
                'kelp forest with sea otters',
                'school of reef fish',
                'mesopelagic zone marine life',
                'vibrant reef biodiversity photo',
                'baby sea turtles crawling to ocean',
                'whale calf swimming near mom',
                'narwhals arctic photo',
                'beluga whale pod underwater',
                'endangered marine animals photo',
                'tide pool marine life close-up',
                'tropical reef fish identification',
                'bioluminescent ocean creatures',
                'marine life in seagrass beds',
                'coastal reef fish in tide',
                'anemonefish guarding eggs',
                'clownfish hiding in coral',
                'schooling barracuda spiral',
                'close up of jellyfish tentacles',
                'marine life around coral atoll',
                'underwater marine biology photos',
                'divers observing reef life',
                'aquarium marine species photos',
                'reef predators hunting fish',
                'marine ecosystem in natural habitat',
                'turtle swimming through jellyfish bloom',
                'wild sea otters floating in kelp',
                'sealions diving in ocean',
                'fish feeding frenzy underwater',
                'marine sanctuary wildlife shots',
                'ocean wildlife close-ups',
                'humpback whale tail fluke shot',
                'marine plankton bloom from space',
                'underwater cave marine life',
                'abyssal zone sea creatures',
                'deep sea fish glowing in dark',
                'marine food chain diagram in real life',
                'baleen whale underwater feeding',
                'reef regeneration time-lapse',
                'marine conservation awareness',
                'sunlight rays in ocean with fish',
                'colorful coral polyps macro',
                'shimmering fish scales underwater',
                'tiny marine crustaceans under microscope',
                'underwater interaction marine species',
                'rare sea creatures photo',
                'ocean animals with common names',
                'marine biodiversity hotspot photos',
                'baby dolphins swimming beside mother',
                'time-lapse of coral reef health',
                'ocean layers and marine life zones',
                'diving with large marine animals',
                'marine biology research underwater',
                'aquatic ecosystem balance in nature'
            ],

            marineGarbage: [
                'high resolution plastic in ocean waves',
                'marine debris floating near coral reefs',
                'sea turtle entangled in plastic net',
                'underwater photo of ocean plastic waste',
                'plastic bottle pollution on beach',
                'abandoned fishing nets ghost gear',
                'seabirds eating plastic waste',
                'coastal cleanup after storm trash',
                'plastic bag floating like jellyfish',
                'microplastic particles close up water',
                'oil spill covering ocean surface',
                'polluted beach with garbage piles',
                'drifting plastic waste in open sea',
                'pollution harming marine wildlife photo',
                'marine animals surrounded by garbage',
                'plastic straws floating in seawater',
                'ocean trash damaging coral reef',
                'industrial waste pipe into sea',
                'marine pollution affecting fish',
                'great pacific garbage patch aerial',
                'plastic bottle reef entanglement',
                'toxic chemicals leaking into ocean',
                'garbage entangled in mangroves',
                'plastic pollution awareness photo',
                'polluted estuary with visible debris',
                'garbage under surface with fish',
                'plastic floating near sea turtles',
                'waste dumped into coastal waters',
                'plastic entangling marine mammals',
                'fishing net trap for sea creatures',
                'dead seabird filled with plastic',
                'ocean trash during storm surge',
                'polluted seafoam on beach',
                'floating trash vortex in ocean gyre',
                'urban trash washed into ocean',
                'trash on remote island beaches',
                'garbage entanglement on coral heads',
                'underwater pollution near divers',
                'marine litter stuck on rocks',
                'plastic rings on seal necks',
                'polluted water around fish farms',
                'plastic mask floating in ocean',
                'ship dumping garbage in ocean',
                'pollution comparison before after ocean',
                'dirty water outflow pipe beach',
                'fish caught in soda ring',
                'chemical barrels dumped in ocean',
                'deep sea garbage layer photos',
                'oil spill cleanup response images',
                'trash accumulation underwater trench',
                'plastic bottles in sea grass beds',
                'marine waste in storm drain outflow',
                'pollution layering coral reef',
                'tangled fishing lines on reef',
                'beach plastic pollution macro shot',
                'ocean cleanup project in action',
                'volunteers collecting marine trash',
                'satellite image of ocean debris',
                'coastal pollution human impact',
                'plastic net wrapped around fish',
                'styrofoam chunks in water',
                'plastic straw stuck in turtle nose',
                'ocean litter mixed with seaweed',
                'plastic gloves floating ocean',
                'fishing rope snaring marine animals',
                'sunken plastic bottles photo',
                'disposable cutlery ocean pollution',
                'polluted tide pools at coast',
                'oil spill near shore wildlife affected',
                'marine pollution satellite tracking',
                'deep ocean pollution photo',
                'beach garbage after storm',
                'floating trash near ports',
                'plastic waste on coral reef photo',
                'underwater view of bottle pile',
                'boat surrounded by floating garbage',
                'plastic contamination of seafood',
                'toxic marine dump zone photo',
                'fishing gear waste underwater',
                'entangled dolphin plastic ring',
                'plastic waste on sand dunes coast',
                'ocean pollution artistic photos',
                'garbage in marine protected area',
                'pollution cleanup divers underwater',
                'flood washed plastic in ocean',
                'storm debris in ocean waves',
                'entangled crab in netting',
                'garbage and marine animal collision',
                'plastic bags covering sea grass',
                'floating bottle caps macro image',
                'trash island ocean photo',
                'marine litter affecting biodiversity',
                'waste pipe underwater shot',
                'plastic pollution vs healthy reef comparison',
                'aquatic animals among garbage',
                'plastic packaging polluting reefs',
                'plastic underwater in high contrast photo'
            ]
        };


        // Add these methods
        async loadInitialImages() {
            try {
                const marineLife = await this.fetchImages('marineLife', 3);
                const garbage = await this.fetchImages('marineGarbage', 3);
                this.displayResults([...marineLife, ...garbage]);
            } catch (error) {
                this.showError('Initial Load Failed', error);
            }
        }

        // Update the fetchImages method to return proper image URLs
        async fetchImages(category, count, customQuery = null) {
            try {
                // Use custom query if provided, otherwise select random term from category
                const term = customQuery || 
                    this.searchTerms[category][Math.floor(Math.random() * this.searchTerms[category].length)];
                    
                const response = await fetch(`${this.apiBase}/api/search?q=${encodeURIComponent(term)}&num=${count}`);
                
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                
                const data = await response.json();
                
                if (!Array.isArray(data?.results)) {
                    throw new Error('Invalid API response structure');
                }
                
                return data.results.slice(0, count).map(item => ({
                    url: item.url,
                    title: item.title,
                    thumbnail: item.thumbnail,
                    context: item.context,
                    category: category
                }));
            } catch (error) {
                this.showError('Image Load Failed', error);
                return [];
            }
        }

        // Update displayResults to process images through the model
        displayResults(items) {
            // Clear previous results
            document.getElementById('resultsGrid').innerHTML = '';
            
            // Add to queue and process
            this.imageQueue = [...items];
            this.processImageQueue();
        }

        // Update displayResults to process images through the model
        displayResults(items) {
            // Clear previous results
            document.getElementById('resultsGrid').innerHTML = '';
            
            // Add to queue and process
            this.imageQueue = [...items];
            this.processImageQueue();
        }
        constructor() {
            this.model = null;
            this.imageQueue = [];
            this.debugMode = true;
            this.init();
        }

        log(message, data) {
            if (this.debugMode) {
                console.log(`[${new Date().toISOString()}] ${message}`, data || '');
            }
        }

        async init() {
            try {
                this.log('System initialization started');
                await this.loadModel();
                this.setupEventListeners();
                this.loadInitialImages(); // ← ADD THIS LINE
                this.transitionToUI();
                this.log('System initialization complete');
            } catch (error) {
                this.showError('Initialization Failed', error);
            }
        }

        async loadModel() {
            try {
                this.log('Loading TFJS model');
                this.updateProgress(25, 'Loading AI Model');
                
                this.model = await tf.loadLayersModel('model/model.json');
                this.log('Model loaded successfully', {layers: this.model.layers.length});
                
                this.updateProgress(50, 'Model Initialized');
                return true;
            } catch (error) {
                this.log('Model load failed', error);
                throw new Error(`Model loading failed: ${error.message}`);
            }
        }

        async processImageQueue() {
            this.log(`Processing ${this.imageQueue.length} images`);
            const processingIndicator = document.getElementById('processingIndicator');
            processingIndicator.classList.remove('hidden');
            
            try {
                for (const [index, item] of this.imageQueue.entries()) {
                    try {
                        this.log(`Processing item ${index + 1}/${this.imageQueue.length}`, item);
                        
                        let img;
                        try {
                            if (item instanceof File) {
                                this.log('Loading file upload');
                                img = await this.loadImageFile(item);
                            } else {
                                this.log('Loading image via proxy');
                                img = await this.loadImageUrl(item);
                            }
                        } catch (error) {
                            this.log('Image load failed, skipping this item', error);
                            continue; // Skip to next item if image fails to load
                        }

                        if (img) {
                            this.log('Preprocessing image');
                            const tensor = this.preprocessImage(img);
                            
                            this.log('Running prediction');
                            const prediction = this.model.predict(tensor);
                            const results = this.interpretPrediction(prediction);
                            
                            this.log('Prediction results', results);
                            this.displayResult(item, results);
                            
                            tensor.dispose();
                        }
                    } catch (error) {
                        this.log('Error processing item, continuing with next', error);
                        continue;
                    }
                }
            } catch (error) {
                this.showError('Processing Error', error);
            } finally {
                processingIndicator.classList.add('hidden');
                this.imageQueue = [];
                document.getElementById('analyzeButton').disabled = true;
                this.log('Processing complete');
            }
        }

        preprocessImage(img) {
            return tf.tidy(() => {
                this.log('Preprocessing image tensor');
                return tf.browser.fromPixels(img)
                    .resizeNearestNeighbor([224, 224])
                    .toFloat()
                    .div(255.0)
                    .expandDims(0);
            });
        }

        interpretPrediction(prediction) {
            const [garbageProb, marineProb] = Array.from(prediction.dataSync());
            const total = garbageProb + marineProb;
            
            this.log('Raw prediction values', {garbageProb, marineProb});
            
            return {
                type: marineProb > garbageProb ? 'Marine Life' : 'Garbage',
                confidence: Math.round((Math.max(marineProb, garbageProb) / total) * 100),
                garbageConfidence: Math.round((garbageProb / total) * 100),
                marineConfidence: Math.round((marineProb / total) * 100)
            };
        }

        // ... (remaining methods with detailed logging)

        updateProgress(percent, stage) {
            this.log(`Progress update: ${percent}% - ${stage}`);
            const progressBar = document.getElementById('loadingProgressBar');
            const progressStage = document.getElementById('loadingStage');
            if (progressBar) progressBar.style.width = `${percent}%`;
            if (progressStage) progressStage.textContent = stage;
        }

        showError(title, error) {
            this.log(`ERROR: ${title}`, error);
            console.error(`${title}: ${error.message}`, error.stack);
            alert(`${title}: ${error.message}`);
        }

        transitionToUI() {
            this.log('Transitioning to main UI');
            document.getElementById('loadingScreen').classList.add('fade-out');
            document.getElementById('mainContent').classList.remove('hidden');
            setTimeout(() => {
                document.getElementById('loadingScreen').remove();
            }, 1000);
        }

        setupEventListeners() {
        // Add these lines
            document.getElementById('searchButton').addEventListener('click', () => this.handleSearch());
            document.getElementById('searchInput').addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.handleSearch();
            });
            this.log('Setting up event listeners');
            const dropZone = document.getElementById('dropZone');
            const fileInput = document.getElementById('imageInput');
            const analyzeBtn = document.getElementById('analyzeButton');

            // Drag and drop handlers
            dropZone.addEventListener('click', () => fileInput.click());
            dropZone.addEventListener('dragover', e => e.preventDefault());
            dropZone.addEventListener('drop', e => this.handleFileDrop(e));

            // File input handler
            fileInput.addEventListener('change', e => this.handleFileSelect(e.target.files));

            // Analyze button
            analyzeBtn.addEventListener('click', () => this.processImageQueue());
        }

        handleFileSelect(files) {
            this.log(`Files selected: ${files.length}`);
            this.imageQueue = [...files];
            document.getElementById('analyzeButton').disabled = false;
        }

        handleFileDrop(e) {
            e.preventDefault();
            this.log('File drop event');
            this.handleFileSelect(e.dataTransfer.files);
        }

        async loadImageFile(file) {
            return new Promise((resolve, reject) => {
                this.log('Loading image file');
                const reader = new FileReader();
                reader.onload = e => {
                    const img = new Image();
                    img.onload = () => resolve(img);
                    img.onerror = reject;
                    img.src = e.target.result;
                };
                reader.readAsDataURL(file);
            });
        }

        // In your loadImageUrl method
        async loadImageUrl(item) {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.crossOrigin = "anonymous";
                
                img.onload = () => {
                    img.classList.add('loaded');
                    resolve(img);
                };
                
                img.onerror = async () => {
                    console.log(`Failed to load image: ${item.url}`);
                    
                    // Try thumbnail as fallback
                    if (item.thumbnail) {
                        console.log(`Trying thumbnail fallback: ${item.thumbnail}`);
                        img.src = `${this.apiBase}/api/image-proxy?url=${encodeURIComponent(item.thumbnail)}`;
                        return;
                    }
                    
                    // If no thumbnail, reject
                    reject(new Error('Failed to load image'));
                };
                
                img.src = `${this.apiBase}/api/image-proxy?url=${encodeURIComponent(item.url)}`;
            });
        }

        displayResult(item, results) {
            this.log('Displaying result', {item, results});
            
            const resultHTML = `
                <div class="waste-item animate-in">
                    <div class="waste-item-image">
                        <img src="${item.url}" alt="${results.type}" 
                            onerror="this.onerror=null;this.src='fallback-image.jpg'">
                        <div class="confidence-badge">${results.confidence}%</div>
                        <div class="type-badge ${results.type.replace(' ', '-').toLowerCase()}">
                            ${results.type}
                        </div>
                    </div>
                    <div class="waste-item-content">
                        ${this.createConfidenceBars(results)}
                    </div>
                </div>`;
            
            document.getElementById('resultsGrid').insertAdjacentHTML('beforeend', resultHTML);
            this.updateResultsCount();
        }

        createConfidenceBars(results) {
            return ['garbage', 'marine'].map(type => `
                <div class="confidence-bar-group">
                    <div class="accuracy-label">
                        <span>${type} confidence</span>
                        <span class="mono">${results[`${type}Confidence`]}%</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill ${type}" 
                             style="width: ${results[`${type}Confidence`]}%"></div>
                    </div>
                </div>`
            ).join('');
        }

        updateResultsCount() {
            const count = document.querySelectorAll('.waste-item').length;
            document.getElementById('resultsCount').textContent = 
                `${count} item${count !== 1 ? 's' : ''} analyzed`;
        }
        async handleSearch() {
            const query = document.getElementById('searchInput').value;
            if (!query) return;
            
            try {
                const results = await this.fetchImages('search', 6, query);
                this.displayResults(results);
            } catch (error) {
                this.showError('Search Failed', error);
            }
        }
    }

    // Initialize application
    window.addEventListener('load', () => {
        console.log('OceanGuardAI initializing...');
        new OceanGuardAI();
    });
    </script>
</body>
</html>