import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from 'lucide-react';
import { toast } from "sonner";
import PoseDetector from './PoseDetector';
import AnalysisView from './AnalysisView';

import { trainingSplit } from '../data/training-plan';

const ExerciseDetail: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const exerciseTitle = id ? id.charAt(0).toUpperCase() + id.slice(1) : 'Exercise';

    // Find exercise to get target reps
    const exercise = Object.values(trainingSplit)
        .flatMap(day => day.exercises)
        .find(ex => ex.id === id);

    const targetReps = exercise?.reps || 10; // Default to 10 if not found

    // State to store recorded pose data
    const [recordedData, setRecordedData] = React.useState<any[]>([]);
    const [analysisFeedback, setAnalysisFeedback] = React.useState<string | null>(null);
    const [activeTab, setActiveTab] = React.useState("train");
    const [isAnalyzing, setIsAnalyzing] = React.useState(false);

    const handleRecordingComplete = (data: any[]) => {
        console.log("Recording complete, frames:", data.length);
        setRecordedData(data);
    };

    const handleAnalysisStart = () => {
        setIsAnalyzing(true);
        setActiveTab("analyze");
    };

    const handleAnalysisComplete = (feedback: string) => {
        setAnalysisFeedback(feedback);
        setIsAnalyzing(false);
        if (activeTab === 'train') {
            toast.success(feedback, {
                duration: 5000,
                className: "bg-green-500 text-white border-none"
            });
        }
    };

    return (
        <div className="h-[calc(100vh-10rem)] flex flex-col">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
                <div className="flex items-center justify-between mb-6 pb-4 border-b shrink-0">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="rounded-full">
                            <ArrowLeft className="h-6 w-6" />
                        </Button>
                        <h1 className="text-2xl font-semibold tracking-tight">{exerciseTitle}</h1>
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
                            exerciseId={id || 'unknown'}
                            targetReps={typeof targetReps === 'number' ? targetReps : 10}
                            onRecordingComplete={handleRecordingComplete}
                            onAnalysisComplete={handleAnalysisComplete}
                            onAnalysisStart={handleAnalysisStart}
                        />
                    </div>
                </TabsContent>

                <TabsContent value="analyze" className="flex-1 min-h-0 mt-0 animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
                    <AnalysisView
                        recordedData={recordedData}
                        analysisFeedback={analysisFeedback}
                        isAnalyzing={isAnalyzing}
                    />
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default ExerciseDetail;
