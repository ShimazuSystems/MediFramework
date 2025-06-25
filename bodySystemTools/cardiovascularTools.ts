/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as bodySystemToolsState from '../state/bodySystemToolsState';
import { playButtonSound } from '../utils/helpers';

// Assume these UI helper functions are globally available via window object
declare function createUITextInputHTML(placeholder: string, name: string, value?: string, type?: string): string;
declare function createUISelectHTML(id: string, label: string, options: { value: string; text: string }[], selectedValue: string | string[], allowMultiple?: boolean, helpText?: string): string;
declare function createPsychTerminalStyledText(text: string): string; // For styled text output

// --- Cardiovascular Tools Menu ---
export function renderCardiovascularToolsMenu(container: HTMLElement) {
    container.innerHTML = `
        <div class="tool-menu">
            <button class="tool-menu-button" data-tool-id="ascvdRiskCalculator">ASCVD Risk Calculator</button>
            <button class="tool-menu-button" data-tool-id="heartRateZoneCalculator">Heart Rate Zone Calculator</button>
        </div>
    `;
}

// --- ASCVD Risk Calculator ---
export function renderASCVDToolUI(container: HTMLElement) {
    const data = bodySystemToolsState.getASCVDData();
    container.innerHTML = `
        <div class="tool-form-container ascvd-tool">
            <h4>ASCVD Risk Calculator (10-Year)</h4>
            <p class="tool-description">Estimates 10-year risk of atherosclerotic cardiovascular disease. Based on pooled cohort equations. For adults aged 40-79.</p>
            
            <div class="tool-input-grid">
                ${(window as any).createUITextInputHTML("Years (40-79)", "ascvd-age", data.age, "number")}
                ${(window as any).createUISelectHTML("ascvd-sex", "Sex:", [{value: 'male', text: 'Male'}, {value: 'female', text: 'Female'}], data.sex)}
                ${(window as any).createUISelectHTML("ascvd-race", "Race:", [{value: 'white', text: 'White'}, {value: 'africanAmerican', text: 'African American'}], data.race)}
                ${(window as any).createUITextInputHTML("mg/dL", "ascvd-totalCholesterol", data.totalCholesterol, "number")}
                ${(window as any).createUITextInputHTML("mg/dL", "ascvd-hdlCholesterol", data.hdlCholesterol, "number")}
                ${(window as any).createUITextInputHTML("mmHg", "ascvd-systolicBP", data.systolicBP, "number")}
                ${(window as any).createUISelectHTML("ascvd-onHypertensionTreatment", "On HTN Rx:", [{value: 'yes', text: 'Yes'}, {value: 'no', text: 'No'}], data.onHypertensionTreatment)}
                ${(window as any).createUISelectHTML("ascvd-isDiabetic", "Diabetes:", [{value: 'yes', text: 'Yes'}, {value: 'no', text: 'No'}], data.isDiabetic)}
                ${(window as any).createUISelectHTML("ascvd-isSmoker", "Smoker:", [{value: 'yes', text: 'Yes'}, {value: 'no', text: 'No'}], data.isSmoker)}
            </div>

            <button class="tool-action-button" id="calculate-ascvd-button">Calculate Risk</button>
            
            <div class="tool-output-area" id="ascvd-result-output">
                ${data.riskScore ? `<strong>Estimated 10-Year ASCVD Risk:</strong> <span class="term-highlight">${data.riskScore}</span>` : 'Result will appear here.'}
            </div>
            <p class="tool-disclaimer">Note: This is a simplified educational model. Always use validated clinical tools for patient care.</p>
        </div>
    `;
    
    container.querySelector('#calculate-ascvd-button')?.addEventListener('click', handleASCVDCalculate);
}

export function handleASCVDInputChange(field: keyof bodySystemToolsState.ASCVDData, value: string) {
    bodySystemToolsState.updateASCVDData({ [field]: value, riskScore: null }); // Clear risk score on input change
    // No re-render here, let calculate button trigger update with result
}

function handleASCVDCalculate() {
    playButtonSound();
    const data = bodySystemToolsState.getASCVDData();
    // Basic validation (very simplified for this placeholder)
    if (!data.age || !data.sex || !data.race || !data.totalCholesterol || !data.hdlCholesterol || !data.systolicBP || !data.onHypertensionTreatment || !data.isDiabetic || !data.isSmoker) {
        bodySystemToolsState.updateASCVDData({ riskScore: "[INCOMPLETE INPUT]" });
    } else {
        // Placeholder calculation logic - THIS IS NOT A REAL ASCVD CALCULATION
        const ageNum = parseInt(data.age);
        let riskValue = 5.0; // Base risk
        if (ageNum > 50) riskValue += (ageNum - 50) * 0.2;
        if (data.sex === 'male') riskValue += 1.0;
        if (data.race === 'africanAmerican') riskValue += 0.5;
        if (parseInt(data.totalCholesterol) > 200) riskValue += 1.5;
        if (parseInt(data.hdlCholesterol) < 40) riskValue += 1.0;
        if (parseInt(data.systolicBP) > 130) riskValue += 1.2;
        if (data.onHypertensionTreatment === 'yes') riskValue += 0.8;
        if (data.isDiabetic === 'yes') riskValue += 2.0;
        if (data.isSmoker === 'yes') riskValue += 2.5;

        bodySystemToolsState.updateASCVDData({ riskScore: `${riskValue.toFixed(1)}% (Illustrative)` });
    }

    // Save to active encounter
    if (typeof window.updateToolDataForActiveEncounter === 'function') {
        window.updateToolDataForActiveEncounter('Cardiovascular', 'ascvdRiskCalculator', { ...bodySystemToolsState.getASCVDData() });
    }

    // Re-render the specific tool's UI
    const toolsContainer = document.getElementById('component-specific-tools-container');
    if (toolsContainer) {
       (window as any).renderBodySystemToolContent?.('Cardiovascular', 'ascvdRiskCalculator', toolsContainer.querySelector('.tool-content-area'));
    }
}

// --- Heart Rate Zone Calculator ---
export function renderHeartRateZoneToolUI(container: HTMLElement) {
    const data = bodySystemToolsState.getHeartRateZoneData();
    container.innerHTML = `
        <div class="tool-form-container hr-zone-tool">
            <h4>Heart Rate Zone Calculator</h4>
            <p class="tool-description">Estimates maximum heart rate and target heart rate zones for exercise.</p>
            
            ${(window as any).createUITextInputHTML("Years", "hrzone-age", data.age, "number")}
            <button class="tool-action-button" id="calculate-hrzone-button">Calculate Zones</button>
            
            <div class="tool-output-area" id="hrzone-result-output">
                ${data.maxHeartRate ? `
                    <p><strong>Estimated Max Heart Rate:</strong> <span class="term-highlight">${data.maxHeartRate} bpm</span></p>
                    <p><strong>Target HR Zone (50-85%):</strong> <span class="term-highlight">${data.targetZoneLower} - ${data.targetZoneUpper} bpm</span></p>
                ` : 'Results will appear here.'}
            </div>
            <p class="tool-disclaimer">Note: Uses simplified formula (220 - age). Individual results may vary. Consult a physician before starting an exercise program.</p>
        </div>
    `;
    container.querySelector('#calculate-hrzone-button')?.addEventListener('click', handleHRZoneCalculate);
}

export function handleHRZoneInputChange(value: string) {
    bodySystemToolsState.updateHeartRateZoneData({ age: value, maxHeartRate: null, targetZoneLower: null, targetZoneUpper: null });
}

function handleHRZoneCalculate() {
    playButtonSound();
    const data = bodySystemToolsState.getHeartRateZoneData();
    const age = parseInt(data.age);
    if (isNaN(age) || age <= 0 || age > 120) {
        bodySystemToolsState.updateHeartRateZoneData({ maxHeartRate: null, targetZoneLower: null, targetZoneUpper: null });
         // Display error directly in output for immediate feedback
        const outputEl = document.getElementById('hrzone-result-output');
        if (outputEl) outputEl.innerHTML = (window as any).createPsychTerminalStyledText("[INVALID AGE INPUT]");
        return;
    }

    const maxHR = 220 - age;
    const lowerZone = Math.round(maxHR * 0.50);
    const upperZone = Math.round(maxHR * 0.85);
    bodySystemToolsState.updateHeartRateZoneData({ maxHeartRate: maxHR, targetZoneLower: lowerZone, targetZoneUpper: upperZone });
    
    // Save to active encounter
    if (typeof window.updateToolDataForActiveEncounter === 'function') {
        window.updateToolDataForActiveEncounter('Cardiovascular', 'heartRateZoneCalculator', { ...bodySystemToolsState.getHeartRateZoneData() });
    }

    const toolsContainer = document.getElementById('component-specific-tools-container');
    if (toolsContainer) {
       (window as any).renderBodySystemToolContent?.('Cardiovascular', 'heartRateZoneCalculator', toolsContainer.querySelector('.tool-content-area'));
    }
}
