import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';

interface WelcomeScreenProps {
    onComplete: () => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onComplete }) => {
    const [isExiting, setIsExiting] = useState(false);

    const handleStart = () => {
        setIsExiting(true);
        setTimeout(() => {
            onComplete();
        }, 700); // Wait for exit animation
    };

    return (
        <div
            className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background transition-opacity duration-700 ease-in-out ${isExiting ? 'opacity-0 pointer-events-none' : 'opacity-100'
                }`}
        >
            {/* Define gradient for the icon */}
            <svg width="0" height="0" className="absolute">
                <linearGradient id="logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#a855f7" /> {/* purple-500 */}
                    <stop offset="50%" stopColor="#ec4899" /> {/* pink-500 */}
                    <stop offset="100%" stopColor="#f97316" /> {/* orange-500 */}
                </linearGradient>
            </svg>

            <div className="flex flex-col items-center gap-8 animate-in fade-in zoom-in duration-1000 slide-in-from-bottom-8 mb-32">
                <div className="relative">
                    <div className="absolute inset-0 bg-purple-500/20 blur-3xl rounded-full animate-pulse" />
                    {/* Spin once slowly (2s) then stop */}
                    <Sparkles
                        className="w-24 h-24 relative z-10 animate-[spin_2s_ease-out_1]"
                        style={{ stroke: "url(#logo-gradient)" }}
                    />
                </div>

                <div className="text-center space-y-4">
                    <h1 className="text-5xl md:text-6xl font-bold tracking-tight animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-500 fill-mode-backwards pb-2">
                        <span className="text-foreground">Hello </span>
                        <span className="bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 bg-clip-text text-transparent">
                            Jonas
                        </span>
                    </h1>
                    <p className="text-2xl text-muted-foreground font-medium animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-1500 fill-mode-backwards">
                        I am SpottAIr, your personal training assistant.
                    </p>
                </div>

                <button
                    onClick={handleStart}
                    className="mt-8 px-8 py-3 rounded-full bg-foreground text-background font-semibold text-lg hover:opacity-90 transition-all transform hover:scale-105 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-[2000ms] fill-mode-backwards"
                >
                    Get Started
                </button>
            </div>

            <div className="absolute bottom-12 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-700 fill-mode-backwards opacity-50">
                <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5" style={{ stroke: "url(#logo-gradient)" }} />
                    <span className="text-lg font-bold tracking-tight">SpottAIr</span>
                </div>
            </div>
        </div>
    );
};

export default WelcomeScreen;
