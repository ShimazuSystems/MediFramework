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
declare function createUICheckboxGroupHTML(idPrefix: string, legend: string, options: { value: string; labelText: string }[], selectedValues: string[], helpText?: string): string;
declare function createPsychTerminalStyledText(text: string): string;

// --- Integumentary Tools Menu ---
export function renderIntegumentaryToolsMenu(container: HTMLElement) {
    container.innerHTML = `
        <div class="tool-menu">
            <button class="tool-menu-button" data-tool-id="burnCalculatorAI">Burn Severity & TBSA Calculator (AI)</button>
            <button class="tool-menu-button" data-tool-id="bradenScalePlaceholder" disabled>Braden Scale - Placeholder</button>
        </div>
    `;
}

// --- Burn Severity & TBSA Calculator (AI Estimation) ---
const burnDepthOptions = [
    { value: 'superficial', text: 'Superficial (1st degree)' },
    { value: 'superficialPartial', text: 'Superficial Partial-Thickness (2nd)' },
    { value: 'deepPartial', text: 'Deep Partial-Thickness (2nd)' },
    { value: 'fullThickness', text: 'Full-Thickness (3rd/4th degree)' }
];

// Simplified Rule of Nines for adult
const ruleOfNinesAreas = [
    { value: 'headNeck', labelText: 'Head & Neck (9%)' }, // Approx 9%
    { value: 'anteriorTrunk', labelText: 'Anterior Trunk (18%)' }, // Approx 18%
    { value: 'posteriorTrunk', labelText: 'Posterior Trunk (18%)' }, // Approx 18%
    { value: 'rightArmFull', labelText: 'Right Arm - Full (9%)' }, // Approx 9%
    { value: 'leftArmFull', labelText: 'Left Arm - Full (9%)' },   // Approx 9%
    { value: 'rightLegFull', labelText: 'Right Leg - Full (18%)' },// Approx 18%
    { value: 'leftLegFull', labelText: 'Left Leg - Full (18%)' },  // Approx 18%
    { value: 'genitalia', labelText: 'Genitalia/Perineum (1%)' } // Approx 1%
];

export function renderBurnCalculatorToolUI(container: HTMLElement) {
    const data = bodySystemToolsState.getBurnCalculatorData();
    let resultHTML = '';

    if (data.aiStatus === 'loading') {
        resultHTML = `<p class="term-highlight">Estimating with AI... Please wait.</p>`;
    } else if (data.aiStatus === 'error') {
        resultHTML = `<p class="term-highlight error">Error: ${data.aiError || 'Unknown AI error'}</p>`;
    } else if (data.aiStatus === 'success') {
        resultHTML = `
            <p><strong>Estimated TBSA:</strong> <span class="term-highlight">${data.estimatedTBSA_percent !== null ? data.estimatedTBSA_percent.toFixed(1) + '%' : 'N/A'}</span></p>
            <p><strong>AI Severity Classification:</strong> <span class="term-highlight">${data.severityClassification || 'N/A'}</span></p>
            ${data.initialManagementPoints && data.initialManagementPoints.length > 0 ? `
                <p><strong>AI Initial Management Considerations:</strong></p>
                <ul class="term-highlight" style="list-style-type:disc; padding-left:20px;">
                    ${data.initialManagementPoints.map(pt => `<li>${(window as any).createPsychTerminalStyledText(pt)}</li>`).join('')}
                </ul>
            ` : ''}
        `;
    } else {
        resultHTML = 'AI estimation will appear here.';
    }

    container.innerHTML = `
        <div class="tool-form-container burn-calculator-tool">
            <h4>Burn Severity & TBSA Calculator (AI Estimation)</h4>
            <p class="tool-description">Estimate TBSA and severity for thermal burns. Select burn depth, affected areas, and provide patient age.</p>
            
            ${(window as any).createUISelectHTML("burn-burnDepth", "Predominant Burn Depth:", burnDepthOptions, data.burnDepth)}
            ${(window as any).createUITextInputHTML("Years", "burn-patientAge", data.patientAge, "number")}
            ${(window as any).createUICheckboxGroupHTML("burn-affectedAreas", "Affected Body Areas (Adult Rule of Nines):", ruleOfNinesAreas, data.affectedAreas, "Select all applicable areas.")}
            
            <button class="tool-action-button" id="calculate-burn-ai-button" ${data.aiStatus === 'loading' ? 'disabled' : ''}>
                ${data.aiStatus === 'loading' ? 'Estimating...' : 'Estimate with AI'}
            </button>
            
            <div class="tool-output-area" id="burn-result-output">
                ${resultHTML}
            </div>
            <p class="tool-disclaimer"><strong>Important:</strong> This AI estimation uses a simplified Rule of Nines and general burn knowledge. It is NOT a substitute for accurate clinical TBSA calculation (e.g., Lund-Browder chart for pediatrics/detailed burns) and expert burn assessment. Clinical decisions MUST be based on thorough evaluation and established protocols.</p>
        </div>
    `;
    
    container.querySelector('#calculate-burn-ai-button')?.addEventListener('click', handleBurnCalculateAI);
}

export function handleBurnCalculatorInputChange(field: keyof bodySystemToolsState.BurnCalculatorData, value: string | string[]) {
     bodySystemToolsState.updateBurnCalculatorData({ 
        [field]: value, 
        estimatedTBSA_percent: null,
        severityClassification: null,
        initialManagementPoints: null,
        aiStatus: 'idle', 
        aiError: null 
    });
    // For select and text input, no immediate re-render needed.
    // For checkbox group, a re-render might be desired if visual feedback depends on selection, but not critical here.
}

export function handleBurnCalculatorCheckboxChange(groupName: string, checkboxValue: string, checked: boolean) {
    // groupName is 'burn-affectedAreas-headNeck', checkboxValue is 'headNeck'
    const data = bodySystemToolsState.getBurnCalculatorData();
    let currentAreas = [...data.affectedAreas];
    if (checked) {
        if (!currentAreas.includes(checkboxValue)) {
            currentAreas.push(checkboxValue);
        }
    } else {
        currentAreas = currentAreas.filter(area => area !== checkboxValue);
    }
    handleBurnCalculatorInputChange('affectedAreas', currentAreas);
}


async function handleBurnCalculateAI() {
    playButtonSound();
    const data = bodySystemToolsState.getBurnCalculatorData();

    if (!data.burnDepth || data.affectedAreas.length === 0 || !data.patientAge) {
        bodySystemToolsState.updateBurnCalculatorData({ aiStatus: 'error', aiError: "Please select burn depth, at least one affected area, and enter patient age." });
        renderCurrentIntegumentaryTool();
        return;
    }

    bodySystemToolsState.updateBurnCalculatorData({ aiStatus: 'loading', aiError: null });
    renderCurrentIntegumentaryTool();

    const currentAiInstance = (window as any).ai as GoogleGenAI | undefined;
    if (!currentAiInstance) {
        bodySystemToolsState.updateBurnCalculatorData({ aiStatus: 'error', aiError: "AI Service not available." });
        renderCurrentIntegumentaryTool();
        return;
    }
    
    const selectedAreaDetails = data.affectedAreas.map(areaKey => {
        const areaConfig = ruleOfNinesAreas.find(a => a.value === areaKey);
        return areaConfig ? areaConfig.labelText : areaKey;
    }).join(', ');

    let prompt = `You are a medical AI assistant. Based on the following patient burn information, provide an estimation.
This is for an educational tool. Your estimations should be grounded in general medical knowledge regarding burn assessment.
Patient Age: ${data.patientAge} years
Predominant Burn Depth: ${burnDepthOptions.find(opt => opt.value === data.burnDepth)?.text || data.burnDepth}
Affected Body Areas (Adult Rule of Nines approximation): ${selectedAreaDetails}

Provide your response strictly as a JSON object with the following keys:
1.  "estimatedTBSA_percent": A number representing the estimated Total Body Surface Area percentage involved. Base this on the adult Rule of Nines.
2.  "severityClassification": A string classifying the burn (e.g., "Minor Burn", "Moderate Burn", "Major Burn requiring burn center referral"). Consider TBSA, depth, age, and affected areas (e.g., hands, face, perineum often increase severity).
3.  "initialManagementPoints": An array of strings listing 3-5 key initial management considerations (e.g., "Assess airway, breathing, circulation.", "Consider fluid resuscitation based on Parkland formula if TBSA significant.", "Pain management.", "Basic wound care: cool, clean, cover.", "Tetanus prophylaxis consideration.").

Example Output:
{
  "estimatedTBSA_percent": 27,
  "severityClassification": "Moderate Burn, consider burn unit consultation",
  "initialManagementPoints": [
    "Ensure patent airway and adequate ventilation.",
    "Initiate fluid resuscitation (e.g., Parkland formula for TBSA >15-20%).",
    "Provide adequate analgesia.",
    "Cover burns with clean, dry dressings.",
    "Assess for signs of inhalation injury if facial burns or history of enclosed space fire."
  ]
}

Generate the JSON response:`;

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

        if (typeof parsedData.estimatedTBSA_percent === 'number' &&
            typeof parsedData.severityClassification === 'string' &&
            Array.isArray(parsedData.initialManagementPoints)) {
            bodySystemToolsState.updateBurnCalculatorData({
                estimatedTBSA_percent: parsedData.estimatedTBSA_percent,
                severityClassification: parsedData.severityClassification,
                initialManagementPoints: parsedData.initialManagementPoints,
                aiStatus: 'success',
                aiError: null
            });
        } else {
            throw new Error("AI response did not contain the expected JSON structure or data types.");
        }
    } catch (error: any) {
        console.error("Error getting Burn AI estimation:", error);
        bodySystemToolsState.updateBurnCalculatorData({ aiStatus: 'error', aiError: error.message || 'Failed to parse or receive valid AI estimation.' });
    } finally {
        if (typeof window.updateToolDataForActiveEncounter === 'function') {
            window.updateToolDataForActiveEncounter('Integumentary', 'burnCalculatorAI', { ...bodySystemToolsState.getBurnCalculatorData() });
        }
        renderCurrentIntegumentaryTool();
    }
}


// Helper to re-render the current tool
function renderCurrentIntegumentaryTool() {
    const activeCtx = bodySystemToolsState.bodySystemToolsState.activeToolContext;
    if (activeCtx && activeCtx.system === 'Integumentary' && activeCtx.toolId) {
        const toolsContainer = document.getElementById('component-specific-tools-container');
        if (toolsContainer) {
            // This assumes renderBodySystemToolContent is made globally available or imported by the caller
            (window as any).renderBodySystemToolContent?.(activeCtx.system, activeCtx.toolId, toolsContainer.querySelector('.tool-content-area'));
        }
    }
}
