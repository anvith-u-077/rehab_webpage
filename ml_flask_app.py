from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import joblib

app = Flask(__name__)
CORS(app)  # Allow cross-origin from frontend

# --- Load the model and preprocessing objects ---
model = joblib.load("model.pkl")
scaler = joblib.load("scaler.pkl")
difficulty_encoder = joblib.load("difficulty_encoder.pkl")
target_encoder = joblib.load("target_encoder.pkl")

# --- Root endpoint ---
@app.route('/')
def home():
    return "✅ Flask ML Prediction Server is Running!"

# --- Prediction route (only latest row) ---
@app.route('/predict', methods=['POST'])
def predict():
    if 'file' not in request.files:
        print("❌ No file part in the request.")
        return jsonify({'error': 'No file part in the request'}), 400

    file = request.files['file']
    if file.filename == '':
        print("❌ No selected file.")
        return jsonify({'error': 'No selected file'}), 400

    try:
        # Load Excel file
        df = pd.read_excel(file)
        print("📥 Excel file loaded. Shape:", df.shape)

        # Drop rows missing 'Current Difficulty Level'
        df = df.dropna(subset=["Current Difficulty Level"])
        if df.empty:
            print("❌ No valid rows with 'Current Difficulty Level'.")
            return jsonify({'error': 'No valid rows with Current Difficulty Level'}), 400

        # Get latest row
        latest_row = df.tail(1).copy()
        print("🔎 Latest row selected:")
        print(latest_row)

        # Encode difficulty
        latest_row["Current Difficulty Encoded"] = difficulty_encoder.transform(
            latest_row["Current Difficulty Level"]
        )

        # Fill missing numeric values
        latest_row.fillna(latest_row.mean(numeric_only=True), inplace=True)

        # Features to be used for prediction
        feature_cols = [
            'Velostat Index (V)', 'Velostat Middle (V)', 'Velostat Ring (V)',
            'Velostat Little (V)', 'Velostat Thumb (V)', 'FSR Readings (N)',
            'Accelerometer Output (g)', 'Gyroscope Output (deg/s)',
            'Time taken (s)', 'Success Rate (%)', 'Current Difficulty Encoded'
        ]

        # Check for column mismatches
        for col in feature_cols:
            if col not in latest_row.columns:
                raise ValueError(f"Missing required column: {col}")

        # Prepare input
        X = latest_row[feature_cols]
        X_scaled = scaler.transform(X)
        print("📊 Scaled input features ready for prediction.")

        # Predict
        y_pred = model.predict(X_scaled)
        predicted_label = target_encoder.inverse_transform(y_pred)[0]
        print(f"✅ Raw predicted label: {predicted_label}")

        # Adjust based on current level
        current_level = latest_row["Current Difficulty Level"].values[0]
        if current_level == "Easy" and predicted_label == "Decrease Difficulty":
            adjusted_label = "Keep Difficulty"
        elif current_level == "Hard" and predicted_label == "Increase Difficulty":
            adjusted_label = "Keep Difficulty"
        else:
            adjusted_label = predicted_label

        print(f"🎯 Final adjusted prediction: {adjusted_label}")
        return jsonify({"prediction": adjusted_label})

    except Exception as e:
        print(f"❌ Error during prediction: {str(e)}")
        return jsonify({'error': str(e)}), 500

# --- Run Flask app on port 5000 ---
if __name__ == "__main__":
    app.run(debug=True, port=5000)
