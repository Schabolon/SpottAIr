import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from 'lucide-react';
import PoseDetector from './PoseDetector';
import AnalysisView from './AnalysisView';

const ExerciseDetail: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const exerciseTitle = id ? id.charAt(0).toUpperCase() + id.slice(1) : 'Exercise';

    // State to store recorded pose data
    const [recordedData, setRecordedData] = React.useState<any[]>([]);

    const handleRecordingComplete = (data: any[]) => {
        console.log("Recording complete, frames:", data.length);
        setRecordedData(data);
    };

    return (
        <div className="h-[calc(100vh-10rem)] flex flex-col">
            <Tabs defaultValue="train" className="flex-1 flex flex-col min-h-0">
                <div className="flex items-center justify-between mb-4 shrink-0">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="rounded-full">
                            <ArrowLeft className="h-6 w-6" />
                        </Button>
                        <h1 className="text-3xl font-bold tracking-tight">{exerciseTitle}</h1>
                    </div>

                    <TabsList className="grid w-[300px] grid-cols-2 h-10 bg-muted/50 p-1 rounded-lg">
                        <TabsTrigger value="train" className="text-xs font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md transition-all">Training</TabsTrigger>
                        <TabsTrigger value="analyze" className="text-xs font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md transition-all">Analysis</TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="train" className="flex-1 min-h-0 mt-0 animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
                    <div className="h-full bg-card rounded-3xl border shadow-sm overflow-hidden">
                        <PoseDetector
                            exerciseId={id || 'unknown'}
                            onRecordingComplete={handleRecordingComplete}
                        />
                    </div>
                </TabsContent>

                <TabsContent value="analyze" className="flex-1 min-h-0 mt-0 animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
                    <AnalysisView recordedData={recordedData} />
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default ExerciseDetail;
