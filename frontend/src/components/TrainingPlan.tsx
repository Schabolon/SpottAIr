import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dumbbell, Activity, Bell, Flame, Settings, User, LogOut, ChevronRight, PlayCircle } from 'lucide-react';
import { ModeToggle } from "@/components/mode-toggle";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
            { id: 'deadlift', title: 'Deadlift', sets: '3', reps: '5', muscle: 'Back', image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80' },
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
            { id: 'squats', title: 'Barbell Squats', sets: '4', reps: '6-8', muscle: 'Quads', image: '/squats.png' },
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
            { id: 'front-squat', title: 'Front Squats', sets: '3', reps: '8-10', muscle: 'Quads', image: '/squats.png' },
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
        <div className="min-h-screen bg-background p-8">
            <div className="max-w-6xl mx-auto">
                <header className="flex justify-between items-center mb-12">
                    <div>
                        <h1 className="text-4xl font-bold tracking-tight mb-2 flex items-center gap-2">
                            <Dumbbell className="w-10 h-10 text-primary" />
                            SpottAIr
                        </h1>
                        <p className="text-muted-foreground text-lg">Ready to crush your goals today?</p>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2 bg-orange-500/10 text-orange-500 px-4 py-2 rounded-full font-medium">
                            <Flame className="w-5 h-5 fill-orange-500" />
                            <span>12 Day Streak</span>
                        </div>

                        <ModeToggle />

                        <Button variant="ghost" size="icon" className="relative">
                            <Bell className="w-6 h-6" />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
                        </Button>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Avatar className="h-12 w-12 cursor-pointer hover:ring-2 ring-primary transition-all">
                                    <AvatarImage src="https://github.com/shadcn.png" />
                                    <AvatarFallback>JD</AvatarFallback>
                                </Avatar>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="cursor-pointer">
                                    <User className="mr-2 h-4 w-4" />
                                    <span>Profile</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem className="cursor-pointer">
                                    <Settings className="mr-2 h-4 w-4" />
                                    <span>Settings</span>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="cursor-pointer text-red-500 focus:text-red-500">
                                    <LogOut className="mr-2 h-4 w-4" />
                                    <span>Log out</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </header>

                <Tabs defaultValue="push" className="w-full space-y-8">
                    <TabsList className="grid w-full grid-cols-5 h-14 bg-muted/50 p-1 rounded-xl">
                        <TabsTrigger value="push" className="text-lg data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg transition-all">Push</TabsTrigger>
                        <TabsTrigger value="pull" className="text-lg data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg transition-all">Pull</TabsTrigger>
                        <TabsTrigger value="legs" className="text-lg data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg transition-all">Legs</TabsTrigger>
                        <TabsTrigger value="upper" className="text-lg data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg transition-all">Upper</TabsTrigger>
                        <TabsTrigger value="lower" className="text-lg data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg transition-all">Lower</TabsTrigger>
                    </TabsList>

                    {Object.entries(trainingSplit).map(([key, session]) => (
                        <TabsContent key={key} value={key} className="space-y-6 animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
                            <div className="bg-card rounded-2xl p-6 shadow-sm border border-border/50">
                                <div className="flex justify-between items-end mb-6">
                                    <div>
                                        <h2 className="text-3xl font-bold tracking-tight">{session.title}</h2>
                                        <p className="text-muted-foreground text-lg mt-1 flex items-center gap-2">
                                            <Activity className="w-5 h-5" />
                                            Focus: {session.focus}
                                        </p>
                                    </div>
                                    <Button size="lg" className="gap-2">
                                        Start Session <PlayCircle className="w-5 h-5" />
                                    </Button>
                                </div>

                                <div className="space-y-4">
                                    {session.exercises.map((exercise, index) => (
                                        <div
                                            key={exercise.id}
                                            className="group flex items-center gap-4 p-4 rounded-xl bg-background hover:bg-accent/50 border border-border/50 transition-all cursor-pointer"
                                            onClick={() => navigate(`/exercise/${exercise.id}`)}
                                        >
                                            <div className="h-16 w-16 rounded-lg overflow-hidden bg-muted shrink-0">
                                                <img
                                                    src={exercise.image}
                                                    alt={exercise.title}
                                                    className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                />
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="text-lg font-semibold truncate">{exercise.title}</h3>
                                                    <Badge variant="secondary" className="text-xs font-normal">
                                                        {exercise.muscle}
                                                    </Badge>
                                                </div>
                                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                    <span className="flex items-center gap-1">
                                                        <Dumbbell className="w-3 h-3" /> {exercise.sets} Sets
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Activity className="w-3 h-3" /> {exercise.reps} Reps
                                                    </span>
                                                </div>
                                            </div>

                                            <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                <ChevronRight className="w-5 h-5" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </TabsContent>
                    ))}
                </Tabs>
            </div>
        </div>
    );
};

export default TrainingPlan;
