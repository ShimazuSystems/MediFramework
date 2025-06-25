/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

// --- Type Definitions ---

interface NNPASubScale {
    id: string;
    name: string;
    description: string; // For AI prompt context
    clinicianNotes: string;
}

interface NNPADomain {
    id: string;
    name: string;
    description: string; // For AI prompt context
    subScales: NNPASubScale[];
    domainAISummary: string | null;
    isLoadingAI: boolean;
    errorAI: string | null;
}

export let nnpaData: {
    domains: NNPADomain[];
    overallAIAnalysis: {
        summary: string | null;
        riskLevel: 'Low Risk' | 'Moderate Risk' | 'High Risk' | 'Not Assessed' | null;
        isLoading: boolean;
        error: string | null;
    };
    statusMessage: string;
} = {
    domains: [],
    overallAIAnalysis: {
        summary: null,
        riskLevel: 'Not Assessed',
        isLoading: false,
        error: null,
    },
    statusMessage: "Enter observations for each sub-scale. Request AI analysis per domain, then overall.",
};

// --- Thesis-based Configuration ---
const NNPA_CONFIG: ReadonlyArray<{ id: string; name: string; description: string; subScales: { id: string; name: string, description: string }[] }> = [
    {
        id: 'realityOrientation',
        name: 'Reality Orientation and Perception',
        description: 'Assessing ability to distinguish between digital and physical reality, and nature of relationship with AI.',
        subScales: [
            { id: 'anthropomorphization', name: 'Anthropomorphization Scale', description: 'Degree to which individual attributes human qualities to AI systems.' },
            { id: 'realityBoundaries', name: 'Reality Boundaries Assessment', description: 'Ability to distinguish AI responses from human communication.' },
            { id: 'parasocialRelationship', name: 'Parasocial Relationship Intensity', description: 'Emotional attachment to AI entities.' },
            { id: 'digitalDissociation', name: 'Digital Dissociation Markers', description: 'Episodes of confusion between digital and physical interactions.' },
        ],
    },
    {
        id: 'cognitiveProcessing',
        name: 'Cognitive Processing Patterns',
        description: 'Evaluating thought patterns, beliefs, and behaviors related to digital technology and AI.',
        subScales: [
            { id: 'aiDependency', name: 'AI Dependency Index', description: 'Reliance on AI for decision-making and emotional support.' },
            { id: 'criticalThinking', name: 'Critical Thinking Assessment', description: 'Ability to evaluate AI-generated information critically.' },
            { id: 'ruminationPatterns', name: 'Rumination Patterns (AI-related)', description: 'Obsessive thoughts about AI capabilities or threats.' },
            { id: 'metacognitiveAwareness', name: 'Metacognitive Awareness (re: AI)', description: 'Understanding of one\'s own thinking processes regarding AI.' },
        ],
    },
    {
        id: 'behavioralIndicators',
        name: 'Behavioral Indicators',
        description: 'Measuring observable behaviors related to technology use and social interaction.',
        subScales: [
            { id: 'digitalEngagement', name: 'Digital Engagement Patterns', description: 'Time allocation and compulsive usage behaviors with technology/AI.' },
            { id: 'socialWithdrawal', name: 'Social Withdrawal Metrics', description: 'Preference for AI interaction over human contact.' },
            { id: 'functionalImpairment', name: 'Functional Impairment Scale', description: 'Impact of technology/AI use on work, relationships, and daily activities.' },
            { id: 'helpSeeking', name: 'Help-Seeking Behaviors', description: 'Willingness to discuss concerns about technology/AI use with professionals.' },
        ],
    },
    {
        id: 'emotionalRegulation',
        name: 'Emotional Regulation',
        description: 'Assessing emotional responses and identity in relation to AI systems.',
        subScales: [
            { id: 'anxietyResponseAI', name: 'Anxiety Response to AI', description: 'Fear, paranoia, or excessive worry about AI systems.' },
            { id: 'moodDependencyAI', name: 'Mood Dependency (on AI)', description: 'Emotional state influenced by AI interactions.' },
            { id: 'identityIntegrationAI', name: 'Identity Integration (with AI)', description: 'Sense of self in relation to AI capabilities.' },
            { id: 'emotionalAuthenticity', name: 'Emotional Authenticity (re: AI)', description: 'Distinguishing genuine emotions from AI-influenced responses.' },
        ],
    },
];


export function initializeNNPAData(savedData?: typeof nnpaData): void {
    if (savedData) {
        // Deep copy saved data to avoid shared references
        nnpaData.domains = savedData.domains ? JSON.parse(JSON.stringify(savedData.domains)) : NNPA_CONFIG.map(domainConfig => ({
            id: domainConfig.id,
            name: domainConfig.name,
            description: domainConfig.description,
            subScales: domainConfig.subScales.map(subScaleConfig => ({
                id: subScaleConfig.id,
                name: subScaleConfig.name,
                description: subScaleConfig.description,
                clinicianNotes: '',
            })),
            domainAISummary: null,
            isLoadingAI: false,
            errorAI: null,
        }));
        // Ensure all configured domains/subscales exist if loading from potentially older/partial data
        NNPA_CONFIG.forEach(configDomain => {
            let existingDomain = nnpaData.domains.find(d => d.id === configDomain.id);
            if (!existingDomain) {
                existingDomain = {
                    id: configDomain.id, name: configDomain.name, description: configDomain.description,
                    subScales: [], domainAISummary: null, isLoadingAI: false, errorAI: null
                };
                nnpaData.domains.push(existingDomain);
            }
            configDomain.subScales.forEach(configSubScale => {
                if (!existingDomain!.subScales.find(ss => ss.id === configSubScale.id)) {
                    existingDomain!.subScales.push({
                        id: configSubScale.id, name: configSubScale.name, description: configSubScale.description,
                        clinicianNotes: ''
                    });
                }
            });
        });


        nnpaData.overallAIAnalysis = savedData.overallAIAnalysis ? JSON.parse(JSON.stringify(savedData.overallAIAnalysis)) : { summary: null, riskLevel: 'Not Assessed', isLoading: false, error: null };
        nnpaData.statusMessage = savedData.statusMessage || "NNPA data loaded.";
    } else {
        nnpaData.domains = NNPA_CONFIG.map(domainConfig => ({
            id: domainConfig.id,
            name: domainConfig.name,
            description: domainConfig.description,
            subScales: domainConfig.subScales.map(subScaleConfig => ({
                id: subScaleConfig.id,
                name: subScaleConfig.name,
                description: subScaleConfig.description,
                clinicianNotes: '',
            })),
            domainAISummary: null,
            isLoadingAI: false,
            errorAI: null,
        }));
        nnpaData.overallAIAnalysis = { summary: null, riskLevel: 'Not Assessed', isLoading: false, error: null };
        nnpaData.statusMessage = "NNPA initialized. Enter observations and request AI analysis.";
    }
}

// Initialize if not already done
if (nnpaData.domains.length === 0) {
    initializeNNPAData();
}

// --- UI Rendering Functions ---
export function renderNNPAScreen(): string {
    let content = `<div class='psych-module-content nnpa-container'>
                        <div class='psych-module-title'>Neural Network Psychosis Assessment (NNPA)</div>`;
    content += `<p class="psych-assessment-instruction">${(window as any).createPsychTerminalStyledText(nnpaData.statusMessage)}</p>`;

    nnpaData.domains.forEach(domain => {
        content += `<div class="nnpa-domain" id="nnpa-domain-${domain.id}">
                        <h4 class="psych-module-subtitle nnpa-domain-title">${domain.name}</h4>
                        <p class="nnpa-domain-description">${domain.description}</p>`;
        
        domain.subScales.forEach(subScale => {
            content += `<div class="nnpa-subscale" id="nnpa-subscale-${domain.id}-${subScale.id}">
                            <h5 class="nnpa-subscale-title">${subScale.name}</h5>
                            <p class="nnpa-subscale-description">${subScale.description}</p>
                            ${(window as any).createUITextAreaHTML(`Clinician notes for ${subScale.name}...`, `nnpa-notes-${domain.id}-${subScale.id}`, 3, subScale.clinicianNotes)}
                        </div>`;
        });

        content += `<div class="psych-actions nnpa-domain-actions">
                        <button data-action="requestNNPADomainAI" data-action-context="${domain.id}" ${domain.isLoadingAI ? 'disabled' : ''}>
                            ${domain.isLoadingAI ? `ANALYZING ${domain.name.toUpperCase()}...` : `AI Analyze ${domain.name}`}
                        </button>
                    </div>`;
        if (domain.errorAI) {
            content += `<p class="term-highlight error nnpa-domain-error">Domain Analysis Error: ${domain.errorAI}</p>`;
        }
        if (domain.domainAISummary) {
            content += `<div class="nnpa-domain-aisummary">
                            <strong>AI Summary for ${domain.name}:</strong>
                            <pre class="terminal-preformatted-text">${(window as any).createPsychTerminalStyledText(domain.domainAISummary)}</pre>
                        </div>`;
        }
        content += `</div>`; // End nnpa-domain
    });

    content += `<div class="psych-actions nnpa-overall-actions">
                    <button data-action="requestNNPAOverallAI" ${nnpaData.overallAIAnalysis.isLoading ? 'disabled' : ''}>
                        ${nnpaData.overallAIAnalysis.isLoading ? 'GENERATING OVERALL ASSESSMENT...' : 'Generate Overall NNPA Assessment & Risk'}
                    </button>
                </div>`;

    if (nnpaData.overallAIAnalysis.error) {
        content += `<p class="term-highlight error nnpa-overall-error">Overall Assessment Error: ${nnpaData.overallAIAnalysis.error}</p>`;
    }
    if (nnpaData.overallAIAnalysis.summary || nnpaData.overallAIAnalysis.riskLevel !== 'Not Assessed') {
        content += `<div class="nnpa-overall-aisummary">
                        <h4 class="psych-module-subtitle">OVERALL NNPA ASSESSMENT:</h4>
                        <p><strong>AI Estimated Risk Level:</strong> <span class="term-highlight">${nnpaData.overallAIAnalysis.riskLevel || 'Error in risk assessment'}</span></p>
                        <p><strong>AI Overall Summary:</strong></p>
                        <pre class="terminal-preformatted-text">${(window as any).createPsychTerminalStyledText(nnpaData.overallAIAnalysis.summary || 'No summary generated.')}</pre>
                    </div>`;
    }

    content += `<p class="tool-disclaimer" style="margin-top: 1rem;">
                    <strong>Ethical Considerations & Limitations:</strong> This Neural Network Psychosis Assessment (NNPA) is a screening tool based on the provided thesis. 
                    It is intended to assist qualified healthcare professionals and IS NOT a diagnostic instrument. 
                    All assessments require professional oversight, and clinical judgment supersedes algorithmic scoring. 
                    Results must be correlated with a full clinical evaluation. Data privacy and informed consent are paramount.
                </p>`;

    content += `<div class="psych-nav-options">
                    <button data-action="resetNNPA">Reset NNPA Form</button>
                    <button data-nav-target="mainMenu">Back to Main Menu</button>
                </div>
              </div>`;
    return content;
}

// --- Event Handlers ---
export function handleNNPANotesChange(fullId: string, text: string): void {
    const [, , domainId, subScaleId] = fullId.split('-');
    const domain = nnpaData.domains.find(d => d.id === domainId);
    if (domain) {
        const subScale = domain.subScales.find(ss => ss.id === subScaleId);
        if (subScale) {
            subScale.clinicianNotes = text;
        }
    }
}

// --- AI Interaction ---
async function generateAIContent(prompt: string, isJsonExpected: boolean = false): Promise<any> {
    const currentAiInstance = (window as any).ai as GoogleGenAI | undefined;
    if (!currentAiInstance) {
        throw new Error("AI service is not available.");
    }
    const response: GenerateContentResponse = await currentAiInstance.models.generateContent({
        model: "gemini-2.5-flash-preview-04-17",
        contents: prompt,
        ...(isJsonExpected && { config: { responseMimeType: "application/json" } })
    });

    let responseText = response.text.trim();
    if (isJsonExpected) {
        const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
        const match = responseText.match(fenceRegex);
        if (match && match[2]) {
            responseText = match[2].trim();
        }
        try {
            return JSON.parse(responseText);
        } catch (e) {
            console.error("Failed to parse JSON response:", responseText, e);
            throw new Error("AI response was not valid JSON. Raw: " + responseText.substring(0, 100) + "...");
        }
    }
    return responseText; 
}

export async function requestNNPADomainAI(domainId: string): Promise<void> {
    const domain = nnpaData.domains.find(d => d.id === domainId);
    if (!domain) return;

    domain.isLoadingAI = true;
    domain.errorAI = null;
    domain.domainAISummary = null;
    (window as any).renderPsychometricTerminal();

    let subScalesText = "";
    domain.subScales.forEach(ss => {
        if (ss.clinicianNotes.trim()) {
            subScalesText += `- ${ss.name} (${ss.description}):\nClinician Notes: "${ss.clinicianNotes}"\n\n`;
        } else {
            subScalesText += `- ${ss.name} (${ss.description}): No clinician notes provided.\n\n`;
        }
    });

    if (domain.subScales.every(ss => !ss.clinicianNotes.trim())) { // Check if all notes are empty
        domain.errorAI = "No clinician notes provided for any sub-scales in this domain.";
        domain.isLoadingAI = false;
        (window as any).renderPsychometricTerminal();
        return;
    }

    const prompt = `You are a clinical AI assistant. Analyze the clinician's input for the "${domain.name}" domain of the Neural Network Psychosis Assessment.
Domain Description: ${domain.description}
Sub-scale details and clinician notes:
${subScalesText}
Provide a concise summary (3-5 sentences) for the entire "${domain.name}" domain, integrating findings from the sub-scales. Highlight key patterns, concerns, or areas of apparent normal functioning observed from the notes.
Output your summary as a single block of text.`;

    try {
        const summary = await generateAIContent(prompt);
        domain.domainAISummary = summary as string;
    } catch (error: any) {
        console.error(`AI analysis error for domain ${domainId}:`, error);
        domain.errorAI = error.message || "Unknown AI error during domain analysis.";
    } finally {
        domain.isLoadingAI = false;
        if (typeof window.updatePsychometricDataForActiveEncounter === 'function') {
            window.updatePsychometricDataForActiveEncounter('nnpa', { ...nnpaData });
        }
        (window as any).renderPsychometricTerminal();
    }
}

export async function requestNNPAOverallAI(): Promise<void> {
    nnpaData.overallAIAnalysis.isLoading = true;
    nnpaData.overallAIAnalysis.error = null;
    nnpaData.overallAIAnalysis.summary = null;
    nnpaData.overallAIAnalysis.riskLevel = 'Not Assessed';
    (window as any).renderPsychometricTerminal();

    let allDomainDataText = "";
    let domainsWithInputCount = 0;
    nnpaData.domains.forEach(domain => {
        allDomainDataText += `Domain: ${domain.name}\n`;
        if (domain.domainAISummary) {
            allDomainDataText += `AI Summary for Domain: ${domain.domainAISummary}\n`;
            domainsWithInputCount++;
        } else {
             let notesFoundForDomain = false;
             domain.subScales.forEach(ss => {
                if(ss.clinicianNotes.trim()) {
                    if (!notesFoundForDomain) {
                         allDomainDataText += `Clinician Notes for Sub-scales:\n`;
                         notesFoundForDomain = true;
                    }
                    allDomainDataText += `  - ${ss.name}: ${ss.clinicianNotes.substring(0,100)}...\n`; 
                }
             });
             if (notesFoundForDomain) domainsWithInputCount++;

             if (!notesFoundForDomain && !domain.domainAISummary) {
                 allDomainDataText += `  (No specific notes or AI summary for this domain yet)\n`;
             }
        }
        allDomainDataText += "\n";
    });

    if (domainsWithInputCount === 0 ) { 
        nnpaData.overallAIAnalysis.error = "Please provide notes for some sub-scales or request AI analysis for at least one domain before overall assessment.";
        nnpaData.overallAIAnalysis.isLoading = false;
        (window as any).renderPsychometricTerminal();
        return;
    }

    const riskStratificationGuidelines = `
Risk Stratification Guidelines:
- Low Risk (Green Zone): Appropriate boundaries with AI systems; Maintained critical thinking; Functional daily activities; Healthy social relationships.
- Moderate Risk (Yellow Zone): Some boundary confusion; Mild dependency patterns; Occasional functional impairment; Reduced but present human social contact.
- High Risk (Red Zone): Significant reality testing concerns; Severe dependency or paranoia; Major functional impairment; Social isolation or withdrawal.
`;

    const prompt = `You are an expert clinical AI. Based on the provided data from the Neural Network Psychosis Assessment (NNPA), generate an overall assessment.
${riskStratificationGuidelines}
Collected Data:
${allDomainDataText}
Return your response strictly as a JSON object with two keys:
1.  "riskLevel": A string ("Low Risk", "Moderate Risk", or "High Risk") based on the guidelines and overall data.
2.  "overallSummary": A comprehensive text summary (5-7 sentences) integrating findings across all domains. Highlight key patterns, consistencies, discrepancies, and potential areas for further clinical attention. Emphasize this is a screening tool.

Generate the JSON response:`;

    try {
        const result = await generateAIContent(prompt, true); // Expect JSON
        if (result && result.riskLevel && result.overallSummary) {
            nnpaData.overallAIAnalysis.riskLevel = result.riskLevel;
            nnpaData.overallAIAnalysis.summary = result.overallSummary;
        } else {
            throw new Error("AI response did not provide expected 'riskLevel' and 'overallSummary' in JSON.");
        }
    } catch (error: any) {
        console.error("Overall NNPA AI analysis error:", error);
        nnpaData.overallAIAnalysis.error = error.message || "Unknown AI error during overall assessment.";
    } finally {
        nnpaData.overallAIAnalysis.isLoading = false;
        if (typeof window.updatePsychometricDataForActiveEncounter === 'function') {
            window.updatePsychometricDataForActiveEncounter('nnpa', { ...nnpaData });
        }
        (window as any).renderPsychometricTerminal();
    }
}

export function resetNNPA(): void {
    initializeNNPAData(); // Re-initializes all data to default
    nnpaData.statusMessage = "NNPA form has been reset.";
    if (typeof window.updatePsychometricDataForActiveEncounter === 'function') {
        window.updatePsychometricDataForActiveEncounter('nnpa', { ...nnpaData });
    }
    (window as any).renderPsychometricTerminal();
}