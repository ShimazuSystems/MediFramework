/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as appState from '../state/appState';
import * as psychState from '../state/psychometricState';
import * as nexusState from '../state/nexusState';
import * as domElements from '../dom/domElements';
import * as uiManager from '../dom/uiManager';
import * as encounterManager from '../components/encounterManager';
import * as nexusController from '../components/nexus/nexusController';
import * as psychController from '../components/psychometrics/psychometricController';
import * as aiService from '../services/aiService';
import * as speechService from '../services/speechService';
import { playButtonSound, updateSystemTime } from '../utils/helpers';
import { GenerateContentResponse } from '@google/ai.api'; // Ensure this matches actual import if GenerateContentResponse is used directly here

// Import for Body System Tools
import * as bodySystemToolsController from '../bodySystemTools/bodySystemToolsController';


export let systemTimerInterval: number | null = null;
let currentEncounterIdForRename: string | null = null; 
let isLoadingPredictiveAI = false;


export function renderAll() {
    uiManager.renderPatientEncountersList();
    uiManager.updatePatientCoreInfo();
    uiManager.renderBodySystemTabs();
    
    uiManager.updateCenterPanelForSystem(appState.activeSystemTab);
    uiManager.updateRightPanelForSystem(appState.activeSystemTab); 
    
    const activeAssessmentTabButton = domElements.assessmentTabsContainerEl?.querySelector('.tab-button.active');
    if (activeAssessmentTabButton) {
        const currentTabId = activeAssessmentTabButton.getAttribute('data-tab')!;
        handleAssessmentTabSwitch(currentTabId); 
    } else {
        // Default to NEXUS-AI tab if no active tab is found (e.g., initial load)
        handleAssessmentTabSwitch('nexus-ai-tab'); 
    }
    uiManager.renderNotes(); 
}

(window as any).renderAllForEncounterManager = renderAll;
(window as any).handleAssessmentTabSwitchForEncounterManager = handleAssessmentTabSwitch;


function handleClinicalSubTabSwitch(targetSubTabId: string) {
    const clinicalInterfaceTab = document.getElementById('clinical-interface-tab');
    if (!clinicalInterfaceTab) return;

    clinicalInterfaceTab.querySelectorAll('.clinical-subtab-button').forEach(button => {
        button.classList.remove('active');
    });
    clinicalInterfaceTab.querySelectorAll('.clinical-subtab-content').forEach(content => {
        content.classList.remove('active');
    });

    const subTabButton = clinicalInterfaceTab.querySelector(`.clinical-subtab-button[data-subtab="${targetSubTabId}"]`);
    const subTabContent = document.getElementById(targetSubTabId);

    if (subTabButton) subTabButton.classList.add('active');
    if (subTabContent) subTabContent.classList.add('active');
}


export function handleAssessmentTabSwitch(targetTabId: string) {
    domElements.assessmentTabsContainerEl?.querySelectorAll('.tab-button').forEach(button => {
        button.classList.remove('active');
        if (button.getAttribute('data-tab') === targetTabId) {
            button.classList.add('active');
        }
    });
    domElements.tabContents?.forEach(content => {
        content.classList.remove('active');
        if (content.id === targetTabId) {
            content.classList.add('active');
        }
    });

    if (targetTabId === 'nexus-ai-tab') {
        nexusController.renderNexusAITabContent(); 
    } else if (targetTabId === 'clinical-interface-tab') {
        // When CLINICAL tab is activated, ensure a default sub-tab is also active.
        // Check if any sub-tab is already active; if not, activate the default.
        const clinicalInterfaceTab = document.getElementById('clinical-interface-tab');
        const activeSubTab = clinicalInterfaceTab?.querySelector('.clinical-subtab-button.active');
        if (!activeSubTab) {
            handleClinicalSubTabSwitch('predictive-assessment-subtab-content'); // Default to predictive assessment
        }
    } else if (targetTabId === 'psychometric-tools-tab') {
        psychController.initializePsychometricTerminal(); 
        psychController.renderPsychometricTerminal();
        if (psychState.psychometricTerminalTimerInterval === null) {
            psychState.setCurrentPsychometricTime(new Date()); 
            psychState.setPsychometricTerminalTimerInterval(window.setInterval(psychController.updatePsychometricHeaderTime, 1000));
        }
    } else {
        if (psychState.psychometricTerminalTimerInterval !== null) {
            clearInterval(psychState.psychometricTerminalTimerInterval);
            psychState.setPsychometricTerminalTimerInterval(null);
        }
    }
}

async function handleGetPredictiveAssessment() {
    playButtonSound();
    if (isLoadingPredictiveAI || !appState.ai) return;

    const notes = domElements.predictiveNotesInputEl.value.trim();
    if (!notes) {
        domElements.predictiveAssessmentOutputEl.innerHTML = `<p class="error-text">Please enter clinical notes for analysis.</p>`;
        return;
    }

    isLoadingPredictiveAI = true;
    domElements.getPredictiveAssessmentButtonEl.disabled = true;
    domElements.predictiveAssessmentOutputEl.innerHTML = `<p class="loading-text">NEXUS is analyzing notes for predictive insights... Please wait.</p>`;

    const prompt = `You are NEXUS Medical Intelligence, specializing in predictive clinical assessment based on provided notes.
Analyze the following clinical notes:
---NOTES_START---
${notes}
---NOTES_END---

Based *only* on these notes, provide a predictive assessment. Structure your response with the following clear sections using Markdown:
1.  **Potential Future Risks**: List potential future health risks or complications (e.g., "Increased risk of cardiovascular events in the next 5 years if lifestyle not modified", "Potential for decline in renal function"). Provide 2-4 key risks.
2.  **Monitoring Suggestions**: Suggest 2-4 specific monitoring actions (e.g., "Annual lipid panel and HbA1c monitoring", "Regular blood pressure checks (bi-weekly)").
3.  **Preventative Considerations**: Outline 2-4 preventative measures or lifestyle changes (e.g., "Counseling on smoking cessation", "Dietary modification advice focusing on reduced sodium intake").
4.  **Confidence & Limitations**: Briefly state the confidence and limitations of this assessment (e.g., "Moderate confidence based on provided notes. This is a high-level predictive insight and not a definitive prognosis. Many unstated factors could influence actual outcomes. Clinical correlation and ongoing assessment are paramount.").
5.  **Overall Summary**: A brief narrative summary (2-3 sentences) of the key predictive insights.

Prioritize actionable and clinically relevant points. Be cautious and avoid definitive predictions. Emphasize that this is for informational support.
Your response will be displayed directly to the healthcare professional. Ensure a professional and clinical tone.
Important: This information is for educational purposes and to support healthcare professionals. It is not a substitute for professional medical advice, diagnosis, or treatment. Always consult with a qualified healthcare provider for any medical decisions or concerns. This disclaimer should be implicitly understood and not directly part of the structured response you generate.`;

    try {
        const genAIResponse = await appState.ai.models.generateContent({ // Use genAIResponse to avoid conflict with DOM Event type
            model: "gemini-2.5-flash-preview-04-17",
            contents: prompt
        });
        
        let assessmentText = genAIResponse.text;
        assessmentText = assessmentText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        assessmentText = assessmentText.replace(/\n\s*-\s*(.*?)(?=\n\s*-|\n\n|$)/g, (match, item) => `<li>${item.trim()}</li>`);
        assessmentText = assessmentText.replace(/(\*\*Potential Future Risks:|Monitoring Suggestions:|Preventative Considerations:|Confidence & Limitations:|Overall Summary:\*\*[\s\S]*?)(<li>.*?<\/li>)/g, '$1<ul>$2'); 
        assessmentText = assessmentText.replace(/(<\/li>)(?![\s\S]*<li>)([\s\S]*?)(\*\*|$)/g, '$1</ul>$2$3'); 
        assessmentText = assessmentText.replace(/\n/g, '<br>');
        assessmentText = assessmentText.replace(/<br>\s*<ul>/g, '<ul>');
        assessmentText = assessmentText.replace(/<\/ul>\s*<br>/g, '</ul>');


        domElements.predictiveAssessmentOutputEl.innerHTML = assessmentText;
    } catch (error: any) {
        console.error("Error getting predictive assessment:", error);
        const errorMessage = error.message || "An unknown error occurred while fetching the predictive assessment.";
        domElements.predictiveAssessmentOutputEl.innerHTML = `<p class="error-text">Error: ${errorMessage}</p>`;
    } finally {
        isLoadingPredictiveAI = false;
        domElements.getPredictiveAssessmentButtonEl.disabled = false;
    }
}

function showPatientDataModal() {
    const activeEncounter = appState.getActiveEncounter();
    if (!activeEncounter) {
        alert("No active patient encounter. Please create or select one first.");
        return;
    }
    const data = activeEncounter.patientCoreData || {} as appState.PatientCoreData;

    domElements.patientDataFirstNameEl.value = data.firstName || '';
    domElements.patientDataMiddleNameEl.value = data.middleName || '';
    domElements.patientDataLastNameEl.value = data.lastName || '';
    domElements.patientDataDobEl.value = data.dateOfBirth || '';
    domElements.patientDataAgeEl.value = data.age || '';
    domElements.patientDataGenderEl.value = data.gender || '';
    domElements.patientDataCityEl.value = data.city || '';
    domElements.patientDataMedicationsEl.value = data.currentMedications || '';
    domElements.patientDataAllergiesEl.value = data.knownAllergies || '';
    domElements.patientDataChronicConditionsEl.value = data.chronicConditions || '';
    domElements.patientDataPreviousSurgeriesEl.value = data.previousSurgeries || '';
    domElements.patientDataReasonForVisitEl.value = data.reasonForVisit || '';
    domElements.patientDataPcpEl.value = data.primaryCarePhysician || '';
    domElements.patientDataAdditionalNotesEl.value = data.additionalNotes || '';

    domElements.patientDataModalEl.style.display = 'flex';
    domElements.patientDataFirstNameEl.focus();
}

function hidePatientDataModal() {
    domElements.patientDataModalEl.style.display = 'none';
}

function handleSavePatientData() {
    const activeEncounter = appState.getActiveEncounter();
    if (!activeEncounter) return;

    activeEncounter.patientCoreData = {
        firstName: domElements.patientDataFirstNameEl.value.trim(),
        middleName: domElements.patientDataMiddleNameEl.value.trim(),
        lastName: domElements.patientDataLastNameEl.value.trim(),
        dateOfBirth: domElements.patientDataDobEl.value,
        age: domElements.patientDataAgeEl.value.trim(),
        gender: domElements.patientDataGenderEl.value as appState.PatientCoreData['gender'],
        city: domElements.patientDataCityEl.value.trim(),
        currentMedications: domElements.patientDataMedicationsEl.value.trim(),
        knownAllergies: domElements.patientDataAllergiesEl.value.trim(),
        chronicConditions: domElements.patientDataChronicConditionsEl.value.trim(),
        previousSurgeries: domElements.patientDataPreviousSurgeriesEl.value.trim(),
        reasonForVisit: domElements.patientDataReasonForVisitEl.value.trim(),
        primaryCarePhysician: domElements.patientDataPcpEl.value.trim(),
        additionalNotes: domElements.patientDataAdditionalNotesEl.value.trim(),
    };
    // When patient data is saved, mark it as not yet sent to AI for this session,
    // so it gets included in the *next* AI interaction if it's the first.
    activeEncounter.patientDataSentToAI = false; 
    activeEncounter.lastActivityAt = Date.now();
    encounterManager.savePatientEncounters();
    hidePatientDataModal();
    uiManager.renderPatientEncountersList(); // Update list in case activity sort changes
}


export function initializeEventListeners() {
    // domElements.queryDomElements(); // Already called in initializeApp before aiService.initializeGeminiAI
    domElements.reassignNexusChatElements(); 

    if (domElements.uiButtonSound) {
        domElements.uiButtonSound.onerror = () => {
            console.warn("Failed to load UI button sound.");
        };
    }

    if (domElements.chatFormEl && domElements.chatInputEl && domElements.sendButtonEl && domElements.fileInputEl && domElements.fileUploadZoneEl && domElements.newEncounterButtonEl && domElements.renameActiveEncounterButtonEl && domElements.exportNotesButtonEl && domElements.assessmentTabsContainerEl && domElements.quickAccessButtonsContainer && domElements.bodySystemTabsEl && domElements.renameModalEl && domElements.renameModalInputEl && domElements.renameModalOkButtonEl && domElements.renameModalCancelButtonEl && domElements.getPredictiveAssessmentButtonEl && domElements.patientDataButtonEl && domElements.patientDataModalEl && domElements.patientDataModalSaveButtonEl && domElements.patientDataModalCancelButtonEl) {
      domElements.chatFormEl.addEventListener('submit', nexusController.handleSendMessage);
      
      domElements.newEncounterButtonEl.addEventListener('click', () => {
        playButtonSound();
        encounterManager.createNewEncounter();
      });

      domElements.renameActiveEncounterButtonEl.addEventListener('click', () => {
        playButtonSound();
        const activeEncounter = appState.getActiveEncounter();
        if (activeEncounter) {
            currentEncounterIdForRename = activeEncounter.id;
            uiManager.showRenameModal(activeEncounter.name);
        } else {
            alert("No active patient encounter to rename.");
        }
      });

      domElements.renameModalOkButtonEl.addEventListener('click', () => {
        playButtonSound();
        const newName = domElements.renameModalInputEl.value;
        if (currentEncounterIdForRename && newName.trim()) {
            encounterManager.handleRenameEncounter(currentEncounterIdForRename, newName.trim());
            uiManager.hideRenameModal();
            currentEncounterIdForRename = null;
        } else if (!newName.trim()){
            alert("Patient name cannot be empty.");
            domElements.renameModalInputEl.focus();
        }
      });

      domElements.renameModalCancelButtonEl.addEventListener('click', () => {
        playButtonSound();
        uiManager.hideRenameModal();
        currentEncounterIdForRename = null;
      });
      
      domElements.renameModalEl.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            playButtonSound();
            uiManager.hideRenameModal();
            currentEncounterIdForRename = null;
        }
      });
      domElements.renameModalInputEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault(); 
          domElements.renameModalOkButtonEl.click(); 
        }
      });

      // Patient Data Modal Listeners
      domElements.patientDataButtonEl.addEventListener('click', () => {
        playButtonSound();
        showPatientDataModal();
      });
      domElements.patientDataModalSaveButtonEl.addEventListener('click', () => {
        playButtonSound();
        handleSavePatientData();
      });
      domElements.patientDataModalCancelButtonEl.addEventListener('click', () => {
        playButtonSound();
        hidePatientDataModal();
      });
       domElements.patientDataModalEl.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            playButtonSound();
            hidePatientDataModal();
        }
      });


      domElements.chatInputEl.addEventListener('input', () => {
        if (domElements.chatInputEl) { 
            domElements.chatInputEl.style.height = 'auto';
            domElements.chatInputEl.style.height = `${domElements.chatInputEl.scrollHeight}px`;
        }
      });
      domElements.chatInputEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          nexusController.handleSendMessage();
        }
      });

      domElements.fileInputEl.addEventListener('change', (e) => {
        nexusController.handleFilesSelected((e.target as HTMLInputElement).files);
      });

      domElements.fileUploadZoneEl.addEventListener('dragover', (e) => { e.preventDefault(); domElements.fileUploadZoneEl.classList.add('drag-over'); });
      domElements.fileUploadZoneEl.addEventListener('dragleave', (e) => { e.preventDefault(); domElements.fileUploadZoneEl.classList.remove('drag-over'); });
      domElements.fileUploadZoneEl.addEventListener('drop', (e) => {
        e.preventDefault();
        domElements.fileUploadZoneEl.classList.remove('drag-over');
        if (e.dataTransfer?.files) nexusController.handleFilesSelected(e.dataTransfer.files);
      });
      domElements.fileUploadZoneEl.addEventListener('click', (e) => {
        if ((e.target as HTMLElement).classList.contains('file-input-label')) {
            playButtonSound();
        }
      });

      domElements.assessmentTabsContainerEl.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        if (target.classList.contains('tab-button')) {
            playButtonSound();
            const tabId = target.dataset.tab;
            if (tabId) handleAssessmentTabSwitch(tabId);
        }
      });

      // Add event listener for clinical sub-tabs
      const clinicalSubTabsContainer = document.getElementById('clinical-sub-tabs');
      if (clinicalSubTabsContainer) {
          clinicalSubTabsContainer.addEventListener('click', (e) => {
              const target = e.target as HTMLElement;
              if (target.classList.contains('clinical-subtab-button')) {
                  playButtonSound();
                  const subTabId = target.dataset.subtab;
                  if (subTabId) handleClinicalSubTabSwitch(subTabId);
              }
          });
      }


      domElements.quickAccessButtonsContainer.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        if (target.classList.contains('quick-button')) {
          playButtonSound();
          const promptText = target.dataset.prompt;
          if (promptText && domElements.chatInputEl) {
            domElements.chatInputEl.value = promptText;
            domElements.chatInputEl.focus();
            domElements.chatInputEl.style.height = 'auto';
            domElements.chatInputEl.style.height = `${domElements.chatInputEl.scrollHeight}px`;
          }
        }
      });

      domElements.exportNotesButtonEl.addEventListener('click', () => {
        playButtonSound();
        const activeEncounter = appState.getActiveEncounter();
        if (!activeEncounter) {
            alert("No active encounter to export notes from.");
            return;
        }
        let notesText = `Advanced Medical Interface System - Clinical Notes (Encounter: ${activeEncounter.name}):\n\n`;
        const noteCategories: {title: string, items: string[]}[] = [
            { title: "Red Flags", items: activeEncounter.notes.redFlags },
            { title: "Symptoms", items: activeEncounter.notes.symptoms },
            { title: "Diagnoses", items: activeEncounter.notes.diagnoses },
            { title: "Medications", items: activeEncounter.notes.medications },
            { title: "Follow-up Actions", items: activeEncounter.notes.followUp },
            { title: "Patient Education", items: activeEncounter.notes.patientEducation },
        ];

        let hasNotes = false;
        noteCategories.forEach(category => {
            if (category.items.length > 0) {
                hasNotes = true;
                notesText += `${category.title.toUpperCase()}:\n`;
                category.items.forEach(item => notesText += `- ${item}\n`);
                notesText += "\n";
            }
        });

        if (!hasNotes) {
            notesText += "No notes available to export for this encounter.";
        }

        navigator.clipboard.writeText(notesText)
          .then(() => alert('Notes for the current encounter copied to clipboard!'))
          .catch(err => {
            console.error('Failed to copy notes: ', err);
            alert('Failed to copy notes. Please try again or copy manually.');
          });
      });

      domElements.getPredictiveAssessmentButtonEl.addEventListener('click', handleGetPredictiveAssessment);

      nexusController.initializeNexusAIEventListeners();

    } else {
        console.error("One or more critical UI elements are missing. Application cannot start properly.");
        uiManager.displaySystemError("UI elements missing. Advanced Medical Interface cannot start.", true);
    }
}


export async function initializeApp() {
    domElements.queryDomElements(); // Query DOM elements first, so they are available for initializeGeminiAI
    
    const aiInitializedSuccessfully = await aiService.initializeGeminiAI(); 
    
    if (aiInitializedSuccessfully) {
        encounterManager.loadPatientEncounters(); 
        speechService.initializeSpeechAPIs();
    } else {
        // If AI init failed, still attempt to load local encounters if any
        encounterManager.loadPatientEncounters();
         // Optionally, disable AI-dependent features or show further warnings
    }

    initializeEventListeners(); 
    renderAll(); 
    if (domElements.chatInputEl) domElements.chatInputEl.focus();
    
    systemTimerInterval = window.setInterval(updateSystemTime, 1000);
    updateSystemTime(); 

    (window as any).renderPsychometricTerminal = psychController.renderPsychometricTerminal;
    (window as any).createUIRadioGroupHTML = psychController.createUIRadioGroupHTML;
    (window as any).createUIProgressBarHTML = psychController.createUIProgressBarHTML;
    (window as any).createPsychTerminalStyledText = psychController.createPsychTerminalStyledText;
    (window as any).createUITextAreaHTML = psychController.createUITextAreaHTML; 
    (window as any).createUICriteriaTrackerHTML = psychController.createUICriteriaTrackerHTML;
    (window as any).createUISliderHTML = psychController.createUISliderHTML; 
    (window as any).createUITextInputHTML = psychController.createUITextInputHTML;
    (window as any).createUISelectHTML = psychController.createUISelectHTML;
    (window as any).createUICheckboxHTML = psychController.createUICheckboxHTML;
    (window as any).createUICheckboxGroupHTML = psychController.createUICheckboxGroupHTML;

    (window as any).handleDeleteEncounter = encounterManager.handleDeleteEncounter;
    (window as any).handleSwitchEncounter = encounterManager.handleSwitchEncounter;
    (window as any).savePatientEncounters = encounterManager.savePatientEncounters;
    (window as any).playButtonSound = playButtonSound; 
    (window as any).handleRenameEncounter = encounterManager.handleRenameEncounter;

    (window as any).renderNexusAITabContent = nexusController.renderNexusAITabContent;
    (window as any).renderBodySystemTools = bodySystemToolsController.renderBodySystemTools;
    (window as any).updatePsychometricDataForActiveEncounter = encounterManager.updatePsychometricDataForActiveEncounter;
    (window as any).updateToolDataForActiveEncounter = encounterManager.updateToolDataForActiveEncounter;

}