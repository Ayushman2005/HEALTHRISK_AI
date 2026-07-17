import os
import json
import pickle
import subprocess
import hmac
import hashlib
import time
from functools import wraps
import numpy as np
import pymysql
from flask import Flask, request, jsonify
from flask_cors import CORS

# Admin credentials & authentication configurations
ADMIN_USERNAME = os.environ.get('ADMIN_USERNAME', 'admin')
ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD', 'admin123')
JWT_SECRET = os.environ.get('JWT_SECRET', 'healthrisk-ai-secret-default-2026')

def generate_token(username):
    timestamp = str(int(time.time()))
    payload = f"{username}:{timestamp}"
    signature = hmac.new(JWT_SECRET.encode(), payload.encode(), hashlib.sha256).hexdigest()
    return f"{payload}:{signature}"

def verify_token(token):
    if not token:
        return False
    try:
        parts = token.split(':')
        if len(parts) != 3:
            return False
        username, timestamp, signature = parts
        
        token_time = int(timestamp)
        now = int(time.time())
        if now - token_time > 86400 or now - token_time < -300:
            return False
            
        payload = f"{username}:{timestamp}"
        expected_sig = hmac.new(JWT_SECRET.encode(), payload.encode(), hashlib.sha256).hexdigest()
        
        if hmac.compare_digest(signature, expected_sig):
            if username.lower() == ADMIN_USERNAME.lower():
                return True
            try:
                user = db_fetchone("SELECT * FROM users WHERE LOWER(username) = LOWER(%s)", (username,))
                return user is not None
            except Exception:
                # If database helper is not initialized yet or fails, fallback to successful signature match
                return True
    except Exception:
        pass
    return False

def requires_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization', None)
        if not auth_header:
            return jsonify({'error': 'Authorization header is missing'}), 401
        
        parts = auth_header.split()
        if parts[0].lower() != 'bearer' or len(parts) != 2:
            return jsonify({'error': 'Authorization header must be Bearer token'}), 401
            
        token = parts[1]
        if not verify_token(token):
            return jsonify({'error': 'Unauthorized or token expired'}), 401
            
        return f(*args, **kwargs)
    return decorated

def load_dotenv():
    env_path = ".env"
    if not os.path.exists(env_path):
        env_path = os.path.join(os.path.dirname(__file__), ".env")
    if os.path.exists(env_path):
        with open(env_path, "r") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#"):
                    parts = line.split("=", 1)
                    if len(parts) == 2:
                        key = parts[0].strip()
                        val = parts[1].strip()
                        if val.startswith('"') and val.endswith('"'):
                            val = val[1:-1]
                        elif val.startswith("'") and val.endswith("'"):
                            val = val[1:-1]
                        os.environ[key] = val

load_dotenv()

app = Flask(__name__)
CORS(app) # Enable Cross-Origin Resource Sharing

# Global variables for models and utilities
scaler = None
feature_names = []
models = {}
model_metrics = {}
diseases = ['diabetes', 'heart_disease', 'kidney_disease', 'liver_disease']
algs = ['logistic_regression', 'decision_tree', 'random_forest', 'xgboost', 'svm']

# MySQL Database connection helper
def get_db_connection():
    # Reads environment variables, falling back to localhost defaults
    return pymysql.connect(
        host=os.environ.get('MYSQL_HOST', 'localhost'),
        user=os.environ.get('MYSQL_USER', 'root'),
        password=os.environ.get('MYSQL_PASSWORD', ''),
        database=os.environ.get('MYSQL_DB', 'health_risk_db'),
        charset='utf8mb4',
        cursorclass=pymysql.cursors.DictCursor
    )

import sqlite3

USE_SQLITE = False

def init_db():
    global USE_SQLITE
    # 1. Try to connect to MySQL
    try:
        conn = pymysql.connect(
            host=os.environ.get('MYSQL_HOST', 'localhost'),
            user=os.environ.get('MYSQL_USER', 'root'),
            password=os.environ.get('MYSQL_PASSWORD', ''),
            charset='utf8mb4',
            cursorclass=pymysql.cursors.DictCursor
        )
        with conn.cursor() as cursor:
            db_name = os.environ.get('MYSQL_DB', 'health_risk_db')
            cursor.execute(f"CREATE DATABASE IF NOT EXISTS {db_name}")
        conn.close()
        
        # Verify tables in MySQL
        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS assessments (
                    id VARCHAR(50) PRIMARY KEY,
                    name VARCHAR(100) NOT NULL,
                    timestamp VARCHAR(50) NOT NULL,
                    personal JSON NOT NULL,
                    lifestyle JSON NOT NULL,
                    medical JSON NOT NULL,
                    results JSON NOT NULL
                )
            """)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    username VARCHAR(100) NOT NULL UNIQUE,
                    password_hash VARCHAR(255) NOT NULL,
                    name VARCHAR(100) NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            try:
                cursor.execute("ALTER TABLE users ADD COLUMN name VARCHAR(100) DEFAULT 'User'")
            except Exception:
                pass
        conn.commit()
        conn.close()
        print("MySQL database and tables ('assessments', 'users') verified/created successfully.")
        USE_SQLITE = False
    except Exception as e:
        print(f"Error during MySQL database initialization: {e}")
        print("MySQL connection failed. Falling back to local SQLite storage.")
        USE_SQLITE = True
        
        try:
            os.makedirs("models", exist_ok=True)
            conn = sqlite3.connect("models/local_storage.db")
            cursor = conn.cursor()
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS assessments (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    timestamp TEXT NOT NULL,
                    personal TEXT NOT NULL,
                    lifestyle TEXT NOT NULL,
                    medical TEXT NOT NULL,
                    results TEXT NOT NULL
                )
            """)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username TEXT NOT NULL UNIQUE,
                    password_hash TEXT NOT NULL,
                    name TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            try:
                cursor.execute("ALTER TABLE users ADD COLUMN name TEXT DEFAULT 'User'")
            except Exception:
                pass
            conn.commit()
            conn.close()
            print("SQLite local database and tables verified/created successfully.")
        except Exception as sq_err:
            print(f"Critical Error: Failed to initialize SQLite local database: {sq_err}")

# DB Execution helper methods
def db_execute(query, params=None):
    if params is None:
        params = ()
    if USE_SQLITE:
        sqlite_query = query.replace("%s", "?")
        conn = sqlite3.connect("models/local_storage.db")
        cursor = conn.cursor()
        cursor.execute(sqlite_query, params)
        conn.commit()
        conn.close()
    else:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute(query, params)
        conn.commit()
        conn.close()

def db_fetchall(query, params=None):
    if params is None:
        params = ()
    if USE_SQLITE:
        sqlite_query = query.replace("%s", "?")
        conn = sqlite3.connect("models/local_storage.db")
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute(sqlite_query, params)
        rows = cursor.fetchall()
        result = [dict(row) for row in rows]
        conn.close()
        return result
    else:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute(query, params)
            result = cursor.fetchall()
        conn.close()
        return result

def db_fetchone(query, params=None):
    if params is None:
        params = ()
    if USE_SQLITE:
        sqlite_query = query.replace("%s", "?")
        conn = sqlite3.connect("models/local_storage.db")
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute(sqlite_query, params)
        row = cursor.fetchone()
        result = dict(row) if row else None
        conn.close()
        return result
    else:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute(query, params)
            result = cursor.fetchone()
        conn.close()
        return result

# Load ML Assets
def load_ml_assets():
    global scaler, feature_names, models
    print("Loading Machine Learning assets...")
    
    # Load Scaler
    scaler_path = "models/scaler.pkl"
    if os.path.exists(scaler_path):
        with open(scaler_path, "rb") as f:
            scaler = pickle.load(f)
        print("  Scaler loaded successfully.")
    else:
        print("  WARNING: scaler.pkl not found. Please train models first.")
        
    # Load Feature Names list
    names_path = "models/feature_names.json"
    if os.path.exists(names_path):
        with open(names_path, "r") as f:
            feature_names = json.load(f)
        print("  Feature names mapping loaded successfully.")
        
    # Load model metrics
    metrics_path = "models/model_metrics.json"
    if os.path.exists(metrics_path):
        try:
            with open(metrics_path, "r") as f:
                model_metrics = json.load(f)
            print("  Model metrics loaded successfully.")
        except Exception as e:
            print(f"  WARNING: Failed to load model_metrics.json: {e}")
            
    # Load all models
    loaded_count = 0
    for disease in diseases:
        models[disease] = {}
        for alg in algs:
            model_path = f"models/{disease}_{alg}.pkl"
            if os.path.exists(model_path):
                with open(model_path, "rb") as f:
                    models[disease][alg] = pickle.load(f)
                loaded_count += 1
    print(f"  Loaded {loaded_count}/20 models successfully.")

# Run Database and ML startup routines
init_db()
load_ml_assets()

def select_best_algorithm_for_disease(disease):
    global model_metrics
    pref_order = ['random_forest', 'xgboost', 'svm', 'logistic_regression', 'decision_tree']
    
    if not model_metrics or disease not in model_metrics:
        return 'random_forest'
        
    disease_algs = model_metrics[disease]
    best_alg = 'random_forest'
    best_score = (-1.0, -1.0, -1.0) # (f1_score, accuracy, roc_auc)
    
    for alg in algs:
        if alg in disease_algs:
            metrics = disease_algs[alg]
            f1 = metrics.get('f1_score', 0.0)
            acc = metrics.get('accuracy', 0.0)
            auc = metrics.get('roc_auc', 0.0)
            
            current_score = (f1, acc, auc)
            if current_score > best_score:
                best_score = current_score
                best_alg = alg
            elif current_score == best_score:
                # Tie breaker: choose the one that appears earlier in pref_order
                if pref_order.index(alg) < pref_order.index(best_alg):
                    best_alg = alg
                    
    return best_alg

def encode_input(data, bmi):
    # Match the order of numeric variables in train_models.py
    numericals = [
        float(data.get('age', 35)),
        float(data.get('height', 170)),
        float(data.get('weight', 70)),
        float(bmi),
        float(data.get('sleepDuration', 7)),
        float(data.get('bpSystolic', 120)),
        float(data.get('bpDiastolic', 80)),
        float(data.get('cholesterol', 180)),
        float(data.get('glucose', 90)),
        float(data.get('insulin', 8)),
        float(data.get('heartRate', 70))
    ]
    
    # Categorical mapping definitions matching train_models.py
    cat_categories = {
        'gender': ['male', 'female', 'other'],
        'smoking': ['yes', 'no'],
        'alcohol': ['low', 'moderate', 'high'],
        'physical_activity': ['sedentary', 'moderate', 'active']
    }
    
    # Extract values from request
    mapped_keys = {
        'gender': str(data.get('gender', 'male')).lower(),
        'smoking': str(data.get('smoking', 'no')).lower(),
        'alcohol': str(data.get('alcohol', 'low')).lower(),
        'physical_activity': str(data.get('physicalActivity', 'moderate')).lower()
    }
    
    categoricals = []
    for col, cats in cat_categories.items():
        val = mapped_keys[col]
        if val not in cats:
            val = cats[0]
        for cat in cats:
            categoricals.append(1.0 if val == cat else 0.0)
            
    # Combine numericals and encoded categoricals
    all_features = np.array(numericals + categoricals).reshape(1, -1)
    return all_features

@app.route('/api/predict', methods=['POST'])
def predict():
    try:
        data = request.json
        if not data:
            return jsonify({'error': 'No input payload provided'}), 400
            
        # 1. Parse name, height, weight and compute BMI
        name = data.get('name', 'Anonymous')
        height = float(data.get('height', 170))
        weight = float(data.get('weight', 70))
        
        if height <= 0:
            return jsonify({'error': 'Height must be positive'}), 400
            
        height_meters = height / 100
        bmi = round(weight / (height_meters * height_meters), 1)
        
        # 2. Encode categorical and numerical variables
        X = encode_input(data, bmi)
        
        # 3. Apply StandardScaler on first 11 features (numerical portion)
        global scaler
        if scaler is None:
            load_ml_assets()
            if scaler is None:
                return jsonify({'error': 'Model assets (scaler) are not loaded on server.'}), 500
                
        X_num_scaled = scaler.transform(X[:, :11])
        X_scaled = X.copy()
        X_scaled[:, :11] = X_num_scaled
        
        # 4. Determine algorithm and run predictions (fallback / dynamic selection)
        passed_alg = data.get('algorithm', 'auto').lower()
        
        predictions = {}
        selected_algorithms = {}
        for disease in diseases:
            if passed_alg in algs:
                best_alg = passed_alg
            else:
                best_alg = select_best_algorithm_for_disease(disease)
                
            selected_algorithms[disease] = best_alg
            
            disease_models = models.get(disease, {})
            model = disease_models.get(best_alg)
            if model is None:
                # Fallback to random_forest if the best algorithm's model is not loaded
                model = disease_models.get('random_forest')
                if model is None:
                    return jsonify({'error': f'Model for {disease} not found'}), 500
                best_alg = 'random_forest'
                selected_algorithms[disease] = best_alg
                
            prob = model.predict_proba(X_scaled)[0][1]
            predictions[disease] = int(round(prob * 100))
            
        print(f"Predictions run. Selected algorithms: {selected_algorithms}")
            
        # 5. Calculate Overall Health Score based on predictions
        avg_risk = sum(predictions.values()) / len(diseases)
        health_score = 100 - (avg_risk * 0.75)
        high_alerts = sum(1 for r in predictions.values() if r >= 70)
        health_score -= (high_alerts * 8)
        health_score = int(max(15, min(100, round(health_score))))
        
        # 6. Generate Clinical Explanations & Contributing Factors
        explanations = {
            'diabetes': [],
            'heartDisease': [],
            'kidneyDisease': [],
            'liverDisease': []
        }
        
        age = int(data.get('age', 35))
        gender = str(data.get('gender', 'male')).lower()
        glucose = int(data.get('glucose', 90))
        insulin = int(data.get('insulin', 8))
        bp_systolic = int(data.get('bpSystolic', 120))
        bp_diastolic = int(data.get('bpDiastolic', 80))
        cholesterol = int(data.get('cholesterol', 180))
        smoking = str(data.get('smoking', 'no')).lower()
        alcohol = str(data.get('alcohol', 'low')).lower()
        activity = str(data.get('physicalActivity', 'moderate')).lower()
        sleep = float(data.get('sleepDuration', 7))
        heart_rate = int(data.get('heartRate', 70))
        
        if glucose > 100:
            explanations['diabetes'].append(f"Fasting blood glucose of {glucose} mg/dL exceeds normal limit (<100 mg/dL).")
        if bmi >= 25:
            explanations['diabetes'].append(f"Elevated BMI of {bmi} kg/m² indicates overweight/obesity.")
        if insulin > 15:
            explanations['diabetes'].append(f"Fasting insulin of {insulin} µIU/mL suggests insulin resistance.")
        if age > 45:
            explanations['diabetes'].append(f"Age of {age} increases baseline risk factors.")
        if activity == 'sedentary':
            explanations['diabetes'].append("Sedentary lifestyle reduces insulin sensitivity.")
            
        if bp_systolic >= 130 or bp_diastolic >= 85:
            explanations['heartDisease'].append(f"Elevated blood pressure ({bp_systolic}/{bp_diastolic} mmHg) increases cardiovascular strain.")
        if cholesterol > 200:
            explanations['heartDisease'].append(f"Cholesterol level of {cholesterol} mg/dL is borderline/high.")
        if smoking == 'yes':
            explanations['heartDisease'].append("Active tobacco smoking is a major risk factor for coronary plaque.")
        if alcohol == 'high':
            explanations['heartDisease'].append("Heavy alcohol usage impacts myocardial cells.")
        if age > 45:
            explanations['heartDisease'].append(f"Age of {age} increases cardiovascular baseline parameters.")
            
        if bp_systolic >= 130 or bp_diastolic >= 85:
            explanations['kidneyDisease'].append(f"Hypertension ({bp_systolic}/{bp_diastolic} mmHg) damages renal blood vessels.")
        if glucose > 100:
            explanations['kidneyDisease'].append(f"Elevated fasting glucose of {glucose} mg/dL increases kidney filtering workload.")
        if age > 50:
            explanations['kidneyDisease'].append(f"Natural decline in glomerular filtration rate (GFR) over age 50.")
            
        if alcohol == 'high':
            explanations['liverDisease'].append("Heavy alcohol consumption increases liver toxicity risk.")
        elif alcohol == 'moderate':
            explanations['liverDisease'].append("Moderate alcohol consumption adds liver metabolism loads.")
        if bmi >= 25:
            explanations['liverDisease'].append(f"Elevated BMI of {bmi} kg/m² contributes to non-alcoholic fatty liver (NAFLD) risk.")
        if cholesterol > 220:
            explanations['liverDisease'].append(f"Hyperlipidemia (cholesterol {cholesterol} mg/dL) contributes to fatty deposits in liver tissue.")
            
        for k in explanations:
            if not explanations[k]:
                explanations[k].append("All parameters within standard clinical limits.")
                
        # 7. Generate Recommendations
        recs = {
            "immediate": [],
            "lifestyle": [],
            "medical": []
        }
        
        if bp_systolic >= 150 or bp_diastolic >= 95:
            recs["immediate"].append(f"Seek clinical evaluation for high blood pressure ({bp_systolic}/{bp_diastolic} mmHg).")
        if glucose >= 150:
            recs["immediate"].append(f"Consult an endocrinologist regarding elevated fasting blood glucose ({glucose} mg/dL).")
        if predictions['heart_disease'] >= 70:
            recs["immediate"].append("Consult a cardiologist for a cardiovascular diagnostic checkup.")
        if predictions['liver_disease'] >= 70:
            recs["immediate"].append("Schedule a hepatic ultrasound examination with your doctor.")
            
        if smoking == 'yes':
            recs["lifestyle"].append("Enroll in a tobacco cessation program. Smoking accelerates vascular damage.")
        if alcohol in ['high', 'moderate']:
            recs["lifestyle"].append("Limit alcohol intake to normal parameters or abstain completely.")
        if activity == 'sedentary':
            recs["lifestyle"].append("Incorporate 150 minutes of moderate aerobic activity weekly.")
        if bmi >= 25:
            recs["lifestyle"].append("Focus on dietary modifications aimed at 5-10% body weight reduction.")
        if sleep < 7:
            recs["lifestyle"].append("Improve sleep hygiene to ensure 7-8 hours of sleep per night.")
            
        if glucose >= 100:
            recs["medical"].append("Request an HbA1c blood test to screen for pre-diabetes/diabetes.")
        if bp_systolic >= 130 or bp_diastolic >= 80:
            recs["medical"].append("Track blood pressure readings daily at home.")
        if cholesterol >= 200:
            recs["medical"].append("Discuss a lipid panel test and cholesterol management with your doctor.")
            
        if not recs["lifestyle"]:
            recs["lifestyle"].append("Maintain your excellent physical fitness and healthy habits!")
        if not recs["medical"]:
            recs["medical"].append("Continue with routine annual health screenings.")
            
        # 8. Dynamic Confidence Score
        confidence = int(round(85 + (abs(avg_risk - 50) / 50) * 11))
        confidence = min(96, max(82, confidence))
        
        # Build results structure
        results = {
            'risks': {
                'diabetes': predictions['diabetes'],
                'heartDisease': predictions['heart_disease'],
                'kidneyDisease': predictions['kidney_disease'],
                'liverDisease': predictions['liver_disease']
            },
            'overallScore': health_score,
            'confidence': confidence,
            'recommendations': recs,
            'explanations': {
                'diabetes': explanations['diabetes'],
                'heart': explanations['heartDisease'],
                'kidney': explanations['kidneyDisease'],
                'liver': explanations['liverDisease']
            }
        }
        
        # 9. SAVE TO MYSQL DATABASE
        alg_suffix = passed_alg if passed_alg in algs else 'auto'
        assess_id = f"assess-{int(np.round(np.random.rand() * 1000000))}-{alg_suffix}"
        from datetime import datetime
        timestamp_str = datetime.now().isoformat()
        
        # Gather structured inputs
        personal_info = {'name': name, 'age': age, 'gender': gender, 'height': height, 'weight': weight, 'bmi': bmi}
        lifestyle_info = {'smoking': smoking, 'alcohol': alcohol, 'physicalActivity': activity, 'sleepDuration': sleep}
        medical_info = {'bpSystolic': bp_systolic, 'bpDiastolic': bp_diastolic, 'cholesterol': cholesterol, 'glucose': glucose, 'insulin': insulin, 'heartRate': heart_rate}
        
        try:
            db_execute(
                "INSERT INTO assessments (id, name, timestamp, personal, lifestyle, medical, results) VALUES (%s, %s, %s, %s, %s, %s, %s)",
                (
                    assess_id,
                    name,
                    timestamp_str,
                    json.dumps(personal_info),
                    json.dumps(lifestyle_info),
                    json.dumps(medical_info),
                    json.dumps(results)
                )
            )
            print(f"Saved assessment {assess_id} to database successfully.")
        except Exception as db_err:
            print(f"Failed to write to database: {db_err}")
            # Do not throw, return results anyway (acts as soft fallback)
            
        # Append database specific attributes for frontend
        results_with_metadata = results.copy()
        results_with_metadata['id'] = assess_id
        results_with_metadata['name'] = name
        results_with_metadata['timestamp'] = timestamp_str
        results_with_metadata['personal'] = personal_info
        results_with_metadata['lifestyle'] = lifestyle_info
        results_with_metadata['medical'] = medical_info
        
        return jsonify(results_with_metadata)
        
    except Exception as e:
        print(f"Error during prediction: {e}")
        return jsonify({'error': str(e)}), 500

def hash_password(password):
    salt = "healthrisk-ai-salt-2026"
    return hashlib.sha256((password + salt).encode()).hexdigest()

@app.route('/api/register', methods=['POST'])
def register():
    try:
        data = request.json or {}
        username = data.get('username')
        password = data.get('password')
        name = data.get('name')
        
        if not username or not password or not name:
            return jsonify({'error': 'Name, username, and password are required'}), 400
            
        username = username.strip()
        name = name.strip()
        
        if len(name) < 2:
            return jsonify({'error': 'Name must be at least 2 characters long'}), 400
        if len(username) < 3:
            return jsonify({'error': 'Username must be at least 3 characters long'}), 400
        if len(password) < 6:
            return jsonify({'error': 'Password must be at least 6 characters long'}), 400
            
        # Check if user already exists (case-insensitive)
        if username.lower() == ADMIN_USERNAME.lower():
            return jsonify({'error': 'Username already exists'}), 400
            
        existing_user = db_fetchone("SELECT * FROM users WHERE LOWER(username) = LOWER(%s)", (username,))
        if existing_user:
            return jsonify({'error': 'Username already exists'}), 400
            
        # Insert user
        password_hash = hash_password(password)
        db_execute("INSERT INTO users (username, password_hash, name) VALUES (%s, %s, %s)", (username, password_hash, name))
        
        # Return success with token
        token = generate_token(username)
        return jsonify({
            'success': True,
            'token': token,
            'message': 'Registration successful'
        })
    except Exception as e:
        print(f"Error during registration: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/login', methods=['POST'])
def login():
    try:
        data = request.json or {}
        username = data.get('username')
        password = data.get('password')
        
        if not username or not password:
            return jsonify({'error': 'Username and password are required'}), 400
            
        username = username.strip()
        
        # Hardcoded fallback admin check
        if username.lower() == ADMIN_USERNAME.lower() and password == ADMIN_PASSWORD:
            token = generate_token(ADMIN_USERNAME)
            return jsonify({
                'success': True,
                'token': token,
                'message': 'Login successful'
            })
            
        # Check database
        user = db_fetchone("SELECT * FROM users WHERE LOWER(username) = LOWER(%s)", (username,))
        if user:
            password_hash = hash_password(password)
            if user['password_hash'] == password_hash:
                token = generate_token(user['username'])
                return jsonify({
                    'success': True,
                    'token': token,
                    'message': 'Login successful'
                })
                
        return jsonify({'error': 'Invalid username or password'}), 401
    except Exception as e:
        print(f"Error during login: {e}")
        return jsonify({'error': str(e)}), 500

def get_auth_username():
    auth_header = request.headers.get('Authorization')
    if auth_header:
        parts = auth_header.split()
        if len(parts) == 2:
            token = parts[1]
            return token.split(':')[0]
    return None

@app.route('/api/user/profile', methods=['GET'])
@requires_auth
def get_user_profile():
    try:
        username = get_auth_username()
        if username == ADMIN_USERNAME:
            return jsonify({
                'username': ADMIN_USERNAME,
                'name': 'System Administrator',
                'created_at': 'System Default'
            })
        
        user = db_fetchone("SELECT username, name, created_at FROM users WHERE username = %s", (username,))
        if not user:
            return jsonify({'error': 'User not found'}), 404
        return jsonify(user)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/user/profile', methods=['PUT'])
@requires_auth
def update_user_profile():
    try:
        username = get_auth_username()
        if username == ADMIN_USERNAME:
            return jsonify({'error': 'Cannot update system administrator profile'}), 400
            
        data = request.json or {}
        new_name = data.get('name')
        if not new_name or len(new_name.strip()) < 2:
            return jsonify({'error': 'Name must be at least 2 characters long'}), 400
            
        db_execute("UPDATE users SET name = %s WHERE username = %s", (new_name.strip(), username))
        return jsonify({'success': True, 'message': 'Profile updated successfully', 'name': new_name.strip()})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/user/password', methods=['PUT'])
@requires_auth
def update_user_password():
    try:
        username = get_auth_username()
        if username == ADMIN_USERNAME:
            return jsonify({'error': 'Cannot update system administrator password'}), 400
            
        data = request.json or {}
        current_password = data.get('current_password')
        new_password = data.get('new_password')
        
        if not current_password or not new_password:
            return jsonify({'error': 'Current and new password are required'}), 400
        if len(new_password) < 6:
            return jsonify({'error': 'New password must be at least 6 characters long'}), 400
            
        # Verify current password
        user = db_fetchone("SELECT * FROM users WHERE username = %s", (username,))
        if not user or user['password_hash'] != hash_password(current_password):
            return jsonify({'error': 'Incorrect current password'}), 401
            
        # Update password
        new_hash = hash_password(new_password)
        db_execute("UPDATE users SET password_hash = %s WHERE username = %s", (new_hash, username))
        return jsonify({'success': True, 'message': 'Password updated successfully'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/user/account', methods=['DELETE'])
@requires_auth
def delete_user_account():
    try:
        username = get_auth_username()
        if username == ADMIN_USERNAME:
            return jsonify({'error': 'Cannot delete system administrator account'}), 400
            
        db_execute("DELETE FROM users WHERE username = %s", (username,))
        return jsonify({'success': True, 'message': 'Account deleted successfully'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/assessments', methods=['GET'])
@requires_auth
def get_assessments():
    try:
        records = db_fetchall("SELECT * FROM assessments ORDER BY timestamp DESC")
        
        # Deserialize JSON database fields
        for r in records:
            r['personal'] = json.loads(r['personal']) if isinstance(r['personal'], str) else r['personal']
            r['lifestyle'] = json.loads(r['lifestyle']) if isinstance(r['lifestyle'], str) else r['lifestyle']
            r['medical'] = json.loads(r['medical']) if isinstance(r['medical'], str) else r['medical']
            r['results'] = json.loads(r['results']) if isinstance(r['results'], str) else r['results']
            
            # Reconstruct direct results keys for history list convenience
            r['results']['id'] = r['id']
            r['results']['name'] = r['name']
            r['results']['timestamp'] = r['timestamp']
            r['results']['personal'] = r['personal']
            r['results']['lifestyle'] = r['lifestyle']
            r['results']['medical'] = r['medical']
            
        return jsonify(records)
    except Exception as e:
        print(f"Error retrieving database logs: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/assessments/<id>', methods=['DELETE'])
@requires_auth
def delete_assessment(id):
    try:
        db_execute("DELETE FROM assessments WHERE id = %s", (id,))
        return jsonify({'success': True, 'message': f'Record {id} successfully deleted from database.'})
    except Exception as e:
        print(f"Error deleting record {id} from database: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/metrics', methods=['GET'])
@requires_auth
def get_metrics():
    metrics_path = "models/model_metrics.json"
    if os.path.exists(metrics_path):
        try:
            with open(metrics_path, "r") as f:
                metrics_data = json.load(f)
            return jsonify(metrics_data)
        except Exception as e:
            return jsonify({'error': f'Failed to read metrics: {e}'}), 500
    else:
        return jsonify({'error': 'Model metrics file not found. Please train models first.'}), 404

@app.route('/api/retrain', methods=['POST'])
@requires_auth
def retrain():
    try:
        print("Received retraining request. Executing train_models.py...")
        result = subprocess.run(["python", "train_models.py"], capture_output=True, text=True, check=True)
        print("Retraining completed successfully.")
        
        load_ml_assets()
        
        metrics_path = "models/model_metrics.json"
        if os.path.exists(metrics_path):
            with open(metrics_path, "r") as f:
                metrics_data = json.load(f)
            return jsonify({
                'success': True,
                'message': 'Models retrained and reloaded successfully.',
                'metrics': metrics_data
            })
        else:
            return jsonify({'success': True, 'message': 'Models retrained but metrics file not found.'})
            
    except subprocess.CalledProcessError as e:
        print(f"Retraining script failed: {e.stderr}")
        return jsonify({'error': f'Training script execution failed: {e.stderr}'}), 500
    except Exception as e:
        print(f"Retraining error: {e}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    print("Starting Flask Backend Server...")
    app.run(host='0.0.0.0', port=5000, debug=True)
