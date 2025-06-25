/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as bodySystemToolsState from '../state/bodySystemToolsState';
import { playButtonSound } from '../utils/helpers';

// Assume these UI helper functions are globally available via window object
declare function createUIRadioGroupHTML(name: string, options: { label: string; value: number }[], selectedValue: number | null, questionIndex?: number): string; // questionIndex optional
declare function createPsychTerminalStyledText(text: string): string;

// --- Neurological Tools Menu ---
export function renderNeurologicalToolsMenu(container: HTMLElement) {
    container.innerHTML = `
        <div class="tool-menu">
            <button class="tool-menu-button" data-tool-id="gcsCalculator">Glasgow Coma Scale (GCS)</button>
            <button class="tool-menu-button" data-tool-id="nihssPlaceholder" disabled>NIH Stroke Scale (NIHSS) - Placeholder</button>
        </div>
    `;
}

// --- Glasgow Coma Scale (GCS) Calculator ---
const gcsCategories = {
    eye: [
        { label: 'Spontaneous', value: 4 }, { label: 'To Speech', value: 3 },
        { label: 'To Pain', value: 2 }, { label: 'None', value: 1 }
    ],
    verbal: [
        { label: 'Orientated', value: 5 }, { label: 'Confused', value: 4 },
        { label: 'Inappropriate Words', value: 3 }, { label: 'Incomprehensible Sounds', value: 2 },
        { label: 'None', value: 1 }
    ],
    motor: [
        { label: 'Obeys Commands', value: 6 }, { label: 'Localises Pain', value: 5 },
        { label: 'Withdraws from Pain', value: 4 }, { label: 'Flexion to Pain (Abnormal)', value: 3 },
        { label: 'Extension to Pain (Abnormal)', value: 2 }, { label: 'None', value: 1 }
    ]
};

export function renderGCSToolUI(container: HTMLElement) {
    const scores = bodySystemToolsState.getGCSScores();
    container.innerHTML = `
        <div class="tool-form-container gcs-tool">
            <h4>Glasgow Coma Scale (GCS)</h4>
            <div class="gcs-grid">
                <div class="gcs-category">
                    <h5>Eye Response (E)</h5>
                    ${(window as any).createUIRadioGroupHTML("gcs-eye", gcsCategories.eye, scores.eye)}
                </div>
                <div class="gcs-category">
                    <h5>Verbal Response (V)</h5>
                    ${(window as any).createUIRadioGroupHTML("gcs-verbal", gcsCategories.verbal, scores.verbal)}
                </div>
                <div class="gcs-category">
                    <h5>Motor Response (M)</h5>
                    ${(window as any).createUIRadioGroupHTML("gcs-motor", gcsCategories.motor, scores.motor)}
                </div>
            </div>
            <div class="tool-output-area gcs-total-score">
                <strong>Total GCS Score:</strong> 
                <span class="term-highlight" id="gcs-total-display">${scores.total !== null ? `${scores.total} / 15` : 'N/A'}</span>
                ${scores.total !== null ? `<span class="gcs-severity-interpretation"> (${getGCSSeverity(scores.total)})</span>` : ''}
            </div>
             <button class="tool-action-button" id="reset-gcs-button">Reset GCS</button>
        </div>
    `;
     container.querySelector('#reset-gcs-button')?.addEventListener('click', () => {
        playButtonSound();
        bodySystemToolsState.resetToolData('Neurological', 'gcsCalculator');
        // Save reset data
        if (typeof window.updateToolDataForActiveEncounter === 'function') {
            window.updateToolDataForActiveEncounter('Neurological', 'gcsCalculator', { ...bodySystemToolsState.getGCSScores() });
        }
        const toolsContainer = document.getElementById('component-specific-tools-container');
        if (toolsContainer) {
            (window as any).renderBodySystemToolContent?.('Neurological', 'gcsCalculator', toolsContainer.querySelector('.tool-content-area'));
        }
    });
}

export function handleGCSInputChange(category: 'eye' | 'verbal' | 'motor', value: number) {
    const currentScores = bodySystemToolsState.getGCSScores();
    bodySystemToolsState.updateGCSScores({ ...currentScores, [category]: value });
    
    const updatedScores = bodySystemToolsState.getGCSScores();
    // Save to active encounter
    if (typeof window.updateToolDataForActiveEncounter === 'function') {
        window.updateToolDataForActiveEncounter('Neurological', 'gcsCalculator', { ...updatedScores });
    }

    // Update display directly or re-render
    const totalDisplay = document.getElementById('gcs-total-display');
    if (totalDisplay) {
        totalDisplay.textContent = updatedScores.total !== null ? `${updatedScores.total} / 15` : 'N/A';
        const interpretationSpan = totalDisplay.nextElementSibling;
        if (interpretationSpan && interpretationSpan.classList.contains('gcs-severity-interpretation')) {
            interpretationSpan.textContent = updatedScores.total !== null ? ` (${getGCSSeverity(updatedScores.total)})` : '';
        } else if (updatedScores.total !== null) {
            const newInterpretationSpan = document.createElement('span');
            newInterpretationSpan.className = 'gcs-severity-interpretation';
            newInterpretationSpan.textContent = ` (${getGCSSeverity(updatedScores.total)})`;
            totalDisplay.insertAdjacentElement('afterend', newInterpretationSpan);
        }
    }
}

function getGCSSeverity(score: number): string {
    if (score >= 13) return "Mild Head Injury";
    if (score >= 9) return "Moderate Head Injury";
    if (score >= 3) return "Severe Head Injury";
    return "Invalid Score";
}

// Placeholder for NIHSS if it becomes interactive later
export function renderNIHSSToolUI(container: HTMLElement) {
    container.innerHTML = `
        <div class="tool-form-container nihss-tool">
            <h4>NIH Stroke Scale (NIHSS)</h4>
            <p>The NIH Stroke Scale is a comprehensive tool used to objectively quantify impairment caused by a stroke.</p>
            <p>Details for an interactive NIHSS tool would go here. For now, this is a placeholder.</p>
            <p><a href="https://www.ninds.nih.gov/health-information/clinical-trials/intramural-stroke-program/nih-stroke-scale-nihss" target="_blank" rel="noopener noreferrer">View official NIHSS information</a></p>
        </div>
    `;
}
