import { SquatBiometrics } from './geometry';

// --- TYPES ---

export interface PredictionResult {
    label: string;
    confidence: number;
}

export interface AgentFeedback {
    text: string;
    color: string;
    isError: boolean;
}

// --- CONSTANTS ---

const ERROR_MESSAGES: Record<string, string> = {
    "knees_caved": "knees are caving in",
    "feet_wide": "stance is too wide",
    "spine_issue": "your back rounding",
    "unknown": "form is unstable"
};

const MOTIVATIONS = [
    "Good rep.",
    "Solid form.",
    "Lightweight baby!",
    "Perfect depth.",
    "Keep grinding."
];

// State to track vertical movement phase
let wasStanding = true;

/**
 * Decides what to say based on ML prediction + Geometry Math.
 */
export function getFeedback(
    prediction: PredictionResult,
    biometrics: SquatBiometrics,
    repCount: number
): AgentFeedback | null {

    const { label, confidence} = prediction;
    const { squatDepth, hipY, kneeY } = biometrics;

    // 1. USER SQUATTING?
    // MediaPipe Y coordinates increase downwards (0 is top, 1 is bottom).
    // If hipY > (kneeY - buffer), the hip is physically lowering towards the knee.
    // Adjustable threshold: 0.15 seems to work for most camera angles.
    const isSquatting = hipY > (kneeY - 0.15);

    // RESET STATE: If they stand back up, reset the flag so we can judge the next rep.
    if (!isSquatting) {
        wasStanding = true;
        return null;
    }

    // CHECK STATE: Only give feedback once per rep
    if (!wasStanding) {
        return null;
    }

    wasStanding = false; //

    // 2. RULE: DEPTH CHECK (Hard Logic Override)
    if (squatDepth > 100) {
        return {
            text: "LOWER! Hit depth!",
            color: "#FF0000", // Red
            isError: true
        };
    }

    // 3. RULE: CORRECT FORM
    if (label === "correct") {
        const randomMsg = MOTIVATIONS[repCount % MOTIVATIONS.length];
        return {
            text: randomMsg,
            color: "#00FF00", // Green
            isError: false
        };
    }

    // 4. RULE: LOW CONFIDENCE (< 0.6)
    // Use tentative language ("I think...")
    if (confidence < 0.6) {
        const errorText = ERROR_MESSAGES[label] || "form looks off";
        return {
            text: `It seems your ${errorText}.`,
            color: "#FFA500", // Orange
            isError: true
        };
    }

    // 5. RULE: HIGH CONFIDENCE (> 0.6)
    // Direct command.
    const errorText = ERROR_MESSAGES[label] || "check your form";
    return {
        text: `Fix it. Your ${errorText}!`,
        color: "#FF0000", // Red
        isError: true
    };
}