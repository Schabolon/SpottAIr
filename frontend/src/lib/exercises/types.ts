export interface Landmark {
    x: number;
    y: number;
    z: number;
    visibility?: number;
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
