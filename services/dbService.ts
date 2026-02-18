import { MedicalHistoryItem, UserProfile } from '../types';

// Storage Keys
const STORAGE_HISTORY = 'vitalscan_history';
const STORAGE_PROFILES = 'vitalscan_profiles';

// Helper to get all history
const getAllHistory = (): Record<string, MedicalHistoryItem[]> => {
  try {
    const data = localStorage.getItem(STORAGE_HISTORY);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
};

// Helper to get all profiles
const getAllProfiles = (): Record<string, UserProfile> => {
  try {
    const data = localStorage.getItem(STORAGE_PROFILES);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
};

export const saveMedicalHistory = async (uid: string, item: MedicalHistoryItem) => {
  const allHistory = getAllHistory();
  
  if (!allHistory[uid]) {
    allHistory[uid] = [];
  }
  
  // Add new item with a generated ID
  const newItem = {
    ...item,
    id: `hist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    date: new Date().toISOString()
  };
  
  allHistory[uid].unshift(newItem); // Add to beginning
  
  localStorage.setItem(STORAGE_HISTORY, JSON.stringify(allHistory));
  return newItem;
};

export const getMedicalHistory = async (uid: string) => {
  const allHistory = getAllHistory();
  return allHistory[uid] || [];
};

export const saveUserProfile = async (uid: string, data: Partial<UserProfile>) => {
  const allProfiles = getAllProfiles();
  
  const existingProfile = allProfiles[uid] || { 
    uid, 
    email: null, 
    displayName: null, 
    createdAt: new Date().toISOString() 
  };
  
  allProfiles[uid] = {
    ...existingProfile,
    ...data
  };
  
  localStorage.setItem(STORAGE_PROFILES, JSON.stringify(allProfiles));
};

export const getUserProfile = async (uid: string) => {
    const allProfiles = getAllProfiles();
    return allProfiles[uid] || null;
};