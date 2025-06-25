/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type PsychometricModule =
  | 'mainMenu'
  // | 'cognitiveMenu' | 'cognitiveTestScreen' // Removed cognitive assessment
  | 'mse'
  | 'phq9' | 'gad7'
  | 'personalityMatrix'
  | 'traumaPCL5'
  | 'clinicalInterview'
  | 'reportGenerator'
  | 'nnpa' // Added Neural Network Psychosis Assessment
  | 'notImplemented';

export let activePsychometricModule: PsychometricModule = 'mainMenu';
export let psychometricModuleContext: any = null;
export let psychometricTerminalTimerInterval: number | null = null;
export let currentPsychometricTime = new Date();

// --- Setters for state ---
export function setActivePsychometricModule(module: PsychometricModule) {
    activePsychometricModule = module;
}
export function setPsychometricModuleContext(context: any) {
    psychometricModuleContext = context;
}
export function setPsychometricTerminalTimerInterval(intervalId: number | null) {
    psychometricTerminalTimerInterval = intervalId;
}
export function setCurrentPsychometricTime(time: Date) {
    currentPsychometricTime = time;
}