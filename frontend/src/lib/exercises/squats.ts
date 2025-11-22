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
        const nose = landmarks[PoseLandmarkIndex.NOSE];
        const leftWrist = landmarks[PoseLandmarkIndex.LEFT_WRIST];
        const rightWrist = landmarks[PoseLandmarkIndex.RIGHT_WRIST];
        const leftShoulder = landmarks[PoseLandmarkIndex.LEFT_SHOULDER];
        const rightShoulder = landmarks[PoseLandmarkIndex.RIGHT_SHOULDER];

        // Basic visibility check
        const minVisibility = 0.5;
        const points = [leftHip, rightHip, leftKnee, rightKnee, leftAnkle, rightAnkle];

        if (points.some(p => !p || (p.visibility !== undefined && p.visibility < minVisibility))) {
            return { isGoodForm: false, feedback: ["Body not fully visible"], badPoints: [] };
        }

        // 1. Knees caving in (Valgus)
        const hipWidth = Math.abs(leftHip.x - rightHip.x);
        const kneeWidth = Math.abs(leftKnee.x - rightKnee.x);
        if (kneeWidth < hipWidth * 0.8) {
            feedback.push("Push your knees out!");
            badPoints.push(PoseLandmarkIndex.LEFT_KNEE, PoseLandmarkIndex.RIGHT_KNEE);
            isGoodForm = false;
        }

        // 2. Hands above head check
        // Y increases downwards, so smaller Y is higher
        if (nose && leftWrist && rightWrist) {
            if (leftWrist.y < nose.y || rightWrist.y < nose.y) {
                feedback.push("Lower your hands!");
                badPoints.push(PoseLandmarkIndex.LEFT_WRIST, PoseLandmarkIndex.RIGHT_WRIST);
                isGoodForm = false;
            }
        }

        // 3. Foot placement (Stance width)
        // Feet should be roughly shoulder width apart
        if (leftShoulder && rightShoulder) {
            const shoulderWidth = Math.abs(leftShoulder.x - rightShoulder.x);
            const ankleWidth = Math.abs(leftAnkle.x - rightAnkle.x);

            // Too narrow (< 80% shoulder width)
            if (ankleWidth < shoulderWidth * 0.8) {
                feedback.push("Widen your stance!");
                badPoints.push(PoseLandmarkIndex.LEFT_ANKLE, PoseLandmarkIndex.RIGHT_ANKLE);
                isGoodForm = false;
            }
            // Too wide (> 150% shoulder width)
            else if (ankleWidth > shoulderWidth * 1.5) {
                feedback.push("Narrow your stance!");
                badPoints.push(PoseLandmarkIndex.LEFT_ANKLE, PoseLandmarkIndex.RIGHT_ANKLE);
                isGoodForm = false;
            }
        }

        return { isGoodForm, feedback, badPoints };
    }

    private minKneeAngle = 180; // Track deepest point
    private startKneeAngle = 180; // Track angle at start of rep
    private repStartTime = 0; // Track when the rep started

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
                this.minKneeAngle = avgKneeAngle; // Initialize with current angle
                this.startKneeAngle = avgKneeAngle; // Track start angle
                this.repStartTime = Date.now(); // Start timer
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
            // Update minimum angle
            if (avgKneeAngle < this.minKneeAngle) {
                this.minKneeAngle = avgKneeAngle;
            }

            // Update quality during the rep
            if (!isGoodForm) {
                this.state.isGoodRep = false;
            }

            // Check if returned to standing
            if (isStanding) {
                this.state.phase = 'up';
                if (this.state.isGoodRep) {
                    this.state.reps += 1;
                    const duration = (Date.now() - this.repStartTime) / 1000;
                    this.state.lastRepDuration = duration;

                    // Record history
                    this.state.history.push({
                        duration: duration,
                        feedback: [...this.state.feedback], // Capture feedback at end of rep
                        minAngles: { "knee": this.minKneeAngle },
                        startAngles: { "knee": this.startKneeAngle },
                        isValid: true
                    });
                } else {
                    // Record failed rep? User only asked for "reps", implying successful ones?
                    // But feedback on failed reps is useful. Let's record it but mark isValid=false
                    // if we want to track failed attempts. For now, let's stick to counted reps
                    // or maybe we should track everything.
                    // The prompt says "Number of Reps" and "For each Rep".
                    // Usually "Reps" means successful ones.
                    // But "feedback given" implies we want to know about mistakes.
                    // Let's record it if it was a "rep attempt" (went down and up).

                    const duration = (Date.now() - this.repStartTime) / 1000;
                    this.state.history.push({
                        duration: duration,
                        feedback: [...this.state.feedback],
                        minAngles: { "knee": this.minKneeAngle },
                        startAngles: { "knee": this.startKneeAngle },
                        isValid: false
                    });
                }
                this.minKneeAngle = 180; // Reset for next rep
            }
        }
    }
}
