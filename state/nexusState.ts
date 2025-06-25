
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Web Speech API instances
export let speechRecognition: SpeechRecognition | null = null;
export const speechSynthesis = window.speechSynthesis;
export let availableVoices: SpeechSynthesisVoice[] = [];

// NEXUS-AI State
export let nexusVoiceActive = false;
export let nexusListeningStatus = "[STANDBY]";
export let nexusTranscriptionConfidence = 0;
export let nexusNoiseLevel = "[LOW]";
export let nexusLiveTranscription = "Live transcription of user speech appears here...";
export let nexusResponsePreparationStatus = "[IDLE]";
export let nexusVoiceReadyIndicator = "[VOICE: NOT READY]";
export let nexusAudioOutputEnabled = false;
export let nexusVoiceProfile: SpeechSynthesisVoice | null = null;
export let nexusSpeechRate = 1.0;
export let nexusSpeechPitch = 1.0;
export let nexusMicStatusText = "[OFF]";
export let nexusSpeakerStatusText = "[OFF]";
export let nexusInputMethod: 'voice' | 'text' | 'both' = 'text';
export let nexusConversationMode: 'consult' | 'diagnostic' | 'education' = 'consult';
export let nexusShowVoiceSettings = false;
export let nexusAutoPlayAudio = true;

// --- Setters for state ---
export function setSpeechRecognition(instance: SpeechRecognition | null) {
    speechRecognition = instance;
}
export function setAvailableVoices(voices: SpeechSynthesisVoice[]) {
    availableVoices = voices;
}
export function setNexusVoiceActive(value: boolean) {
    nexusVoiceActive = value;
}
export function setNexusListeningStatus(value: string) {
    nexusListeningStatus = value;
}
export function setNexusTranscriptionConfidence(value: number) {
    nexusTranscriptionConfidence = value;
}
export function setNexusNoiseLevel(value: string) {
    nexusNoiseLevel = value;
}
export function setNexusLiveTranscription(value: string) {
    nexusLiveTranscription = value;
}
export function setNexusResponsePreparationStatus(value: string) {
    nexusResponsePreparationStatus = value;
}
export function setNexusVoiceReadyIndicator(value: string) {
    nexusVoiceReadyIndicator = value;
}
export function setNexusAudioOutputEnabled(value: boolean) {
    nexusAudioOutputEnabled = value;
}
export function setNexusVoiceProfile(value: SpeechSynthesisVoice | null) {
    nexusVoiceProfile = value;
}
export function setNexusSpeechRate(value: number) {
    nexusSpeechRate = value;
}
export function setNexusSpeechPitch(value: number) {
    nexusSpeechPitch = value;
}
export function setNexusMicStatusText(value: string) {
    nexusMicStatusText = value;
}
export function setNexusSpeakerStatusText(value: string) {
    nexusSpeakerStatusText = value;
}
export function setNexusInputMethod(value: 'voice' | 'text' | 'both') {
    nexusInputMethod = value;
}
export function setNexusConversationMode(value: 'consult' | 'diagnostic' | 'education') {
    nexusConversationMode = value;
}
export function setNexusShowVoiceSettings(value: boolean) {
    nexusShowVoiceSettings = value;
}
export function setNexusAutoPlayAudio(value: boolean) {
    nexusAutoPlayAudio = value;
}