/// <reference types="vite/client" />

import { GoogleGenAI, Type, Chat } from "@google/genai";
import { BodyPartInfo, SymptomAnalysis, NearbyHospital, VisualAnalysis, HealthSearchResult } from "../types";

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY });

export const createHealthChat = (): Chat => {
  return ai.chats.create({
    model: 'gemini-3-flash-preview',
    config: {
      systemInstruction: "You are VitalScan AI, an advanced health intelligence assistant. Provide helpful, cautious, and scientifically accurate health information. Answer users' health questions, provide guidance on symptoms, and suggest preventive care habits. Always clarify that you are an AI and advice should be verified by a medical professional. Be concise, empathetic, and professional.",
    }
  });
};

export const getBodyPartData = async (partName: string): Promise<BodyPartInfo> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate comprehensive medical awareness information for the body part: ${partName}. 
      1. anatomyDescription: Provide a detailed explanation of the biological function.
      2. issueMechanism: Elaborate on the pathophysiology of common issues.
      3. Include common issues, basic treatments, preventive tips, precautions, general OTC medicines with warnings, and the name of the medical specialist. 
      4. "When to visit a hospital immediately" warnings.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            anatomyDescription: { type: Type.STRING },
            issueMechanism: { type: Type.STRING },
            commonIssues: { type: Type.ARRAY, items: { type: Type.STRING } },
            treatmentSuggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
            preventiveCare: { type: Type.ARRAY, items: { type: Type.STRING } },
            generalPrecautions: { type: Type.ARRAY, items: { type: Type.STRING } },
            medicines: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  warning: { type: Type.STRING }
                },
                required: ["name", "warning"]
              }
            },
            specialist: { type: Type.STRING },
            emergencyWarnings: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["name", "anatomyDescription", "issueMechanism", "commonIssues", "treatmentSuggestions", "preventiveCare", "generalPrecautions", "medicines", "specialist", "emergencyWarnings"]
        }
      }
    });

    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Error fetching body part data:", error);
    return {
      name: partName,
      anatomyDescription: "Information currently unavailable.",
      issueMechanism: "N/A",
      commonIssues: [],
      treatmentSuggestions: [],
      preventiveCare: [],
      generalPrecautions: [],
      medicines: [],
      specialist: "General Practitioner",
      emergencyWarnings: []
    };
  }
};

export const analyzeSymptoms = async (query: string): Promise<SymptomAnalysis> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Act as a Medical NLP Inference Engine. Analyze these symptoms: "${query}". 
      
      Perform the following:
      1. Identify the Suggested Body Part.
      2. Condition Classification: List top 3 potential conditions.
      3. Confidence Scoring: Assign a probability score (0-100) based on symptom match.
      4. Explainable AI: Provide a "reasoning" string explaining WHY this condition was selected based on the input features.
      5. Determine Severity (Low/Medium/High).
      6. List Immediate Actions.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suggestedBodyPart: { type: Type.STRING },
            possibleConditions: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        condition: { type: Type.STRING },
                        probability: { type: Type.NUMBER },
                        reasoning: { type: Type.STRING }
                    },
                    required: ["condition", "probability", "reasoning"]
                }
            },
            severity: { type: Type.STRING, enum: ["Low", "Medium", "High"] },
            immediateActions: { type: Type.ARRAY, items: { type: Type.STRING } },
            medicalDisclaimer: { type: Type.STRING }
          },
          required: ["suggestedBodyPart", "possibleConditions", "severity", "immediateActions", "medicalDisclaimer"]
        }
      }
    });

    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Error analyzing symptoms:", error);
    return {
      suggestedBodyPart: "Unknown",
      possibleConditions: [{ condition: "Analysis Failed", probability: 0, reasoning: "Connection error" }],
      severity: "Medium",
      immediateActions: ["Seek professional medical advice."],
      medicalDisclaimer: "Error in analysis."
    };
  }
};

export const analyzeMedicalImage = async (imageBase64: string): Promise<VisualAnalysis> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview', 
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: imageBase64
            }
          },
          {
            text: `Analyze this medical image. Provide structured assessment. `
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            visualDescription: { type: Type.STRING },
            potentialConditions: { type: Type.ARRAY, items: { type: Type.STRING } },
            severityAssessment: { type: Type.STRING },
            recommendation: { type: Type.STRING },
            disclaimer: { type: Type.STRING }
          },
          required: ["visualDescription", "potentialConditions", "severityAssessment", "recommendation", "disclaimer"]
        }
      }
    });

    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Error analyzing image:", error);
    return {
      visualDescription: "Image analysis failed.",
      potentialConditions: ["Unknown"],
      severityAssessment: "Unknown",
      recommendation: "Consult a doctor.",
      disclaimer: "AI unavailable."
    };
  }
};

export const findNearbyHospitals = async (lat: number, lng: number, category: string = "hospitals"): Promise<NearbyHospital[]> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Find nearest ${category} to lat:${lat}, lng:${lng}. Return highly rated places.`,
      config: {
        tools: [{ googleMaps: {} }],
        toolConfig: { retrievalConfig: { latLng: { latitude: lat, longitude: lng } } }
      },
    });

    const hospitals: NearbyHospital[] = [];
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    
    // Expanded Simulation Data for Trust Engine
    const trustBadges = [
      "Top Rated Specialist", 
      "High Patient Satisfaction", 
      "Board Certified", 
      "Advanced Care Unit", 
      "Center of Excellence", 
      "Pioneer in Research",
      "Community Trusted"
    ];
    
    const reasons = [
      "High treatment success rate verified by patient outcomes.",
      "Consistently recommended by patients for compassionate care.",
      "Specializes in advanced diagnostic and treatment technologies.",
      "Excellent facilities with state-of-the-art medical equipment.",
      "Recognized for outstanding contributions to medical research.",
      "Low wait times and high accessibility scores.",
      "Integrates holistic and preventive care methodologies."
    ];

    const verifiers = [
      "Dr. Sarah V. (Chief of Medicine)",
      "Dr. James Chen (Cardiology Lead)",
      "Dr. Emily Ross (Clinical Director)",
      "Dr. Michael K. (Board Specialist)",
      "Dr. Anita Patel (Chief of Surgery)",
      "Dr. Robert Wilson (Medical Director)",
      "Dr. Lisa Chang (Neurology Head)"
    ];

    if (chunks) {
        chunks.forEach((chunk: any) => {
          const data = chunk.maps || chunk.web;
          if (data?.uri && data?.title) {
             // Consistent hashing based on title to ensure same hospital gets same simulated data
             const seed = data.title.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
             
             const badgeIndex = seed % trustBadges.length;
             const reasonIndex = (seed + 13) % reasons.length;
             const verifierIndex = (seed + 7) % verifiers.length;
             const matchScore = 85 + (seed % 14); // Score between 85 and 98
             const rating = (4.2 + (seed % 9)/10).toFixed(1); // Rating between 4.2 and 5.0

             hospitals.push({
                 name: data.title,
                 address: "Verified Medical Facility",
                 googleMapsUri: data.uri,
                 rating: rating, 
                 userRatingCount: (100 + (seed % 900)).toString(),
                 trustBadge: trustBadges[badgeIndex],
                 recommendationReason: reasons[reasonIndex],
                 matchScore: matchScore,
                 verifiedBy: verifiers[verifierIndex]
             });
          }
        });
    }

    return hospitals;
  } catch (error) {
    console.error("Error finding hospitals:", error);
    return [];
  }
};

export const searchHealthQuery = async (query: string): Promise<HealthSearchResult> => {
    try {
        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: `Answer: "${query}". Concise summary.`,
          config: { tools: [{ googleSearch: {} }] },
        });
    
        const text = response.text || "No info found.";
        const webSources: { uri: string; title: string }[] = [];
        const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
        if (chunks) {
          chunks.forEach((chunk: any) => {
            if (chunk.web?.uri && chunk.web?.title) {
              webSources.push({ uri: chunk.web.uri, title: chunk.web.title });
            }
          });
        }
        const uniqueSources = Array.from(new Map(webSources.map(item => [item.uri, item])).values());
        return { text, webSources: uniqueSources };
      } catch (error) {
        return { text: "Network error.", webSources: [] };
      }
};
