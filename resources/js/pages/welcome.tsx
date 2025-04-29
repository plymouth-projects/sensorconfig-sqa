import { AppHeader } from '@/components/app-header';
import { type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckIcon, Wind } from "lucide-react";

export default function Welcome() {
    const { auth } = usePage<SharedData>().props;

    return (
        <>
            <Head title="Sensor Management System">
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600" rel="stylesheet" />
            </Head>
            <div className="flex min-h-screen flex-col items-center bg-[#FDFDFC] p-6 text-[#1b1b18] lg:justify-center lg:p-8 dark:bg-[#0a0a0a]">
                <header className="mb-6 w-full max-w-[335px] text-sm not-has-[nav]:hidden lg:max-w-4xl">
                    <nav className="flex items-center justify-end gap-4">
                        <Link
                            href={route('air-quality')}
                            className="inline-block rounded-sm border border-transparent px-5 py-1.5 text-sm leading-normal text-blue-600 hover:border-[#19140035] dark:text-blue-400 dark:hover:border-[#3E3E3A] mr-auto"
                        >
                            <span className="flex items-center gap-1.5">
                                <Wind className="h-4 w-4" />
                                Air Quality Dashboard
                            </span>
                        </Link>
                        
                        {auth.user && (auth.user.role === 'admin' || auth.user.role === 'super_admin') ? (
                            <Link
                                href={auth.user.role === 'admin' ? route('admin.dashboard') : route('superadmin.dashboard')}
                                className="inline-block rounded-sm border border-[#19140035] px-5 py-1.5 text-sm leading-normal text-[#1b1b18] hover:border-[#1915014a] dark:border-[#3E3E3A] dark:text-[#EDEDEC] dark:hover:border-[#62605b]"
                            >
                                Dashboard
                            </Link>
                        ) : (
                            <>
                                <Link
                                    href={route('login')}
                                    className="inline-block rounded-sm border border-transparent px-5 py-1.5 text-sm leading-normal text-[#1b1b18] hover:border-[#19140035] dark:text-[#EDEDEC] dark:hover:border-[#3E3E3A]"
                                >
                                    Log in
                                </Link>
                                <Link
                                    href={route('register')}
                                    className="inline-block rounded-sm border border-[#19140035] px-5 py-1.5 text-sm leading-normal text-[#1b1b18] hover:border-[#1915014a] dark:border-[#3E3E3A] dark:text-[#EDEDEC] dark:hover:border-[#62605b]"
                                >
                                    Register
                                </Link>
                            </>
                        )}
                    </nav>
                </header>
                <div className="flex w-full items-center justify-center opacity-100 transition-opacity duration-750 lg:grow starting:opacity-0">
                    <main className="flex w-full max-w-[335px] flex-col lg:max-w-4xl lg:flex-row lg:gap-12">
                        <div className="flex flex-col justify-center lg:w-1/2">
                            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl mb-4 dark:text-white">
                                Sensor Management System
                            </h1>
                            <p className="text-lg text-gray-600 mb-6 dark:text-gray-300">
                                Monitor, manage, and analyze your IoT sensors from a single unified platform. Get real-time data, alerts, and insights to optimize your operations.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 mb-8">
                                <Button asChild variant="default" className="bg-blue-500 hover:text-white hover:bg-blue-700">
                                    <Link href={auth.user ? route('dashboard') : route('register')}>
                                        {auth.user ? 'Go to Dashboard' : 'Get Started'}
                                    </Link>
                                </Button>
                                <Button asChild variant="outline" className="border-gray-300 text-gray-400 hover:border-gray-400 hover:text-white">
                                    <Link href="#features">
                                        Learn More
                                    </Link>
                                </Button>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                {[
                                    "Real-time monitoring",
                                    "Alert system",
                                    "Data visualization",
                                    "Secure & reliable"
                                ].map((feature, index) => (
                                    <Badge key={index} variant="outline" className="justify-start gap-2 px-3 py-1.5">
                                        <CheckIcon className="h-4 w-4 text-green-500" />
                                        <span>{feature}</span>
                                    </Badge>
                                ))}
                            </div>
                        </div>
                        <div className="hidden lg:flex lg:w-1/2 items-center justify-center">
                            <Card className="w-full bg-gradient-to-br from-blue-100 to-indigo-200 dark:from-blue-900 dark:to-indigo-950 border-0 shadow-md">
                                <CardContent className="flex items-center justify-center p-8 h-80 relative overflow-hidden">
                                    {/* Sensor Network Animation */}
                                    <div className="relative w-full h-full">
                                        {/* Central Hub */}
                                        <div 
                                            className="absolute left-1/2 top-1/2 w-20 h-20 -ml-10 -mt-10 rounded-full bg-blue-600 dark:bg-blue-500 flex items-center justify-center z-10 animate-sensor-pulse sensor-hub-shadow"
                                        >
                                            <div className="w-12 h-12 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center">
                                                <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                                                </svg>
                                            </div>
                                        </div>

                                        {/* Rotating outer ring for visual interest */}
                                        <div 
                                            className="absolute left-1/2 top-1/2 w-56 h-56 -ml-28 -mt-28 rounded-full border border-dashed border-blue-300 dark:border-blue-800"
                                            style={{
                                                animation: "spin 20s linear infinite"
                                            }}
                                        ></div>

                                        {/* Sensor Nodes */}
                                        {[0, 1, 2, 3, 4].map((i) => {
                                            const angle = (i * 72) * Math.PI / 180;
                                            const radius = 100;
                                            const x = radius * Math.cos(angle);
                                            const y = radius * Math.sin(angle);
                                            
                                            return (
                                                <div key={i}>
                                                    {/* Connection Line */}
                                                    <div 
                                                        className="absolute left-1/2 top-1/2 h-0.5 bg-blue-400 dark:bg-blue-500 origin-left z-0"
                                                        style={{
                                                            width: `${radius}px`,
                                                            transform: `rotate(${angle}rad)`,
                                                        }}
                                                    >
                                                        {/* Data Pulse */}
                                                        <div 
                                                            className="absolute h-2 w-2 bg-white rounded-full animate-sensor-data-pulse"
                                                            style={{
                                                                animationDelay: `${i * 0.4}s`
                                                            }}
                                                        />
                                                    </div>
                                                    
                                                    {/* Sensor Node */}
                                                    <div 
                                                        className="absolute w-10 h-10 rounded-full bg-green-500 dark:bg-green-600 flex items-center justify-center z-10 animate-sensor-node-pulse sensor-node-shadow"
                                                        style={{
                                                            left: `calc(50% + ${x}px - 20px)`,
                                                            top: `calc(50% + ${y}px - 20px)`,
                                                            animationDelay: `${i * 0.3}s`
                                                        }}
                                                    >
                                                        <div className="w-6 h-6 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center">
                                                            <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01" />
                                                            </svg>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        
                                        {/* Add floating data points */}
                                        {[...Array(8)].map((_, i) => {
                                            const size = 3 + Math.random() * 4;
                                            const delay = Math.random() * 5;
                                            const duration = 10 + Math.random() * 20;
                                            const startX = -100 + Math.random() * 200;
                                            const startY = -100 + Math.random() * 200;
                                            
                                            return (
                                                <div 
                                                    key={`float-${i}`}
                                                    className="absolute rounded-full bg-blue-400 dark:bg-blue-600 opacity-70"
                                                    style={{
                                                        width: `${size}px`,
                                                        height: `${size}px`,
                                                        left: `calc(50% + ${startX}px)`,
                                                        top: `calc(50% + ${startY}px)`,
                                                        animation: `float ${duration}s ease-in-out ${delay}s infinite alternate`
                                                    }}
                                                ></div>
                                            );
                                        })}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </main>
                </div>
                <div className="hidden h-14.5 lg:block"></div>
            </div>
        </>
    );
}
