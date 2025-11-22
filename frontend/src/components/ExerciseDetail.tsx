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
        <div className="min-h-screen bg-background p-4 md:p-8">
            <div className="max-w-6xl mx-auto">
                <div className="flex items-center gap-4 mb-6">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
                        <ArrowLeft className="h-6 w-6" />
                    </Button>
                    <h1 className="text-3xl font-bold tracking-tight">{exerciseTitle} Training</h1>
                </div>

                <Tabs defaultValue="train" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-8">
                        <TabsTrigger value="train">Real-time Training</TabsTrigger>
                        <TabsTrigger value="analyze">Analysis</TabsTrigger>
                    </TabsList>

                    <TabsContent value="train" className="mt-0">
                        <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
                            <PoseDetector
                                exerciseId={id || 'unknown'}
                                onRecordingComplete={handleRecordingComplete}
                            />
                        </div>
                    </TabsContent>

                    <TabsContent value="analyze" className="mt-0">
                        <AnalysisView recordedData={recordedData} />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
};

export default ExerciseDetail;
