# Playprog -Forearm Rehabilitation Through Difficulty-Graded Interactive Gaming


A web-based rehabilitation platform designed to assist patients in improving forearm mobility (pronation and supination) movements through interactive gameplay, sensor integration, and progress tracking.

## Live Demo
🌐 Website link: https://playprog-rehab-project.web.app

##video link:
https://drive.google.com/file/d/1H1n_EIEwnr0sCy6NS4HgP2LHu5cLhKPf/view?usp=sharing

//the above video is only for illustration purpose, the actual working of the entire is kept confidential due to security issues.

## Project Overview
This platform simulates a therapy environment where users wear sensor-equipped gloves and engage in game-based exercises.
Therapists are required only once at the starting stage to judge the condition of the patient.
Therapists can monitor session data like success rate, time taken, and difficulty level, and will soon receive ML-powered recommendations for the next level of difficulty.
The Machine Learning model is designed to assist the therapist's role in adjusting the game difficulty level based on sensor data and game performance.

## Key Features

- ✅ **User Authentication** (Firebase Auth)
- 🏥 **Patient & Therapist Dashboards**
- 🎮 **Game Interface** for Rehab Tasks
- 📈 **Session Tracking** (Level, Time, Success Rate)
- 🧠 **(Upcoming)** ML model to predict next difficulty level
- 📊 **Sensor Data Logging** and Graph Visualization

##  Technologies Used

           

| Frontend     | HTML, CSS, JavaScript         
| Auth & DB    | Firebase Authentication, Firestore 
| Hosting      | Firebase Hosting     


## End-to-End Data Flow
1. 👤 User logs in (patient)
2. 🎮 Game session starts (based on selected difficulty)
3. 🧤 Sensors collect data: Velostat, FSR, IMU (gyroscope and accelerometer) 
4. 📁 Sensor data logged to Firebase
5. 🧠 ML model (external) predicts next recommended level (still in development stage)
6. 🔁 Prediction displayed for therapist to review


## What I Learned

- Implementing Firebase Authentication and Firestore database structure
- Handling real-time sensor data for biomedical applications
- Integrating JavaScript-based game logic with HTML UI
- Planning and structuring ML model pipelines for health tech
- Deploying scalable web apps using Firebase Hosting

📞Contact
Me: Anvith U
📧 Email: anvith435@gmail.com
🔗 LinkedIn: www.linkedin.com/in/anvithu










