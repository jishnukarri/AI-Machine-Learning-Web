from flask import Flask, request, render_template
from keras.models import load_model
from PIL import Image
import numpy as np
import os

# Initialize Flask app
app = Flask(__name__)

# Load the model (local path or URL)
model_url = 'https://github.com/jishnukarri/AI-Machine-Learning-Web/raw/refs/heads/main/model_tfjs/model.json'
model = load_model(model_url)

# Function to process the image and make a prediction
def predict_image(img_path):
    # Open and resize the image
    img = Image.open(img_path).resize((224, 224))  # Resize to 224x224 as expected by the model
    img = np.array(img)  # Convert to numpy array

    # Normalize the image if needed (assuming the model was trained on [0, 1] range)
    img = img / 255.0  # Normalize to [0, 1]

    # Add a batch dimension
    img = np.expand_dims(img, axis=0)

    # Predict the image
    prediction = model.predict(img)

    # Return the prediction result
    if prediction[0] < 0.5:
        return 'Garbage'
    else:
        return 'Marine Life'

# Route to upload the image
@app.route('/')
def index():
    return render_template('index.html')

# Route to handle the uploaded image and display prediction
@app.route('/predict', methods=['POST'])
def predict():
    if 'file' not in request.files:
        return 'No file part'

    file = request.files['file']
    if file.filename == '':
        return 'No selected file'

    # Save the uploaded file
    img_path = os.path.join('uploads', file.filename)
    file.save(img_path)

    # Run prediction
    result = predict_image(img_path)

    return render_template('result.html', result=result, img_path=img_path)

# Run the Flask app
if __name__ == '__main__':
    app.run(debug=True)
