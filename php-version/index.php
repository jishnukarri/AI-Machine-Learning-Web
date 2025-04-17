<?php
// Basic configuration
$apiBase = 'http://localhost:8080';
$allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

// Handle file uploads if any
$uploadedFile = null;
if ($_SERVER['REQUEST_METHOD'] === 'POST' && !empty($_FILES['image'])) {
    $file = $_FILES['image'];
    if (in_array($file['type'], $allowedTypes)) {
        $uploadedFile = [
            'name' => $file['name'],
            'path' => $file['tmp_name'],
            'url' => 'data:' . $file['type'] . ';base64,' . base64_encode(file_get_contents($file['tmp_name']))
        ];
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ocean Waste Recognition AI</title>
    <script src="https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@3.18.0/dist/tf.min.js"></script>
    <link rel="stylesheet" href="demo-styles.css">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
</head>
<body>
    <div class="app-container">
        <!-- Header -->
        <header class="header">
            <div class="logo">
                <div class="logo-icon">
                    <svg viewBox="0 0 24 24" width="28" height="28">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" fill="#0ea5e9"/>
                        <path d="M12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z" fill="#0284c7"/>
                    </svg>
                </div>
                <h1>Ocean Waste Recognition AI</h1>
            </div>
            <div class="header-actions">
                <button id="helpButton" class="btn btn-text">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/>
                    </svg>
                    <span>How it Works</span>
                </button>
            </div>
        </header>

        <!-- Main Content -->
        <main class="main-content">
            <div class="demo-grid">
                <!-- Input Panel -->
                <section class="panel input-panel">
                    <h2 class="panel-title">Image Analysis</h2>
                    <p class="panel-description">Upload an image to analyze and identify ocean waste</p>
                    
                    <!-- Upload Area -->
                    <div class="upload-area" id="dropZone">
                        <div class="upload-icon">
                            <svg viewBox="0 0 24 24" width="48" height="48" fill="currentColor">
                                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                            </svg>
                        </div>
                        <p class="upload-text">Drag & Drop Image Here</p>
                        <p class="upload-subtext">or click to browse files</p>
                        <form id="uploadForm" method="post" enctype="multipart/form-data" style="display:none;">
                            <input type="file" id="imageInput" name="image" accept="image/*">
                        </form>
                    </div>
                    
                    <div class="action-buttons">
                        <button id="analyzeButton" class="btn btn-primary" disabled>
                            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                                <path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/>
                            </svg>
                            <span>Analyze Image</span>
                        </button>
                        <button id="demoButton" class="btn btn-outline">
                            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
                            </svg>
                            <span>Try Demo Images</span>
                        </button>
                    </div>
                    
                    <!-- Demo Images -->
                    <div class="demo-images" id="demoImages">
                        <h3 class="section-title">Sample Images</h3>
                        <div class="image-grid">
                            <div class="demo-image" data-category="waste">
                                <img src="https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?w=300&q=80" alt="Plastic bottles in ocean">
                                <div class="image-label">Plastic Waste</div>
                            </div>
                            <div class="demo-image" data-category="marine">
                                <img src="https://images.unsplash.com/photo-1544552866-d3ed42536cfd?w=300&q=80" alt="Coral reef">
                                <div class="image-label">Coral Reef</div>
                            </div>
                            <div class="demo-image" data-category="waste">
                                <img src="https://images.unsplash.com/photo-1621451537084-482c73073a0f?w=300&q=80" alt="Fishing net waste">
                                <div class="image-label">Fishing Net</div>
                            </div>
                            <div class="demo-image" data-category="marine">
                                <img src="https://images.unsplash.com/photo-1580019542155-247062e19ce4?w=300&q=80" alt="Sea turtle">
                                <div class="image-label">Sea Turtle</div>
                            </div>
                        </div>
                    </div>
                </section>

                <!-- Results Panel -->
                <section class="panel results-panel">
                    <h2 class="panel-title">Analysis Results</h2>
                    
                    <!-- Empty State -->
                    <div class="empty-state" id="emptyState">
                        <div class="empty-icon">
                            <svg viewBox="0 0 24 24" width="64" height="64" fill="currentColor">
                                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z"/>
                                <path d="M14.14 11.86l-3 3.87L9 13.14 6 17h12z"/>
                            </svg>
                        </div>
                        <p class="empty-text">No image analyzed yet</p>
                        <p class="empty-subtext">Upload an image or select a demo image to begin</p>
                    </div>
                    
                    <!-- Results Content -->
                    <div class="results-content hidden" id="resultsContent">
                        <div class="results-image-container">
                            <img id="resultImage" src="/placeholder.svg" alt="Analyzed image">
                            <div class="result-badge" id="resultBadge"></div>
                        </div>
                        
                        <div class="results-details">
                            <div class="result-header">
                                <h3 id="resultTitle">Analysis Results</h3>
                                <div class="confidence-chip" id="confidenceChip">0% Confidence</div>
                            </div>
                            
                            <div class="confidence-bars">
                                <div class="confidence-bar-group">
                                    <div class="confidence-label">
                                        <span>Ocean Waste</span>
                                        <span id="wasteConfidence">0%</span>
                                    </div>
                                    <div class="confidence-bar">
                                        <div class="confidence-fill waste" id="wasteBar" style="width: 0%"></div>
                                    </div>
                                </div>
                                <div class="confidence-bar-group">
                                    <div class="confidence-label">
                                        <span>Marine Life</span>
                                        <span id="marineConfidence">0%</span>
                                    </div>
                                    <div class="confidence-bar">
                                        <div class="confidence-fill marine" id="marineBar" style="width: 0%"></div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="result-explanation" id="resultExplanation"></div>
                            
                            <div class="action-section">
                                <h4>Recommended Actions</h4>
                                <ul class="action-list" id="actionList"></ul>
                            </div>
                            
                            <div class="model-info">
                                <h4>AI Model Information</h4>
                                <div class="info-grid">
                                    <div class="info-item">
                                        <div class="info-label">Model Type</div>
                                        <div class="info-value">Convolutional Neural Network</div>
                                    </div>
                                    <div class="info-item">
                                        <div class="info-label">Training Data</div>
                                        <div class="info-value">10,000+ ocean images</div>
                                    </div>
                                    <div class="info-item">
                                        <div class="info-label">Accuracy</div>
                                        <div class="info-value">~94% on test data</div>
                                    </div>
                                    <div class="info-item">
                                        <div class="info-label">Processing Time</div>
                                        <div class="info-value" id="processingTime">0ms</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Processing Indicator -->
                    <div class="processing-indicator hidden" id="processingIndicator">
                        <div class="spinner"></div>
                        <p>Processing Image...</p>
                    </div>
                </section>
            </div>
        </main>
    </div>
    
    <!-- How It Works Modal -->
    <div class="modal" id="howItWorksModal">
        <div class="modal-content">
            <div class="modal-header">
                <h2>How the AI Works</h2>
                <button class="modal-close" id="closeModal">
                    <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                    </svg>
                </button>
            </div>
            <div class="modal-body">
                <div class="process-steps">
                    <div class="process-step">
                        <div class="step-number">1</div>
                        <div class="step-content">
                            <h3>Image Input</h3>
                            <p>The system accepts images of ocean environments that may contain waste or natural elements.</p>
                        </div>
                    </div>
                    <div class="process-step">
                        <div class="step-number">2</div>
                        <div class="step-content">
                            <h3>Preprocessing</h3>
                            <p>Images are resized to 224x224 pixels and normalized to prepare them for the neural network.</p>
                        </div>
                    </div>
                    <div class="process-step">
                        <div class="step-number">3</div>
                        <div class="step-content">
                            <h3>Feature Extraction</h3>
                            <p>The convolutional neural network extracts key visual features that distinguish waste from natural elements.</p>
                        </div>
                    </div>
                    <div class="process-step">
                        <div class="step-number">4</div>
                        <div class="step-content">
                            <h3>Classification</h3>
                            <p>The model analyzes the features and classifies the image as either "Ocean Waste" or "Marine Life".</p>
                        </div>
                    </div>
                    <div class="process-step">
                        <div class="step-number">5</div>
                        <div class="step-content">
                            <h3>Confidence Score</h3>
                            <p>The system provides a confidence percentage indicating how certain it is about its classification.</p>
                        </div>
                    </div>
                </div>
                
                <div class="model-architecture">
                    <h3>Neural Network Architecture</h3>
                    <div class="architecture-diagram">
                        <div class="layer input-layer">
                            <div class="layer-label">Input<br>224×224×3</div>
                        </div>
                        <div class="layer conv-layer">
                            <div class="layer-label">Conv<br>Layers</div>
                        </div>
                        <div class="layer pooling-layer">
                            <div class="layer-label">Pooling<br>Layers</div>
                        </div>
                        <div class="layer dense-layer">
                            <div class="layer-label">Dense<br>Layers</div>
                        </div>
                        <div class="layer output-layer">
                            <div class="layer-label">Output<br>2 Classes</div>
                        </div>
                        <svg class="connector-lines" width="100%" height="100%" viewBox="0 0 600 100" preserveAspectRatio="none">
                            <path d="M80,50 L160,50" stroke="#0ea5e9" stroke-width="2"/>
                            <path d="M240,50 L320,50" stroke="#0ea5e9" stroke-width="2"/>
                            <path d="M400,50 L480,50" stroke="#0ea5e9" stroke-width="2"/>
                            <path d="M560,50 L640,50" stroke="#0ea5e9" stroke-width="2"/>
                        </svg>
                    </div>
                </div>
                
                <div class="training-info">
                    <h3>Training Process</h3>
                    <p>The model was trained on over 10,000 labeled images of ocean environments, with both waste objects and natural marine elements. The training process involved:</p>
                    <ul>
                        <li>Data augmentation to increase training sample diversity</li>
                        <li>Transfer learning from pre-trained image recognition models</li>
                        <li>Fine-tuning with ocean-specific images</li>
                        <li>Validation against a separate test dataset</li>
                    </ul>
                </div>
            </div>
        </div>
    </div>

    <script src="demo-script.js"></script>
</body>
</html>