/**
 * Interface representing a single point on the body from MediaPipe
 */
export interface Landmark {
    x: number;
    y: number;
    z: number;
    visibility?: number;
}

/**
 * Interface for the calculated biometric data used by the Agent
 */
export interface SquatBiometrics {
    squatDepth: number;
    torsoAngle: number;
    hipY: number;
    kneeY: number;
}

/**
 * Calculates the angle between three points (A -> B -> C).
 * B is the vertex (the joint).
 * @returns Angle in degrees (0-180)
 */
export function calculateAngle(a: Landmark, b: Landmark, c: Landmark): number {
    if (!a || !b || !c) return 0;

    // Math.atan2 returns angle in radians
    const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);

    // Convert to degrees
    let angle = Math.abs((radians * 180.0) / Math.PI);

    // Normalize to 0-180 range
    if (angle > 180.0) {
        angle = 360 - angle;
    }

    return Math.round(angle);
}

/**
 * Extracts specific squat metrics from the full pose landmarks array.
 * Indices based on MediaPipe Pose:
 * 11=L.Shoulder, 23=L.Hip, 25=L.Knee, 27=L.Ankle
 */
export function getSquatBiometrics(landmarks: Landmark[]): SquatBiometrics {
    if (landmarks.length < 33) {
        return { squatDepth: 180, torsoAngle: 180, hipY: 0, kneeY: 0 };
    }

    const shoulder = landmarks[11];
    const hip = landmarks[23];
    const knee = landmarks[25];
    const ankle = landmarks[27];

    // 1. Squat Depth (Hip -> Knee -> Ankle)
    // Standing ~180. Parallel ~90. Deep <90.
    const squatDepth = calculateAngle(hip, knee, ankle);

    // 2. Torso Lean (Shoulder -> Hip -> Knee)
    // Upright ~180. Leaning forward <130.
    const torsoAngle = calculateAngle(shoulder, hip, knee);

    return {
        squatDepth,
        torsoAngle,
        hipY: hip.y,
        kneeY: knee.y
    };
}