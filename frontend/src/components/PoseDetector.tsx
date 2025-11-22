import React, { useRef, useEffect, useState } from 'react';
import Webcam from 'react-webcam';
import { Pose, POSE_CONNECTIONS, type Results } from '@mediapipe/pose';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';
import { Camera } from '@mediapipe/camera_utils';

const PoseDetector: React.FC = () => {
    const webcamRef = useRef<Webcam>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isExerciseActive, setIsExerciseActive] = useState(false);

    // Placeholder for optimal pose logic
    // Returns indices of landmarks that are "bad"
    const checkPose = (landmarks: any[]): number[] => {
        const badPoints: number[] = [];

        // Example: Check if knees are too close (basic check)
        // 25: left knee, 26: right knee
        if (landmarks[25] && landmarks[26]) {
            const kneeDistance = Math.abs(landmarks[25].x - landmarks[26].x);
            if (kneeDistance < 0.1) { // Threshold for "too close"
                badPoints.push(25, 26);
            }
        }
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

            if (results.poseLandmarks) {
                const badPoints = isExerciseActiveRef.current ? checkPose(results.poseLandmarks) : [];

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
                        canvasCtx.arc(x, y, 8, 0, 2 * Math.PI);
                        canvasCtx.fillStyle = '#FF0000';
                        canvasCtx.fill();
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

        if (webcamRef.current && webcamRef.current.video) {
            const camera = new Camera(webcamRef.current.video, {
                onFrame: async () => {
                    if (webcamRef.current && webcamRef.current.video) {
                        await pose.send({ image: webcamRef.current.video });
                    }
                },
                width: 640,
                height: 480,
            });
            camera.start();
        }
    }, [isExerciseActive]); // Re-run effect if exercise state changes? No, onResults uses state ref or we need to be careful. 
    // Actually, onResults is defined inside component, so it captures state. 
    // But pose.onResults is set once. We need to update the callback or use a ref for state.
    // Better: Use a ref for isExerciseActive to access it inside the callback without re-binding.

    const isExerciseActiveRef = useRef(isExerciseActive);
    useEffect(() => {
        isExerciseActiveRef.current = isExerciseActive;
    }, [isExerciseActive]);

    // We need to redefine onResults to use the ref, or just use the ref inside the existing onResults.
    // Let's update the onResults implementation above to use isExerciseActiveRef.current

    return (
        <div className="relative flex flex-col items-center justify-center p-6 bg-black/5 min-h-[600px]">
            <h1 className="text-3xl font-bold mb-4 text-gray-800">SpottAIr Pose Trainer</h1>

            <div className="relative w-[640px] h-[480px] bg-black rounded-lg overflow-hidden shadow-2xl ring-1 ring-white/10">
                <Webcam
                    ref={webcamRef}
                    className="absolute top-0 left-0 w-full h-full object-cover"
                />
                <canvas
                    ref={canvasRef}
                    className="absolute top-0 left-0 w-full h-full object-cover"
                />
            </div>

            <div className="mt-8 z-10">
                <button
                    onClick={() => setIsExerciseActive(!isExerciseActive)}
                    className={`px-8 py-4 rounded-full font-bold text-lg transition-all transform hover:scale-105 shadow-lg ${isExerciseActive
                        ? 'bg-red-500 hover:bg-red-600 text-white ring-4 ring-red-500/30'
                        : 'bg-green-500 hover:bg-green-600 text-white ring-4 ring-green-500/30'
                        }`}
                >
                    {isExerciseActive ? 'Stop Exercise' : 'Start Exercise'}
                </button>
            </div>
        </div>
    );
};

export default PoseDetector;
