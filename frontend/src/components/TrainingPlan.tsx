import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    ChevronRight, PlayCircle, Layers, Hash, Repeat, Circle, Dumbbell,
    Footprints, ArrowUp, ArrowDown, Activity, Shield, MoveVertical, Grab,
    ArrowUpFromLine, ArrowDownToLine, Plus, Sparkles
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Initial data
const initialTrainingSplit = {
    push: {
        title: "Push Day",
        focus: "Chest, Shoulders, Triceps",
        exercises: [
            { id: 'bench-press', title: 'Barbell Bench Press', sets: '4', reps: '6-8', muscle: 'Chest', icon: Dumbbell, image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&q=80' },
            { id: 'incline-dumbbell-press', title: 'Incline Dumbbell Press', sets: '3', reps: '8-10', muscle: 'Chest', icon: Dumbbell, image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&q=80' },
            { id: 'shoulder-press', title: 'Overhead Press', sets: '3', reps: '8-10', muscle: 'Shoulders', icon: ArrowUpFromLine, image: 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=800&q=80' },
            { id: 'lateral-raises', title: 'Lateral Raises', sets: '4', reps: '12-15', muscle: 'Shoulders', icon: Dumbbell, image: 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=800&q=80' },
            { id: 'tricep-dips', title: 'Tricep Dips', sets: '3', reps: '10-12', muscle: 'Triceps', icon: ArrowDown, image: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=800&q=80' },
            { id: 'pushups', title: 'Pushups', sets: '3', reps: 'AMRAP', muscle: 'Chest', icon: ArrowDown, image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&q=80' },
            { id: 'tricep-pushdown', title: 'Tricep Pushdowns', sets: '3', reps: '12-15', muscle: 'Triceps', icon: ArrowDown, image: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=800&q=80' }
        ]
    },
    pull: {
        title: "Pull Day",
        focus: "Back, Biceps",
        exercises: [
            { id: 'deadlift', title: 'Deadlift', sets: '3', reps: '5', muscle: 'Back', icon: ArrowUpFromLine, image: 'https://images.unsplash.com/photo-1603287681836-b174ce5074c2?w=800&q=80' },
            { id: 'pullups', title: 'Pullups', sets: '3', reps: '8-10', muscle: 'Back', icon: ArrowUp, image: 'https://images.unsplash.com/photo-1598971639058-9b196b22cdd8?w=800&q=80' },
            { id: 'rows', title: 'Barbell Rows', sets: '3', reps: '8-10', muscle: 'Back', icon: Dumbbell, image: 'https://images.unsplash.com/photo-1603287681836-b174ce5074c2?w=800&q=80' },
            { id: 'lat-pulldown', title: 'Lat Pulldowns', sets: '3', reps: '10-12', muscle: 'Back', icon: ArrowDownToLine, image: 'https://images.unsplash.com/photo-1603287681836-b174ce5074c2?w=800&q=80' },
            { id: 'face-pulls', title: 'Face Pulls', sets: '4', reps: '15-20', muscle: 'Rear Delts', icon: Grab, image: 'https://images.unsplash.com/photo-1598971639058-9b196b22cdd8?w=800&q=80' },
            { id: 'bicep-curls', title: 'Barbell Curls', sets: '3', reps: '10-12', muscle: 'Biceps', icon: Dumbbell, image: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=800&q=80' },
            { id: 'hammer-curls', title: 'Hammer Curls', sets: '3', reps: '12-15', muscle: 'Biceps', icon: Dumbbell, image: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=800&q=80' }
        ]
    },
    legs: {
        title: "Leg Day",
        focus: "Quads, Hamstrings, Glutes",
        exercises: [
            { id: 'squats', title: 'Barbell Squats', sets: '4', reps: '6-8', muscle: 'Quads', icon: ArrowDown, image: 'https://images.unsplash.com/photo-1574680096141-1cddd32e0340?w=800&q=80' },
            { id: 'rdl', title: 'Romanian Deadlifts', sets: '3', reps: '8-10', muscle: 'Hamstrings', icon: ArrowDown, image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80' },
            { id: 'leg-press', title: 'Leg Press', sets: '3', reps: '10-12', muscle: 'Legs', icon: ArrowUp, image: 'https://images.unsplash.com/photo-1574680096141-1cddd32e0340?w=800&q=80' },
            { id: 'lunges', title: 'Walking Lunges', sets: '3', reps: '12 each', muscle: 'Glutes', icon: Footprints, image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&q=80' },
            { id: 'leg-extensions', title: 'Leg Extensions', sets: '3', reps: '12-15', muscle: 'Quads', icon: Activity, image: 'https://images.unsplash.com/photo-1574680096141-1cddd32e0340?w=800&q=80' },
            { id: 'hamstring-curls', title: 'Hamstring Curls', sets: '3', reps: '12-15', muscle: 'Hamstrings', icon: Activity, image: 'https://images.unsplash.com/photo-1574680096141-1cddd32e0340?w=800&q=80' },
            { id: 'calf-raises', title: 'Standing Calf Raises', sets: '4', reps: '15-20', muscle: 'Calves', icon: MoveVertical, image: 'https://images.unsplash.com/photo-1574680096141-1cddd32e0340?w=800&q=80' }
        ]
    },
    upper: {
        title: "Upper Body",
        focus: "Full Upper Body Hypertrophy",
        exercises: [
            { id: 'incline-bench', title: 'Incline Bench Press', sets: '3', reps: '8-10', muscle: 'Chest', icon: Dumbbell, image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&q=80' },
            { id: 'pullups-weighted', title: 'Weighted Pullups', sets: '3', reps: '6-8', muscle: 'Back', icon: ArrowUp, image: 'https://images.unsplash.com/photo-1598971639058-9b196b22cdd8?w=800&q=80' },
            { id: 'shoulder-press-db', title: 'Seated DB Press', sets: '3', reps: '10-12', muscle: 'Shoulders', icon: ArrowUpFromLine, image: 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=800&q=80' },
            { id: 'chest-flys', title: 'Cable Chest Flys', sets: '3', reps: '12-15', muscle: 'Chest', icon: Grab, image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&q=80' },
            { id: 'rows-cable', title: 'Cable Rows', sets: '3', reps: '10-12', muscle: 'Back', icon: Grab, image: 'https://images.unsplash.com/photo-1603287681836-b174ce5074c2?w=800&q=80' },
            { id: 'skull-crushers', title: 'Skull Crushers', sets: '3', reps: '10-12', muscle: 'Triceps', icon: Dumbbell, image: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=800&q=80' },
            { id: 'preacher-curls', title: 'Preacher Curls', sets: '3', reps: '10-12', muscle: 'Biceps', icon: Dumbbell, image: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=800&q=80' }
        ]
    },
    lower: {
        title: "Lower Body",
        focus: "Legs & Core Strength",
        exercises: [
            { id: 'front-squat', title: 'Front Squats', sets: '3', reps: '8-10', muscle: 'Quads', icon: ArrowDown, image: 'https://images.unsplash.com/photo-1574680096141-1cddd32e0340?w=800&q=80' },
            { id: 'rdl-db', title: 'Dumbbell RDLs', sets: '3', reps: '10-12', muscle: 'Hamstrings', icon: ArrowDown, image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80' },
            { id: 'bulgarian-split-squat', title: 'Bulgarian Split Squats', sets: '3', reps: '10 each', muscle: 'Legs', icon: Footprints, image: 'https://images.unsplash.com/photo-1574680096141-1cddd32e0340?w=800&q=80' },
            { id: 'hip-thrust', title: 'Hip Thrusts', sets: '3', reps: '10-12', muscle: 'Glutes', icon: ArrowUp, image: 'https://images.unsplash.com/photo-1574680096141-1cddd32e0340?w=800&q=80' },
            { id: 'leg-extensions-single', title: 'Single Leg Extensions', sets: '3', reps: '12-15', muscle: 'Quads', icon: Activity, image: 'https://images.unsplash.com/photo-1574680096141-1cddd32e0340?w=800&q=80' },
            { id: 'calf-raises-seated', title: 'Seated Calf Raises', sets: '4', reps: '15-20', muscle: 'Calves', icon: MoveVertical, image: 'https://images.unsplash.com/photo-1574680096141-1cddd32e0340?w=800&q=80' },
            { id: 'plank-weighted', title: 'Weighted Plank', sets: '3', reps: '60s', muscle: 'Core', icon: Shield, image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&q=80' }
        ]
    }
};

// Helper for Notion-like colors
const getMuscleColor = (muscle: string) => {
    const colors: Record<string, string> = {
        'Chest': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
        'Back': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
        'Shoulders': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
        'Biceps': 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
        'Triceps': 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
        'Legs': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
        'Quads': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
        'Hamstrings': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
        'Glutes': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
        'Calves': 'bg-stone-100 text-stone-700 dark:bg-stone-900/30 dark:text-stone-400',
        'Core': 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
    };
    return colors[muscle] || 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
};

const TrainingPlan: React.FC = () => {
    const navigate = useNavigate();
    const [trainingSplit, setTrainingSplit] = useState(initialTrainingSplit);
    const [isNewWorkoutOpen, setIsNewWorkoutOpen] = useState(false);
    const [isAddExerciseOpen, setIsAddExerciseOpen] = useState(false);
    const [currentWorkoutKey, setCurrentWorkoutKey] = useState<string | null>(null);

    // Form states
    const [newWorkoutName, setNewWorkoutName] = useState('');
    const [newExercise, setNewExercise] = useState({
        title: '',
        muscle: '',
        sets: '',
        reps: ''
    });

    const handleCreateWorkout = () => {
        if (!newWorkoutName.trim()) return;
        const key = newWorkoutName.toLowerCase().replace(/\s+/g, '-');
        setTrainingSplit(prev => ({
            ...prev,
            [key]: {
                title: newWorkoutName,
                focus: "Custom Workout",
                exercises: []
            }
        }));
        setNewWorkoutName('');
        setIsNewWorkoutOpen(false);
    };

    const handleAddExercise = () => {
        if (!currentWorkoutKey || !newExercise.title) return;

        setTrainingSplit(prev => {
            const workout = prev[currentWorkoutKey as keyof typeof prev];
            return {
                ...prev,
                [currentWorkoutKey]: {
                    ...workout,
                    exercises: [
                        ...workout.exercises,
                        {
                            id: Date.now().toString(),
                            title: newExercise.title,
                            sets: newExercise.sets,
                            reps: newExercise.reps,
                            muscle: newExercise.muscle,
                            icon: Dumbbell, // Default icon
                            image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&q=80' // Default image
                        }
                    ]
                }
            };
        });

        setNewExercise({ title: '', muscle: '', sets: '', reps: '' });
        setIsAddExerciseOpen(false);
    };

    return (
        <div className="w-full">
            <Tabs defaultValue="push" className="w-full space-y-8">
                <div className="flex items-center justify-between border-b w-full">
                    <TabsList className="flex gap-6 bg-transparent p-0 h-auto border-b-0 rounded-none overflow-x-auto no-scrollbar max-w-[calc(100%-150px)]">
                        {Object.entries(trainingSplit).map(([key, session]) => (
                            <TabsTrigger
                                key={key}
                                value={key}
                                className="rounded-none border-b-2 border-transparent px-4 py-2 text-muted-foreground data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none transition-all hover:text-foreground whitespace-nowrap"
                            >
                                {session.title}
                            </TabsTrigger>
                        ))}
                    </TabsList>

                    <Dialog open={isNewWorkoutOpen} onOpenChange={setIsNewWorkoutOpen}>
                        <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground mb-1 shrink-0">
                                <Plus className="w-4 h-4" /> New Workout
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Create New Workout</DialogTitle>
                                <DialogDescription>
                                    Add a new workout day to your training split.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="name">Workout Name</Label>
                                    <Input
                                        id="name"
                                        value={newWorkoutName}
                                        onChange={(e) => setNewWorkoutName(e.target.value)}
                                        placeholder="e.g., Core & Cardio"
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button onClick={handleCreateWorkout}>Create Workout</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

                {Object.entries(trainingSplit).map(([key, session]) => (
                    <TabsContent key={key} value={key} className="space-y-6 animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
                        <div className="flex justify-between items-end mb-8">
                            <div>
                                <h2 className="text-3xl font-bold tracking-tight mb-2">{session.title}</h2>
                                <p className="text-muted-foreground text-lg">
                                    Focus: {session.focus}
                                </p>
                            </div>
                            <div className="flex items-center gap-3">
                                <Dialog open={isAddExerciseOpen} onOpenChange={(open) => {
                                    setIsAddExerciseOpen(open);
                                    if (open) setCurrentWorkoutKey(key);
                                }}>
                                    <DialogTrigger asChild>
                                        <Button variant="outline" size="lg" className="gap-2 rounded-full px-6">
                                            <Plus className="w-5 h-5" /> Add Exercise
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Add Exercise</DialogTitle>
                                            <DialogDescription>
                                                Add a new exercise to {session.title}.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="grid gap-4 py-4">
                                            <div className="grid gap-2">
                                                <Label htmlFor="ex-name">Exercise Name</Label>
                                                <Input
                                                    id="ex-name"
                                                    value={newExercise.title}
                                                    onChange={(e) => setNewExercise({ ...newExercise, title: e.target.value })}
                                                    placeholder="e.g., Bench Press"
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="grid gap-2">
                                                    <Label htmlFor="muscle">Target Muscle</Label>
                                                    <Input
                                                        id="muscle"
                                                        value={newExercise.muscle}
                                                        onChange={(e) => setNewExercise({ ...newExercise, muscle: e.target.value })}
                                                        placeholder="e.g., Chest"
                                                    />
                                                </div>
                                                <div className="grid gap-2">
                                                    <Label htmlFor="sets">Sets</Label>
                                                    <Input
                                                        id="sets"
                                                        value={newExercise.sets}
                                                        onChange={(e) => setNewExercise({ ...newExercise, sets: e.target.value })}
                                                        placeholder="e.g., 3"
                                                    />
                                                </div>
                                            </div>
                                            <div className="grid gap-2">
                                                <Label htmlFor="reps">Reps</Label>
                                                <Input
                                                    id="reps"
                                                    value={newExercise.reps}
                                                    onChange={(e) => setNewExercise({ ...newExercise, reps: e.target.value })}
                                                    placeholder="e.g., 8-12"
                                                />
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <Button onClick={handleAddExercise}>Add Exercise</Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>

                                <Button size="lg" className="gap-2 rounded-full px-8">
                                    Start Session <PlayCircle className="w-5 h-5" />
                                </Button>
                            </div>
                        </div>

                        <div className="flex flex-col lg:flex-row gap-6">
                            <div className="flex-1 rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="hover:bg-transparent border-b border-border/50">
                                            <TableHead className="w-[400px] h-10">
                                                <div className="flex items-center gap-2 text-muted-foreground">
                                                    <Layers className="w-4 h-4" />
                                                    Exercise
                                                </div>
                                            </TableHead>
                                            <TableHead className="h-10">
                                                <div className="flex items-center gap-2 text-muted-foreground">
                                                    <Circle className="w-4 h-4" />
                                                    Target Muscle
                                                </div>
                                            </TableHead>
                                            <TableHead className="h-10">
                                                <div className="flex items-center gap-2 text-muted-foreground">
                                                    <Hash className="w-4 h-4" />
                                                    Sets
                                                </div>
                                            </TableHead>
                                            <TableHead className="h-10">
                                                <div className="flex items-center gap-2 text-muted-foreground">
                                                    <Repeat className="w-4 h-4" />
                                                    Reps
                                                </div>
                                            </TableHead>
                                            <TableHead className="text-right h-10">Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {session.exercises.map((exercise) => (
                                            <TableRow
                                                key={exercise.id}
                                                className="cursor-pointer hover:bg-muted/50 transition-colors group border-b border-border/50"
                                                onClick={() => navigate(`/exercise/${exercise.id}`)}
                                            >
                                                <TableCell className="font-medium py-4">
                                                    <div className="flex items-center gap-4">
                                                        <div className="h-10 w-10 rounded-lg flex items-center justify-center bg-muted shrink-0 text-muted-foreground">
                                                            <exercise.icon className="w-5 h-5" />
                                                        </div>
                                                        <span className="text-base">{exercise.title}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-4">
                                                    <Badge variant="secondary" className={`font-normal rounded-sm px-2 py-1 text-xs gap-1.5 ${getMuscleColor(exercise.muscle)}`}>
                                                        <div className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />
                                                        {exercise.muscle}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="py-4">
                                                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                                                        {exercise.sets}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-4">
                                                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                                                        {exercise.reps}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right py-4">
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <ChevronRight className="w-4 h-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* AI Status Panel */}
                            <div className="w-full lg:w-[320px]">
                                <div className="rounded-3xl border shadow-sm p-6 flex flex-col bg-purple-500/10 border-purple-500/20 h-full min-h-[300px]">
                                    <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
                                        <Sparkles className="w-4 h-4 text-purple-500 fill-purple-500/20" />
                                        <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                                            AI Agent Active
                                        </span>
                                    </h2>
                                    <div className="flex-1 flex flex-col items-center justify-center text-center gap-4">
                                        <div className="w-16 h-16 rounded-full bg-purple-500/10 flex items-center justify-center animate-pulse">
                                            <Sparkles className="w-8 h-8 text-purple-500" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-purple-900 dark:text-purple-100">Plan Optimized</p>
                                            <p className="text-sm text-muted-foreground mt-1">
                                                Your training split has been adjusted based on your recent performance and recovery data.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </TabsContent>
                ))}
            </Tabs>
        </div>
    );
};

export default TrainingPlan;
