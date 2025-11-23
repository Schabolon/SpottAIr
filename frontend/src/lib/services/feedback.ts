
export type FeedbackType = 'success' | 'warning' | 'error' | 'info';

export interface FeedbackDisplay {
    title: string;
    message: string;
    type: FeedbackType;
    icon?: string; // Emoji or icon name
}

export class FeedbackService {
    static getFeedback(
        neuralClass: string,
        ruleFeedback: string[],
        isVisible: boolean,
        isExerciseActive: boolean
    ): FeedbackDisplay {
        // 1. Inactive State
        if (!isExerciseActive) {
            return {
                title: "Ready to Train",
                message: "Start exercise to\nreceive feedback",
                type: 'info',
                icon: '✨'
            };
        }

        // 2. Visibility Check
        if (!isVisible || neuralClass === 'not_visible') {
            return {
                title: "Visibility Issue",
                message: "Ensure full body is visible",
                type: 'warning',
                icon: '📷'
            };
        }

        // 3. Neural Model Errors
        // Map class names to user-friendly messages
        const neuralMessages: Record<string, string> = {
            'feet_wide': 'Feet too wide',
            'knees_caved': 'Knees caving in',
            'spine_misalignment': 'Spine misaligned'
        };

        const neuralIcons: Record<string, string> = {
            'feet_wide': '↔️',
            'knees_caved': '🦵',
            'spine_misalignment': '🦴'
        };

        if (neuralClass && neuralClass !== 'correct' && neuralMessages[neuralClass]) {
            return {
                title: "Correction Needed",
                message: neuralMessages[neuralClass],
                type: 'error',
                icon: neuralIcons[neuralClass]
            };
        }

        // 4. Rule-based Errors (from checkForm)
        if (ruleFeedback && ruleFeedback.length > 0) {
            // Show the first rule violation
            return {
                title: "Form Check",
                message: ruleFeedback[0],
                type: 'error',
                icon: '⚠️'
            };
        }

        // 5. Success (Default)
        return {
            title: "Perfect Form!",
            message: "Keep it up!",
            type: 'success',
            icon: '✨'
        };
    }
}
