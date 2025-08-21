"use client";

import { useState, useEffect, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Lock } from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { UserRole } from '@prisma/client';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loading } from '@/components/ui/loading';
import { WeekView } from '@/components/habits/week-view';
import { toast } from 'sonner';

interface ClientHabits {
    id: string;
    completionDate: string;
    completed: boolean;
    timesDone?: number;
    programmeHabitId: string;
    programmeHabit: {
        id: string;
        programme: {
            id: string;
            name: string;
        };
        habit: {
            id: string;
            title: string;
        };
    };
    notes?: string;
}

interface ProgrammeHabit {
    id: string;
    programme: {
        id: string;
        name: string;
        humanReadableId: string;
        startDate?: string | null;
        endDate?: string | null;
    };
    habit: {
        id: string;
        title: string;
    };
    frequencyPerDay?: number | null;
}

interface DayData {
    date: Date;
    dayNumber: number;
    isCurrentMonth: boolean;
    completionRate: number; // 0-1
}

interface WeekData {
    days: DayData[];
}

const ClientHabitsPage = () => {
    const { data: session } = useSession();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [weeks, setWeeks] = useState<WeekData[]>([]);
    const [loading, setLoading] = useState(true);
    const [programmeHabits, setProgrammeHabits] = useState<ProgrammeHabit[]>([]);
    const [habitCompletions, setHabitCompletions] = useState<ClientHabits[]>([]);
    const [selectedWeek, setSelectedWeek] = useState<WeekData | null>(null);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);

    // Get client ID from search params or fall back to current user
    const clientId = searchParams.get('clientId') || session?.user?.id;

    // If a date query param is present, anchor the calendar to that date
    const anchorDateParam = searchParams.get('date');
    useEffect(() => {
        if (anchorDateParam) {
            const d = new Date(anchorDateParam);
            if (!isNaN(d.getTime())) {
                setCurrentDate(d);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [anchorDateParam]);

    // Helper: check if a date is within any programme window
    const isWithinProgramme = (date: Date): boolean => {
        const dateOnly = new Date(date.toISOString().split('T')[0]);
        return programmeHabits.some((ph) => {
            const start = ph.programme?.startDate ? new Date(ph.programme.startDate) : null;
            const end = ph.programme?.endDate ? new Date(ph.programme.endDate) : null;
            if (!start || !end) return true; // If bounds unknown, do not block
            const d = dateOnly.getTime();
            const s = new Date(start.toISOString().split('T')[0]).getTime();
            const e = new Date(end.toISOString().split('T')[0]).getTime();
            return d >= s && d <= e;
        });
    };

    // Get the start of the week (Monday) for a given date
    const getStartOfWeek = (date: Date): Date => {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
        return new Date(d.setDate(diff));
    };

    // Generate 4 weeks of data starting from the given date
    const generateWeeks = (startDate: Date): WeekData[] => {
        const weeks: WeekData[] = [];
        const startOfWeek = getStartOfWeek(startDate);

        for (let week = 0; week < 4; week++) {
            const weekStart = new Date(startOfWeek);
            weekStart.setDate(weekStart.getDate() + (week * 7));

            const days: DayData[] = [];
            for (let day = 0; day < 7; day++) {
                const currentDate = new Date(weekStart);
                currentDate.setDate(currentDate.getDate() + day);

                // Get habit completions for this specific date
                const dateString = currentDate.toISOString().split('T')[0];
                const dayCompletions = habitCompletions.filter(c => c.completionDate.split('T')[0] === dateString);

                const completedCount = dayCompletions.filter(c => c.completed).length;
                const completionRate = programmeHabits.length > 0 ? completedCount / programmeHabits.length : 0;

                days.push({
                    date: currentDate,
                    dayNumber: currentDate.getDate(),
                    isCurrentMonth: currentDate.getMonth() === startDate.getMonth(),
                    completionRate
                });
            }

            weeks.push({ days });
        }

        return weeks;
    };

    // Get color based on completion rate
    const getDayColor = (completionRate: number): string => {
        if (completionRate === 1) return 'bg-green-500'; // All habits completed
        if (completionRate === 0) return 'bg-red-500'; // No habits completed

        // Orange gradient based on completion rate
        if (completionRate >= 0.8) return 'bg-orange-400';
        if (completionRate >= 0.6) return 'bg-orange-500';
        if (completionRate >= 0.4) return 'bg-orange-600';
        return 'bg-orange-700';
    };

    // Navigate to previous 4 weeks
    const goToPreviousWeeks = () => {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() - 28); // Go back 4 weeks
        setCurrentDate(newDate);
    };

    // Navigate to previous week
    const goToPreviousWeek = () => {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() - 7); // Go back 1 week
        setCurrentDate(newDate);
    };

    // Navigate to next week
    const goToNextWeek = () => {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() + 7); // Go forward 1 week
        setCurrentDate(newDate);
    };

    // Navigate to next 4 weeks
    const goToNextWeeks = () => {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() + 28); // Go forward 4 weeks
        setCurrentDate(newDate);
    };

    // Go to current week
    const goToCurrentWeek = () => {
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        // Determine the 4-week window currently shown
        const topWeekStart = getStartOfWeek(currentDate);
        const windowStart = new Date(topWeekStart);
        const windowEnd = new Date(topWeekStart);
        windowEnd.setDate(windowEnd.getDate() + 27);
        const inWindow = today >= windowStart && today <= windowEnd;
        if (inWindow) return; // Already visible; no change
        setCurrentDate(new Date());
    };

    // Handle day click to redirect to weekly view
    const handleDayClick = (day: DayData) => {
        // Allow clicking days across month boundaries

        // Redirect to weekly page with the selected date and clientId
        const dateString = day.date.toISOString().split('T')[0];
        // Disallow selecting dates more than 7 days ahead from today
        const clickedDateOnly = new Date(dateString);
        const todayOnly = new Date(new Date().toISOString().split('T')[0]);
        const diffDays = Math.floor((clickedDateOnly.getTime() - todayOnly.getTime()) / 86400000);
        if (diffDays > 7) {
            toast.info('That date is too far in the future. You can only view up to 7 days ahead.');
            return;
        }
        const queryParams = new URLSearchParams();
        queryParams.set('date', dateString);
        if (clientId && clientId !== session?.user?.id) {
            queryParams.set('clientId', clientId);
        }

        router.push(`/dashboard/client/habits/weekly?${queryParams.toString()}`);
    };

    // Handle habit completion toggle
    const handleHabitToggle = async (programmeHabitId: string, date: Date, completed: boolean) => {
        const dateString = date.toISOString().split('T')[0];

        try {
            const response = await fetch('/api/client/habits/completions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    programmeHabitId,
                    completionDate: dateString,
                    completed: !completed,
                    clientId
                })
            });

            if (response.ok) {
                // Refresh the data for the current week only
                const weekStart = getStartOfWeek(selectedDate || currentDate);
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekEnd.getDate() + 6); // 7 days (current week)

                const completionsResponse = await fetch(
                    `/api/client/habits/completions?startDate=${weekStart.toISOString().split('T')[0]}&endDate=${weekEnd.toISOString().split('T')[0]}&clientId=${clientId}`
                );
                if (completionsResponse.ok) {
                    const completionsData = await completionsResponse.json();
                    setHabitCompletions(completionsData);
                }
            } else {
                const errorData = await response.json();
                console.error('Habit toggle failed:', response.status, errorData);
                toast.error(`Failed to update habit: ${errorData.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error updating habit completion:', error);
            toast.error('Error updating habit completion');
        }
    };

    // Go back to 4-week view
    const goBackToOverview = () => {
        setSelectedWeek(null);
        setSelectedDate(null);
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                // Wait for clientId to be available
                if (!clientId) {
                    return;
                }

                // Fetch programme habits
                const habitsResponse = await fetch(`/api/client/habits?clientId=${clientId}`);
                if (habitsResponse.ok) {
                    const habitsData = await habitsResponse.json();
                    setProgrammeHabits(habitsData);
                }

                // Fetch habit completions for the current 4-week period
                const startDate = getStartOfWeek(currentDate);
                const endDate = new Date(startDate);
                endDate.setDate(endDate.getDate() + 27); // 4 weeks

                const completionsResponse = await fetch(
                    `/api/client/habits/completions?startDate=${startDate.toISOString().split('T')[0]}&endDate=${endDate.toISOString().split('T')[0]}&clientId=${clientId}`
                );
                if (completionsResponse.ok) {
                    const completionsData = await completionsResponse.json();
                    setHabitCompletions(completionsData);
                }
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [currentDate, clientId]);

    useEffect(() => {
        if (programmeHabits.length > 0) {
            setWeeks(generateWeeks(currentDate));
        }
    }, [currentDate, programmeHabits]);

    if (loading) {
        return (
            <Loading
                title="Loading Habits"
                description="Setting up your habit tracker..."
                steps={[]}
                size="lg"
            />
        );
    }

    const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    // Week view component
    if (selectedWeek && selectedDate) {
        return (
            <ProtectedRoute requiredRoles={[UserRole.Client, UserRole.Admin, UserRole.SystemAdmin]}>
                <WeekView
                    selectedWeek={selectedWeek}
                    selectedDate={selectedDate}
                    programmeHabits={programmeHabits}
                    habitCompletions={habitCompletions}
                    onBack={goBackToOverview}
                    onHabitToggle={handleHabitToggle}
                />
            </ProtectedRoute>
        );
    }

    return (
        <ProtectedRoute requiredRoles={[UserRole.Client, UserRole.Admin, UserRole.SystemAdmin]}>
            <div className="container mx-auto p-4">
                <div className="mb-4">
                    <h1 className="text-2xl font-bold text-center mb-2">Habits Overview</h1>

                    {/* Month label centered above controls */}
                    <div className="text-center mb-2">
                        <div className="text-sm font-medium">
                            {currentDate.toLocaleDateString('en-US', {
                                month: 'short',
                                year: 'numeric'
                            })}
                        </div>
                    </div>

                    {/* Navigation Controls */}
                    <div className="mb-4 flex justify-center">
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={goToPreviousWeeks}
                                className="flex items-center justify-center w-10 h-10 p-0"
                                title="Previous 4 weeks"
                            >
                                <ChevronsLeft className="h-4 w-4" />
                            </Button>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={goToPreviousWeek}
                                className="flex items-center justify-center w-10 h-10 p-0"
                                title="Previous week"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>

                            <Button
                                variant="default"
                                size="sm"
                                onClick={goToCurrentWeek}
                                className="h-10 inline-flex items-center justify-center rounded-full px-4 text-xs font-semibold"
                            >
                                Today
                            </Button>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={goToNextWeek}
                                className="flex items-center justify-center w-10 h-10 p-0"
                                title="Next week"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={goToNextWeeks}
                                className="flex items-center justify-center w-10 h-10 p-0"
                                title="Next 4 weeks"
                            >
                                <ChevronsRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Calendar Grid */}
                <div className="space-y-3">
                    {/* Calendar Grid - Centered with 10px gaps and aligned headers */}
                    <div className="flex justify-center">
                        <div>
                            {/* Week day headers as transparent circles */}
                            <div className="grid grid-cols-7 gap-2.5 justify-items-center">
                                {weekDays.map((day) => (
                                    <div
                                        key={day}
                                        className="w-14 h-14 rounded-full flex items-center justify-center font-bold text-xs text-muted-foreground"
                                        style={{ backgroundColor: 'transparent' }}
                                    >
                                        {day}
                                    </div>
                                ))}
                            </div>

                            {/* Calendar weeks */}
                            <div className="mt-2.5 space-y-2.5">
                                {weeks.map((week, weekIndex) => (
                                    <div key={weekIndex} className="grid grid-cols-7 gap-2.5 justify-items-center">
                                        {week.days.map((day, dayIndex) => {
                                            // Calculate completion rate on the fly like the weekly view
                                            const dateString = day.date.toISOString().split('T')[0];
                                            const dayCompletions = habitCompletions.filter(c => c.completionDate.split('T')[0] === dateString);
                                            // Only consider habits whose programme is active on this specific date
                                            const isHabitActiveOnDate = (ph: ProgrammeHabit): boolean => {
                                                const s = ph.programme?.startDate ? new Date(new Date(ph.programme.startDate).toISOString().split('T')[0]) : null;
                                                const e = ph.programme?.endDate ? new Date(new Date(ph.programme.endDate).toISOString().split('T')[0]) : null;
                                                if (!s || !e) return true;
                                                const d = new Date(dateString);
                                                return d >= s && d <= e;
                                            };
                                            const activeHabits = programmeHabits.filter(isHabitActiveOnDate);
                                            const completedCount = activeHabits.filter(ph => {
                                                const requiredPerDay = Math.max(1, ph.frequencyPerDay ?? 1);
                                                const rec = dayCompletions.find(c => c.programmeHabitId === ph.id);
                                                const times = rec?.timesDone ?? (rec?.completed ? requiredPerDay : 0);
                                                return times >= requiredPerDay;
                                            }).length;
                                            const completionRate = activeHabits.length > 0 ? completedCount / activeHabits.length : 0;

                                            const withinProgramme = isWithinProgramme(day.date);
                                            const isToday = day.date.toISOString().split('T')[0] === new Date().toISOString().split('T')[0];
                                            const circleBase = 'w-9 h-9 sm:w-14 sm:h-14 rounded-full flex items-center justify-center text-xs font-medium transition-all duration-200';
                                            const circleEnabled = `${getDayColor(completionRate)} text-white hover:scale-110 cursor-pointer`;
                                            const circleDisabled = 'bg-gray-200 text-gray-400 dark:bg-gray-800 dark:text-gray-400 cursor-not-allowed';
                                            const todayRing = withinProgramme && isToday ? ' ring-2 ring-blue-500 ring-offset-2' : '';
                                            return (
                                                <div
                                                    key={dayIndex}
                                                    className={`${circleBase} ${withinProgramme ? circleEnabled : circleDisabled}${todayRing}`}
                                                    {...(withinProgramme ? { title: `${Math.round(completionRate * 100)}% habits completed` } : {})}
                                                    onClick={() => {
                                                        if (!withinProgramme) return;
                                                        handleDayClick(day);
                                                    }}
                                                >
                                                    {withinProgramme ? (
                                                        <>{day.dayNumber}</>
                                                    ) : (
                                                        <Lock className="w-4 h-4 opacity-80" />
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Empty state */}
                {programmeHabits.length === 0 && (
                    <div className="mt-8 text-center">
                        <p className="text-muted-foreground">
                            No habits assigned yet. Contact your programme administrator.
                        </p>
                    </div>
                )}
            </div>
        </ProtectedRoute>
    );
};

export default function ClientHabitsPageWrapper() {
    return (
        <Suspense fallback={<Loading title="Loading Habits" description="Preparing calendar..." />}>
            <ClientHabitsPage />
        </Suspense>
    );
} 