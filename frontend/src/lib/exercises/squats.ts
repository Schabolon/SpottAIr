import { BaseExerciseProcessor, Landmark, PoseLandmarkIndex } from './types';

export class SquatProcessor extends BaseExerciseProcessor {

    reset() {
        super.reset();
        this.minKneeAngle = 180;
    }

    checkForm(landmarks: Landmark[]): { isGoodForm: boolean; feedback: string[]; badPoints: number[] } {
        const feedback: string[] = [];
        const badPoints: number[] = [];
        let isGoodForm = true;

        const leftHip = landmarks[PoseLandmarkIndex.LEFT_HIP];
        const rightHip = landmarks[PoseLandmarkIndex.RIGHT_HIP];
        const leftKnee = landmarks[PoseLandmarkIndex.LEFT_KNEE];
        const rightKnee = landmarks[PoseLandmarkIndex.RIGHT_KNEE];
        const leftAnkle = landmarks[PoseLandmarkIndex.LEFT_ANKLE];
        const rightAnkle = landmarks[PoseLandmarkIndex.RIGHT_ANKLE];

        // Basic visibility check
        const minVisibility = 0.5;
        const points = [leftHip, rightHip, leftKnee, rightKnee, leftAnkle, rightAnkle];

        if (points.some(p => !p || (p.visibility !== undefined && p.visibility < minVisibility))) {
            return { isGoodForm: false, feedback: ["Body not fully visible"], badPoints: [] };
        }

        // Knees caving in (Valgus)
        const hipWidth = Math.abs(leftHip.x - rightHip.x);
        const kneeWidth = Math.abs(leftKnee.x - rightKnee.x);
        if (kneeWidth < hipWidth * 0.8) {
            feedback.push("Knees caving in!");
            badPoints.push(PoseLandmarkIndex.LEFT_KNEE, PoseLandmarkIndex.RIGHT_KNEE);
            isGoodForm = false;
        }

        return { isGoodForm, feedback, badPoints };
    }

    private minKneeAngle = 180; // Track deepest point

    countReps(landmarks: Landmark[], isGoodForm: boolean): void {
        const leftHip = landmarks[PoseLandmarkIndex.LEFT_HIP];
        const rightHip = landmarks[PoseLandmarkIndex.RIGHT_HIP];
        const leftKnee = landmarks[PoseLandmarkIndex.LEFT_KNEE];
        const rightKnee = landmarks[PoseLandmarkIndex.RIGHT_KNEE];
        const leftAnkle = landmarks[PoseLandmarkIndex.LEFT_ANKLE];
        const rightAnkle = landmarks[PoseLandmarkIndex.RIGHT_ANKLE];

        const minVisibility = 0.5;
        const points = [leftHip, rightHip, leftKnee, rightKnee, leftAnkle, rightAnkle];

        if (points.some(p => !p || (p.visibility !== undefined && p.visibility < minVisibility))) return;

        // Calculate knee angles
        const leftKneeAngle = this.getAngle(leftHip, leftKnee, leftAnkle);
        const rightKneeAngle = this.getAngle(rightHip, rightKnee, rightAnkle);
        const avgKneeAngle = (leftKneeAngle + rightKneeAngle) / 2;

        // Check depth
        // Relaxed threshold: < 110 degrees is acceptable
        const isDeep = avgKneeAngle < 110;

        // Check standing
        // > 160 degrees is standing straight
        const isStanding = avgKneeAngle > 160;

        if (this.state.phase === 'start' || this.state.phase === 'up') {
            // Track minimum angle during non-rep phases to detect "almost" reps
            if (avgKneeAngle < this.minKneeAngle) {
                this.minKneeAngle = avgKneeAngle;
            }

            if (isDeep) {
                this.state.phase = 'down';
                this.state.isGoodRep = isGoodForm; // Start tracking rep quality
                this.minKneeAngle = 180; // Reset tracker
            } else if (isStanding && this.minKneeAngle < 140) {
                // If we went down significantly (e.g. < 140) but not enough to trigger rep (< 110)
                // and are now back up, give feedback.
                // Only trigger if we haven't already triggered a rep (phase is start/up)

                // Debounce/Check if we just finished a rep? 
                // Actually, minKneeAngle should be reset on successful rep start.
                // So if we are here, it means we went down and up WITHOUT triggering 'down'.

                this.state.feedback.push(`Go lower! Reached ${Math.round(this.minKneeAngle)}°`);
                this.minKneeAngle = 180; // Reset after feedback
            }

        } else if (this.state.phase === 'down') {
            // Update quality during the rep
            if (!isGoodForm) {
                this.state.isGoodRep = false;
            }

            // Check if returned to standing
            if (isStanding) {
                this.state.phase = 'up';
                if (this.state.isGoodRep) {
                    this.state.reps += 1;
                }
                this.minKneeAngle = 180; // Reset for next rep
            }
        }
    }
}
