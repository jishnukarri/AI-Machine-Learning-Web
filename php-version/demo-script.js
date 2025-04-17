/**
 * Ocean Waste Recognition AI Demo
 * Main JavaScript functionality
 */

class OceanWasteAI {
  constructor() {
      this.model = null;
      this.isModelLoaded = false;
      this.selectedImage = null;
      this.apiBase = 'http://localhost:8080';
      this.demoMode = false;
      
      // Initialize the application
      this.init();
  }
  
  async init() {
      try {
          console.log('Initializing Ocean Waste AI...');
          
          // Set up event listeners
          this.setupEventListeners();
          
          // Load TensorFlow.js model
          await this.loadModel();
          
          console.log('Initialization complete');
      } catch (error) {
          console.error('Initialization failed:', error);
          this.showError('Initialization Failed', error.message);
      }
  }
  
  async loadModel() {
      try {
          console.log('Loading AI model...');
          
          // Simulate model loading (replace with actual model loading in production)
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // In a real application, you would load the model like this:
          // this.model = await tf.loadLayersModel('model/model.json');
          
          this.isModelLoaded = true;
          console.log('Model loaded successfully');
          
          // Enable analyze button if image is selected
          if (this.selectedImage) {
              document.getElementById('analyzeButton').disabled = false;
          }
          
          return true;
      } catch (error) {
          console.error('Model loading failed:', error);
          throw new Error(`Failed to load AI model: ${error.message}`);
      }
  }
  
  setupEventListeners() {
      // Upload area
      const dropZone = document.getElementById('dropZone');
      const imageInput = document.getElementById('imageInput');
      
      dropZone.addEventListener('click', () => imageInput.click());
      dropZone.addEventListener('dragover', e => {
          e.preventDefault();
          dropZone.classList.add('dragover');
      });
      dropZone.addEventListener('dragleave', () => {
          dropZone.classList.remove('dragover');
      });
      dropZone.addEventListener('drop', e => {
          e.preventDefault();
          dropZone.classList.remove('dragover');
          this.handleFileSelect(e.dataTransfer.files);
      });
      
      // File input
      imageInput.addEventListener('change', e => {
          this.handleFileSelect(e.target.files);
          // Auto-submit form if using PHP upload
          if (e.target.form) {
              e.target.form.submit();
          }
      });
      
      // Analyze button
      const analyzeButton = document.getElementById('analyzeButton');
      analyzeButton.addEventListener('click', () => this.analyzeImage());
      
      // Demo button
      const demoButton = document.getElementById('demoButton');
      demoButton.addEventListener('click', () => {
          const demoImages = document.getElementById('demoImages');
          demoImages.classList.toggle('hidden');
      });
      
      // Demo images
      const demoImageElements = document.querySelectorAll('.demo-image');
      demoImageElements.forEach(img => {
          img.addEventListener('click', () => {
              this.handleDemoImageSelect(img);
          });
      });
      
      // Modal
      const helpButton = document.getElementById('helpButton');
      const modal = document.getElementById('howItWorksModal');
      const closeModal = document.getElementById('closeModal');
      
      helpButton.addEventListener('click', () => {
          modal.classList.add('active');
      });
      
      closeModal.addEventListener('click', () => {
          modal.classList.remove('active');
      });
      
      window.addEventListener('click', e => {
          if (e.target === modal) {
              modal.classList.remove('active');
          }
      });
  }
  
  handleFileSelect(files) {
      if (!files || files.length === 0) return;
      
      const file = files[0]; // Only process the first file
      
      // Check if file is an image
      if (!file.type.startsWith('image/')) {
          this.showError('Invalid File', 'Please select a valid image file');
          return;
      }
      
      // Create object URL for the file
      const imageUrl = URL.createObjectURL(file);
      
      // Set as selected image
      this.selectedImage = {
          file: file,
          url: imageUrl,
          name: file.name
      };
      
      // Enable analyze button if model is loaded
      if (this.isModelLoaded) {
          document.getElementById('analyzeButton').disabled = false;
      }
      
      // Show preview
      this.showImagePreview(imageUrl);
  }
  
  handleDemoImageSelect(imgElement) {
      const imageUrl = imgElement.querySelector('img').src;
      const category = imgElement.dataset.category;
      const label = imgElement.querySelector('.image-label').textContent;
      
      // Set as selected image
      this.selectedImage = {
          url: imageUrl,
          name: label,
          category: category,
          isDemoImage: true
      };
      
      // Enable analyze button
      document.getElementById('analyzeButton').disabled = false;
      
      // Show preview
      this.showImagePreview(imageUrl);
      
      // Hide demo images panel
      document.getElementById('demoImages').classList.add('hidden');
  }
  
  showImagePreview(imageUrl) {
      // Update the upload area to show the image
      const dropZone = document.getElementById('dropZone');
      dropZone.innerHTML = `
          <img src="${imageUrl}" alt="Selected image" style="max-height: 200px; max-width: 100%; border-radius: 4px;">
          <p class="upload-text" style="margin-top: 1rem;">Image selected</p>
          <p class="upload-subtext">Click "Analyze Image" to process</p>
      `;
  }
  
  async analyzeImage() {
      if (!this.selectedImage) return;
      
      try {
          // Show processing indicator
          this.showProcessingIndicator(true);
          
          // Start timing
          const startTime = performance.now();
          
          // Simulate processing delay
          await new Promise(resolve => setTimeout(resolve, 1500));
          
          // Get results (in a real app, this would use the actual model)
          let results;
          if (this.selectedImage.isDemoImage) {
              // For demo images, use predetermined results based on category
              results = this.simulateResults(this.selectedImage.category);
          } else {
              // For uploaded images, simulate random results
              results = this.simulateResults(Math.random() > 0.5 ? 'waste' : 'marine');
          }
          
          // Calculate processing time
          const endTime = performance.now();
          const processingTime = Math.round(endTime - startTime);
          
          // Display results
          this.displayResults(results, processingTime);
          
      } catch (error) {
          console.error('Analysis failed:', error);
          this.showError('Analysis Failed', error.message);
      } finally {
          // Hide processing indicator
          this.showProcessingIndicator(false);
      }
  }
  
  simulateResults(category) {
      // Generate simulated confidence scores
      let marineConfidence, wasteConfidence;
      
      if (category === 'waste') {
          wasteConfidence = Math.floor(Math.random() * 20) + 75; // 75-95%
          marineConfidence = 100 - wasteConfidence;
      } else {
          marineConfidence = Math.floor(Math.random() * 20) + 75; // 75-95%
          wasteConfidence = 100 - marineConfidence;
      }
      
      return {
          type: category === 'waste' ? 'Ocean Waste' : 'Marine Life',
          confidence: category === 'waste' ? wasteConfidence : marineConfidence,
          wasteConfidence: wasteConfidence,
          marineConfidence: marineConfidence
      };
  }
  
  displayResults(results, processingTime) {
      // Hide empty state
      document.getElementById('emptyState').classList.add('hidden');
      
      // Show results content
      const resultsContent = document.getElementById('resultsContent');
      resultsContent.classList.remove('hidden');
      
      // Set image
      document.getElementById('resultImage').src = this.selectedImage.url;
      
      // Set badge
      const resultBadge = document.getElementById('resultBadge');
      resultBadge.textContent = results.type;
      resultBadge.className = `result-badge ${results.type === 'Ocean Waste' ? 'waste' : 'marine'}`;
      
      // Set title
      document.getElementById('resultTitle').textContent = `${results.type} Detected`;
      
      // Set confidence chip
      const confidenceChip = document.getElementById('confidenceChip');
      confidenceChip.textContent = `${results.confidence}% Confidence`;
      
      if (results.confidence >= 85) {
          confidenceChip.className = 'confidence-chip high';
      } else if (results.confidence >= 70) {
          confidenceChip.className = 'confidence-chip medium';
      } else {
          confidenceChip.className = 'confidence-chip low';
      }
      
      // Set confidence bars
      document.getElementById('wasteConfidence').textContent = `${results.wasteConfidence}%`;
      document.getElementById('marineConfidence').textContent = `${results.marineConfidence}%`;
      document.getElementById('wasteBar').style.width = `${results.wasteConfidence}%`;
      document.getElementById('marineBar').style.width = `${results.marineConfidence}%`;
      
      // Set explanation
      const explanation = document.getElementById('resultExplanation');
      if (results.type === 'Ocean Waste') {
          explanation.textContent = `This image has been classified as ocean waste with ${results.confidence}% confidence. The AI model has detected patterns, textures, and shapes consistent with human-made objects rather than natural marine elements. This type of waste can harm marine ecosystems and should be removed from the ocean environment.`;
      } else {
          explanation.textContent = `This image has been classified as marine life with ${results.confidence}% confidence. The AI model has detected natural patterns, colors, and shapes consistent with marine organisms rather than human-made waste objects. These natural elements are essential parts of healthy ocean ecosystems.`;
      }
      
      // Set action list
      const actionList = document.getElementById('actionList');
      actionList.innerHTML = '';
      
      if (results.type === 'Ocean Waste') {
          const actions = [
              'Document location and type of waste for cleanup planning',
              'Organize targeted cleanup operation in this area',
              'Analyze waste composition for recycling potential',
              'Track potential sources to prevent future pollution',
              'Share data with environmental protection agencies'
          ];
          
          actions.forEach(action => {
              const li = document.createElement('li');
              li.textContent = action;
              actionList.appendChild(li);
          });
      } else {
          const actions = [
              'Document species and location for biodiversity studies',
              'Monitor this ecosystem for changes over time',
              'Protect this area from potential pollution sources',
              'Share data with marine conservation organizations',
              'Use as reference for healthy marine environments'
          ];
          
          actions.forEach(action => {
              const li = document.createElement('li');
              li.textContent = action;
              actionList.appendChild(li);
          });
      }
      
      // Set processing time
      document.getElementById('processingTime').textContent = `${processingTime}ms`;
  }
  
  showProcessingIndicator(show) {
      const indicator = document.getElementById('processingIndicator');
      if (show) {
          indicator.classList.remove('hidden');
      } else {
          indicator.classList.add('hidden');
      }
  }
  
  showError(title, message) {
      alert(`${title}: ${message}`);
  }
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new OceanWasteAI();
});