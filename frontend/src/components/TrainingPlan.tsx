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

import { trainingSplit as initialTrainingSplit } from '../data/training-plan';

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
