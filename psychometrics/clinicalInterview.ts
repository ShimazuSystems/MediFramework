/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Assume these are globally available from index.tsx or will be passed/imported
declare function createUITextAreaHTML(placeholder: string, name: string, rows: number, value: string, readonly?: boolean): string;
declare function createPsychTerminalStyledText(text: string): string;
declare function renderPsychometricTerminal(): void;

interface ConversationEntry {
    speaker: 'Interviewer' | 'Patient' | 'System';
    text: string;
    analysis?: string; // For patient responses
}

const initialPrompts: ReadonlyArray<string> = [
    "Hello. To begin, can you tell me what brings you in or what's been on your mind lately?",
    "Could you elaborate on that a little more? How have these feelings or experiences been affecting you?",
    "Have you noticed any significant changes in your daily routines, like sleep, appetite, or energy levels?",
    "How has your mood been impacting your work, studies, or relationships with others?",
    "Are there any particular stressors or concerns in your life right now that you'd like to discuss?",
    "In the past few weeks, have you had any thoughts about harming yourself or others?",
    "Thank you for sharing this with me. We're nearing the end of our scheduled time. Is there anything else you feel is important to mention or anything you'd like to ask before we conclude?"
];

export let clinicalInterviewData: {
    prompts: string[];
    currentPromptIndex: number;
    conversationLog: ConversationEntry[];
    currentPatientResponse: string;
    isInterviewActive: boolean;
    statusMessage: string;
} = {
    prompts: [...initialPrompts],
    currentPromptIndex: 0,
    conversationLog: [],
    currentPatientResponse: "",
    isInterviewActive: false,
    statusMessage: "Interview not started. Click 'Start Interview' or select from main menu.",
};

export function initializeClinicalInterviewData(savedData?: typeof clinicalInterviewData): void {
    if (savedData) {
        // Deep copy complex parts like conversationLog
        clinicalInterviewData.prompts = savedData.prompts ? JSON.parse(JSON.stringify(savedData.prompts)) : [...initialPrompts];
        clinicalInterviewData.currentPromptIndex = savedData.currentPromptIndex || 0;
        clinicalInterviewData.conversationLog = savedData.conversationLog ? JSON.parse(JSON.stringify(savedData.conversationLog)) : [];
        clinicalInterviewData.currentPatientResponse = savedData.currentPatientResponse || "";
        clinicalInterviewData.isInterviewActive = savedData.isInterviewActive || false;
        clinicalInterviewData.statusMessage = savedData.statusMessage || "Interview state loaded.";
    } else {
        clinicalInterviewData.prompts = [...initialPrompts];
        clinicalInterviewData.currentPromptIndex = 0;
        clinicalInterviewData.conversationLog = [];
        clinicalInterviewData.currentPatientResponse = "";
        clinicalInterviewData.isInterviewActive = false;
        clinicalInterviewData.statusMessage = "Interview not started. Click 'Start Interview' or select from main menu.";
    }
}


function getPlaceholderAnalysis(responseText: string): string {
    const keywords = ["feeling", "stress", "sleep", "work", "anxious", "down", "sad", "relationship", "change"];
    let foundKeywords = keywords.filter(kw => responseText.toLowerCase().includes(kw));
    if (foundKeywords.length === 0 && responseText.length > 10) foundKeywords.push("general concerns");
    
    let sentiment = "Neutral";
    if (responseText.toLowerCase().includes("sad") || responseText.toLowerCase().includes("down") || responseText.toLowerCase().includes("anxious")) {
        sentiment = "Negative";
    } else if (responseText.toLowerCase().includes("good") || responseText.toLowerCase().includes("happy") || responseText.toLowerCase().includes("better")) {
        sentiment = "Positive";
    }
    
    return `Keywords: [${foundKeywords.join(', ')}]. Sentiment: [${sentiment}]. Further assessment may be needed.`;
}

export function startClinicalInterview(): void {
    // Only truly reset if it's a deliberate start, not just loading an active interview state
    if (!clinicalInterviewData.isInterviewActive || clinicalInterviewData.conversationLog.length === 0) {
        clinicalInterviewData.currentPromptIndex = 0;
        clinicalInterviewData.conversationLog = [];
        clinicalInterviewData.currentPatientResponse = "";
    }
    clinicalInterviewData.isInterviewActive = true;
    clinicalInterviewData.statusMessage = "Interview in progress...";
    
    if (clinicalInterviewData.prompts.length > 0 && clinicalInterviewData.conversationLog.length === 0) { // Only add first prompt if log is empty
        clinicalInterviewData.conversationLog.push({
            speaker: 'Interviewer',
            text: clinicalInterviewData.prompts[0]
        });
    } else if (clinicalInterviewData.prompts.length === 0) {
        clinicalInterviewData.statusMessage = "No prompts available for the interview.";
        clinicalInterviewData.isInterviewActive = false;
    }
    renderPsychometricTerminal();
}


export function renderClinicalInterviewScreen(): string {
    // If not active and log is empty, it means it's a fresh entry to this module.
    // This could be from main menu OR if data was cleared for a new encounter.
    if (!clinicalInterviewData.isInterviewActive && clinicalInterviewData.conversationLog.length === 0 && clinicalInterviewData.prompts.length > 0) {
        startClinicalInterview(); 
    }

    let content = `<div class='psych-module-content'><div class='psych-module-title'>CLINICAL INTERVIEW MODULE (SIMULATED)</div>`;

    // Conversation Log
    content += `<div class="psych-module-subtitle">CONVERSATION LOG:</div>`;
    content += `<div id="clinical-interview-log" class="ui-scrollable-text-area" style="height: 200px; background-color: #05080a; border:1px solid var(--psych-border); padding: 5px; margin-bottom:10px;">`;
    clinicalInterviewData.conversationLog.forEach(entry => {
        content += `<div class="log-entry log-entry-${entry.speaker.toLowerCase()}">`;
        content += `<strong>${entry.speaker}:</strong> ${createPsychTerminalStyledText(entry.text)}`;
        if (entry.speaker === 'Patient' && entry.analysis) {
            content += `<div class="log-entry-analysis"><em>System Analysis: ${createPsychTerminalStyledText(entry.analysis)}</em></div>`;
        }
        content += `</div>`;
    });
    content += `</div>`;

    if (clinicalInterviewData.isInterviewActive && clinicalInterviewData.currentPromptIndex < clinicalInterviewData.prompts.length) {
        content += `<div class="psych-module-subtitle">CURRENT INTERVIEWER PROMPT:</div>`;
        content += `<pre class="terminal-preformatted-text" style="margin-bottom:10px;">${createPsychTerminalStyledText(clinicalInterviewData.prompts[clinicalInterviewData.currentPromptIndex])}</pre>`;
        
        content += `<div class="psych-module-subtitle">PATIENT RESPONSE:</div>`;
        content += createUITextAreaHTML("Enter your response here...", "clinical_interview_response", 5, clinicalInterviewData.currentPatientResponse);
        
        content += `<div class="psych-actions" style="margin-top:10px;">
                        <button data-action="submitClinicalResponse" class="psych-interview-button">Submit Response & Next</button>
                        <button data-action="endClinicalInterview" class="psych-interview-button">End Interview</button>
                    </div>`;
    } else {
         if (!clinicalInterviewData.isInterviewActive && clinicalInterviewData.conversationLog.length > 0) {
             clinicalInterviewData.statusMessage = "Interview Ended. Review log above.";
         } else if (clinicalInterviewData.prompts.length === 0) {
             clinicalInterviewData.statusMessage = "No prompts configured for interview.";
         } else if (clinicalInterviewData.isInterviewActive && clinicalInterviewData.currentPromptIndex >= clinicalInterviewData.prompts.length) {
            // This state means all prompts were answered.
            clinicalInterviewData.isInterviewActive = false; // Explicitly set to false
            clinicalInterviewData.statusMessage = "Interview Concluded. All prompts answered.";
            if (clinicalInterviewData.conversationLog[clinicalInterviewData.conversationLog.length - 1]?.speaker !== 'System') {
                 clinicalInterviewData.conversationLog.push({
                    speaker: 'System',
                    text: "End of interview."
                });
            }
         }
    }
    
    content += `<div class="psych-module-subtitle" style="margin-top:10px;">STATUS: <span class="term-highlight">${clinicalInterviewData.statusMessage}</span></div>`;

    content += `<div class="psych-nav-options"><button data-nav-target="mainMenu">Back to Main Menu</button></div></div>`;
    return content;
}

export function handleClinicalInterviewInputChange(textArea: HTMLTextAreaElement): void {
    clinicalInterviewData.currentPatientResponse = textArea.value;
}

export function handleClinicalInterviewResponseSubmit(): void {
    if (!clinicalInterviewData.isInterviewActive) return;

    const patientResponseText = clinicalInterviewData.currentPatientResponse.trim();
    if (patientResponseText === "") {
        clinicalInterviewData.statusMessage = "Please enter a response before submitting.";
        renderPsychometricTerminal();
        return;
    }

    clinicalInterviewData.conversationLog.push({
        speaker: 'Patient',
        text: patientResponseText,
        analysis: getPlaceholderAnalysis(patientResponseText)
    });

    clinicalInterviewData.currentPatientResponse = "";
    clinicalInterviewData.currentPromptIndex++;

    if (clinicalInterviewData.currentPromptIndex < clinicalInterviewData.prompts.length) {
        clinicalInterviewData.conversationLog.push({
            speaker: 'Interviewer',
            text: clinicalInterviewData.prompts[clinicalInterviewData.currentPromptIndex]
        });
        clinicalInterviewData.statusMessage = "Response logged. Next prompt issued.";
    } else {
        clinicalInterviewData.isInterviewActive = false;
        clinicalInterviewData.statusMessage = "Interview Concluded. All prompts answered.";
         clinicalInterviewData.conversationLog.push({
            speaker: 'System',
            text: "End of interview."
        });
    }
    renderPsychometricTerminal();
}

export function handleEndClinicalInterview(): void {
    clinicalInterviewData.isInterviewActive = false;
    if (clinicalInterviewData.conversationLog.length > 0 && clinicalInterviewData.conversationLog[clinicalInterviewData.conversationLog.length -1].speaker !== 'System') {
         clinicalInterviewData.conversationLog.push({
            speaker: 'System',
            text: "Interview manually ended by user."
        });
    }
    clinicalInterviewData.statusMessage = "Interview Ended by user. Review log above.";
    renderPsychometricTerminal();
}
