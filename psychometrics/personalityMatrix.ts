/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

// Assume these are globally available from index.tsx or will be passed/imported
declare function createUISliderHTML(id: string, label: string, minLabel: string, maxLabel: string, min: number, max: number, value: number, color: string): string;
declare function createUITextInputHTML(placeholder: string, name: string, value?: string): string;
declare function renderPsychometricTerminal(): void;
declare function createPsychTerminalStyledText(text: string): string;

interface PersonalityTrait {
    id: string;
    name: string;
    description: string;
    lowAnchor: string;
    highAnchor: string;
}

const defaultTraits: ReadonlyArray<PersonalityTrait> = [
    { id: 'openness', name: 'Openness to Experience', description: 'Reflects a person\'s willingness to try new things, be imaginative, and appreciate art and beauty.', lowAnchor: 'Conventional', highAnchor: 'Imaginative' },
    { id: 'conscientiousness', name: 'Conscientiousness', description: 'Indicates how organized, dependable, and responsible a person is.', lowAnchor: 'Spontaneous', highAnchor: 'Organized' },
    { id: 'extraversion', name: 'Extraversion', description: 'Measures how outgoing, sociable, and assertive a person is.', lowAnchor: 'Introverted', highAnchor: 'Extraverted' },
    { id: 'agreeableness', name: 'Agreeableness', description: 'Shows how cooperative, empathetic, and kind a person tends to be.', lowAnchor: 'Competitive', highAnchor: 'Cooperative' },
    { id: 'neuroticism', name: 'Neuroticism (Emotional Stability)', description: 'Assesses the tendency to experience negative emotions like anxiety, sadness, and irritability. Higher scores indicate more neuroticism (lower emotional stability).', lowAnchor: 'Calm/Stable', highAnchor: 'Anxious/Reactive' },
];

export let personalityMatrixData: {
    traits: PersonalityTrait[];
    userRatings: { [key: string]: number };
    userDescriptions: { [key: string]: string };
    aiInterpretations: { [key: string]: string };
    overallAISummary: string;
    isLoadingAI: boolean;
    statusMessage: string;
} = {
    traits: [...defaultTraits], // Ensure it's a copy
    userRatings: {},
    userDescriptions: {},
    aiInterpretations: {},
    overallAISummary: '',
    isLoadingAI: false,
    statusMessage: 'Please rate each trait and provide a brief description, then click "Get AI Analysis".',
};

export function initializePersonalityMatrixData(savedData?: typeof personalityMatrixData): void {
    personalityMatrixData.traits = [...defaultTraits]; // Always reset traits to default definition
    if (savedData) {
        // Deep copy saved data where appropriate
        personalityMatrixData.userRatings = savedData.userRatings ? JSON.parse(JSON.stringify(savedData.userRatings)) : {};
        personalityMatrixData.userDescriptions = savedData.userDescriptions ? JSON.parse(JSON.stringify(savedData.userDescriptions)) : {};
        personalityMatrixData.aiInterpretations = savedData.aiInterpretations ? JSON.parse(JSON.stringify(savedData.aiInterpretations)) : {};
        personalityMatrixData.overallAISummary = savedData.overallAISummary || '';
        personalityMatrixData.isLoadingAI = savedData.isLoadingAI || false; // Typically should be false on load
        personalityMatrixData.statusMessage = savedData.statusMessage || 'Personality Matrix data loaded.';
    } else {
        personalityMatrixData.userRatings = {};
        personalityMatrixData.userDescriptions = {};
        personalityMatrixData.aiInterpretations = {};
        personalityMatrixData.overallAISummary = '';
        personalityMatrixData.isLoadingAI = false;
        personalityMatrixData.statusMessage = 'Assessment reset. Please rate each trait and provide a brief description.';
    }
    // Ensure all traits have a default rating and description if not loaded
    personalityMatrixData.traits.forEach(trait => {
        if (personalityMatrixData.userRatings[trait.id] === undefined) {
            personalityMatrixData.userRatings[trait.id] = 50;
        }
        if (personalityMatrixData.userDescriptions[trait.id] === undefined) {
            personalityMatrixData.userDescriptions[trait.id] = '';
        }
    });
}

// Initialize on first load if data is empty
if (Object.keys(personalityMatrixData.userRatings).length === 0 && personalityMatrixData.overallAISummary === '') {
    initializePersonalityMatrixData();
}


export function renderPersonalityMatrixScreen(): string {
    let content = `<div class='psych-module-content personality-matrix-container'><div class='psych-module-title'>PERSONALITY ASSESSMENT MATRIX (AI)</div>`;
    content += `<p class="psych-assessment-instruction">For each trait, adjust the slider to reflect your self-perception (0-100) and provide a brief description of how this trait manifests in you. Then, request an AI-generated interpretation.</p>`;

    personalityMatrixData.traits.forEach(trait => {
        content += `<div class="trait-assessment-block">
            <div class="psych-module-subtitle" style="margin-top: 0.5rem; margin-bottom:0.2rem;">${trait.name}</div>
            <p class="trait-description">${trait.description}</p>
            <div class="trait-input-group">
                ${createUISliderHTML(`pm-slider-${trait.id}`, `Rate your ${trait.name}:`, trait.lowAnchor, trait.highAnchor, 0, 100, personalityMatrixData.userRatings[trait.id] || 50, 'var(--accent-cyan)')}
                ${createUITextInputHTML(`Briefly describe your ${trait.name.toLowerCase()}...`, `pm-text-${trait.id}`, personalityMatrixData.userDescriptions[trait.id] || '')}
            </div>
            ${personalityMatrixData.aiInterpretations[trait.id] ? `<div class="trait-interpretation-ai"><strong>AI Interpretation (${trait.name}):</strong><br>${createPsychTerminalStyledText(personalityMatrixData.aiInterpretations[trait.id])}</div>` : ''}
        </div>`;
    });

    content += `<div class="psych-actions" style="margin-top:1rem;">
                    <button data-action="requestPersonalityAIAnalysis" class="psych-pm-button" ${personalityMatrixData.isLoadingAI ? 'disabled' : ''}>
                        ${personalityMatrixData.isLoadingAI ? 'ANALYZING...' : 'Get AI Analysis'}
                    </button>
                    <button data-action="resetPersonalityMatrix" class="psych-pm-button">Reset Assessment</button>
                </div>`;

    if (personalityMatrixData.isLoadingAI) {
        content += `<div class="pm-status-message loading">${createPsychTerminalStyledText(personalityMatrixData.statusMessage)}</div>`;
    } else if (personalityMatrixData.statusMessage) {
        content += `<div class="pm-status-message">${createPsychTerminalStyledText(personalityMatrixData.statusMessage)}</div>`;
    }

    if (personalityMatrixData.overallAISummary) {
        content += `<div class="ai-overall-summary">
                        <div class="psych-module-subtitle">OVERALL AI PERSONALITY SUMMARY:</div>
                        <p>${createPsychTerminalStyledText(personalityMatrixData.overallAISummary)}</p>
                    </div>`;
    }
    
    content += `<div class="psych-nav-options"><button data-nav-target="mainMenu">Back to Main Menu</button></div></div>`;
    return content;
}

export function handlePersonalityMatrixSliderChange(sliderIdWithPrefix: string, value: number): void {
    const traitId = sliderIdWithPrefix.replace('pm-slider-', '');
    if (personalityMatrixData.traits.find(t => t.id === traitId)) {
        personalityMatrixData.userRatings[traitId] = value;
        const psychTerminalDisplayEl = document.getElementById('psychometric-terminal-display');
        const outputEl = psychTerminalDisplayEl?.querySelector(`output[for="${sliderIdWithPrefix}"]`);
        if (outputEl) {
            outputEl.textContent = `Current: ${value}/100`;
        }
    }
}

export function handlePersonalityMatrixInputChange(inputIdWithPrefix: string, textValue: string): void {
    const traitId = inputIdWithPrefix.replace('pm-text-', '');
     if (personalityMatrixData.traits.find(t => t.id === traitId)) {
        personalityMatrixData.userDescriptions[traitId] = textValue;
    }
}

export async function requestAIAnalysis(): Promise<void> {
    const currentAiInstance = (window as any).ai as GoogleGenAI | undefined;
    if (!currentAiInstance) {
        personalityMatrixData.statusMessage = "AI Service not available. Cannot perform analysis.";
        personalityMatrixData.isLoadingAI = false;
        renderPsychometricTerminal();
        return;
    }

    personalityMatrixData.isLoadingAI = true;
    personalityMatrixData.statusMessage = 'Requesting AI analysis... This may take a moment.';
    personalityMatrixData.aiInterpretations = {}; // Clear previous before new request
    personalityMatrixData.overallAISummary = '';    // Clear previous before new request
    renderPsychometricTerminal(); // Show loading state

    let prompt = `You are a helpful assistant interpreting a personality self-assessment based on the Big Five model.
The user has provided ratings (0-100 scale) and textual descriptions for each trait.
For Openness, Conscientiousness, Extraversion, and Agreeableness, a higher score (closer to 100) means more of that trait.
For Neuroticism, a higher score (closer to 100) means higher neuroticism (i.e., lower emotional stability).

User Inputs:
`;
    let allInputsProvided = true;
    personalityMatrixData.traits.forEach(trait => {
        const rating = personalityMatrixData.userRatings[trait.id];
        const description = personalityMatrixData.userDescriptions[trait.id] || 'No specific description provided.';
        if (typeof rating !== 'number') { 
            allInputsProvided = false;
        }
        prompt += `- ${trait.name}:
  - Rating: ${rating !== undefined ? rating : 'Not rated'}/100
  - User's description: "${description}"
  - Scale anchors: 0 = ${trait.lowAnchor}, 100 = ${trait.highAnchor}\n`;
    });

    if (!allInputsProvided) {
        personalityMatrixData.statusMessage = "Please rate all personality traits before requesting analysis.";
        personalityMatrixData.isLoadingAI = false;
        renderPsychometricTerminal();
        return;
    }

    prompt += `
Based on these inputs, provide your analysis strictly in JSON format. The JSON object must have two top-level keys:
1.  "traitInterpretations": An object. Each key in this object should be a trait ID (e.g., "openness", "conscientiousness", "extraversion", "agreeableness", "neuroticism"). The value for each trait ID should be a brief (2-4 sentences) interpretation of the user's self-assessment for that specific trait. This interpretation should consider both their numerical rating and their textual description.
2.  "overallSummary": A string. This should be a concise (3-5 sentences) overall summary of the personality profile based on all inputs.

Important:
- Be empathetic and constructive in your interpretations.
- Focus on how the traits might manifest, rather than making definitive judgments.
- Ensure the entire output is a single, valid JSON object. Do not include any text outside the JSON structure.

Generate the JSON response now.
`;

    try {
        const response: GenerateContentResponse = await currentAiInstance.models.generateContent({
            model: "gemini-2.5-flash-preview-04-17",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
            }
        });

        let jsonStr = response.text.trim();
        const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s; 
        const match = jsonStr.match(fenceRegex);
        if (match && match[2]) {
          jsonStr = match[2].trim(); 
        }

        const parsedData = JSON.parse(jsonStr);

        if (parsedData.traitInterpretations && typeof parsedData.traitInterpretations === 'object' && parsedData.overallSummary && typeof parsedData.overallSummary === 'string') {
            personalityMatrixData.aiInterpretations = parsedData.traitInterpretations;
            personalityMatrixData.overallAISummary = parsedData.overallSummary;
            personalityMatrixData.statusMessage = 'AI analysis complete. Review the interpretations below.';
        } else {
            throw new Error("AI response JSON structure is invalid or missing expected fields (traitInterpretations object, overallSummary string).");
        }

    } catch (error: any) {
        console.error("Error getting AI analysis:", error);
        personalityMatrixData.statusMessage = `Error from AI: ${error.message || 'Failed to parse or receive valid analysis.'}`;
        personalityMatrixData.overallAISummary = `AI analysis could not be completed due to an error. Details: ${error.message || 'Unknown error during AI processing.'}`;
    } finally {
        personalityMatrixData.isLoadingAI = false;
        renderPsychometricTerminal();
    }
}

export function handleResetPersonalityMatrix(): void {
    initializePersonalityMatrixData(); // This already sets a status message
    renderPsychometricTerminal();
}