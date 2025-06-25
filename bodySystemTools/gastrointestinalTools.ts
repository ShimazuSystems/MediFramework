/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as bodySystemToolsState from '../state/bodySystemToolsState';
import { playButtonSound } from '../utils/helpers';

// Assume UI helper functions are globally available
declare function createUICheckboxGroupHTML(idPrefix: string, legend: string, options: { value: string; labelText: string }[], selectedValues: string[], helpText?: string): string;
declare function createPsychTerminalStyledText(text: string): string;

// --- Gastrointestinal Tools Menu ---
export function renderGastrointestinalToolsMenu(container: HTMLElement) {
    container.innerHTML = `
        <div class="tool-menu">
            <button class="tool-menu-button" data-tool-id="ransonsCriteria">Ranson's Criteria (Admission)</button>
            <button class="tool-menu-button" data-tool-id="giPlaceholder" disabled>MELD Score - Placeholder</button>
        </div>
    `;
}

// --- Ranson's Criteria (Admission) ---
const ransonsAdmissionCriteriaOptions = [
    { value: 'ageOver55', labelText: 'Age > 55 years' },
    { value: 'wbcOver16k', labelText: 'WBC > 16,000/µL' },
    { value: 'glucoseOver200', labelText: 'Blood Glucose > 200 mg/dL (11 mmol/L)' },
    { value: 'ldhOver350', labelText: 'Serum LDH > 350 IU/L' },
    { value: 'astOver250', labelText: 'Serum AST > 250 IU/L' }
];

export function renderRansonsCriteriaToolUI(container: HTMLElement) {
    const data = bodySystemToolsState.getRansonsCriteriaData();
    const selectedCheckboxes = Object.keys(data).filter(key => ransonsAdmissionCriteriaOptions.some(opt => opt.value === key) && data[key as keyof bodySystemToolsState.RansonsCriteriaData] === true);

    container.innerHTML = `
        <div class="tool-form-container ransons-criteria-tool">
            <h4>Ranson's Criteria for Pancreatitis Severity (At Admission)</h4>
            <p class="tool-description">Check all criteria present at admission or within the first 48 hours for predicting severity of acute pancreatitis.</p>
            
            ${(window as any).createUICheckboxGroupHTML('ransons-admission', 'Admission Criteria:', ransonsAdmissionCriteriaOptions, selectedCheckboxes)}

            <div class="tool-output-area" id="ransons-result-output">
                ${renderRansonsInterpretation(data)}
            </div>
            <button class="tool-action-button" id="reset-ransons-button" style="margin-top: 0.5rem;">Reset Criteria</button>
            <p class="tool-disclaimer">Note: This tool is for educational purposes. Ranson's criteria also include 48-hour criteria not shown here. Always consult full clinical guidelines.</p>
        </div>
    `;

    container.querySelector('#reset-ransons-button')?.addEventListener('click', () => {
        playButtonSound();
        bodySystemToolsState.resetToolData('Gastrointestinal', 'ransonsCriteria');
        if (typeof window.updateToolDataForActiveEncounter === 'function') {
            window.updateToolDataForActiveEncounter('Gastrointestinal', 'ransonsCriteria', { ...bodySystemToolsState.getRansonsCriteriaData() });
        }
        const toolsContainer = document.getElementById('component-specific-tools-container');
        if (toolsContainer) {
            (window as any).renderBodySystemToolContent?.('Gastrointestinal', 'ransonsCriteria', toolsContainer.querySelector('.tool-content-area'));
        }
    });
}

function renderRansonsInterpretation(data: bodySystemToolsState.RansonsCriteriaData): string {
    if (data.criteriaMet === null) {
        return 'Select criteria to see score and interpretation.';
    }
    let interpretation = "";
    if (data.criteriaMet <= 2) {
        interpretation = "0-2 criteria: Low severity, estimated mortality ~1-5%.";
    } else if (data.criteriaMet <= 4) {
        interpretation = "3-4 criteria: Moderate severity, estimated mortality ~15-20%.";
    } else if (data.criteriaMet <= 6) {
        interpretation = "5-6 criteria: High severity, estimated mortality ~40%.";
    } else {
        interpretation = "7+ criteria (including 48h): Very high severity, estimated mortality ~100%. (This tool only covers admission criteria)";
    }
    bodySystemToolsState.updateRansonsCriteriaData({ interpretation: interpretation }); // Save interpretation to state

    return `
        <p><strong>Criteria Met (Admission):</strong> <span class="term-highlight">${data.criteriaMet} / ${ransonsAdmissionCriteriaOptions.length}</span></p>
        <p><strong>Interpretation:</strong> <span class="term-highlight">${(window as any).createPsychTerminalStyledText(interpretation)}</span></p>
    `;
}


export function handleRansonsCriteriaInputChange(criteriaKey: keyof bodySystemToolsState.RansonsCriteriaData, checked: boolean) {
    bodySystemToolsState.updateRansonsCriteriaData({ [criteriaKey]: checked });
    
    const updatedData = bodySystemToolsState.getRansonsCriteriaData();
    if (typeof window.updateToolDataForActiveEncounter === 'function') {
        window.updateToolDataForActiveEncounter('Gastrointestinal', 'ransonsCriteria', { ...updatedData });
    }

    const outputArea = document.getElementById('ransons-result-output');
    if (outputArea) {
        outputArea.innerHTML = renderRansonsInterpretation(updatedData);
    }
}
