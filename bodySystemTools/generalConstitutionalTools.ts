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
declare function createUICheckboxHTML(label: string, name: string, value: string, checked: boolean): string; // For individual checkboxes
declare function createUITextAreaHTML(placeholder: string, name: string, rows: number, value?: string, readonly?: boolean): string;
declare function createPsychTerminalStyledText(text: string): string;

// --- General/Constitutional Tools Menu ---
export function renderGeneralConstitutionalToolsMenu(container: HTMLElement) {
    container.innerHTML = `
        <div class="tool-menu">
            <button class="tool-menu-button" data-tool-id="constitutionalSymptomAnalyzerAI">Constitutional Symptom Analyzer (AI)</button>
            <button class="tool-menu-button" data-tool-id="vitalSignsTrendPlaceholder" disabled>Vital Signs Trend Analyzer - Placeholder</button>
        </div>
    `;
}

// --- Constitutional Symptom Analyzer (AI) ---
const fatigueSeverityOptions: { value: bodySystemToolsState.ConstitutionalSymptomsData['fatigueSeverity'], text: string }[] = [
    { value: 'mild', text: 'Mild' },
    { value: 'moderate', text: 'Moderate' },
    { value: 'severe', text: 'Severe' }
];

const constitutionalSymptomsCheckboxes: { field: keyof bodySystemToolsState.ConstitutionalSymptomsData, label: string }[] = [
    { field: 'fever', label: 'Fever Present' },
    { field: 'fatigue', label: 'Fatigue Present' },
    { field: 'weightLoss', label: 'Unintentional Weight Loss' },
    { field: 'weightGain', label: 'Unintentional Weight Gain' },
    { field: 'malaise', label: 'Malaise (General Discomfort)' },
    { field: 'chills', label: 'Chills' },
    { field: 'nightSweats', label: 'Night Sweats' },
];

export function renderConstitutionalSymptomAnalyzerToolUI(container: HTMLElement) {
    const data = bodySystemToolsState.getConstitutionalSymptomsData();
    let resultHTML = '';

    if (data.aiStatus === 'loading') {
        resultHTML = `<p class="term-highlight">Analyzing symptoms with AI... Please wait.</p>`;
    } else if (data.aiStatus === 'error') {
        resultHTML = `<p class="term-highlight error">Error: ${data.aiError || 'Unknown AI error'}</p>`;
    } else if (data.aiStatus === 'success') {
        resultHTML = `
            <p><strong>AI Symptom Pattern Summary:</strong> <span class="term-highlight">${(window as any).createPsychTerminalStyledText(data.symptomPatternSummary || 'N/A')}</span></p>
            ${data.potentialConcerns && data.potentialConcerns.length > 0 ? `
                <p><strong>Potential Underlying Concerns:</strong></p>
                <ul class="term-highlight" style="list-style-type:disc; padding-left:20px;">
                    ${data.potentialConcerns.map(pt => `<li>${(window as any).createPsychTerminalStyledText(pt)}</li>`).join('')}
                </ul>
            ` : ''}
            ${data.suggestedNextSteps && data.suggestedNextSteps.length > 0 ? `
                <p><strong>Suggested Next Steps for Assessment:</strong></p>
                <ul class="term-highlight" style="list-style-type:disc; padding-left:20px;">
                    ${data.suggestedNextSteps.map(pt => `<li>${(window as any).createPsychTerminalStyledText(pt)}</li>`).join('')}
                </ul>
            ` : ''}
        `;
    } else {
        resultHTML = 'AI analysis will appear here.';
    }

    let checkboxHTML = '<div class="tool-input-grid" style="grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));">';
    constitutionalSymptomsCheckboxes.forEach(cb => {
        checkboxHTML += `<div>${(window as any).createUICheckboxHTML(cb.label, `constitutional-${cb.field}`, cb.field, data[cb.field] as boolean)}</div>`;
    });
    checkboxHTML += '</div>';


    container.innerHTML = `
        <div class="tool-form-container constitutional-symptom-tool">
            <h4>Constitutional Symptom Analyzer (AI)</h4>
            <p class="tool-description">Select observed constitutional symptoms and provide details for an AI-assisted analysis.</p>
            
            ${checkboxHTML}
            
            <div class="tool-input-grid" style="margin-top: 0.5rem;">
                ${(window as any).createUITextInputHTML("Temperature (e.g., 38.5 C or 101.3 F)", "constitutional-feverTemp", data.feverTemp, "text")}
                ${(window as any).createUISelectHTML("constitutional-fatigueSeverity", "Fatigue Severity:", fatigueSeverityOptions, data.fatigueSeverity)}
                ${(window as any).createUITextInputHTML("Amount/Timeframe (e.g., 5 kg in 2 months)", "constitutional-weightLossAmount", data.weightLossAmount, "text")}
                ${(window as any).createUITextInputHTML("Amount/Timeframe (e.g., 3 kg in 1 month)", "constitutional-weightGainAmount", data.weightGainAmount, "text")}
            </div>
            ${(window as any).createUITextAreaHTML("Other relevant symptoms, context, or duration details...", "constitutional-otherSymptomsContext", 3, data.otherSymptomsContext)}

            <button class="tool-action-button" id="analyze-constitutional-ai-button" ${data.aiStatus === 'loading' ? 'disabled' : ''}>
                ${data.aiStatus === 'loading' ? 'Analyzing...' : 'Analyze Symptoms with AI'}
            </button>
            
            <div class="tool-output-area" id="constitutional-result-output">
                ${resultHTML}
            </div>
            <p class="tool-disclaimer"><strong>Important:</strong> AI analysis is for educational purposes and to highlight patterns. Clinical diagnosis requires a full patient evaluation, history, examination, and appropriate investigations by a qualified healthcare professional.</p>
        </div>
    `;
    
    container.querySelector('#analyze-constitutional-ai-button')?.addEventListener('click', handleConstitutionalAnalysisAI);
}

export function handleConstitutionalSymptomInputChange(field: keyof bodySystemToolsState.ConstitutionalSymptomsData, value: string | boolean) {
    bodySystemToolsState.updateConstitutionalSymptomsData({ 
        [field]: value, 
        aiStatus: 'idle', 
        aiError: null,
        symptomPatternSummary: null,
        potentialConcerns: null,
        suggestedNextSteps: null
    });
}
export function handleConstitutionalSymptomCheckboxChange(field: keyof bodySystemToolsState.ConstitutionalSymptomsData, checked: boolean) {
    handleConstitutionalSymptomInputChange(field, checked);
}


async function handleConstitutionalAnalysisAI() {
    playButtonSound();
    const data = bodySystemToolsState.getConstitutionalSymptomsData();

    // No strict validation for now, AI can interpret based on what's provided
    // if (constitutionalSymptomsCheckboxes.every(cb => !data[cb.field]) && !data.otherSymptomsContext) {
    //     bodySystemToolsState.updateConstitutionalSymptomsData({ aiStatus: 'error', aiError: "Please select at least one symptom or provide context." });
    //     renderCurrentGeneralConstitutionalTool();
    //     return;
    // }

    bodySystemToolsState.updateConstitutionalSymptomsData({ aiStatus: 'loading', aiError: null });
    renderCurrentGeneralConstitutionalTool();

    const currentAiInstance = (window as any).ai as GoogleGenAI | undefined;
    if (!currentAiInstance) {
        bodySystemToolsState.updateConstitutionalSymptomsData({ aiStatus: 'error', aiError: "AI Service not available." });
        renderCurrentGeneralConstitutionalTool();
        return;
    }
    
    let prompt = `You are a medical AI assistant. Analyze the following reported constitutional symptoms.
Patient Reported Data:
- Fever: ${data.fever ? `Yes (Temperature: ${data.feverTemp || 'Not specified'})` : 'No'}
- Fatigue: ${data.fatigue ? `Yes (Severity: ${data.fatigueSeverity || 'Not specified'})` : 'No'}
- Unintentional Weight Loss: ${data.weightLoss ? `Yes (Details: ${data.weightLossAmount || 'Not specified'})` : 'No'}
- Unintentional Weight Gain: ${data.weightGain ? `Yes (Details: ${data.weightGainAmount || 'Not specified'})` : 'No'}
- Malaise: ${data.malaise ? 'Yes' : 'No'}
- Chills: ${data.chills ? 'Yes' : 'No'}
- Night Sweats: ${data.nightSweats ? 'Yes' : 'No'}
- Other Symptoms/Context: ${data.otherSymptomsContext || 'None provided'}

Based on these reported symptoms:
Return your response strictly as a JSON object with the following keys:
1.  "symptomPatternSummary": A string providing a brief clinical summary of the symptom pattern (e.g., "Pattern suggests an acute febrile illness.", "Chronic symptoms of fatigue and unexplained weight loss warrant thorough investigation.").
2.  "potentialConcerns": An array of strings listing 2-3 broad categories of potential underlying concerns or conditions this pattern might suggest (e.g., ["Infectious process", "Inflammatory/Autoimmune condition", "Possible malignancy (especially with weight loss/night sweats)", "Endocrine disorder"]).
3.  "suggestedNextSteps": An array of strings with 2-3 general suggestions for next steps in clinical assessment (e.g., ["Detailed history of symptom onset, duration, and associated factors.", "Focused physical examination.", "Consider baseline laboratory investigations (e.g., CBC, ESR/CRP, CMP).", "Review medications and recent travel/exposures."]).

Example Output:
{
  "symptomPatternSummary": "Reports of fever, fatigue, and night sweats suggest an ongoing systemic process, possibly infectious or inflammatory.",
  "potentialConcerns": ["Infectious diseases (viral, bacterial, fungal)", "Autoimmune or rheumatologic conditions", "Consider occult malignancy if symptoms are persistent and unexplained"],
  "suggestedNextSteps": ["Obtain a detailed timeline of symptoms and any associated localizing signs.", "Perform a thorough physical examination, including lymph node and organ palpation.", "Consider initial blood tests: CBC with differential, ESR, CRP, basic metabolic panel."]
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

        if (parsedData.symptomPatternSummary && Array.isArray(parsedData.potentialConcerns) && Array.isArray(parsedData.suggestedNextSteps)) {
            bodySystemToolsState.updateConstitutionalSymptomsData({
                symptomPatternSummary: parsedData.symptomPatternSummary,
                potentialConcerns: parsedData.potentialConcerns,
                suggestedNextSteps: parsedData.suggestedNextSteps,
                aiStatus: 'success',
                aiError: null
            });
        } else {
            throw new Error("AI response did not contain the expected JSON structure for constitutional symptoms analysis.");
        }
    } catch (error: any) {
        console.error("Error getting Constitutional Symptom AI analysis:", error);
        bodySystemToolsState.updateConstitutionalSymptomsData({ aiStatus: 'error', aiError: error.message || 'Failed to parse or receive valid AI analysis.' });
    } finally {
        if (typeof window.updateToolDataForActiveEncounter === 'function') {
            window.updateToolDataForActiveEncounter('General/Constitutional', 'constitutionalSymptomAnalyzerAI', { ...bodySystemToolsState.getConstitutionalSymptomsData() });
        }
        renderCurrentGeneralConstitutionalTool();
    }
}

// Helper to re-render the current tool
function renderCurrentGeneralConstitutionalTool() {
    const activeCtx = bodySystemToolsState.bodySystemToolsState.activeToolContext;
    if (activeCtx && activeCtx.system === 'General/Constitutional' && activeCtx.toolId) {
        const toolsContainer = document.getElementById('component-specific-tools-container');
        if (toolsContainer) {
            (window as any).renderBodySystemToolContent?.(activeCtx.system, activeCtx.toolId, toolsContainer.querySelector('.tool-content-area'));
        }
    }
}
