/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Part } from '@google/genai';
import * as appState from '../../state/appState';
import * as nexusState from '../../state/nexusState';
import * as domElements from '../../dom/domElements';
import * as uiManager from '../../dom/uiManager';
import * as aiService from '../../services/aiService';
import * as speechService from '../../services/speechService';
import { generateId, fileToGenerativePart, playButtonSound } from '../../utils/helpers';
import { NotesData, PatientCoreData } from '../../state/appState';

// This function will be called by appCore.ts's renderAll or similar
declare function renderAllForNexusController(): void;


function formatPatientCoreDataForAI(data?: PatientCoreData): string {
    if (!data) return "";
    let formattedString = "Patient Background Information:\n";
    if (data.firstName || data.lastName) formattedString += `- Name: ${data.firstName || ''} ${data.middleName || ''} ${data.lastName || ''}\n`.replace(/\s+/g, ' ').trimEnd() + '\n';
    if (data.dateOfBirth) formattedString += `- DOB: ${data.dateOfBirth}\n`;
    if (data.age) formattedString += `- Age: ${data.age} years\n`;
    if (data.gender) formattedString += `- Gender/Sex: ${data.gender}\n`;
    if (data.city) formattedString += `- City: ${data.city}\n`;
    if (data.currentMedications && data.currentMedications.trim()) formattedString += `- Current Medications: ${data.currentMedications.trim()}\n`;
    if (data.knownAllergies && data.knownAllergies.trim()) formattedString += `- Known Allergies: ${data.knownAllergies.trim()}\n`;
    if (data.chronicConditions && data.chronicConditions.trim()) formattedString += `- Chronic Conditions: ${data.chronicConditions.trim()}\n`;
    if (data.previousSurgeries && data.previousSurgeries.trim()) formattedString += `- Previous Major Surgeries: ${data.previousSurgeries.trim()}\n`;
    if (data.reasonForVisit && data.reasonForVisit.trim()) formattedString += `- Current Symptoms/Reason for Visit: ${data.reasonForVisit.trim()}\n`;
    if (data.primaryCarePhysician && data.primaryCarePhysician.trim()) formattedString += `- PCP: ${data.primaryCarePhysician.trim()}\n`;
    if (data.additionalNotes && data.additionalNotes.trim()) formattedString += `- Additional Notes: ${data.additionalNotes.trim()}\n`;
    
    if (formattedString === "Patient Background Information:\n") return ""; // No data was actually present
    return formattedString + "\n---\n\n";
}


export async function handleSendMessage(event?: Event) {
  if (event) event.preventDefault();
  playButtonSound();

  const currentAI = aiService.getActiveEncounterAI();
  const currentChatInputEl = document.getElementById('chat-input') as HTMLTextAreaElement | null; // Query fresh

  if (appState.isLoading || !currentAI || !appState.activeEncounterId || !currentChatInputEl) return;

  const text = currentChatInputEl.value.trim();
  if (!text && appState.uploadedFileParts.length === 0) return;

  uiManager.setLoading(true);
  
  const activeEncounter = appState.getActiveEncounter();
  if (!activeEncounter) {
      uiManager.setLoading(false);
      uiManager.displaySystemError("No active patient encounter found.", true);
      return;
  }

  const userMessageId = generateId();
  let userQueryText = text;
  let patientDataPrefix = "";

  // Check if this is the first user message for this encounter where patient data hasn't been sent
  if (!activeEncounter.patientDataSentToAI && activeEncounter.patientCoreData) {
    const formattedData = formatPatientCoreDataForAI(activeEncounter.patientCoreData);
    if (formattedData) {
        patientDataPrefix = formattedData;
        activeEncounter.patientDataSentToAI = true; // Mark as sent
    }
  }
  
  let combinedUserMessageText = patientDataPrefix + userQueryText;

  if (appState.activeSystemTab) {
    combinedUserMessageText = `Context: Current focus is on the ${appState.activeSystemTab} system. ${combinedUserMessageText}`;
  }


  const userMessage: appState.Message = {
    id: userMessageId,
    role: 'user',
    text: combinedUserMessageText, // Send combined text
    files: appState.uploadedFileObjects.map(f => ({ name: f.name, type: f.type, size: f.size })),
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  };
  appState.addMessageToActiveEncounter(userMessage);
  uiManager.renderMessages(); 

  currentChatInputEl.value = '';
  currentChatInputEl.style.height = 'auto'; 
  const currentUploadedFilesForMessage = [...appState.uploadedFileParts];
  
  appState.clearUploadedFiles();
  uiManager.renderUploadedFiles();

  try {
    const messagePartsForGemini: Part[] = [];
    if (combinedUserMessageText) messagePartsForGemini.push({ text: combinedUserMessageText });
    messagePartsForGemini.push(...currentUploadedFilesForMessage);
    
    const stream = await currentAI.sendMessageStream({ message: messagePartsForGemini });
    
    let accumulatedModelResponseText = '';
    const modelMessageId = generateId();
    const modelMessage: appState.Message = { 
        id: modelMessageId, 
        role: 'model', 
        text: '', 
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    };
    appState.addMessageToActiveEncounter(modelMessage); // Add new empty model message

    for await (const chunk of stream) {
      if (chunk.text) {
        accumulatedModelResponseText += chunk.text;
        // Find the model message in the encounter and update its text
        const encounter = appState.getActiveEncounter();
        const msgToUpdate = encounter?.messages.find(m => m.id === modelMessageId);
        if (msgToUpdate) msgToUpdate.text = accumulatedModelResponseText;
        uiManager.renderMessages(); 
      }
      if (chunk.candidates && chunk.candidates[0]?.groundingMetadata?.groundingChunks) {
          const encounter = appState.getActiveEncounter();
          const msgToUpdate = encounter?.messages.find(m => m.id === modelMessageId);
          if (msgToUpdate) msgToUpdate.groundingChunks = chunk.candidates[0].groundingMetadata.groundingChunks;
          uiManager.renderMessages();
      }
    }
    
    const finalEncounter = appState.getActiveEncounter();
    const finalModelMessage = finalEncounter?.messages.find(m => m.id === modelMessageId);

    if (finalModelMessage) {
        const notesJsonRegex = /---NOTES_JSON_START---([\s\S]*?)---NOTES_JSON_END---/;
        const notesJsonMatch = finalModelMessage.text.match(notesJsonRegex);
        let responseToSpeak = finalModelMessage.text;

        if (notesJsonMatch && notesJsonMatch[1]) {
          try {
            const notesString = notesJsonMatch[1].trim();
            const parsedNotes: Partial<NotesData> = JSON.parse(notesString);
            
            const currentNotes = activeEncounter.notes || { redFlags: [], symptoms: [], diagnoses: [], medications: [], followUp: [], patientEducation: [] };
            appState.updateNotesForActiveEncounter({ 
                redFlags: parsedNotes.redFlags || currentNotes.redFlags,
                symptoms: parsedNotes.symptoms || currentNotes.symptoms,
                diagnoses: parsedNotes.diagnoses || currentNotes.diagnoses,
                medications: parsedNotes.medications || currentNotes.medications,
                followUp: parsedNotes.followUp || currentNotes.followUp,
                patientEducation: parsedNotes.patientEducation || currentNotes.patientEducation,
            });
            uiManager.renderNotes();
            responseToSpeak = finalModelMessage.text.replace(notesJsonRegex, '').trim();
            finalModelMessage.text = responseToSpeak; 
          } catch (e) {
            console.error("Failed to parse notes JSON:", e);
          }
        }
        const disclaimerText = "*Important: This information is for educational purposes and to support healthcare professionals. It is not a substitute for professional medical advice, diagnosis, or treatment. Always consult with a qualified healthcare provider for any medical decisions or concerns.*";
        if (!responseToSpeak.includes(disclaimerText.substring(0, 50))) { 
            responseToSpeak = `${responseToSpeak.trim()}\n\n${disclaimerText}`;
            finalModelMessage.text = responseToSpeak;
        }
        
        uiManager.renderMessages();

        if (nexusState.nexusAutoPlayAudio && nexusState.nexusAudioOutputEnabled) {
            let textForSpeech = responseToSpeak.replace(/\*\*MEDIFRAMEWORK:\*\*|\*MEDIFRAMEWORK:\*|\n\n${disclaimerText}/gi, '').trim();
            textForSpeech = textForSpeech.replace(/\*\*(.*?)\*\*|__(.*?)__/g, '$1$2'); 
            textForSpeech = textForSpeech.replace(/\*(.*?)\*|_(.*?)_/g, '$1$2'); 
            textForSpeech = textForSpeech.replace(/~~(.*?)~~/g, ''); 
            textForSpeech = textForSpeech.replace(/```[\s\S]*?```/g, 'Code block follows.'); 
            textForSpeech = textForSpeech.replace(/`([^`]+)`/g, '$1'); 
            textForSpeech = textForSpeech.replace(/\[(.*?)\]\(.*?\)/g, '$1'); 
            textForSpeech = textForSpeech.replace(/^\s*([*-]|\d+\.)\s+/gm, ''); 
            speechService.speakText(textForSpeech);
        }
    }


  } catch (error: any) {
    console.error("Error sending message:", error);
    const errorText = error.message || "An unknown error occurred.";
    const modelMessageId = generateId();
    const disclaimerText = "*Important: This information is for educational purposes and to support healthcare professionals. It is not a substitute for professional medical advice, diagnosis, or treatment. Always consult with a qualified healthcare provider for any medical decisions or concerns.*";
    const errorMessage = `**MEDIFRAMEWORK:** I encountered an error processing your request: ${errorText}\n\n${disclaimerText}`;
    appState.addMessageToActiveEncounter({ 
        id: modelMessageId, 
        role: 'model', 
        text: errorMessage,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    });
    uiManager.renderMessages();
    if (nexusState.nexusAutoPlayAudio && nexusState.nexusAudioOutputEnabled) {
        speechService.speakText(`I encountered an error processing your request: ${errorText}`);
    }
  } finally {
    uiManager.setLoading(false);
    uiManager.renderPatientEncountersList(); 
    (window as any).savePatientEncounters?.(); // Assumes savePatientEncounters is global or imported by caller
    if (currentChatInputEl) currentChatInputEl.focus();
  }
}


export async function handleFilesSelected(files: FileList | null) {
  if (!files) return;
  uiManager.setLoading(true);
  for (const file of Array.from(files)) {
    try {
      const part = await fileToGenerativePart(file);
      if (part) {
        appState.addUploadedFile(part, file);
      }
    } catch (error) {
      console.error("Error processing file:", file.name, error);
      alert(`Error processing file ${file.name}. It may be too large or an unsupported format.`);
    }
  }
  uiManager.renderUploadedFiles();
  uiManager.setLoading(false);
}


export function renderNexusAITabContent() {
    const voiceStatusIndicator = document.getElementById('nexus-voice-status-indicator');
    if(voiceStatusIndicator) voiceStatusIndicator.textContent = nexusState.nexusVoiceActive ? "[VOICE: ACTIVE]" : "[VOICE: INACTIVE]";

    const listeningStatusEl = document.getElementById('nexus-input-listening-status');
    if(listeningStatusEl) listeningStatusEl.textContent = nexusState.nexusListeningStatus;
    
    const confidenceValEl = document.getElementById('nexus-input-confidence-value');
    if(confidenceValEl) confidenceValEl.textContent = `${Math.round(nexusState.nexusTranscriptionConfidence * 100)}%`;

    const noiseLevelEl = document.getElementById('nexus-input-noise-level');
    if(noiseLevelEl) noiseLevelEl.textContent = nexusState.nexusNoiseLevel;

    const liveTranscriptionEl = document.getElementById('nexus-live-transcription-text');
    if(liveTranscriptionEl) liveTranscriptionEl.textContent = nexusState.nexusLiveTranscription;

    const prepStatusEl = document.getElementById('nexus-response-preparation-status');
    if(prepStatusEl) prepStatusEl.textContent = nexusState.nexusResponsePreparationStatus;

    const voiceReadyEl = document.getElementById('nexus-voice-ready-indicator');
    if(voiceReadyEl) voiceReadyEl.textContent = nexusState.nexusVoiceProfile ? "[VOICE: READY]" : "[VOICE: NOT READY]";
    
    const audioOutputStatusEl = document.getElementById('nexus-audio-output-status');
    if(audioOutputStatusEl) audioOutputStatusEl.textContent = nexusState.nexusAudioOutputEnabled ? "[ENABLED]" : "[DISABLED]";

    const voiceProfileDisplayEl = document.getElementById('nexus-voice-profile-display');
    if(voiceProfileDisplayEl) voiceProfileDisplayEl.textContent = nexusState.nexusVoiceProfile ? `[${nexusState.nexusVoiceProfile.name.substring(0,20)}]` : "[N/A]";

    const micStatusTextEl = document.getElementById('nexus-mic-status-text');
    if (micStatusTextEl) micStatusTextEl.textContent = nexusState.nexusMicStatusText;

    const speakerStatusTextEl = document.getElementById('nexus-speaker-status-text');
    if (speakerStatusTextEl) speakerStatusTextEl.textContent = nexusState.nexusAudioOutputEnabled ? "[ON]" : "[OFF]";

    document.querySelectorAll('#nexus-voice-control-panel .control-group button').forEach(btn => btn.classList.remove('active'));
    const micBtn = document.getElementById('nexus-mic-mute-button');
    if(micBtn) micBtn.textContent = nexusState.nexusVoiceActive ? "[STOP MIC]" : "[START MIC]";

    const inputVoiceBtn = document.getElementById('nexus-input-voice-button');
    const inputTextBtn = document.getElementById('nexus-input-text-button');
    const inputBothBtn = document.getElementById('nexus-input-both-button');
    if (nexusState.nexusInputMethod === 'voice' && inputVoiceBtn) inputVoiceBtn.classList.add('active');
    else if (nexusState.nexusInputMethod === 'text' && inputTextBtn) inputTextBtn.classList.add('active');
    else if (nexusState.nexusInputMethod === 'both' && inputBothBtn) inputBothBtn.classList.add('active');

    const modeConsultBtn = document.getElementById('nexus-mode-consult-button');
    const modeDiagBtn = document.getElementById('nexus-mode-diag-button');
    const modeEduBtn = document.getElementById('nexus-mode-edu-button');
    if (nexusState.nexusConversationMode === 'consult' && modeConsultBtn) modeConsultBtn.classList.add('active');
    else if (nexusState.nexusConversationMode === 'diagnostic' && modeDiagBtn) modeDiagBtn.classList.add('active');
    else if (nexusState.nexusConversationMode === 'education' && modeEduBtn) modeEduBtn.classList.add('active');

    const voiceSettingsPanel = document.getElementById('nexus-voice-settings-panel');
    if (voiceSettingsPanel) voiceSettingsPanel.style.display = nexusState.nexusShowVoiceSettings ? 'block' : 'none';

    if (nexusState.nexusShowVoiceSettings) {
        const voiceSelect = document.getElementById('nexus-voice-profile-select') as HTMLSelectElement | null;
        if (voiceSelect) {
            if (voiceSelect.options.length !== nexusState.availableVoices.length) {
                voiceSelect.innerHTML = '';
                nexusState.availableVoices.forEach(voice => {
                    const option = document.createElement('option');
                    option.value = voice.name;
                    option.textContent = `${voice.name} (${voice.lang})`;
                    if (nexusState.nexusVoiceProfile && voice.name === nexusState.nexusVoiceProfile.name) {
                        option.selected = true;
                    }
                    voiceSelect.appendChild(option);
                });
            } else {
                 Array.from(voiceSelect.options).forEach(opt => {
                    opt.selected = nexusState.nexusVoiceProfile?.name === opt.value;
                 });
            }
        }
        const rateInput = document.getElementById('nexus-speech-rate-input') as HTMLInputElement | null;
        if (rateInput) rateInput.value = nexusState.nexusSpeechRate.toString();
        const rateValueDisplay = document.getElementById('nexus-speech-rate-value');
        if(rateValueDisplay) rateValueDisplay.textContent = nexusState.nexusSpeechRate.toFixed(1);

        const pitchInput = document.getElementById('nexus-speech-pitch-input') as HTMLInputElement | null;
        if (pitchInput) pitchInput.value = nexusState.nexusSpeechPitch.toString();
        const pitchValueDisplay = document.getElementById('nexus-speech-pitch-value');
        if(pitchValueDisplay) pitchValueDisplay.textContent = nexusState.nexusSpeechPitch.toFixed(1);

        const autoPlayToggle = document.getElementById('nexus-auto-play-toggle') as HTMLButtonElement | null;
        if (autoPlayToggle) autoPlayToggle.textContent = nexusState.nexusAutoPlayAudio ? "[ON]" : "[OFF]";
    }
    
    uiManager.renderMessages(); 
    uiManager.renderUploadedFiles(); 
}

export function initializeNexusAIEventListeners() {
    const micMuteButton = document.getElementById('nexus-mic-mute-button');
    if (micMuteButton) {
      micMuteButton.addEventListener('click', () => {
        playButtonSound();
        if (!nexusState.speechRecognition) {
            uiManager.displaySystemError("Speech recognition not available.", true);
            return;
        }
        if (nexusState.nexusVoiceActive) {
          nexusState.speechRecognition.stop();
        } else {
          try {
            nexusState.speechRecognition.start();
          } catch (e) {
            console.error("Error starting speech recognition:", e);
            nexusState.setNexusListeningStatus("[ERROR - TRY AGAIN]");
            nexusState.setNexusMicStatusText("[OFF]");
            nexusState.setNexusVoiceActive(false);
          }
        }
        renderNexusAITabContent();
      });
    }

    const micSettingsButton = document.getElementById('nexus-mic-settings-button');
    if (micSettingsButton) {
      micSettingsButton.addEventListener('click', () => {
        playButtonSound();
        nexusState.setNexusShowVoiceSettings(!nexusState.nexusShowVoiceSettings);
        renderNexusAITabContent();
      });
    }

    const speakerMuteButton = document.getElementById('nexus-speaker-mute-button');
    if (speakerMuteButton) {
      speakerMuteButton.addEventListener('click', () => {
        playButtonSound();
        nexusState.setNexusAudioOutputEnabled(!nexusState.nexusAudioOutputEnabled);
        if (!nexusState.nexusAudioOutputEnabled && nexusState.speechSynthesis.speaking) {
          nexusState.speechSynthesis.cancel();
          nexusState.setNexusResponsePreparationStatus("[IDLE]");
        }
        nexusState.setNexusSpeakerStatusText(nexusState.nexusAudioOutputEnabled ? "[ON]" : "[OFF]");
        renderNexusAITabContent();
      });
    }

    const speakerTestButton = document.getElementById('nexus-speaker-test-button');
    if (speakerTestButton) {
      speakerTestButton.addEventListener('click', () => {
        playButtonSound();
        if (nexusState.nexusAudioOutputEnabled) {
            speechService.speakText("NEXUS audio output test. System online.");
        } else {
            uiManager.displaySystemError("Audio output is disabled. Enable speaker to test.", true);
        }
      });
    }
    
    const inputVoiceBtn = document.getElementById('nexus-input-voice-button');
    const inputTextBtn = document.getElementById('nexus-input-text-button');
    const inputBothBtn = document.getElementById('nexus-input-both-button');
    if(inputVoiceBtn) inputVoiceBtn.addEventListener('click', () => { playButtonSound(); nexusState.setNexusInputMethod('voice'); renderNexusAITabContent(); });
    if(inputTextBtn) inputTextBtn.addEventListener('click', () => { playButtonSound(); nexusState.setNexusInputMethod('text'); renderNexusAITabContent(); });
    if(inputBothBtn) inputBothBtn.addEventListener('click', () => { playButtonSound(); nexusState.setNexusInputMethod('both'); renderNexusAITabContent(); });

    const modeConsultBtn = document.getElementById('nexus-mode-consult-button');
    const modeDiagBtn = document.getElementById('nexus-mode-diag-button');
    const modeEduBtn = document.getElementById('nexus-mode-edu-button');
    if(modeConsultBtn) modeConsultBtn.addEventListener('click', () => { playButtonSound(); nexusState.setNexusConversationMode('consult'); renderNexusAITabContent(); });
    if(modeDiagBtn) modeDiagBtn.addEventListener('click', () => { playButtonSound(); nexusState.setNexusConversationMode('diagnostic'); renderNexusAITabContent(); });
    if(modeEduBtn) modeEduBtn.addEventListener('click', () => { playButtonSound(); nexusState.setNexusConversationMode('education'); renderNexusAITabContent(); });

    const voiceSelect = document.getElementById('nexus-voice-profile-select') as HTMLSelectElement | null;
    if (voiceSelect) {
        voiceSelect.addEventListener('change', () => {
            const selectedVoice = nexusState.availableVoices.find(v => v.name === voiceSelect.value);
            if (selectedVoice) nexusState.setNexusVoiceProfile(selectedVoice);
            renderNexusAITabContent();
        });
    }
    const rateInput = document.getElementById('nexus-speech-rate-input') as HTMLInputElement | null;
    if (rateInput) {
        rateInput.addEventListener('input', () => {
            nexusState.setNexusSpeechRate(parseFloat(rateInput.value));
            renderNexusAITabContent();
        });
    }
    const pitchInput = document.getElementById('nexus-speech-pitch-input') as HTMLInputElement | null;
    if (pitchInput) {
        pitchInput.addEventListener('input', () => {
            nexusState.setNexusSpeechPitch(parseFloat(pitchInput.value));
            renderNexusAITabContent();
        });
    }
    const autoPlayToggle = document.getElementById('nexus-auto-play-toggle') as HTMLButtonElement | null;
    if (autoPlayToggle) {
        autoPlayToggle.addEventListener('click', () => {
            playButtonSound();
            nexusState.setNexusAutoPlayAudio(!nexusState.nexusAutoPlayAudio);
            renderNexusAITabContent();
        });
    }
    const testVoiceSettingsBtn = document.getElementById('nexus-test-voice-settings');
    if (testVoiceSettingsBtn) {
        testVoiceSettingsBtn.addEventListener('click', () => {
            playButtonSound();
             if (nexusState.nexusAudioOutputEnabled) {
                speechService.speakText("Testing current voice configuration.");
            } else {
                uiManager.displaySystemError("Audio output is disabled. Enable speaker to test voice settings.", true);
            }
        });
    }
    const resetVoiceSettingsBtn = document.getElementById('nexus-reset-voice-settings');
    if (resetVoiceSettingsBtn) {
        resetVoiceSettingsBtn.addEventListener('click', () => {
            playButtonSound();
            nexusState.setNexusSpeechRate(1.0);
            nexusState.setNexusSpeechPitch(1.0);
            const defaultVoice = nexusState.availableVoices.find(v => v.default) || nexusState.availableVoices[0];
            if (defaultVoice) nexusState.setNexusVoiceProfile(defaultVoice);
            nexusState.setNexusAutoPlayAudio(true);
            renderNexusAITabContent();
        });
    }
}