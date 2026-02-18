import React, { useState, useEffect, useCallback, useRef } from 'react';
import { BodyView, BodyPartInfo, SymptomAnalysis, NearbyHospital, VisualAnalysis, HealthSearchResult, MedicalHistoryItem, ChatMessage } from './types';
import BodyMap from './components/BodyMap';
import InfoCard from './components/InfoCard';
import Onboarding from './components/Onboarding';
import Auth from './components/Auth';
import { getBodyPartData, analyzeSymptoms, findNearbyHospitals, analyzeMedicalImage, searchHealthQuery, createHealthChat } from './services/geminiService';
import { saveMedicalHistory, getMedicalHistory } from './services/dbService';
import { BluetoothSensorManager, CameraVitalScanner, SensorType } from './services/sensorService';
import { Search, RotateCcw, Info, Menu, X, BrainCircuit, Heart, Activity, User, MapPin, ClipboardList, Shield, Settings, LogOut, ChevronRight, Sparkles, Mic, MicOff, Sun, Moon, ExternalLink, Navigation, ScanEye, Upload, ImageIcon, AlertTriangle, Globe, Smartphone, Watch, Wifi, ShieldCheck, Lock, Download, Star, Volume2, Award, Stethoscope, FileSignature, CheckCircle2, MessageSquare, Send, Camera, SwitchCamera, BarChart3, Moon as MoonIcon, Scale, Zap, Trophy, Bluetooth, Video, Disc, Thermometer, Droplets, Share2, Printer, FileText, Check, GraduationCap, Users, CalendarCheck, Clock } from 'lucide-react';
import { Chat, GenerateContentResponse } from "@google/genai";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

type TabType = 'map' | 'checker' | 'scanner' | 'habits' | 'hospitals' | 'profile';

const App: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<TabType>('map');
  const [view, setView] = useState<BodyView>(BodyView.FRONT);
  const [selectedPart, setSelectedPart] = useState<string | null>('Head');
  const [partInfo, setPartInfo] = useState<BodyPartInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [analysis, setAnalysis] = useState<SymptomAnalysis | null>(null);
  const [showMobileNav, setShowMobileNav] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  
  // History State
  const [history, setHistory] = useState<MedicalHistoryItem[]>([]);

  // Scanner State
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [visualAnalysis, setVisualAnalysis] = useState<VisualAnalysis | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

  // Sensor State
  const [isBluetoothActive, setIsBluetoothActive] = useState(false); // Keeps track if ANY bluetooth device is active
  const [connectedDevices, setConnectedDevices] = useState<string[]>([]);
  const [isVitalCamActive, setIsVitalCamActive] = useState(false);
  
  // Sensor Refs (Multiple Managers for different devices if needed, but we'll reuse one for simplicity or create instances)
  // For this demo, we use specific refs for managing state of connection
  const hrManager = useRef(new BluetoothSensorManager());
  const bpManager = useRef(new BluetoothSensorManager());
  const tempManager = useRef(new BluetoothSensorManager());

  const cameraScanner = useRef(new CameraVitalScanner());
  const vitalVideoRef = useRef<HTMLVideoElement>(document.createElement('video'));
  const vitalCanvasRef = useRef<HTMLCanvasElement>(document.createElement('canvas'));
  
  const isBluetoothActiveRef = useRef(false);
  useEffect(() => { isBluetoothActiveRef.current = isBluetoothActive; }, [isBluetoothActive]);

  // Health Dashboard State
  const [heartRate, setHeartRate] = useState(72);
  const [respirationRate, setRespirationRate] = useState(16);
  const [stressLevel, setStressLevel] = useState(4); // 1-10
  const [bloodPressure, setBloodPressure] = useState({ sys: 120, dia: 80 });
  const [temperature, setTemperature] = useState(36.5); // Celsius
  const [spo2, setSpo2] = useState(98); // %
  
  const [sleepHours, setSleepHours] = useState(7.5);
  const [bmi, setBmi] = useState(0);
  const [weight, setWeight] = useState(70);
  const [height, setHeight] = useState(175);

  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced'>('idle');

  // Chat/Health Intelligence State
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatSessionRef = useRef<Chat | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  // Theme State
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' || 
        (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  // Hospitals State
  const [hospitals, setHospitals] = useState<NearbyHospital[]>([]);
  const [loadingHospitals, setLoadingHospitals] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [specialistQuery, setSpecialistQuery] = useState<string>('Hospitals');

  const recognitionRef = useRef<any>(null);

  // Calculate BMI
  useEffect(() => {
    const heightM = height / 100;
    const calculatedBmi = weight / (heightM * heightM);
    setBmi(parseFloat(calculatedBmi.toFixed(1)));
  }, [weight, height]);

  // Local Auth Check
  useEffect(() => {
    const session = localStorage.getItem('vitalscan_session');
    if (session) {
      try {
        const parsedUser = JSON.parse(session);
        setUser(parsedUser);
        loadHistory(parsedUser.uid);
        
        // Check for tutorial completion
        const tutorialDone = localStorage.getItem('vitalscan_tutorial_completed');
        if (!tutorialDone) {
          setShowTutorial(true);
        }
      } catch (e) {
        console.error("Session parse error", e);
      }
    }
  }, []);

  const handleLogin = (userData: any) => {
    setUser(userData);
    loadHistory(userData.uid);
    const tutorialDone = localStorage.getItem('vitalscan_tutorial_completed');
    if (!tutorialDone) {
      setShowTutorial(true);
    }
  };

  const handleLogout = async () => {
    localStorage.removeItem('vitalscan_session');
    setUser(null);
    window.location.reload();
  };

  const completeTutorial = () => {
    localStorage.setItem('vitalscan_tutorial_completed', 'true');
    setShowTutorial(false);
  };

  const loadHistory = async (uid: string) => {
      const data = await getMedicalHistory(uid);
      setHistory(data);
  };

  // Theme Effect
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  // Voice Synthesis (TTS)
  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.pitch = 1;
      utterance.rate = 1;
      window.speechSynthesis.speak(utterance);
    }
  };

  const fetchPartData = useCallback(async (part: string) => {
    setIsLoading(true);
    try {
      const data = await getBodyPartData(part);
      setPartInfo(data);
      if (data.specialist) {
        setSpecialistQuery(data.specialist + 's');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedPart && (activeTab === 'map' || activeTab === 'checker')) {
      fetchPartData(selectedPart);
    }
  }, [selectedPart, activeTab, fetchPartData]);

  // Sensor Handlers
  const connectDevice = async (type: SensorType, manager: React.MutableRefObject<BluetoothSensorManager>) => {
    try {
        const name = await manager.current.connect(type, (data) => {
            if (type === 'HEART_RATE') setHeartRate(data);
            if (type === 'BLOOD_PRESSURE') setBloodPressure(data);
            if (type === 'THERMOMETER') setTemperature(data);
            if (type === 'OXIMETER') setSpo2(data);
        });
        setConnectedDevices(prev => [...prev, name]);
        setIsBluetoothActive(true);
    } catch (error) {
        console.error(error);
        // Alert handled by browser or silent fail
    }
  };

  const toggleVitalCam = async () => {
    if (isVitalCamActive) {
        cameraScanner.current.stop();
        if (vitalVideoRef.current.srcObject) {
           (vitalVideoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
           vitalVideoRef.current.srcObject = null;
        }
        setIsVitalCamActive(false);
    } else {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          vitalVideoRef.current.srcObject = stream;
          vitalVideoRef.current.play();
          
          setIsVitalCamActive(true);
          
          cameraScanner.current.start(vitalVideoRef.current, vitalCanvasRef.current, (bpm, resp) => {
            if (!connectedDevices.some(d => d.includes("Heart"))) {
                setHeartRate(prev => Math.round((prev * 0.8) + (bpm * 0.2)));
            }
            setRespirationRate(prev => Math.round((prev * 0.9) + (resp * 0.1)));
          });
    
        } catch (error) {
           console.error(error);
           alert("Camera access denied or unavailable.");
           setIsVitalCamActive(false);
        }
    }
  };

  const handleExportReport = () => {
    window.print();
  };

  const handleSyncClinician = async () => {
    setSyncStatus('syncing');
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    setSyncStatus('synced');
    setTimeout(() => setSyncStatus('idle'), 3000);
  };

  // Chat Initialization
  useEffect(() => {
    if (activeTab === 'habits' && !chatSessionRef.current) {
        chatSessionRef.current = createHealthChat();
        if (chatMessages.length === 0) {
            setChatMessages([{
                role: 'model',
                text: "Hello. I am your VitalScan Health Intelligence unit. How can I assist you with your health metrics, symptoms, or wellness queries today?",
                timestamp: new Date()
            }]);
        }
    }
  }, [activeTab]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Camera Management for Visual Scanner
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsCameraActive(true);
      setSelectedImage(null);
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("Unable to access camera. Please check permissions.");
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setIsCameraActive(false);
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        const imageDataType = canvasRef.current.toDataURL('image/jpeg');
        setSelectedImage(imageDataType);
        stopCamera();
        
        // Auto-analyze
        handleImageAnalysis(imageDataType);
      }
    }
  };

  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
      hrManager.current.disconnect();
      bpManager.current.disconnect();
      tempManager.current.disconnect();
      cameraScanner.current.stop();
      if (vitalVideoRef.current.srcObject) {
         (vitalVideoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      }
    };
  }, [cameraStream]);

  // Speech Recognition Setup
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (activeTab === 'checker') {
            setSearchQuery(transcript);
        } else if (activeTab === 'habits') {
            setChatInput(transcript);
        }
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
    return () => {
        if (recognitionRef.current) {
            recognitionRef.current.abort();
        }
    };
  }, [activeTab]);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      if (activeTab === 'checker') setSearchQuery('');
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    try {
      const result = await analyzeSymptoms(searchQuery);
      setAnalysis(result);
      if (user) {
         await saveMedicalHistory(user.uid, {
             date: new Date(),
             symptoms: searchQuery,
             analysis: result,
             type: 'symptom_check'
         });
         loadHistory(user.uid);
      }
      if (result.possibleConditions.length > 0) {
          speak(`Based on my analysis, the most likely condition is ${result.possibleConditions[0].condition}.`);
      }
      if (result.suggestedBodyPart) {
        setSelectedPart(result.suggestedBodyPart);
      }
      if (result.recommendedSpecialist) {
          setSpecialistQuery(result.recommendedSpecialist);
      }
    } catch (error) {
      console.error('Analysis error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !chatSessionRef.current) return;

    const userMsg: ChatMessage = { role: 'user', text: chatInput, timestamp: new Date() };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setIsChatLoading(true);

    try {
      const result: GenerateContentResponse = await chatSessionRef.current.sendMessage({ message: userMsg.text });
      const modelMsg: ChatMessage = { 
          role: 'model', 
          text: result.text || "I apologize, but I couldn't process that request.", 
          timestamp: new Date() 
      };
      setChatMessages(prev => [...prev, modelMsg]);
    } catch (error) {
      console.error("Chat error", error);
      setChatMessages(prev => [...prev, { role: 'model', text: "Network communication error. Please try again.", timestamp: new Date() }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleImageAnalysis = async (base64String: string) => {
    setVisualAnalysis(null);
    const pureBase64 = base64String.split(',')[1];
    setIsLoading(true);
    try {
      const result = await analyzeMedicalImage(pureBase64);
      setVisualAnalysis(result);
    } catch (error) {
      console.error("Image analysis failed", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      setSelectedImage(base64String);
      handleImageAnalysis(base64String);
    };
    reader.readAsDataURL(file);
  };

  const handleFindHospitals = () => {
    setLoadingHospitals(true);
    setLocationError(null);
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      setLoadingHospitals(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const results = await findNearbyHospitals(position.coords.latitude, position.coords.longitude, specialistQuery);
          setHospitals(results);
        } catch (err) {
          console.error(err);
          setLocationError("Failed to fetch nearby hospitals.");
        } finally {
          setLoadingHospitals(false);
        }
      },
      (error) => {
        setLocationError("Unable to retrieve your location. Please allow access.");
        setLoadingHospitals(false);
      }
    );
  };

  const heartRateData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Today'],
    datasets: [{
        label: 'Heart Rate (BPM)',
        data: [70, 72, 68, 74, 71, 69, heartRate],
        borderColor: '#ef4444', 
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        tension: 0.4,
        fill: true,
    }],
  };

  const sleepData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Today'],
    datasets: [{
        label: 'Sleep Duration (Hrs)',
        data: [6.5, 7, 7.5, 6, 8, 9, sleepHours],
        backgroundColor: '#6366f1',
        borderRadius: 8,
    }],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: { display: false },
    },
    scales: {
      y: {
        beginAtZero: false,
        grid: { color: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)' }
      },
      x: { grid: { display: false } }
    }
  };

  const getTrustConfig = (badge: string) => {
    const lower = badge.toLowerCase();
    if (lower.includes('top rated')) return { 
        bg: 'bg-amber-50 dark:bg-amber-900/20', 
        border: 'border-amber-100 dark:border-amber-800', 
        text: 'text-amber-700 dark:text-amber-400',
        icon: <Star size={16} className="fill-current" />,
        label: 'Gold Tier Specialist'
    };
    if (lower.includes('satisfaction') || lower.includes('community')) return { 
        bg: 'bg-rose-50 dark:bg-rose-900/20', 
        border: 'border-rose-100 dark:border-rose-800', 
        text: 'text-rose-700 dark:text-rose-400',
        icon: <Heart size={16} className="fill-current" />,
        label: 'Patient Choice Award'
    };
    if (lower.includes('excellence') || lower.includes('pioneer') || lower.includes('research')) return { 
        bg: 'bg-emerald-50 dark:bg-emerald-900/20', 
        border: 'border-emerald-100 dark:border-emerald-800', 
        text: 'text-emerald-700 dark:text-emerald-400',
        icon: <Trophy size={16} />,
        label: 'Clinical Excellence'
    };
    if (lower.includes('advanced') || lower.includes('tech')) return { 
        bg: 'bg-violet-50 dark:bg-violet-900/20', 
        border: 'border-violet-100 dark:border-violet-800', 
        text: 'text-violet-700 dark:text-violet-400',
        icon: <Zap size={16} />,
        label: 'Advanced Tech'
    };
    return { 
        bg: 'bg-sky-50 dark:bg-sky-900/20', 
        border: 'border-sky-100 dark:border-sky-800', 
        text: 'text-sky-700 dark:text-sky-400',
        icon: <ShieldCheck size={16} />,
        label: 'Board Certified'
    };
  }

  const tabs = [
    { id: 'map', label: 'Body Map', icon: <User size={18} /> },
    { id: 'checker', label: 'Inference', icon: <BrainCircuit size={18} /> },
    { id: 'scanner', label: 'Bio-Optic', icon: <ScanEye size={18} /> },
    { id: 'habits', label: 'Intelligence', icon: <Globe size={18} /> },
    { id: 'hospitals', label: 'Clinics', icon: <MapPin size={18} /> },
  ];

  if (!user) {
      return <Auth onLogin={handleLogin} />;
  }

  const isSensorActive = isBluetoothActive || isVitalCamActive;

  return (
    <div className="app-viewport bg-[#fcfdff] dark:bg-slate-950 selection:bg-sky-100 dark:selection:bg-sky-900 selection:text-sky-900 dark:selection:text-sky-100 transition-colors duration-300">
      
      {/* Hidden Print Report View */}
      <div className="hidden print:block p-8 bg-white text-black h-screen">
          <div className="text-center border-b-2 border-black pb-6 mb-6">
              <h1 className="text-3xl font-bold">VitalScan AI - Comprehensive Patient Report</h1>
              <p className="text-sm mt-2 text-gray-600">Generated: {new Date().toLocaleString()}</p>
              <p className="text-sm text-gray-600">Patient ID: {user.email}</p>
          </div>
          <div className="grid grid-cols-2 gap-8 mb-8">
              <div className="p-4 border border-gray-200 rounded-lg">
                  <h2 className="text-xl font-bold mb-4">Vitals Snapshot</h2>
                  <ul className="space-y-2">
                      <li className="flex justify-between"><span>Heart Rate:</span> <strong>{heartRate} BPM</strong></li>
                      <li className="flex justify-between"><span>Blood Pressure:</span> <strong>{bloodPressure.sys}/{bloodPressure.dia} mmHg</strong></li>
                      <li className="flex justify-between"><span>Temperature:</span> <strong>{temperature}°C</strong></li>
                      <li className="flex justify-between"><span>SpO2:</span> <strong>{spo2}%</strong></li>
                      <li className="flex justify-between"><span>Respiration:</span> <strong>{respirationRate} /min</strong></li>
                  </ul>
              </div>
              <div className="p-4 border border-gray-200 rounded-lg">
                  <h2 className="text-xl font-bold mb-4">Wellness Metrics</h2>
                  <ul className="space-y-2">
                      <li className="flex justify-between"><span>Sleep Average:</span> <strong>{sleepHours} hrs</strong></li>
                      <li className="flex justify-between"><span>Stress Index:</span> <strong>{stressLevel}/10</strong></li>
                      <li className="flex justify-between"><span>BMI:</span> <strong>{bmi}</strong></li>
                  </ul>
              </div>
          </div>
          <div>
              <h2 className="text-xl font-bold mb-4">Recent Medical History</h2>
              <table className="w-full text-left border-collapse">
                  <thead>
                      <tr className="border-b border-black">
                          <th className="py-2">Date</th>
                          <th className="py-2">Type</th>
                          <th className="py-2">Findings</th>
                      </tr>
                  </thead>
                  <tbody>
                      {history.slice(0,5).map((h, i) => (
                          <tr key={i} className="border-b border-gray-200">
                              <td className="py-2">{new Date(h.date).toLocaleDateString()}</td>
                              <td className="py-2">{h.type === 'symptom_check' ? 'Symptom Analysis' : 'Visual Scan'}</td>
                              <td className="py-2">{h.symptoms || h.analysis?.possibleConditions?.[0]?.condition}</td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
          <div className="mt-12 text-center text-xs text-gray-500">
              <p>Disclaimer: This report is generated by AI and sensor data. Verify with a medical professional.</p>
          </div>
      </div>

      {showTutorial && <Onboarding onComplete={completeTutorial} />}

      <div className="no-print bg-slate-900 dark:bg-black text-white text-[9px] py-1.5 px-4 text-center font-black tracking-[0.3em] flex items-center justify-center gap-4 shrink-0 uppercase flicker">
        <Sparkles size={12} className="text-sky-400" />
        VitalScan AI System Active // User: {user.email} // Mode: LOCAL_SECURE
      </div>

      <header className="no-print bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl border-b border-slate-100 dark:border-slate-800 sticky top-0 z-40 shrink-0 transition-colors duration-300">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-10 h-16 sm:h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4 cursor-pointer group" onClick={() => setActiveTab('map')}>
            <div className="bg-sky-500 p-2 sm:p-2.5 rounded-2xl text-white shadow-[0_0_20px_rgba(14,165,233,0.3)] group-hover:scale-105 transition-transform duration-500">
              <Heart size={20} fill="currentColor" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tighter leading-none transition-colors">
                VitalScan<span className="text-sky-500">AI</span>
              </h1>
              <span className="text-[8px] sm:text-[10px] font-black text-slate-400 tracking-[0.3em] uppercase opacity-70">Medical Inference Engine</span>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-8">
            <nav id="tour-navigation" className="flex items-center gap-10 text-[13px] font-black text-slate-400 uppercase tracking-widest px-4">
              {['Home', 'Checker', 'Scanner'].map((item, idx) => (
                <button 
                  key={item}
                  onClick={() => setActiveTab(idx === 0 ? 'map' : idx === 1 ? 'checker' : 'scanner')}
                  className={`hover:text-sky-600 dark:hover:text-sky-400 transition-all duration-300 relative py-2 ${activeTab === (idx === 0 ? 'map' : idx === 1 ? 'checker' : 'scanner') ? 'text-sky-600 dark:text-sky-400' : ''}`}
                >
                  {item}
                </button>
              ))}
            </nav>
            <div className="h-6 w-px bg-slate-200 dark:bg-slate-700" />
            
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-full text-slate-500 hover:text-sky-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            >
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <button 
              onClick={() => setActiveTab('profile')}
              className={`flex items-center gap-3 pl-2 pr-6 py-2 rounded-full text-[12px] font-black uppercase tracking-widest transition-all duration-500 border-2 ${
                activeTab === 'profile' 
                ? 'bg-slate-900 dark:bg-white border-slate-900 dark:border-white text-white dark:text-slate-900 shadow-xl' 
                : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-500 dark:text-slate-300 hover:border-sky-300 dark:hover:border-sky-500'
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-sky-50 dark:bg-slate-700 flex items-center justify-center text-sky-600 dark:text-sky-400 shadow-inner">
                <User size={14} />
              </div>
              Profile
            </button>
          </div>

          <div className="flex lg:hidden items-center gap-4">
            <button className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 shadow-sm" onClick={() => setShowMobileNav(!showMobileNav)}>
              {showMobileNav ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </header>

      <div className="no-print bg-white/50 dark:bg-slate-900/50 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 sticky top-16 sm:top-20 z-30 overflow-x-auto no-scrollbar shrink-0 transition-colors duration-300">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-10 flex items-center justify-between gap-6 sm:gap-12 h-14">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex items-center gap-3 h-full transition-all text-[11px] sm:text-[12px] font-black whitespace-nowrap border-b-2 tracking-widest uppercase group shrink-0 ${
                activeTab === tab.id 
                  ? 'border-sky-500 text-sky-600 dark:text-sky-400' 
                  : 'border-transparent text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
              }`}
            >
              <div className={`p-1.5 rounded-lg transition-colors ${activeTab === tab.id ? 'bg-sky-50 dark:bg-sky-900/30 text-sky-500 dark:text-sky-400' : 'group-hover:bg-slate-100 dark:group-hover:bg-slate-800'}`}>
                {tab.icon}
              </div>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <main className="no-print flex-1 w-full max-w-screen-2xl mx-auto p-4 sm:p-8 lg:p-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-start h-full">
          
          {activeTab !== 'profile' && activeTab !== 'scanner' && activeTab !== 'habits' && (
            <div className="lg:col-span-5 space-y-8 lg:sticky lg:top-40 transition-all duration-700 no-print">
              
              {activeTab === 'map' && (
                <div id="tour-bio-scanner" className="bg-white dark:bg-slate-900 p-6 sm:p-10 rounded-[3.5rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.05)] border border-slate-50 dark:border-slate-800 relative overflow-hidden group transition-colors">
                  <div className="flex items-center justify-between mb-10">
                    <div className="space-y-1">
                      <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">Bio-Scanner</h2>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Select Anatomical Region</p>
                    </div>
                    <button 
                      onClick={() => setView(view === BodyView.FRONT ? BodyView.BACK : BodyView.FRONT)}
                      className="flex items-center gap-3 px-6 py-3 bg-slate-900 dark:bg-slate-800 text-white rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest hover:bg-sky-600 dark:hover:bg-sky-600 transition-all active:scale-95 shadow-xl shadow-slate-200 dark:shadow-none"
                    >
                      <RotateCcw size={14} />
                      {view} View
                    </button>
                  </div>
                  
                  <div className="w-full aspect-[1/1.5] relative">
                    <BodyMap 
                      view={view} 
                      selectedPart={selectedPart} 
                      onPartClick={(part) => {
                        setSelectedPart(part);
                        setAnalysis(null);
                      }} 
                      isScanning={isLoading}
                    />
                  </div>
                </div>
              )}

              {(activeTab === 'checker' || activeTab === 'map') && (
                <div id="tour-inference-engine" className="bg-slate-900 dark:bg-slate-950 p-8 sm:p-12 rounded-[3.5rem] shadow-2xl text-white relative overflow-hidden group border border-slate-800">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-sky-500/10 blur-[80px] rounded-full -z-10" />
                  <div className="relative z-10 space-y-8">
                    <h3 className="text-2xl font-black flex items-center gap-4 tracking-tighter">
                      <div className="p-3 bg-sky-500/20 rounded-2xl text-sky-400 shadow-[0_0_20px_rgba(14,165,233,0.2)]">
                        <BrainCircuit size={26} />
                      </div>
                      ML Inference Engine
                    </h3>
                    <form onSubmit={handleSearch} className="space-y-5">
                      <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-1 group">
                          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-sky-400 transition-colors" size={20} />
                          <input 
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            disabled={isLoading}
                            placeholder={isListening ? "Awaiting Signal..." : "Describe symptoms..."}
                            className={`w-full pl-14 pr-6 py-5 bg-white/5 border border-white/10 rounded-[2rem] placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-sky-500/40 text-sm font-semibold tracking-tight transition-all duration-300 ${isListening ? 'ring-2 ring-rose-500/50 bg-rose-500/5' : ''}`}
                          />
                        </div>
                        <button 
                          type="button"
                          onClick={toggleListening}
                          disabled={isLoading}
                          className={`flex items-center justify-center p-5 rounded-[2rem] border transition-all duration-300 ${
                            isListening 
                            ? 'bg-rose-500 border-rose-400 text-white shadow-2xl shadow-rose-500/40' 
                            : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
                          }`}
                        >
                          {isListening ? <MicOff size={24} /> : <Mic size={24} />}
                        </button>
                      </div>
                      <button 
                        type="submit"
                        disabled={isLoading || !searchQuery.trim()}
                        className="w-full py-5 bg-sky-500 text-white font-black rounded-[2.5rem] shadow-2xl shadow-sky-500/30 hover:bg-sky-400 transition-all duration-500 disabled:opacity-50 uppercase tracking-[0.2em] text-[11px] active:scale-[0.98]"
                      >
                        {isLoading ? (
                          <div className="flex items-center justify-center gap-4">
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Running ML Models
                          </div>
                        ) : 'Initiate Analysis'}
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}
          
          <div className={`${(activeTab === 'profile' || activeTab === 'scanner' || activeTab === 'habits') ? 'lg:col-span-12' : 'lg:col-span-7'} w-full transition-all duration-1000 min-h-[600px]`}>
            {activeTab === 'profile' ? (
              <div className="max-w-5xl mx-auto space-y-12 py-8 result-entrance">
                <div className="bg-white dark:bg-slate-900 p-12 sm:p-16 rounded-[4.5rem] border border-slate-100 dark:border-slate-800 shadow-2xl flex flex-col md:flex-row items-center gap-16 relative overflow-hidden group transition-colors">
                  <div className="flex-1 text-center md:text-left space-y-6">
                    <h2 className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter">Patient Record</h2>
                    <p className="text-slate-400 font-bold text-lg">{user.email}</p>
                    <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                        <button 
                            onClick={handleExportReport} 
                            className="px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-sky-500 dark:hover:bg-sky-400 hover:text-white transition-all shadow-lg flex items-center gap-2"
                        >
                            <Printer size={14} /> Export Report
                        </button>
                        <button 
                            onClick={handleSyncClinician} 
                            disabled={syncStatus !== 'idle'}
                            className={`px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg flex items-center gap-2 ${
                                syncStatus === 'synced' ? 'bg-emerald-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'
                            }`}
                        >
                            {syncStatus === 'syncing' && <div className="w-3 h-3 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />}
                            {syncStatus === 'synced' ? <Check size={14} /> : <Share2 size={14} />}
                            {syncStatus === 'synced' ? 'Synced to Portal' : syncStatus === 'syncing' ? 'Syncing...' : 'Clinician Sync'}
                        </button>
                        <button 
                            onClick={handleLogout} 
                            className="px-6 py-3 bg-rose-50 dark:bg-rose-900/20 text-rose-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-rose-100 dark:hover:bg-rose-900/40"
                        >
                            Terminate Session
                        </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-4">
                     <div className="flex items-center gap-4">
                         <Activity className="text-sky-500" size={32} />
                         <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">Health Dashboard</h3>
                     </div>
                     
                     <div className="flex gap-2 flex-wrap justify-end">
                        <button 
                            onClick={() => connectDevice('HEART_RATE', hrManager)}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl font-bold text-[10px] uppercase tracking-wider hover:bg-sky-500 hover:text-white transition-all"
                        >
                            <Heart size={14} /> + ECG/HR
                        </button>
                        <button 
                            onClick={() => connectDevice('BLOOD_PRESSURE', bpManager)}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl font-bold text-[10px] uppercase tracking-wider hover:bg-sky-500 hover:text-white transition-all"
                        >
                            <Activity size={14} /> + BP Monitor
                        </button>
                        <button 
                            onClick={() => connectDevice('THERMOMETER', tempManager)}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl font-bold text-[10px] uppercase tracking-wider hover:bg-sky-500 hover:text-white transition-all"
                        >
                            <Thermometer size={14} /> + Temp
                        </button>
                        
                        <button 
                            onClick={toggleVitalCam}
                            className={`flex items-center gap-2 px-5 py-3 rounded-[1.5rem] font-black uppercase text-[10px] tracking-widest shadow-lg transition-all ${
                                isVitalCamActive 
                                ? 'bg-rose-500 text-white shadow-rose-500/30 hover:bg-rose-600 animate-pulse' 
                                : 'bg-indigo-500 text-white shadow-indigo-500/30 hover:bg-indigo-400'
                            }`}
                        >
                            {isVitalCamActive ? <Disc className="animate-spin" size={14} /> : <Video size={14} />}
                            {isVitalCamActive ? 'Stop VitalCam' : 'VitalCam'}
                        </button>
                     </div>
                  </div>

                  {!isSensorActive ? (
                      <div className="py-20 flex flex-col items-center justify-center text-center space-y-6 bg-slate-50 dark:bg-slate-900/50 rounded-[3rem] border border-dashed border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95">
                        <div className="relative">
                            <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-300 dark:text-slate-600">
                                <Activity size={40} />
                            </div>
                            <div className="absolute top-0 right-0 w-6 h-6 bg-rose-500 rounded-full border-4 border-white dark:border-slate-900 animate-ping" />
                        </div>
                        <div className="space-y-2 max-w-md mx-auto px-4">
                            <h4 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Dashboard Offline</h4>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                                Live biometric visualization requires an active sensor data stream. Please connect a Wearable or start VitalCam.
                            </p>
                        </div>
                      </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-in slide-in-from-bottom-4">
                        {/* Heart Rate */}
                        <div className={`bg-white dark:bg-slate-900 p-6 rounded-[2rem] border transition-all duration-500 shadow-sm relative overflow-hidden ${
                            (isBluetoothActive || isVitalCamActive) ? 'border-sky-500 ring-2 ring-sky-500/20' : 'border-slate-100 dark:border-slate-800'
                        }`}>
                            {(isBluetoothActive || isVitalCamActive) && <div className="absolute top-0 right-0 p-2"><div className="w-2 h-2 bg-rose-500 rounded-full animate-ping" /></div>}
                            <div className="flex items-center gap-2 mb-2 text-rose-500">
                              <Heart size={18} fill="currentColor" className={(isBluetoothActive || isVitalCamActive) ? "animate-pulse" : ""} />
                              <span className="text-[10px] font-black uppercase tracking-widest">Heart Rate</span>
                            </div>
                            <input 
                              type="number" 
                              value={heartRate} 
                              readOnly
                              className="text-3xl font-black bg-transparent w-full outline-none text-slate-900 dark:text-white"
                            />
                            <span className="text-xs text-slate-400 font-bold">BPM</span>
                        </div>
                        
                        {/* Blood Pressure */}
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden">
                             <div className="flex items-center gap-2 mb-2 text-sky-500">
                               <Activity size={18} />
                               <span className="text-[10px] font-black uppercase tracking-widest">BP</span>
                             </div>
                             <div className="flex items-baseline gap-1">
                                <span className="text-3xl font-black text-slate-900 dark:text-white">{bloodPressure.sys}</span>
                                <span className="text-xl font-bold text-slate-400">/</span>
                                <span className="text-2xl font-bold text-slate-500">{bloodPressure.dia}</span>
                             </div>
                             <span className="text-xs text-slate-400 font-bold">mmHg</span>
                        </div>

                        {/* Temperature */}
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm">
                             <div className="flex items-center gap-2 mb-2 text-amber-500">
                               <Thermometer size={18} />
                               <span className="text-[10px] font-black uppercase tracking-widest">Temp</span>
                             </div>
                             <div className="text-3xl font-black text-slate-900 dark:text-white">{temperature}°</div>
                             <span className="text-xs text-slate-400 font-bold">Celsius</span>
                        </div>

                        {/* SpO2 */}
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm">
                             <div className="flex items-center gap-2 mb-2 text-indigo-500">
                               <Droplets size={18} />
                               <span className="text-[10px] font-black uppercase tracking-widest">SpO2</span>
                             </div>
                             <div className="text-3xl font-black text-slate-900 dark:text-white">{spo2}%</div>
                             <span className="text-xs text-slate-400 font-bold">Oxygen Sat.</span>
                        </div>

                        {/* Respiration */}
                        <div className={`bg-white dark:bg-slate-900 p-6 rounded-[2rem] border transition-all duration-500 shadow-sm relative overflow-hidden ${
                            isVitalCamActive ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-slate-100 dark:border-slate-800'
                        }`}>
                            <div className="flex items-center gap-2 mb-2 text-emerald-500">
                              <Scale size={18} />
                              <span className="text-[10px] font-black uppercase tracking-widest">Respiration</span>
                            </div>
                            <div className="text-3xl font-black text-slate-900 dark:text-white">{isVitalCamActive ? respirationRate : 16}</div>
                            <span className="text-xs text-slate-400 font-bold">Breaths/min</span>
                        </div>

                         {/* Stress */}
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm">
                            <div className="flex items-center gap-2 mb-2 text-rose-500">
                              <BrainCircuit size={18} />
                              <span className="text-[10px] font-black uppercase tracking-widest">Stress Lvl</span>
                            </div>
                            <input 
                              type="range" min="1" max="10" 
                              value={stressLevel} 
                              onChange={(e) => setStressLevel(Number(e.target.value))}
                              className="w-full accent-rose-500 h-2 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer"
                            />
                            <div className="text-3xl font-black text-slate-900 dark:text-white mt-2">{stressLevel}<span className="text-sm text-slate-400">/10</span></div>
                        </div>
                      </div>

                      {/* Charts Row */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in slide-in-from-bottom-8">
                        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-lg">
                            <div className="mb-6 flex items-center justify-between">
                              <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Heart Rate Trend</h4>
                              <div className="p-2 bg-rose-50 dark:bg-rose-900/20 text-rose-500 rounded-xl"><Activity size={16} /></div>
                            </div>
                            <div className="h-64 w-full">
                              <Line data={heartRateData} options={chartOptions} />
                            </div>
                        </div>
                        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-lg">
                            <div className="mb-6 flex items-center justify-between">
                              <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Sleep Hygiene</h4>
                              <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500 rounded-xl"><MoonIcon size={16} /></div>
                            </div>
                            <div className="h-64 w-full">
                              <Bar data={sleepData} options={chartOptions} />
                            </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
                
                <div className="space-y-6">
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white pl-4">Inference History</h3>
                    <div className="grid grid-cols-1 gap-4">
                        {history.map((item, idx) => (
                            <div key={idx} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 flex justify-between items-center">
                                <div>
                                    <p className="font-bold text-slate-900 dark:text-white">{item.symptoms}</p>
                                    <p className="text-xs text-slate-400">{new Date(item.date).toLocaleDateString()} - {item.type}</p>
                                </div>
                                <div className="text-xs font-black uppercase text-sky-500 bg-sky-50 dark:bg-sky-900/20 px-3 py-1 rounded-lg">
                                    {item.analysis?.possibleConditions?.[0]?.condition || 'Analyzed'}
                                </div>
                            </div>
                        ))}
                        {history.length === 0 && (
                            <div className="text-center text-slate-400 py-10">No medical history recorded.</div>
                        )}
                    </div>
                </div>
              </div>
            ) : activeTab === 'scanner' ? (
              <div className="max-w-4xl mx-auto space-y-12 py-8 result-entrance">
                   <div className="text-center space-y-4 mb-8">
                  <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter flex items-center justify-center gap-4">
                    <ScanEye className="text-sky-500" size={48} />
                    Bio-Optic Scanner
                  </h2>
                  <p className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest text-xs">
                    Multimodal Optical Analysis Engine
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Upload Zone / Camera */}
                  <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-xl flex flex-col items-center justify-center text-center space-y-6 min-h-[400px]">
                    {isCameraActive ? (
                      <div className="relative w-full h-full rounded-[2rem] overflow-hidden bg-black flex items-center justify-center">
                         <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                         <canvas ref={canvasRef} className="hidden" />
                         <div className="absolute bottom-4 flex gap-4">
                            <button onClick={captureImage} className="p-4 bg-white rounded-full shadow-lg hover:scale-110 transition-transform">
                              <div className="w-4 h-4 bg-red-500 rounded-full border-2 border-white" />
                            </button>
                            <button onClick={stopCamera} className="p-3 bg-slate-800/50 text-white rounded-full backdrop-blur-md">
                              <X size={20} />
                            </button>
                         </div>
                      </div>
                    ) : selectedImage ? (
                      <div className="relative w-full h-full min-h-[300px] rounded-[2rem] overflow-hidden group">
                        <img src={selectedImage} alt="Analysis Target" className="w-full h-full object-cover" />
                        <button 
                          onClick={() => { setSelectedImage(null); setVisualAnalysis(null); }}
                          className="absolute top-4 right-4 p-3 bg-black/50 text-white rounded-full hover:bg-rose-500 transition-colors backdrop-blur-md"
                        >
                          <X size={20} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-6 w-full h-full items-center justify-center">
                        <label className="w-full flex-1 flex flex-col items-center justify-center cursor-pointer group hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-[2rem] transition-colors border-2 border-dashed border-slate-200 dark:border-slate-700">
                          <div className="w-20 h-20 bg-sky-50 dark:bg-sky-900/20 rounded-[2rem] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                            <Upload size={32} className="text-sky-500" />
                          </div>
                          <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">Upload Image</h3>
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest max-w-[200px]">
                            Skin conditions, injuries
                          </p>
                          <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                        </label>
                        
                        <div className="w-full flex items-center gap-4">
                           <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
                           <span className="text-[10px] font-bold text-slate-400 uppercase">OR</span>
                           <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
                        </div>

                        <button 
                          onClick={startCamera}
                          className="w-full py-4 bg-slate-900 dark:bg-slate-800 text-white rounded-[2rem] font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:bg-sky-500 transition-colors"
                        >
                           <Camera size={18} />
                           Use Webcam
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Analysis Result */}
                  <div className="bg-slate-900 dark:bg-slate-950 p-8 rounded-[3rem] border border-slate-800 shadow-2xl text-white relative overflow-hidden">
                     {isLoading ? (
                       <div className="h-full flex flex-col items-center justify-center space-y-6">
                         <div className="relative">
                            <div className="w-20 h-20 border-4 border-sky-500/30 border-t-sky-500 rounded-full animate-spin" />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <ScanEye size={24} className="text-sky-500 animate-pulse" />
                            </div>
                         </div>
                         <p className="text-sky-400 font-black uppercase tracking-[0.3em] text-[10px] animate-pulse">Processing Optical Data...</p>
                       </div>
                     ) : visualAnalysis ? (
                       <div className="space-y-6 h-full flex flex-col animate-in fade-in slide-in-from-bottom-4">
                         <div className="flex items-center justify-between">
                            <h3 className="text-2xl font-black tracking-tight">Scan Results</h3>
                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                              visualAnalysis.severityAssessment.toLowerCase().includes('high') ? 'bg-rose-500' : 'bg-emerald-500'
                            }`}>
                              {visualAnalysis.severityAssessment} Concern
                            </span>
                         </div>
                         
                         <div className="space-y-4 flex-1 overflow-y-auto no-scrollbar pr-2">
                            <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                              <span className="text-[10px] text-sky-400 font-black uppercase tracking-widest block mb-2">Visual Observations</span>
                              <p className="text-sm font-medium text-slate-300 leading-relaxed">{visualAnalysis.visualDescription}</p>
                            </div>

                            <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                              <span className="text-[10px] text-indigo-400 font-black uppercase tracking-widest block mb-2">Possible Conditions</span>
                              <ul className="space-y-2">
                                {visualAnalysis.potentialConditions.map((cond, i) => (
                                  <li key={i} className="flex items-center gap-2 text-sm text-white font-bold">
                                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full" /> {cond}
                                  </li>
                                ))}
                              </ul>
                            </div>

                            <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                              <span className="text-[10px] text-emerald-400 font-black uppercase tracking-widest block mb-2">Recommended Protocol</span>
                              <p className="text-sm font-medium text-slate-300 leading-relaxed">{visualAnalysis.recommendation}</p>
                            </div>
                         </div>
                         
                         <div className="pt-4 border-t border-white/10">
                           <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wide flex items-start gap-2">
                             <AlertTriangle size={12} className="shrink-0 mt-0.5" /> 
                             {visualAnalysis.disclaimer}
                           </p>
                         </div>
                       </div>
                     ) : (
                       <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
                         <ImageIcon size={48} className="mb-4 text-slate-600" />
                         <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Awaiting Visual Input</p>
                       </div>
                     )}
                  </div>
                </div>
              </div>
            ) : (
              // Main Tab (Checker / Map)
              <div className="bg-white dark:bg-slate-900 p-6 sm:p-12 lg:p-16 rounded-[3rem] md:rounded-[4.5rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.06)] border border-slate-50 dark:border-slate-800 min-h-screen lg:min-h-[700px] flex flex-col overflow-visible transition-colors">
                {analysis && activeTab === 'checker' && (
                  <div className={`mb-12 p-8 md:p-10 rounded-[2.5rem] md:rounded-[3.5rem] border-2 result-entrance ${
                    analysis.severity === 'High' ? 'bg-rose-50/50 dark:bg-rose-900/10 border-rose-100 dark:border-rose-900/30' : 'bg-sky-50/50 dark:bg-sky-900/10 border-sky-100 dark:border-sky-900/30'
                  }`}>
                    <div className="flex flex-col md:flex-row items-start gap-8 md:gap-10">
                      <div className={`p-5 md:p-6 rounded-[2rem] shadow-2xl transition-all duration-700 ${
                        analysis.severity === 'High' ? 'bg-rose-500 text-white shadow-rose-200 dark:shadow-rose-900/50' : 'bg-sky-500 text-white'
                      }`}>
                        <Sparkles size={28} />
                      </div>
                      <div className="flex-1 space-y-5 md:space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 md:gap-6">
                          <h4 className="font-black text-slate-900 dark:text-white text-2xl md:text-3xl tracking-tighter">Analysis Results</h4>
                          <div className="flex gap-2">
                              <button onClick={() => speak(`The primary prediction is ${analysis.possibleConditions[0].condition} with ${analysis.possibleConditions[0].probability} percent confidence.`)} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full hover:text-sky-500">
                                  <Volume2 size={16} />
                              </button>
                              <span className={`text-[9px] md:text-[10px] px-5 md:px-6 py-2 rounded-full font-black uppercase tracking-widest inline-block ${
                                analysis.severity === 'High' ? 'bg-rose-500 text-white shadow-lg' : 'bg-sky-500 text-white shadow-lg'
                              }`}>
                                {analysis.severity} Priority
                              </span>
                          </div>
                        </div>

                        {/* ML Prediction Cards */}
                        <div className="space-y-4">
                           {analysis.possibleConditions.map((cond, idx) => (
                               <div key={idx} className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700">
                                   <div className="flex justify-between items-center mb-2">
                                       <span className="font-black text-lg text-slate-900 dark:text-white">{cond.condition}</span>
                                       <span className="font-mono text-sm font-bold text-sky-500">{cond.probability}% Conf.</span>
                                   </div>
                                   <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden mb-3">
                                       <div className="bg-sky-500 h-full rounded-full" style={{ width: `${cond.probability}%` }}></div>
                                   </div>
                                   <p className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                                       <span className="font-black uppercase text-[9px] text-slate-400 block mb-1">Explainable AI Logic:</span>
                                       {cond.reasoning}
                                   </p>
                               </div>
                           ))}
                        </div>

                        {/* Dynamic Specialist Recommendation Card */}
                        {analysis.recommendedSpecialist && (
                          <div className="flex items-center gap-4 bg-indigo-50 dark:bg-indigo-900/10 p-5 rounded-[2rem] border border-indigo-100 dark:border-indigo-900/30 mt-4 shadow-sm animate-in slide-in-from-bottom-2">
                              <div className="p-3 bg-indigo-500 rounded-2xl text-white shadow-lg shadow-indigo-500/20">
                                  <Stethoscope size={20} />
                              </div>
                              <div>
                                  <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400 block mb-1">Recommended Specialist</span>
                                  <span className="text-lg font-black text-slate-900 dark:text-white tracking-tight">{analysis.recommendedSpecialist}</span>
                              </div>
                          </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 pt-4 md:pt-6">
                          {analysis.immediateActions.map((action, i) => (
                            <div key={i} className="flex items-center gap-4 text-[10px] md:text-[11px] font-black text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 p-4 md:p-5 rounded-[1.5rem] border border-slate-100 dark:border-slate-700 shadow-sm uppercase tracking-wider hover:border-sky-300 dark:hover:border-sky-600 transition-colors">
                              <div className={`w-3 h-3 rounded-full shrink-0 ${analysis.severity === 'High' ? 'bg-rose-400' : 'bg-sky-400'}`} />
                              {action}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {(activeTab === 'map' || activeTab === 'checker') ? (
                  partInfo ? (
                    <div className="flex-1 overflow-visible">
                      <InfoCard data={partInfo} isLoading={isLoading} />
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center py-20 lg:py-40 text-center space-y-10 result-entrance">
                      <div className="relative bg-slate-50 dark:bg-slate-800 p-14 rounded-[4rem] border border-slate-100 dark:border-slate-700 shadow-inner group transition-colors">
                        <div className="absolute inset-0 bg-sky-200 dark:bg-sky-900 blur-[80px] opacity-10 group-hover:opacity-30 transition-opacity" />
                        <Info className="text-slate-200 dark:text-slate-600 relative z-10" size={90} />
                      </div>
                      <div className="space-y-6">
                        <h3 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase">Bio-Analytics Engine</h3>
                        <p className="text-slate-400 dark:text-slate-500 font-bold max-w-sm mx-auto text-xs sm:text-sm leading-relaxed uppercase tracking-[0.2em] opacity-80">
                          Select anatomical region or input active symptoms for high-fidelity awareness report.
                        </p>
                      </div>
                    </div>
                  )
                ) : activeTab === 'habits' ? (
                  <div className="h-[calc(100vh-250px)] min-h-[500px] flex flex-col result-entrance max-w-5xl mx-auto w-full">
                    {/* Header */}
                    <div className="mb-6 space-y-3 text-center md:text-left flex-shrink-0">
                      <h2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tighter flex items-center justify-center md:justify-start gap-4">
                        <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl text-indigo-500 shadow-sm"><MessageSquare size={32} /></div>
                        Health Intelligence
                      </h2>
                      <p className="text-slate-400 font-black uppercase tracking-[0.4em] text-[9px] md:text-[11px] ml-2">AI-Powered Medical Guide</p>
                    </div>

                    {/* Chat Container */}
                    <div className="flex-1 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-lg flex flex-col overflow-hidden relative">
                       {/* Messages Area */}
                       <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 scroll-smooth">
                          {chatMessages.map((msg, idx) => (
                             <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] md:max-w-[70%] p-5 md:p-6 rounded-[2rem] text-sm md:text-base font-medium leading-relaxed ${
                                    msg.role === 'user' 
                                    ? 'bg-indigo-500 text-white rounded-br-sm shadow-xl shadow-indigo-500/20' 
                                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-bl-sm border border-slate-100 dark:border-slate-700'
                                }`}>
                                    <p className="whitespace-pre-wrap">{msg.text}</p>
                                    <div className={`mt-2 text-[9px] font-bold uppercase tracking-widest opacity-60 ${msg.role === 'user' ? 'text-indigo-100' : 'text-slate-400'}`}>
                                        {msg.role === 'user' ? 'You' : 'VitalScan AI'} • {msg.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </div>
                                </div>
                             </div>
                          ))}
                          {isChatLoading && (
                              <div className="flex justify-start">
                                  <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-[2rem] rounded-bl-sm border border-slate-100 dark:border-slate-700 flex gap-2 items-center">
                                      <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                                      <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                                      <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                                  </div>
                              </div>
                          )}
                          <div ref={chatEndRef} />
                       </div>

                       {/* Input Area */}
                       <div className="p-4 md:p-6 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800">
                          <form onSubmit={handleChatSubmit} className="flex gap-4 relative">
                             <div className="relative flex-1">
                                <input 
                                   type="text" 
                                   value={chatInput}
                                   onChange={(e) => setChatInput(e.target.value)}
                                   placeholder="Ask follow-up questions or describe symptoms..."
                                   disabled={isChatLoading}
                                   className="w-full pl-6 pr-14 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-[2rem] outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-900 dark:text-white transition-all disabled:opacity-60"
                                />
                                <button 
                                  type="button"
                                  onClick={toggleListening}
                                  className={`absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full transition-all ${
                                    isListening 
                                      ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30' 
                                      : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-indigo-500'
                                  }`}
                                  title={isListening ? "Stop Listening" : "Voice Input"}
                                >
                                  {isListening ? <MicOff size={18} className="animate-pulse" /> : <Mic size={18} />}
                                </button>
                             </div>
                             <button 
                                type="submit"
                                disabled={!chatInput.trim() || isChatLoading}
                                className="p-4 bg-indigo-500 text-white rounded-[2rem] shadow-xl shadow-indigo-500/20 hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 flex items-center justify-center aspect-square"
                             >
                                <Send size={20} className={isChatLoading ? 'opacity-0' : ''} />
                                {isChatLoading && <div className="absolute w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                             </button>
                          </form>
                       </div>
                    </div>
                  </div>
                ) : (
                    // Hospitals Tab (Keep existing code)
                    <div className="space-y-10 md:space-y-16 result-entrance h-full flex flex-col">
                        {/* Medical Authority Header */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 p-8 bg-slate-900 dark:bg-slate-950 text-white rounded-[3rem] shadow-xl relative overflow-hidden group">
                           <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl -z-10 group-hover:bg-sky-500/20 transition-colors duration-700" />
                           <div className="p-4 bg-white/10 rounded-2xl border border-white/10 backdrop-blur-md">
                              <Award size={32} className="text-sky-400" />
                           </div>
                           <div className="flex-1 space-y-2">
                              <h3 className="font-black text-2xl tracking-tighter">VitalScan Medical Authority</h3>
                              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Verified Network & Physician Approved Logic</p>
                              <div className="flex items-center gap-2 pt-2">
                                  <div className="flex -space-x-2">
                                      {[1,2,3].map(i => (
                                          <div key={i} className="w-6 h-6 rounded-full bg-slate-700 border-2 border-slate-900 flex items-center justify-center text-[8px] font-bold text-slate-400">MD</div>
                                      ))}
                                  </div>
                                  <span className="text-[10px] font-bold text-sky-500">Board Certified Review</span>
                              </div>
                           </div>
                           <div className="hidden sm:block opacity-30 rotate-[-12deg]">
                              <FileSignature size={80} /> 
                           </div>
                        </div>

                        {!hospitals.length && !loadingHospitals ? (
                            <div className="flex-1 p-8 md:p-14 bg-sky-50/40 dark:bg-sky-900/10 rounded-[3rem] md:rounded-[4rem] border border-sky-100/60 dark:border-sky-900/30 flex flex-col items-center justify-center text-center relative group min-h-[400px]">
                                <div className="w-20 md:w-24 h-20 md:h-24 bg-white dark:bg-slate-800 rounded-[2rem] md:rounded-[2.5rem] shadow-xl flex items-center justify-center mb-8 md:mb-10 group-hover:-translate-y-2 transition-transform duration-500">
                                <MapPin size={36} className="text-sky-500" />
                                </div>
                                
                                <h3 className="text-slate-900 dark:text-white font-black text-2xl md:text-3xl mb-3 tracking-tighter">Find Local Care</h3>
                                <p className="text-slate-400 dark:text-slate-500 font-bold text-xs uppercase tracking-widest mb-10 max-w-sm mx-auto leading-relaxed">
                                  Locate verified specialists and medical facilities near your current location.
                                </p>

                                <div className="w-full max-w-md space-y-4 relative z-10">
                                    <div className="relative group text-left">
                                        <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-sky-500 transition-colors">
                                            <Search size={20} />
                                        </div>
                                        <label htmlFor="specialist-search" className="sr-only">Search for specialists or clinics</label>
                                        <input 
                                            id="specialist-search"
                                            type="text" 
                                            value={specialistQuery}
                                            onChange={(e) => setSpecialistQuery(e.target.value)}
                                            placeholder="e.g. Cardiologist, Urgent Care..."
                                            className="w-full pl-14 pr-6 py-5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[2rem] shadow-sm outline-none focus:ring-4 focus:ring-sky-500/20 font-bold text-slate-900 dark:text-white transition-all placeholder:font-normal placeholder:text-slate-400"
                                        />
                                    </div>

                                    <button 
                                        onClick={handleFindHospitals}
                                        disabled={!specialistQuery.trim()}
                                        className="w-full bg-sky-500 text-white py-5 rounded-[2rem] font-black shadow-xl shadow-sky-500/30 hover:bg-sky-400 hover:scale-[1.02] transition-all uppercase tracking-[0.2em] text-[11px] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                                        aria-label={`Find nearby ${specialistQuery}`}
                                    >
                                        <Navigation size={16} />
                                        Find Nearby {specialistQuery || 'Facilities'}
                                    </button>
                                </div>
                                
                                {locationError && (
                                    <div className="mt-6 p-4 bg-rose-50 dark:bg-rose-900/20 text-rose-500 rounded-2xl text-[10px] font-black uppercase tracking-wide flex items-center gap-2 animate-in slide-in-from-bottom-2">
                                        <AlertTriangle size={14} />
                                        {locationError}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {loadingHospitals && (
                                <div className="col-span-full py-20 flex flex-col items-center justify-center">
                                    <div className="w-10 h-10 border-4 border-sky-200 border-t-sky-500 rounded-full animate-spin mb-4" />
                                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Triangulating Facilities...</span>
                                </div>
                                )}
                                {hospitals.map((hospital, idx) => {
                                   const trustConfig = getTrustConfig(hospital.trustBadge || '');
                                   return (
                                <a 
                                    key={idx} 
                                    href={hospital.googleMapsUri} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-700 shadow-lg hover:shadow-2xl hover:border-sky-300 dark:hover:border-sky-600 transition-all group flex flex-col justify-between relative overflow-hidden"
                                >
                                    <div className="absolute top-0 right-0 bg-sky-500 text-white text-[9px] font-black px-4 py-2 rounded-bl-2xl shadow-lg z-10">
                                       {hospital.matchScore || 95}% MATCH SCORE
                                    </div>

                                    <div className="relative z-10">
                                        <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2 leading-tight pr-12">{hospital.name}</h3>
                                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-6 uppercase tracking-wide">{hospital.address}</p>
                                        
                                        {/* Doctor Trust Engine Block - Redesigned */}
                                        <div className={`mt-4 p-5 rounded-2xl border ${trustConfig.bg} ${trustConfig.border} relative overflow-hidden group/trust`}>
                                            <div className="absolute top-0 right-0 p-3 opacity-10 rotate-12 transform scale-150">
                                                {trustConfig.icon}
                                            </div>
                                            <div className="flex items-center gap-2 mb-3 relative z-10">
                                                <div className={`p-1.5 rounded-lg bg-white dark:bg-black/20 ${trustConfig.text}`}>
                                                    {trustConfig.icon}
                                                </div>
                                                <span className={`text-[10px] font-black uppercase tracking-widest ${trustConfig.text}`}>
                                                    {hospital.trustBadge || 'Verified Facility'}
                                                </span>
                                            </div>
                                            
                                            {/* Recommendation Reason */}
                                            <div className="relative z-10 pl-3 border-l-2 border-current/20 text-slate-600 dark:text-slate-300">
                                                <p className="text-[11px] font-medium leading-relaxed">
                                                <span className="font-bold opacity-70 block text-[9px] uppercase tracking-wider mb-0.5">Trust Engine Analysis:</span>
                                                {hospital.recommendationReason || 'Meets high standards for medical care facilities.'}
                                                </p>
                                            </div>
                                        </div>

                                        {/* New Stats Row */}
                                        <div className="grid grid-cols-3 gap-2 mt-4 mb-4">
                                          <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-2xl border border-slate-100 dark:border-slate-700 flex flex-col items-center justify-center text-center">
                                            <Users size={14} className="text-sky-500 mb-1" />
                                            <span className="text-[9px] font-black text-slate-400 uppercase">Ratio</span>
                                            <span className="text-xs font-bold text-slate-900 dark:text-white">{hospital.patientToDoctorRatio}</span>
                                          </div>
                                           <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-2xl border border-slate-100 dark:border-slate-700 flex flex-col items-center justify-center text-center">
                                            <Clock size={14} className="text-indigo-500 mb-1" />
                                            <span className="text-[9px] font-black text-slate-400 uppercase">Wait</span>
                                            <span className="text-xs font-bold text-slate-900 dark:text-white">{hospital.waitTime}</span>
                                          </div>
                                          <div className={`p-3 rounded-2xl border flex flex-col items-center justify-center text-center ${
                                              hospital.availabilityStatus === 'Available' ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800' :
                                              hospital.availabilityStatus === 'Limited' ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800' :
                                              'bg-rose-50 dark:bg-rose-900/20 border-rose-100 dark:border-rose-800'
                                          }`}>
                                            <CalendarCheck size={14} className={`${
                                                 hospital.availabilityStatus === 'Available' ? 'text-emerald-500' :
                                                 hospital.availabilityStatus === 'Limited' ? 'text-amber-500' : 'text-rose-500'
                                            } mb-1`} />
                                            <span className="text-[9px] font-black opacity-60 uppercase">Status</span>
                                            <span className={`text-xs font-bold ${
                                                 hospital.availabilityStatus === 'Available' ? 'text-emerald-600 dark:text-emerald-400' :
                                                 hospital.availabilityStatus === 'Limited' ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400'
                                            }`}>{hospital.availabilityStatus}</span>
                                          </div>
                                        </div>

                                        {/* Qualifications */}
                                        <div className="space-y-2 mb-4">
                                            <div className="flex items-center gap-2">
                                                <GraduationCap size={14} className="text-slate-400" />
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Specialist Qualifications</span>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {hospital.specialistQualifications?.map((q, i) => (
                                                    <span key={i} className="px-3 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-[10px] font-bold uppercase tracking-wide">
                                                        {q}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Signature Footer */}
                                        <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-700/50 mt-2">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-400">
                                                    <User size={14} />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider">Medical Director</span>
                                                    <span className="text-[12px] font-serif italic text-slate-600 dark:text-slate-300">{hospital.verifiedBy || 'Medical Board Review'}</span>
                                                </div>
                                            </div>
                                            <div className="text-sky-500">
                                                <FileSignature size={20} className="opacity-50" />
                                            </div>
                                        </div>
                                    </div>
                                </a>
                                )})}
                            </div>
                        )}
                    </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
      
      {/* Mobile Drawer */}
      {showMobileNav && (
        <div className="fixed inset-0 bg-white dark:bg-slate-900 z-50 flex flex-col p-10 no-print animate-in fade-in zoom-in-95 transition-colors">
          <div className="flex justify-between items-center mb-16">
            <div className="flex items-center gap-4">
              <Heart size={36} fill="#0ea5e9" className="text-sky-500" />
              <span className="text-3xl font-black tracking-tighter text-slate-900 dark:text-white">VitalScan<span className="text-sky-500">AI</span></span>
            </div>
            <button onClick={() => setShowMobileNav(false)} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl shadow-sm text-slate-900 dark:text-white"><X size={32} /></button>
          </div>
          <nav className="flex flex-col gap-8 text-3xl font-black tracking-tighter uppercase">
            {tabs.map(tab => (
              <button 
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as TabType);
                  setShowMobileNav(false);
                }} 
                className={`flex items-center gap-6 text-left ${activeTab === tab.id ? 'text-sky-500' : 'text-slate-400 dark:text-slate-500'}`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
            <button onClick={handleLogout} className="flex items-center gap-6 text-left text-rose-500">
               <LogOut size={18} /> Logout
            </button>
          </nav>
        </div>
      )}
    </div>
  );
};

export default App;