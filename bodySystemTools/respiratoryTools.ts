/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as bodySystemToolsState from '../state/bodySystemToolsState';
import { playButtonSound } from '../utils/helpers';

// Assume these UI helper functions are globally available via window object
declare function createUITextInputHTML(placeholder: string, name: string, value?: string, type?: string): string;
declare function createUISliderHTML(id: string, label: string, minLabel: string, maxLabel: string, min: number, max: number, value: number, color: string): string;
declare function createPsychTerminalStyledText(text: string): string;

// --- Respiratory Tools Menu ---
export function renderRespiratoryToolsMenu(container: HTMLElement) {
    container.innerHTML = `
        <div class="tool-menu">
            <button class="tool-menu-button" data-tool-id="oxygenationIndexCalculator">Oxygenation Index (OI) Calculator</button>
            <button class="tool-menu-button" data-tool-id="bicsCalculator">BICS Score (Inflammation Mockup)</button>
        </div>
    `;
}

// --- Oxygenation Index (OI) Calculator ---
export function renderOxygenationIndexToolUI(container: HTMLElement) {
    const data = bodySystemToolsState.getOxygenationIndexData();
    container.innerHTML = `
        <div class="tool-form-container oi-tool">
            <h4>Oxygenation Index (OI) Calculator</h4>
            <p class="tool-description">Calculates the Oxygenation Index: (MAP * FiO2%) / PaO2.</p>
            
            <div class="tool-input-grid">
                ${(window as any).createUITextInputHTML("cm H2O", "oi-map", data.map, "number")}
                ${(window as any).createUITextInputHTML("% (e.g., 40)", "oi-fio2", data.fio2, "number")}
                ${(window as any).createUITextInputHTML("mmHg", "oi-pao2", data.pao2, "number")}
            </div>

            <button class="tool-action-button" id="calculate-oi-button">Calculate OI</button>
            
            <div class="tool-output-area" id="oi-result-output">
                ${data.oiScore !== null ? `
                    <p><strong>Oxygenation Index (OI):</strong> <span class="term-highlight">${data.oiScore.toFixed(2)}</span></p>
                    <p><strong>Interpretation:</strong> <span class="term-highlight">${data.interpretation || "N/A"}</span></p>
                ` : 'Result will appear here.'}
            </div>
            <p class="tool-disclaimer">Note: Interpretations are illustrative. Clinical context is crucial.</p>
        </div>
    `;
    
    container.querySelector('#calculate-oi-button')?.addEventListener('click', handleOICalculate);
}

export function handleOIInputChange(field: keyof bodySystemToolsState.OxygenationIndexData, value: string) {
    bodySystemToolsState.updateOxygenationIndexData({ [field]: value, oiScore: null, interpretation: null });
}

function handleOICalculate() {
    playButtonSound();
    const data = bodySystemToolsState.getOxygenationIndexData();
    const map = parseFloat(data.map);
    const fio2 = parseFloat(data.fio2); // Assuming input is like 40 for 40%
    const pao2 = parseFloat(data.pao2);

    let resultText = "";
    let interpretationText = "";

    if (isNaN(map) || isNaN(fio2) || isNaN(pao2) || map <=0 || fio2 < 21 || fio2 > 100 || pao2 <= 0) {
        resultText = "[INVALID INPUTS]";
        interpretationText = "Ensure MAP > 0, FiO2 is 21-100, PaO2 > 0.";
        bodySystemToolsState.updateOxygenationIndexData({ oiScore: null, interpretation: interpretationText });
    } else {
        const oi = (map * fio2) / pao2; // FiO2 is already %
        resultText = `${oi.toFixed(2)}`;
        if (oi < 5) interpretationText = "Good oxygenation";
        else if (oi < 15) interpretationText = "Mild ARDS / Lung Injury";
        else if (oi < 25) interpretationText = "Moderate ARDS";
        else interpretationText = "Severe ARDS";
        bodySystemToolsState.updateOxygenationIndexData({ oiScore: oi, interpretation: interpretationText });
    }
    
    if (typeof window.updateToolDataForActiveEncounter === 'function') {
        window.updateToolDataForActiveEncounter('Respiratory', 'oxygenationIndexCalculator', { ...bodySystemToolsState.getOxygenationIndexData() });
    }

    // Re-render the specific tool's UI - this requires the main controller to call render
    const toolsContainer = document.getElementById('component-specific-tools-container');
    if (toolsContainer) {
       (window as any).renderBodySystemToolContent?.('Respiratory', 'oxygenationIndexCalculator', toolsContainer.querySelector('.tool-content-area'));
    }
}

// --- BICS (Bronchial Inflammatory Cytokine Score) - Mockup ---
export function renderBICSToolUI(container: HTMLElement) {
    const data = bodySystemToolsState.getBICSData();
    container.innerHTML = `
        <div class="tool-form-container bics-tool">
            <h4>BICS Score (Inflammation Mockup)</h4>
            <p class="tool-description">Illustrative score for bronchial inflammation based on symptoms.</p>
            
            ${(window as any).createUISliderHTML("bics-coughSeverity", "Cough Severity:", "Mild", "Severe", 0, 10, data.coughSeverity, 'var(--accent-amber)')}
            ${(window as any).createUISliderHTML("bics-sputumVolume", "Sputum Volume:", "Low", "High", 0, 10, data.sputumVolume, 'var(--accent-amber)')}
            ${(window as any).createUISliderHTML("bics-wheezeFrequency", "Wheeze Frequency:", "Rare", "Constant", 0, 10, data.wheezeFrequency, 'var(--accent-amber)')}
            
            <button class="tool-action-button" id="calculate-bics-button">Calculate BICS</button>

            <div class="tool-output-area" id="bics-result-output">
                ${data.totalScore !== null ? `
                    <p><strong>BICS Total Score:</strong> <span class="term-highlight">${data.totalScore} / 30</span></p>
                    <p><strong>Interpretation:</strong> <span class="term-highlight">${data.interpretation || "N/A"}</span></p>
                ` : 'Result will appear here.'}
            </div>
             <p class="tool-disclaimer">Note: BICS is a fictional score for demonstration purposes only.</p>
        </div>
    `;
    container.querySelector('#calculate-bics-button')?.addEventListener('click', handleBICSCalculate);
}

export function handleBICSInputChange(sliderId: string, value: number) {
    const field = sliderId.replace('bics-', '') as keyof bodySystemToolsState.BICSData;
    bodySystemToolsState.updateBICSData({ [field]: value });
    // Visual update of slider value is handled by the global input listener in psychometricController for now
}


function handleBICSCalculate() {
    playButtonSound();
    const data = bodySystemToolsState.getBICSData(); // Data already updated by sliders via updateBICSData
    
    let interpretationText = "";
    if (data.totalScore === null) { // Should not happen if sliders have default values
        interpretationText = "Error in calculation.";
    } else if (data.totalScore <= 10) {
        interpretationText = "Low likelihood of significant active inflammation.";
    } else if (data.totalScore <= 20) {
        interpretationText = "Moderate likelihood of active inflammation.";
    } else {
        interpretationText = "High likelihood of significant active inflammation.";
    }
    bodySystemToolsState.updateBICSData({ interpretation: interpretationText });

    if (typeof window.updateToolDataForActiveEncounter === 'function') {
        window.updateToolDataForActiveEncounter('Respiratory', 'bicsCalculator', { ...bodySystemToolsState.getBICSData() });
    }

    const toolsContainer = document.getElementById('component-specific-tools-container');
    if (toolsContainer) {
       (window as any).renderBodySystemToolContent?.('Respiratory', 'bicsCalculator', toolsContainer.querySelector('.tool-content-area'));
    }
}
