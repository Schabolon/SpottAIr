import { ExerciseProcessor } from './types';
import { SquatProcessor } from './squats';

export const getProcessor = (exerciseId: string): ExerciseProcessor => {
    switch (exerciseId.toLowerCase()) {
        case 'squats':
            return new SquatProcessor();
        default:
            // Return a dummy processor or default
            return new SquatProcessor(); // Fallback to squats for now
    }
};
