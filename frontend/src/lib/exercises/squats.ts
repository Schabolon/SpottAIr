import { BaseExerciseProcessor, Landmark } from './types';

export class SquatProcessor extends BaseExerciseProcessor {

    checkForm(landmarks: Landmark[]): { isGoodForm: boolean; feedback: string[]; badPoints: number[] } {
        const feedback: string[] = [];
        const badPoints: number[] = [];
        let isGoodForm = true;

        const leftHip = landmarks[23];
        const rightHip = landmarks[24];
        const leftKnee = landmarks[25];
        const rightKnee = landmarks[26];
        const leftAnkle = landmarks[27];
        const rightAnkle = landmarks[28];

        // Basic visibility check
        if (!leftHip || !rightHip || !leftKnee || !rightKnee || !leftAnkle || !rightAnkle) {
            return { isGoodForm: false, feedback: ["Body not fully visible"], badPoints: [] };
        }

        // Knees caving in (Valgus)
        const hipWidth = Math.abs(leftHip.x - rightHip.x);
        const kneeWidth = Math.abs(leftKnee.x - rightKnee.x);
        if (kneeWidth < hipWidth * 0.8) {
            feedback.push("Knees caving in!");
            badPoints.push(25, 26);
            isGoodForm = false;
        }

        return { isGoodForm, feedback, badPoints };
    }

    countReps(landmarks: Landmark[], isGoodForm: boolean): void {
        const leftHip = landmarks[23];
        const rightHip = landmarks[24];
        const leftKnee = landmarks[25];
        const rightKnee = landmarks[26];
        const leftAnkle = landmarks[27];
        const rightAnkle = landmarks[28];

        if (!leftHip || !rightHip || !leftKnee || !rightKnee || !leftAnkle || !rightAnkle) return;

        // Calculate knee angles
        const leftKneeAngle = this.getAngle(leftHip, leftKnee, leftAnkle);
        const rightKneeAngle = this.getAngle(rightHip, rightKnee, rightAnkle);
        const avgKneeAngle = (leftKneeAngle + rightKneeAngle) / 2;

        // Check depth
        // < 90 degrees is a good deep squat
        // < 100 degrees is acceptable parallel squat
        const isDeep = avgKneeAngle < 100;

        // Check standing
        // > 160 degrees is standing straight
        const isStanding = avgKneeAngle > 160;

        if (this.state.phase === 'start' || this.state.phase === 'up') {
            if (isDeep) {
                this.state.phase = 'down';
                this.state.isGoodRep = isGoodForm; // Start tracking rep quality
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
            }
        }
    }
}
