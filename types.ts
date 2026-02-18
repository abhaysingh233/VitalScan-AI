
export enum BodyView {
  FRONT = 'FRONT',
  BACK = 'BACK'
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  age?: number;
  bloodType?: string;
  allergies?: string[];
  createdAt: any;
}

export interface MedicalHistoryItem {
  id?: string;
  date: any;
  symptoms: string;
  analysis: SymptomAnalysis;
  type: 'symptom_check' | 'visual_scan';
}

export interface BodyPartInfo {
  name: string;
  anatomyDescription: string;
  issueMechanism: string;
  commonIssues: string[];
  treatmentSuggestions: string[];
  preventiveCare: string[];
  generalPrecautions: string[];
  medicines: {
    name: string;
    warning: string;
    certification: string; // New field for Doctor/FDA certification status
  }[];
  specialist: string;
  emergencyWarnings: string[];
}

export interface SymptomAnalysis {
  suggestedBodyPart: string;
  possibleConditions: {
    condition: string;
    probability: number; // 0-100 for ML confidence score
    reasoning: string; // Explainable AI
  }[];
  severity: 'Low' | 'Medium' | 'High';
  immediateActions: string[];
  medicalDisclaimer: string;
  recommendedSpecialist: string;
}

export interface VisualAnalysis {
  visualDescription: string;
  potentialConditions: string[];
  severityAssessment: string;
  recommendation: string;
  disclaimer: string;
}

export interface NearbyHospital {
  name: string;
  address: string;
  googleMapsUri: string;
  rating?: string;
  userRatingCount?: string;
  trustBadge?: string;
  recommendationReason?: string;
  matchScore?: number;
  verifiedBy?: string;
  
  // Doctor Trust Engine Metrics
  specialistQualifications?: string[];
  patientToDoctorRatio?: string;
  availabilityStatus?: 'Available' | 'Limited' | 'Waitlist';
  waitTime?: string;
}

export interface HealthSearchResult {
  text: string;
  webSources: {
    uri: string;
    title: string;
  }[];
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export interface SensorStatus {
  active: boolean;
  type: 'bluetooth' | 'camera' | 'manual';
  deviceName?: string;
  lastReading?: string;
  signalQuality?: number; // 0-100
}
