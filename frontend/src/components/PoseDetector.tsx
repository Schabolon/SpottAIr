import React, { useRef, useEffect, useState } from 'react';
import Webcam from 'react-webcam';
import { Pose, POSE_CONNECTIONS, type Results } from '@mediapipe/pose';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';
import { getProcessor } from '../lib/exercises/registry';
import { ExerciseState } from '../lib/exercises/types';

interface PoseDetectorProps {
    exerciseId?: string;
    targetReps?: number;
    onRecordingComplete?: (data: any[]) => void;
}

const PoseDetector: React.FC<PoseDetectorProps> = ({ exerciseId = 'unknown', targetReps = 10, onRecordingComplete }) => {
    const webcamRef = useRef<Webcam>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isExerciseActive, setIsExerciseActive] = useState(false);
    const [isCountingDown, setIsCountingDown] = useState(false);
    const [countdownValue, setCountdownValue] = useState(3);

    // Exercise State
    const [exerciseState, setExerciseState] = useState<ExerciseState>({
        reps: 0,
        phase: 'start',
        feedback: [],
        isGoodRep: true,
        badPoints: []
    });

    const isExerciseActiveRef = useRef(isExerciseActive);
    const isCountingDownRef = useRef(isCountingDown);
    const exerciseIdRef = useRef(exerciseId);
    const processorRef = useRef(getProcessor(exerciseId));

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
        processorRef.current = getProcessor(exerciseId);
        setExerciseState({
            reps: 0,
            phase: 'start',
            feedback: [],
            isGoodRep: true,
            badPoints: []
        });
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
            processorRef.current.reset();
            setExerciseState(prev => ({ ...prev, reps: 0 }));
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
            processorRef.current.reset();
            setExerciseState({
                reps: 0,
                phase: 'start',
                feedback: [],
                isGoodRep: true,
                badPoints: []
            });
        } else {
            setIsCountingDown(true);
            setCountdownValue(3);
            currentRecordingRef.current = []; // Reset on start
        }
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

                // PROCESS EXERCISE
                // Map MediaPipe landmarks to our simple interface (just x, y, z)
                // Note: MediaPipe landmarks are normalized [0,1]
                const processedState = processorRef.current.process(results.poseLandmarks);

                // Update state for UI (throttling might be needed for performance, but React handles it okay usually)
                // We use a ref for immediate drawing, but state for UI
                // To avoid too many re-renders, we could throttle this setExerciseState
                setExerciseState(processedState);

                // Draw User Skeleton
                drawConnectors(canvasCtx, results.poseLandmarks, POSE_CONNECTIONS, {
                    color: processedState.isGoodRep ? '#00FF00' : '#FFFF00', // Yellow if current rep is bad
                    lineWidth: 4,
                });

                drawLandmarks(canvasCtx, results.poseLandmarks, {
                    color: processedState.isGoodRep ? '#00FF00' : '#FFFF00',
                    lineWidth: 2,
                    radius: 3,
                });

                // Highlight bad points
                for (const index of processedState.badPoints) {
                    const point = results.poseLandmarks[index];
                    if (point) {
                        const x = point.x * videoWidth;
                        const y = point.y * videoHeight;
                        canvasCtx.beginPath();
                        canvasCtx.arc(x, y, 15, 0, 2 * Math.PI);
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
        <div className="relative flex flex-row items-start justify-center p-6 bg-black/5 min-h-[600px] gap-6">

            {/* Camera View */}
            <div className="relative flex flex-col items-center">
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

            {/* Stats Panel */}
            <div className="w-[300px] flex flex-col gap-4">
                {/* Rep Counter */}
                <div className={`p-6 rounded-2xl shadow-xl transition-colors duration-300 ${exerciseState.isGoodRep ? 'bg-green-100 dark:bg-green-900/30' : 'bg-yellow-100 dark:bg-yellow-900/30'
                    }`}>
                    <h2 className="text-xl font-semibold text-gray-600 dark:text-gray-300 mb-2">Reps</h2>
                    <div className={`text-8xl font-black ${exerciseState.isGoodRep ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'
                        }`}>
                        {exerciseState.reps} <span className="text-4xl text-gray-400">/ {targetReps}</span>
                    </div>
                </div>

                {/* Feedback */}
                <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-xl flex-grow">
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Feedback</h2>
                    {exerciseState.feedback.length > 0 ? (
                        <ul className="space-y-2">
                            {exerciseState.feedback.map((msg, i) => (
                                <li key={i} className="flex items-center gap-2 text-red-500 font-medium animate-pulse">
                                    <span className="text-2xl">⚠</span>
                                    {msg}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400">
                            {isExerciseActive ? (
                                <>
                                    <span className="text-4xl mb-2">✓</span>
                                    <p>Good Form</p>
                                </>
                            ) : (
                                <>
                                    <span className="text-4xl mb-2">⏳</span>
                                    <p className="text-center">Waiting for training<br />to start...</p>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PoseDetector;
