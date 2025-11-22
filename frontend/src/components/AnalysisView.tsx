import React, { useRef, useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Activity, Trophy, Play, Pause, RotateCcw, MousePointer2 } from 'lucide-react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { PointerLockControls, Grid, Environment } from '@react-three/drei';
import { Button } from "@/components/ui/button";
import * as THREE from 'three';
import { POSE_CONNECTIONS } from '@mediapipe/pose';

interface AnalysisViewProps {
    recordedData?: any[];
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

    useFrame((state, delta) => {
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
const Skeleton = ({ landmarks }: { landmarks: any[] }) => {
    if (!landmarks || landmarks.length === 0) return null;

    const VISIBILITY_THRESHOLD = 0.5;

    // Convert landmarks to Vector3
    // MediaPipe world landmarks: x (right), y (up), z (forward/backward)
    // We might need to scale/invert axes to match Three.js coordinate system
    // Three.js: y is up, x is right, z is forward (towards viewer)

    const points = useMemo(() => {
        // 1. Convert to Three.js coordinates first
        const rawPoints = landmarks.map((lm: any) => new THREE.Vector3(-lm.x, -lm.y, -lm.z));

        // 2. Find the lowest point (minimum Y) among foot landmarks
        // MediaPipe Pose Landmarks:
        // 27: left_ankle, 28: right_ankle
        // 29: left_heel, 30: right_heel
        // 31: left_foot_index, 32: right_foot_index
        const footIndices = [27, 28, 29, 30, 31, 32];
        let minY = Infinity;

        footIndices.forEach(idx => {
            if (rawPoints[idx]) {
                minY = Math.min(minY, rawPoints[idx].y);
            }
        });

        // If no foot points found (unlikely), just use 0 offset or min of all points
        if (minY === Infinity) {
            minY = Math.min(...rawPoints.map((p: THREE.Vector3) => p.y));
        }

        // 3. Calculate offset to bring lowest point to Y=0 (floor)
        // We want newY = oldY + offset => 0 = minY + offset => offset = -minY
        // However, we might want to keep the lowest point slightly above 0 (e.g. radius of joint)
        const offset = -minY + 0.03; // +0.03 for the sphere radius

        // 4. Apply offset
        return rawPoints.map((p: THREE.Vector3) => new THREE.Vector3(p.x, p.y + offset, p.z));
    }, [landmarks]);

    return (
        <group>
            {/* Joints */}
            {points.map((pos: THREE.Vector3, i: number) => {
                const isVisible = (landmarks[i].visibility ?? 1) > VISIBILITY_THRESHOLD;
                if (!isVisible) return null;

                return (
                    <mesh key={i} position={pos}>
                        <sphereGeometry args={[0.015, 16, 16]} />
                        <meshStandardMaterial color="hotpink" />
                    </mesh>
                );
            })}

            {/* Bones */}
            {POSE_CONNECTIONS.map(([start, end], i) => {
                const startPoint = points[start];
                const endPoint = points[end];

                const startVisible = (landmarks[start]?.visibility ?? 1) > VISIBILITY_THRESHOLD;
                const endVisible = (landmarks[end]?.visibility ?? 1) > VISIBILITY_THRESHOLD;

                if (!startPoint || !endPoint || !startVisible || !endVisible) return null;

                const direction = new THREE.Vector3().subVectors(endPoint, startPoint);
                const length = direction.length();
                const midPoint = new THREE.Vector3().addVectors(startPoint, endPoint).multiplyScalar(0.5);

                // Quaternion for rotation
                const quaternion = new THREE.Quaternion();
                quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());

                return (
                    <mesh key={`bone-${i}`} position={midPoint} quaternion={quaternion}>
                        <cylinderGeometry args={[0.01, 0.01, length, 8]} />
                        <meshStandardMaterial color="cyan" />
                    </mesh>
                );
            })}
        </group>
    );
};

import { Slider } from "@/components/ui/slider";

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

    // Check if data has timestamps (new format)
    const hasTimestamps = useMemo(() => {
        return data && data.length > 0 && 'timestamp' in data[0];
    }, [data]);

    // Calculate total duration and start time (only for timestamped data)
    const { startTime, duration } = useMemo(() => {
        if (!hasTimestamps || !data || data.length < 2) return { startTime: 0, duration: 0 };
        const start = data[0].timestamp;
        const end = data[data.length - 1].timestamp;
        return { startTime: start, duration: end - start };
    }, [data, hasTimestamps]);

    useFrame((state, delta) => {
        if (data.length === 0) return;

        let currentTime = playbackTimeRef.current;

        // Handle Manual Scrubbing
        if (manualTime !== null && manualTime !== undefined) {
            currentTime = manualTime;
            playbackTimeRef.current = manualTime;
        }
        // Handle Playback
        else if (isPlaying) {
            if (hasTimestamps && duration > 0) {
                currentTime += (delta * 1000) * speed;
                if (currentTime > duration) currentTime = currentTime % duration;
            } else {
                // Legacy playback
                currentTime += delta * speed;
                if (currentTime > 0.033) { // ~30fps
                    frameIndexRef.current = (frameIndexRef.current + 1) % data.length;
                    currentTime = 0;
                }
            }
            playbackTimeRef.current = currentTime;
        }

        // Notify parent of current time
        if (onTimeUpdate) {
            onTimeUpdate(currentTime);
        }

        // Find Frame
        if (hasTimestamps && duration > 0) {
            const targetTime = startTime + currentTime;
            const frame = data.find(f => f.timestamp >= targetTime) || data[data.length - 1];
            if (frame) setCurrentFrame(frame);
        } else {
            // Legacy
            if (manualTime === null) { // Only update if not scrubbing (legacy scrubbing not fully supported yet)
                setCurrentFrame(data[frameIndexRef.current]);
            }
        }
    });

    // Reset on data change
    useEffect(() => {
        if (data.length > 0) {
            setCurrentFrame(data[0]);
            playbackTimeRef.current = 0;
            frameIndexRef.current = 0;
        }
    }, [data]);

    if (!currentFrame) return null;

    // Handle both formats: { timestamp, landmarks } OR [landmarks]
    const landmarks = currentFrame.landmarks || currentFrame;

    return (
        <group position={[0, 1, 0]}> {/* Lift skeleton up a bit */}
            <Skeleton landmarks={landmarks} />
        </group>
    );
};

const AnalysisView: React.FC<AnalysisViewProps> = ({ recordedData = [] }) => {
    const [isPlaying, setIsPlaying] = useState(true);
    const [sliderValue, setSliderValue] = useState(0);
    const [isScrubbing, setIsScrubbing] = useState(false);

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
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                {/* ... other cards ... */}
            </div>

            <Card className="h-[600px] bg-black/90 overflow-hidden relative flex flex-col">
                {!hasData ? (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                        <p>No recording available. Complete an exercise to see 3D replay.</p>
                    </div>
                ) : (
                    <>
                        <div className="absolute top-4 left-4 z-10 flex gap-2 items-center">
                            <Button
                                variant="secondary"
                                size="icon"
                                onClick={() => setIsPlaying(!isPlaying)}
                            >
                                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                            </Button>
                            <div className="bg-black/50 text-white px-3 py-2 rounded text-xs flex items-center gap-2">
                                <MousePointer2 className="w-3 h-3" />
                                <span>Click to Control</span>
                                <span className="text-white/50">|</span>
                                <span>WASD to Move</span>
                                <span className="text-white/50">|</span>
                                <span>ESC to Exit</span>
                            </div>
                        </div>

                        {/* Timeline Controls */}
                        <div className="absolute bottom-4 left-4 right-4 z-10 bg-black/60 p-4 rounded-lg backdrop-blur-sm flex items-center gap-4">
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
                                    // Optional: Resume playing if it was playing before? 
                                    // For now let's leave it paused or let user press play
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
        </div>
    );
};

export default AnalysisView;
