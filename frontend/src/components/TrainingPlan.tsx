import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Dumbbell, Activity, Timer, Bell, Flame, Settings, User, LogOut } from 'lucide-react';


const exercises = [
    {
        id: 'squats',
        title: 'Squats',
        description: 'Lower your hips from a standing position and then stand back up.',
        difficulty: 'Beginner',
        duration: '10 min',
        calories: '50 kcal',
        image: '/squats.png'
    },
    {
        id: 'pushups',
        title: 'Pushups',
        description: 'A conditioning exercise performed in a prone position.',
        difficulty: 'Intermediate',
        duration: '5 min',
        calories: '30 kcal',
        image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&q=80'
    },
    {
        id: 'lunges',
        title: 'Lunges',
        description: 'A single-leg bodyweight exercise that works your hips and legs.',
        difficulty: 'Beginner',
        duration: '8 min',
        calories: '40 kcal',
        image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&q=80'
    }
];

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

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {exercises.map((exercise) => (
                        <Card
                            key={exercise.id}
                            className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
                            onClick={() => navigate(`/exercise/${exercise.id}`)}
                        >
                            <div className="h-48 overflow-hidden">
                                <img
                                    src={exercise.image}
                                    alt={exercise.title}
                                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                />
                            </div>
                            <CardHeader>
                                <div className="flex justify-between items-start mb-2">
                                    <Badge variant={exercise.difficulty === 'Beginner' ? 'secondary' : 'default'}>
                                        {exercise.difficulty}
                                    </Badge>
                                </div>
                                <CardTitle className="text-2xl">{exercise.title}</CardTitle>
                                <CardDescription>{exercise.description}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex justify-between text-sm text-muted-foreground">
                                    <div className="flex items-center gap-1">
                                        <Timer className="w-4 h-4" />
                                        <span>{exercise.duration}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Activity className="w-4 h-4" />
                                        <span>{exercise.calories}</span>
                                    </div>
                                </div>
                                <Button className="w-full mt-4 group-hover:bg-primary/90">
                                    Start Training
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default TrainingPlan;
