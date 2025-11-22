import {
    Dumbbell, ArrowUpFromLine, ArrowDown, Grab, ArrowUp, Footprints, Activity, MoveVertical, ArrowDownToLine, Shield
} from 'lucide-react';

export const trainingSplit = {
    push: {
        title: "Push Day",
        focus: "Chest, Shoulders, Triceps",
        exercises: [
            { id: 'bench-press', title: 'Barbell Bench Press', sets: '4', reps: 8, muscle: 'Chest', icon: Dumbbell, image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&q=80' },
            { id: 'incline-dumbbell-press', title: 'Incline Dumbbell Press', sets: '3', reps: 10, muscle: 'Chest', icon: Dumbbell, image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&q=80' },
            { id: 'shoulder-press', title: 'Overhead Press', sets: '3', reps: 10, muscle: 'Shoulders', icon: ArrowUpFromLine, image: 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=800&q=80' },
            { id: 'lateral-raises', title: 'Lateral Raises', sets: '4', reps: 15, muscle: 'Shoulders', icon: Dumbbell, image: 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=800&q=80' },
            { id: 'tricep-dips', title: 'Tricep Dips', sets: '3', reps: 12, muscle: 'Triceps', icon: ArrowDown, image: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=800&q=80' },
            { id: 'pushups', title: 'Pushups', sets: '3', reps: 20, muscle: 'Chest', icon: ArrowDown, image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&q=80' },
            { id: 'tricep-pushdown', title: 'Tricep Pushdowns', sets: '3', reps: 15, muscle: 'Triceps', icon: ArrowDown, image: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=800&q=80' }
        ]
    },
    pull: {
        title: "Pull Day",
        focus: "Back, Biceps",
        exercises: [
            { id: 'deadlift', title: 'Deadlift', sets: '3', reps: 5, muscle: 'Back', icon: ArrowUpFromLine, image: 'https://images.unsplash.com/photo-1603287681836-b174ce5074c2?w=800&q=80' },
            { id: 'pullups', title: 'Pullups', sets: '3', reps: 10, muscle: 'Back', icon: ArrowUp, image: 'https://images.unsplash.com/photo-1598971639058-9b196b22cdd8?w=800&q=80' },
            { id: 'rows', title: 'Barbell Rows', sets: '3', reps: 10, muscle: 'Back', icon: Dumbbell, image: 'https://images.unsplash.com/photo-1603287681836-b174ce5074c2?w=800&q=80' },
            { id: 'lat-pulldown', title: 'Lat Pulldowns', sets: '3', reps: 12, muscle: 'Back', icon: ArrowDownToLine, image: 'https://images.unsplash.com/photo-1603287681836-b174ce5074c2?w=800&q=80' },
            { id: 'face-pulls', title: 'Face Pulls', sets: '4', reps: 20, muscle: 'Rear Delts', icon: Grab, image: 'https://images.unsplash.com/photo-1598971639058-9b196b22cdd8?w=800&q=80' },
            { id: 'bicep-curls', title: 'Barbell Curls', sets: '3', reps: 12, muscle: 'Biceps', icon: Dumbbell, image: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=800&q=80' },
            { id: 'hammer-curls', title: 'Hammer Curls', sets: '3', reps: 15, muscle: 'Biceps', icon: Dumbbell, image: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=800&q=80' }
        ]
    },
    legs: {
        title: "Leg Day",
        focus: "Quads, Hamstrings, Glutes",
        exercises: [
            { id: 'squats', title: 'Barbell Squats', sets: '4', reps: 8, muscle: 'Quads', icon: ArrowDown, image: 'https://images.unsplash.com/photo-1574680096141-1cddd32e0340?w=800&q=80' },
            { id: 'rdl', title: 'Romanian Deadlifts', sets: '3', reps: 10, muscle: 'Hamstrings', icon: ArrowDown, image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80' },
            { id: 'leg-press', title: 'Leg Press', sets: '3', reps: 12, muscle: 'Legs', icon: ArrowUp, image: 'https://images.unsplash.com/photo-1574680096141-1cddd32e0340?w=800&q=80' },
            { id: 'lunges', title: 'Walking Lunges', sets: '3', reps: 12, muscle: 'Glutes', icon: Footprints, image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&q=80' },
            { id: 'leg-extensions', title: 'Leg Extensions', sets: '3', reps: 15, muscle: 'Quads', icon: Activity, image: 'https://images.unsplash.com/photo-1574680096141-1cddd32e0340?w=800&q=80' },
            { id: 'hamstring-curls', title: 'Hamstring Curls', sets: '3', reps: 15, muscle: 'Hamstrings', icon: Activity, image: 'https://images.unsplash.com/photo-1574680096141-1cddd32e0340?w=800&q=80' },
            { id: 'calf-raises', title: 'Standing Calf Raises', sets: '4', reps: 20, muscle: 'Calves', icon: MoveVertical, image: 'https://images.unsplash.com/photo-1574680096141-1cddd32e0340?w=800&q=80' }
        ]
    },
    upper: {
        title: "Upper Body",
        focus: "Full Upper Body Hypertrophy",
        exercises: [
            { id: 'incline-bench', title: 'Incline Bench Press', sets: '3', reps: 10, muscle: 'Chest', icon: Dumbbell, image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&q=80' },
            { id: 'pullups-weighted', title: 'Weighted Pullups', sets: '3', reps: 8, muscle: 'Back', icon: ArrowUp, image: 'https://images.unsplash.com/photo-1598971639058-9b196b22cdd8?w=800&q=80' },
            { id: 'shoulder-press-db', title: 'Seated DB Press', sets: '3', reps: 12, muscle: 'Shoulders', icon: ArrowUpFromLine, image: 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=800&q=80' },
            { id: 'chest-flys', title: 'Cable Chest Flys', sets: '3', reps: 15, muscle: 'Chest', icon: Grab, image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&q=80' },
            { id: 'rows-cable', title: 'Cable Rows', sets: '3', reps: 12, muscle: 'Back', icon: Grab, image: 'https://images.unsplash.com/photo-1603287681836-b174ce5074c2?w=800&q=80' },
            { id: 'skull-crushers', title: 'Skull Crushers', sets: '3', reps: 12, muscle: 'Triceps', icon: Dumbbell, image: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=800&q=80' },
            { id: 'preacher-curls', title: 'Preacher Curls', sets: '3', reps: 12, muscle: 'Biceps', icon: Dumbbell, image: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=800&q=80' }
        ]
    },
    lower: {
        title: "Lower Body",
        focus: "Legs & Core Strength",
        exercises: [
            { id: 'front-squat', title: 'Front Squats', sets: '3', reps: 10, muscle: 'Quads', icon: ArrowDown, image: 'https://images.unsplash.com/photo-1574680096141-1cddd32e0340?w=800&q=80' },
            { id: 'rdl-db', title: 'Dumbbell RDLs', sets: '3', reps: 12, muscle: 'Hamstrings', icon: ArrowDown, image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80' },
            { id: 'bulgarian-split-squat', title: 'Bulgarian Split Squats', sets: '3', reps: 10, muscle: 'Legs', icon: Footprints, image: 'https://images.unsplash.com/photo-1574680096141-1cddd32e0340?w=800&q=80' },
            { id: 'hip-thrust', title: 'Hip Thrusts', sets: '3', reps: 12, muscle: 'Glutes', icon: ArrowUp, image: 'https://images.unsplash.com/photo-1574680096141-1cddd32e0340?w=800&q=80' },
            { id: 'leg-extensions-single', title: 'Single Leg Extensions', sets: '3', reps: 15, muscle: 'Quads', icon: Activity, image: 'https://images.unsplash.com/photo-1574680096141-1cddd32e0340?w=800&q=80' },
            { id: 'calf-raises-seated', title: 'Seated Calf Raises', sets: '4', reps: 20, muscle: 'Calves', icon: MoveVertical, image: 'https://images.unsplash.com/photo-1574680096141-1cddd32e0340?w=800&q=80' },
            { id: 'plank-weighted', title: 'Weighted Plank', sets: '3', reps: 60, muscle: 'Core', icon: Shield, image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&q=80' }
        ]
    }
};
