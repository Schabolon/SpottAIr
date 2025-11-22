import React, { useRef, useEffect, useState } from 'react';
import Webcam from 'react-webcam';
import { Sparkles } from 'lucide-react';
import { Pose, POSE_CONNECTIONS, type Results } from '@mediapipe/pose';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';
import { getProcessor } from '../lib/exercises/registry';
import { ExerciseState } from '../lib/exercises/types';
import ReactMarkdown from 'react-markdown';
import { useSpottair } from '@/lib/spottair';
import * as tf from '@tensorflow/tfjs';

interface PoseDetectorProps {
    exerciseId?: string;
    targetReps?: number;
    onRecordingComplete?: (data: any[]) => void;
}

const PoseDetector: React.FC<PoseDetectorProps> = ({ exerciseId = 'unknown', targetReps = 10, onRecordingComplete }) => {
    const webcamRef = useRef<Webcam>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isExerciseActive, setIsExerciseActive] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<string | null>(null);
    const [isCountingDown, setIsCountingDown] = useState(false);
    const [countdownValue, setCountdownValue] = useState(3);

    // Exercise State
    const [poseState, setPoseState] = useState<ExerciseState>({
        reps: 0,
        phase: 'start',
        feedback: [],
        isGoodRep: true,
        badPoints: [],
        lastRepDuration: 0,
        history: []
    });

    useEffect(() => {
        if (poseState.reps >= targetReps && isExerciseActive && !isAnalyzing) {
            setIsExerciseActive(false);
            setIsAnalyzing(true);

            // Prepare session data
            const sessionData = {
                exercise_name: exerciseId,
                total_reps: poseState.reps,
                reps: poseState.history.map(h => ({
                    duration: h.duration,
                    feedback: h.feedback,
                    min_angles: h.minAngles,
                    is_valid: h.isValid,
                    start_angles: h.startAngles
                }))
            };

            // Call API
            fetch('http://localhost:8000/api/v1/route', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    session_data: sessionData
                })
            })
                .then(async res => {
                    if (!res.ok) {
                        const errText = await res.text();
                        throw new Error(`API Error: ${res.status} ${errText}`);
                    }
                    return res.json();
                })
                .then(data => {
                    setAnalysisResult(data.text);
                    setIsAnalyzing(false);
                })
                .catch(err => {
                    console.error("Analysis failed", err);
                    setAnalysisResult(`Error: ${err.message}`);
                    setIsAnalyzing(false);
                });
        }
    }, [poseState.reps, targetReps, isExerciseActive, isAnalyzing, exerciseId, poseState.history]);

    const isExerciseActiveRef = useRef(isExerciseActive);
    const isCountingDownRef = useRef(isCountingDown);
    const exerciseIdRef = useRef(exerciseId);
    const processorRef = useRef(getProcessor(exerciseId));

    // Recording Ref
    const currentRecordingRef = useRef<any[]>([]);


    const modelRef = useRef<tf.GraphModel | null>(null);

    // Load SpottAIr model
    const { model, isLoading, error, runInference } = useSpottair('/models/model.json', 'tflite');

    const isLoadingRef = useRef(isLoading);

    useEffect(() => {
        isExerciseActiveRef.current = isExerciseActive;
    }, [isExerciseActive]);

    useEffect(() => {
        isCountingDownRef.current = isCountingDown;
    }, [isCountingDown]);

    useEffect(() => {
        exerciseIdRef.current = exerciseId;
        processorRef.current = getProcessor(exerciseId);
        setPoseState({
            reps: 0,
            phase: 'start',
            feedback: [],
            isGoodRep: true,
            badPoints: [],
            lastRepDuration: 0,
            history: []
        });
    }, [exerciseId]);

    useEffect(() => {
        modelRef.current = model;
    }, [model]);

    useEffect(() => {
        isLoadingRef.current = isLoading;
    }, [isLoading]);

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
            setPoseState(prev => ({ ...prev, reps: 0 }));
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
            setPoseState({
                reps: 0,
                phase: 'start',
                feedback: [],
                isGoodRep: true,
                badPoints: [],
                lastRepDuration: 0,
                history: []
            });
        } else {
            setIsCountingDown(true);
            setCountdownValue(3);
            currentRecordingRef.current = []; // Reset on start
        }
    };

    const [currentFeedbackClass, setCurrentFeedbackClass] = useState<string>('correct');
    const [debugInfo, setDebugInfo] = useState<{ class: string, confidence: number } | null>(null);
    const lastClassChangeTimeRef = useRef<number>(0);
    const pendingClassRef = useRef<string | null>(null);
    const currentFeedbackClassRef = useRef<string>('correct'); // Ref to track current state without dependency issues

    const onResults = (results: Results) => {
        if (!canvasRef.current || !webcamRef.current || !webcamRef.current.video) return;

        // ✅ Check if we have landmarks AND model is ready before running inference
        if (results.poseLandmarks && model && !isLoading) {
            try {
                let detectedClass = "correct";
                let rawClass = "correct";
                let rawConfidence = 0;

                // 1. Visibility Check (Landmarks 11-32: Shoulders to Feet)
                // We skip 0-10 (face) as requested
                const bodyLandmarks = results.poseLandmarks.slice(11, 33);
                const isVisible = bodyLandmarks.every(lm => lm.visibility && lm.visibility > 0.5);

                if (!isVisible) {
                    detectedClass = "not_visible";
                } else {
                    // 2. Run Inference
                    const output = runInference(results.poseLandmarks);
                    if (output) {
                        // console.log('SpottAIr Output:', output);
                        // Find index of max value
                        const maxVal = Math.max(...output);
                        const maxIndex = output.indexOf(maxVal);
                        const classes = ["correct", "feet_wide", "knees_caved", "spine_misalignment"];

                        rawClass = classes[maxIndex] || "unknown";
                        rawConfidence = maxVal;

                        // 3. Confidence Threshold (> 0.8)
                        if (maxVal > 0.8) {
                            detectedClass = classes[maxIndex] || "correct";
                        } else {
                            detectedClass = "correct";
                        }
                    }
                }

                // Update debug info (throttled slightly by React state batching, but good enough)
                setDebugInfo({ class: rawClass, confidence: rawConfidence });

                const now = Date.now();

                // 4. Debouncing Logic
                // Case A: Error -> Correct (Immediate)
                if (detectedClass === 'correct' && currentFeedbackClassRef.current !== 'correct') {
                    setCurrentFeedbackClass('correct');
                    currentFeedbackClassRef.current = 'correct';
                    pendingClassRef.current = null;
                }
                // Case B: Any other change (Debounced 500ms)
                // This covers: Correct -> Error, Error A -> Error B, Correct -> Not Visible
                else if (detectedClass !== currentFeedbackClassRef.current) {
                    if (detectedClass === pendingClassRef.current) {
                        // If we've been seeing this new class for > 500ms, switch to it
                        if (now - lastClassChangeTimeRef.current > 500) {
                            setCurrentFeedbackClass(detectedClass);
                            currentFeedbackClassRef.current = detectedClass;
                            pendingClassRef.current = null;
                        }
                    } else {
                        // New potential class detected, start timer
                        pendingClassRef.current = detectedClass;
                        lastClassChangeTimeRef.current = now;
                    }
                } else {
                    // We are back to the current class, reset pending
                    pendingClassRef.current = null;
                }

            } catch (err) {
                console.error('Error running SpottAIr inference:', err);
            }
        } else {
            // Debug: log why inference isn't running
            // if (!results.poseLandmarks) console.log('No pose landmarks detected');
            // if (!model) console.log('Model not ready');
        }

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
                setPoseState(processedState);

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

    const poseRef = useRef<Pose | null>(null);
    const requestRef = useRef<number | undefined>(undefined);

    // Initialize Pose instance once
    useEffect(() => {
        if (isLoading || !model) {
            return;
        }
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
        poseRef.current = pose;

        return () => {
            pose.close();
        };
    }, [model, isLoading]);

    // Control the detection loop based on active state
    useEffect(() => {
        const detectPose = async () => {
            if (
                webcamRef.current &&
                webcamRef.current.video &&
                webcamRef.current.video.readyState === 4 &&
                poseRef.current
            ) {
                await poseRef.current.send({ image: webcamRef.current.video });
            }
            requestRef.current = requestAnimationFrame(detectPose);
        };

        if (isExerciseActive || isCountingDown) {
            // Start loop
            requestRef.current = requestAnimationFrame(detectPose);
        } else {
            // Stop loop and clear canvas
            if (requestRef.current) {
                cancelAnimationFrame(requestRef.current);
            }
            if (canvasRef.current) {
                const ctx = canvasRef.current.getContext('2d');
                if (ctx) {
                    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
                }
            }
        }

        return () => {
            if (requestRef.current) {
                cancelAnimationFrame(requestRef.current);
            }
        };
    }, [isExerciseActive, isCountingDown]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            console.log("Cleaning up PoseDetector...");
            if (webcamRef.current && webcamRef.current.video && webcamRef.current.video.srcObject) {
                const stream = webcamRef.current.video.srcObject as MediaStream;
                const tracks = stream.getTracks();
                tracks.forEach(track => {
                    console.log("Stopping track:", track.label);
                    track.stop();
                });
            }
        };
    }, [model, isLoading]); // ✅ ADD THESE DEPENDENCIES!}, [model, isLoading]); // ✅ ADD THESE DEPENDENCIES!
    return (
        <div className="flex flex-col lg:flex-row gap-6 h-full pt-6">
            {/* Camera View */}
            <div className="relative flex-1 bg-black rounded-3xl overflow-hidden shadow-2xl ring-1 ring-white/10 group">
                <Webcam
                    ref={webcamRef}
                    className="absolute inset-0 w-full h-full object-cover scale-x-[-1]"
                />
                <canvas
                    ref={canvasRef}
                    className="absolute inset-0 w-full h-full object-cover scale-x-[-1]"
                />

                {isCountingDown && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 z-20 backdrop-blur-sm">
                        <div className="text-9xl font-bold tracking-tighter text-white animate-in zoom-in duration-300 drop-shadow-2xl">
                            {countdownValue}
                        </div>
                    </div>
                )}

                {/* Floating Controls */}
                {/* Floating Controls */}
                {/* Floating Controls */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
                    <button
                        onClick={startExercise}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-full font-semibold text-sm shadow-lg transition-all transform hover:scale-105 active:scale-95 backdrop-blur-md border ${isExerciseActive || isCountingDown
                            ? 'bg-red-500 text-white border-red-400 shadow-red-500/20'
                            : 'bg-white/90 text-black border-white/20 shadow-black/5'
                            }`}
                    >
                        {isExerciseActive ? (
                            <>
                                <div className="w-3 h-3 bg-current rounded-[2px]" />
                                <span>Stop Session</span>
                            </>
                        ) : isCountingDown ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                <span>Get Ready...</span>
                            </>
                        ) : (
                            <>
                                <div className="w-0 h-0 border-t-[5px] border-t-transparent border-l-[8px] border-l-current border-b-[5px] border-b-transparent ml-0.5" />
                                <span>Start Exercise</span>
                            </>
                        )}
                    </button>
                </div>

                {/* Status Badge - Minimal */}
                <div className="absolute top-6 left-6 z-10">
                    {isExerciseActive && (
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/20 backdrop-blur-md border border-white/10">
                            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                            <span className="text-xs font-medium text-white/80 uppercase tracking-wider">REC</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Sidebar Stats */}
            <div className="w-full lg:w-[320px] flex flex-col gap-4">
                {/* Rep Counter */}
                {/* Rep Counter */}
                <div className="relative overflow-hidden p-6 rounded-3xl shadow-sm border bg-card text-card-foreground">
                    <h2 className="text-base font-semibold mb-2 flex items-center gap-2">Current Reps</h2>
                    <div className="flex items-baseline gap-2">
                        <span className="text-7xl font-bold tracking-tight">
                            {poseState.reps}
                        </span>
                        <span className="text-2xl font-light text-muted-foreground">/ {targetReps}</span>
                    </div>

                    {/* Progress Bar */}
                    <div className="absolute bottom-0 left-0 w-full h-1 bg-muted">
                        <div
                            className="h-full transition-all duration-500 bg-primary"
                            style={{ width: `${Math.min((poseState.reps / targetReps) * 100, 100)}%` }}
                        />
                    </div>
                    {poseState.reps > 0 && (
                        <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                            <span className="font-medium text-foreground">Last Rep:</span> {poseState.lastRepDuration?.toFixed(1) || '0.0'}s
                        </div>
                    )}
                </div>

                {/* Feedback Panel */}
                <div className={`flex-1 backdrop-blur-sm rounded-3xl border shadow-sm p-6 flex flex-col transition-colors duration-300 ${currentFeedbackClass === 'not_visible' ? 'bg-yellow-500/10 border-yellow-500/50' : currentFeedbackClass !== 'correct' ? 'bg-red-500/10 border-red-500/50' : 'bg-card/50 border-border'}`}>
                    <h2 className="text-base font-semibold mb-4 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-purple-500 fill-purple-500/20" />
                            <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                                Real-time AI Analysis
                            </span>
                        </div>
                        {debugInfo && (
                            <div className="text-[10px] font-mono text-muted-foreground opacity-50">
                                {debugInfo.class}: {(debugInfo.confidence * 100).toFixed(0)}%
                            </div>
                        )}
                    </h2>

                    <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar flex flex-col items-center justify-center">
                        {currentFeedbackClass === 'correct' ? (
                            <div className="h-full flex flex-col items-center justify-center text-muted-foreground/50 gap-4">
                                {isExerciseActive ? (
                                    <>
                                        <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center animate-pulse">
                                            <span className="text-3xl">✨</span>
                                        </div>
                                        <p className="text-center font-medium text-green-500">Perfect Form!</p>
                                    </>
                                ) : (
                                    <>
                                        <div className="w-16 h-16 rounded-full bg-purple-500/10 flex items-center justify-center">
                                            <Sparkles className="w-8 h-8 text-purple-500" />
                                        </div>
                                        <p className="text-center">Start exercise to<br />receive feedback</p>
                                    </>
                                )}
                            </div>
                        ) : currentFeedbackClass === 'not_visible' ? (
                            <div className="flex flex-col items-center gap-4 animate-in zoom-in duration-300">
                                <div className="w-20 h-20 rounded-full bg-yellow-500/20 flex items-center justify-center border-2 border-yellow-500 animate-pulse">
                                    <span className="text-4xl">📷</span>
                                </div>
                                <div className="text-center">
                                    <h3 className="text-xl font-bold text-yellow-500 mb-1">Visibility Issue</h3>
                                    <p className="text-yellow-400 font-medium">
                                        Ensure full body is visible
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-4 animate-in zoom-in duration-300">
                                <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center border-2 border-red-500 animate-bounce">
                                    <span className="text-4xl">
                                        {currentFeedbackClass === 'feet_wide' && '↔️'}
                                        {currentFeedbackClass === 'knees_caved' && '🦵'}
                                        {currentFeedbackClass === 'spine_misalignment' && '🦴'}
                                    </span>
                                </div>
                                <div className="text-center">
                                    <h3 className="text-xl font-bold text-red-500 mb-1">Correction Needed</h3>
                                    <p className="text-red-400 font-medium">
                                        {currentFeedbackClass === 'feet_wide' && 'Feet too wide'}
                                        {currentFeedbackClass === 'knees_caved' && 'Knees caving in'}
                                        {currentFeedbackClass === 'spine_misalignment' && 'Spine misaligned'}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                {/* Analysis Result Overlay */}
                {(isAnalyzing || analysisResult) && (
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-8">
                        <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 max-w-2xl w-full shadow-2xl border border-gray-200 dark:border-gray-800">
                            <h2 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white flex items-center gap-3">
                                {isAnalyzing ? (
                                    <>
                                        <span className="animate-spin">⏳</span> Analyzing Performance...
                                    </>
                                ) : (
                                    <>
                                        <span>🤖</span> AI Coach Feedback
                                    </>
                                )}
                            </h2>

                            {isAnalyzing ? (
                                <div className="space-y-4">
                                    <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded animate-pulse w-3/4"></div>
                                    <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded animate-pulse w-1/2"></div>
                                    <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded animate-pulse w-5/6"></div>
                                </div>
                            ) : (
                                <div className="prose dark:prose-invert max-h-[60vh] overflow-y-auto">
                                    <div className="text-lg leading-relaxed">
                                        <ReactMarkdown>{analysisResult || ''}</ReactMarkdown>
                                    </div>
                                    <div className="mt-8 flex justify-end">
                                        <button
                                            onClick={() => {
                                                setAnalysisResult(null);
                                                // Optional: Reset exercise here?
                                            }}
                                            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors"
                                        >
                                            Close
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PoseDetector;
