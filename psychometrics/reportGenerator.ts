/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
// Import data from other modules to check for completion and gather data
import { phq9Data, initializePHQ9Data } from './phq9.js';
import { gad7Data as importedGad7Data, initializeGAD7Data } from './gad7.js'; // Renamed to avoid conflict
import { pcl5Data as importedPCL5Data, initializePCL5Data } from './pcl5.js'; // Renamed
import { mseData, initializeMSEData as initMSE } from './mse.js';
// import { cognitiveTestData, cognitiveDomainsConfig, initializeCognitiveTestData as initCognitive } from './cognitive.js'; // Removed
import { personalityMatrixData, initializePersonalityMatrixData as initPM } from './personalityMatrix.js';
import { clinicalInterviewData, initializeClinicalInterviewData as initCI } from './clinicalInterview.js';
import { nnpaData, initializeNNPAData as initNNPA } from './nnpa.js';


// --- Type Definitions ---
interface AvailableAssessment {
    id: string; // e.g., 'phq9', 'mse'
    name: string; // User-friendly name
    isCompleted: boolean;
    summary: string; // Brief summary of completion status or key score
    getDataForReport: () => Record<string, any> | null;
}

export let reportGeneratorData: {
    availableAssessments: AvailableAssessment[];
    selectedAssessmentIds: string[];
    selectedReportType: 'comprehensive' | 'riskFocus' | 'diagnosticSupport';
    generatedReport: string | null;
    isLoading: boolean;
    statusMessage: string;
    error: string | null;
} = {
    availableAssessments: [],
    selectedAssessmentIds: [],
    selectedReportType: 'comprehensive',
    generatedReport: null,
    isLoading: false,
    statusMessage: 'Select assessments and report type, then click "Generate Report".',
    error: null,
};

export function initializeReportGeneratorData(savedData?: Partial<typeof reportGeneratorData>): void {
    reportGeneratorData.availableAssessments = []; // This will be repopulated by discoverAvailableAssessments
    reportGeneratorData.selectedAssessmentIds = savedData?.selectedAssessmentIds ? [...savedData.selectedAssessmentIds] : [];
    reportGeneratorData.selectedReportType = savedData?.selectedReportType || 'comprehensive';
    reportGeneratorData.generatedReport = savedData?.generatedReport || null;
    reportGeneratorData.isLoading = false; // Always reset loading state
    reportGeneratorData.statusMessage = savedData?.statusMessage || 'Report Generator initialized. Select assessments and report type.';
    reportGeneratorData.error = savedData?.error || null;
    discoverAvailableAssessments(); // Populate assessments list based on current state of other modules
}


// --- Helper Functions ---
function isPHQ9Completed(): boolean {
    return phq9Data.questions.every(q => q.selectedValue !== null);
}
function getPHQ9DataForReport() {
    if (!isPHQ9Completed()) return null;
    return {
        totalScore: phq9Data.totalScore,
        questions: phq9Data.questions.map(q => ({ text: q.text, answerValue: q.selectedValue, answerLabel: q.options.find(opt => opt.value === q.selectedValue)?.label})),
    };
}

function isGAD7Completed(): boolean {
    return importedGad7Data.questions.every(q => q.selectedValue !== null);
}
function getGAD7DataForReport() {
    if (!isGAD7Completed()) return null;
    return {
        totalScore: importedGad7Data.totalScore,
        questions: importedGad7Data.questions.map(q => ({ text: q.text, answerValue: q.selectedValue, answerLabel: q.options.find(opt => opt.value === q.selectedValue)?.label })),
    };
}

function isPCL5Completed(): boolean {
    return importedPCL5Data.questions.every(q => q.selectedValue !== null);
}
function getPCL5DataForReport() {
    if (!isPCL5Completed()) return null;
    return {
        totalScore: importedPCL5Data.totalScore,
        provisionalDiagnosisMet: importedPCL5Data.provisionalDiagnosisMet,
        severityInterpretation: importedPCL5Data.severityInterpretation,
        dsm5Criteria: importedPCL5Data.dsm5Criteria,
        questions: importedPCL5Data.questions.map(q => ({text: q.text, criterion: q.criterion, answerValue: q.selectedValue}))
    };
}

function isMSECompleted(): boolean {
    const sectionsWithNotes = Object.values(mseData.sections).filter(s => s.notes.trim() !== '' || Object.keys(s.selectedOptions).length > 0 || Object.values(s.checkboxes).some(c => c)).length;
    return sectionsWithNotes > 2 || !!mseData.overallAISummary;
}
function getMSEDataForReport() {
    if (!isMSECompleted()) return null;
    const reportableMSEData: Record<string, any> = { overallAISummary: mseData.overallAISummary };
    Object.entries(mseData.sections).forEach(([key, section]) => {
        if (section.notes.trim() || Object.keys(section.selectedOptions).length > 0 || Object.values(section.checkboxes).some(c => c)) {
            reportableMSEData[key] = {
                notes: section.notes,
                selectedOptions: section.selectedOptions,
                checkboxes: section.checkboxes,
                aiAnalysis: section.analysis.summary ? { summary: section.analysis.summary, keywords: section.analysis.keywords, redFlags: section.analysis.redFlags } : null
            };
        }
    });
    return reportableMSEData;
}

// Removed Cognitive Assessment data functions
// function isCognitiveAssessmentCompleted(): boolean {
//     return Object.values(cognitiveTestData.domainResults).some(r => r.status === 'aiComplete');
// }
// function getCognitiveDataForReport() {
//     if (!isCognitiveAssessmentCompleted()) return null;
//     const reportableCognitiveData: Record<string, any> = { overallAIProfile: cognitiveTestData.overallAIProfile };
//     cognitiveDomainsConfig.forEach(domain => {
//         const result = cognitiveTestData.domainResults[domain.id];
//         if (result.status === 'aiComplete' && result.aiInterpretation) {
//             reportableCognitiveData[domain.id] = {
//                 name: domain.name,
//                 testName: domain.testName,
//                 rawResults: result.rawResults,
//                 aiInterpretation: result.aiInterpretation
//             };
//         }
//     });
//     return reportableCognitiveData;
// }

function isPersonalityMatrixCompleted(): boolean {
    return !!personalityMatrixData.overallAISummary;
}
function getPersonalityMatrixDataForReport() {
    if (!isPersonalityMatrixCompleted()) return null;
    return {
        overallAISummary: personalityMatrixData.overallAISummary,
        traitInterpretations: personalityMatrixData.aiInterpretations,
        userRatings: personalityMatrixData.userRatings,
        userDescriptions: personalityMatrixData.userDescriptions,
    };
}

function isClinicalInterviewCompleted(): boolean {
    return !clinicalInterviewData.isInterviewActive && clinicalInterviewData.conversationLog.length > 0;
}
function getClinicalInterviewDataForReport() {
    if (!isClinicalInterviewCompleted()) return null;
    return {
        conversationLog: clinicalInterviewData.conversationLog.map(entry => ({
            speaker: entry.speaker,
            text: entry.text,
            analysis: entry.analysis || null
        })),
        finalStatus: clinicalInterviewData.statusMessage
    };
}
function isNNPACompleted(): boolean {
    return !!nnpaData.overallAIAnalysis.summary;
}
function getNNPADataForReport() {
    if(!isNNPACompleted()) return null;
    return {
        overallRiskLevel: nnpaData.overallAIAnalysis.riskLevel,
        overallSummary: nnpaData.overallAIAnalysis.summary,
        domains: nnpaData.domains.map(d => ({
            name: d.name,
            aiSummary: d.domainAISummary,
            subScales: d.subScales.map(ss => ({ name: ss.name, notes: ss.clinicianNotes }))
        }))
    };
}


export function discoverAvailableAssessments(): void {
    reportGeneratorData.availableAssessments = [
        { id: 'phq9', name: 'PHQ-9 Depression Screener', isCompleted: isPHQ9Completed(), summary: isPHQ9Completed() ? `Score: ${phq9Data.totalScore}` : 'Not Completed', getDataForReport: getPHQ9DataForReport },
        { id: 'gad7', name: 'GAD-7 Anxiety Screener', isCompleted: isGAD7Completed(), summary: isGAD7Completed() ? `Score: ${importedGad7Data.totalScore}` : 'Not Completed', getDataForReport: getGAD7DataForReport },
        { id: 'pcl5', name: 'PCL-5 PTSD Checklist', isCompleted: isPCL5Completed(), summary: isPCL5Completed() ? `Score: ${importedPCL5Data.totalScore}, PTSD: ${importedPCL5Data.provisionalDiagnosisMet ? 'Likely' : 'Unlikely'}` : 'Not Completed', getDataForReport: getPCL5DataForReport },
        { id: 'mse', name: 'Mental State Examination (MSE)', isCompleted: isMSECompleted(), summary: isMSECompleted() ? (mseData.overallAISummary ? 'Overall AI Summary Available' : 'Partially Completed') : 'Not Started', getDataForReport: getMSEDataForReport },
        // { id: 'cognitive', name: 'Cognitive Assessment Protocol', isCompleted: isCognitiveAssessmentCompleted(), summary: isCognitiveAssessmentCompleted() ? (cognitiveTestData.overallAIProfile ? 'Overall Profile Available' : 'Domains Assessed') : 'Not Started', getDataForReport: getCognitiveDataForReport }, // Removed
        { id: 'personality', name: 'Personality Assessment Matrix', isCompleted: isPersonalityMatrixCompleted(), summary: isPersonalityMatrixCompleted() ? 'AI Summary Available' : 'Not Completed', getDataForReport: getPersonalityMatrixDataForReport },
        { id: 'interview', name: 'Simulated Clinical Interview', isCompleted: isClinicalInterviewCompleted(), summary: isClinicalInterviewCompleted() ? 'Interview Log Available' : 'Not Conducted', getDataForReport: getClinicalInterviewDataForReport },
        { id: 'nnpa', name: 'NNPA Psychosis Assessment', isCompleted: isNNPACompleted(), summary: isNNPACompleted() ? `Risk: ${nnpaData.overallAIAnalysis.riskLevel}` : 'Not Completed', getDataForReport: getNNPADataForReport },
    ];
    // Ensure selectedAssessmentIds only contains currently available and completed assessments
    reportGeneratorData.selectedAssessmentIds = reportGeneratorData.selectedAssessmentIds.filter(id =>
        reportGeneratorData.availableAssessments.find(asm => asm.id === id)?.isCompleted
    );
}


// --- Rendering Functions ---
export function renderReportGeneratorScreen(): string {
    discoverAvailableAssessments(); 

    let content = `<div class='psych-module-content report-generator-container'>
                        <div class='psych-module-title'>PSYCHOMETRIC REPORT GENERATOR (AI)</div>`;
    
    content += `<p class="psych-assessment-instruction">${(window as any).createPsychTerminalStyledText(reportGeneratorData.statusMessage)}</p>`;

    content += `<div class="report-section">
                    <div class="psych-module-subtitle">1. SELECT ASSESSMENTS TO INCLUDE:</div>
                    <div class="assessment-selection-list">`;
    reportGeneratorData.availableAssessments.forEach(asm => {
        content += (window as any).createUICheckboxHTML(
            `${asm.name} (${asm.isCompleted ? asm.summary : 'Not Completed'})`,
            `rg-asm-${asm.id}`,
            asm.id,
            reportGeneratorData.selectedAssessmentIds.includes(asm.id) && asm.isCompleted
        );
        if (!asm.isCompleted) {
            content = content.replace(`<input type="checkbox" name="rg-asm-${asm.id}"`, `<input type="checkbox" name="rg-asm-${asm.id}" disabled`);
        }
    });
    content += `</div></div>`;

    const reportTypes = [
        { value: 'comprehensive', text: 'Comprehensive Summary' },
        { value: 'riskFocus', text: 'Risk-Focused Summary' },
        { value: 'diagnosticSupport', text: 'Diagnostic Support Summary' },
    ];
    content += `<div class="report-section">
                    <div class="psych-module-subtitle">2. SELECT REPORT TYPE:</div>
                    ${(window as any).createUISelectHTML('rg-report-type', 'Report Type:', reportTypes, reportGeneratorData.selectedReportType, false)}
                </div>`;
    
    content += `<div class="psych-actions">
                    <button data-action="generateAIReport" 
                            ${reportGeneratorData.isLoading || reportGeneratorData.selectedAssessmentIds.length === 0 ? 'disabled' : ''}>
                        ${reportGeneratorData.isLoading ? 'GENERATING REPORT...' : 'Generate AI Report'}
                    </button>
                </div>`;

    if (reportGeneratorData.error && !reportGeneratorData.isLoading) {
        content += `<div class="report-status-error">Error: ${(window as any).createPsychTerminalStyledText(reportGeneratorData.error)}</div>`;
    }

    if (reportGeneratorData.generatedReport && !reportGeneratorData.isLoading) {
        content += `<div class="report-section">
                        <div class="psych-module-subtitle">GENERATED REPORT:</div>
                        <pre class="terminal-preformatted-text report-display-area">${(window as any).createPsychTerminalStyledText(reportGeneratorData.generatedReport)}</pre>
                    </div>`;
    }

    content += `<div class="psych-nav-options"><button data-nav-target="mainMenu">Back to Main Menu</button></div></div>`;
    return content;
}

// --- Event Handlers ---
export function handleReportGeneratorCheckboxChange(name: string, dataValue: string, checked: boolean): void {
    const assessmentId = dataValue;
    if (checked) {
        if (!reportGeneratorData.selectedAssessmentIds.includes(assessmentId)) {
            reportGeneratorData.selectedAssessmentIds.push(assessmentId);
        }
    } else {
        reportGeneratorData.selectedAssessmentIds = reportGeneratorData.selectedAssessmentIds.filter(id => id !== assessmentId);
    }
    reportGeneratorData.generatedReport = null; 
    reportGeneratorData.error = null;
    reportGeneratorData.statusMessage = 'Selections updated. Ready to generate report.';
    (window as any).renderPsychometricTerminal();
}

export function handleReportGeneratorOptionChange(optionType: 'reportType' | 'outputFormat', value: string): void {
    if (optionType === 'reportType') {
        reportGeneratorData.selectedReportType = value as 'comprehensive' | 'riskFocus' | 'diagnosticSupport';
    }
    reportGeneratorData.generatedReport = null;
    reportGeneratorData.error = null;
    reportGeneratorData.statusMessage = 'Report options updated. Ready to generate report.';
    (window as any).renderPsychometricTerminal();
}

// --- AI Interaction ---
export async function requestAIReport(): Promise<void> {
    if (reportGeneratorData.selectedAssessmentIds.length === 0) {
        reportGeneratorData.statusMessage = "Please select at least one completed assessment to include in the report.";
        reportGeneratorData.error = null;
        (window as any).renderPsychometricTerminal();
        return;
    }

    reportGeneratorData.isLoading = true;
    reportGeneratorData.generatedReport = null;
    reportGeneratorData.error = null;
    reportGeneratorData.statusMessage = "Gathering data and preparing AI prompt...";
    (window as any).renderPsychometricTerminal();

    let reportContentPrompt = "You are an expert clinical AI assisting with psychometric report generation. Based on the following summarized assessment data, generate a report.\n\n";
    reportContentPrompt += `Target Report Type: ${reportGeneratorData.selectedReportType}\n\n`;

    let dataIncluded = false;
    for (const id of reportGeneratorData.selectedAssessmentIds) {
        const assessment = reportGeneratorData.availableAssessments.find(asm => asm.id === id);
        if (assessment?.isCompleted) {
            const data = assessment.getDataForReport();
            if (data) {
                reportContentPrompt += `--- ${assessment.name} ---\n`;
                reportContentPrompt += `${JSON.stringify(data, null, 2)}\n\n`;
                dataIncluded = true;
            }
        }
    }

    if (!dataIncluded) {
        reportGeneratorData.isLoading = false;
        reportGeneratorData.error = "No data could be gathered for the selected assessments.";
        reportGeneratorData.statusMessage = "Report generation failed.";
        (window as any).renderPsychometricTerminal();
        return;
    }

    reportContentPrompt += `Instructions for Report Generation based on Report Type:\n`;
    if (reportGeneratorData.selectedReportType === 'comprehensive') {
        reportContentPrompt += `- Provide a comprehensive summary covering key findings from each included assessment.
- Discuss potential patterns, consistencies, or discrepancies across assessments.
- Conclude with overall impressions and potential areas for further clinical attention based SOLELY on the provided data.
- Structure with clear headings for each assessment and an overall summary.
- Maintain a neutral, objective, and clinical tone.
`;
    } else if (reportGeneratorData.selectedReportType === 'riskFocus') {
        reportContentPrompt += `- Focus specifically on identifying and summarizing any indicators of risk (e.g., for depression, anxiety, self-harm, trauma-related distress, severe personality features) present in the provided data.
- Clearly state the level of risk if indicated by the assessments.
- If specific risk factors are mentioned (e.g., PHQ-9 item 9), highlight them.
- Be concise and direct.
`;
    } else if (reportGeneratorData.selectedReportType === 'diagnosticSupport') {
        reportContentPrompt += `- Synthesize the findings to highlight symptoms and patterns that may support or rule out relevant psychiatric diagnoses.
- Correlate findings with DSM-5 criteria where applicable (e.g., PCL-5 criteria for PTSD, PHQ-9 for MDD).
- Do NOT provide a definitive diagnosis. Instead, summarize evidence for and against potential diagnostic considerations based on the data.
- Note any limitations of the provided data for diagnostic purposes.
`;
    }
    reportContentPrompt += `\nIMPORTANT: Generate the report as a single block of text. Use markdown for headings (e.g., ## Overall Summary, ### PHQ-9 Findings) and bullet points where appropriate for readability. Do not use JSON output.`;
    
    reportGeneratorData.statusMessage = "Sending request to AI... This may take a moment.";
    (window as any).renderPsychometricTerminal();

    try {
        const currentAiInstance = (window as any).ai as GoogleGenAI | undefined;
        if (!currentAiInstance) {
            throw new Error("AI Service not available.");
        }
        const response: GenerateContentResponse = await currentAiInstance.models.generateContent({
            model: "gemini-2.5-flash-preview-04-17",
            contents: reportContentPrompt,
        });
        reportGeneratorData.generatedReport = response.text;
        reportGeneratorData.statusMessage = "AI Report Generated Successfully.";
    } catch (e: any) {
        console.error("Error generating AI report:", e);
        reportGeneratorData.error = e.message || "An unknown error occurred during AI report generation.";
        reportGeneratorData.statusMessage = "Report generation failed.";
    } finally {
        reportGeneratorData.isLoading = false;
        (window as any).renderPsychometricTerminal();
    }
}