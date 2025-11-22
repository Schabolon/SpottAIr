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
        <div className="flex flex-col lg:flex-row gap-6 h-full p-6 bg-black/5">
            {/* Camera View */}
            <div className="relative flex-1 bg-black rounded-3xl overflow-hidden shadow-2xl ring-1 ring-white/10 group">
                <Webcam
                    ref={webcamRef}
                    className="absolute inset-0 w-full h-full object-cover"
                />
                <canvas
                    ref={canvasRef}
                    className="absolute inset-0 w-full h-full object-cover"
                />

                {/* Countdown Overlay */}
                {isCountingDown && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-20 backdrop-blur-sm">
                        <div className="text-[12rem] font-black text-white animate-in zoom-in duration-300 drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)]">
                            {countdownValue}
                        </div>
                    </div>
                )}

                {/* Floating Controls */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <button
                        onClick={startExercise}
                        className={`flex items-center gap-3 px-8 py-4 rounded-full font-bold text-lg shadow-2xl transition-all transform hover:scale-105 backdrop-blur-md ${isExerciseActive || isCountingDown
                            ? 'bg-red-500/90 hover:bg-red-600 text-white shadow-red-500/20'
                            : 'bg-white/90 hover:bg-white text-black shadow-white/20'
                            }`}
                    >
                        {isExerciseActive ? (
                            <>
                                <span className="w-4 h-4 bg-current rounded-sm" />
                                Stop Session
                            </>
                        ) : isCountingDown ? (
                            <>
                                <span className="animate-spin text-2xl">⏳</span>
                                Get Ready...
                            </>
                        ) : (
                            <>
                                <span className="w-0 h-0 border-t-[8px] border-t-transparent border-l-[14px] border-l-current border-b-[8px] border-b-transparent ml-1" />
                                Start Exercise
                            </>
                        )}
                    </button>
                </div>

                {/* Status Badge */}
                <div className="absolute top-6 left-6 z-10">
                    <div className={`px-4 py-2 rounded-full backdrop-blur-md border border-white/10 flex items-center gap-2 ${isExerciseActive
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-black/40 text-white/60'
                        }`}>
                        <div className={`w-2 h-2 rounded-full ${isExerciseActive ? 'bg-green-500 animate-pulse' : 'bg-white/40'}`} />
                        <span className="text-sm font-medium uppercase tracking-wider">
                            {isExerciseActive ? 'Live Analysis' : 'Camera Ready'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Sidebar Stats */}
            <div className="w-full lg:w-[400px] flex flex-col gap-4">
                {/* Rep Counter */}
                <div className={`relative overflow-hidden p-8 rounded-3xl shadow-lg border transition-all duration-500 ${exerciseState.isGoodRep
                    ? 'bg-gradient-to-br from-green-500/10 to-emerald-500/5 border-green-500/20'
                    : 'bg-gradient-to-br from-yellow-500/10 to-orange-500/5 border-yellow-500/20'
                    }`}>
                    <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">Current Reps</h2>
                    <div className="flex items-baseline gap-2">
                        <span className={`text-8xl font-black tracking-tighter ${exerciseState.isGoodRep ? 'text-green-500' : 'text-yellow-500'
                            }`}>
                            {exerciseState.reps}
                        </span>
                        <span className="text-3xl font-medium text-muted-foreground">/ {targetReps}</span>
                    </div>

                    {/* Progress Bar */}
                    <div className="absolute bottom-0 left-0 w-full h-1.5 bg-muted/30">
                        <div
                            className={`h-full transition-all duration-500 ${exerciseState.isGoodRep ? 'bg-green-500' : 'bg-yellow-500'}`}
                            style={{ width: `${Math.min((exerciseState.reps / targetReps) * 100, 100)}%` }}
                        />
                    </div>
                </div>

                {/* Feedback Panel */}
                <div className="flex-1 bg-card/50 backdrop-blur-sm rounded-3xl border shadow-sm p-6 flex flex-col">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        Real-time Feedback
                    </h2>

                    <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                        {exerciseState.feedback.length > 0 ? (
                            exerciseState.feedback.map((msg, i) => (
                                <div key={i} className="flex items-start gap-3 p-4 rounded-2xl bg-red-500/5 border border-red-500/10 text-red-600 dark:text-red-400 animate-in slide-in-from-right-4 duration-300">
                                    <span className="text-xl mt-0.5">⚠️</span>
                                    <p className="font-medium leading-snug">{msg}</p>
                                </div>
                            ))
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-muted-foreground/50 gap-4">
                                {isExerciseActive ? (
                                    <>
                                        <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">
                                            <span className="text-3xl">✨</span>
                                        </div>
                                        <p className="text-center font-medium">Perfect Form!</p>
                                    </>
                                ) : (
                                    <>
                                        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                                            <span className="text-3xl">📷</span>
                                        </div>
                                        <p className="text-center">Start exercise to<br />receive feedback</p>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PoseDetector;
