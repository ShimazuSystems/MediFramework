/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

// --- Type Definitions ---
interface MSESectionAnalysis {
    summary: string;
    keywords: string[];
    redFlags: string[];
    isLoading: boolean;
    error: string | null;
}

interface MSESection {
    notes: string;
    selectedOptions: { [key: string]: string | string[] }; // For single or multi-selects
    checkboxes: { [key: string]: boolean }; // For checkboxes
    analysis: MSESectionAnalysis;
}

export interface MSESections { // Exported for type safety in encounter manager
    appearance: MSESection;
    behavior: MSESection;
    attitude: MSESection;
    speech: MSESection;
    mood: MSESection;
    affect: MSESection;
    thoughtProcess: MSESection;
    thoughtContent: MSESection;
    perception: MSESection;
    cognition: MSESection;
    insight: MSESection;
    judgment: MSESection;
    reliability: MSESection;
}

const defaultMSESectionKeys: ReadonlyArray<keyof MSESections> = [
    'appearance', 'behavior', 'attitude', 'speech', 'mood', 'affect', 
    'thoughtProcess', 'thoughtContent', 'perception', 'cognition', 
    'insight', 'judgment', 'reliability'
];

export let mseData: {
    sections: MSESections;
    overallAISummary: string;
    isLoadingOverallAI: boolean;
    statusMessage: string;
    errorOverallAI: string | null;
} = {
    sections: {} as MSESections, // Initialized by initializeMSEData
    overallAISummary: '',
    isLoadingOverallAI: false,
    statusMessage: 'Please fill out the MSE sections. AI analysis can be requested per section or overall.',
    errorOverallAI: null,
};

function createInitialSection(): MSESection {
    return {
        notes: '',
        selectedOptions: {},
        checkboxes: {},
        analysis: {
            summary: '',
            keywords: [],
            redFlags: [],
            isLoading: false,
            error: null,
        }
    };
}

export function initializeMSEData(savedData?: typeof mseData): void {
    if (savedData) {
        // Deep copy sections to avoid reference issues
        mseData.sections = JSON.parse(JSON.stringify(savedData.sections || {}));
        // Ensure all default sections exist if loading from a partial save
        defaultMSESectionKeys.forEach(key => {
            if (!mseData.sections[key]) {
                mseData.sections[key] = createInitialSection();
            }
             // Ensure specific checkbox groups are present
            if (key === 'cognition' && (!mseData.sections[key].checkboxes || Object.keys(mseData.sections[key].checkboxes).filter(k => k.startsWith('orientation')).length === 0) ) {
                 mseData.sections[key].checkboxes = {
                    ...(mseData.sections[key].checkboxes || {}), // preserve other checkboxes if any
                    orientationTime: false, orientationPlace: false, orientationPerson: false, orientationSituation: false,
                };
            }
            if (key === 'thoughtContent' && (!mseData.sections[key].checkboxes || Object.keys(mseData.sections[key].checkboxes).filter(k => k.startsWith('si') || k.startsWith('hi')).length === 0) ) {
                mseData.sections[key].checkboxes = {
                     ...(mseData.sections[key].checkboxes || {}),
                    siPlan: false, siIntent: false, siMeans: false,
                    hiPlan: false, hiIntent: false, hiMeans: false,
                };
            }
        });

        mseData.overallAISummary = savedData.overallAISummary || '';
        mseData.isLoadingOverallAI = savedData.isLoadingOverallAI || false; // Should be false on load
        mseData.statusMessage = savedData.statusMessage || 'MSE data loaded.';
        mseData.errorOverallAI = savedData.errorOverallAI || null;
    } else {
        mseData.sections = {
            appearance: createInitialSection(),
            behavior: createInitialSection(),
            attitude: createInitialSection(),
            speech: createInitialSection(),
            mood: createInitialSection(),
            affect: createInitialSection(),
            thoughtProcess: createInitialSection(),
            thoughtContent: createInitialSection(),
            perception: createInitialSection(),
            cognition: createInitialSection(),
            insight: createInitialSection(),
            judgment: createInitialSection(),
            reliability: createInitialSection(),
        };
        // Initialize specific checkbox groups for cognition/orientation
        mseData.sections.cognition.checkboxes = {
            orientationTime: false,
            orientationPlace: false,
            orientationPerson: false,
            orientationSituation: false,
        };
        mseData.sections.thoughtContent.checkboxes = {
            siPlan: false, siIntent: false, siMeans: false,
            hiPlan: false, hiIntent: false, hiMeans: false,
        };

        mseData.overallAISummary = '';
        mseData.isLoadingOverallAI = false;
        mseData.statusMessage = 'MSE Reset. Please fill out sections and request AI analysis.';
        mseData.errorOverallAI = null;
    }
}

// Call initialize on load or when module becomes active if state isn't persisted
if (Object.keys(mseData.sections).length === 0) {
    initializeMSEData();
}


// --- UI Rendering Functions ---
function renderSectionHeader(title: string, sectionKey: keyof MSESections): string {
    const section = mseData.sections[sectionKey];
    let loadingIndicator = section.analysis.isLoading ? ' <span class="term-highlight">[ANALYZING...]</span>' : '';
    return `<div class="psych-module-subtitle">${title}${loadingIndicator}</div>`;
}

function renderAIAnalysisBox(analysis: MSESectionAnalysis): string {
    if (analysis.error) {
        return `<div class="mse-ai-analysis error"><strong>AI Analysis Error:</strong> ${(window as any).createPsychTerminalStyledText(analysis.error)}</div>`;
    }
    if (!analysis.summary && analysis.keywords.length === 0 && analysis.redFlags.length === 0) {
        return ''; // No analysis to show yet
    }
    let html = '<div class="mse-ai-analysis">';
    if (analysis.summary) {
        html += `<strong>AI Summary:</strong> <p>${(window as any).createPsychTerminalStyledText(analysis.summary)}</p>`;
    }
    if (analysis.keywords.length > 0) {
        html += `<strong>Keywords:</strong> <p>[${analysis.keywords.map(kw => (window as any).createPsychTerminalStyledText(kw)).join('], [')}]</p>`;
    }
    if (analysis.redFlags.length > 0) {
        html += `<strong>Potential Red Flags:</strong> <p class="mse-red-flags">[${analysis.redFlags.map(rf => (window as any).createPsychTerminalStyledText(rf)).join('], [')}]</p>`;
    }
    html += '</div>';
    return html;
}

function renderAIButton(sectionKey: keyof MSESections, buttonText: string = "AI Analyze Section"): string {
    return `<button data-action="requestMSEAISectionAnalysis" data-action-context="${sectionKey}" class="psych-mse-button" ${mseData.sections[sectionKey].analysis.isLoading ? 'disabled' : ''}>${buttonText}</button>`;
}


export function renderMSEScreen(): string {
    let content = `<div class='psych-module-content mse-container'><div class='psych-module-title'>MENTAL STATE EXAMINATION (MSE) + AI</div>`;
    content += `<p class="psych-assessment-instruction">Document observations for each category. Use AI to assist with summarizing sections or the overall MSE.</p>`;

    // Appearance
    content += `<div class="mse-section" id="mse-appearance-section">`;
    content += renderSectionHeader('Appearance', 'appearance');
    content += (window as any).createUITextAreaHTML('Describe patient\'s general appearance (e.g., grooming, attire, hygiene, build, any distinguishing features)...', `mse-appearance-notes`, 3, mseData.sections.appearance.notes);
    content += renderAIButton('appearance');
    content += renderAIAnalysisBox(mseData.sections.appearance.analysis);
    content += `</div>`;

    // Behavior & Psychomotor Activity
    content += `<div class="mse-section" id="mse-behavior-section">`;
    content += renderSectionHeader('Behavior & Psychomotor Activity', 'behavior');
    content += (window as any).createUITextAreaHTML('Describe behavior, psychomotor activity (e.g., calm, agitated, restless, tics, tremors, gait, posture)...', `mse-behavior-notes`, 3, mseData.sections.behavior.notes);
    content += renderAIButton('behavior');
    content += renderAIAnalysisBox(mseData.sections.behavior.analysis);
    content += `</div>`;
    
    // Attitude Towards Examiner
    content += `<div class="mse-section" id="mse-attitude-section">`;
    content += renderSectionHeader('Attitude Towards Examiner', 'attitude');
    content += (window as any).createUISelectHTML('mse-attitude-selectedOptions-attitudeType', 'Primary Attitude:', [
        { value: 'cooperative', text: 'Cooperative' }, { value: 'friendly', text: 'Friendly' },
        { value: 'guarded', text: 'Guarded' }, { value: 'suspicious', text: 'Suspicious' },
        { value: 'hostile', text: 'Hostile' }, { value: 'evasive', text: 'Evasive' },
        { value: 'apathetic', text: 'Apathetic' }, { value: 'indifferent', text: 'Indifferent' },
        { value: 'other', text: 'Other (describe below)' }
    ], mseData.sections.attitude.selectedOptions.attitudeType as string || '');
    content += (window as any).createUITextAreaHTML('Notes on attitude (e.g., eye contact, engagement, specific behaviors)...', `mse-attitude-notes`, 2, mseData.sections.attitude.notes);
    content += renderAIButton('attitude');
    content += renderAIAnalysisBox(mseData.sections.attitude.analysis);
    content += `</div>`;

    // Speech
    content += `<div class="mse-section" id="mse-speech-section">`;
    content += renderSectionHeader('Speech', 'speech');
    content += (window as any).createUISelectHTML('mse-speech-selectedOptions-rate', 'Rate:', [{value:'slow',text:'Slow'}, {value:'normal',text:'Normal'}, {value:'rapid',text:'Rapid'}, {value:'pressured',text:'Pressured'}], mseData.sections.speech.selectedOptions.rate as string || '');
    content += (window as any).createUISelectHTML('mse-speech-selectedOptions-volume', 'Volume:', [{value:'soft',text:'Soft'}, {value:'normal',text:'Normal'}, {value:'loud',text:'Loud'}], mseData.sections.speech.selectedOptions.volume as string || '');
    content += (window as any).createUISelectHTML('mse-speech-selectedOptions-articulation', 'Articulation:', [{value:'clear',text:'Clear'}, {value:'slurred',text:'Slurred'}, {value:'mumbled',text:'Mumbled'}], mseData.sections.speech.selectedOptions.articulation as string || '');
    content += (window as any).createUISelectHTML('mse-speech-selectedOptions-quantity', 'Quantity:', [{value:'talkative',text:'Talkative'}, {value:'spontaneous',text:'Spontaneous'}, {value:'paucity',text:'Paucity of speech'}], mseData.sections.speech.selectedOptions.quantity as string || '');
    content += (window as any).createUITextAreaHTML('Describe overall speech quality, prosody, rhythm, spontaneity...', `mse-speech-notes`, 2, mseData.sections.speech.notes);
    content += renderAIButton('speech');
    content += renderAIAnalysisBox(mseData.sections.speech.analysis);
    content += `</div>`;

    // Mood
    content += `<div class="mse-section" id="mse-mood-section">`;
    content += renderSectionHeader('Mood (Subjective)', 'mood');
    content += (window as any).createUITextAreaHTML('Patient\'s reported mood (e.g., "I feel sad", "anxious", "okay"). Use direct quotes if possible.', `mse-mood-notes`, 2, mseData.sections.mood.notes);
    content += renderAIButton('mood');
    content += renderAIAnalysisBox(mseData.sections.mood.analysis);
    content += `</div>`;
    
    // Affect
    content += `<div class="mse-section" id="mse-affect-section">`;
    content += renderSectionHeader('Affect (Objective)', 'affect');
    content += (window as any).createUISelectHTML('mse-affect-selectedOptions-quality', 'Quality:', [{value:'euthymic',text:'Euthymic'}, {value:'depressed',text:'Depressed'}, {value:'anxious',text:'Anxious'}, {value:'euphoric',text:'Euphoric'}, {value:'angry',text:'Angry'}, {value:'labile',text:'Labile'}, {value:'blunted',text:'Blunted'}, {value:'flat',text:'Flat'}], mseData.sections.affect.selectedOptions.quality as string || '');
    content += (window as any).createUISelectHTML('mse-affect-selectedOptions-range', 'Range:', [{value:'full',text:'Full'}, {value:'restricted',text:'Restricted'}, {value:'constricted',text:'Constricted'}], mseData.sections.affect.selectedOptions.range as string || '');
    content += (window as any).createUISelectHTML('mse-affect-selectedOptions-appropriateness', 'Appropriateness (to thought content):', [{value:'appropriate',text:'Appropriate'}, {value:'inappropriate',text:'Inappropriate'}], mseData.sections.affect.selectedOptions.appropriateness as string || '');
    content += (window as any).createUISelectHTML('mse-affect-selectedOptions-congruence', 'Congruence (to mood):', [{value:'congruent',text:'Congruent'}, {value:'incongruent',text:'Incongruent'}], mseData.sections.affect.selectedOptions.congruence as string || '');
    content += (window as any).createUITextAreaHTML('Additional observations on affect...', `mse-affect-notes`, 2, mseData.sections.affect.notes);
    content += renderAIButton('affect');
    content += renderAIAnalysisBox(mseData.sections.affect.analysis);
    content += `</div>`;

    // Thought Process (Form)
    content += `<div class="mse-section" id="mse-thoughtProcess-section">`;
    content += renderSectionHeader('Thought Process (Form)', 'thoughtProcess');
     content += (window as any).createUISelectHTML('mse-thoughtProcess-selectedOptions-stream', 'Stream/Form:', [
        {value:'logical_coherent',text:'Logical & Coherent'}, {value:'circumstantial',text:'Circumstantial'}, 
        {value:'tangential',text:'Tangential'}, {value:'flight_of_ideas',text:'Flight of ideas'}, 
        {value:'loosening_of_associations',text:'Loosening of associations'}, {value:'word_salad',text:'Word salad'},
        {value:'thought_blocking',text:'Thought blocking'}, {value:'perseveration',text:'Perseveration'},
        {value:'neologisms', text:'Neologisms'}, {value:'clanging', text:'Clanging'}
    ], mseData.sections.thoughtProcess.selectedOptions.stream as string || '', false, "Select primary characteristic of thought form.");
    content += (window as any).createUITextAreaHTML('Provide examples or further details on thought process...', `mse-thoughtProcess-notes`, 3, mseData.sections.thoughtProcess.notes);
    content += renderAIButton('thoughtProcess');
    content += renderAIAnalysisBox(mseData.sections.thoughtProcess.analysis);
    content += `</div>`;

    // Thought Content
    content += `<div class="mse-section" id="mse-thoughtContent-section">`;
    content += renderSectionHeader('Thought Content', 'thoughtContent');
    content += (window as any).createUITextAreaHTML('Describe preoccupations, obsessions, delusions, phobias, magical thinking, poverty of content, etc.', `mse-thoughtContent-notes`, 4, mseData.sections.thoughtContent.notes);
    content += (window as any).createUICheckboxGroupHTML('mse-thoughtContent-checkboxes-si', 'Suicidal Ideation (SI):', [
        {value: 'siPlan', labelText: 'Plan Present'}, {value: 'siIntent', labelText: 'Intent Present'}, {value: 'siMeans', labelText: 'Means Available'}
    ], Object.keys(mseData.sections.thoughtContent.checkboxes).filter(k => k.startsWith('si') && mseData.sections.thoughtContent.checkboxes[k]));
    content += (window as any).createUICheckboxGroupHTML('mse-thoughtContent-checkboxes-hi', 'Homicidal Ideation (HI):', [
        {value: 'hiPlan', labelText: 'Plan Present'}, {value: 'hiIntent', labelText: 'Intent Present'}, {value: 'hiMeans', labelText: 'Means Available'}
    ], Object.keys(mseData.sections.thoughtContent.checkboxes).filter(k => k.startsWith('hi') && mseData.sections.thoughtContent.checkboxes[k]));
    content += renderAIButton('thoughtContent');
    content += renderAIAnalysisBox(mseData.sections.thoughtContent.analysis);
    content += `</div>`;

    // Perception
    content += `<div class="mse-section" id="mse-perception-section">`;
    content += renderSectionHeader('Perception', 'perception');
    content += (window as any).createUITextAreaHTML('Describe hallucinations (auditory, visual, tactile, olfactory, gustatory), illusions, derealization, depersonalization...', `mse-perception-notes`, 3, mseData.sections.perception.notes);
    content += renderAIButton('perception');
    content += renderAIAnalysisBox(mseData.sections.perception.analysis);
    content += `</div>`;

    // Cognition
    content += `<div class="mse-section" id="mse-cognition-section">`;
    content += renderSectionHeader('Cognition', 'cognition');
    content += (window as any).createUICheckboxGroupHTML('mse-cognition-checkboxes-orientation', 'Orientation (A&Ox):', [
        { value: 'orientationTime', labelText: 'Time' }, { value: 'orientationPlace', labelText: 'Place' },
        { value: 'orientationPerson', labelText: 'Person' }, { value: 'orientationSituation', labelText: 'Situation' }
    ], Object.keys(mseData.sections.cognition.checkboxes).filter(k => k.startsWith('orientation') && mseData.sections.cognition.checkboxes[k]));
    content += (window as any).createUITextAreaHTML('Attention/Concentration (e.g., observations, serial 7s)...', `mse-cognition-selectedOptions-attention`, 2, mseData.sections.cognition.selectedOptions.attention as string || '');
    content += (window as any).createUITextAreaHTML('Memory (Immediate, Recent, Remote - e.g., 3-word recall, past events)...', `mse-cognition-selectedOptions-memory`, 2, mseData.sections.cognition.selectedOptions.memory as string || '');
    content += (window as any).createUITextAreaHTML('Abstract Thought (e.g., proverb interpretation, similarities/differences)...', `mse-cognition-selectedOptions-abstraction`, 2, mseData.sections.cognition.selectedOptions.abstraction as string || '');
    content += (window as any).createUITextAreaHTML('General Fund of Knowledge, Intelligence (estimated)...', `mse-cognition-notes`, 2, mseData.sections.cognition.notes);
    content += renderAIButton('cognition');
    content += renderAIAnalysisBox(mseData.sections.cognition.analysis);
    content += `</div>`;

    // Insight
    content += `<div class="mse-section" id="mse-insight-section">`;
    content += renderSectionHeader('Insight', 'insight');
    content += (window as any).createUISelectHTML('mse-insight-selectedOptions-level', 'Level of Insight:', [{value:'good',text:'Good'}, {value:'fair',text:'Fair'}, {value:'poor',text:'Poor'}, {value:'absent',text:'Absent/None'}], mseData.sections.insight.selectedOptions.level as string || '');
    content += (window as any).createUITextAreaHTML('Describe patient\'s understanding of their condition, situation, and need for treatment...', `mse-insight-notes`, 2, mseData.sections.insight.notes);
    content += renderAIButton('insight');
    content += renderAIAnalysisBox(mseData.sections.insight.analysis);
    content += `</div>`;

    // Judgment
    content += `<div class="mse-section" id="mse-judgment-section">`;
    content += renderSectionHeader('Judgment', 'judgment');
    content += (window as any).createUISelectHTML('mse-judgment-selectedOptions-level', 'Level of Judgment:', [{value:'good',text:'Good'}, {value:'fair',text:'Fair'}, {value:'impaired',text:'Impaired'}], mseData.sections.judgment.selectedOptions.level as string || '');
    content += (window as any).createUITextAreaHTML('Describe patient\'s decision-making abilities, problem-solving skills, and actions in hypothetical or real situations...', `mse-judgment-notes`, 2, mseData.sections.judgment.notes);
    content += renderAIButton('judgment');
    content += renderAIAnalysisBox(mseData.sections.judgment.analysis);
    content += `</div>`;

    // Reliability
    content += `<div class="mse-section" id="mse-reliability-section">`;
    content += renderSectionHeader('Reliability', 'reliability');
    content += (window as any).createUISelectHTML('mse-reliability-selectedOptions-level', 'Assessed Reliability:', [{value:'good',text:'Good'}, {value:'fair',text:'Fair'}, {value:'poor',text:'Poor'}], mseData.sections.reliability.selectedOptions.level as string || '');
    content += (window as any).createUITextAreaHTML('Comment on the consistency and accuracy of the information provided by the patient...', `mse-reliability-notes`, 2, mseData.sections.reliability.notes);
    content += renderAIButton('reliability');
    content += renderAIAnalysisBox(mseData.sections.reliability.analysis);
    content += `</div>`;

    // Overall AI Summary & Actions
    content += `<div class="mse-overall-actions psych-actions">`;
    content += `<button data-action="requestOverallAIMSEAnalysis" class="psych-mse-button" ${mseData.isLoadingOverallAI ? 'disabled' : ''}>${mseData.isLoadingOverallAI ? 'GENERATING OVERALL SUMMARY...' : 'Generate Overall AI MSE Summary'}</button>`;
    content += `<button data-action="resetMSEData" class="psych-mse-button">Reset MSE Form</button>`;
    content += `</div>`;

    if (mseData.isLoadingOverallAI) {
        content += `<div class="mse-status-message loading">${(window as any).createPsychTerminalStyledText('AI is generating the overall summary...')}</div>`;
    } else if (mseData.errorOverallAI) {
        content += `<div class="mse-status-message error"><strong>Overall AI Summary Error:</strong> ${(window as any).createPsychTerminalStyledText(mseData.errorOverallAI)}</div>`;
    } else if (mseData.overallAISummary) {
        content += `<div class="mse-overall-summary">
                        <div class="psych-module-subtitle">OVERALL AI MSE SUMMARY:</div>
                        <p>${(window as any).createPsychTerminalStyledText(mseData.overallAISummary)}</p>
                    </div>`;
    }
    
    if (mseData.statusMessage && !mseData.isLoadingOverallAI && !mseData.errorOverallAI && !mseData.overallAISummary) {
         content += `<div class="mse-status-message">${(window as any).createPsychTerminalStyledText(mseData.statusMessage)}</div>`;
    }


    content += `<div class="psych-nav-options"><button data-nav-target="mainMenu">Back to Main Menu</button></div></div>`;
    return content;
}


// --- Event Handlers ---
export function handleMSEInputChange(name: string, value: string): void {
    const [_, sectionKey, fieldKeyWithPrefix, subKey] = name.split('-') as [string, keyof MSESections, string, string | undefined];
    
    if (sectionKey && mseData.sections[sectionKey]) {
        if (fieldKeyWithPrefix === 'notes') {
            mseData.sections[sectionKey].notes = value;
        } else if (fieldKeyWithPrefix === 'selectedOptions' && subKey) {
             mseData.sections[sectionKey].selectedOptions[subKey] = value;
        } else { // Fallback for direct selectedOptions keys like 'mse-cognition-selectedOptions-attention'
            const actualFieldKey = fieldKeyWithPrefix.startsWith('selectedOptions-') ? fieldKeyWithPrefix.substring('selectedOptions-'.length) : fieldKeyWithPrefix;
             if (mseData.sections[sectionKey].selectedOptions.hasOwnProperty(actualFieldKey) || name.includes('-selectedOptions-')) { // also check if it's a dynamic key like attention
                 mseData.sections[sectionKey].selectedOptions[actualFieldKey] = value;
             }
        }
    }
}

export function handleMSEMultiSelectChange(name: string, selectedValues: string[]): void {
    const [_, sectionKey, fieldKey, subKey] = name.split('-') as [string, keyof MSESections, string, string | undefined];
     if (sectionKey && mseData.sections[sectionKey] && mseData.sections[sectionKey].selectedOptions.hasOwnProperty(subKey || fieldKey)) { // Adjust logic for subKey presence
        mseData.sections[sectionKey].selectedOptions[subKey || fieldKey] = selectedValues;
        (window as any).renderPsychometricTerminal();
    }
}

export function handleMSECheckboxChange(name: string, dataValue: string, checked: boolean): void {
    // name is like mse-thoughtContent-checkboxes-siPlan. dataValue is siPlan.
    const [_, sectionKey, groupKey, _valuePartIfPresent] = name.split('-') as [string, keyof MSESections, string, string | undefined];
    
    if (sectionKey && mseData.sections[sectionKey] && mseData.sections[sectionKey].checkboxes.hasOwnProperty(dataValue)) {
        mseData.sections[sectionKey].checkboxes[dataValue] = checked;
        (window as any).renderPsychometricTerminal();
    }
}


// --- AI Interaction ---
async function analyzeMSEData(prompt: string, sectionToUpdate?: MSESectionAnalysis, isOverall: boolean = false): Promise<void> {
    const currentAiInstance = (window as any).ai as GoogleGenAI | undefined;
    if (!currentAiInstance) {
        const errorMsg = "AI Service not available. Cannot perform analysis.";
        if (sectionToUpdate) {
            sectionToUpdate.error = errorMsg;
            sectionToUpdate.isLoading = false;
        } else if (isOverall) {
            mseData.errorOverallAI = errorMsg;
            mseData.isLoadingOverallAI = false;
        }
        (window as any).renderPsychometricTerminal();
        return;
    }

    if (sectionToUpdate) sectionToUpdate.isLoading = true;
    if (isOverall) mseData.isLoadingOverallAI = true;
    (window as any).renderPsychometricTerminal();

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

        if (isOverall) {
            if (parsedData.narrativeSummary && Array.isArray(parsedData.significantFindings) && Array.isArray(parsedData.furtherInquirySuggestions)) {
                mseData.overallAISummary = `${parsedData.narrativeSummary}\n\n**Significant Findings:**\n- ${parsedData.significantFindings.join('\n- ')}\n\n**Further Inquiry Suggestions:**\n- ${parsedData.furtherInquirySuggestions.join('\n- ')}`;
                mseData.errorOverallAI = null;
            } else {
                throw new Error("Overall AI response JSON structure is invalid.");
            }
        } else if (sectionToUpdate) {
            if (parsedData.summary && Array.isArray(parsedData.keywords) && Array.isArray(parsedData.redFlags)) {
                sectionToUpdate.summary = parsedData.summary;
                sectionToUpdate.keywords = parsedData.keywords;
                sectionToUpdate.redFlags = parsedData.redFlags;
                sectionToUpdate.error = null;
            } else {
                throw new Error("Section AI response JSON structure is invalid.");
            }
        }
    } catch (e: any) {
        console.error("Error processing AI analysis:", e);
        const errorMsg = e.message || "Failed to parse or receive valid analysis.";
        if (isOverall) {
            mseData.errorOverallAI = errorMsg;
            mseData.overallAISummary = '';
        } else if (sectionToUpdate) {
            sectionToUpdate.error = errorMsg;
            sectionToUpdate.summary = '';
            sectionToUpdate.keywords = [];
            sectionToUpdate.redFlags = [];
        }
    } finally {
        if (sectionToUpdate) sectionToUpdate.isLoading = false;
        if (isOverall) mseData.isLoadingOverallAI = false;
        (window as any).renderPsychometricTerminal();
    }
}

export async function requestAISectionAnalysis(sectionKey: keyof MSESections): Promise<void> {
    const section = mseData.sections[sectionKey];
    if (!section) return;

    section.analysis.error = null; 

    let sectionInputText = `Clinician Notes: ${section.notes || "Not specified."}\n`;
    if (Object.keys(section.selectedOptions).length > 0) {
        sectionInputText += "Selected Options:\n";
        for (const optKey in section.selectedOptions) {
            const val = section.selectedOptions[optKey];
            sectionInputText += `  - ${optKey}: ${Array.isArray(val) ? val.join(', ') : val}\n`;
        }
    }
     if (Object.values(section.checkboxes).some(v => v === true)) { 
        sectionInputText += "Checked Items:\n";
        for (const chkKey in section.checkboxes) {
            if (section.checkboxes[chkKey]) {
                 sectionInputText += `  - ${chkKey}: Yes\n`;
            }
        }
    }


    const prompt = `You are assisting a clinician by analyzing a specific section of a Mental State Examination (MSE).
Section: ${sectionKey.toUpperCase()}
User Input for this section:
${sectionInputText}

Based *only* on the provided input for this section:
1. Provide a brief summary (1-2 sentences).
2. Identify key psychiatric terms or phenomena observed (as a list of strings).
3. List any potential red flags or critical observations that warrant immediate attention (as a list of strings).

Return your response strictly as a JSON object with keys: "summary" (string), "keywords" (array of strings), "redFlags" (array of strings).
If no specific keywords or red flags are apparent from the input for this section, return empty arrays for those keys.
If the input is minimal or non-specific, state that in the summary. Do not invent information.
Example for "keywords": ["Pressured speech", "Hostile attitude"]
Example for "redFlags": ["Active suicidal ideation with plan", "Command hallucinations to harm others"]
`;
    await analyzeMSEData(prompt, section.analysis);
}

export async function requestOverallAIMSEAnalysis(): Promise<void> {
    mseData.errorOverallAI = null; 
    let fullMSEData = "Patient's Mental State Examination - Clinician Observations:\n\n";

    for (const key in mseData.sections) {
        const sectionKey = key as keyof MSESections;
        const section = mseData.sections[sectionKey];
        fullMSEData += `## ${sectionKey.toUpperCase()}:\n`;
        fullMSEData += `Notes: ${section.notes || "Not specified."}\n`;
        if (Object.keys(section.selectedOptions).length > 0) {
            fullMSEData += "Selected Options:\n";
            for (const optKey in section.selectedOptions) {
                 const val = section.selectedOptions[optKey];
                 fullMSEData += `  - ${optKey}: ${Array.isArray(val) ? val.join(', ') : val}\n`;
            }
        }
        if (Object.values(section.checkboxes).some(v => v === true)) {
            fullMSEData += "Checked Items:\n";
            for (const chkKey in section.checkboxes) {
                 if (section.checkboxes[chkKey]) {
                    fullMSEData += `  - ${chkKey}: Yes\n`;
                 }
            }
        }
        if (section.analysis.summary) {
            fullMSEData += `AI Section Summary: ${section.analysis.summary}\n`;
            if (section.analysis.keywords.length > 0) fullMSEData += `AI Keywords: ${section.analysis.keywords.join(', ')}\n`;
            if (section.analysis.redFlags.length > 0) fullMSEData += `AI Red Flags: ${section.analysis.redFlags.join(', ')}\n`;
        }
        fullMSEData += "\n";
    }

    const prompt = `You are an expert psychiatric AI assisting a clinician in summarizing a full Mental State Examination (MSE).
The following data was collected by the clinician:
${fullMSEData}

Based on ALL the provided MSE data:
1.  Provide a concise narrative summary (3-5 sentences) of the patient's overall mental state.
2.  Highlight the most significant positive (normal) and negative (abnormal/concerning) findings across all domains (as a list of strings).
3.  Suggest 1-2 areas for further clinical inquiry or specific follow-up questions that arise directly from these MSE findings. Do not suggest general assessments not directly implied by the MSE.

Return your response strictly as a JSON object with keys: "narrativeSummary" (string), "significantFindings" (array of strings), "furtherInquirySuggestions" (array of strings).
Ensure the summary is objective and based only on the provided MSE data.
`;
    await analyzeMSEData(prompt, undefined, true);
}

export function resetMSEData(): void {
    initializeMSEData(); // This will use the default (empty) state
    (window as any).renderPsychometricTerminal();
}