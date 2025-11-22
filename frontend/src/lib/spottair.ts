import { useState, useEffect, useRef } from 'react';
import * as tf from '@tensorflow/tfjs';

const BODY_INDICES = [11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32];

export interface Landmark {
  x: number;
  y: number;
  z: number;
}

interface SpottairModelHook {
  model: tf.GraphModel | null;
  isLoading: boolean;
  error: string | null;
  runInference: (landmarks: Landmark[]) => number[] | null;
}

/**
 * Normalizes pose landmarks for model input
 * Centers at hips and scales by torso size
 */
export function normalizePose(landmarks: Landmark[]): number[] {
  const points = landmarks.map(l => [l.x, l.y, l.z]);

  // Calculate Params (Using original indices) - CENTER AT HIPS & SCALE BY TORSO SIZE
  const leftHip = points[23];
  const rightHip = points[24];
  const cx = (leftHip[0] + rightHip[0]) / 2;
  const cy = (leftHip[1] + rightHip[1]) / 2;
  const cz = (leftHip[2] + rightHip[2]) / 2;

  const leftShoulder = points[11];
  const dist = Math.sqrt(
    Math.pow(leftShoulder[0] - leftHip[0], 2) +
    Math.pow(leftShoulder[1] - leftHip[1], 2) +
    Math.pow(leftShoulder[2] - leftHip[2], 2)
  ) || 1.0;

  // Filter & Normalize
  const inputData: number[] = [];

  // Only loop through the BODY_INDICES
  for (let index of BODY_INDICES) {
    const p = points[index];
    inputData.push((p[0] - cx) / dist);
    inputData.push((p[1] - cy) / dist);
    inputData.push((p[2] - cz) / dist);
  }

  // Result should be length 48
  return inputData;
}

/**
 * Standalone inference function that can be called from other components
 * @param model - The loaded TensorFlow model
 * @param landmarks - Array of pose landmarks with x, y, z coordinates
 * @returns Model output or null if inference fails
 */
export function inferPoseModel(
  model: tf.GraphModel | tf.LayersModel,
  landmarks: Landmark[]
): number[] | null {
  if (!model) {
    console.error('Model not provided');
    return null;
  }

  let inputTensor: tf.Tensor | undefined;
  let outputTensor: tf.Tensor | undefined;

  try {
    // Preprocess the landmarks
    const normalizedData = normalizePose(landmarks);

    console.log('Normalized input data (length: ' + normalizedData.length + '):', normalizedData);

    // Create input tensor - shape [1, 48] for batch size 1 with 48 features
    inputTensor = tf.tensor2d([normalizedData], [1, 48]);

    // Run inference SYNCHRONOUSLY
    outputTensor = model.predict(inputTensor) as tf.Tensor;

    // Get output data SYNCHRONOUSLY
    const outputData = outputTensor.dataSync(); // ✅ Changed from .data() to .dataSync()
    const output = Array.from(outputData);

    console.log('Model output:', output);

    return output;
  } catch (err) {
    console.error('Error running inference:', err);
    return null;
  } finally {
    // ✅ Always cleanup tensors to prevent memory leaks
    if (inputTensor) inputTensor.dispose();
    if (outputTensor) outputTensor.dispose();
  }
}

/**
 * Custom hook for loading and running inference with the Spottair TFLite model
 * @param modelUrl - URL or path to the model file (.tflite or model.json)
 * @param modelFormat - 'tflite' or 'tfjs' (default: 'tflite')
 */
export function useSpottair(
  modelUrl: string,
  modelFormat: 'tflite' | 'tfjs' = 'tflite'
): SpottairModelHook {
  const [model, setModel] = useState<tf.GraphModel | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const modelRef = useRef<tf.GraphModel | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadModel() {
      try {
        setIsLoading(true);
        setError(null);

        let loadedModel: tf.GraphModel;

        if (modelFormat === 'tflite') {
          // Load TFLite model
          loadedModel = await tf.loadGraphModel(modelUrl, {
            fromTFHub: false,
          });
        } else {
          // Load standard TensorFlow.js model
          loadedModel = await tf.loadLayersModel(modelUrl);
        }

        if (isMounted) {
          modelRef.current = loadedModel;
          setModel(loadedModel);
          console.log('Spottair model loaded successfully');
        }
      } catch (err) {
        if (isMounted) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to load model';
          setError(errorMessage);
          console.error('Error loading Spottair model:', err);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadModel();

    return () => {
      isMounted = false;
      // Cleanup model if needed
      if (modelRef.current) {
        modelRef.current.dispose();
        modelRef.current = null;
      }
    };
  }, [modelUrl, modelFormat]);

  /**
   * Run inference on pose landmarks
   * @param landmarks - Array of pose landmarks with x, y, z coordinates
   * @returns Model output or null if inference fails
   */
  const runInference = (landmarks: Landmark[]): Promise<number[] | null> => {
    if (!model) {
      console.error('Model not loaded yet');
      return null;
    }

    return inferPoseModel(model, landmarks);
  };

  return {
    model,
    isLoading,
    error,
    runInference,
  };
}
