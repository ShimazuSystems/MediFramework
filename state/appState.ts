/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, Part, Chat } from "@google/genai";
import { BODY_SYSTEMS, SEVERITY_LEVELS } from "../config/constants";

// Import data types from their respective modules
import { phq9Data as PHQ9DataType } from '../psychometrics/phq9';
import { gad7Data as GAD7DataType } from '../psychometrics/gad7';
import { pcl5Data as PCL5DataType } from '../psychometrics/pcl5';
import { mseData as MSEDataType } from '../psychometrics/mse';
// import { cognitiveTestData as CognitiveDataType } from '../psychometrics/cognitive'; // Removed
import { personalityMatrixData as PersonalityMatrixDataType } from '../psychometrics/personalityMatrix';
import { clinicalInterviewData as ClinicalInterviewDataType } from '../psychometrics/clinicalInterview';
import { reportGeneratorData as ReportGeneratorDataType } from '../psychometrics/reportGenerator';
import { nnpaData as NNPADatatype } from '../psychometrics/nnpa';


// Import Body System Tool data types from bodySystemToolsState
import {
    ASCVDData as ASCVDDataType,
    GCSData as GCSDataType,
    HeartRateZoneData as HeartRateZoneDataType,
    OxygenationIndexData as OxygenationIndexDataType,
    BICSData as BICSDataType,
    RansonsCriteriaData as RansonsCriteriaDataType,
    FRAXData as FRAXDataType,
    ROMTrackerData as ROMTrackerDataType,
    BurnCalculatorData as BurnCalculatorDataType,
    ThyroidFunctionData as ThyroidFunctionDataType,
    DiabetesRiskData as DiabetesRiskDataType,
    CoagulationProfileData as CoagulationProfileDataType,
    ConstitutionalSymptomsData as ConstitutionalSymptomsDataType,
} from './bodySystemToolsState';


export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  files?: { name: string; type: string; size: number }[];
  groundingChunks?: any[];
  timestamp?: string;
}

export interface NotesData {
  redFlags: string[];
  symptoms: string[];
  diagnoses: string[];
  medications: string[];
  followUp: string[];
  patientEducation: string[];
}

export interface PatientCoreData {
    firstName: string;
    middleName: string;
    lastName: string;
    dateOfBirth: string; // YYYY-MM-DD
    age: string;
    gender: 'male' | 'female' | 'non-binary' | 'other' | 'preferNotToSay' | '';
    city: string;
    currentMedications: string;
    knownAllergies: string;
    chronicConditions: string;
    previousSurgeries: string;
    reasonForVisit: string;
    primaryCarePhysician: string;
    additionalNotes: string;
}

export interface PatientEncounter {
  id: string;
  name: string;
  messages: Message[];
  notes: NotesData;
  createdAt: number;
  lastActivityAt: number;
  bodySystemSeverities: { [systemName: string]: string };
  patientCoreData?: PatientCoreData; // Added patient core data
  patientDataSentToAI?: boolean; // Flag to track if patient data was sent

  psychometricAssessments?: {
    phq9?: typeof PHQ9DataType;
    gad7?: typeof GAD7DataType;
    pcl5?: typeof PCL5DataType;
    mse?: typeof MSEDataType;
    // cognitive?: typeof CognitiveDataType; // Removed
    personalityMatrix?: typeof PersonalityMatrixDataType;
    clinicalInterview?: typeof ClinicalInterviewDataType;
    reportGenerator?: typeof ReportGeneratorDataType;
    nnpa?: typeof NNPADatatype;
  };

  bodySystemToolResults?: {
    Cardiovascular?: {
        ascvdRiskCalculator?: ASCVDDataType;
        heartRateZoneCalculator?: HeartRateZoneDataType;
    };
    Neurological?: {
        gcsCalculator?: GCSDataType;
    };
    Respiratory?: {
        oxygenationIndexCalculator?: OxygenationIndexDataType;
        bicsCalculator?: BICSDataType;
    };
    Gastrointestinal?: {
        ransonsCriteria?: RansonsCriteriaDataType;
    };
    Musculoskeletal?: {
        fraxCalculatorAI?: FRAXDataType;
        romTracker?: ROMTrackerDataType;
    };
    Integumentary?: {
        burnCalculatorAI?: BurnCalculatorDataType;
    };
    Endocrine?: {
        thyroidFunctionAnalyzerAI?: ThyroidFunctionDataType;
        diabetesRiskProfilerAI?: DiabetesRiskDataType;
    };
    HematologicLymphatic?: {
        coagulationProfileInterpreterAI?: CoagulationProfileDataType;
    };
    "General/Constitutional"?: {
        constitutionalSymptomAnalyzerAI?: ConstitutionalSymptomsDataType;
    };
  };
}

export let patientEncounters: PatientEncounter[] = [];
export let activeEncounterId: string | null = null;
export let activeSystemTab: string | null = null;
export let uploadedFileParts: Part[] = [];
export let uploadedFileObjects: File[] = [];
export let isLoading = false;
export let ai: GoogleGenAI; // Will be initialized in aiService.ts and assigned here or directly to window.ai
export const activeEncounterAIInstances: { [encounterId: string]: Chat } = {};


export function setPatientEncounters(encounters: PatientEncounter[]) {
    patientEncounters = encounters;
}

export function setActiveEncounterId(id: string | null) {
    activeEncounterId = id;
}

export function setActiveSystemTab(tabName: string | null) {
    activeSystemTab = tabName;
}

export function addUploadedFile(part: Part, file: File) {
    uploadedFileParts.push(part);
    uploadedFileObjects.push(file);
}

export function removeUploadedFile(index: number) {
    uploadedFileObjects.splice(index, 1);
    uploadedFileParts.splice(index, 1);
}

export function clearUploadedFiles() {
    uploadedFileParts = [];
    uploadedFileObjects = [];
}

export function setIsLoading(loading: boolean) {
    isLoading = loading;
}

export function setAiInstance(instance: GoogleGenAI) {
    ai = instance;
    (window as any).ai = instance; // Keep global assignment for modules that expect it
}

export function getActiveEncounter(): PatientEncounter | undefined {
    return patientEncounters.find(e => e.id === activeEncounterId);
}

export function updateActiveEncounter(updatedEncounter: Partial<PatientEncounter>) {
    const index = patientEncounters.findIndex(e => e.id === activeEncounterId);
    if (index !== -1 && activeEncounterId) {
        patientEncounters[index] = { ...patientEncounters[index], ...updatedEncounter };
    }
}

export function addMessageToActiveEncounter(message: Message) {
    const encounter = getActiveEncounter();
    if (encounter) {
        encounter.messages.push(message);
        encounter.lastActivityAt = Date.now();
    }
}

export function updateNotesForActiveEncounter(newNotes: Partial<NotesData>) {
    const encounter = getActiveEncounter();
    if (encounter) {
        encounter.notes = { ...encounter.notes, ...newNotes };
    }
}

export function addEncounter(encounter: PatientEncounter) {
    patientEncounters.push(encounter);
}

export function deleteEncounterById(encounterId: string) {
    patientEncounters = patientEncounters.filter(e => e.id !== encounterId);
    delete activeEncounterAIInstances[encounterId];
}

export function initializeDefaultBodySystemSeverities(encounter: PatientEncounter) {
    if (!encounter.bodySystemSeverities) {
        encounter.bodySystemSeverities = {};
    }
    BODY_SYSTEMS.forEach(system => {
        if (!encounter.bodySystemSeverities[system]) {
            encounter.bodySystemSeverities[system] = SEVERITY_LEVELS.find(level => level === 'noData') || SEVERITY_LEVELS[0];
        }
    });
}

export function initializeDefaultEncounterDataFields(encounter: PatientEncounter) {
    if (!encounter.psychometricAssessments) {
        encounter.psychometricAssessments = {};
    }
    if (!encounter.bodySystemToolResults) {
        encounter.bodySystemToolResults = {};
    }
    if (!encounter.patientCoreData) { // Initialize patientCoreData
        encounter.patientCoreData = {
            firstName: '', middleName: '', lastName: '', dateOfBirth: '', age: '',
            gender: '', city: '', currentMedications: '', knownAllergies: '',
            chronicConditions: '', previousSurgeries: '', reasonForVisit: '',
            primaryCarePhysician: '', additionalNotes: ''
        };
    }
    if (encounter.patientDataSentToAI === undefined) {
        encounter.patientDataSentToAI = false;
    }
}