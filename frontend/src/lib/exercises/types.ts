export interface Landmark {
    x: number;
    y: number;
    z: number;
    visibility?: number;
}

export enum PoseLandmarkIndex {
    NOSE = 0,
    LEFT_EYE_INNER = 1,
    LEFT_EYE = 2,
    LEFT_EYE_OUTER = 3,
    RIGHT_EYE_INNER = 4,
    RIGHT_EYE = 5,
    RIGHT_EYE_OUTER = 6,
    LEFT_EAR = 7,
    RIGHT_EAR = 8,
    MOUTH_LEFT = 9,
    MOUTH_RIGHT = 10,
    LEFT_SHOULDER = 11,
    RIGHT_SHOULDER = 12,
    LEFT_ELBOW = 13,
    RIGHT_ELBOW = 14,
    LEFT_WRIST = 15,
    RIGHT_WRIST = 16,
    LEFT_PINKY = 17,
    RIGHT_PINKY = 18,
    LEFT_INDEX = 19,
    RIGHT_INDEX = 20,
    LEFT_THUMB = 21,
    RIGHT_THUMB = 22,
    LEFT_HIP = 23,
    RIGHT_HIP = 24,
    LEFT_KNEE = 25,
    RIGHT_KNEE = 26,
    LEFT_ANKLE = 27,
    RIGHT_ANKLE = 28,
    LEFT_HEEL = 29,
    RIGHT_HEEL = 30,
    LEFT_FOOT_INDEX = 31,
    RIGHT_FOOT_INDEX = 32,
}

export interface ExerciseState {
    reps: number;
    phase: 'start' | 'down' | 'up';
    feedback: string[];
    isGoodRep: boolean; // Was the current/last rep good?
    badPoints: number[]; // Indices of landmarks to highlight
}

export interface ExerciseProcessor {
    reset(): void;
    process(landmarks: Landmark[]): ExerciseState;
}

export abstract class BaseExerciseProcessor implements ExerciseProcessor {
    protected state: ExerciseState = {
        reps: 0,
        phase: 'start',
        feedback: [],
        isGoodRep: true,
        badPoints: []
    };

    reset() {
        this.state = {
            reps: 0,
            phase: 'start',
            feedback: [],
            isGoodRep: true,
            badPoints: []
        };
    }

    process(landmarks: Landmark[]): ExerciseState {
        // Basic visibility check (can be overridden or extended)
        // For now, we assume if we have landmarks, we try to process.
        // Specific exercises can add stricter checks in checkForm.

        // 1. Form Check
        const { isGoodForm, feedback, badPoints } = this.checkForm(landmarks);

        // 2. Rep Counting
        this.countReps(landmarks, isGoodForm);

        this.state.feedback = feedback;
        this.state.badPoints = badPoints;

        return { ...this.state };
    }

    abstract checkForm(landmarks: Landmark[]): { isGoodForm: boolean; feedback: string[]; badPoints: number[] };
    abstract countReps(landmarks: Landmark[], isGoodForm: boolean): void;

    protected getAngle(a: Landmark, b: Landmark, c: Landmark): number {
        const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
        let angle = Math.abs(radians * 180.0 / Math.PI);

        if (angle > 180.0) {
            angle = 360.0 - angle;
        }

        return angle;
    }
}
