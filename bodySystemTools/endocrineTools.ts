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

// --- Endocrine Tools Menu ---
export function renderEndocrineToolsMenu(container: HTMLElement) {
    container.innerHTML = `
        <div class="tool-menu">
            <button class="tool-menu-button" data-tool-id="thyroidFunctionAnalyzerAI">Thyroid Function Analyzer (AI)</button>
            <button class="tool-menu-button" data-tool-id="diabetesRiskProfilerAI">Diabetes Risk Profiler (AI)</button>
        </div>
    `;
}

// --- Thyroid Function Analyzer (AI) ---
export function renderThyroidFunctionToolUI(container: HTMLElement) {
    const data = bodySystemToolsState.getThyroidFunctionData();
    let resultHTML = '';

    if (data.aiStatus === 'loading') {
        resultHTML = `<p class="term-highlight">Analyzing thyroid data with AI... Please wait.</p>`;
    } else if (data.aiStatus === 'error') {
        resultHTML = `<p class="term-highlight error">Error: ${data.aiError || 'Unknown AI error'}</p>`;
    } else if (data.aiStatus === 'success') {
        resultHTML = `
            <p><strong>AI Interpretation:</strong> <span class="term-highlight">${data.interpretation || 'N/A'}</span></p>
            ${data.contributingFactors && data.contributingFactors.length > 0 ? `
                <p><strong>Potential Contributing Factors/Associations:</strong></p>
                <ul class="term-highlight" style="list-style-type:disc; padding-left:20px;">
                    ${data.contributingFactors.map(pt => `<li>${(window as any).createPsychTerminalStyledText(pt)}</li>`).join('')}
                </ul>
            ` : ''}
            ${data.furtherInvestigation && data.furtherInvestigation.length > 0 ? `
                <p><strong>Suggestions for Further Investigation:</strong></p>
                <ul class="term-highlight" style="list-style-type:disc; padding-left:20px;">
                    ${data.furtherInvestigation.map(pt => `<li>${(window as any).createPsychTerminalStyledText(pt)}</li>`).join('')}
                </ul>
            ` : ''}
        `;
    } else {
        resultHTML = 'AI analysis will appear here.';
    }

    container.innerHTML = `
        <div class="tool-form-container thyroid-analyzer-tool">
            <h4>Thyroid Function Analyzer (AI)</h4>
            <p class="tool-description">Enter thyroid lab values for an AI-assisted interpretation.</p>
            
            <div class="tool-input-grid">
                ${(window as any).createUITextInputHTML("TSH (e.g., 0.4-4.0 mIU/L)", "thyroid-tsh", data.tsh, "text")}
                ${(window as any).createUITextInputHTML("Free T4 (e.g., 0.8-1.8 ng/dL)", "thyroid-freeT4", data.freeT4, "text")}
                ${(window as any).createUITextInputHTML("Free T3 (optional, e.g., 2.3-4.2 pg/mL)", "thyroid-freeT3", data.freeT3, "text")}
                ${(window as any).createUITextInputHTML("Anti-TPO Ab (optional, e.g., <9 IU/mL)", "thyroid-antiTPO", data.antiTPO, "text")}
            </div>

            <button class="tool-action-button" id="analyze-thyroid-ai-button" ${data.aiStatus === 'loading' ? 'disabled' : ''}>
                ${data.aiStatus === 'loading' ? 'Analyzing...' : 'Analyze with AI'}
            </button>
            
            <div class="tool-output-area" id="thyroid-result-output">
                ${resultHTML}
            </div>
            <p class="tool-disclaimer"><strong>Important:</strong> AI interpretation is for educational purposes and pattern recognition. Clinical diagnosis requires full patient context, precise lab reference ranges, and physician judgment.</p>
        </div>
    `;
    
    container.querySelector('#analyze-thyroid-ai-button')?.addEventListener('click', handleThyroidAnalysisAI);
}

export function handleThyroidFunctionInputChange(field: keyof bodySystemToolsState.ThyroidFunctionData, value: string) {
    bodySystemToolsState.updateThyroidFunctionData({ 
        [field]: value, 
        aiStatus: 'idle', 
        aiError: null,
        interpretation: null,
        contributingFactors: null,
        furtherInvestigation: null
    });
}

async function handleThyroidAnalysisAI() {
    playButtonSound();
    const data = bodySystemToolsState.getThyroidFunctionData();

    if (!data.tsh || !data.freeT4) {
        bodySystemToolsState.updateThyroidFunctionData({ aiStatus: 'error', aiError: "TSH and Free T4 values are required." });
        renderCurrentEndocrineTool();
        return;
    }

    bodySystemToolsState.updateThyroidFunctionData({ aiStatus: 'loading', aiError: null });
    renderCurrentEndocrineTool();

    const currentAiInstance = (window as any).ai as GoogleGenAI | undefined;
    if (!currentAiInstance) {
        bodySystemToolsState.updateThyroidFunctionData({ aiStatus: 'error', aiError: "AI Service not available." });
        renderCurrentEndocrineTool();
        return;
    }
    
    let prompt = `You are a medical AI assistant. Analyze the following thyroid function test results.
Patient Lab Values:
- TSH: ${data.tsh}
- Free T4: ${data.freeT4}`;
    if (data.freeT3) prompt += `\n- Free T3: ${data.freeT3}`;
    if (data.antiTPO) prompt += `\n- Anti-TPO Antibodies: ${data.antiTPO}`;

    prompt += `

Based on these values (without knowing specific lab reference ranges, assume typical adult ranges), provide an interpretation.
Return your response strictly as a JSON object with the following keys:
1.  "interpretation": A string describing the likely thyroid status (e.g., "Suggestive of Primary Hypothyroidism", "Likely Euthyroid", "Pattern consistent with Subclinical Hyperthyroidism", "Possible Central Hypothyroidism, correlate clinically").
2.  "contributingFactorsOrAssociations": An array of strings listing potential contributing factors or associated conditions based on the pattern (e.g., ["Elevated Anti-TPO with high TSH and low FT4 strongly suggests Hashimoto's thyroiditis.", "Low TSH with high FT4/FT3 indicates primary hyperthyroidism; consider Graves' disease or toxic nodule."]). Can be empty if not applicable.
3.  "furtherInvestigationSuggestions": An array of strings with 1-2 suggestions for further investigation if the pattern is unclear, complex, or needs confirmation (e.g., ["Consider repeating TSH and FT4 in 4-6 weeks if subclinical.", "If central hypothyroidism suspected, assess pituitary function."]). Can be empty.

Example Output:
{
  "interpretation": "Suggestive of Primary Hypothyroidism",
  "contributingFactorsOrAssociations": ["If Anti-TPO is elevated, Hashimoto's thyroiditis is likely."],
  "furtherInvestigationSuggestions": ["Consider testing Anti-TPO antibodies if not already done.", "Repeat TSH and Free T4 in 6-8 weeks after initiating treatment or if borderline."]
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

        if (parsedData.interpretation && Array.isArray(parsedData.contributingFactorsOrAssociations) && Array.isArray(parsedData.furtherInvestigationSuggestions)) {
            bodySystemToolsState.updateThyroidFunctionData({
                interpretation: parsedData.interpretation,
                contributingFactors: parsedData.contributingFactorsOrAssociations,
                furtherInvestigation: parsedData.furtherInvestigationSuggestions,
                aiStatus: 'success',
                aiError: null
            });
        } else {
            throw new Error("AI response did not contain the expected JSON structure.");
        }
    } catch (error: any) {
        console.error("Error getting Thyroid AI analysis:", error);
        bodySystemToolsState.updateThyroidFunctionData({ aiStatus: 'error', aiError: error.message || 'Failed to parse or receive valid AI analysis.' });
    } finally {
        if (typeof window.updateToolDataForActiveEncounter === 'function') {
            window.updateToolDataForActiveEncounter('Endocrine', 'thyroidFunctionAnalyzerAI', { ...bodySystemToolsState.getThyroidFunctionData() });
        }
        renderCurrentEndocrineTool();
    }
}


// --- Diabetes Risk Profiler (AI) ---
const yesNoOptions = [{ value: 'yes', text: 'Yes' }, { value: 'no', text: 'No' }];
const yesNoNAOptions = [{ value: 'yes', text: 'Yes' }, { value: 'no', text: 'No' }, {value: 'na', text: 'Not Applicable'}];
const activityOptions = [{value: 'low', text: 'Low (<30 min/wk)'}, {value: 'moderate', text: 'Moderate (30-150 min/wk)'}, {value: 'high', text: 'High (>150 min/wk)'}];
const raceEthnicityOptions = [
    {value: 'caucasian', text: 'Caucasian'}, {value: 'africanAmerican', text: 'African American'},
    {value: 'hispanic', text: 'Hispanic/Latino'}, {value: 'asian', text: 'Asian'}, {value: 'other', text: 'Other/Mixed'}
];
const bpStatusOptions = [
    {value: 'normal', text: 'Normal (<120/80)'}, {value: 'elevated', text: 'Elevated (120-129/<80)'},
    {value: 'hypertension_stage1', text: 'HTN Stage 1 (130-139/80-89)'},
    {value: 'hypertension_stage2_on_rx', text: 'HTN Stage 2 (≥140/90) or on Rx'}
];

export function renderDiabetesRiskToolUI(container: HTMLElement) {
    const data = bodySystemToolsState.getDiabetesRiskData();
    let resultHTML = '';

    if (data.aiStatus === 'loading') {
        resultHTML = `<p class="term-highlight">Profiling diabetes risk with AI... Please wait.</p>`;
    } else if (data.aiStatus === 'error') {
        resultHTML = `<p class="term-highlight error">Error: ${data.aiError || 'Unknown AI error'}</p>`;
    } else if (data.aiStatus === 'success') {
        resultHTML = `
            <p><strong>AI Risk Assessment:</strong> <span class="term-highlight">${data.riskLevel || 'N/A'}</span></p>
            ${data.identifiedRiskFactors && data.identifiedRiskFactors.length > 0 ? `
                <p><strong>Key Identified Risk Factors:</strong></p>
                <ul class="term-highlight" style="list-style-type:disc; padding-left:20px;">
                    ${data.identifiedRiskFactors.map(pt => `<li>${(window as any).createPsychTerminalStyledText(pt)}</li>`).join('')}
                </ul>
            ` : ''}
            ${data.lifestyleRecommendations && data.lifestyleRecommendations.length > 0 ? `
                <p><strong>General Lifestyle Recommendations:</strong></p>
                <ul class="term-highlight" style="list-style-type:disc; padding-left:20px;">
                    ${data.lifestyleRecommendations.map(pt => `<li>${(window as any).createPsychTerminalStyledText(pt)}</li>`).join('')}
                </ul>
            ` : ''}
             ${data.screeningSuggestion ? `<p><strong>Screening Suggestion:</strong> <span class="term-highlight">${(window as any).createPsychTerminalStyledText(data.screeningSuggestion)}</span></p>` : ''}
        `;
    } else {
        resultHTML = 'AI risk profile will appear here.';
    }

    container.innerHTML = `
        <div class="tool-form-container diabetes-risk-tool">
            <h4>Diabetes Risk Profiler (AI Estimation)</h4>
            <p class="tool-description">Estimate risk for Type 2 Diabetes based on common risk factors.</p>
            
            <div class="tool-input-grid">
                ${(window as any).createUITextInputHTML("Years", "diabetes-age", data.age, "number")}
                ${(window as any).createUITextInputHTML("kg/m²", "diabetes-bmi", data.bmi, "number")}
                ${(window as any).createUISelectHTML("diabetes-familyHistoryDiabetes", "Family History of Diabetes:", yesNoOptions, data.familyHistoryDiabetes)}
                ${(window as any).createUISelectHTML("diabetes-gestationalDiabetes", "History of Gestational Diabetes:", yesNoNAOptions, data.gestationalDiabetes, false, "Select 'Not Applicable' if not female.")}
                ${(window as any).createUISelectHTML("diabetes-physicalActivity", "Physical Activity Level:", activityOptions, data.physicalActivity)}
                ${(window as any).createUISelectHTML("diabetes-raceEthnicity", "Race/Ethnicity:", raceEthnicityOptions, data.raceEthnicity)}
                ${(window as any).createUISelectHTML("diabetes-bloodPressureStatus", "Blood Pressure Status:", bpStatusOptions, data.bloodPressureStatus)}
                ${(window as any).createUITextInputHTML("mg/dL", "diabetes-hdlCholesterol", data.hdlCholesterol, "number")}
            </div>

            <button class="tool-action-button" id="profile-diabetes-risk-ai-button" ${data.aiStatus === 'loading' ? 'disabled' : ''}>
                ${data.aiStatus === 'loading' ? 'Profiling...' : 'Profile Risk with AI'}
            </button>
            
            <div class="tool-output-area" id="diabetes-risk-result-output">
                ${resultHTML}
            </div>
            <p class="tool-disclaimer"><strong>Important:</strong> AI risk profile is an educational estimation based on common risk factors. It is not a diagnosis. Consult a healthcare professional for personalized advice and screening (e.g., ADA risk test, HbA1c).</p>
        </div>
    `;
    
    container.querySelector('#profile-diabetes-risk-ai-button')?.addEventListener('click', handleDiabetesRiskProfileAI);
}

export function handleDiabetesRiskInputChange(field: keyof bodySystemToolsState.DiabetesRiskData, value: string) {
     bodySystemToolsState.updateDiabetesRiskData({ 
        [field]: value, 
        aiStatus: 'idle', 
        aiError: null,
        riskLevel: null,
        identifiedRiskFactors: null,
        lifestyleRecommendations: null,
        screeningSuggestion: null
    });
}

async function handleDiabetesRiskProfileAI() {
    playButtonSound();
    const data = bodySystemToolsState.getDiabetesRiskData();

    const requiredFields: (keyof bodySystemToolsState.DiabetesRiskData)[] = ['age', 'bmi', 'familyHistoryDiabetes', 'gestationalDiabetes', 'physicalActivity', 'raceEthnicity', 'bloodPressureStatus', 'hdlCholesterol'];
    for (const field of requiredFields) {
        if (!data[field]) {
            bodySystemToolsState.updateDiabetesRiskData({ aiStatus: 'error', aiError: `Missing required field: ${field}. Please fill all fields.` });
            renderCurrentEndocrineTool();
            return;
        }
    }
    
    bodySystemToolsState.updateDiabetesRiskData({ aiStatus: 'loading', aiError: null });
    renderCurrentEndocrineTool();

    const currentAiInstance = (window as any).ai as GoogleGenAI | undefined;
    if (!currentAiInstance) {
        bodySystemToolsState.updateDiabetesRiskData({ aiStatus: 'error', aiError: "AI Service not available." });
        renderCurrentEndocrineTool();
        return;
    }
    
    let prompt = `You are a medical AI assistant. Based on the following patient risk factors, provide an estimated Type 2 Diabetes risk profile.
Patient Data:
- Age: ${data.age} years
- BMI: ${data.bmi} kg/m²
- Family History of Diabetes: ${data.familyHistoryDiabetes}
- History of Gestational Diabetes: ${data.gestationalDiabetes}
- Physical Activity Level: ${data.physicalActivity}
- Race/Ethnicity: ${data.raceEthnicity}
- Blood Pressure Status: ${bpStatusOptions.find(o=>o.value === data.bloodPressureStatus)?.text || data.bloodPressureStatus}
- HDL Cholesterol: ${data.hdlCholesterol} mg/dL

Provide your response strictly as a JSON object with the following keys:
1.  "riskLevel": A string for qualitative risk (e.g., "Low Risk", "Moderate Risk", "High Risk").
2.  "identifiedRiskFactors": An array of strings listing key contributing factors from the input (e.g., ["BMI in overweight range", "Positive family history"]).
3.  "lifestyleRecommendations": An array of 2-3 general lifestyle recommendation strings for risk reduction (e.g., ["Discuss weight management strategies with a healthcare provider.", "Aim for at least 150 minutes of moderate-intensity exercise per week."]).
4.  "screeningSuggestion": A string suggesting further screening if risk seems elevated, or reassurance if low (e.g., "Consider discussing HbA1c or fasting plasma glucose testing with a healthcare provider.", "Continue current healthy lifestyle, regular check-ups recommended.").

Example Output:
{
  "riskLevel": "Moderate Risk",
  "identifiedRiskFactors": ["BMI indicates overweight", "Family history of diabetes is positive"],
  "lifestyleRecommendations": ["Increase daily physical activity.", "Focus on a balanced diet with portion control.", "Monitor blood pressure regularly."],
  "screeningSuggestion": "Consider discussing an HbA1c test with your healthcare provider at your next visit."
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

        if (parsedData.riskLevel && Array.isArray(parsedData.identifiedRiskFactors) && Array.isArray(parsedData.lifestyleRecommendations) && parsedData.screeningSuggestion) {
            bodySystemToolsState.updateDiabetesRiskData({
                riskLevel: parsedData.riskLevel,
                identifiedRiskFactors: parsedData.identifiedRiskFactors,
                lifestyleRecommendations: parsedData.lifestyleRecommendations,
                screeningSuggestion: parsedData.screeningSuggestion,
                aiStatus: 'success',
                aiError: null
            });
        } else {
            throw new Error("AI response did not contain the expected JSON structure.");
        }
    } catch (error: any) {
        console.error("Error getting Diabetes Risk AI profile:", error);
        bodySystemToolsState.updateDiabetesRiskData({ aiStatus: 'error', aiError: error.message || 'Failed to parse or receive valid AI profile.' });
    } finally {
        if (typeof window.updateToolDataForActiveEncounter === 'function') {
            window.updateToolDataForActiveEncounter('Endocrine', 'diabetesRiskProfilerAI', { ...bodySystemToolsState.getDiabetesRiskData() });
        }
        renderCurrentEndocrineTool();
    }
}

// Helper to re-render the current tool
function renderCurrentEndocrineTool() {
    const activeCtx = bodySystemToolsState.bodySystemToolsState.activeToolContext;
    if (activeCtx && activeCtx.system === 'Endocrine' && activeCtx.toolId) {
        const toolsContainer = document.getElementById('component-specific-tools-container');
        if (toolsContainer) {
            (window as any).renderBodySystemToolContent?.(activeCtx.system, activeCtx.toolId, toolsContainer.querySelector('.tool-content-area'));
        }
    }
}
