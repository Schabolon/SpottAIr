import React, { createContext, useContext, useState, ReactNode } from 'react';
import { trainingSplit as initialTrainingSplit } from '../data/training-plan';
import { Dumbbell } from 'lucide-react';

// Types (You might want to move these to a types file later)
export interface Exercise {
    id: string;
    title: string;
    sets: string;
    reps: string | number;
    muscle: string;
    icon: any | string;
    image: string;
}

export interface WorkoutSession {
    title: string;
    focus: string;
    exercises: Exercise[];
}

export interface TrainingSplit {
    [key: string]: WorkoutSession;
}

interface TrainingPlanContextType {
    trainingSplit: TrainingSplit;
    addExerciseToWorkout: (workoutKey: string, exercise: Omit<Exercise, 'id' | 'icon' | 'image'>) => void;
    createWorkout: (name: string) => void;
    updateTrainingSplit: (newSplit: TrainingSplit, explanation?: string) => void;
    lastAdjustmentExplanation: string | null;
}

const TrainingPlanContext = createContext<TrainingPlanContextType | undefined>(undefined);

export const TrainingPlanProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [trainingSplit, setTrainingSplit] = useState<TrainingSplit>(initialTrainingSplit);

    const addExerciseToWorkout = (workoutKey: string, exercise: Omit<Exercise, 'id' | 'icon' | 'image'>) => {
        setTrainingSplit(prev => {
            const workout = prev[workoutKey];
            if (!workout) return prev;

            return {
                ...prev,
                [workoutKey]: {
                    ...workout,
                    exercises: [
                        ...workout.exercises,
                        {
                            id: Date.now().toString(),
                            title: exercise.title,
                            sets: exercise.sets,
                            reps: exercise.reps,
                            muscle: exercise.muscle,
                            icon: Dumbbell, // Default icon
                            image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&q=80' // Default image
                        }
                    ]
                }
            };
        });
    };

    const createWorkout = (name: string) => {
        const key = name.toLowerCase().replace(/\s+/g, '-');
        setTrainingSplit(prev => ({
            ...prev,
            [key]: {
                title: name,
                focus: "Custom Workout",
                exercises: []
            }
        }));
    };

    const [lastAdjustmentExplanation, setLastAdjustmentExplanation] = useState<string | null>(null);

    const updateTrainingSplit = (newSplit: TrainingSplit, explanation?: string) => {
        setTrainingSplit(newSplit);
        if (explanation) {
            setLastAdjustmentExplanation(explanation);
        }
    };

    return (
        <TrainingPlanContext.Provider value={{ trainingSplit, addExerciseToWorkout, createWorkout, updateTrainingSplit, lastAdjustmentExplanation }}>
            {children}
        </TrainingPlanContext.Provider>
    );
};

export const useTrainingPlan = () => {
    const context = useContext(TrainingPlanContext);
    if (context === undefined) {
        throw new Error('useTrainingPlan must be used within a TrainingPlanProvider');
    }
    return context;
};
