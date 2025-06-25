/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as appState from '../state/appState';
import * as uiManager from '../dom/uiManager';
import * as aiService from '../services/aiService';
import { generateId, playButtonSound } from '../utils/helpers';
import { SYSTEM_PROMPT, BODY_SYSTEMS, SEVERITY_LEVELS } from '../config/constants';
import { Content, Part } from '@google/genai';
import * as domElements from '../dom/domElements';
import { playOnlineSound, playLongBeepSound } from '../utils/helpers';

// Import psychometric module data and initializers
import { phq9Data, initializePHQ9Data } from '../psychometrics/phq9';
import { gad7Data, initializeGAD7Data } from '../psychometrics/gad7';
import { pcl5Data, initializePCL5Data } from '../psychometrics/pcl5';
import { clinicalInterviewData, initializeClinicalInterviewData } from '../psychometrics/clinicalInterview';
import { personalityMatrixData, initializePersonalityMatrixData } from '../psychometrics/personalityMatrix';
import { mseData, initializeMSEData } from '../psychometrics/mse';
// import { cognitiveTestData, initializeCognitiveTestData } from '../psychometrics/cognitive'; // Removed
import { reportGeneratorData, initializeReportGeneratorData } from '../psychometrics/reportGenerator';
import { nnpaData, initializeNNPAData } from '../psychometrics/nnpa';

// Import body system tool state and loader
import * as bodySystemToolsState from '../state/bodySystemToolsState';


// This function will be called by appCore.ts's renderAll or similar
declare function renderAllForEncounterManager(): void; 
// This function will be called by appCore.ts's handleAssessmentTabSwitch or similar
declare function handleAssessmentTabSwitchForEncounterManager(tabId: string): void;


export function savePatientEncounters() {
    try {
        localStorage.setItem('advancedMedicalInterfaceEncounters_v3', JSON.stringify(appState.patientEncounters));
        localStorage.setItem('advancedMedicalInterfaceActiveEncounterId_v3', appState.activeEncounterId || '');
        if (appState.activeEncounterId && appState.activeSystemTab) {
            localStorage.setItem(`encounter_${appState.activeEncounterId}_activeSystemTab_v3`, appState.activeSystemTab);
        }
    } catch (e) {
        console.error("Error saving encounters to localStorage:", e);
    }
}

function loadDataForActiveEncounter() {
    const activeEncounter = appState.getActiveEncounter();
    if (!activeEncounter) return;

    // Load Psychometric Data
    initializePHQ9Data(activeEncounter.psychometricAssessments?.phq9);
    initializeGAD7Data(activeEncounter.psychometricAssessments?.gad7);
    initializePCL5Data(activeEncounter.psychometricAssessments?.pcl5);
    initializeClinicalInterviewData(activeEncounter.psychometricAssessments?.clinicalInterview);
    initializePersonalityMatrixData(activeEncounter.psychometricAssessments?.personalityMatrix);
    initializeMSEData(activeEncounter.psychometricAssessments?.mse);
    // initializeCognitiveTestData(activeEncounter.psychometricAssessments?.cognitive); // Removed
    initializeReportGeneratorData(activeEncounter.psychometricAssessments?.reportGenerator);
    initializeNNPAData(activeEncounter.psychometricAssessments?.nnpa);
    
    // Load Body System Tool Data
    bodySystemToolsState.loadToolDataFromEncounter(activeEncounter.bodySystemToolResults);

    // Patient Core Data is typically loaded directly by the modal when opened,
    // but we ensure it's initialized in the state if not present.
    if (!activeEncounter.patientCoreData) {
        activeEncounter.patientCoreData = {
            firstName: '', middleName: '', lastName: '', dateOfBirth: '', age: '',
            gender: '', city: '', currentMedications: '', knownAllergies: '',
            chronicConditions: '', previousSurgeries: '', reasonForVisit: '',
            primaryCarePhysician: '', additionalNotes: ''
        };
    }
    if (activeEncounter.patientDataSentToAI === undefined) {
        activeEncounter.patientDataSentToAI = false;
    }
}


export function loadPatientEncounters() {
    try {
        const storedEncounters = localStorage.getItem('advancedMedicalInterfaceEncounters_v3');
        const storedActiveId = localStorage.getItem('advancedMedicalInterfaceActiveEncounterId_v3');

        if (storedEncounters) {
            const parsedEncounters = JSON.parse(storedEncounters) as appState.PatientEncounter[];
            parsedEncounters.forEach(enc => {
                appState.initializeDefaultBodySystemSeverities(enc);
                appState.initializeDefaultEncounterDataFields(enc); // Ensures .psychometricAssessments, .bodySystemToolResults, .patientCoreData, .patientDataSentToAI exist
            });
            appState.setPatientEncounters(parsedEncounters);
        }

        let loadedActiveEncounter = false;
        if (storedActiveId && appState.patientEncounters.find(e => e.id === storedActiveId)) {
            appState.setActiveEncounterId(storedActiveId);
            const encounterSpecificActiveSystemTab = localStorage.getItem(`encounter_${appState.activeEncounterId}_activeSystemTab_v3`);
            if (encounterSpecificActiveSystemTab && BODY_SYSTEMS.includes(encounterSpecificActiveSystemTab)) {
                appState.setActiveSystemTab(encounterSpecificActiveSystemTab);
            } else {
                appState.setActiveSystemTab(null);
            }
            loadedActiveEncounter = true;
        } else if (appState.patientEncounters.length > 0) {
             appState.patientEncounters.sort((a, b) => b.lastActivityAt - a.lastActivityAt);
             appState.setActiveEncounterId(appState.patientEncounters[0].id);
             appState.setActiveSystemTab(null); // Default to no system tab active for the most recent encounter
             loadedActiveEncounter = true;
        }
        
        if (loadedActiveEncounter) {
            loadDataForActiveEncounter(); // Load data for the determined active encounter
        }

    } catch (e) {
        console.error("Error loading encounters from localStorage:", e);
        appState.setPatientEncounters([]);
        appState.setActiveEncounterId(null);
        appState.setActiveSystemTab(null);
    }

    if (appState.patientEncounters.length === 0) {
        createNewEncounter(); // This will also call loadDataForActiveEncounter indirectly
    } else {
      aiService.rehydrateEncounterAIInstances(); 
    }
}

export function createNewEncounter() {
    if (!appState.ai) {
        uiManager.displaySystemError("AI not initialized. Cannot create new encounter.", true);
        return;
    }
    const newEncounterId = generateId();
    const now = Date.now();

    let highestPatientNum = 0;
    appState.patientEncounters.forEach(enc => {
        if (enc.name.startsWith("PATIENT-")) {
            const num = parseInt(enc.name.substring(8), 10);
            if (!isNaN(num) && num > highestPatientNum) {
                highestPatientNum = num;
            }
        }
    });
    const newPatientNum = highestPatientNum + 1;
    const newPatientName = `PATIENT-${newPatientNum.toString().padStart(4, '0')}`;

    const initialSeverities: { [systemName: string]: string } = {};
    BODY_SYSTEMS.forEach(system => {
        initialSeverities[system] = SEVERITY_LEVELS.find(level => level === 'noData') || SEVERITY_LEVELS[0];
    });

    const newEncounter: appState.PatientEncounter = {
        id: newEncounterId,
        name: newPatientName,
        messages: [],
        notes: { redFlags: [], symptoms: [], diagnoses: [], medications: [], followUp: [], patientEducation: [] },
        createdAt: now,
        lastActivityAt: now,
        bodySystemSeverities: initialSeverities,
        patientCoreData: { // Initialize with empty strings
            firstName: '', middleName: '', lastName: '', dateOfBirth: '', age: '',
            gender: '', city: '', currentMedications: '', knownAllergies: '',
            chronicConditions: '', previousSurgeries: '', reasonForVisit: '',
            primaryCarePhysician: '', additionalNotes: ''
        },
        patientDataSentToAI: false,
        psychometricAssessments: {}, 
        bodySystemToolResults: {}   
    };
    playOnlineSound();
    appState.initializeDefaultEncounterDataFields(newEncounter); 
    appState.addEncounter(newEncounter);
    appState.setActiveEncounterId(newEncounterId);
    appState.setActiveSystemTab(null);

    // Initialize all psychometric and tool data to defaults for the new encounter
    loadDataForActiveEncounter(); 

    appState.activeEncounterAIInstances[newEncounterId] = appState.ai.chats.create({
        model: 'gemini-2.5-flash-preview-04-17',
        config: { systemInstruction: SYSTEM_PROMPT }
    });

    if (typeof renderAllForEncounterManager === 'function') renderAllForEncounterManager();
    savePatientEncounters();
    
    const currentChatInputEl = document.getElementById('chat-input') as HTMLTextAreaElement | null;
    if (currentChatInputEl) currentChatInputEl.focus();
    if (typeof handleAssessmentTabSwitchForEncounterManager === 'function') handleAssessmentTabSwitchForEncounterManager('nexus-ai-tab');
}

export function handleSwitchEncounter(encounterId: string) {
    if (encounterId === appState.activeEncounterId) return;
    const encounterToSwitch = appState.patientEncounters.find(e => e.id === encounterId);
    if (encounterToSwitch) {
        appState.setActiveEncounterId(encounterId);
        const storedActiveSystemTab = localStorage.getItem(`encounter_${encounterId}_activeSystemTab_v3`);
        const newActiveSystemTab = storedActiveSystemTab && BODY_SYSTEMS.includes(storedActiveSystemTab) ? storedActiveSystemTab : null;
        appState.setActiveSystemTab(newActiveSystemTab);

        loadDataForActiveEncounter(); // Load data for the newly active encounter

        aiService.getActiveEncounterAI(); 
        
        if (typeof renderAllForEncounterManager === 'function') renderAllForEncounterManager();
        savePatientEncounters();
        
        const currentChatInputEl = document.getElementById('chat-input') as HTMLTextAreaElement | null;
        if (currentChatInputEl) currentChatInputEl.focus();
    } else {
        console.warn(`Attempted to switch to non-existent encounter ID: ${encounterId}`);
    }
}

export function handleDeleteEncounter(encounterId: string) {
    if (confirm("Are you sure you want to delete this patient encounter? This action cannot be undone.")) {
        appState.deleteEncounterById(encounterId);
        localStorage.removeItem(`encounter_${encounterId}_activeSystemTab_v3`);

        if (appState.activeEncounterId === encounterId) {
            if (appState.patientEncounters.length > 0) {
                appState.patientEncounters.sort((a,b) => b.lastActivityAt - a.lastActivityAt);
                appState.setActiveEncounterId(appState.patientEncounters[0].id);
                const storedActiveSystemTab = localStorage.getItem(`encounter_${appState.activeEncounterId}_activeSystemTab_v3`);
                const newActiveSystemTab = storedActiveSystemTab && BODY_SYSTEMS.includes(storedActiveSystemTab) ? storedActiveSystemTab : null;
                appState.setActiveSystemTab(newActiveSystemTab);
                loadDataForActiveEncounter(); // Load data for the new active encounter
            } else {
                appState.setActiveEncounterId(null);
                appState.setActiveSystemTab(null);
                createNewEncounter(); 
                return;
            }
        }
        if (typeof renderAllForEncounterManager === 'function') renderAllForEncounterManager();
        savePatientEncounters();
    }
}

export function handleRenameEncounter(encounterIdToRename: string, newName: string) {
    if (!encounterIdToRename) {
        console.warn("handleRenameEncounter called without an encounter ID.");
        return;
    }

    const encounter = appState.patientEncounters.find(e => e.id === encounterIdToRename);
    if (!encounter) {
        console.warn(`Attempted to rename non-existent encounter ID: ${encounterIdToRename}`);
        return;
    }

    const trimmedNewName = newName.trim();
    if (!trimmedNewName) {
        return;
    }

    if (trimmedNewName === encounter.name) { 
        return;
    }

    encounter.name = trimmedNewName;
    encounter.lastActivityAt = Date.now(); 

    savePatientEncounters();
    uiManager.renderPatientEncountersList(); 
    if (appState.activeEncounterId === encounterIdToRename) {
        uiManager.updatePatientCoreInfo(); 
    }
}

// --- Functions to update and save specific psychometric/tool data ---

export function updatePsychometricDataForActiveEncounter<K extends keyof NonNullable<appState.PatientEncounter['psychometricAssessments']>>(
    moduleKey: K,
    data: NonNullable<appState.PatientEncounter['psychometricAssessments']>[K]
) {
    const encounter = appState.getActiveEncounter();
    if (encounter) {
        if (!encounter.psychometricAssessments) {
            encounter.psychometricAssessments = {};
        }
        // Use a deep copy of the data to avoid shared references if 'data' is complex
        encounter.psychometricAssessments[moduleKey] = JSON.parse(JSON.stringify(data));
        encounter.lastActivityAt = Date.now();
        savePatientEncounters();
    }
}

export function updateToolDataForActiveEncounter<
    S extends keyof NonNullable<appState.PatientEncounter['bodySystemToolResults']>,
    T extends keyof NonNullable<NonNullable<appState.PatientEncounter['bodySystemToolResults']>[S]>
>(
    systemKey: S,
    toolKey: T,
    data: NonNullable<NonNullable<NonNullable<appState.PatientEncounter['bodySystemToolResults']>[S]>>[T]
) {
    const encounter = appState.getActiveEncounter();
    if (encounter) {
        if (!encounter.bodySystemToolResults) {
            encounter.bodySystemToolResults = {};
        }
        if (!encounter.bodySystemToolResults[systemKey]) {
            (encounter.bodySystemToolResults[systemKey] as any) = {};
        }
        const systemTools = encounter.bodySystemToolResults[systemKey];
        if (systemTools) {
            // Deep copy data to prevent shared references
            (systemTools[toolKey] as any) = JSON.parse(JSON.stringify(data));
        }
        encounter.lastActivityAt = Date.now();
        savePatientEncounters();
    }
}