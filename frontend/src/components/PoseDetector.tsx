import React, { useRef, useEffect, useState } from 'react';
import Webcam from 'react-webcam';
import { Pose, POSE_CONNECTIONS, type Results } from '@mediapipe/pose';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';

interface PoseDetectorProps {
    exerciseId?: string;
    onRecordingComplete?: (data: any[]) => void;
}

const PoseDetector: React.FC<PoseDetectorProps> = ({ exerciseId = 'unknown', onRecordingComplete }) => {
    const webcamRef = useRef<Webcam>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isExerciseActive, setIsExerciseActive] = useState(false);
    const [isCountingDown, setIsCountingDown] = useState(false);
    const [countdownValue, setCountdownValue] = useState(3);

    const isExerciseActiveRef = useRef(isExerciseActive);
    const isCountingDownRef = useRef(isCountingDown);
    const exerciseIdRef = useRef(exerciseId);

    // Recording Ref
    const currentRecordingRef = useRef<any[]>([]);

    useEffect(() => {
        isExerciseActiveRef.current = isExerciseActive;
    }, [isExerciseActive]);

    useEffect(() => {
        isCountingDownRef.current = isCountingDown;
    }, [isCountingDown]);

    useEffect(() => {
        exerciseIdRef.current = exerciseId;
    }, [exerciseId]);

    // Countdown timer logic
    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (isCountingDown && countdownValue > 0) {
            interval = setInterval(() => {
                setCountdownValue((prev) => prev - 1);
            }, 1000);
        } else if (isCountingDown && countdownValue === 0) {
            setIsCountingDown(false);
            setIsExerciseActive(true);
            // Start recording
            currentRecordingRef.current = [];
        }
        return () => clearInterval(interval);
    }, [isCountingDown, countdownValue]);

    const startExercise = () => {
        if (isExerciseActive) {
            setIsExerciseActive(false);
            setIsCountingDown(false);
            setCountdownValue(3);

            // Stop recording and send data
            if (onRecordingComplete && currentRecordingRef.current.length > 0) {
                onRecordingComplete(currentRecordingRef.current);
            }
        } else {
            setIsCountingDown(true);
            setCountdownValue(3);
            currentRecordingRef.current = []; // Reset on start
        }
    };

    // Specific form check for Squats
    const checkSquatForm = (landmarks: any[]): number[] => {
        const badPoints: number[] = [];

        // Landmarks:
        // 0: nose
        // 15: left_wrist, 16: right_wrist
        // 23: left_hip, 24: right_hip
        // 25: left_knee, 26: right_knee
        // 27: left_ankle, 28: right_ankle

        // 1. Check Arms: Wrists should not be above the nose
        // Note: y increases downwards. So "above" means smaller y.
        const nose = landmarks[0];
        const leftWrist = landmarks[15];
        const rightWrist = landmarks[16];

        if (nose && leftWrist && rightWrist) {
            // Debug log for arms
            // console.log(`Nose Y: ${nose.y.toFixed(3)}, L.Wrist Y: ${leftWrist.y.toFixed(3)}, R.Wrist Y: ${rightWrist.y.toFixed(3)}`);

            // Strict check: if wrist is simply above the nose, it's too high for a standard squat
            if (leftWrist.y < nose.y) {
                console.log("Left wrist too high!");
                badPoints.push(15, 13); // Left wrist & elbow
            }
            if (rightWrist.y < nose.y) {
                console.log("Right wrist too high!");
                badPoints.push(16, 14); // Right wrist & elbow
            }
        }

        // 2. Check Knees: Valgus collapse (knees caving in)
        // Compare knee distance to hip distance
        const leftHip = landmarks[23];
        const rightHip = landmarks[24];
        const leftKnee = landmarks[25];
        const rightKnee = landmarks[26];

        if (leftHip && rightHip && leftKnee && rightKnee) {
            const hipWidth = Math.abs(leftHip.x - rightHip.x);
            const kneeWidth = Math.abs(leftKnee.x - rightKnee.x);

            // If knees are significantly closer than hips (e.g., < 80% of hip width)
            if (kneeWidth < hipWidth * 0.8) {
                console.log("Knees caving in!");
                badPoints.push(25, 26);
            }
        }

        // 3. Check Stance/Ankles: Basic symmetry check
        // If one foot is much further out than the other relative to hips
        const leftAnkle = landmarks[27];
        const rightAnkle = landmarks[28];

        if (leftHip && rightHip && leftAnkle && rightAnkle) {
            const leftDist = Math.abs(leftAnkle.x - leftHip.x);
            const rightDist = Math.abs(rightAnkle.x - rightHip.x);

            // If difference is large (> 50% difference)
            if (Math.abs(leftDist - rightDist) > Math.max(leftDist, rightDist) * 0.5) {
                // console.log("Stance asymmetry!");
                badPoints.push(27, 28);
            }
        }

        return badPoints;
    };

    // Main pose check function
    const checkPose = (landmarks: any[]): number[] => {
        // Dispatch to specific exercise logic
        // Use ref to get current exerciseId inside closure
        if (exerciseIdRef.current?.toLowerCase() === 'squats') {
            return checkSquatForm(landmarks);
        }

        // Default/Generic check (e.g. for other exercises or fallback)
        const badPoints: number[] = [];
        return badPoints;
    };

    const onResults = (results: Results) => {
        if (!canvasRef.current || !webcamRef.current || !webcamRef.current.video) return;

        const videoWidth = webcamRef.current.video.videoWidth;
        const videoHeight = webcamRef.current.video.videoHeight;

        canvasRef.current.width = videoWidth;
        canvasRef.current.height = videoHeight;

        const canvasElement = canvasRef.current;
        const canvasCtx = canvasElement.getContext('2d');

        if (canvasCtx) {
            canvasCtx.save();
            canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

            // Only draw skeleton if exercise is active AND we are NOT counting down
            if (results.poseLandmarks && isExerciseActiveRef.current && !isCountingDownRef.current) {

                // RECORD DATA
                // Prefer poseWorldLandmarks for 3D, fallback to poseLandmarks
                const frameData = results.poseWorldLandmarks || results.poseLandmarks;
                if (frameData) {
                    currentRecordingRef.current.push({
                        timestamp: Date.now(),
                        landmarks: frameData
                    });
                }

                const badPoints = checkPose(results.poseLandmarks);

                // Draw User Skeleton
                drawConnectors(canvasCtx, results.poseLandmarks, POSE_CONNECTIONS, {
                    color: '#00FF00',
                    lineWidth: 4,
                });

                drawLandmarks(canvasCtx, results.poseLandmarks, {
                    color: '#00FF00',
                    lineWidth: 2,
                    radius: 3,
                });

                // Highlight bad points
                for (const index of badPoints) {
                    const point = results.poseLandmarks[index];
                    if (point) {
                        const x = point.x * videoWidth;
                        const y = point.y * videoHeight;
                        canvasCtx.beginPath();
                        canvasCtx.arc(x, y, 15, 0, 2 * Math.PI); // Keep increased radius for visibility
                        canvasCtx.fillStyle = '#FF0000';
                        canvasCtx.fill();
                        canvasCtx.strokeStyle = '#FFFFFF';
                        canvasCtx.lineWidth = 2;
                        canvasCtx.stroke();
                    }
                }
            }
            canvasCtx.restore();
        }
    };

    useEffect(() => {
        const pose = new Pose({
            locateFile: (file) => {
                return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
            },
        });

        pose.setOptions({
            modelComplexity: 1,
            smoothLandmarks: true,
            enableSegmentation: false,
            smoothSegmentation: false,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5,
        });

        pose.onResults(onResults);

        let animationFrameId: number;

        const detectPose = async () => {
            if (
                webcamRef.current &&
                webcamRef.current.video &&
                webcamRef.current.video.readyState === 4
            ) {
                await pose.send({ image: webcamRef.current.video });
            }
            animationFrameId = requestAnimationFrame(detectPose);
        };

        detectPose();

        return () => {
            console.log("Cleaning up PoseDetector...");
            cancelAnimationFrame(animationFrameId);

            // 1. Manually stop tracks from the webcam ref
            if (webcamRef.current && webcamRef.current.video && webcamRef.current.video.srcObject) {
                const stream = webcamRef.current.video.srcObject as MediaStream;
                const tracks = stream.getTracks();
                tracks.forEach(track => {
                    console.log("Stopping track:", track.label);
                    track.stop();
                });
            }

            // 3. Close pose solution
            pose.close();
        };
    }, []);

    return (
        <div className="relative flex flex-col items-center justify-center p-6 bg-black/5 min-h-[600px]">
            <h1 className="text-3xl font-bold mb-4 text-gray-800 dark:text-white">SpottAIr Pose Trainer</h1>

            <div className="relative w-[640px] h-[480px] bg-black rounded-lg overflow-hidden shadow-2xl ring-1 ring-white/10">
                <Webcam
                    ref={webcamRef}
                    className="absolute top-0 left-0 w-full h-full object-cover"
                />
                <canvas
                    ref={canvasRef}
                    className="absolute top-0 left-0 w-full h-full object-cover"
                />

                {/* Countdown Overlay */}
                {isCountingDown && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-20 backdrop-blur-sm">
                        <div className="text-9xl font-black text-white animate-bounce drop-shadow-[0_5px_5px_rgba(0,0,0,0.5)]">
                            {countdownValue}
                        </div>
                    </div>
                )}
            </div>

            <div className="mt-8 z-10">
                <button
                    onClick={startExercise}
                    className={`px-8 py-4 rounded-full font-bold text-lg transition-all transform hover:scale-105 shadow-lg ${isExerciseActive || isCountingDown
                        ? 'bg-red-500 hover:bg-red-600 text-white ring-4 ring-red-500/30'
                        : 'bg-green-500 hover:bg-green-600 text-white ring-4 ring-green-500/30'
                        }`}
                >
                    {isExerciseActive ? 'Stop Exercise' : (isCountingDown ? 'Get Ready...' : 'Start Exercise')}
                </button>
            </div>
        </div>
    );
};

export default PoseDetector;
