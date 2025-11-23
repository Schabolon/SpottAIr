import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from 'lucide-react';
import { toast } from "sonner";
import PoseDetector from './PoseDetector';
import AnalysisView from './AnalysisView';

import { useTrainingPlan } from '../context/TrainingPlanContext';

const ExerciseDetail: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const exerciseTitle = id ? id.charAt(0).toUpperCase() + id.slice(1) : 'Exercise';

    const { trainingSplit, addExerciseToWorkout, updateTrainingSplit } = useTrainingPlan();

    // Find exercise to get target reps
    const exercise = Object.values(trainingSplit)
        .flatMap(day => day.exercises)
        .find(ex => ex.id === id);

    const targetReps = exercise?.reps || 10; // Default to 10 if not found
    const totalSets = exercise?.sets ? parseInt(exercise.sets) : 3;

    // State to store recorded pose data
    const [recordedData, setRecordedData] = React.useState<any[]>([]);
    const [analysisFeedback, setAnalysisFeedback] = React.useState<string | null>(null);
    const [recommendation, setRecommendation] = React.useState<any | null>(null);
    const [activeTab, setActiveTab] = React.useState("train");
    const [isAnalyzing, setIsAnalyzing] = React.useState(false);
    const [currentSet, setCurrentSet] = React.useState(1);

    const handleRecordingComplete = (data: any[]) => {
        console.log("Recording complete, frames:", data.length);
        setRecordedData(data);
    };

    const handleAnalysisStart = () => {
        setIsAnalyzing(true);
        setActiveTab("analyze");
    };

    const handleNextSet = () => {
        if (currentSet < totalSets) {
            setCurrentSet(prev => prev + 1);
            // Reset logic will be handled inside PoseDetector when set changes or via a key
        } else {
            toast.success("Exercise Completed! 🎉");
            // Optional: Navigate to next exercise
        }
    };

    const handleAnalysisComplete = (feedback: string, rec?: any) => {
        console.log("ExerciseDetail received recommendation:", rec);
        setAnalysisFeedback(feedback);
        setRecommendation(rec);
        setIsAnalyzing(false);
        if (activeTab === 'train') {
            toast.success(feedback, {
                duration: 5000,
                className: "bg-green-500 text-white border-none"
            });
        }
    };

    const handleAddToPlan = () => {
        if (!recommendation) return;

        // Find which workout this exercise belongs to
        const workoutEntry = Object.entries(trainingSplit).find(([_, session]) =>
            session.exercises.some(ex => ex.id === id)
        );

        const workoutKey = workoutEntry ? workoutEntry[0] : 'push'; // Default to push if not found

        addExerciseToWorkout(workoutKey, {
            title: recommendation.exercise,
            sets: "3",
            reps: "10-12",
            muscle: "Targeted"
        });

        toast.success(`Added ${recommendation.exercise} to your plan!`, {
            className: "bg-purple-500 text-white border-none"
        });
    };

    return (
        <div className="h-[calc(100vh-10rem)] flex flex-col">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
                <div className="flex items-center justify-between mb-6 pb-4 border-b shrink-0">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="rounded-full">
                            <ArrowLeft className="h-6 w-6" />
                        </Button>
                        <div className="flex flex-col">
                            <h1 className="text-2xl font-semibold tracking-tight">{exerciseTitle}</h1>
                            <span className="text-sm text-muted-foreground">Set {currentSet} of {totalSets}</span>
                        </div>
                    </div>

                    <TabsList className="flex gap-6 bg-transparent p-0 h-auto">
                        <TabsTrigger
                            value="train"
                            className="rounded-none border-b-2 border-transparent px-0 py-2 text-muted-foreground data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none transition-all hover:text-foreground"
                        >
                            Training
                        </TabsTrigger>
                        <TabsTrigger
                            value="analyze"
                            className="rounded-none border-b-2 border-transparent px-0 py-2 text-muted-foreground data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none transition-all hover:text-foreground"
                        >
                            Analysis
                        </TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="train" className="flex-1 min-h-0 mt-0 animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
                    <div className="h-full overflow-hidden">
                        <PoseDetector
                            key={currentSet} // Reset PoseDetector on new set
                            exerciseId={id || 'unknown'}
                            targetReps={typeof targetReps === 'number' ? targetReps : 10}
                            currentSet={currentSet}
                            totalSets={totalSets}
                            onNextSet={handleNextSet}
                            onRecordingComplete={handleRecordingComplete}
                            onAnalysisComplete={handleAnalysisComplete}
                            onAnalysisStart={handleAnalysisStart}
                            autoStart={currentSet > 1}
                        />
                    </div>
                </TabsContent>

                <TabsContent value="analyze" className="flex-1 min-h-0 mt-0 animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
                    <AnalysisView
                        recordedData={recordedData}
                        analysisFeedback={analysisFeedback}
                        isAnalyzing={isAnalyzing}
                        recommendation={recommendation}
                        onAddToPlan={handleAddToPlan}
                        currentPlan={trainingSplit}
                        onUpdatePlan={(newPlan, explanation) => {
                            updateTrainingSplit(newPlan, explanation);
                            toast.success("Training plan updated successfully! 🚀", {
                                className: "bg-purple-500 text-white border-none"
                            });
                        }}
                    />
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default ExerciseDetail;
