/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as bodySystemToolsState from '../state/bodySystemToolsState';
import { playButtonSound } from '../utils/helpers';
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

// Assume UI helper functions are globally available
declare function createUITextInputHTML(placeholder: string, name: string, value?: string, type?: string): string;
declare function createUITextAreaHTML(placeholder: string, name: string, rows: number, value?: string, readonly?: boolean): string;
declare function createPsychTerminalStyledText(text: string): string;

// --- Hematologic/Lymphatic Tools Menu ---
export function renderHematologicLymphaticToolsMenu(container: HTMLElement) {
    container.innerHTML = `
        <div class="tool-menu">
            <button class="tool-menu-button" data-tool-id="coagulationProfileInterpreterAI">Coagulation Profile Interpreter (AI)</button>
            <button class="tool-menu-button" data-tool-id="cbcAnalyzerPlaceholder" disabled>CBC Analyzer (AI) - Placeholder</button>
        </div>
    `;
}

// --- Coagulation Profile Interpreter (AI) ---
export function renderCoagulationProfileToolUI(container: HTMLElement) {
    const data = bodySystemToolsState.getCoagulationProfileData();
    let resultHTML = '';

    if (data.aiStatus === 'loading') {
        resultHTML = `<p class="term-highlight">Analyzing coagulation profile with AI... Please wait.</p>`;
    } else if (data.aiStatus === 'error') {
        resultHTML = `<p class="term-highlight error">Error: ${data.aiError || 'Unknown AI error'}</p>`;
    } else if (data.aiStatus === 'success') {
        resultHTML = `
            <p><strong>AI Interpretation:</strong> <span class="term-highlight">${(window as any).createPsychTerminalStyledText(data.interpretation || 'N/A')}</span></p>
            ${data.potentialImplications && data.potentialImplications.length > 0 ? `
                <p><strong>Potential Clinical Implications:</strong></p>
                <ul class="term-highlight" style="list-style-type:disc; padding-left:20px;">
                    ${data.potentialImplications.map(pt => `<li>${(window as any).createPsychTerminalStyledText(pt)}</li>`).join('')}
                </ul>
            ` : ''}
            ${data.furtherSuggestions && data.furtherSuggestions.length > 0 ? `
                <p><strong>Suggestions for Further Action/Consideration:</strong></p>
                <ul class="term-highlight" style="list-style-type:disc; padding-left:20px;">
                    ${data.furtherSuggestions.map(pt => `<li>${(window as any).createPsychTerminalStyledText(pt)}</li>`).join('')}
                </ul>
            ` : ''}
        `;
    } else {
        resultHTML = 'AI analysis will appear here.';
    }

    container.innerHTML = `
        <div class="tool-form-container coagulation-profile-tool">
            <h4>Coagulation Profile Interpreter (AI)</h4>
            <p class="tool-description">Enter common coagulation test results for an AI-assisted interpretation.</p>
            
            <div class="tool-input-grid">
                ${(window as any).createUITextInputHTML("PT (e.g., 12.5 sec)", "coag-pt", data.pt, "text")}
                ${(window as any).createUITextInputHTML("INR (e.g., 1.0)", "coag-inr", data.inr, "text")}
                ${(window as any).createUITextInputHTML("aPTT (e.g., 30 sec)", "coag-aptt", data.aptt, "text")}
                ${(window as any).createUITextInputHTML("Fibrinogen (e.g., 300 mg/dL)", "coag-fibrinogen", data.fibrinogen, "text")}
                ${(window as any).createUITextInputHTML("D-dimer (optional, e.g., 250 ng/mL FEU)", "coag-dDimer", data.dDimer, "text")}
            </div>
            ${(window as any).createUITextAreaHTML("Brief clinical context (optional, e.g., pre-op, on warfarin, unexplained bruising)...", "coag-clinicalContext", 2, data.clinicalContext)}


            <button class="tool-action-button" id="analyze-coagulation-ai-button" ${data.aiStatus === 'loading' ? 'disabled' : ''}>
                ${data.aiStatus === 'loading' ? 'Analyzing...' : 'Analyze with AI'}
            </button>
            
            <div class="tool-output-area" id="coagulation-result-output">
                ${resultHTML}
            </div>
            <p class="tool-disclaimer"><strong>Important:</strong> AI interpretation is for educational purposes and pattern recognition. Clinical diagnosis requires the full clinical picture, specific laboratory reference ranges, and physician expertise. This tool is not a substitute for hematology consultation when indicated.</p>
        </div>
    `;
    
    container.querySelector('#analyze-coagulation-ai-button')?.addEventListener('click', handleCoagulationProfileAnalysisAI);
}

export function handleCoagulationProfileInputChange(field: keyof bodySystemToolsState.CoagulationProfileData, value: string) {
    bodySystemToolsState.updateCoagulationProfileData({ 
        [field]: value, 
        aiStatus: 'idle', 
        aiError: null,
        interpretation: null,
        potentialImplications: null,
        furtherSuggestions: null
    });
}

async function handleCoagulationProfileAnalysisAI() {
    playButtonSound();
    const data = bodySystemToolsState.getCoagulationProfileData();

    // Basic validation: PT, INR, aPTT are usually key. Fibrinogen important too.
    if (!data.pt || !data.inr || !data.aptt || !data.fibrinogen) {
        bodySystemToolsState.updateCoagulationProfileData({ aiStatus: 'error', aiError: "PT, INR, aPTT, and Fibrinogen values are typically required for interpretation." });
        renderCurrentHematologicTool();
        return;
    }

    bodySystemToolsState.updateCoagulationProfileData({ aiStatus: 'loading', aiError: null });
    renderCurrentHematologicTool();

    const currentAiInstance = (window as any).ai as GoogleGenAI | undefined;
    if (!currentAiInstance) {
        bodySystemToolsState.updateCoagulationProfileData({ aiStatus: 'error', aiError: "AI Service not available." });
        renderCurrentHematologicTool();
        return;
    }
    
    let prompt = `You are a medical AI assistant specializing in hematology. Analyze the following coagulation profile results.
Patient Lab Values:
- Prothrombin Time (PT): ${data.pt}
- International Normalized Ratio (INR): ${data.inr}
- Activated Partial Thromboplastin Time (aPTT): ${data.aptt}
- Fibrinogen Level: ${data.fibrinogen}`;
    if (data.dDimer) prompt += `\n- D-dimer: ${data.dDimer}`;
    if (data.clinicalContext) prompt += `\n- Clinical Context: ${data.clinicalContext}`;

    prompt += `

Based on these values (without knowing specific lab reference ranges, assume typical adult ranges and context), provide an interpretation.
Return your response strictly as a JSON object with the following keys:
1.  "interpretation": A string summarizing the overall coagulation status (e.g., "Normal coagulation parameters.", "Pattern suggests possible Vitamin K antagonism or deficiency.", "Findings raise concern for a possible consumptive coagulopathy; D-dimer correlation important.").
2.  "potentialImplications": An array of strings listing potential clinical implications (e.g., ["Normal bleeding risk expected.", "Increased risk of bleeding.", "Monitor for thrombotic events if D-dimer is significantly elevated."]).
3.  "furtherSuggestions": An array of strings with 1-2 suggestions for further action or consideration (e.g., ["Verify warfarin dosage if on therapy.", "Consider liver function tests.", "Mixing studies or factor assays may be indicated if aPTT is unexpectedly prolonged."]).

Example Output:
{
  "interpretation": "Pattern suggests possible Vitamin K antagonism. INR is elevated, PT is prolonged.",
  "potentialImplications": ["Increased risk of bleeding.", "Elective procedures may need to be deferred or require correction of coagulopathy."],
  "furtherSuggestions": ["Verify patient medication list for anticoagulants (e.g., warfarin).", "Consider Vitamin K administration if clinically appropriate and no contraindication."]
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

        if (parsedData.interpretation && Array.isArray(parsedData.potentialImplications) && Array.isArray(parsedData.furtherSuggestions)) {
            bodySystemToolsState.updateCoagulationProfileData({
                interpretation: parsedData.interpretation,
                potentialImplications: parsedData.potentialImplications,
                furtherSuggestions: parsedData.furtherSuggestions,
                aiStatus: 'success',
                aiError: null
            });
        } else {
            throw new Error("AI response did not contain the expected JSON structure for coagulation profile.");
        }
    } catch (error: any) {
        console.error("Error getting Coagulation Profile AI analysis:", error);
        bodySystemToolsState.updateCoagulationProfileData({ aiStatus: 'error', aiError: error.message || 'Failed to parse or receive valid AI analysis.' });
    } finally {
        if (typeof window.updateToolDataForActiveEncounter === 'function') {
            window.updateToolDataForActiveEncounter('HematologicLymphatic', 'coagulationProfileInterpreterAI', { ...bodySystemToolsState.getCoagulationProfileData() });
        }
        renderCurrentHematologicTool();
    }
}

// Helper to re-render the current tool
function renderCurrentHematologicTool() {
    const activeCtx = bodySystemToolsState.bodySystemToolsState.activeToolContext;
    if (activeCtx && activeCtx.system === 'Hematologic/Lymphatic' && activeCtx.toolId) {
        const toolsContainer = document.getElementById('component-specific-tools-container');
        if (toolsContainer) {
            (window as any).renderBodySystemToolContent?.(activeCtx.system, activeCtx.toolId, toolsContainer.querySelector('.tool-content-area'));
        }
    }
}
