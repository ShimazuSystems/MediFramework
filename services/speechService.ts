

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as nexusState from '../state/nexusState';
import * as domElements from '../dom/domElements';
import { displaySystemError } from '../dom/uiManager';
// renderNexusAITabContent will be imported from nexusController or similar
// For now, assume it's made available globally or imported where this module is used.
// This creates a dependency that needs careful handling.
// A better way would be for this module to emit events or use callbacks.
declare function renderNexusAITabContent(): void;


export function speakText(textToSpeak: string) {
    if (!nexusState.nexusAudioOutputEnabled || !nexusState.nexusVoiceProfile || !nexusState.speechSynthesis) {
        nexusState.setNexusResponsePreparationStatus("[IDLE]");
        if (typeof renderNexusAITabContent === 'function') renderNexusAITabContent();
        return;
    }

    // Always cancel any ongoing or pending speech first.
    // This ensures that we are attempting to speak the latest request.
    nexusState.speechSynthesis.cancel();

    // Create and configure the new utterance
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.voice = nexusState.nexusVoiceProfile;
    utterance.rate = nexusState.nexusSpeechRate;
    utterance.pitch = nexusState.nexusSpeechPitch;

    utterance.onstart = () => {
        nexusState.setNexusResponsePreparationStatus("[SPEAKING]");
        if (typeof renderNexusAITabContent === 'function') renderNexusAITabContent();
    };

    utterance.onend = () => {
        // This 'onend' fires for this specific utterance when it finishes naturally,
        // is cancelled by speechSynthesis.cancel(), or after an error occurs.
        nexusState.setNexusResponsePreparationStatus("[IDLE]");
        if (typeof renderNexusAITabContent === 'function') renderNexusAITabContent();
    };

    utterance.onerror = (event) => {
        // Log the error for debugging, including part of the utterance text.
        console.error(`Speech synthesis error: ${event.error}. Utterance (start): "${utterance.text.substring(0, 50)}..."`);
        
        // "canceled" and "interrupted" are often normal parts of the lifecycle if speech is
        // intentionally stopped (e.g., by a new speech request).
        // Only treat other errors as critical operational errors needing UI display.
        if (event.error !== 'canceled' && event.error !== 'interrupted') {
            nexusState.setNexusResponsePreparationStatus("[ERROR]");
            displaySystemError(`Speech synthesis error: ${event.error}`, true);
        }
        // Note: An 'onend' event will also fire after 'onerror', which will handle UI update
        // and set status to [IDLE]. So, no need to call renderNexusAITabContent or set status here
        // unless onend is found to be unreliable after certain errors.
    };

    // Defer the speak call.
    // This pushes the speak operation to a new task in the event loop,
    // allowing the cancel() operation to fully complete and the event queue to process.
    // A slightly increased delay (e.g., 50ms) can help mitigate race conditions more effectively than 0ms.
    setTimeout(() => {
        // Re-check conditions as state might have changed during the brief timeout
        // (e.g., audio disabled, voice profile changed).
        if (nexusState.speechSynthesis && nexusState.nexusAudioOutputEnabled && nexusState.nexusVoiceProfile) {
            nexusState.setNexusResponsePreparationStatus("[SYNTHESIZING]");
            if (typeof renderNexusAITabContent === 'function') renderNexusAITabContent();
            nexusState.speechSynthesis.speak(utterance);
        } else {
            // Conditions for speaking are no longer met.
            nexusState.setNexusResponsePreparationStatus("[IDLE]");
            if (typeof renderNexusAITabContent === 'function') renderNexusAITabContent();
        }
    }, 50); // Increased delay from 0 to 50ms
}

export function initializeSpeechAPIs() {
    // Speech Synthesis
    const populateVoices = () => {
        if (!nexusState.speechSynthesis) {
            displaySystemError("Speech synthesis API not available.", true);
            nexusState.setNexusVoiceReadyIndicator("[VOICE: API N/A]");
            if (typeof renderNexusAITabContent === 'function') renderNexusAITabContent();
            return;
        }
        const allVoices = nexusState.speechSynthesis.getVoices();
        nexusState.setAvailableVoices(allVoices.filter(v => v.lang.startsWith("en"))); 
        
        if (nexusState.availableVoices.length > 0) {
            const defaultVoice = nexusState.availableVoices.find(voice => voice.default);
            nexusState.setNexusVoiceProfile(defaultVoice || nexusState.availableVoices[0]);
            nexusState.setNexusVoiceReadyIndicator("[VOICE: READY]");
        } else {
            nexusState.setNexusVoiceReadyIndicator("[VOICE: NO VOICES]");
            displaySystemError("No English speech synthesis voices found in your browser.", true);
        }
        if (typeof renderNexusAITabContent === 'function') renderNexusAITabContent();
    };

    // Check if voices are already loaded
    if (nexusState.speechSynthesis && nexusState.speechSynthesis.getVoices().length > 0) {
        populateVoices();
    } else if (nexusState.speechSynthesis && nexusState.speechSynthesis.onvoiceschanged !== undefined) {
        nexusState.speechSynthesis.onvoiceschanged = populateVoices;
    } else if (nexusState.speechSynthesis) {
         // Fallback for browsers that don't fire onvoiceschanged consistently
        setTimeout(populateVoices, 500); 
    } else {
        displaySystemError("Speech synthesis API (window.speechSynthesis) is not available in this browser.", true);
        nexusState.setNexusVoiceReadyIndicator("[VOICE: API N/A]");
    }


    // Speech Recognition
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognitionAPI) {
        const recognitionInstance = new SpeechRecognitionAPI();
        recognitionInstance.continuous = false; // Stop after first final result
        recognitionInstance.interimResults = true;
        recognitionInstance.lang = 'en-US';

        recognitionInstance.onstart = () => {
            nexusState.setNexusVoiceActive(true);
            nexusState.setNexusListeningStatus("[LISTENING...]");
            nexusState.setNexusMicStatusText("[ON]");
            if (typeof renderNexusAITabContent === 'function') renderNexusAITabContent();
        };

        recognitionInstance.onresult = (event: SpeechRecognitionEvent) => {
            let interimTranscript = '';
            let finalTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                    nexusState.setNexusTranscriptionConfidence(event.results[i][0].confidence);
                } else {
                    interimTranscript += event.results[i][0].transcript;
                }
            }
            nexusState.setNexusLiveTranscription(finalTranscript || interimTranscript); // Prefer final if available
            const currentChatInputEl = document.getElementById('chat-input') as HTMLTextAreaElement | null; // Query fresh
            if (finalTranscript && currentChatInputEl) {
                currentChatInputEl.value = finalTranscript;
                currentChatInputEl.style.height = 'auto';
                currentChatInputEl.style.height = `${currentChatInputEl.scrollHeight}px`;
            }
            if (typeof renderNexusAITabContent === 'function') renderNexusAITabContent();
        };

        recognitionInstance.onend = () => {
            nexusState.setNexusVoiceActive(false);
            nexusState.setNexusListeningStatus("[STANDBY]");
            nexusState.setNexusMicStatusText("[OFF]");
            // Check if live transcription is still the placeholder or empty after speech ends
            if (nexusState.nexusLiveTranscription === "Live transcription of user speech appears here..." || nexusState.nexusLiveTranscription.trim() === "") {
                 nexusState.setNexusLiveTranscription("No speech detected or understood. Try again.");
            }
            if (typeof renderNexusAITabContent === 'function') renderNexusAITabContent();
        };

        recognitionInstance.onerror = (event: SpeechRecognitionErrorEvent) => {
            console.error("Speech recognition error:", event.error);
            nexusState.setNexusListeningStatus(`[ERROR: ${event.error}]`);
            nexusState.setNexusVoiceActive(false);
            nexusState.setNexusMicStatusText("[OFF]");
            if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
                displaySystemError("Microphone access denied. Please enable microphone permissions in your browser settings.", true);
            } else if (event.error === 'no-speech') {
                nexusState.setNexusLiveTranscription("No speech was detected. Microphone might be muted or input level too low. Try again.");
            } else if (event.error === 'aborted') {
                 nexusState.setNexusLiveTranscription("Speech input aborted. Try again.");
            } else {
                 displaySystemError(`Speech recognition error: ${event.error}. Please try again.`, true);
            }
            if (typeof renderNexusAITabContent === 'function') renderNexusAITabContent();
        };
        nexusState.setSpeechRecognition(recognitionInstance);
    } else {
        displaySystemError("Speech Recognition API not supported in this browser.", true);
        nexusState.setNexusListeningStatus("[NOT SUPPORTED]");
        nexusState.setNexusMicStatusText("[N/A]");
        if (typeof renderNexusAITabContent === 'function') renderNexusAITabContent();
    }
}