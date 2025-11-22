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

    // Metrics tracking
    private descentStartTime = 0;
    private bottomTime = 0;
    private hipStartX = 0;
    private maxHipSway = 0;
    private maxTorsoAngle = 0;
    private maxKneeDiff = 0;

    private getVerticalAngle(top: Landmark, bottom: Landmark): number {
        return Math.abs(Math.atan2(top.x - bottom.x, top.y - bottom.y) * 180.0 / Math.PI);
    }

    countReps(landmarks: Landmark[], isGoodForm: boolean): void {
        const leftHip = landmarks[PoseLandmarkIndex.LEFT_HIP];
        const rightHip = landmarks[PoseLandmarkIndex.RIGHT_HIP];
        const leftKnee = landmarks[PoseLandmarkIndex.LEFT_KNEE];
        const rightKnee = landmarks[PoseLandmarkIndex.RIGHT_KNEE];
        const leftAnkle = landmarks[PoseLandmarkIndex.LEFT_ANKLE];
        const rightAnkle = landmarks[PoseLandmarkIndex.RIGHT_ANKLE];
        const leftShoulder = landmarks[PoseLandmarkIndex.LEFT_SHOULDER];
        const rightShoulder = landmarks[PoseLandmarkIndex.RIGHT_SHOULDER];

        const minVisibility = 0.5;
        const points = [leftHip, rightHip, leftKnee, rightKnee, leftAnkle, rightAnkle, leftShoulder, rightShoulder];

        if (points.some(p => !p || (p.visibility !== undefined && p.visibility < minVisibility))) return;

        // Calculate knee angles
        const leftKneeAngle = this.getAngle(leftHip, leftKnee, leftAnkle);
        const rightKneeAngle = this.getAngle(rightHip, rightKnee, rightAnkle);
        const avgKneeAngle = (leftKneeAngle + rightKneeAngle) / 2;

        // Calculate metrics
        const kneeDiff = Math.abs(leftKneeAngle - rightKneeAngle);

        // Torso angle (lean forward)
        const leftTorsoAngle = this.getVerticalAngle(leftShoulder, leftHip);
        const rightTorsoAngle = this.getVerticalAngle(rightShoulder, rightHip);
        const avgTorsoAngle = (leftTorsoAngle + rightTorsoAngle) / 2;

        // Hip sway (center x)
        const hipCenter = (leftHip.x + rightHip.x) / 2;

        // Check depth
        // Relaxed threshold: < 110 degrees is acceptable
        const isDeep = avgKneeAngle < 110;

        // Check standing
        // > 160 degrees is standing straight
        const isStanding = avgKneeAngle > 160;

        // Start of descent detection (when standing and starting to bend)
        if (this.state.phase === 'start' || this.state.phase === 'up') {
            if (avgKneeAngle < 170 && this.descentStartTime === 0) {
                this.descentStartTime = Date.now();
                this.hipStartX = hipCenter;
                this.maxHipSway = 0;
                this.maxTorsoAngle = 0;
                this.maxKneeDiff = 0;
            }

            // Reset if we go back to fully standing without rep
            if (avgKneeAngle > 175) {
                this.descentStartTime = 0;
            }
        }

        // Track metrics during movement
        if (this.descentStartTime > 0) {
            this.maxKneeDiff = Math.max(this.maxKneeDiff, kneeDiff);
            this.maxTorsoAngle = Math.max(this.maxTorsoAngle, avgTorsoAngle);
            this.maxHipSway = Math.max(this.maxHipSway, Math.abs(hipCenter - this.hipStartX));
        }

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
                this.bottomTime = Date.now(); // Mark bottom time
            } else if (isStanding && this.minKneeAngle < 140) {
                // If we went down significantly (e.g. < 140) but not enough to trigger rep (< 110)
                // and are now back up, give feedback.
                this.state.feedback.push(`Go lower! Reached ${Math.round(this.minKneeAngle)}°`);
                this.minKneeAngle = 180; // Reset after feedback
                this.descentStartTime = 0; // Reset metrics
            }

        } else if (this.state.phase === 'down') {
            // Update minimum angle and bottom time
            if (avgKneeAngle < this.minKneeAngle) {
                this.minKneeAngle = avgKneeAngle;
                this.bottomTime = Date.now();
            }

            // Update quality during the rep
            if (!isGoodForm) {
                this.state.isGoodRep = false;
            }

            // Check if returned to standing
            if (isStanding) {
                this.state.phase = 'up';
                const now = Date.now();

                // Calculate durations
                // If descentStartTime wasn't captured correctly, fallback to repStartTime
                const startT = this.descentStartTime > 0 ? this.descentStartTime : this.repStartTime;
                const eccentricDur = (this.bottomTime - startT) / 1000;
                const concentricDur = (now - this.bottomTime) / 1000;
                const totalDur = (now - startT) / 1000;

                const metrics = {
                    "eccentric_duration": Math.max(0, eccentricDur),
                    "concentric_duration": Math.max(0, concentricDur),
                    "hip_sway": this.maxHipSway,
                    "torso_angle": this.maxTorsoAngle,
                    "knee_symmetry": this.maxKneeDiff
                };

                if (this.state.isGoodRep) {
                    this.state.reps += 1;
                    this.state.lastRepDuration = totalDur;

                    // Record history
                    this.state.history.push({
                        duration: totalDur,
                        feedback: [...this.state.feedback], // Capture feedback at end of rep
                        minAngles: { "knee": this.minKneeAngle },
                        startAngles: { "knee": this.startKneeAngle },
                        metrics: metrics,
                        isValid: true
                    });
                } else {
                    this.state.history.push({
                        duration: totalDur,
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
