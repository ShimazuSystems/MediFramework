/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as bodySystemToolsState from '../state/bodySystemToolsState';
import { playButtonSound } from '../utils/helpers';
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

// Assume UI helper functions are globally available
declare function createUITextInputHTML(placeholder: string, name: string, value?: string, type?: string): string;
declare function createUISelectHTML(id: string, label: string, options: { value: string; text: string }[], selectedValue: string | string[], allowMultiple?: boolean, helpText?: string): string;
declare function createPsychTerminalStyledText(text: string): string;

// --- Musculoskeletal Tools Menu ---
export function renderMusculoskeletalToolsMenu(container: HTMLElement) {
    container.innerHTML = `
        <div class="tool-menu">
            <button class="tool-menu-button" data-tool-id="fraxCalculatorAI">FRAX Calculator (AI Estimation)</button>
            <button class="tool-menu-button" data-tool-id="romTracker">Range of Motion (ROM) Tracker</button>
        </div>
    `;
}

// --- FRAX Calculator (AI Estimation) ---
const fraxYesNoOptions = [{ value: 'yes', text: 'Yes' }, { value: 'no', text: 'No' }];
const fraxSexOptions = [{value: 'male', text: 'Male'}, {value: 'female', text: 'Female'}];

export function renderFRAXToolUI(container: HTMLElement) {
    const data = bodySystemToolsState.getFRAXData();
    let resultHTML = '';
    if (data.aiStatus === 'loading') {
        resultHTML = `<p class="term-highlight">Calculating FRAX with AI... Please wait.</p>`;
    } else if (data.aiStatus === 'error') {
        resultHTML = `<p class="term-highlight error">Error: ${data.aiError || 'Unknown AI error'}</p>`;
    } else if (data.aiStatus === 'success' && data.majorOsteoporoticFractureRiskPercent !== null && data.hipFractureRiskPercent !== null) {
        resultHTML = `
            <p><strong>Estimated 10-Year Major Osteoporotic Fracture Risk:</strong> <span class="term-highlight">${data.majorOsteoporoticFractureRiskPercent.toFixed(1)}%</span></p>
            <p><strong>Estimated 10-Year Hip Fracture Risk:</strong> <span class="term-highlight">${data.hipFractureRiskPercent.toFixed(1)}%</span></p>
        `;
    } else {
        resultHTML = 'AI-estimated risk will appear here.';
    }

    container.innerHTML = `
        <div class="tool-form-container frax-tool">
            <h4>FRAX® Fracture Risk Assessment (AI Estimation)</h4>
            <p class="tool-description">Estimates 10-year probability of fracture. Fill all fields for best AI estimation. BMD T-score is optional but improves accuracy.</p>
            
            <div class="tool-input-grid">
                ${(window as any).createUITextInputHTML("Years (40-90)", "frax-age", data.age, "number")}
                ${(window as any).createUISelectHTML("frax-sex", "Sex:", fraxSexOptions, data.sex)}
                ${(window as any).createUITextInputHTML("kg", "frax-weightKg", data.weightKg, "number")}
                ${(window as any).createUITextInputHTML("cm", "frax-heightCm", data.heightCm, "number")}
                ${(window as any).createUISelectHTML("frax-previousFracture", "Previous Fracture:", fraxYesNoOptions, data.previousFracture)}
                ${(window as any).createUISelectHTML("frax-parentFracturedHip", "Parent Fractured Hip:", fraxYesNoOptions, data.parentFracturedHip)}
                ${(window as any).createUISelectHTML("frax-currentSmoking", "Current Smoking:", fraxYesNoOptions, data.currentSmoking)}
                ${(window as any).createUISelectHTML("frax-glucocorticoids", "Glucocorticoids:", fraxYesNoOptions, data.glucocorticoids)}
                ${(window as any).createUISelectHTML("frax-rheumatoidArthritis", "Rheumatoid Arthritis:", fraxYesNoOptions, data.rheumatoidArthritis)}
                ${(window as any).createUISelectHTML("frax-secondaryOsteoporosis", "Secondary Osteoporosis:", fraxYesNoOptions, data.secondaryOsteoporosis)}
                ${(window as any).createUISelectHTML("frax-alcoholThreeOrMoreUnitsPerDay", "Alcohol ≥3 units/day:", fraxYesNoOptions, data.alcoholThreeOrMoreUnitsPerDay)}
                ${(window as any).createUITextInputHTML("Femoral Neck T-score (optional)", "frax-bmdTscore", data.bmdTscore, "number")}
            </div>

            <button class="tool-action-button" id="calculate-frax-ai-button" ${data.aiStatus === 'loading' ? 'disabled' : ''}>
                ${data.aiStatus === 'loading' ? 'Calculating...' : 'Calculate FRAX with AI'}
            </button>
            
            <div class="tool-output-area" id="frax-result-output">
                ${resultHTML}
            </div>
            <p class="tool-disclaimer"><strong>Important:</strong> This is an AI-based estimation and NOT a substitute for a validated, country-specific FRAX® assessment. Clinical decisions MUST be based on official FRAX® scores and full clinical evaluation.</p>
        </div>
    `;
    
    container.querySelector('#calculate-frax-ai-button')?.addEventListener('click', handleFRAXCalculateAI);
}

export function handleFRAXInputChange(field: keyof bodySystemToolsState.FRAXData, value: string) {
    bodySystemToolsState.updateFRAXData({ 
        [field]: value, 
        majorOsteoporoticFractureRiskPercent: null, 
        hipFractureRiskPercent: null,
        aiStatus: 'idle',
        aiError: null 
    });
}

async function handleFRAXCalculateAI() {
    playButtonSound();
    const data = bodySystemToolsState.getFRAXData();
    const { aiStatus, aiError, ...inputsForAI } = data; // Exclude AI status fields from data sent to AI

    // Simple validation
    const requiredFields: (keyof typeof inputsForAI)[] = ['age', 'sex', 'weightKg', 'heightCm', 'previousFracture', 'parentFracturedHip', 'currentSmoking', 'glucocorticoids', 'rheumatoidArthritis', 'secondaryOsteoporosis', 'alcoholThreeOrMoreUnitsPerDay'];
    for (const field of requiredFields) {
        if (!inputsForAI[field]) {
            bodySystemToolsState.updateFRAXData({ aiStatus: 'error', aiError: `Missing required field: ${field}. Please fill all non-optional fields.` });
            renderCurrentTool();
            return;
        }
    }

    bodySystemToolsState.updateFRAXData({ aiStatus: 'loading', aiError: null });
    renderCurrentTool();

    const currentAiInstance = (window as any).ai as GoogleGenAI | undefined;
    if (!currentAiInstance) {
        bodySystemToolsState.updateFRAXData({ aiStatus: 'error', aiError: "AI Service not available." });
        renderCurrentTool();
        return;
    }
    
    let prompt = `You are a medical AI assistant. Based on the following clinical parameters, estimate the 10-year probability of major osteoporotic fracture and the 10-year probability of hip fracture.
This is for a tool similar to FRAX but relies on your general medical knowledge as you don't have access to specific FRAX databases or country-specific algorithms.
Provide your response strictly as a JSON object with two keys: "majorOsteoporoticFractureProbabilityPercent" (number) and "hipFractureProbabilityPercent" (number).
Example output: {"majorOsteoporoticFractureProbabilityPercent": 12.5, "hipFractureProbabilityPercent": 3.2}

Patient Data:
- Age: ${inputsForAI.age} years
- Sex: ${inputsForAI.sex}
- Weight: ${inputsForAI.weightKg} kg
- Height: ${inputsForAI.heightCm} cm
- Previous Fracture: ${inputsForAI.previousFracture}
- Parent Fractured Hip: ${inputsForAI.parentFracturedHip}
- Current Smoking: ${inputsForAI.currentSmoking}
- Glucocorticoids: ${inputsForAI.glucocorticoids}
- Rheumatoid Arthritis: ${inputsForAI.rheumatoidArthritis}
- Secondary Osteoporosis: ${inputsForAI.secondaryOsteoporosis}
- Alcohol 3 or more units/day: ${inputsForAI.alcoholThreeOrMoreUnitsPerDay}`;
    if (inputsForAI.bmdTscore && inputsForAI.bmdTscore.trim() !== '') {
        prompt += `\n- Femoral Neck BMD T-score: ${inputsForAI.bmdTscore}`;
    } else {
        prompt += `\n- Femoral Neck BMD T-score: Not provided (base estimation on clinical risk factors only).`;
    }
    prompt += `\n\nGenerate the JSON response:`;

    try {
        const response: GenerateContentResponse = await currentAiInstance.models.generateContent({
            model: "gemini-2.5-flash-preview-04-17",
            contents: prompt,
            config: { responseMimeType: "application/json" }
        });

        let jsonStr = response.text.trim();
        const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
        const match = jsonStr.match(fenceRegex);
        if (match && match[2]) jsonStr = match[2].trim();
        
        const parsedData = JSON.parse(jsonStr);

        if (typeof parsedData.majorOsteoporoticFractureProbabilityPercent === 'number' && typeof parsedData.hipFractureProbabilityPercent === 'number') {
            bodySystemToolsState.updateFRAXData({
                majorOsteoporoticFractureRiskPercent: parsedData.majorOsteoporoticFractureProbabilityPercent,
                hipFractureRiskPercent: parsedData.hipFractureProbabilityPercent,
                aiStatus: 'success',
                aiError: null
            });
        } else {
            throw new Error("AI response did not contain valid numeric probabilities.");
        }
    } catch (error: any) {
        console.error("Error getting FRAX AI estimation:", error);
        bodySystemToolsState.updateFRAXData({ aiStatus: 'error', aiError: error.message || 'Failed to parse or receive valid AI estimation.' });
    } finally {
        if (typeof window.updateToolDataForActiveEncounter === 'function') {
            window.updateToolDataForActiveEncounter('Musculoskeletal', 'fraxCalculatorAI', { ...bodySystemToolsState.getFRAXData() });
        }
        renderCurrentTool();
    }
}

// --- Range of Motion (ROM) Tracker ---
const romJointsAndMotions: { [joint: string]: string[] } = {
    Shoulder: ["Flexion", "Extension", "Abduction", "Adduction", "Internal Rotation", "External Rotation"],
    Elbow: ["Flexion", "Extension", "Supination", "Pronation"],
    Wrist: ["Flexion", "Extension", "Ulnar Deviation", "Radial Deviation"],
    Hip: ["Flexion", "Extension", "Abduction", "Adduction", "Internal Rotation", "External Rotation"],
    Knee: ["Flexion", "Extension"],
    Ankle: ["Dorsiflexion", "Plantarflexion", "Inversion", "Eversion"],
    "Cervical Spine": ["Flexion", "Extension", "Lateral Flexion (Left)", "Lateral Flexion (Right)", "Rotation (Left)", "Rotation (Right)"],
    "Thoracic Spine": ["Flexion", "Extension", "Lateral Flexion", "Rotation"],
    "Lumbar Spine": ["Flexion", "Extension", "Lateral Flexion", "Rotation"],
};

export function renderROMTrackerToolUI(container: HTMLElement) {
    const data = bodySystemToolsState.getROMTrackerData();
    const jointOptions = Object.keys(romJointsAndMotions).map(j => ({ value: j, text: j }));
    const motionOptions = data.selectedJoint && romJointsAndMotions[data.selectedJoint] 
        ? romJointsAndMotions[data.selectedJoint].map(m => ({ value: m, text: m }))
        : [{value: '', text: 'Select a joint first'}];

    let recordedROMsHTML = '<p>No ROM data recorded yet.</p>';
    if (data.recordedROMs.length > 0) {
        recordedROMsHTML = `<ul class="rom-recorded-list">`;
        [...data.recordedROMs].reverse().forEach(entry => { // Show newest first
            recordedROMsHTML += `<li class="rom-recorded-item">${entry.joint} - ${entry.motion}: ${entry.degrees}° <span class="rom-timestamp">(${entry.timestamp})</span></li>`;
        });
        recordedROMsHTML += `</ul>`;
    }

    container.innerHTML = `
        <div class="tool-form-container rom-tracker-tool">
            <h4>Range of Motion (ROM) Tracker</h4>
            <p class="tool-description">Select joint, motion, and enter measured degrees to record ROM.</p>
            
            <div class="tool-input-grid">
                ${(window as any).createUISelectHTML("rom-selectedJoint", "Joint:", jointOptions, data.selectedJoint)}
                ${(window as any).createUISelectHTML("rom-selectedMotion", "Motion:", motionOptions, data.selectedMotion, false, motionOptions.length === 1 && motionOptions[0].value === '' ? "Select a joint to see motions" : "")}
                ${(window as any).createUITextInputHTML("Degrees (°)", "rom-measuredDegrees", data.measuredDegrees, "number")}
            </div>

            <button class="tool-action-button" id="record-rom-button">Record ROM</button>
            
            <div class="tool-output-area" id="rom-recorded-output">
                <h5>Recently Recorded ROM:</h5>
                ${recordedROMsHTML}
            </div>
        </div>
    `;
    
    container.querySelector('#record-rom-button')?.addEventListener('click', handleRecordROM);
}

export function handleROMInputChange(field: keyof bodySystemToolsState.ROMTrackerData, value: string) {
    const currentData = bodySystemToolsState.getROMTrackerData();
    let updateObj: Partial<bodySystemToolsState.ROMTrackerData> = { [field]: value };

    if (field === 'selectedJoint') {
        // If joint changes, reset motion and potentially trigger a re-render to update motion dropdown
        updateObj.selectedMotion = ''; // Reset motion
        bodySystemToolsState.updateROMTrackerData(updateObj);
        renderCurrentTool(); // Re-render to update motion options
    } else {
        bodySystemToolsState.updateROMTrackerData(updateObj);
    }
}

function handleRecordROM() {
    playButtonSound();
    const data = bodySystemToolsState.getROMTrackerData();
    if (!data.selectedJoint || !data.selectedMotion || !data.measuredDegrees) {
        alert("Please select a joint, motion, and enter measured degrees.");
        return;
    }
    const newEntry: bodySystemToolsState.ROMEntry = {
        joint: data.selectedJoint,
        motion: data.selectedMotion,
        degrees: data.measuredDegrees,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    bodySystemToolsState.addROMEntry(newEntry);
    // Clear inputs after recording
    bodySystemToolsState.updateROMTrackerData({ selectedJoint: data.selectedJoint, selectedMotion: '', measuredDegrees: '' });
    
    if (typeof window.updateToolDataForActiveEncounter === 'function') {
        window.updateToolDataForActiveEncounter('Musculoskeletal', 'romTracker', { ...bodySystemToolsState.getROMTrackerData() });
    }
    renderCurrentTool();
}

// Helper to re-render the current tool - assumes state activeToolContext is set
function renderCurrentTool() {
    const activeCtx = bodySystemToolsState.bodySystemToolsState.activeToolContext;
    if (activeCtx && activeCtx.system === 'Musculoskeletal' && activeCtx.toolId) {
        const toolsContainer = document.getElementById('component-specific-tools-container');
        if (toolsContainer) {
            (window as any).renderBodySystemToolContent?.(activeCtx.system, activeCtx.toolId, toolsContainer.querySelector('.tool-content-area'));
        }
    }
}
