/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Top Navigation
export let currentPatientIdEl: HTMLElement;
export let geminiApiStatusTextEl: HTMLElement; // Changed from nexusStatusTextEl
export let systemTimeEl: HTMLElement;

// Left Component Navigation Panel
export let newEncounterButtonEl: HTMLButtonElement;
export let renameActiveEncounterButtonEl: HTMLButtonElement; 
export let patientEncountersListEl: HTMLElement;
export let bodySystemTabsEl: HTMLElement;
export let patientDataButtonEl: HTMLButtonElement; // Added

// Center Assessment & Documentation Panel
export let assessmentTabsContainerEl: HTMLElement;
export let tabContents: NodeListOf<HTMLElement>;
export let selectedSystemDisplayHeaderEl: HTMLElement;
export let currentSelectedSystemNameEl: HTMLElement;

// NEXUS-AI Tab (within Center Panel)
export let nexusAiTabEl: HTMLElement;
export let chatHistoryEl: HTMLElement;
export let chatFormEl: HTMLFormElement;
export let chatInputEl: HTMLTextAreaElement;
export let sendButtonEl: HTMLButtonElement;
export let fileInputEl: HTMLInputElement;
export let fileUploadZoneEl: HTMLElement;
export let uploadedFilesListEl: HTMLElement;
export let dropPromptEl: HTMLElement;
export let quickAccessButtonsContainer: HTMLElement;


// Clinical Notes Tab (within Center Panel)
export let notesRedFlagsListEl: HTMLElement;
export let notesSymptomsListEl: HTMLElement;
export let notesDiagnosesListEl: HTMLElement;
export let notesMedicationsListEl: HTMLElement;
export let notesFollowUpListEl: HTMLElement;
export let notesPatientEducationListEl: HTMLElement;
export let exportNotesButtonEl: HTMLButtonElement; // Changed to HTMLButtonElement
// Predictive Assessment AI Elements
export let predictiveAssessmentAISectionEl: HTMLElement;
export let predictiveNotesInputEl: HTMLTextAreaElement;
export let getPredictiveAssessmentButtonEl: HTMLButtonElement;
export let predictiveAssessmentOutputEl: HTMLElement;


// Psychometrics Tab (within Center Panel)
export let psychometricToolsTabEl: HTMLElement;
export let psychometricTerminalDisplayEl: HTMLElement | null = null;

// Right Component Resources Panel
export let componentSpecificToolsContainerEl: HTMLElement; // Changed from componentSpecificToolsPlaceholderEl

// Global
export let loadingIndicatorEl: HTMLElement;
export let mainDisclaimerEl: HTMLElement;
export let uiButtonSound: HTMLAudioElement | null;
export let uiLongBeepSound: HTMLAudioElement | null;
export let uiOnlineSound: HTMLAudioElement | null;


// Rename Modal Elements
export let renameModalEl: HTMLElement;
export let renameModalTitleEl: HTMLElement;
export let renameModalInputEl: HTMLInputElement;
export let renameModalOkButtonEl: HTMLButtonElement;
export let renameModalCancelButtonEl: HTMLButtonElement;

// Patient Data Modal Elements
export let patientDataModalEl: HTMLElement;
export let patientDataModalTitleEl: HTMLElement;
export let patientDataModalSaveButtonEl: HTMLButtonElement;
export let patientDataModalCancelButtonEl: HTMLButtonElement;
// Input fields for Patient Data Modal
export let patientDataFirstNameEl: HTMLInputElement;
export let patientDataMiddleNameEl: HTMLInputElement;
export let patientDataLastNameEl: HTMLInputElement;
export let patientDataDobEl: HTMLInputElement;
export let patientDataAgeEl: HTMLInputElement;
export let patientDataGenderEl: HTMLSelectElement;
export let patientDataCityEl: HTMLInputElement;
export let patientDataMedicationsEl: HTMLTextAreaElement;
export let patientDataAllergiesEl: HTMLTextAreaElement;
export let patientDataChronicConditionsEl: HTMLTextAreaElement;
export let patientDataPreviousSurgeriesEl: HTMLTextAreaElement;
export let patientDataReasonForVisitEl: HTMLTextAreaElement;
export let patientDataPcpEl: HTMLInputElement;
export let patientDataAdditionalNotesEl: HTMLTextAreaElement;


export function queryDomElements() {
    currentPatientIdEl = document.getElementById('current-patient-id')!;
    geminiApiStatusTextEl = document.getElementById('gemini-api-status-text')!; // Updated ID
    systemTimeEl = document.getElementById('system-time')!;

    newEncounterButtonEl = document.getElementById('new-encounter-button') as HTMLButtonElement;
    renameActiveEncounterButtonEl = document.getElementById('rename-active-encounter-button') as HTMLButtonElement; 
    patientEncountersListEl = document.getElementById('patient-encounters-list')!;
    bodySystemTabsEl = document.getElementById('body-system-tabs')!;
    patientDataButtonEl = document.getElementById('patient-data-button') as HTMLButtonElement; // Added

    assessmentTabsContainerEl = document.getElementById('assessment-tabs')!;
    tabContents = document.querySelectorAll<HTMLElement>('.tab-content');
    selectedSystemDisplayHeaderEl = document.getElementById('selected-system-display-header')!;
    currentSelectedSystemNameEl = document.getElementById('current-selected-system-name')!;

    nexusAiTabEl = document.getElementById('nexus-ai-tab')!;
    // Dynamic elements for NEXUS-AI tab (chatHistoryEl etc.) are assigned in reassignNexusChatElements

    notesRedFlagsListEl = document.getElementById('notes-red-flags-list')!;
    notesSymptomsListEl = document.getElementById('notes-symptoms-list')!;
    notesDiagnosesListEl = document.getElementById('notes-diagnoses-list')!;
    notesMedicationsListEl = document.getElementById('notes-medications-list')!;
    notesFollowUpListEl = document.getElementById('notes-follow-up-list')!;
    notesPatientEducationListEl = document.getElementById('notes-patient-education-list')!;
    exportNotesButtonEl = document.getElementById('export-notes-button') as HTMLButtonElement;

    // Predictive Assessment AI Elements
    predictiveAssessmentAISectionEl = document.getElementById('predictive-assessment-ai-section')!;
    predictiveNotesInputEl = document.getElementById('predictive-notes-input') as HTMLTextAreaElement;
    getPredictiveAssessmentButtonEl = document.getElementById('get-predictive-assessment-button') as HTMLButtonElement;
    predictiveAssessmentOutputEl = document.getElementById('predictive-assessment-output')!;


    psychometricToolsTabEl = document.getElementById('psychometric-tools-tab')!;
    // psychometricTerminalDisplayEl initialized dynamically

    componentSpecificToolsContainerEl = document.getElementById('component-specific-tools-container')!; // Updated ID and no querySelector
    
    loadingIndicatorEl = document.getElementById('loading-indicator')!;
    mainDisclaimerEl = document.getElementById('disclaimer')!;
    uiButtonSound = document.getElementById('ui-button-sound') as HTMLAudioElement;
    uiLongBeepSound = document.getElementById('ui-long-beep-sound') as HTMLAudioElement;
    uiOnlineSound = document.getElementById('ui-online-sound') as HTMLAudioElement;


    // Rename Modal Elements
    renameModalEl = document.getElementById('rename-modal')!;
    renameModalTitleEl = document.getElementById('rename-modal-title')!;
    renameModalInputEl = document.getElementById('rename-modal-input') as HTMLInputElement;
    renameModalOkButtonEl = document.getElementById('rename-modal-ok') as HTMLButtonElement;
    renameModalCancelButtonEl = document.getElementById('rename-modal-cancel') as HTMLButtonElement;

    // Patient Data Modal Elements
    patientDataModalEl = document.getElementById('patient-data-modal')!;
    patientDataModalTitleEl = document.getElementById('patient-data-modal-title')!;
    patientDataModalSaveButtonEl = document.getElementById('patient-data-modal-save') as HTMLButtonElement;
    patientDataModalCancelButtonEl = document.getElementById('patient-data-modal-cancel') as HTMLButtonElement;
    patientDataFirstNameEl = document.getElementById('patient-data-firstName') as HTMLInputElement;
    patientDataMiddleNameEl = document.getElementById('patient-data-middleName') as HTMLInputElement;
    patientDataLastNameEl = document.getElementById('patient-data-lastName') as HTMLInputElement;
    patientDataDobEl = document.getElementById('patient-data-dob') as HTMLInputElement;
    patientDataAgeEl = document.getElementById('patient-data-age') as HTMLInputElement;
    patientDataGenderEl = document.getElementById('patient-data-gender') as HTMLSelectElement;
    patientDataCityEl = document.getElementById('patient-data-city') as HTMLInputElement;
    patientDataMedicationsEl = document.getElementById('patient-data-medications') as HTMLTextAreaElement;
    patientDataAllergiesEl = document.getElementById('patient-data-allergies') as HTMLTextAreaElement;
    patientDataChronicConditionsEl = document.getElementById('patient-data-chronicConditions') as HTMLTextAreaElement;
    patientDataPreviousSurgeriesEl = document.getElementById('patient-data-previousSurgeries') as HTMLTextAreaElement;
    patientDataReasonForVisitEl = document.getElementById('patient-data-reasonForVisit') as HTMLTextAreaElement;
    patientDataPcpEl = document.getElementById('patient-data-pcp') as HTMLInputElement;
    patientDataAdditionalNotesEl = document.getElementById('patient-data-additionalNotes') as HTMLTextAreaElement;

}

export function assignPsychometricTerminalDisplayEl(element: HTMLElement | null) {
    psychometricTerminalDisplayEl = element;
}

// This function will be called from appCore or index.tsx after DOM is ready
export function reassignNexusChatElements() {
    chatHistoryEl = document.getElementById('chat-history')!;
    chatFormEl = document.getElementById('chat-form') as HTMLFormElement;
    chatInputEl = document.getElementById('chat-input') as HTMLTextAreaElement;
    sendButtonEl = document.getElementById('send-button') as HTMLButtonElement;
    fileInputEl = document.getElementById('file-input') as HTMLInputElement;
    fileUploadZoneEl = document.getElementById('file-upload-zone')!;
    uploadedFilesListEl = document.getElementById('uploaded-files-list')!;
    dropPromptEl = document.getElementById('drop-prompt')!;
    quickAccessButtonsContainer = document.getElementById('quick-access-buttons')!;
}