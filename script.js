let model;
const garbageImages = [];
const marineLifeImages = [];

// Simulate a kid-friendly loading screen
async function loadEverything() {
    // Show loading screen
    document.getElementById('loading-screen').style.display = 'flex';

    // Fake delay for "loading" effect
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Load the TensorFlow.js model
    model = await tf.loadLayersModel('model-new/model.json');

    // Pick 3 random garbage and marine life images
    for (let i = 1; i <= 50; i++) {
        garbageImages.push(`images/garbage/${i}.jpg`);
        marineLifeImages.push(`images/marine-life/${i}.jpg`);
    }

    // Randomly select 3 images from each category
    const randomGarbage = shuffleArray(garbageImages).slice(0, 3);
    const randomMarineLife = shuffleArray(marineLifeImages).slice(0, 3);

    // Display images in the grid
    randomGarbage.forEach(src => {
        const img = document.createElement('img');
        img.src = src;
        img.onclick = () => startPrediction(src);
        document.querySelector('.garbage-images').appendChild(img);
    });

    randomMarineLife.forEach(src => {
        const img = document.createElement('img');
        img.src = src;
        img.onclick = () => startPrediction(src);
        document.querySelector('.marine-life-images').appendChild(img);
    });

    // Hide loading screen and show main content
    document.getElementById('loading-screen').style.display = 'none';
    document.getElementById('main-content').classList.remove('hidden');
}

// Shuffle array (for random selection)
function shuffleArray(array) {
    return array.sort(() => Math.random() - 0.5);
}

// Start prediction when an image is clicked
async function startPrediction(imageSrc) {
    document.getElementById('prediction-section').classList.remove('hidden');
    document.getElementById('selected-image').src = imageSrc;

    // Fake loading animation
    const progress = document.querySelector('.progress');
    let width = 0;
    const interval = setInterval(() => {
        if (width >= 100) {
            clearInterval(interval);
            predict(imageSrc);
        } else {
            width += 10;
            progress.style.width = `${width}%`;
        }
    }, 200);
}

// Predict the image class
async function predict(imageSrc) {
    const img = new Image();
    img.src = imageSrc;
    img.onload = async () => {
        // Preprocess the image
        const tensor = tf.browser.fromPixels(img)
            .resizeNearestNeighbor([224, 224])
            .toFloat()
            .div(255.0)
            .expandDims();

        // Make predictions
        const predictions = await model.predict(tensor).data();
        const garbagePercent = Math.round(predictions[0] * 100);
        const marineLifePercent = 100 - garbagePercent;

        // Show result with emojis and confetti 🎉
        document.getElementById('result').innerHTML = `
            ${garbagePercent}% Garbage 🚮 
            ${marineLifePercent}% Marine Life 🌊
        `;
        if (garbagePercent > 50) {
            document.getElementById('result').style.color = 'red';
        } else {
            document.getElementById('result').style.color = 'green';
        }
    };
}

// Start the app
document.getElementById('start-btn').addEventListener('click', loadEverything);