import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dumbbell, Flame, Bell, Settings, User, LogOut } from 'lucide-react';
import { ModeToggle } from "@/components/mode-toggle";

const Layout: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-background">
            <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
                <div className="max-w-[1600px] mx-auto flex h-16 items-center justify-between px-8">
                    <div className="cursor-pointer flex items-center gap-2" onClick={() => navigate('/')}>
                        <Dumbbell className="w-6 h-6 text-primary" />
                        <span className="text-xl font-bold tracking-tight">SpottAIr</span>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2 text-muted-foreground px-3 py-1 rounded-full text-sm font-medium border border-border/50">
                            <Flame className="w-4 h-4" />
                            <span>12 Day Streak</span>
                        </div>

                        <div className="flex items-center gap-2">
                            <ModeToggle />

                            <Button variant="ghost" size="icon" className="relative h-9 w-9">
                                <Bell className="w-5 h-5" />
                                <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                            </Button>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Avatar className="h-9 w-9 cursor-pointer hover:ring-2 ring-primary transition-all">
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
                    </div>
                </div>
            </header>

            <main className="max-w-[1600px] mx-auto p-8 pt-12">
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;
