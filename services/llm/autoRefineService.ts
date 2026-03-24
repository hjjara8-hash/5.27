import { GoogleGenAI, Content, GenerateContentResponse, GenerationConfig as GeminiGenerationConfigSDK } from "@google/genai";
import { GeminiSettings } from "../../types/settings";

export interface AutoRefineResult {
    response: GenerateContentResponse;
    logs: string;
}

/**
 * Implements the Iterative Auto-Refine pattern.
 * Draft -> Critic -> Refine -> Repeat
 */
export async function generateAutoRefineResponse(
    ai: GoogleGenAI,
    model: string,
    contents: Content[],
    config: GeminiGenerationConfigSDK,
    settings: GeminiSettings,
    onLog: (log: string) => void
): Promise<AutoRefineResult> {
    const maxIterations = settings.autoRefineMaxIterations || 3;
    const criticInstruction = settings.autoRefineCriticInstruction || "Review the draft critically. Find logical errors, edge cases, missing details, or potential improvements. Be harsh but constructive.";
    
    let currentResponse: GenerateContentResponse;
    let logs = "[AUTO-REFINE INITIATED]\n";
    
    // 1. Initial Draft
    onLog("Generating initial draft...");
    currentResponse = await ai.models.generateContent({
        model,
        contents,
        config
    });
    
    let currentDraft = currentResponse.text || "";
    logs += `\n--- INITIAL DRAFT ---\n${currentDraft}\n`;
    
    for (let i = 0; i < maxIterations; i++) {
        const iterationNum = i + 1;
        onLog(`Refinement iteration ${iterationNum}/${maxIterations}...`);
        logs += `\n--- ITERATION ${iterationNum} ---\n`;
        
        // 2. Critique
        onLog(`Critiquing draft ${iterationNum}...`);
        const criticPrompt = `
[CRITIC MODE]
Original User Request:
${contents[contents.length - 1].parts.map(p => (p as any).text || "").join("\n")}

Current Draft:
${currentDraft}

Instruction:
${criticInstruction}

If the draft is perfect and requires no further refinement, start your response with the exact word "PASS".
Otherwise, provide a detailed list of flaws and specific suggestions for improvement.
`;

        const criticResponse = await ai.models.generateContent({
            model,
            contents: [{ role: 'user', parts: [{ text: criticPrompt }] }],
            config: { ...config, temperature: 0.3 } // Lower temperature for more consistent critique
        });
        
        const critique = criticResponse.text || "";
        logs += `\n[CRITIQUE ${iterationNum}]\n${critique}\n`;
        
        if (critique.trim().toUpperCase().startsWith("PASS")) {
            logs += `\n[CRITIC PASSED] Quality threshold met at iteration ${iterationNum}.\n`;
            onLog("Critic passed. Finalizing response...");
            break;
        }
        
        // 3. Refine
        onLog(`Refining draft ${iterationNum}...`);
        const refinementPrompt = `
[REFINEMENT MODE]
Original User Request:
${contents[contents.length - 1].parts.map(p => (p as any).text || "").join("\n")}

Current Draft:
${currentDraft}

Critique/Suggestions:
${critique}

Instruction:
Generate a new, improved version of the draft that addresses all points in the critique.
Maintain the original intent and persona.
Output ONLY the refined text.
`;

        currentResponse = await ai.models.generateContent({
            model,
            contents: [{ role: 'user', parts: [{ text: refinementPrompt }] }],
            config
        });
        
        currentDraft = currentResponse.text || "";
        logs += `\n[REFINED DRAFT ${iterationNum}]\n${currentDraft}\n`;
    }
    
    logs += "\n[AUTO-REFINE COMPLETE]";
    return {
        response: currentResponse,
        logs
    };
}
