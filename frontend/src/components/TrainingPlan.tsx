import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Dumbbell, Activity, ChevronRight, PlayCircle, Trophy
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

// Mock data for 5-day split
const trainingSplit = {
    push: {
        title: "Push Day",
        focus: "Chest, Shoulders, Triceps",
        exercises: [
            { id: 'bench-press', title: 'Barbell Bench Press', sets: '4', reps: '6-8', muscle: 'Chest', image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&q=80' },
            { id: 'incline-dumbbell-press', title: 'Incline Dumbbell Press', sets: '3', reps: '8-10', muscle: 'Chest', image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&q=80' },
            { id: 'shoulder-press', title: 'Overhead Press', sets: '3', reps: '8-10', muscle: 'Shoulders', image: 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=800&q=80' },
            { id: 'lateral-raises', title: 'Lateral Raises', sets: '4', reps: '12-15', muscle: 'Shoulders', image: 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=800&q=80' },
            { id: 'tricep-dips', title: 'Tricep Dips', sets: '3', reps: '10-12', muscle: 'Triceps', image: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=800&q=80' },
            { id: 'pushups', title: 'Pushups', sets: '3', reps: 'AMRAP', muscle: 'Chest', image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&q=80' },
            { id: 'tricep-pushdown', title: 'Tricep Pushdowns', sets: '3', reps: '12-15', muscle: 'Triceps', image: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=800&q=80' }
        ]
    },
    pull: {
        title: "Pull Day",
        focus: "Back, Biceps",
        exercises: [
            { id: 'deadlift', title: 'Deadlift', sets: '3', reps: '5', muscle: 'Back', image: 'https://images.unsplash.com/photo-1603287681836-b174ce5074c2?w=800&q=80' },
            { id: 'pullups', title: 'Pullups', sets: '3', reps: '8-10', muscle: 'Back', image: 'https://images.unsplash.com/photo-1598971639058-9b196b22cdd8?w=800&q=80' },
            { id: 'rows', title: 'Barbell Rows', sets: '3', reps: '8-10', muscle: 'Back', image: 'https://images.unsplash.com/photo-1603287681836-b174ce5074c2?w=800&q=80' },
            { id: 'lat-pulldown', title: 'Lat Pulldowns', sets: '3', reps: '10-12', muscle: 'Back', image: 'https://images.unsplash.com/photo-1603287681836-b174ce5074c2?w=800&q=80' },
            { id: 'face-pulls', title: 'Face Pulls', sets: '4', reps: '15-20', muscle: 'Rear Delts', image: 'https://images.unsplash.com/photo-1598971639058-9b196b22cdd8?w=800&q=80' },
            { id: 'bicep-curls', title: 'Barbell Curls', sets: '3', reps: '10-12', muscle: 'Biceps', image: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=800&q=80' },
            { id: 'hammer-curls', title: 'Hammer Curls', sets: '3', reps: '12-15', muscle: 'Biceps', image: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=800&q=80' }
        ]
    },
    legs: {
        title: "Leg Day",
        focus: "Quads, Hamstrings, Glutes",
        exercises: [
            { id: 'squats', title: 'Barbell Squats', sets: '4', reps: '6-8', muscle: 'Quads', image: 'https://images.unsplash.com/photo-1574680096141-1cddd32e0340?w=800&q=80' },
            { id: 'rdl', title: 'Romanian Deadlifts', sets: '3', reps: '8-10', muscle: 'Hamstrings', image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80' },
            { id: 'leg-press', title: 'Leg Press', sets: '3', reps: '10-12', muscle: 'Legs', image: 'https://images.unsplash.com/photo-1574680096141-1cddd32e0340?w=800&q=80' },
            { id: 'lunges', title: 'Walking Lunges', sets: '3', reps: '12 each', muscle: 'Glutes', image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&q=80' },
            { id: 'leg-extensions', title: 'Leg Extensions', sets: '3', reps: '12-15', muscle: 'Quads', image: 'https://images.unsplash.com/photo-1574680096141-1cddd32e0340?w=800&q=80' },
            { id: 'hamstring-curls', title: 'Hamstring Curls', sets: '3', reps: '12-15', muscle: 'Hamstrings', image: 'https://images.unsplash.com/photo-1574680096141-1cddd32e0340?w=800&q=80' },
            { id: 'calf-raises', title: 'Standing Calf Raises', sets: '4', reps: '15-20', muscle: 'Calves', image: 'https://images.unsplash.com/photo-1574680096141-1cddd32e0340?w=800&q=80' }
        ]
    },
    upper: {
        title: "Upper Body",
        focus: "Full Upper Body Hypertrophy",
        exercises: [
            { id: 'incline-bench', title: 'Incline Bench Press', sets: '3', reps: '8-10', muscle: 'Chest', image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&q=80' },
            { id: 'pullups-weighted', title: 'Weighted Pullups', sets: '3', reps: '6-8', muscle: 'Back', image: 'https://images.unsplash.com/photo-1598971639058-9b196b22cdd8?w=800&q=80' },
            { id: 'shoulder-press-db', title: 'Seated DB Press', sets: '3', reps: '10-12', muscle: 'Shoulders', image: 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=800&q=80' },
            { id: 'chest-flys', title: 'Cable Chest Flys', sets: '3', reps: '12-15', muscle: 'Chest', image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&q=80' },
            { id: 'rows-cable', title: 'Cable Rows', sets: '3', reps: '10-12', muscle: 'Back', image: 'https://images.unsplash.com/photo-1603287681836-b174ce5074c2?w=800&q=80' },
            { id: 'skull-crushers', title: 'Skull Crushers', sets: '3', reps: '10-12', muscle: 'Triceps', image: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=800&q=80' },
            { id: 'preacher-curls', title: 'Preacher Curls', sets: '3', reps: '10-12', muscle: 'Biceps', image: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=800&q=80' }
        ]
    },
    lower: {
        title: "Lower Body",
        focus: "Legs & Core Strength",
        exercises: [
            { id: 'front-squat', title: 'Front Squats', sets: '3', reps: '8-10', muscle: 'Quads', image: 'https://images.unsplash.com/photo-1574680096141-1cddd32e0340?w=800&q=80' },
            { id: 'rdl-db', title: 'Dumbbell RDLs', sets: '3', reps: '10-12', muscle: 'Hamstrings', image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80' },
            { id: 'bulgarian-split-squat', title: 'Bulgarian Split Squats', sets: '3', reps: '10 each', muscle: 'Legs', image: 'https://images.unsplash.com/photo-1574680096141-1cddd32e0340?w=800&q=80' },
            { id: 'hip-thrust', title: 'Hip Thrusts', sets: '3', reps: '10-12', muscle: 'Glutes', image: 'https://images.unsplash.com/photo-1574680096141-1cddd32e0340?w=800&q=80' },
            { id: 'leg-extensions-single', title: 'Single Leg Extensions', sets: '3', reps: '12-15', muscle: 'Quads', image: 'https://images.unsplash.com/photo-1574680096141-1cddd32e0340?w=800&q=80' },
            { id: 'calf-raises-seated', title: 'Seated Calf Raises', sets: '4', reps: '15-20', muscle: 'Calves', image: 'https://images.unsplash.com/photo-1574680096141-1cddd32e0340?w=800&q=80' },
            { id: 'plank-weighted', title: 'Weighted Plank', sets: '3', reps: '60s', muscle: 'Core', image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&q=80' }
        ]
    }
};

const TrainingPlan: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="w-full">
            <Tabs defaultValue="push" className="w-full space-y-8">
                <TabsList className="grid w-full grid-cols-5 h-12 bg-muted/50 p-1 rounded-lg">
                    <TabsTrigger value="push" className="text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md transition-all">Push</TabsTrigger>
                    <TabsTrigger value="pull" className="text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md transition-all">Pull</TabsTrigger>
                    <TabsTrigger value="legs" className="text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md transition-all">Legs</TabsTrigger>
                    <TabsTrigger value="upper" className="text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md transition-all">Upper</TabsTrigger>
                    <TabsTrigger value="lower" className="text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md transition-all">Lower</TabsTrigger>
                </TabsList>

                {Object.entries(trainingSplit).map(([key, session]) => (
                    <TabsContent key={key} value={key} className="space-y-6 animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
                        <div className="flex justify-between items-end mb-8">
                            <div>
                                <h2 className="text-3xl font-bold tracking-tight mb-2">{session.title}</h2>
                                <p className="text-muted-foreground text-lg flex items-center gap-2">
                                    <Trophy className="w-5 h-5 text-yellow-500" />
                                    Focus: {session.focus}
                                </p>
                            </div>
                            <Button size="lg" className="gap-2 rounded-full px-8">
                                Start Session <PlayCircle className="w-5 h-5" />
                            </Button>
                        </div>

                        <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow className="hover:bg-transparent">
                                        <TableHead className="w-[400px]">Exercise</TableHead>
                                        <TableHead>Target Muscle</TableHead>
                                        <TableHead>Sets</TableHead>
                                        <TableHead>Reps</TableHead>
                                        <TableHead className="text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {session.exercises.map((exercise) => (
                                        <TableRow
                                            key={exercise.id}
                                            className="cursor-pointer hover:bg-muted/50 transition-colors group"
                                            onClick={() => navigate(`/exercise/${exercise.id}`)}
                                        >
                                            <TableCell className="font-medium">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-12 w-12 rounded-lg overflow-hidden bg-muted shrink-0">
                                                        <img
                                                            src={exercise.image}
                                                            alt={exercise.title}
                                                            className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                        />
                                                    </div>
                                                    <span className="text-base">{exercise.title}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="secondary" className="font-normal">
                                                    {exercise.muscle}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2 text-muted-foreground">
                                                    <Dumbbell className="w-4 h-4" />
                                                    {exercise.sets}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2 text-muted-foreground">
                                                    <Activity className="w-4 h-4" />
                                                    {exercise.reps}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <ChevronRight className="w-5 h-5" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </TabsContent>
                ))}
            </Tabs>
        </div>
    );
};

export default TrainingPlan;
