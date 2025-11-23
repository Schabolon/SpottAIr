import React, { useRef, useEffect, useState } from 'react';
import Webcam from 'react-webcam';
import { Sparkles, ArrowRight, Timer, Loader2 } from 'lucide-react';
import { Pose, POSE_CONNECTIONS, type Results } from '@mediapipe/pose';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';
import { getProcessor } from '../lib/exercises/registry';
import { ExerciseState } from '../lib/exercises/types';
import { useSpottair } from '@/lib/spottair';
import * as tf from '@tensorflow/tfjs';
import useAudioPlayer from '@/lib/audio'; // Add this import

interface PoseDetectorProps {
    exerciseId?: string;
    targetReps?: number;
    currentSet?: number;
    totalSets?: number;
    onNextSet?: () => void;
    onRecordingComplete?: (data: any[]) => void;
    onAnalysisComplete?: (feedback: string, recommendation?: any) => void;
    onAnalysisStart?: () => void;
    autoStart?: boolean;
}

const PoseDetector: React.FC<PoseDetectorProps> = ({
    exerciseId = 'squats',
    targetReps = 1,
    currentSet = 1,
    totalSets = 3,
    onNextSet,
    onRecordingComplete,
    onAnalysisComplete,
    onAnalysisStart,
    autoStart = false
}) => {
    const webcamRef = useRef<Webcam>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isExerciseActive, setIsExerciseActive] = useState(false);
    const [isCountingDown, setIsCountingDown] = useState(false);
    const [countdownValue, setCountdownValue] = useState(3);

    const { playAudioFromCategory, isPlaying: isAudioPlaying, isOnCooldown: isAudioOnCooldown, cleanup: cleanupAudio } = useAudioPlayer(3000);
    // Evaluation State
    const [evalStatus, setEvalStatus] = useState<'idle' | 'evaluating' | 'success' | 'feedback_needed'>('idle');
    const [breakTimer, setBreakTimer] = useState(20);

    // Exercise State
    const [poseState, setPoseState] = useState<ExerciseState>({
        reps: 0,
        phase: 'start',
        feedback: [],
        isGoodRep: true,
        badPoints: [],
        history: []
    });
    const [isAnalyzing, setIsAnalyzing] = useState(false);


    const stopAndAnalyze = async () => {
        setIsExerciseActive(false);
        setIsCountingDown(false);
        setCountdownValue(3);
        setIsAnalyzing(true);
        setEvalStatus('evaluating');

        // Save recording immediately
        if (onRecordingComplete) {
            onRecordingComplete(currentRecordingRef.current);
        }

        // Prepare session data
        const sessionData = {
            exercise_name: exerciseId,
            total_reps: poseState.reps,
            reps: poseState.history.map(h => ({
                duration: h.duration,
                feedback: h.feedback,
                start_angles: h.startAngles,
                min_angles: h.minAngles,
                metrics: h.metrics,
                is_valid: h.isValid
            }))
        };

        try {
            // 1. Quick Evaluation
            const evalResponse = await fetch('/api/v1/evaluate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ session_data: sessionData }),
            });

            if (!evalResponse.ok) throw new Error('Evaluation failed');
            const evalData = await evalResponse.json();

            if (!evalData.needs_feedback) {
                // Good job! No full analysis needed.
                setEvalStatus('success');
                setIsAnalyzing(false);
                // Start break timer
                setBreakTimer(20);
                return;
            }

            // 2. Full Analysis (Only if needed)
            setEvalStatus('feedback_needed');
            if (onAnalysisStart) onAnalysisStart(); // Switch tabs now

            const response = await fetch('/api/v1/route', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    instruction: "Analyze this squat session.",
                    session_data: sessionData
                }),
            });

            if (!response.ok) {
                throw new Error(`API Error: ${response.statusText}`);
            }

            const data = await response.json();
            console.log("Analysis response data:", data);
            if (onAnalysisComplete) {
                onAnalysisComplete(data.text, data.recommendation);
            }
        } catch (error) {
            console.error("Analysis failed:", error);
            setEvalStatus('idle'); // Reset on error
        } finally {
            if (evalStatus !== 'success') {
                setIsAnalyzing(false);
            }
        }
    };

    // Trigger Analysis when target reps reached
    useEffect(() => {
        if (poseState.reps >= targetReps && isExerciseActive && !isAnalyzing) {
            stopAndAnalyze();
        }
    }, [poseState.reps, targetReps, isExerciseActive, isAnalyzing]);

    const startExercise = () => {
        if (isExerciseActive) {
            // Manual Stop
            // Allow stopping if we have ANY recorded data, even if reps are 0
            if (currentRecordingRef.current.length > 0) {
                stopAndAnalyze();
            } else {
                // Just reset if no data
                setIsExerciseActive(false);
                setIsCountingDown(false);
                setCountdownValue(3);
                processorRef.current.reset();
            }
        } else {
            // Start countdown
            setIsCountingDown(true);
            setCountdownValue(3);
        }
    };

    // Auto-start effect
    useEffect(() => {
        if (autoStart) {
            startExercise();
        }
    }, []); // Run once on mount

    // Break Timer & Auto-Start
    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (evalStatus === 'success') {
            if (breakTimer > 0) {
                interval = setInterval(() => {
                    setBreakTimer(prev => prev - 1);
                }, 1000);
            } else {
                // Auto-start next set
                if (onNextSet) onNextSet();
            }
        }
        return () => clearInterval(interval);
    }, [evalStatus, breakTimer, onNextSet]);

    const isExerciseActiveRef = useRef(isExerciseActive);
    const isCountingDownRef = useRef(isCountingDown);
    const exerciseIdRef = useRef(exerciseId);
    const processorRef = useRef(getProcessor(exerciseId));

    // Recording Ref
    const currentRecordingRef = useRef<any[]>([]);


    const modelRef = useRef<tf.GraphModel | null>(null);

    // Load SpottAIr model
    const { model, isLoading, runInference } = useSpottair('/models/model.json', 'tflite');

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


    const [currentFeedbackClass, setCurrentFeedbackClass] = useState<string>('correct');
    const [debugInfo, setDebugInfo] = useState<{ class: string, confidence: number } | null>(null);
    const lastClassChangeTimeRef = useRef<number>(0);
    const pendingClassRef = useRef<string | null>(null);
    const currentFeedbackClassRef = useRef<string>('correct'); // Ref to track current state without dependency issues

    useEffect(() => {
        // Only play audio when exercise is active
        if (!isExerciseActive) return;

        // Map AI model classes to audio categories
        // Based on: const classes = ["correct", "feet_wide", "knees_caved", "spine_misalignment"]
        const classToAudioCategory: Record<string, string> = {
            'feet_wide': 'feet',           // feet_wide → play from feet audio folder
            'knees_caved': 'knee',          // knees_caved → play from knee audio folder
            'spine_misalignment': 'spine'   // spine_misalignment → play from spine audio folder
        };

        const audioCategory = classToAudioCategory[currentFeedbackClass];

        // Play audio only when we detect an error class (not 'correct' or 'not_visible')
        if (audioCategory && !isAudioPlaying && !isAudioOnCooldown) {
            console.log(`🔊 AI detected: ${currentFeedbackClass} → Playing audio: ${audioCategory}`);
            playAudioFromCategory(audioCategory);
        }
    }, [currentFeedbackClass, isExerciseActive, playAudioFromCategory, isAudioPlaying, isAudioOnCooldown]);


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

                // PROCESS EXERCISE
                // Map MediaPipe landmarks to our simple interface (just x, y, z)
                // Note: MediaPipe landmarks are normalized [0,1]
                const processedState = processorRef.current.process(results.poseLandmarks);

                // RECORD DATA
                // Prefer poseWorldLandmarks for 3D, fallback to poseLandmarks
                const frameData = results.poseWorldLandmarks || results.poseLandmarks;
                if (frameData) {
                    currentRecordingRef.current.push({
                        timestamp: Date.now(),
                        landmarks: frameData,
                        badPoints: processedState.badPoints || [] // Save bad points
                    });
                }

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
            cleanupAudio(); // ✅ Clean up audio player
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


            </div>

            {/* Sidebar Stats */}
            <div className="w-full lg:w-[320px] flex flex-col gap-4 h-full overflow-y-auto custom-scrollbar pb-4">
                {/* Rep Counter */}
                {/* Rep Counter */}
                <div className="relative overflow-hidden p-6 rounded-3xl shadow-sm border bg-card text-card-foreground shrink-0">
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
                        <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
                            <div>
                                <span className="font-medium text-foreground">Last Rep:</span> {poseState.lastRepDuration?.toFixed(1) || '0.0'}s
                            </div>
                            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/50">
                                <span className="font-medium text-foreground">Set</span>
                                <span>{currentSet}/{totalSets}</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Feedback Panel */}
                <FeedbackPanel
                    currentFeedbackClass={currentFeedbackClass}
                    ruleFeedback={poseState.feedback}
                    isExerciseActive={isExerciseActive}
                    debugInfo={debugInfo}
                />

                {/* Next Set / Evaluation Action Button */}
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 mt-auto">
                    <button
                        onClick={() => {
                            if (evalStatus === 'success' && onNextSet) {
                                onNextSet();
                            }
                        }}
                        disabled={evalStatus !== 'success'}
                        className={`relative w-full flex items-center justify-between px-6 py-4 rounded-2xl shadow-lg transition-all transform border overflow-hidden ${evalStatus === 'success'
                            ? 'bg-green-500/20 text-green-100 border-green-400/30 shadow-green-500/10 cursor-pointer hover:scale-[1.02] active:scale-[0.98]'
                            : 'bg-muted text-muted-foreground border-border cursor-not-allowed opacity-50'
                            }`}
                    >
                        {/* Progress Bar Background */}
                        {evalStatus === 'success' && (
                            <div
                                className="absolute inset-0 bg-green-500 transition-all duration-1000 ease-linear"
                                style={{ width: `${((20 - breakTimer) / 20) * 100}%` }}
                            />
                        )}

                        {/* Content (Relative to sit on top of progress bar) */}
                        <div className="relative z-10 flex items-center justify-between w-full">
                            {evalStatus === 'evaluating' ? (
                                <div className="flex items-center justify-center w-full gap-3">
                                    <Loader2 className="w-6 h-6 animate-spin" />
                                    <span className="font-semibold">Analyzing Form...</span>
                                </div>
                            ) : (
                                <>
                                    <div className="flex flex-col items-start text-left">
                                        <span className="text-xs font-medium opacity-90 uppercase tracking-wider">
                                            {evalStatus === 'success' ? 'Up Next' : 'Current'}
                                        </span>
                                        {evalStatus === 'success' ? (
                                            <div className="flex items-center gap-1.5 font-mono text-sm opacity-100 font-bold drop-shadow-sm">
                                                <Timer className="w-3 h-3" />
                                                <span>00:{breakTimer.toString().padStart(2, '0')}</span>
                                            </div>
                                        ) : (
                                            <span className="font-semibold text-sm">
                                                {isExerciseActive ? `Finish Set ${currentSet}` : 'Waiting to Start...'}
                                            </span>
                                        )}
                                    </div>
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${evalStatus === 'success' ? 'bg-white/20 backdrop-blur-sm' : 'bg-black/5'
                                        }`}>
                                        <ArrowRight className="w-6 h-6" />
                                    </div>
                                </>
                            )}
                        </div>
                    </button>
                </div>
            </div>
        </div>
    );
};

import { FeedbackService } from '../lib/services/feedback';

const FeedbackPanel = ({ currentFeedbackClass, ruleFeedback, isExerciseActive, debugInfo }: any) => {
    // Determine visibility based on class (simplified for now, as logic is inside Service too)
    const isVisible = currentFeedbackClass !== 'not_visible';

    const feedback = FeedbackService.getFeedback(
        currentFeedbackClass,
        ruleFeedback,
        isVisible,
        isExerciseActive
    );

    // Styles based on type
    const styles = {
        success: 'bg-card/50 border-border',
        warning: 'bg-yellow-500/10 border-yellow-500/50',
        error: 'bg-red-500/10 border-red-500/50',
        info: 'bg-card/50 border-border'
    };

    const textColors = {
        success: 'text-green-500',
        warning: 'text-yellow-500',
        error: 'text-red-500',
        info: 'text-foreground'
    };

    const bgColors = {
        success: 'bg-green-500/10',
        warning: 'bg-yellow-500/20',
        error: 'bg-red-500/20',
        info: 'bg-purple-500/10'
    };

    return (
        <div className={`flex-1 backdrop-blur-sm rounded-3xl border shadow-sm p-6 flex flex-col transition-colors duration-300 ${styles[feedback.type]}`}>
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

            <div className="flex flex-col items-center justify-center py-4">
                <div className="flex flex-col items-center gap-4 animate-in zoom-in duration-300">
                    <div className={`w-20 h-20 rounded-full flex items-center justify-center border-2 ${(feedback.type === 'warning' || feedback.type === 'error') ? 'animate-bounce border-current' : 'animate-pulse border-transparent'} ${bgColors[feedback.type]} ${textColors[feedback.type]}`}>
                        <span className="text-4xl">
                            {feedback.type === 'info' ? <Sparkles className="w-8 h-8 text-purple-500" /> : feedback.icon}
                        </span>
                    </div>
                    <div className="text-center">
                        {feedback.title && <h3 className={`text-xl font-bold mb-1 ${textColors[feedback.type]}`}>{feedback.title}</h3>}
                        <p className={`font-medium ${feedback.type === 'success' ? 'text-green-500' : 'text-muted-foreground'}`}>
                            {feedback.message}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PoseDetector;
