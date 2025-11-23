import React, { useRef, useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Activity, Play, Pause, MousePointer2, Sparkles } from 'lucide-react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { PointerLockControls, Grid } from '@react-three/drei';
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import * as THREE from 'three';
import { POSE_CONNECTIONS } from '@mediapipe/pose';
import ReactMarkdown from 'react-markdown';

interface AnalysisViewProps {
    recordedData?: any[];
    analysisFeedback?: string | null;
    isAnalyzing?: boolean;
    recommendation?: {
        exercise: string;
        reason: string;
        difficulty: string;
    } | null;
    onAddToPlan?: () => void;
    currentPlan?: any;
    onUpdatePlan?: (newPlan: any, explanation: string) => void;
}

// FPS Movement Controls
const FPSControls = () => {
    const { camera } = useThree();
    const [movement, setMovement] = useState({
        forward: false,
        backward: false,
        left: false,
        right: false,
        up: false,
        down: false,
    });

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            switch (e.code) {
                case 'KeyW': setMovement(m => ({ ...m, forward: true })); break;
                case 'KeyS': setMovement(m => ({ ...m, backward: true })); break;
                case 'KeyA': setMovement(m => ({ ...m, left: true })); break;
                case 'KeyD': setMovement(m => ({ ...m, right: true })); break;
                case 'Space': setMovement(m => ({ ...m, up: true })); break;
                case 'ShiftLeft': setMovement(m => ({ ...m, down: true })); break;
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            switch (e.code) {
                case 'KeyW': setMovement(m => ({ ...m, forward: false })); break;
                case 'KeyS': setMovement(m => ({ ...m, backward: false })); break;
                case 'KeyA': setMovement(m => ({ ...m, left: false })); break;
                case 'KeyD': setMovement(m => ({ ...m, right: false })); break;
                case 'Space': setMovement(m => ({ ...m, up: false })); break;
                case 'ShiftLeft': setMovement(m => ({ ...m, down: false })); break;
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('keyup', handleKeyUp);

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('keyup', handleKeyUp);
        };
    }, []);

    useFrame((_, delta) => {
        const speed = 5 * delta; // Movement speed
        const direction = new THREE.Vector3();
        const frontVector = new THREE.Vector3(
            0,
            0,
            Number(movement.backward) - Number(movement.forward)
        );
        const sideVector = new THREE.Vector3(
            Number(movement.left) - Number(movement.right),
            0,
            0
        );

        direction
            .subVectors(frontVector, sideVector)
            .normalize()
            .multiplyScalar(speed)
            .applyEuler(camera.rotation);

        camera.position.add(direction);

        // Vertical movement (global up/down)
        if (movement.up) camera.position.y += speed;
        if (movement.down) camera.position.y -= speed;
    });

    return null;
};

// Component to render the skeleton for a single frame
const Skeleton = ({ landmarks, badPoints = [] }: { landmarks: any[], badPoints?: number[] }) => {
    if (!landmarks || landmarks.length === 0) return null;

    const VISIBILITY_THRESHOLD = 0.5;

    const points = useMemo(() => {
        const rawPoints = landmarks.map((lm: any) => new THREE.Vector3(-lm.x, -lm.y, -lm.z));
        const footIndices = [27, 28, 29, 30, 31, 32];
        let minY = Infinity;

        footIndices.forEach(idx => {
            if (rawPoints[idx]) {
                minY = Math.min(minY, rawPoints[idx].y);
            }
        });

        if (minY === Infinity) {
            minY = Math.min(...rawPoints.map((p: THREE.Vector3) => p.y));
        }

        const offset = -minY + 0.03;
        return rawPoints.map((p: THREE.Vector3) => new THREE.Vector3(p.x, p.y + offset, p.z));
    }, [landmarks]);

    return (
        <group>
            {points.map((pos: THREE.Vector3, i: number) => {
                const isVisible = (landmarks[i].visibility ?? 1) > VISIBILITY_THRESHOLD;
                if (!isVisible) return null;

                const isBad = badPoints.includes(i);
                return (
                    <mesh key={i} position={pos}>
                        <sphereGeometry args={[isBad ? 0.025 : 0.015, 16, 16]} />
                        <meshStandardMaterial color={isBad ? '#FF0000' : '#00FF00'} />
                    </mesh>
                );
            })}

            {POSE_CONNECTIONS.map(([start, end], i) => {
                const startPoint = points[start];
                const endPoint = points[end];

                const startVisible = (landmarks[start]?.visibility ?? 1) > VISIBILITY_THRESHOLD;
                const endVisible = (landmarks[end]?.visibility ?? 1) > VISIBILITY_THRESHOLD;

                if (!startPoint || !endPoint || !startVisible || !endVisible) return null;

                const direction = new THREE.Vector3().subVectors(endPoint, startPoint);
                const length = direction.length();
                const midPoint = new THREE.Vector3().addVectors(startPoint, endPoint).multiplyScalar(0.5);

                const quaternion = new THREE.Quaternion();
                quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());

                return (
                    <mesh key={`bone-${i}`} position={midPoint} quaternion={quaternion}>
                        <cylinderGeometry args={[0.01, 0.01, length, 8]} />
                        <meshStandardMaterial color="white" />
                    </mesh>
                );
            })}
        </group>
    );
};


const ReplayScene = ({
    data,
    isPlaying,
    speed = 1,
    manualTime = null,
    onTimeUpdate
}: {
    data: any[],
    isPlaying: boolean,
    speed?: number,
    manualTime?: number | null,
    onTimeUpdate?: (time: number) => void
}) => {
    const [currentFrame, setCurrentFrame] = useState<any>(null);
    const playbackTimeRef = useRef(0);
    const frameIndexRef = useRef(0);

    const hasTimestamps = useMemo(() => {
        return data && data.length > 0 && 'timestamp' in data[0];
    }, [data]);

    const { startTime, duration } = useMemo(() => {
        if (!hasTimestamps || !data || data.length < 2) return { startTime: 0, duration: 0 };
        const start = data[0].timestamp;
        const end = data[data.length - 1].timestamp;
        return { startTime: start, duration: end - start };
    }, [data, hasTimestamps]);

    useFrame((_, delta) => {
        if (data.length === 0) return;

        let currentTime = playbackTimeRef.current;

        if (manualTime !== null && manualTime !== undefined) {
            currentTime = manualTime;
            playbackTimeRef.current = manualTime;
        }
        else if (isPlaying) {
            if (hasTimestamps && duration > 0) {
                currentTime += (delta * 1000) * speed;
                if (currentTime > duration) currentTime = currentTime % duration;
            } else {
                currentTime += delta * speed;
                if (currentTime > 0.033) {
                    frameIndexRef.current = (frameIndexRef.current + 1) % data.length;
                    currentTime = 0;
                }
            }
            playbackTimeRef.current = currentTime;
        }

        if (onTimeUpdate) {
            onTimeUpdate(currentTime);
        }

        if (hasTimestamps && duration > 0) {
            const targetTime = startTime + currentTime;
            const frame = data.find(f => f.timestamp >= targetTime) || data[data.length - 1];
            if (frame) setCurrentFrame(frame);
        } else {
            if (manualTime === null) {
                setCurrentFrame(data[frameIndexRef.current]);
            }
        }
    });

    useEffect(() => {
        if (data.length > 0) {
            setCurrentFrame(data[0]);
            playbackTimeRef.current = 0;
            frameIndexRef.current = 0;
        }
    }, [data]);

    if (!currentFrame) return null;

    const landmarks = currentFrame.landmarks || currentFrame;
    const badPoints = currentFrame.badPoints || [];

    return (
        <group position={[0, 1, 0]}>
            <Skeleton landmarks={landmarks} badPoints={badPoints} />
        </group>
    );
};

const AnalysisView: React.FC<AnalysisViewProps> = ({ recordedData = [], analysisFeedback, isAnalyzing = false, recommendation, onAddToPlan, currentPlan, onUpdatePlan }) => {
    const [isPlaying, setIsPlaying] = useState(true);
    const [sliderValue, setSliderValue] = useState(0);
    const [isScrubbing, setIsScrubbing] = useState(false);
    const [showRec, setShowRec] = useState(false);
    const [adjustmentExplanation, setAdjustmentExplanation] = useState<string | null>(null);
    const [newPlan, setNewPlan] = useState<any | null>(null);
    const [isAdjusting, setIsAdjusting] = useState(false);

    useEffect(() => {
        if (recommendation && currentPlan && !adjustmentExplanation && !isAdjusting) {
            setShowRec(true);
            setIsAdjusting(true);

            // Call the new adjustment agent
            fetch('/api/v1/adjust-plan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    current_plan: currentPlan,
                    workout_feedback: analysisFeedback || "General improvement needed.",
                    exercise_name: recommendation.exercise // Using the rec exercise as context
                })
            })
                .then(res => res.json())
                .then(data => {
                    setAdjustmentExplanation(data.explanation);
                    setNewPlan(data.adjusted_plan);
                    setIsAdjusting(false);
                })
                .catch(err => {
                    console.error("Plan adjustment failed:", err);
                    setIsAdjusting(false);
                });
        }
    }, [recommendation, currentPlan]);

    const hasData = recordedData && recordedData.length > 0;

    // Calculate duration for slider max
    const duration = useMemo(() => {
        if (!recordedData || recordedData.length < 2 || !recordedData[0].timestamp) return 0;
        return recordedData[recordedData.length - 1].timestamp - recordedData[0].timestamp;
    }, [recordedData]);

    const formatTime = (ms: number) => {
        const seconds = Math.floor(ms / 1000);
        const decimals = Math.floor((ms % 1000) / 100);
        return `${seconds}.${decimals}s`;
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-230px)]">
            {/* Left Column: AI Feedback + Stats */}
            <div className="lg:col-span-1 flex flex-col gap-6 h-full">
                {/* AI Feedback Panel */}
                <div className="flex-1 min-h-0">
                    <div className="h-full backdrop-blur-sm rounded-3xl border shadow-sm p-6 flex flex-col bg-purple-500/10 border-purple-500/20">
                        <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-purple-500 fill-purple-500/20" />
                            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                                AI Coach Feedback
                            </span>
                        </h2>
                        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                            {isAnalyzing ? (
                                <div className="h-full flex flex-col items-center justify-center gap-4">
                                    <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
                                    <p className="text-sm text-muted-foreground animate-pulse">Analyzing your form...</p>
                                </div>
                            ) : analysisFeedback ? (
                                <div className="prose dark:prose-invert max-w-none text-base leading-relaxed prose-p:text-gray-200 prose-headings:text-white prose-strong:text-purple-400 prose-li:text-gray-200">
                                    <ReactMarkdown>{analysisFeedback}</ReactMarkdown>
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-muted-foreground/50 gap-4 text-center">
                                    <div className="w-16 h-16 rounded-full bg-purple-500/10 flex items-center justify-center">
                                        <Sparkles className="w-8 h-8 text-purple-500" />
                                    </div>
                                    <p>Complete a set to receive<br />personalized AI coaching.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Stats Cards - Stacked Vertically */}
                <div className="grid grid-cols-1 gap-4 shrink-0">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Frames</CardTitle>
                            <Activity className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{recordedData.length}</div>
                            <p className="text-xs text-muted-foreground">Recorded data points</p>
                        </CardContent>
                    </Card>
                    {/* Add more stats cards here if needed, or keep it simple */}
                </div>
            </div>

            {/* Right Column: 3D Viewer - Full Height */}
            <Card className="lg:col-span-2 h-full bg-black/90 overflow-hidden relative flex flex-col rounded-3xl border-0 ring-1 ring-white/10 shadow-2xl">
                {/* ... (viewer content remains same) ... */}
                {!hasData ? (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                        <p>No recording available. Complete an exercise to see 3D replay.</p>
                    </div>
                ) : (
                    <>
                        <div className="absolute top-4 left-4 z-10 flex gap-2 items-center">
                            <div className="bg-black/50 text-white px-3 py-2 rounded text-xs flex items-center gap-2">
                                <MousePointer2 className="w-3 h-3" />
                                <span className="hidden sm:inline">Click to Control</span>
                                <span className="text-white/50 hidden sm:inline">|</span>
                                <span className="hidden sm:inline">WASD to Move</span>
                                <span className="text-white/50 hidden sm:inline">|</span>
                                <span>ESC to Exit</span>
                            </div>
                        </div>

                        {/* Timeline Controls */}
                        <div
                            className="absolute bottom-4 left-4 right-4 z-10 bg-black/60 p-4 rounded-lg backdrop-blur-sm flex items-center gap-4"
                            onPointerDown={(e) => e.stopPropagation()}
                            onClick={(e) => e.stopPropagation()}
                            onMouseDown={(e) => e.stopPropagation()}
                            onMouseUp={(e) => e.stopPropagation()}
                        >
                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-white hover:text-white hover:bg-white/20 h-8 w-8"
                                onClick={() => setIsPlaying(!isPlaying)}
                            >
                                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                            </Button>
                            <span className="text-white font-mono text-sm w-16 text-right">
                                {formatTime(sliderValue)}
                            </span>
                            <Slider
                                value={[sliderValue]}
                                max={duration || 100}
                                step={10}
                                className="flex-1"
                                onValueChange={(vals) => {
                                    setIsScrubbing(true);
                                    setSliderValue(vals[0]);
                                    setIsPlaying(false); // Pause while scrubbing
                                }}
                                onValueCommit={() => {
                                    setIsScrubbing(false);
                                }}
                            />
                            <span className="text-white/50 font-mono text-sm w-16">
                                {formatTime(duration)}
                            </span>
                        </div>

                        <Canvas camera={{ position: [0, 1.5, 4], fov: 50 }}>
                            <color attach="background" args={['#111']} />
                            <ambientLight intensity={0.5} />
                            <directionalLight position={[10, 10, 5]} intensity={1} />

                            <ReplayScene
                                data={recordedData}
                                isPlaying={isPlaying}
                                manualTime={isScrubbing ? sliderValue : null}
                                onTimeUpdate={(t) => {
                                    if (!isScrubbing) setSliderValue(t);
                                }}
                            />

                            <Grid infiniteGrid fadeDistance={30} sectionColor="#444" cellColor="#222" />

                            <FPSControls />
                            <PointerLockControls />
                        </Canvas>
                    </>
                )}
            </Card>

            {/* Recommendation Popup */}
            <Dialog open={showRec} onOpenChange={setShowRec}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-purple-500" />
                            Smart Training Adjustment
                        </DialogTitle>
                        <DialogDescription>
                            Based on your recent set, we recommend adding this exercise to your plan.
                        </DialogDescription>
                    </DialogHeader>
                    {isAdjusting ? (
                        <div className="flex flex-col items-center justify-center py-8 gap-4">
                            <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
                            <p className="text-sm text-muted-foreground">Optimizing your training plan...</p>
                        </div>
                    ) : adjustmentExplanation ? (
                        <div className="flex flex-col gap-4 py-4">
                            <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
                                <h3 className="font-bold text-lg text-purple-600 mb-2">Proposed Changes</h3>
                                <p className="text-sm text-muted-foreground">
                                    {adjustmentExplanation}
                                </p>
                            </div>
                        </div>
                    ) : recommendation && (
                        <div className="flex flex-col gap-4 py-4">
                            {/* Fallback to old view if something fails */}
                            <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
                                <h3 className="font-bold text-lg text-purple-600 mb-1">{recommendation.exercise}</h3>
                                <div className="text-xs font-medium px-2 py-0.5 rounded-full bg-purple-200 text-purple-800 w-fit mb-2">
                                    {recommendation.difficulty}
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    {recommendation.reason}
                                </p>
                            </div>
                        </div>
                    )}
                    <DialogFooter className="sm:justify-start">
                        <Button type="button" variant="secondary" onClick={() => setShowRec(false)}>
                            Close
                        </Button>
                        {newPlan ? (
                            <Button type="button" className="bg-purple-600 hover:bg-purple-700 text-white" onClick={() => {
                                if (onUpdatePlan && adjustmentExplanation) onUpdatePlan(newPlan, adjustmentExplanation);
                                setShowRec(false);
                            }}>
                                Apply Changes
                            </Button>
                        ) : (
                            <Button type="button" className="bg-purple-600 hover:bg-purple-700 text-white" onClick={() => {
                                if (onAddToPlan) onAddToPlan();
                                setShowRec(false);
                            }}>
                                Add Single Exercise
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default AnalysisView;
