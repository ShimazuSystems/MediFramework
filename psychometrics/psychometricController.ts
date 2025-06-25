/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as psychState from '../../state/psychometricState';
import * as appState from '../../state/appState'; // For patient name
import * as domElements from '../../dom/domElements';
import { playButtonSound } from '../../utils/helpers';

// Import individual psychometric module render functions and handlers
import { renderGAD7Screen, handleGAD7OptionChange, gad7Data } from '../../psychometrics/gad7';
import { 
    renderClinicalInterviewScreen, 
    handleClinicalInterviewInputChange, 
    handleClinicalInterviewResponseSubmit, 
    handleEndClinicalInterview,
    startClinicalInterview,
    clinicalInterviewData
} from '../../psychometrics/clinicalInterview';
import {
    renderPCL5Screen,
    handlePCL5OptionChange,
    pcl5Data
} from '../../psychometrics/pcl5';
import {
    renderPersonalityMatrixScreen,
    handlePersonalityMatrixSliderChange,
    handlePersonalityMatrixInputChange,
    requestAIAnalysis as requestPersonalityAIAnalysis,
    handleResetPersonalityMatrix,
    initializePersonalityMatrixData, 
    personalityMatrixData as pmDataLocal // renamed to avoid conflict
} from '../../psychometrics/personalityMatrix';
import {
    renderMSEScreen,
    handleMSEInputChange,
    handleMSEMultiSelectChange,
    handleMSECheckboxChange,
    requestAISectionAnalysis as requestMSEAISectionAnalysis,
    requestOverallAIMSEAnalysis,
    resetMSEData,
    initializeMSEData,
    mseData
} from '../../psychometrics/mse';
// Removed Cognitive Assessment imports
import {
    renderPHQ9Screen,
    handlePHQ9OptionChange,
    phq9Data
} from '../../psychometrics/phq9';
import {
    renderReportGeneratorScreen,
    handleReportGeneratorCheckboxChange,
    handleReportGeneratorOptionChange,
    requestAIReport,
    reportGeneratorData
} from '../../psychometrics/reportGenerator';
import {
    renderNNPAScreen,
    handleNNPANotesChange,
    requestNNPADomainAI,
    requestNNPAOverallAI,
    resetNNPA,
    initializeNNPAData,
    nnpaData
} from '../../psychometrics/nnpa';


export function initializePsychometricTerminal() {
    if (!domElements.psychometricTerminalDisplayEl) {
        if (!domElements.psychometricToolsTabEl) return; // Should not happen if DOM is ready

        domElements.psychometricToolsTabEl.innerHTML = ''; // Clear placeholder
        const newTerminalDisplayEl = document.createElement('div');
        newTerminalDisplayEl.id = 'psychometric-terminal-display';
        domElements.psychometricToolsTabEl.appendChild(newTerminalDisplayEl);
        domElements.assignPsychometricTerminalDisplayEl(newTerminalDisplayEl); // Update global ref

        newTerminalDisplayEl.addEventListener('click', async (e) => { // Made async for AI calls
            const target = e.target as HTMLElement;
            const buttonClicked = target.closest('button');
            
            if (buttonClicked) {
                playButtonSound();
            }

            const navAction = target.closest('[data-nav-target]')?.getAttribute('data-nav-target');
            const navContextAttr = target.closest('[data-nav-target]')?.getAttribute('data-nav-context');
            psychState.setPsychometricModuleContext(navContextAttr ? JSON.parse(navContextAttr) : null);

            const clickAction = target.closest('[data-action]')?.getAttribute('data-action');
            const actionContext = target.closest('[data-action]')?.getAttribute('data-action-context');

            if (navAction) {
                psychState.setActivePsychometricModule(navAction as psychState.PsychometricModule);
                
                if (psychState.activePsychometricModule === 'clinicalInterview' && (!clinicalInterviewData.isInterviewActive || clinicalInterviewData.conversationLog.length === 0)) {
                   startClinicalInterview();
                }
                if (psychState.activePsychometricModule === 'personalityMatrix') {
                    if (typeof initializePersonalityMatrixData === 'function' && Object.keys(pmDataLocal.userRatings).length === 0) {
                       initializePersonalityMatrixData();
                   }
               }
               if (psychState.activePsychometricModule === 'mse') {
                   if (typeof initializeMSEData === 'function' && Object.keys(mseData.sections).length === 0) { 
                       initializeMSEData();
                   }
               }
               if (psychState.activePsychometricModule === 'nnpa') {
                   if (typeof initializeNNPAData === 'function' && nnpaData.domains.length === 0) {
                       initializeNNPAData();
                   }
               }
                renderPsychometricTerminal();
            } else if (clickAction) {
                if (clickAction === 'submitClinicalResponse') {
                    handleClinicalInterviewResponseSubmit();
                    (window as any).updatePsychometricDataForActiveEncounter?.('clinicalInterview', { ...clinicalInterviewData });
                } else if (clickAction === 'endClinicalInterview') {
                    handleEndClinicalInterview();
                    (window as any).updatePsychometricDataForActiveEncounter?.('clinicalInterview', { ...clinicalInterviewData });
                } else if (clickAction === 'requestPersonalityAIAnalysis') {
                    await requestPersonalityAIAnalysis(); // is async
                    (window as any).updatePsychometricDataForActiveEncounter?.('personalityMatrix', { ...pmDataLocal });
                } else if (clickAction === 'resetPersonalityMatrix') {
                    handleResetPersonalityMatrix();
                     (window as any).updatePsychometricDataForActiveEncounter?.('personalityMatrix', { ...pmDataLocal });
                } else if (clickAction === 'requestMSEAISectionAnalysis' && actionContext) {
                    await requestMSEAISectionAnalysis(actionContext as keyof typeof mseData.sections); // is async
                    (window as any).updatePsychometricDataForActiveEncounter?.('mse', { ...mseData });
                } else if (clickAction === 'requestOverallAIMSEAnalysis') {
                    await requestOverallAIMSEAnalysis(); // is async
                    (window as any).updatePsychometricDataForActiveEncounter?.('mse', { ...mseData });
                } else if (clickAction === 'resetMSEData') {
                    resetMSEData();
                     (window as any).updatePsychometricDataForActiveEncounter?.('mse', { ...mseData });
                } 
                else if (clickAction === 'generateAIReport') {
                    await requestAIReport(); // is async
                    (window as any).updatePsychometricDataForActiveEncounter?.('reportGenerator', { ...reportGeneratorData });
                } else if (clickAction === 'requestNNPADomainAI' && actionContext) {
                    await requestNNPADomainAI(actionContext); // is async
                    (window as any).updatePsychometricDataForActiveEncounter?.('nnpa', { ...nnpaData });
                } else if (clickAction === 'requestNNPAOverallAI') {
                    await requestNNPAOverallAI(); // is async
                    (window as any).updatePsychometricDataForActiveEncounter?.('nnpa', { ...nnpaData });
                } else if (clickAction === 'resetNNPA') {
                    resetNNPA();
                    (window as any).updatePsychometricDataForActiveEncounter?.('nnpa', { ...nnpaData });
                }
            }
        });
        newTerminalDisplayEl.addEventListener('input', (e) => { 
            const eventTarget = e.target;
            if (!(eventTarget instanceof HTMLElement)) return;

            if (eventTarget instanceof HTMLInputElement) {
                const inputElement = eventTarget;
                if (inputElement.classList.contains('ui-slider-input')) {
                    if (inputElement.name.startsWith('pm-slider-')) {
                        handlePersonalityMatrixSliderChange(inputElement.name, parseInt(inputElement.value, 10));
                        // No immediate save on slider drag, save on AI analysis or reset
                    } else if (inputElement.name.startsWith('bics-')) { 
                        const psychTerminalDisplayEl = document.getElementById('psychometric-terminal-display'); 
                        const outputEl = psychTerminalDisplayEl?.querySelector(`output[for="${inputElement.id}"]`); 
                        if (outputEl) {
                           outputEl.textContent = `Current: ${inputElement.value}/10`;
                        }
                    }
                } else if (inputElement.type === 'radio') {
                    const radioName = inputElement.name;
                    const value = parseInt(inputElement.value, 10);
                    if (radioName.startsWith('phq9-q')) {
                        handlePHQ9OptionChange(radioName, value);
                        (window as any).updatePsychometricDataForActiveEncounter?.('phq9', { ...phq9Data });
                    } else if (radioName.startsWith('gad7-q')) {
                         handleGAD7OptionChange(radioName, value);
                         (window as any).updatePsychometricDataForActiveEncounter?.('gad7', { ...gad7Data });
                    } else if (radioName.startsWith('pcl5-q')) {
                        handlePCL5OptionChange(radioName, value);
                        (window as any).updatePsychometricDataForActiveEncounter?.('pcl5', { ...pcl5Data });
                    }
                } else if (inputElement.type === 'checkbox') {
                     if (inputElement.name.startsWith('mse-')) {
                        handleMSECheckboxChange(inputElement.name, inputElement.dataset.value || '', inputElement.checked);
                        (window as any).updatePsychometricDataForActiveEncounter?.('mse', { ...mseData });
                     } else if (inputElement.name.startsWith('rg-asm-')) {
                        handleReportGeneratorCheckboxChange(inputElement.name, inputElement.dataset.value || '', inputElement.checked);
                        // Save implicitly handled by generateAIReport
                    } else if (inputElement.name.startsWith('ransons-')) {
                        // This is handled by body system tools
                    }
                }
            } else if (eventTarget instanceof HTMLTextAreaElement) {
                const textAreaElement = eventTarget;
                if (textAreaElement.name === 'clinical_interview_response') {
                    handleClinicalInterviewInputChange(textAreaElement);
                    // No immediate save on text input, save on submit/end
                } else if (textAreaElement.name.startsWith('mse-')) {
                     handleMSEInputChange(textAreaElement.name, textAreaElement.value);
                     // No immediate save, save on AI analysis
                } else if (textAreaElement.name.startsWith('nnpa-notes-')) {
                    handleNNPANotesChange(textAreaElement.name, textAreaElement.value);
                    // No immediate save, save on AI analysis
                }
            } else if (eventTarget instanceof HTMLSelectElement) {
                if (eventTarget.name.startsWith('mse-')) {
                    if (eventTarget.multiple) {
                        handleMSEMultiSelectChange(eventTarget.name, Array.from(eventTarget.selectedOptions).map(opt => opt.value));
                    }
                    // No immediate save, save on AI analysis
                } else if (eventTarget.id === 'rg-report-type') {
                    handleReportGeneratorOptionChange('reportType', eventTarget.value);
                     // Save implicitly handled by generateAIReport
                }
            }
        });
        
        newTerminalDisplayEl.addEventListener('change', (e) => { // 'change' for text inputs after blur
            const eventTarget = e.target;
            if (eventTarget instanceof HTMLInputElement && eventTarget.type === 'text' && eventTarget.name.startsWith('pm-text-')) {
                handlePersonalityMatrixInputChange(eventTarget.name, eventTarget.value);
                // No immediate save, save on AI analysis
            } else if (eventTarget instanceof HTMLSelectElement && eventTarget.name.startsWith('mse-') && !eventTarget.multiple) {
                 handleMSEInputChange(eventTarget.name, eventTarget.value);
                 // No immediate save, save on AI analysis
            } else if (eventTarget instanceof HTMLSelectElement && eventTarget.id === 'rg-report-type') {
                 handleReportGeneratorOptionChange('reportType', eventTarget.value);
                 // Save implicitly handled by generateAIReport
            }
        });
    }
}

export function updatePsychometricHeaderTime() {
    psychState.setCurrentPsychometricTime(new Date());
    const timeEl = domElements.psychometricTerminalDisplayEl?.querySelector('.psych-header-time');
    if (timeEl) {
        timeEl.textContent = `TIME: ${psychState.currentPsychometricTime.toLocaleTimeString()}`;
    }
}

export function createPsychTerminalStyledText(text: string): string {
    if (!text) return "";
    return text
        .replace(/\[(.*?)\]/g, "<span class='term-highlight'>[$1]</span>") 
        .replace(/\n/g, "<br>");
}

function renderPsychTerminalHeader() {
    const patientName = appState.activeEncounterId ? appState.patientEncounters.find(e => e.id === appState.activeEncounterId)?.name : "[REDACTED]";
    return `
        <div class="psych-terminal-header">
            <span>PSYCHOMETRIC ASSESSMENT MODULE v2.1.7</span><span class="psych-header-status">[ACTIVE SESSION]</span><br>
            <span>PATIENT: ${patientName || "[REDACTED]"}</span><span>SESSION: PSY-${new Date().getFullYear()}-001</span><span class="psych-header-time">TIME: ${psychState.currentPsychometricTime.toLocaleTimeString()}</span>
        </div>
    `;
}

export function createUIProgressBarHTML(value: number, max: number = 100, text?: string, id?: string): string {
    const percentage = (value / max) * 100;
    return `
        <div class="ui-progress-bar" ${id ? `id="${id}"` : ''} role="progressbar" aria-valuenow="${value}" aria-valuemin="0" aria-valuemax="${max}">
            <div class="ui-progress-bar-fill" style="width: ${percentage}%;"></div>
            <span class="ui-progress-bar-text">${text || `${value}/${max}`}</span>
        </div>`;
}

export function createUISliderHTML(id:string, label: string, minLabel: string, maxLabel: string, min: number, max: number, value: number, color: string): string {
    return `
        <div class="ui-slider-container">
            <label for="${id}" class="ui-slider-label">${label}</label>
            <div class="ui-slider-wrapper">
                <span class="ui-slider-minmax">${minLabel}</span>
                <input type="range" id="${id}" name="${id}" min="${min}" max="${max}" value="${value}" class="ui-slider-input" style="--slider-color: ${color};">
                <span class="ui-slider-minmax">${maxLabel}</span>
            </div>
            <output for="${id}" class="ui-slider-value">Current: ${value}/${max}</output>
        </div>`;
}
export function createUIRadioGroupHTML(name: string, options: { label: string; value: number }[], selectedValue: number | null, questionIndex: number): string {
    let optionsHTML = "";
    options.forEach((opt, optIndex) => {
        optionsHTML += `
            <label class="ui-radio-label">
                <input type="radio" name="${name}" value="${opt.value}" class="ui-radio-input" 
                       ${selectedValue === opt.value ? 'checked' : ''} 
                       data-question-index="${questionIndex}" data-option-index="${optIndex}">
                <span class="ui-radio-button"></span>
                <span class="ui-radio-text">[${opt.value}] ${opt.label}</span>
            </label>`;
    });
    return `<div class="ui-radio-group" role="radiogroup">${optionsHTML}</div>`;
}
export function createUICheckboxHTML(label: string, name: string, value: string, checked: boolean): string {
    return `
        <label class="ui-checkbox-label">
            <input type="checkbox" name="${name}" data-value="${value}" class="ui-checkbox-input" ${checked ? 'checked' : ''}>
            <span class="ui-checkbox-custom"></span>
            <span class="ui-checkbox-text">${label}</span>
        </label>`;
}
export function createUITextInputHTML(placeholder: string, name: string, value: string = "", type: string = "text"): string {
    return `<input type="${type}" name="${name}" placeholder="${placeholder}" class="ui-text-input" value="${value}">`;
}
export function createUITextAreaHTML(placeholder: string, name: string, rows: number, value: string = "", readonly: boolean = false): string {
    return `<textarea name="${name}" placeholder="${placeholder}" class="ui-text-area" rows="${rows}" ${readonly ? 'readonly' : ''}>${value}</textarea>`;
}
export function createUICriteriaTrackerHTML(met: number, total: number): string {
    return `<span class="ui-criteria-tracker">DSM-5 CRITERIA: [${met}/${total}] MET</span>`;
}
export function createUISelectHTML(id: string, label: string, options: { value: string; text: string }[], selectedValue: string | string[], allowMultiple: boolean = false, helpText?: string): string {
    let selectOptionsHTML = options.map(opt =>
        `<option value="${opt.value}" ${
            allowMultiple && Array.isArray(selectedValue) ? (selectedValue.includes(opt.value) ? 'selected' : '') : (selectedValue === opt.value ? 'selected' : '')
        }>${opt.text}</option>`
    ).join('');

    return `
        <div class="ui-select-container">
            <label for="${id}" class="ui-select-label">${label}</label>
            ${helpText ? `<p class="ui-input-help-text">${helpText}</p>` : ''}
            <select id="${id}" name="${id}" class="ui-select-input" ${allowMultiple ? 'multiple' : ''}>
                ${allowMultiple ? selectOptionsHTML : `<option value="" ${selectedValue === "" ? 'selected':''}>-- Select --</option>${selectOptionsHTML}`}
            </select>
        </div>`;
}
export function createUICheckboxGroupHTML(idPrefix: string, legend: string, options: { value: string; labelText: string }[], selectedValues: string[], helpText?: string): string {
    let checkboxesHTML = options.map(opt => `
        <label class="ui-checkbox-label">
            <input type="checkbox" name="${idPrefix}-${opt.value}" data-value="${opt.value}" class="ui-checkbox-input" 
                   ${selectedValues.includes(opt.value) ? 'checked' : ''}>
            <span class="ui-checkbox-custom"></span>
            <span class="ui-checkbox-text">${opt.labelText}</span>
        </label>`).join('');

    return `
        <fieldset class="ui-fieldset">
            <legend class="ui-legend">${legend}</legend>
            ${helpText ? `<p class="ui-input-help-text">${helpText}</p>` : ''}
            <div class="ui-checkbox-group">
                ${checkboxesHTML}
            </div>
        </fieldset>`;
}


function renderPsychMainMenu() {
    const menuItems = [
        { label: "Mental State Examination (MSE) + AI", target: "mse" },
        { label: "Neural Network Psychosis Assessment (NNPA)", target: "nnpa" },
        { label: "Standardized Assessment (PHQ-9)", target: "phq9" },
        { label: "Standardized Assessment (GAD-7)", target: "gad7" },
        { label: "Personality Assessment Matrix (AI)", target: "personalityMatrix" }, 
        { label: "Trauma Assessment Protocol (PCL-5)", target: "traumaPCL5" },
        { label: "Simulated Clinical Interview", target: "clinicalInterview" },
        { label: "Psychometric Report Generator (AI)", target: "reportGenerator" },
    ];
    let menuHTML = "<div class='psych-main-menu'><div class='psych-module-title'>MAIN MENU</div>";
    menuItems.forEach((item, index) => {
        menuHTML += `<div class="psych-menu-item" data-nav-target="${item.target}">[${index + 1}] ${item.label}</div>`;
    });
    menuHTML += "</div>";
    return menuHTML;
}

function renderModuleNotImplemented(moduleName?: string) {
    const name = moduleName || psychState.psychometricModuleContext?.name || psychState.activePsychometricModule;
    return `<div class='psych-module-content'>
                <div class='psych-module-title'>MODULE UNDER CONSTRUCTION</div>
                <p>The '${name}' module is not yet implemented or has been removed.</p>
                <br>
                <div class="psych-nav-options">
                    <button data-nav-target="mainMenu">Back to Main Menu</button>
                </div>
            </div>`;
}

// This function is THE renderPsychometricTerminal
export function renderPsychometricTerminal() {
    if (!domElements.psychometricTerminalDisplayEl) {
        initializePsychometricTerminal(); 
        if (!domElements.psychometricTerminalDisplayEl) return; 
    }

    let contentHTML = renderPsychTerminalHeader();

    switch (psychState.activePsychometricModule) {
        case 'mainMenu': contentHTML += renderPsychMainMenu(); break;
        case 'mse': contentHTML += renderMSEScreen(); break;
        case 'phq9': contentHTML += renderPHQ9Screen(); break;
        case 'gad7': contentHTML += renderGAD7Screen(); break; 
        case 'personalityMatrix': contentHTML += renderPersonalityMatrixScreen(); break; 
        case 'traumaPCL5': contentHTML += renderPCL5Screen(); break; 
        case 'clinicalInterview': contentHTML += renderClinicalInterviewScreen(); break;
        case 'reportGenerator': contentHTML += renderReportGeneratorScreen(); break;
        case 'nnpa': contentHTML += renderNNPAScreen(); break;
        case 'notImplemented': // Explicitly handle this case if it was set
             contentHTML += renderModuleNotImplemented(psychState.psychometricModuleContext?.name);
             break;
        default:
            // For any other unhandled module string, treat as not implemented
            psychState.setPsychometricModuleContext({ name: psychState.activePsychometricModule }); 
            contentHTML += renderModuleNotImplemented();
            psychState.setActivePsychometricModule('notImplemented'); 
            break;
    }
    domElements.psychometricTerminalDisplayEl.innerHTML = contentHTML;
    window.scrollTo(0, 0); // Scroll to top after rendering
}