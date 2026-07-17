import React, { useState, useEffect, useMemo } from 'react';
import { 
  Activity, LayoutDashboard, HeartPulse, ClipboardList, TrendingUp, Cpu, 
  Moon, Sun, Menu, X, ArrowRight, ArrowLeft, Droplet, Heart, ShieldAlert, 
  Sparkles, Stethoscope, AlertOctagon, ChevronDown, ChevronUp, Search, 
  Trash2, Eye, Printer, PlusCircle, Inbox, AlertCircle, Info, CheckCircle, AlertTriangle, User, Settings, Lock, LogOut
} from 'lucide-react';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, 
  BarElement, RadialLinearScale, Title, Tooltip, Legend, Filler
} from 'chart.js';
import { Line, Radar, Bar } from 'react-chartjs-2';

// Register ChartJS modules
ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement, BarElement, 
  RadialLinearScale, Title, Tooltip, Legend, Filler
);

// Baseline Demo Clinical Profiles
const MOCK_PROFILES = [
  {
    id: "mock-1",
    name: "John Doe",
    timestamp: "2026-07-01T10:30:00Z",
    personal: { name: "John Doe", age: 58, gender: "male", height: 175, weight: 88, bmi: 28.7 },
    lifestyle: { smoking: "yes", alcohol: "high", physicalActivity: "sedentary", sleepDuration: 5.5 },
    medical: { bpSystolic: 145, bpDiastolic: 92, cholesterol: 242, glucose: 112, insulin: 16, heartRate: 82 },
    results: {
      risks: { diabetes: 58, heartDisease: 84, kidneyDisease: 62, liverDisease: 78 },
      overallScore: 41,
      confidence: 91,
      recommendations: {
        immediate: [
          "Consult a doctor regarding high blood pressure (145/92 mmHg) and high cholesterol (242 mg/dL).",
          "Schedule a liver function assessment due to heavy alcohol usage and overweight BMI status."
        ],
        lifestyle: [
          "Seek professional support to stop smoking.",
          "Limit alcohol intake to a maximum of 1-2 standard drinks per week, or abstain completely.",
          "Strive for 7-8 hours of sleep per night to support metabolic health.",
          "Incorporate 30 minutes of low-impact physical activity (like walking) 5 days a week."
        ],
        medical: [
          "Set up daily home blood pressure monitoring.",
          "Review cholesterol management options (dietary changes or statins) with a primary care provider."
        ]
      },
      explanations: {
        diabetes: [
          "Elevated fasting glucose of 112 mg/dL exceeds normal limit (<100 mg/dL).",
          "Elevated BMI of 28.7 kg/m² indicates overweight.",
          "Sedentary lifestyle factor limits insulin sensitivity."
        ],
        heart: [
          "Hypertension of 145/92 mmHg increases cardiac arterial strain.",
          "Active smoking is a primary cardiovascular risk factor.",
          "Cholesterol of 242 mg/dL is elevated."
        ],
        kidney: [
          "Hypertension of 145/92 mmHg damages renal filtration capillaries.",
          "Glucose of 112 mg/dL increases kidney workload."
        ],
        liver: [
          "Heavy alcohol consumption increases liver toxicity risk.",
          "Elevated BMI of 28.7 kg/m² contributes to NAFLD risk."
        ]
      }
    }
  },
  {
    id: "mock-2",
    name: "Jane Smith",
    timestamp: "2026-07-03T14:15:00Z",
    personal: { name: "Jane Smith", age: 29, gender: "female", height: 168, weight: 58, bmi: 20.6 },
    lifestyle: { smoking: "no", alcohol: "low", physicalActivity: "active", sleepDuration: 8.0 },
    medical: { bpSystolic: 115, bpDiastolic: 75, cholesterol: 175, glucose: 82, insulin: 8, heartRate: 64 },
    results: {
      risks: { diabetes: 12, heartDisease: 8, kidneyDisease: 10, liverDisease: 11 },
      overallScore: 94,
      confidence: 95,
      recommendations: {
        immediate: [],
        lifestyle: [
          "Maintain your current physical activity levels. Excellent job!",
          "Continue healthy sleep habits (7-8 hours).",
          "Ensure balanced hydration and nutrition."
        ],
        medical: [
          "Continue with routine annual health screenings."
        ]
      },
      explanations: {
        diabetes: ["All parameters within standard limits."],
        heart: ["All parameters within standard limits."],
        kidney: ["All parameters within standard limits."],
        liver: ["All parameters within standard limits."]
      }
    }
  },
  {
    id: "mock-3",
    name: "Alex Rivera",
    timestamp: "2026-07-05T09:00:00Z",
    personal: { name: "Alex Rivera", age: 46, gender: "other", height: 180, weight: 102, bmi: 31.5 },
    lifestyle: { smoking: "no", alcohol: "moderate", physicalActivity: "moderate", sleepDuration: 6.5 },
    medical: { bpSystolic: 135, bpDiastolic: 85, cholesterol: 210, glucose: 145, insulin: 28, heartRate: 74 },
    results: {
      risks: { diabetes: 78, heartDisease: 55, kidneyDisease: 48, liverDisease: 52 },
      overallScore: 56,
      confidence: 89,
      recommendations: {
        immediate: [
          "Consult an endocrinologist regarding elevated fasting blood glucose (145 mg/dL) and insulin resistance markers."
        ],
        lifestyle: [
          "Focus on a low-glycemic, high-fiber diet to manage insulin sensitivity and blood glucose.",
          "Aim to reduce body weight by 5-10% through a combination of diet and increased exercise.",
          "Increase physical activity to 150+ minutes of moderate aerobic exercise per week."
        ],
        medical: [
          "Check HbA1c levels to confirm diabetes diagnosis and discuss potential therapeutic interventions.",
          "Monitor fasting glucose levels daily."
        ]
      },
      explanations: {
        diabetes: [
          "Fasting blood glucose of 145 mg/dL suggests diabetes range.",
          "Obese BMI of 31.5 kg/m² contributes to insulin resistance.",
          "Fasting insulin of 28 µIU/mL suggests insulin resistance."
        ],
        heart: [
          "Elevated BP of 135/85 mmHg increases cardiac workload.",
          "Cholesterol of 210 mg/dL is borderline high."
        ],
        kidney: [
          "Fasting glucose of 145 mg/dL adds microvascular kidney stress."
        ],
        liver: [
          "Obese BMI of 31.5 kg/m² increases NAFLD fatty liver risk.",
          "Moderate alcohol usage increases hepatic fat loads."
        ]
      }
    }
  }
];
export default function App() {
  // Application states
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [theme, setTheme] = useState('dark');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [assessments, setAssessments] = useState([]);
  const [activeUser, setActiveUser] = useState('');
  const [latestAssessment, setLatestAssessment] = useState(null);
  const [metrics, setMetrics] = useState(null);

  // Authentication states
  const [authToken, setAuthToken] = useState(() => sessionStorage.getItem('healthrisk_auth_token') || '');
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'
  const [registerName, setRegisterName] = useState('');
  const [registerUsername, setRegisterUsername] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState('');
  const [registerError, setRegisterError] = useState('');
  const [registerLoading, setRegisterLoading] = useState(false);
  
  // Account Management states
  const [userProfile, setUserProfile] = useState(null);
  const [profileName, setProfileName] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [profileMessage, setProfileMessage] = useState('');
  const [profileError, setProfileError] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  
  // Wizards Form States
  const [wizardStep, setWizardStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '', age: '35', gender: 'male', height: '170', weight: '70',
    smoking: 'no', alcohol: 'low', physicalActivity: 'moderate', sleepDuration: 7,
    bpSystolic: 120, bpDiastolic: 80, cholesterol: 180, glucose: 90, insulin: 8, heartRate: 70,
    algorithm: 'auto'
  });
  const [errors, setErrors] = useState({});
  const [predicting, setPredicting] = useState(false);
  const [retraining, setRetraining] = useState(false);

  // Result view page details target
  const [resultsAssessment, setResultsAssessment] = useState(null);
  const [expandedRisks, setExpandedRisks] = useState({ diabetes: false, heart: false, kidney: false, liver: false });

  // History Filter states
  const [historySearch, setHistorySearch] = useState('');
  const [historyFilter, setHistoryFilter] = useState('all');

  // Insights filter state
  const [insightsUser, setInsightsUser] = useState('');

  // Toast Notification state
  const [toasts, setToasts] = useState([]);

  // Toast Trigger Helper
  const showToast = (message, type = 'primary') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  // Sync Class Theme with Body
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      document.body.className = "bg-slate-950 text-slate-100 min-h-screen transition-colors duration-300";
    } else {
      root.classList.remove('dark');
      document.body.className = "bg-slate-50 text-slate-900 min-h-screen transition-colors duration-300";
    }
  }, [theme]);

  // Authentication Handlers
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');
    try {
      const res = await fetch("http://localhost:5000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: loginUsername, password: loginPassword })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        sessionStorage.setItem('healthrisk_auth_token', data.token);
        setAuthToken(data.token);
        showToast("Login successful!", "success");
        setLoginUsername('');
        setLoginPassword('');
      } else {
        setLoginError(data.error || "Invalid username or password");
        showToast(data.error || "Login failed", "danger");
      }
    } catch (err) {
      setLoginError("Cannot reach authentication server");
      showToast("Authentication server offline", "danger");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setRegisterLoading(true);
    setRegisterError('');
    
    if (registerPassword !== registerConfirmPassword) {
      setRegisterError("Passwords do not match");
      showToast("Passwords do not match", "danger");
      setRegisterLoading(false);
      return;
    }
    
    try {
      const res = await fetch("http://localhost:5000/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: registerName, username: registerUsername, password: registerPassword })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        sessionStorage.setItem('healthrisk_auth_token', data.token);
        setAuthToken(data.token);
        showToast("Registration successful!", "success");
        setRegisterName('');
        setRegisterUsername('');
        setRegisterPassword('');
        setRegisterConfirmPassword('');
      } else {
        setRegisterError(data.error || "Registration failed");
        showToast(data.error || "Registration failed", "danger");
      }
    } catch (err) {
      setRegisterError("Cannot reach authentication server");
      showToast("Authentication server offline", "danger");
    } finally {
      setRegisterLoading(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('healthrisk_auth_token');
    setAuthToken('');
    setAssessments([]);
    setMetrics(null);
    showToast("Logged out successfully.", "warning");
  };

  // Load assessments & metrics from API
  const fetchAssessments = async () => {
    if (!authToken) return;
    try {
      const res = await fetch("http://localhost:5000/api/assessments", {
        headers: { "Authorization": `Bearer ${authToken}` }
      });
      if (res.status === 401) {
        handleLogout();
        throw new Error("Session expired. Please log in again.");
      }
      if (!res.ok) throw new Error("Flask database API unreachable");
      const data = await res.json();
      
      const loadedData = data.map(item => ({
        id: item.id,
        name: item.name,
        timestamp: item.timestamp,
        personal: item.personal,
        lifestyle: item.lifestyle,
        medical: item.medical,
        results: item.results
      }));
      
      setAssessments(loadedData);
      
      if (loadedData.length > 0) {
        const latest = loadedData[0];
        setLatestAssessment(latest);
        setActiveUser(latest.name);
        setInsightsUser(latest.name);
      }
    } catch (err) {
      console.warn("Could not load from MySQL database.", err);
      showToast(err.message || "Failed to load database assessments.", "danger");
    }
  };

  const fetchMetrics = async () => {
    if (!authToken) return;
    try {
      const res = await fetch("http://localhost:5000/api/metrics", {
        headers: { "Authorization": `Bearer ${authToken}` }
      });
      if (res.status === 401) {
        handleLogout();
        return;
      }
      if (!res.ok) throw new Error("API failed");
      const data = await res.json();
      setMetrics(data);
    } catch (err) {
      console.warn("Could not retrieve model metrics:", err);
    }
  };

  const fetchUserProfile = async () => {
    if (!authToken) return;
    try {
      const res = await fetch("http://localhost:5000/api/user/profile", {
        headers: { "Authorization": `Bearer ${authToken}` }
      });
      if (res.status === 401) {
        handleLogout();
        return;
      }
      if (!res.ok) throw new Error("Failed to load user profile");
      const data = await res.json();
      setUserProfile(data);
      setProfileName(data.name || '');
    } catch (err) {
      console.warn("Could not retrieve user profile:", err);
    }
  };

  const handleUpdateProfileName = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileMessage('');
    setProfileError('');
    try {
      const res = await fetch("http://localhost:5000/api/user/profile", {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authToken}`
        },
        body: JSON.stringify({ name: profileName })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setProfileMessage("Full name updated successfully.");
        showToast("Profile updated successfully.", "success");
        setUserProfile(prev => ({ ...prev, name: data.name }));
        setActiveUser(data.name);
      } else {
        setProfileError(data.error || "Failed to update profile.");
        showToast(data.error || "Profile update failed.", "danger");
      }
    } catch (err) {
      setProfileError("Cannot reach authentication server");
      showToast("Server unreachable", "danger");
    } finally {
      setProfileLoading(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setPasswordMessage('');
    setPasswordError('');
    
    if (newPassword !== confirmNewPassword) {
      setPasswordError("New passwords do not match");
      showToast("Passwords do not match", "danger");
      return;
    }
    
    try {
      const res = await fetch("http://localhost:5000/api/user/password", {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authToken}`
        },
        body: JSON.stringify({ 
          current_password: currentPassword, 
          new_password: newPassword 
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPasswordMessage("Password updated successfully.");
        showToast("Password updated successfully.", "success");
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
      } else {
        setPasswordError(data.error || "Failed to change password.");
        showToast(data.error || "Password update failed.", "danger");
      }
    } catch (err) {
      setPasswordError("Cannot reach authentication server");
      showToast("Server unreachable", "danger");
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm("ARE YOU SURE? This will permanently delete your account and log you out. This action cannot be undone.")) {
      return;
    }
    try {
      const res = await fetch("http://localhost:5000/api/user/account", {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${authToken}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast("Account deleted successfully.", "warning");
        handleLogout();
      } else {
        showToast(data.error || "Failed to delete account.", "danger");
      }
    } catch (err) {
      showToast("Server unreachable", "danger");
    }
  };

  useEffect(() => {
    if (authToken) {
      fetchAssessments();
      fetchMetrics();
      fetchUserProfile();
    } else {
      setAssessments([]);
      setMetrics(null);
      setUserProfile(null);
    }
  }, [authToken]);

  // Protected Tab Wrapper Component / Helper
  const renderProtectedTab = (component) => {
    if (!authToken) {
      return (
        <div className="max-w-[480px] mx-auto my-12 bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-2xl animate-fade-in backdrop-blur-md">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-16 h-16 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-2xl flex items-center justify-center mb-4 filter drop-shadow-[0_0_12px_rgba(99,102,241,0.25)]">
              <ClipboardList className="w-8 h-8" />
            </div>
            <h3 className="font-extrabold text-2xl text-slate-900 dark:text-slate-100">Database Access Portal</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-sm">Enter administrator credentials to view patient assessment records, clinical vitals metrics, and retrain ML studio models.</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-5">
            {loginError && (
              <div className="bg-rose-500/10 border border-rose-500/25 text-rose-400 rounded-xl p-3 text-xs font-semibold flex items-center gap-2 animate-pulse">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}
            
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Username</label>
              <input 
                type="text" 
                value={loginUsername}
                onChange={e => setLoginUsername(e.target.value)}
                placeholder="e.g. admin"
                required
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/25 rounded-xl outline-none text-sm font-semibold text-slate-800 dark:text-slate-200 transition"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Password</label>
              <input 
                type="password" 
                value={loginPassword}
                onChange={e => setLoginPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/25 rounded-xl outline-none text-sm font-semibold text-slate-800 dark:text-slate-200 transition"
              />
            </div>

            <button 
              type="submit" 
              disabled={loginLoading}
              className="w-full mt-2 btn bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white py-3 rounded-xl font-bold text-sm inline-flex items-center justify-center gap-2 cursor-pointer transition shadow-lg shadow-indigo-600/20"
            >
              {loginLoading ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin"></div>
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>Access Database Log</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      );
    }
    return component;
  };


  // Update latest assessment context for selected active user
  useEffect(() => {
    if (activeUser && assessments.length > 0) {
      const matched = assessments.find(a => a.name === activeUser);
      if (matched) {
        setLatestAssessment(matched);
      }
    }
  }, [activeUser, assessments]);

  // BMI Dynamic Calculation
  const calculatedBMI = useMemo(() => {
    const w = parseFloat(formData.weight);
    const h = parseFloat(formData.height);
    if (w > 0 && h > 0) {
      const hM = h / 100;
      return (w / (hM * hM)).toFixed(1);
    }
    return null;
  }, [formData.height, formData.weight]);

  const bmiDetails = useMemo(() => {
    const bmiVal = parseFloat(calculatedBMI);
    if (!bmiVal) return { text: 'Pending inputs', color: 'text-slate-400 bg-slate-500/10 border-slate-500/20' };
    if (bmiVal < 18.5) return { text: 'Underweight', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' };
    if (bmiVal < 25) return { text: 'Normal BMI', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' };
    if (bmiVal < 30) return { text: 'Overweight', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' };
    return { text: 'Obese', color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' };
  }, [calculatedBMI]);

  // Form step-by-step validations
  const validateStep = (step) => {
    const newErrors = {};
    if (step === 1) {
      if (!formData.name.trim()) newErrors.name = "Patient full name is required.";
      const age = parseInt(formData.age);
      if (isNaN(age) || age < 1 || age > 120) newErrors.age = "Enter a valid age (1-120).";
      const height = parseFloat(formData.height);
      if (isNaN(height) || height < 100 || height > 250) newErrors.height = "Enter a valid height (100-250 cm).";
      const weight = parseFloat(formData.weight);
      if (isNaN(weight) || weight < 30 || weight > 250) newErrors.weight = "Enter a valid weight (30-250 kg).";
    }
    if (step === 3) {
      const fields = [
        { key: 'bpSystolic', min: 80, max: 220, label: 'Systolic BP' },
        { key: 'bpDiastolic', min: 50, max: 130, label: 'Diastolic BP' },
        { key: 'cholesterol', min: 100, max: 400, label: 'Cholesterol' },
        { key: 'glucose', min: 50, max: 300, label: 'Glucose' },
        { key: 'insulin', min: 2, max: 60, label: 'Insulin' },
        { key: 'heartRate', min: 40, max: 150, label: 'Heart Rate' }
      ];
      fields.forEach(f => {
        const val = parseFloat(formData[f.key]);
        if (isNaN(val) || val < f.min || val > f.max) {
          newErrors[f.key] = `${f.label} must be between ${f.min} and ${f.max}.`;
        }
      });
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    if (validateStep(wizardStep)) {
      if (wizardStep < 3) {
        setWizardStep(prev => prev + 1);
      } else {
        submitAssessment();
      }
    } else {
      showToast("Fix the validation errors before moving on.", "danger");
    }
  };

  // Submit assessment to Flask with ML calculations
  const submitAssessment = async () => {
    setPredicting(true);
    
    // Auto calculated BMI
    const finalBMI = parseFloat(calculatedBMI) || 22.0;
    
    const payload = {
      name: formData.name,
      age: parseInt(formData.age),
      gender: formData.gender,
      height: parseFloat(formData.height),
      weight: parseFloat(formData.weight),
      smoking: formData.smoking,
      alcohol: formData.alcohol,
      physicalActivity: formData.physicalActivity,
      sleepDuration: parseFloat(formData.sleepDuration),
      bpSystolic: parseInt(formData.bpSystolic),
      bpDiastolic: parseInt(formData.bpDiastolic),
      cholesterol: parseInt(formData.cholesterol),
      glucose: parseInt(formData.glucose),
      insulin: parseInt(formData.insulin),
      heartRate: parseInt(formData.heartRate),
      algorithm: formData.algorithm
    };

    try {
      showToast("Analyzing metrics using Machine Learning...", "primary");
      const res = await fetch("http://localhost:5000/api/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) throw new Error(`Predict API returned: ${res.status}`);
      
      const resultsData = await res.json();
      console.log("Flask ML Response:", resultsData);
      
      const newRecord = {
        id: resultsData.id,
        name: resultsData.name,
        timestamp: resultsData.timestamp,
        personal: resultsData.personal,
        lifestyle: resultsData.lifestyle,
        medical: resultsData.medical,
        results: {
          risks: resultsData.risks,
          overallScore: resultsData.overallScore,
          confidence: resultsData.confidence,
          recommendations: resultsData.recommendations,
          explanations: resultsData.explanations
        }
      };
      
      // Update local state list
      setAssessments(prev => [newRecord, ...prev]);
      setResultsAssessment(newRecord);
      setActiveUser(resultsData.name);
      setInsightsUser(resultsData.name);
      
      showToast("ML prediction successfully generated!", "success");
      setCurrentTab('results');
      
    } catch (err) {
      console.warn("Could not connect to ML backend server, executing local diagnostics engine fallback:", err);
      showToast("ML server offline. Falling back to local clinical rules.", "warning");
      
      // Run local Javascript scoring fallback
      const localResult = computeHeuristicFallback(payload, finalBMI);
      const mockId = `assess-fallback-${Date.now()}`;
      const mockTime = new Date().toISOString();
      
      const newRecord = {
        id: mockId,
        name: payload.name,
        timestamp: mockTime,
        personal: { name: payload.name, age: payload.age, gender: payload.gender, height: payload.height, weight: payload.weight, bmi: finalBMI },
        lifestyle: { smoking: payload.smoking, alcohol: payload.alcohol, physicalActivity: payload.physicalActivity, sleepDuration: payload.sleepDuration },
        medical: { bpSystolic: payload.bpSystolic, bpDiastolic: payload.bpDiastolic, cholesterol: payload.cholesterol, glucose: payload.glucose, insulin: payload.insulin, heartRate: payload.heartRate },
        results: localResult
      };
      
      setAssessments(prev => [newRecord, ...prev]);
      setResultsAssessment(newRecord);
      setActiveUser(payload.name);
      setInsightsUser(payload.name);
      
      setCurrentTab('results');
    } finally {
      setPredicting(false);
    }
  };

  // Local heuristics calculations engine fallback
  const computeHeuristicFallback = (data, bmi) => {
    const explanations = { diabetes: [], heart: [], kidney: [], liver: [] };
    let dRisk = 5, hRisk = 5, kRisk = 5, lRisk = 5;
    
    // Diabetes
    if (data.glucose > 100) {
      const c = Math.min(50, (data.glucose - 100) * 0.4);
      dRisk += c;
      explanations.diabetes.push(`Elevated glucose of ${data.glucose} mg/dL (+${Math.round(c)}% risk).`);
    }
    if (bmi >= 25) {
      const c = Math.min(25, (bmi - 25) * 1.5);
      dRisk += c;
      explanations.diabetes.push(`Elevated BMI of ${bmi} (+${Math.round(c)}% risk).`);
    }
    if (data.insulin > 15) {
      const c = Math.min(20, (data.insulin - 15) * 0.8);
      dRisk += c;
      explanations.diabetes.push(`Fasting insulin of ${data.insulin} µIU/mL (+${Math.round(c)}% risk).`);
    }
    if (data.age > 45) {
      dRisk += (data.age - 45) * 0.5;
      explanations.diabetes.push(`Age over 45 increases metabolic baseline.`);
    }
    if (data.physicalActivity === 'sedentary') dRisk += 10;
    
    // Heart
    const bpSysDiff = Math.max(0, data.bpSystolic - 120);
    const bpDiaDiff = Math.max(0, data.bpDiastolic - 80);
    if (bpSysDiff > 0 || bpDiaDiff > 0) {
      const c = Math.min(45, (bpSysDiff * 0.6) + (bpDiaDiff * 0.8));
      hRisk += c;
      explanations.heart.push(`Hypertension of ${data.bpSystolic}/${data.bpDiastolic} mmHg (+${Math.round(c)}% risk).`);
    }
    if (data.cholesterol > 200) {
      const c = Math.min(30, (data.cholesterol - 200) * 0.25);
      hRisk += c;
      explanations.heart.push(`Cholesterol of ${data.cholesterol} mg/dL (+${Math.round(c)}% risk).`);
    }
    if (data.smoking === 'yes') {
      hRisk += 25;
      explanations.heart.push("Active smoking factor (+25% risk).");
    }
    
    // Kidney
    if (data.bpSystolic > 130) {
      kRisk += 15 + (data.bpSystolic - 130) * 0.5;
      explanations.kidney.push("High systolic BP strains renal vasculature.");
    }
    if (data.glucose > 100) {
      kRisk += 15 + (data.glucose - 100) * 0.3;
      explanations.kidney.push("High glucose adds microvascular renal load.");
    }
    
    // Liver
    if (data.alcohol === 'high') {
      lRisk += 40;
      explanations.liver.push("Heavy alcohol intake increases liver cell toxicity.");
    } else if (data.alcohol === 'moderate') {
      lRisk += 15;
    }
    if (bmi >= 25) {
      lRisk += (bmi - 25) * 1.5;
      explanations.liver.push("Overweight status increases liver fat risk.");
    }

    const risks = {
      diabetes: Math.min(95, Math.max(5, Math.round(dRisk))),
      heartDisease: Math.min(95, Math.max(5, Math.round(hRisk))),
      kidneyDisease: Math.min(95, Math.max(5, Math.round(kRisk))),
      liverDisease: Math.min(95, Math.max(5, Math.round(lRisk)))
    };

    // Calculate score
    let score = 100;
    if (bmi >= 30) score -= 15;
    if (data.bpSystolic >= 140) score -= 15;
    if (data.glucose >= 126) score -= 18;
    if (data.smoking === 'yes') score -= 15;
    score = Math.max(15, score);

    // Default explanations
    Object.keys(explanations).forEach(k => {
      if (explanations[k].length === 0) explanations[k].push("All indicators normal.");
    });

    return {
      risks,
      overallScore: score,
      confidence: 88,
      recommendations: {
        immediate: data.bpSystolic >= 150 ? ["Schedule checkup for high BP."] : [],
        lifestyle: data.smoking === 'yes' ? ["Start smoking cessation program."] : ["Maintain healthy activity levels."],
        medical: ["Schedule standard yearly screenings."]
      },
      explanations
    };
  };

  // Trigger retraining pipeline
  const handleRetrain = async () => {
    setRetraining(true);
    try {
      showToast("Training ML pipeline for 20 models...", "primary");
      const res = await fetch("http://localhost:5000/api/retrain", {
        method: "POST",
        headers: { "Authorization": `Bearer ${authToken}` }
      });
      if (res.status === 401) {
        handleLogout();
        throw new Error("Session expired. Please log in again.");
      }
      if (!res.ok) throw new Error("Retrain call failed");
      const data = await res.json();
      if (data.success) {
        showToast("Model training successfully completed!", "success");
        setMetrics(data.metrics);
      }
    } catch (err) {
      console.error(err);
      showToast(err.message || "Model retraining failed. Check server logs.", "danger");
    } finally {
      setRetraining(false);
    }
  };

  // Delete Assessment
  const handleDeleteAssessment = async (id) => {
    if (window.confirm("Are you sure you want to permanently delete this health assessment record?")) {
      try {
        const res = await fetch(`http://localhost:5000/api/assessments/${id}`, {
          method: 'DELETE',
          headers: { "Authorization": `Bearer ${authToken}` }
        });
        if (res.status === 401) {
          handleLogout();
          throw new Error("Session expired. Please log in again.");
        }
        if (!res.ok) throw new Error("Delete failed on API server");
        showToast("Record deleted successfully.", "warning");
      } catch (err) {
        console.warn("Delete request on backend failed. Removing from local state.", err);
        showToast(err.message || "Record removed from local history list.", "warning");
      }
      
      // Update local state list
      const updated = assessments.filter(a => a.id !== id);
      setAssessments(updated);
      
      if (updated.length > 0) {
        const stillHasActive = updated.some(a => a.name === activeUser);
        if (!stillHasActive) {
          setActiveUser(updated[0].name);
          setInsightsUser(updated[0].name);
        }
      } else {
        setActiveUser('');
        setLatestAssessment(null);
      }
    }
  };

  // Reset Wizards Form
  const resetWizard = () => {
    setWizardStep(1);
    setFormData({
      name: '', age: '35', gender: 'male', height: '170', weight: '70',
      smoking: 'no', alcohol: 'low', physicalActivity: 'moderate', sleepDuration: 7,
      bpSystolic: 120, bpDiastolic: 80, cholesterol: 180, glucose: 90, insulin: 8, heartRate: 70,
      algorithm: 'auto'
    });
    setErrors({});
  };

  // Filter History Lists
  const filteredAssessments = useMemo(() => {
    return assessments.filter(a => {
      const matchesSearch = a.name.toLowerCase().includes(historySearch.toLowerCase());
      if (historyFilter === 'all') return matchesSearch;
      
      const maxRisk = Math.max(a.results.risks.diabetes, a.results.risks.heartDisease, a.results.risks.kidneyDisease, a.results.risks.liverDisease);
      if (historyFilter === 'high') return matchesSearch && maxRisk >= 70;
      if (historyFilter === 'medium') return matchesSearch && maxRisk >= 35 && maxRisk < 70;
      if (historyFilter === 'low') return matchesSearch && maxRisk < 35;
      return matchesSearch;
    });
  }, [assessments, historySearch, historyFilter]);

  // Insights timeline sorting
  const insightsTimelineData = useMemo(() => {
    if (!insightsUser) return [];
    return assessments
      .filter(a => a.name === insightsUser)
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  }, [assessments, insightsUser]);

  // Chart Rendering data maps
  const overviewRadarData = useMemo(() => {
    if (!latestAssessment) return null;
    return {
      labels: ['Diabetes', 'Heart Disease', 'Kidney Disease', 'Liver Disease'],
      datasets: [{
        label: 'Risk Likelihood (%)',
        data: [
          latestAssessment.results.risks.diabetes,
          latestAssessment.results.risks.heartDisease,
          latestAssessment.results.risks.kidneyDisease,
          latestAssessment.results.risks.liverDisease
        ],
        backgroundColor: 'rgba(99, 102, 241, 0.2)',
        borderColor: 'rgba(99, 102, 241, 0.8)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(99, 102, 241, 1)',
        pointBorderColor: '#fff',
      }]
    };
  }, [latestAssessment]);

  const overviewTrendData = useMemo(() => {
    if (!activeUser) return null;
    const history = assessments
      .filter(a => a.name === activeUser)
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      
    return {
      labels: history.map(h => {
        const d = new Date(h.timestamp);
        return `${d.getMonth() + 1}/${d.getDate()}`;
      }),
      datasets: [{
        label: 'Overall Health Score',
        data: history.map(h => h.results.overallScore),
        borderColor: 'rgba(16, 185, 129, 0.85)',
        backgroundColor: 'rgba(16, 185, 129, 0.05)',
        fill: true,
        tension: 0.35,
        borderWidth: 3,
        pointRadius: 4,
        pointBackgroundColor: 'rgba(16, 185, 129, 1)'
      }]
    };
  }, [activeUser, assessments]);

  // Insights Score Progress Data
  const insightsScoreTrendData = useMemo(() => {
    return {
      labels: insightsTimelineData.map(h => {
        const d = new Date(h.timestamp);
        return `${d.getMonth() + 1}/${d.getDate()}`;
      }),
      datasets: [{
        label: 'Overall Health Score',
        data: insightsTimelineData.map(h => h.results.overallScore),
        borderColor: 'rgba(99, 102, 241, 0.9)',
        backgroundColor: 'rgba(99, 102, 241, 0.05)',
        fill: true,
        tension: 0.3,
        borderWidth: 3,
        pointBackgroundColor: 'rgba(99, 102, 241, 1)'
      }]
    };
  }, [insightsTimelineData]);

  // Insights Vitals Timeline Data
  const insightsVitalsData = useMemo(() => {
    return {
      labels: insightsTimelineData.map(h => {
        const d = new Date(h.timestamp);
        return `${d.getMonth() + 1}/${d.getDate()}`;
      }),
      datasets: [
        {
          label: 'Glucose (mg/dL)',
          data: insightsTimelineData.map(h => h.medical.glucose),
          borderColor: 'rgba(245, 158, 11, 0.9)',
          backgroundColor: 'transparent',
          borderWidth: 2,
          pointRadius: 3
        },
        {
          label: 'Systolic BP (mmHg)',
          data: insightsTimelineData.map(h => h.medical.bpSystolic),
          borderColor: 'rgba(239, 68, 68, 0.9)',
          backgroundColor: 'transparent',
          borderWidth: 2,
          pointRadius: 3
        },
        {
          label: 'Diastolic BP (mmHg)',
          data: insightsTimelineData.map(h => h.medical.bpDiastolic),
          borderColor: 'rgba(59, 130, 246, 0.9)',
          backgroundColor: 'transparent',
          borderWidth: 2,
          pointRadius: 3
        }
      ]
    };
  }, [insightsTimelineData]);

  // ML Studio accuracy chart mappings
  const mlStudioAccuracyData = useMemo(() => {
    if (!metrics) return null;
    const targets = ['diabetes', 'heart_disease', 'kidney_disease', 'liver_disease'];
    const algsList = ['logistic_regression', 'decision_tree', 'random_forest', 'xgboost', 'svm'];
    const colors = {
      'logistic_regression': 'rgba(59, 130, 246, 0.8)',
      'decision_tree': 'rgba(239, 68, 68, 0.8)',
      'random_forest': 'rgba(16, 185, 129, 0.8)',
      'xgboost': 'rgba(245, 158, 11, 0.8)',
      'svm': 'rgba(139, 92, 246, 0.8)'
    };
    const algDisplay = { 'logistic_regression': 'LogReg', 'decision_tree': 'DecTree', 'random_forest': 'RandForest', 'xgboost': 'XGBoost', 'svm': 'SVM' };
    
    return {
      labels: ['Diabetes', 'Heart', 'Kidney', 'Liver'],
      datasets: algsList.map(alg => ({
        label: algDisplay[alg],
        data: targets.map(t => metrics[t] && metrics[t][alg] ? Math.round(metrics[t][alg]['accuracy'] * 100) : 0),
        backgroundColor: colors[alg],
        borderRadius: 4
      }))
    };
  }, [metrics]);

  const mlStudioF1Data = useMemo(() => {
    if (!metrics) return null;
    const targets = ['diabetes', 'heart_disease', 'kidney_disease', 'liver_disease'];
    const algsList = ['logistic_regression', 'decision_tree', 'random_forest', 'xgboost', 'svm'];
    const colors = {
      'logistic_regression': 'rgba(59, 130, 246, 0.8)',
      'decision_tree': 'rgba(239, 68, 68, 0.8)',
      'random_forest': 'rgba(16, 185, 129, 0.8)',
      'xgboost': 'rgba(245, 158, 11, 0.8)',
      'svm': 'rgba(139, 92, 246, 0.8)'
    };
    const algDisplay = { 'logistic_regression': 'LogReg', 'decision_tree': 'DecTree', 'random_forest': 'RandForest', 'xgboost': 'XGBoost', 'svm': 'SVM' };
    
    return {
      labels: ['Diabetes', 'Heart', 'Kidney', 'Liver'],
      datasets: algsList.map(alg => ({
        label: algDisplay[alg],
        data: targets.map(t => metrics[t] && metrics[t][alg] ? Math.round(metrics[t][alg]['f1_score'] * 100) : 0),
        backgroundColor: colors[alg],
        borderRadius: 4
      }))
    };
  }, [metrics]);

  // Aggregate stats logic for insights view
  const insightsAggregates = useMemo(() => {
    if (insightsTimelineData.length === 0) return { avg: '--', maxRisk: '--', advice: 'No assessments' };
    const avg = Math.round(insightsTimelineData.reduce((acc, val) => acc + val.results.overallScore, 0) / insightsTimelineData.length);
    
    const lastRec = insightsTimelineData[insightsTimelineData.length - 1];
    const maxRisk = Math.max(lastRec.results.risks.diabetes, lastRec.results.risks.heartDisease, lastRec.results.risks.kidneyDisease, lastRec.results.risks.liverDisease);
    
    let advice = "Maintain screenings";
    if (maxRisk >= 70) advice = "Schedule clinical consult";
    else if (maxRisk >= 35) advice = "Adjust lifestyle parameters";
    
    return { avg, maxRisk, advice };
  }, [insightsTimelineData]);

  // Helpers to get styling classes dynamically based on score
  const getScoreBadgeStyles = (score) => {
    if (score >= 85) return { label: 'Optimal health', style: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', color: 'var(--success)' };
    if (score >= 70) return { label: 'Good health', style: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20', color: 'var(--primary)' };
    if (score >= 50) return { label: 'Moderate risks', style: 'bg-amber-500/10 text-amber-400 border-amber-500/20', color: 'var(--warning)' };
    return { label: 'High risks alert', style: 'bg-rose-500/10 text-rose-400 border-rose-500/20', color: 'var(--danger)' };
  };

  const getRiskLevelDetails = (val) => {
    if (val >= 70) return { label: 'High Risk', badge: 'bg-rose-500/10 text-rose-400 border-rose-500/20', bar: 'bg-rose-500' };
    if (val >= 35) return { label: 'Medium Risk', badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20', bar: 'bg-amber-500' };
    return { label: 'Low Risk', badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', bar: 'bg-emerald-500' };
  };

  const uniquePatients = useMemo(() => {
    return [...new Set(assessments.map(a => a.name))];
  }, [assessments]);

  if (!authToken) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 p-6 relative overflow-hidden text-slate-100">
        {/* Decorative ambient background spots */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="w-full max-w-[460px] bg-slate-900/60 border border-slate-800 rounded-3xl p-8 md:p-10 shadow-2xl backdrop-blur-md relative z-10 animate-fade-in">
          {/* Header */}
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-16 h-16 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-2xl flex items-center justify-center mb-4 filter drop-shadow-[0_0_12px_rgba(99,102,241,0.25)]">
              <Activity className="w-8 h-8" />
            </div>
            <h2 className="font-extrabold text-3xl text-white tracking-tight">HealthSenceAI</h2>
            <p className="text-sm text-slate-400 mt-2 max-w-sm">
              {authMode === 'login' 
                ? 'Sign in to access your clinical dashboard and models' 
                : 'Create an account to begin clinical assessments'}
            </p>
          </div>
          
          {authMode === 'login' ? (
            /* Login Form */
            <form onSubmit={handleLogin} className="space-y-5">
              {loginError && (
                <div className="bg-rose-500/10 border border-rose-500/25 text-rose-400 rounded-xl p-3 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}
              
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Username</label>
                <input 
                  type="text" 
                  value={loginUsername}
                  onChange={e => setLoginUsername(e.target.value)}
                  placeholder="Enter your username"
                  required
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/25 rounded-xl outline-none text-sm font-semibold text-slate-100 placeholder-slate-600 transition"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Password</label>
                <input 
                  type="password" 
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/25 rounded-xl outline-none text-sm font-semibold text-slate-100 placeholder-slate-600 transition"
                />
              </div>

              <button 
                type="submit" 
                disabled={loginLoading}
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-600/35 hover:shadow-indigo-600/50 cursor-pointer flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {loginLoading ? 'Signing in...' : 'Sign In'}
                <ArrowRight className="w-4 h-4" />
              </button>
              
              <div className="text-center pt-2">
                <p className="text-xs text-slate-400 font-semibold">
                  Don't have an account?{' '}
                  <button 
                    type="button"
                    onClick={() => { setAuthMode('register'); setLoginError(''); }}
                    className="text-indigo-400 hover:text-indigo-300 hover:underline cursor-pointer"
                  >
                    Register
                  </button>
                </p>
              </div>
            </form>
          ) : (
            /* Register Form */
            <form onSubmit={handleRegister} className="space-y-5">
              {registerError && (
                <div className="bg-rose-500/10 border border-rose-500/25 text-rose-400 rounded-xl p-3 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{registerError}</span>
                </div>
              )}
              
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Full Name</label>
                <input 
                  type="text" 
                  value={registerName}
                  onChange={e => setRegisterName(e.target.value)}
                  placeholder="e.g. Ayushman Kar"
                  required
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/25 rounded-xl outline-none text-sm font-semibold text-slate-100 placeholder-slate-600 transition"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Username</label>
                <input 
                  type="text" 
                  value={registerUsername}
                  onChange={e => setRegisterUsername(e.target.value)}
                  placeholder="Choose a username"
                  required
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/25 rounded-xl outline-none text-sm font-semibold text-slate-100 placeholder-slate-600 transition"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Password</label>
                <input 
                  type="password" 
                  value={registerPassword}
                  onChange={e => setRegisterPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  required
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/25 rounded-xl outline-none text-sm font-semibold text-slate-100 placeholder-slate-600 transition"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Confirm Password</label>
                <input 
                  type="password" 
                  value={registerConfirmPassword}
                  onChange={e => setRegisterConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
                  required
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/25 rounded-xl outline-none text-sm font-semibold text-slate-100 placeholder-slate-600 transition"
                />
              </div>

              <button 
                type="submit" 
                disabled={registerLoading}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-emerald-600/35 hover:shadow-emerald-600/50 cursor-pointer flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {registerLoading ? 'Creating account...' : 'Create Account'}
                <PlusCircle className="w-4 h-4" />
              </button>
              
              <div className="text-center pt-2">
                <p className="text-xs text-slate-400 font-semibold">
                  Already have an account?{' '}
                  <button 
                    type="button"
                    onClick={() => { setAuthMode('login'); setRegisterError(''); }}
                    className="text-emerald-400 hover:text-emerald-300 hover:underline cursor-pointer"
                  >
                    Sign In
                  </button>
                </p>
              </div>
            </form>
          )}
        </div>

        {/* Floating Sliding Toasts notifications */}
        <div className="fixed bottom-8 right-8 z-[9999] flex flex-col gap-3 pointer-events-none no-print">
          {toasts.map(t => {
            const isSuccess = t.type === 'success';
            const isWarning = t.type === 'warning';
            const isDanger = t.type === 'danger';
            return (
              <div 
                key={t.id}
                className={`px-5 py-4 min-w-[280px] max-w-[400px] border rounded-xl shadow-2xl bg-white dark:bg-slate-900 flex items-center gap-3.5 pointer-events-auto animate-slide-in ${
                  isSuccess ? 'border-l-4 border-l-emerald-500 border-slate-200 dark:border-slate-800' :
                  isWarning ? 'border-l-4 border-l-amber-500 border-slate-200 dark:border-slate-800' :
                  isDanger ? 'border-l-4 border-l-rose-500 border-slate-200 dark:border-slate-800' :
                  'border-l-4 border-l-indigo-500 border-slate-200 dark:border-slate-800'
                }`}
              >
                {isSuccess && <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />}
                {isWarning && <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />}
                {isDanger && <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />}
                {!isSuccess && !isWarning && !isDanger && <Info className="w-5 h-5 text-indigo-400 shrink-0" />}
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-relaxed">{t.message}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      
      {/* Sidebar Navigation */}
      <aside className="w-[280px] bg-slate-950 border-r border-slate-900 p-6 flex flex-col fixed top-0 bottom-0 left-0 z-50 transition-transform lg:translate-x-0 no-print" style={{ transform: sidebarOpen ? 'translateX(0)' : undefined }}>
        
        {/* Brand Header */}
        <div className="flex items-center gap-3 font-black text-2xl tracking-tight text-white mb-10 select-none group px-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/35 group-hover:scale-105 transition-transform duration-300">
            <Activity className="w-4.5 h-4.5 text-white filter drop-shadow-[0_0_4px_rgba(255,255,255,0.4)]" />
          </div>
          <span className="bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">HealthSence <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">AI</span></span>
        </div>

        {/* Logged In User Profile */}
        <div className="bg-slate-900/55 hover:bg-slate-900/80 border border-slate-900/60 hover:border-slate-800 rounded-2xl p-4 mb-6 flex items-center gap-3.5 transition-all duration-300 group shadow-md cursor-pointer relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-all duration-300" />
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500/20 to-violet-500/20 border border-indigo-500/30 text-indigo-300 flex items-center justify-center font-bold text-sm select-none shrink-0 group-hover:scale-105 transition-transform duration-300">
              {userProfile?.name ? userProfile.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) : 'U'}
            </div>
            {/* Status dot */}
            <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-slate-950 ring-0" />
          </div>
          <div className="flex-1 min-w-0 z-10">
            <div className="font-extrabold text-sm text-slate-100 truncate group-hover:text-white transition-colors">{userProfile?.name || 'Loading user...'}</div>
            <div className="text-[10px] font-bold text-indigo-400/85 uppercase tracking-wider truncate mt-0.5">@{userProfile?.username || 'user'}</div>
          </div>
        </div>

        {/* Selected Patient (Active Assessment Profile) */}
        {activeUser && (
          <div className="bg-indigo-950/30 border border-indigo-500/20 rounded-xl p-3 mb-6 flex items-center justify-between gap-2 animate-fade-in mx-1">
            <div className="flex items-center gap-2 min-w-0">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <div className="min-w-0">
                <p className="text-[9px] font-bold text-indigo-400/80 uppercase tracking-wider">Viewing Patient</p>
                <p className="text-xs font-semibold text-slate-200 truncate">{activeUser}</p>
              </div>
            </div>
            <button 
              onClick={() => setActiveUser('')} 
              className="text-slate-400 hover:text-slate-200 text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 cursor-pointer transition"
              title="Clear Active Patient Filter"
            >
              Clear
            </button>
          </div>
        )}

        {/* Navigation Menu */}
        <nav className="flex-1 flex flex-col gap-1.5">
          {[
            { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
            { id: 'wizard', label: 'New Assessment', icon: HeartPulse },
            { id: 'history', label: 'Assessment History', icon: ClipboardList },
            { id: 'insights', label: 'Health Insights', icon: TrendingUp },
            { id: 'account', label: 'Account Management', icon: Settings }
          ].map(item => {
            const Icon = item.icon;
            const isActive = currentTab === item.id || (item.id === 'wizard' && currentTab === 'results');
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.id === 'wizard') resetWizard();
                  setCurrentTab(item.id);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3.5 px-4 py-3 text-sm font-semibold rounded-xl transition-all cursor-pointer relative group overflow-hidden ${
                  isActive 
                    ? 'text-white bg-indigo-600 shadow-md shadow-indigo-600/20 border border-indigo-500/60' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
                }`}
              >
                {/* Active Indicator Line */}
                {isActive && (
                  <span className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-white rounded-r-md" />
                )}
                <Icon className={`w-5 h-5 shrink-0 transition-transform duration-300 ${isActive ? 'scale-100' : 'group-hover:scale-110'}`} />
                <span className="relative z-10">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer controls */}
        <div className="mt-auto pt-6 border-t border-slate-900 flex flex-col gap-3">
          <button 
            onClick={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
            className="w-full flex items-center justify-between px-4 py-3 bg-slate-900/40 hover:bg-slate-900/80 border border-slate-900/60 rounded-xl text-slate-400 hover:text-slate-200 text-sm font-semibold cursor-pointer transition-all duration-300"
          >
            <span className="flex items-center gap-2">
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400 animate-spin-slow" /> : <Moon className="w-4 h-4 text-indigo-400" />}
              Appearance
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-950/80 text-slate-400 border border-slate-800/50">
              {theme === 'dark' ? 'Light' : 'Dark'}
            </span>
          </button>
          
          {authToken && (
            <button 
              onClick={handleLogout}
              className="w-full flex items-center justify-between px-4 py-3 bg-rose-950/15 hover:bg-rose-900/35 border border-rose-900/25 rounded-xl text-rose-400 hover:text-rose-200 text-sm font-semibold cursor-pointer transition-all duration-300 group"
            >
              <span className="flex items-center gap-2">
                <LogOut className="w-4 h-4 text-rose-400 group-hover:translate-x-0.5 transition-transform" />
                Sign Out
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-rose-950/30 text-rose-400 border border-rose-900/10">
                Log Out
              </span>
            </button>
          )}
        </div>
      </aside>

      {/* Main Container */}
      <main className="lg:ml-[280px] flex-1 p-6 md:p-12 w-full max-w-[1600px] overflow-hidden">
        
        {/* Mobile Header Bar */}
        <header className="lg:hidden flex items-center justify-between mb-8 no-print">
          <div className="flex items-center gap-2 font-bold text-lg text-slate-100">
            <Activity className="w-6 h-6 text-indigo-500" />
            <span>HealthSenceAI</span>
          </div>
          <button 
            onClick={() => setSidebarOpen(prev => !prev)}
            className="w-10 h-10 border border-slate-800 rounded-lg flex items-center justify-center bg-slate-900 text-slate-200 cursor-pointer"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </header>

        {/* Top Header section (General) */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 no-print">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight dark:text-white text-slate-900">
              {currentTab === 'dashboard' && 'AI Health Risk Dashboard'}
              {currentTab === 'wizard' && 'Clinical Diagnostics Wizard'}
              {currentTab === 'results' && 'Diagnostic Risk Evaluation'}
              {currentTab === 'history' && 'Audit History Log'}
              {currentTab === 'insights' && 'Chronological Health Insights'}
              {currentTab === 'account' && 'Account Settings & Management'}
            </h1>
            <p className="text-sm font-medium dark:text-slate-400 text-slate-500 mt-1">
              {currentTab === 'dashboard' && 'Precision predictive metrics and diagnostic profiles.'}
              {currentTab === 'wizard' && 'Record biomarkers to trigger machine learning predictions.'}
              {currentTab === 'results' && 'Patient diagnostic probability report.'}
              {currentTab === 'history' && 'Query, review, and manage past risk summaries.'}
              {currentTab === 'insights' && 'Chart vital sign shifts and health index progressions.'}
              {currentTab === 'account' && 'Manage your personal credentials, profile name, and account status.'}
            </p>
          </div>
        </div>

        {/* ======================================================== */}
        {/* VIEW: DASHBOARD OVERVIEW */}
        {/* ======================================================== */}
        {currentTab === 'dashboard' && (
          <div className="space-y-8 animate-fade-in no-print">
            {assessments.length === 0 ? (
              <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center flex flex-col items-center gap-4">
                <Inbox className="w-16 h-16 text-slate-400" />
                <h3 className="font-bold text-lg dark:text-slate-100 text-slate-800">No assessments found</h3>
                <p className="text-sm text-slate-500 max-w-sm">Connect a MySQL database or fill the form wizard to display clinical statistics.</p>
                <button onClick={() => setCurrentTab('wizard')} className="btn bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 px-5 rounded-xl inline-flex items-center gap-2 cursor-pointer transition shadow-lg shadow-indigo-600/20">
                  <HeartPulse className="w-5 h-5" /> Start Assessment
                </button>
              </div>
            ) : (
              <>
                {/* Overview Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-6 flex items-center gap-4">
                    <div className="w-14 h-14 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-xl flex items-center justify-center">
                      <ClipboardList className="w-7 h-7" />
                    </div>
                    <div>
                      <h4 className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-1">Evaluations Run</h4>
                      <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
                        {assessments.filter(a => a.name === activeUser).length}
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-6 flex items-center gap-4">
                    <div className="w-14 h-14 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-xl flex items-center justify-center">
                      <AlertOctagon className="w-7 h-7" />
                    </div>
                    <div>
                      <h4 className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-1">Critical Risk Flags</h4>
                      <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
                        {latestAssessment ? Object.values(latestAssessment.results.risks).filter(r => r >= 70).length : 0}
                      </div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-6 flex items-center gap-4">
                    <div className="w-14 h-14 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl flex items-center justify-center">
                      <Stethoscope className="w-7 h-7" />
                    </div>
                    <div>
                      <h4 className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-1">Risk Status</h4>
                      <div className={`text-sm font-bold mt-1 px-3 py-1 rounded-full border text-center ${
                        latestAssessment && Object.values(latestAssessment.results.risks).some(r => r >= 70)
                          ? 'text-rose-400 bg-rose-500/10 border-rose-500/20'
                          : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                      }`}>
                        {latestAssessment && Object.values(latestAssessment.results.risks).some(r => r >= 70) ? 'Critical Alert' : 'Standard Range'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Dashboard layout main content */}
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                  
                  {/* Left Column: Radial score wheel */}
                  <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-8 xl:col-span-4 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-8">
                        <h2 className="font-bold text-lg text-slate-900 dark:text-slate-100">Overall Health Score</h2>
                        {latestAssessment && (
                          <span className={`text-xs font-bold uppercase tracking-wider border rounded-full px-3 py-1 ${getScoreBadgeStyles(latestAssessment.results.overallScore).style}`}>
                            {getScoreBadgeStyles(latestAssessment.results.overallScore).label}
                          </span>
                        )}
                      </div>

                      {latestAssessment && (
                        <div className="flex justify-center py-4">
                          <div className="circle-progress-container relative w-44 h-44 flex items-center justify-center cursor-pointer">
                            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
                              <circle className="stroke-slate-200 dark:stroke-slate-800 fill-none" cx="80" cy="80" r="72" strokeWidth="10"></circle>
                              <circle 
                                className="transition-all duration-1000 ease-out fill-none"
                                cx="80" 
                                cy="80" 
                                r="72" 
                                strokeWidth="10" 
                                stroke={getScoreBadgeStyles(latestAssessment.results.overallScore).color}
                                strokeDasharray={452.3} // 2 * PI * 72
                                strokeDashoffset={452.3 - (452.3 * latestAssessment.results.overallScore) / 100}
                                strokeLinecap="round"
                              ></circle>
                            </svg>
                            <div className="absolute text-center">
                              <div className="text-4xl font-extrabold text-slate-900 dark:text-slate-100">{latestAssessment.results.overallScore}</div>
                              <div className="text-xs uppercase tracking-widest text-slate-400 font-bold mt-1">Score / 100</div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="mt-8 bg-slate-950/40 border border-slate-800 rounded-xl p-4 flex gap-3">
                      <Sparkles className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold text-xs text-slate-200">Clinical Recommendation Excerpt</div>
                        <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                          {latestAssessment?.results.recommendations.immediate[0] || latestAssessment?.results.recommendations.lifestyle[0] || 'No critical warnings. Maintain healthy nutrition and exercise levels.'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Graphs */}
                  <div className="xl:col-span-8 space-y-8">
                    
                    {/* Radar Chart */}
                    <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-6 h-[320px]">
                      <h2 className="font-bold text-lg text-slate-900 dark:text-slate-100 mb-4">Patient Risk Profile</h2>
                      <div className="h-full max-h-[230px] flex justify-center">
                        {overviewRadarData && (
                          <Radar 
                            data={overviewRadarData} 
                            options={{
                              responsive: true,
                              maintainAspectRatio: false,
                              plugins: { legend: { display: false } },
                              scales: {
                                r: {
                                  grid: { color: theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' },
                                  angleLines: { color: theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' },
                                  ticks: { display: false },
                                  pointLabels: { color: theme === 'dark' ? '#94a3b8' : '#475569', font: { family: 'Plus Jakarta Sans', size: 10, weight: '600' } }
                                }
                              }
                            }} 
                          />
                        )}
                      </div>
                    </div>

                    {/* Timeline Line Chart */}
                    <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-6 h-[320px]">
                      <h2 className="font-bold text-lg text-slate-900 dark:text-slate-100 mb-4">Health Score Trend</h2>
                      <div className="h-full max-h-[230px]">
                        {overviewTrendData && (
                          <Line 
                            data={overviewTrendData} 
                            options={{
                              responsive: true,
                              maintainAspectRatio: false,
                              plugins: { legend: { display: false } },
                              scales: {
                                x: { grid: { display: false }, ticks: { color: theme === 'dark' ? '#94a3b8' : '#475569', font: { family: 'Plus Jakarta Sans', size: 10 } } },
                                y: { min: 0, max: 100, grid: { color: theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }, ticks: { color: theme === 'dark' ? '#94a3b8' : '#475569', font: { family: 'Plus Jakarta Sans', size: 10 } } }
                              }
                            }} 
                          />
                        )}
                      </div>
                    </div>

                  </div>
                </div>

                {/* Quick Link Buttons */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <button 
                    onClick={() => setCurrentTab('wizard')}
                    className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 hover:bg-slate-100/50 dark:hover:bg-slate-800/60 rounded-2xl p-6 text-left flex items-center justify-between cursor-pointer transition-all hover:-translate-y-1"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-xl flex items-center justify-center">
                        <HeartPulse className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-slate-100">Perform Health Assessment</h4>
                        <p className="text-xs text-slate-400 mt-0.5">Input clinical markers to compute patient health risk forecasts.</p>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-slate-400" />
                  </button>

                  <button 
                    onClick={() => setCurrentTab('history')}
                    className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 hover:bg-slate-100/50 dark:hover:bg-slate-800/60 rounded-2xl p-6 text-left flex items-center justify-between cursor-pointer transition-all hover:-translate-y-1"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl flex items-center justify-center">
                        <ClipboardList className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-slate-100">Browse Audit History</h4>
                        <p className="text-xs text-slate-400 mt-0.5">Browse past evaluations, delete logs, or select profile datasets.</p>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-slate-400" />
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* VIEW: NEW ASSESSMENT WIZARD */}
        {/* ======================================================== */}
        {currentTab === 'wizard' && (
          <div className="max-w-[900px] mx-auto animate-fade-in no-print">
            
            {/* Step navigation nodes */}
            <div className="flex justify-between items-center relative mb-10 px-4">
              <div className="absolute top-[25px] left-0 right-0 h-0.5 bg-slate-200 dark:bg-slate-800 z-0"></div>
              <div 
                className="absolute top-[25px] left-0 h-0.5 bg-indigo-600 z-10 transition-all duration-300"
                style={{ width: `${((wizardStep - 1) / 2) * 100}%` }}
              ></div>

              {[
                { step: 1, label: 'Personal Profile' },
                { step: 2, label: 'Lifestyle Habits' },
                { step: 3, label: 'Biomarkers' }
              ].map(item => (
                <div key={item.step} className="flex flex-col items-center gap-2 relative z-20">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold border-2 transition-all ${
                    wizardStep === item.step
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-600/35 ring-4 ring-indigo-500/20'
                      : wizardStep > item.step
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white dark:bg-slate-950 text-slate-400 border-slate-200 dark:border-slate-800'
                  }`}>
                    {item.step}
                  </div>
                  <span className={`text-xs font-bold transition-all ${
                    wizardStep === item.step ? 'dark:text-slate-100 text-slate-900 font-extrabold' : 'text-slate-400 font-medium'
                  }`}>{item.label}</span>
                </div>
              ))}
            </div>

            {/* Wizards Form Card */}
            <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-8 shadow-2xl">
              <form onSubmit={e => e.preventDefault()} className="space-y-6">
                
                {/* STEP 1: Personal profile information */}
                {wizardStep === 1 && (
                  <div className="space-y-6 animate-fade-in">
                    <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
                      <h3 className="font-extrabold text-xl text-slate-900 dark:text-slate-100">Personal Information</h3>
                      <p className="text-xs text-slate-400 mt-1">Provide baseline identity metrics for reference in clinical risk records.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Patient Full Name</label>
                        <input 
                          type="text" 
                          placeholder="e.g. Sarah Connor"
                          value={formData.name}
                          onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                          className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border rounded-xl outline-none transition text-sm font-semibold ${
                            errors.name ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/20' : 'border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/25'
                          }`}
                        />
                        {errors.name && <span className="text-[10px] font-bold text-rose-400">{errors.name}</span>}
                      </div>

                      <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Patient Age</label>
                        <input 
                          type="number" 
                          placeholder="e.g. 40"
                          value={formData.age}
                          onChange={e => setFormData(prev => ({ ...prev, age: e.target.value }))}
                          className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border rounded-xl outline-none transition text-sm font-semibold ${
                            errors.age ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/20' : 'border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/25'
                          }`}
                        />
                        {errors.age && <span className="text-[10px] font-bold text-rose-400">{errors.age}</span>}
                      </div>

                      <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Gender (At Birth)</label>
                        <div className="flex gap-4">
                          {['male', 'female', 'other'].map(g => (
                            <label key={g} className="flex-1 relative cursor-pointer">
                              <input 
                                type="radio" 
                                name="gender" 
                                checked={formData.gender === g}
                                onChange={() => setFormData(prev => ({ ...prev, gender: g }))}
                                className="sr-only peer"
                              />
                              <div className="w-full text-center py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 peer-checked:border-indigo-500 peer-checked:bg-indigo-500/10 peer-checked:text-indigo-400 text-sm font-bold text-slate-400 rounded-xl transition">
                                {g.toUpperCase()}
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-2">
                          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Height (cm)</label>
                          <input 
                            type="number" 
                            placeholder="e.g. 170"
                            value={formData.height}
                            onChange={e => setFormData(prev => ({ ...prev, height: e.target.value }))}
                            className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border rounded-xl outline-none transition text-sm font-semibold ${
                              errors.height ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/20' : 'border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/25'
                            }`}
                          />
                          {errors.height && <span className="text-[10px] font-bold text-rose-400">{errors.height}</span>}
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Weight (kg)</label>
                          <input 
                            type="number" 
                            placeholder="e.g. 68"
                            value={formData.weight}
                            onChange={e => setFormData(prev => ({ ...prev, weight: e.target.value }))}
                            className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border rounded-xl outline-none transition text-sm font-semibold ${
                              errors.weight ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/20' : 'border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/25'
                            }`}
                          />
                          {errors.weight && <span className="text-[10px] font-bold text-rose-400">{errors.weight}</span>}
                        </div>
                      </div>

                      {/* BMI indicator card */}
                      <div className="md:col-span-2 bg-indigo-500/10 border border-indigo-500/25 rounded-2xl p-6 flex justify-between items-center">
                        <div>
                          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">Estimated Patient BMI</h4>
                          <div className="text-3xl font-extrabold text-indigo-400 flex items-baseline gap-1">
                            {calculatedBMI || '--'} <span className="text-xs font-medium text-slate-400">kg/m²</span>
                          </div>
                        </div>
                        <span className={`text-xs font-bold px-3.5 py-1.5 border rounded-full ${bmiDetails.color}`}>
                          {bmiDetails.text}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 2: Lifestyle Habits */}
                {wizardStep === 2 && (
                  <div className="space-y-6 animate-fade-in">
                    <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
                      <h3 className="font-extrabold text-xl text-slate-900 dark:text-slate-100">Lifestyle Habits</h3>
                      <p className="text-xs text-slate-400 mt-1">Provide social and routine metrics that influence baseline metabolic strain values.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      
                      <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tobacco Smoking</label>
                        <div className="flex gap-4">
                          {['no', 'yes'].map(opt => (
                            <label key={opt} className="flex-1 relative cursor-pointer">
                              <input 
                                type="radio" 
                                name="smoking" 
                                checked={formData.smoking === opt}
                                onChange={() => setFormData(prev => ({ ...prev, smoking: opt }))}
                                className="sr-only peer"
                              />
                              <div className="w-full text-center py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 peer-checked:border-indigo-500 peer-checked:bg-indigo-500/10 peer-checked:text-indigo-400 text-sm font-bold text-slate-400 rounded-xl transition">
                                {opt === 'no' ? 'NON-SMOKER' : 'ACTIVE SMOKER'}
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Alcohol Consumption</label>
                        <div className="flex gap-3">
                          {['low', 'moderate', 'high'].map(opt => (
                            <label key={opt} className="flex-1 relative cursor-pointer">
                              <input 
                                type="radio" 
                                name="alcohol" 
                                checked={formData.alcohol === opt}
                                onChange={() => setFormData(prev => ({ ...prev, alcohol: opt }))}
                                className="sr-only peer"
                              />
                              <div className="w-full text-center py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 peer-checked:border-indigo-500 peer-checked:bg-indigo-500/10 peer-checked:text-indigo-400 text-sm font-bold text-slate-400 rounded-xl transition">
                                {opt.toUpperCase()}
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Physical Activity Level</label>
                        <div className="flex gap-3">
                          {['sedentary', 'moderate', 'active'].map(opt => (
                            <label key={opt} className="flex-1 relative cursor-pointer">
                              <input 
                                type="radio" 
                                name="activity" 
                                checked={formData.physicalActivity === opt}
                                onChange={() => setFormData(prev => ({ ...prev, physicalActivity: opt }))}
                                className="sr-only peer"
                              />
                              <div className="w-full text-center py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 peer-checked:border-indigo-500 peer-checked:bg-indigo-500/10 peer-checked:text-indigo-400 text-sm font-bold text-slate-400 rounded-xl transition font-semibold">
                                {opt.toUpperCase()}
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <div className="flex justify-between items-center text-xs font-bold text-slate-400 uppercase tracking-wider">
                          <span>Sleep Duration (Hours)</span>
                          <span className="text-indigo-400 font-extrabold text-sm">{formData.sleepDuration} hrs</span>
                        </div>
                        <input 
                          type="range" 
                          min="3" 
                          max="12" 
                          step="0.5"
                          value={formData.sleepDuration}
                          onChange={e => setFormData(prev => ({ ...prev, sleepDuration: parseFloat(e.target.value) }))}
                          className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600 mt-3"
                        />
                      </div>

                    </div>
                  </div>
                )}

                {/* STEP 3: Biomarkers & algorithm */}
                {wizardStep === 3 && (
                  <div className="space-y-6 animate-fade-in">
                    <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
                      <h3 className="font-extrabold text-xl text-slate-900 dark:text-slate-100">Clinical & Medical Biomarkers</h3>
                      <p className="text-xs text-slate-400 mt-1">Specify clinical vital ranges to feed the ML predictive classification runs.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {[
                        { key: 'bpSystolic', label: 'Systolic Blood Pressure (mmHg)', min: 80, max: 220 },
                        { key: 'bpDiastolic', label: 'Diastolic Blood Pressure (mmHg)', min: 50, max: 130 },
                        { key: 'cholesterol', label: 'Total Cholesterol (mg/dL)', min: 100, max: 400 },
                        { key: 'glucose', label: 'Fasting Blood Glucose (mg/dL)', min: 50, max: 300 },
                        { key: 'insulin', label: 'Fasting Insulin (µIU/mL)', min: 2, max: 60 },
                        { key: 'heartRate', label: 'Resting Heart Rate (BPM)', min: 40, max: 150 }
                      ].map(item => (
                        <div key={item.key} className="flex flex-col gap-2">
                          <div className="flex justify-between items-center text-xs font-bold text-slate-400 uppercase tracking-wider">
                            <span>{item.label}</span>
                            <span className="text-indigo-400 font-extrabold text-sm">{formData[item.key]}</span>
                          </div>
                          <input 
                            type="range" 
                            min={item.min} 
                            max={item.max}
                            value={formData[item.key]}
                            onChange={e => setFormData(prev => ({ ...prev, [item.key]: parseInt(e.target.value) }))}
                            className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600 mt-1.5"
                          />
                        </div>
                      ))}



                    </div>
                  </div>
                )}

                {/* Wizards controls */}
                <div className="flex justify-between items-center pt-6 border-t border-slate-200 dark:border-slate-800">
                  <button 
                    type="button"
                    onClick={() => setWizardStep(prev => prev - 1)}
                    disabled={wizardStep === 1 || predicting}
                    className={`btn py-2.5 px-5 rounded-xl border font-bold text-sm inline-flex items-center gap-2 cursor-pointer transition ${
                      wizardStep === 1 
                        ? 'opacity-0 pointer-events-none' 
                        : 'border-slate-200 dark:border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                    }`}
                  >
                    <ArrowLeft className="w-4 h-4" /> Previous Step
                  </button>
                  
                  <button 
                    type="button"
                    onClick={handleNextStep}
                    disabled={predicting}
                    className="btn bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white py-2.5 px-6 rounded-xl font-bold text-sm inline-flex items-center gap-2 cursor-pointer transition shadow-lg shadow-indigo-600/20"
                  >
                    {predicting ? (
                      <>
                        <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin"></div>
                        <span>Calculating Risks...</span>
                      </>
                    ) : wizardStep === 3 ? (
                      <>
                        <span>Compute Clinical Forecast</span>
                        <Activity className="w-4 h-4" />
                      </>
                    ) : (
                      <>
                        <span>Next Step</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>

              </form>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* VIEW: RESULTS DIAGE REPORT */}
        {/* ======================================================== */}
        {currentTab === 'results' && resultsAssessment && (
          <div className="max-w-[1000px] mx-auto space-y-8 animate-fade-in">
            
            {/* Header Action Buttons */}
            <div className="flex gap-4 justify-end no-print">
              <button 
                onClick={() => setCurrentTab('dashboard')} 
                className="btn py-2.5 px-5 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-sm text-slate-400 hover:bg-slate-800 hover:text-slate-200 inline-flex items-center gap-2 cursor-pointer transition"
              >
                <LayoutDashboard className="w-4 h-4" /> Back to Dashboard
              </button>
              
              <button 
                onClick={() => window.print()}
                className="btn bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 px-5 rounded-xl font-bold text-sm inline-flex items-center gap-2 cursor-pointer transition shadow-lg shadow-indigo-600/20"
              >
                <Printer className="w-4 h-4" /> Print Assessment Report
              </button>
            </div>

            {/* Health Score Overview card */}
            <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-8 flex flex-col md:flex-row items-center gap-8 print-card">
              <div className="flex flex-col items-center">
                <div className="circle-progress-container relative w-40 h-40 flex items-center justify-center cursor-pointer">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
                    <circle className="stroke-slate-200 dark:stroke-slate-800 fill-none" cx="80" cy="80" r="72" strokeWidth="10"></circle>
                    <circle 
                      className="transition-all duration-1000 ease-out fill-none"
                      cx="80" 
                      cy="80" 
                      r="72" 
                      strokeWidth="10" 
                      stroke={getScoreBadgeStyles(resultsAssessment.results.overallScore).color}
                      strokeDasharray={452.3}
                      strokeDashoffset={452.3 - (452.3 * resultsAssessment.results.overallScore) / 100}
                      strokeLinecap="round"
                    ></circle>
                  </svg>
                  <div className="absolute text-center">
                    <div className="text-4xl font-extrabold text-slate-900 dark:text-slate-100">{resultsAssessment.results.overallScore}</div>
                    <div className="text-xs uppercase tracking-widest text-slate-400 font-bold mt-1">Overall Health</div>
                  </div>
                </div>
                <span className={`text-xs font-bold uppercase tracking-wider border rounded-full px-3 py-1 mt-4 ${getScoreBadgeStyles(resultsAssessment.results.overallScore).style}`}>
                  {getScoreBadgeStyles(resultsAssessment.results.overallScore).label}
                </span>
              </div>

              <div className="flex-1">
                <h3 className="font-extrabold text-2xl text-slate-900 dark:text-slate-100">Cardiovascular & Metabolic Risk Report</h3>
                <p className="text-xs font-semibold text-slate-400 dark:text-slate-400 mt-1">
                  Patient: <strong className="text-slate-200">{resultsAssessment.name}</strong> &bull; Age: {resultsAssessment.personal.age} &bull; BMI: {resultsAssessment.personal.bmi} &bull; Computed on: {new Date(resultsAssessment.timestamp).toLocaleDateString()}
                </p>
                <p className="text-sm text-slate-500 mt-4 leading-relaxed dark:text-slate-400">
                  The calculated indicators represent risk probability ranges based on physiological inputs mapped to machine learning classification guidelines. High risk percentages signify areas of clinical concern. Review the personalized recommendations blocks below.
                </p>
              </div>
            </div>

            {/* Disease risk cards grid (4 targets) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { key: 'diabetes', title: 'Diabetes Likelihood', val: resultsAssessment.results.risks.diabetes, icon: Droplet, explanations: resultsAssessment.results.explanations.diabetes },
                { key: 'heart', title: 'Heart Disease Likelihood', val: resultsAssessment.results.risks.heartDisease, icon: Heart, explanations: resultsAssessment.results.explanations.heart },
                { key: 'kidney', title: 'Kidney Disease Likelihood', val: resultsAssessment.results.risks.kidneyDisease, icon: ShieldAlert, explanations: resultsAssessment.results.explanations.kidney },
                { key: 'liver', title: 'Liver Disease Likelihood', val: resultsAssessment.results.risks.liverDisease, icon: Activity, explanations: resultsAssessment.results.explanations.liver }
              ].map(item => {
                const Icon = item.icon;
                const rDetails = getRiskLevelDetails(item.val);
                const isExpanded = expandedRisks[item.key];
                
                return (
                  <div key={item.key} className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-6 flex flex-col gap-4 print-card">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3 font-bold text-slate-900 dark:text-slate-100">
                        <Icon className={`w-6 h-6 ${
                          item.key === 'diabetes' ? 'text-indigo-400' :
                          item.key === 'heart' ? 'text-rose-400' :
                          item.key === 'kidney' ? 'text-purple-400' : 'text-amber-400'
                        }`} />
                        <span>{item.title}</span>
                      </div>
                      <span className={`text-[10px] font-bold uppercase tracking-wider border rounded-full px-2.5 py-0.5 ${rDetails.badge}`}>
                        {rDetails.label}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-bold text-slate-400">
                        <span>Risk Probability</span>
                        <span className="dark:text-slate-200">{item.val}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-1000 ${rDetails.bar}`} style={{ width: `${item.val}%` }}></div>
                      </div>
                    </div>

                    <div className="border-t border-slate-200 dark:border-slate-800 pt-3 flex justify-between items-center text-xs font-medium text-slate-400">
                      <span>Model Confidence: <strong className="dark:text-slate-200">{resultsAssessment.results.confidence}%</strong></span>
                      <button 
                        onClick={() => setExpandedRisks(prev => ({ ...prev, [item.key]: !prev[item.key] }))}
                        className="text-indigo-400 font-bold hover:underline flex items-center gap-0.5 cursor-pointer no-print"
                      >
                        {isExpanded ? 'Hide details' : 'Why this prediction?'}
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    {/* Explanations list */}
                    {(isExpanded || window.matchMedia('print').matches) && (
                      <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-4 mt-2 animate-fade-in">
                        <ul className="list-disc pl-4 space-y-1.5 text-xs text-slate-300">
                          {item.explanations?.map((exp, idx) => (
                            <li key={idx}>{exp}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Recommendations Blocks */}
            <div className="space-y-6">
              
              {/* URGENT IMMEDIATE MEDICAL ATTS */}
              {resultsAssessment.results.recommendations.immediate?.length > 0 && (
                <div className="bg-rose-500/10 border border-rose-500/25 rounded-2xl p-6 print-card">
                  <div className="flex items-center gap-3 font-bold text-rose-400 mb-4">
                    <AlertOctagon className="w-6 h-6" />
                    <span>Immediate Medical Consultations Recommended</span>
                  </div>
                  <ul className="list-disc pl-6 space-y-2 text-sm text-rose-300/95 font-medium">
                    {resultsAssessment.results.recommendations.immediate.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* LIFESTYLE DIET RECOMMENDATIONS */}
              {resultsAssessment.results.recommendations.lifestyle?.length > 0 && (
                <div className="bg-indigo-500/10 border border-indigo-500/25 rounded-2xl p-6 print-card">
                  <div className="flex items-center gap-3 font-bold text-indigo-400 mb-4">
                    <Sparkles className="w-6 h-6" />
                    <span>Lifestyle & Dietary Adjustments</span>
                  </div>
                  <ul className="list-disc pl-6 space-y-2 text-sm text-slate-300 dark:text-slate-300">
                    {resultsAssessment.results.recommendations.lifestyle.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* CLINICAL MONITORING PLAN */}
              {resultsAssessment.results.recommendations.medical?.length > 0 && (
                <div className="bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-6 print-card">
                  <div className="flex items-center gap-3 font-bold text-slate-900 dark:text-slate-100 mb-4">
                    <Stethoscope className="w-6 h-6" />
                    <span>Physiological Monitoring & Testing</span>
                  </div>
                  <ul className="list-disc pl-6 space-y-2 text-sm text-slate-500 dark:text-slate-300">
                    {resultsAssessment.results.recommendations.medical.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

            </div>

          </div>
        )}

        {currentTab === 'history' && renderProtectedTab(
          <div className="space-y-6 animate-fade-in no-print">
            
            {/* Table Filters controls */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="w-5 h-5 text-slate-400 absolute left-4.5 top-1/2 -translate-y-1/2" />
                <input 
                  type="text" 
                  placeholder="Search patient name..."
                  value={historySearch}
                  onChange={e => setHistorySearch(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/25 rounded-xl outline-none text-sm font-semibold transition"
                />
              </div>
              
              <div className="sm:w-60">
                <select 
                  value={historyFilter}
                  onChange={e => setHistoryFilter(e.target.value)}
                  className="w-full px-4 py-3 bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-sm font-semibold transition cursor-pointer"
                >
                  <option value="all">All Risk Classes</option>
                  <option value="high">High Risk Alerts</option>
                  <option value="medium">Medium Risk Indicators</option>
                  <option value="low">Optimal Low Risks Only</option>
                </select>
              </div>
            </div>

            {/* History grid table */}
            {filteredAssessments.length === 0 ? (
              <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center flex flex-col items-center gap-4">
                <Inbox className="w-16 h-16 text-slate-400" />
                <h3 className="font-bold text-lg dark:text-slate-100 text-slate-800">No logs found</h3>
                <p className="text-sm text-slate-500">No diagnostic assessments fit the selected query parameters.</p>
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-200 dark:border-slate-800/80 rounded-2xl bg-white dark:bg-slate-900/60">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800/80 text-slate-400 font-bold">
                      <th className="p-4 px-6">Patient Profile</th>
                      <th className="p-4">Calculated Date</th>
                      <th className="p-4">Health Score</th>
                      <th className="p-4">Diabetes Risk</th>
                      <th className="p-4">Heart Risk</th>
                      <th className="p-4">Kidney Risk</th>
                      <th className="p-4">Liver Risk</th>
                      <th className="p-4">Alert Class</th>
                      <th className="p-4 px-6 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80">
                    {filteredAssessments.map(item => {
                      const maxVal = Math.max(item.results.risks.diabetes, item.results.risks.heartDisease, item.results.risks.kidneyDisease, item.results.risks.liverDisease);
                      const rDetails = getRiskLevelDetails(maxVal);
                      const dateObj = new Date(item.timestamp);
                      const dateFormatted = `${dateObj.toLocaleDateString()} ${dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
                      
                      return (
                        <tr key={item.id} className="hover:bg-slate-100/50 dark:hover:bg-slate-800/40 transition">
                          <td className="p-4 px-6">
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-900 dark:text-slate-100">{item.name}</span>
                              <span className="text-xs text-slate-400 font-medium">{item.personal.gender.toUpperCase()}, {item.personal.age} yrs</span>
                            </div>
                          </td>
                          <td className="p-4 font-semibold text-slate-500 dark:text-slate-300">{dateFormatted}</td>
                          <td className="p-4 font-extrabold text-slate-900 dark:text-slate-100">{item.results.overallScore}/100</td>
                          <td className="p-4 font-bold text-slate-500 dark:text-slate-300">{item.results.risks.diabetes}%</td>
                          <td className="p-4 font-bold text-slate-500 dark:text-slate-300">{item.results.risks.heartDisease}%</td>
                          <td className="p-4 font-bold text-slate-500 dark:text-slate-300">{item.results.risks.kidneyDisease}%</td>
                          <td className="p-4 font-bold text-slate-500 dark:text-slate-300">{item.results.risks.liverDisease}%</td>
                          <td className="p-4">
                            <span className={`text-[10px] font-bold uppercase tracking-wider border rounded-full px-2.5 py-0.5 ${rDetails.badge}`}>
                              {rDetails.label.split(' ')[0]}
                            </span>
                          </td>
                          <td className="p-4 px-6">
                            <div className="flex justify-center gap-2">
                              <button 
                                onClick={() => {
                                  setResultsAssessment(item);
                                  setCurrentTab('results');
                                }}
                                className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-indigo-400 hover:border-indigo-500/40 hover:bg-indigo-500/10 flex items-center justify-center cursor-pointer transition"
                                title="View Diagnostic Report"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              
                              <button 
                                onClick={() => handleDeleteAssessment(item.id)}
                                className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-rose-400 hover:border-rose-500/40 hover:bg-rose-500/10 flex items-center justify-center cursor-pointer transition"
                                title="Delete Log Record"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* VIEW: CHRONOLOGICAL HEALTH INSIGHTS */}
        {/* ======================================================== */}
        {currentTab === 'insights' && renderProtectedTab(
          <div className="space-y-6 animate-fade-in no-print">
            
            {/* Header select patient */}
            <div className="flex justify-between items-center flex-wrap gap-4 bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
              <div className="flex items-center gap-3">
                <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">Select Patient dataset:</label>
                <select 
                  value={insightsUser}
                  onChange={e => setInsightsUser(e.target.value)}
                  className="px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-sm font-semibold transition cursor-pointer"
                >
                  {uniquePatients.length === 0 ? (
                    <option value="">No patients available</option>
                  ) : (
                    uniquePatients.map(name => (
                      <option key={name} value={name}>{name}</option>
                    ))
                  )}
                </select>
              </div>

              <button 
                onClick={() => {
                  resetWizard();
                  setCurrentTab('wizard');
                }}
                className="btn bg-indigo-600 hover:bg-indigo-500 text-white py-2 px-4 rounded-xl font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer transition shadow-lg shadow-indigo-600/20"
              >
                <PlusCircle className="w-4 h-4" /> Assess Patient Again
              </button>
            </div>

            {uniquePatients.length === 0 ? (
              <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center flex flex-col items-center gap-4">
                <Inbox className="w-16 h-16 text-slate-400" />
                <h3 className="font-bold text-lg dark:text-slate-100 text-slate-800">No patient history found</h3>
                <p className="text-sm text-slate-500">Run a clinical assessment first to enable timeline graphing insights.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                
                {/* Score Trend Line Chart */}
                <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-6 xl:col-span-8 h-[340px]">
                  <h2 className="font-bold text-lg text-slate-900 dark:text-slate-100 mb-4">Overall Health Score Progression</h2>
                  <div className="h-full max-h-[250px]">
                    <Line 
                      data={insightsScoreTrendData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                        scales: {
                          x: { grid: { display: false }, ticks: { color: theme === 'dark' ? '#94a3b8' : '#475569', font: { family: 'Plus Jakarta Sans', size: 10 } } },
                          y: { min: 0, max: 100, grid: { color: theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }, ticks: { color: theme === 'dark' ? '#94a3b8' : '#475569', font: { family: 'Plus Jakarta Sans', size: 10 } } }
                        }
                      }}
                    />
                  </div>
                </div>

                {/* Score Trend Stats aggregates */}
                <div className="xl:col-span-4 flex flex-col gap-6">
                  <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-6 flex-1 flex flex-col justify-center">
                    <h4 className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-1">Average Health rating</h4>
                    <div className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">{insightsAggregates.avg}/100</div>
                    <p className="text-xs text-slate-400 font-medium mt-1">Average rating over patient timeline evaluations.</p>
                  </div>
                  
                  <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-6 flex-1 flex flex-col justify-center">
                    <h4 className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-1">Peak Disease Risk</h4>
                    <div className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">{insightsAggregates.maxRisk}%</div>
                    <p className="text-xs text-indigo-400 font-bold mt-1 uppercase tracking-wider">{insightsAggregates.advice}</p>
                  </div>
                </div>

                {/* Biomarker charts timeline */}
                <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-6 xl:col-span-12 h-[360px]">
                  <h2 className="font-bold text-lg text-slate-900 dark:text-slate-100 mb-4">Critical Biomarkers Timeline</h2>
                  <div className="h-full max-h-[270px]">
                    <Line 
                      data={insightsVitalsData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: 'top',
                            labels: { color: theme === 'dark' ? '#94a3b8' : '#475569', font: { family: 'Plus Jakarta Sans', size: 9 }, boxWidth: 12 }
                          }
                        },
                        scales: {
                          x: { grid: { display: false }, ticks: { color: theme === 'dark' ? '#94a3b8' : '#475569', font: { family: 'Plus Jakarta Sans', size: 10 } } },
                          y: { grid: { color: theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }, ticks: { color: theme === 'dark' ? '#94a3b8' : '#475569', font: { family: 'Plus Jakarta Sans', size: 10 } } }
                        }
                      }}
                    />
                  </div>
                </div>

              </div>
              )}
          </div>
        )}

        {/* ======================================================== */}
        {/* VIEW: ACCOUNT MANAGEMENT */}
        {/* ======================================================== */}
        {currentTab === 'account' && renderProtectedTab(
          <div className="space-y-8 animate-fade-in no-print text-slate-900 dark:text-slate-100">
            
            {/* Upper Profile Overview Info Card */}
            <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 backdrop-blur-md">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 dark:text-indigo-400 flex items-center justify-center font-bold text-2xl filter drop-shadow-[0_0_10px_rgba(99,102,241,0.15)]">
                  {userProfile?.name ? userProfile.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) : 'A'}
                </div>
                <div>
                  <h3 className="font-extrabold text-xl">{userProfile?.name || 'Anonymous User'}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
                    <span className="font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[10px]">
                      @{userProfile?.username || 'user'}
                    </span>
                    {userProfile?.created_at && userProfile.created_at !== 'System Default' ? (
                      <span>• Joined {new Date(userProfile.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    ) : (
                      <span>• System Account</span>
                    )}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <button 
                  onClick={handleLogout}
                  className="px-4 py-2.5 bg-rose-500/10 border border-rose-500/25 hover:bg-rose-500 hover:text-white text-rose-500 rounded-xl font-bold text-xs cursor-pointer flex items-center gap-1.5 active:scale-[0.98] transition-all"
                >
                  <Info className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </div>

            {/* Split forms */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Form: Update Profile Name */}
              <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 backdrop-blur-md flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2.5 mb-6">
                    <User className="w-5 h-5 text-indigo-500" />
                    <h3 className="font-extrabold text-lg">Update Profile Information</h3>
                  </div>
                  
                  <form onSubmit={handleUpdateProfileName} className="space-y-5">
                    {profileMessage && (
                      <div className="bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 rounded-xl p-3 text-xs font-semibold flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 shrink-0" />
                        <span>{profileMessage}</span>
                      </div>
                    )}
                    {profileError && (
                      <div className="bg-rose-500/10 border border-rose-500/25 text-rose-400 rounded-xl p-3 text-xs font-semibold flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{profileError}</span>
                      </div>
                    )}
                    
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Full Name</label>
                      <input 
                        type="text" 
                        value={profileName}
                        onChange={e => setProfileName(e.target.value)}
                        placeholder="Enter your full name"
                        required
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/25 rounded-xl outline-none text-sm font-semibold text-slate-800 dark:text-slate-100 transition"
                      />
                    </div>

                    <button 
                      type="submit" 
                      disabled={profileLoading}
                      className="py-2.5 px-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs shadow-lg shadow-indigo-600/35 hover:shadow-indigo-600/50 cursor-pointer flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-50"
                    >
                      {profileLoading ? 'Saving...' : 'Save Profile Details'}
                    </button>
                  </form>
                </div>
              </div>

              {/* Form: Change Password */}
              <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 backdrop-blur-md">
                <div className="flex items-center gap-2.5 mb-6">
                  <Lock className="w-5 h-5 text-indigo-500" />
                  <h3 className="font-extrabold text-lg">Change Password</h3>
                </div>
                
                <form onSubmit={handleUpdatePassword} className="space-y-5">
                  {passwordMessage && (
                    <div className="bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 rounded-xl p-3 text-xs font-semibold flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 shrink-0" />
                      <span>{passwordMessage}</span>
                    </div>
                  )}
                  {passwordError && (
                    <div className="bg-rose-500/10 border border-rose-500/25 text-rose-400 rounded-xl p-3 text-xs font-semibold flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{passwordError}</span>
                    </div>
                  )}
                  
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Current Password</label>
                    <input 
                      type="password" 
                      value={currentPassword}
                      onChange={e => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/25 rounded-xl outline-none text-sm font-semibold text-slate-800 dark:text-slate-100 transition"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">New Password</label>
                    <input 
                      type="password" 
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/25 rounded-xl outline-none text-sm font-semibold text-slate-800 dark:text-slate-100 transition"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Confirm New Password</label>
                    <input 
                      type="password" 
                      value={confirmNewPassword}
                      onChange={e => setConfirmNewPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/25 rounded-xl outline-none text-sm font-semibold text-slate-800 dark:text-slate-100 transition"
                    />
                  </div>

                  <button 
                    type="submit" 
                    className="py-2.5 px-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs shadow-lg shadow-indigo-600/35 hover:shadow-indigo-600/50 cursor-pointer flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
                  >
                    Change Password
                  </button>
                </form>
              </div>

            </div>

            {/* Danger Zone */}
            <div className="bg-rose-500/5 border border-rose-500/20 rounded-3xl p-6 md:p-8 backdrop-blur-md">
              <div className="flex items-center gap-2.5 mb-4 text-rose-500">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="font-extrabold text-lg">Danger Zone</h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xl mb-6">
                Deleting your account is permanent. This will remove your account profile from the database and you will be immediately signed out. You will not be able to recover this account later.
              </p>
              <button 
                onClick={handleDeleteAccount}
                className="px-5 py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold text-xs cursor-pointer shadow-lg shadow-rose-600/20 active:scale-[0.98] transition-all"
              >
                Permanently Delete Account
              </button>
            </div>

          </div>
        )}

      </main>

      {/* Floating Sliding Toasts notifications */}
      <div className="fixed bottom-8 right-8 z-[9999] flex flex-col gap-3 pointer-events-none no-print">
        {toasts.map(t => {
          const isSuccess = t.type === 'success';
          const isWarning = t.type === 'warning';
          const isDanger = t.type === 'danger';
          return (
            <div 
              key={t.id}
              className={`px-5 py-4 min-w-[280px] max-w-[400px] border rounded-xl shadow-2xl bg-white dark:bg-slate-900 flex items-center gap-3.5 pointer-events-auto animate-slide-in ${
                isSuccess ? 'border-l-4 border-l-emerald-500 border-slate-200 dark:border-slate-800' :
                isWarning ? 'border-l-4 border-l-amber-500 border-slate-200 dark:border-slate-800' :
                isDanger ? 'border-l-4 border-l-rose-500 border-slate-200 dark:border-slate-800' :
                'border-l-4 border-l-indigo-500 border-slate-200 dark:border-slate-800'
              }`}
            >
              {isSuccess && <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />}
              {isWarning && <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />}
              {isDanger && <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />}
              {!isSuccess && !isWarning && !isDanger && <Info className="w-5 h-5 text-indigo-400 shrink-0" />}
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-relaxed">{t.message}</span>
            </div>
          );
        })}
      </div>

    </div>
  );
}
