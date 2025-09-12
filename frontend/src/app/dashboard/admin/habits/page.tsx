"use client";

import React, { useState, useEffect } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { UserRole } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Check, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Search, ArrowUp, ArrowDown } from "lucide-react";


interface Habit {
    id: string;
    title: string;
    notes: string | null;
    monFrequency: number;
    tueFrequency: number;
    wedFrequency: number;
    thuFrequency: number;
    friFrequency: number;
    satFrequency: number;
    sunFrequency: number;
    current: boolean;
    createdAt: string;
    updatedAt: string;
}

const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const frequencyOptions = Array.from({ length: 10 }, (_, i) => ({
    value: i.toString(),
    label: i.toString(),
}));

interface FrequencyComboboxProps {
    value: number;
    onChange: (newValue: number) => void;
    options: { value: string; label: string }[];
}

function FrequencyCombobox({ value, onChange, options }: FrequencyComboboxProps) {
    const [open, setOpen] = useState(false);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between"
                >
                    {value !== null ? value : "Select..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                <Command>
                    <CommandInput placeholder="Search frequency..." />
                    <CommandEmpty>No number found.</CommandEmpty>
                    <CommandGroup>
                        {options.map((option) => (
                            <CommandItem
                                key={option.value}
                                value={option.value}
                                onSelect={(currentValue) => {
                                    onChange(parseInt(currentValue));
                                    setOpen(false);
                                }}
                            >
                                {option.label}
                            </CommandItem>
                        ))}
                    </CommandGroup>
                </Command>
            </PopoverContent>
        </Popover>
    );
}

interface HabitFormData {
    title: string;
    notes: string;
    monFrequency: number;
    tueFrequency: number;
    wedFrequency: number;
    thuFrequency: number;
    friFrequency: number;
    satFrequency: number;
    sunFrequency: number;
    current: boolean;
}

export default function HabitsManagementPage() {
    const [habits, setHabits] = useState<Habit[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingHabit, setEditingHabit] = useState<string | null>(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [formData, setFormData] = useState<HabitFormData>({
        title: "",
        notes: "",
        monFrequency: 0,
        tueFrequency: 0,
        wedFrequency: 0,
        thuFrequency: 0,
        friFrequency: 0,
        satFrequency: 0,
        sunFrequency: 0,
        current: true,
    });

    type FrequencyKey = 'monFrequency' | 'tueFrequency' | 'wedFrequency' | 'thuFrequency' | 'friFrequency' | 'satFrequency' | 'sunFrequency';
    const frequencyKeys: FrequencyKey[] = [
        'monFrequency', 'tueFrequency', 'wedFrequency', 'thuFrequency', 'friFrequency', 'satFrequency', 'sunFrequency'
    ];

    useEffect(() => {
        fetchHabits();
    }, []);

    const fetchHabits = async () => {
        try {
            const response = await fetch("/api/admin/habits");
            if (response.ok) {
                const data = await response.json();
                setHabits(data);
            }
        } catch (error) {
            console.error("Error fetching habits:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const url = editingHabit
                ? `/api/admin/habits/${editingHabit}`
                : "/api/admin/habits";

            const method = editingHabit ? "PUT" : "POST";

            const response = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    title: formData.title,
                    notes: formData.notes,
                    monFrequency: formData.monFrequency,
                    tueFrequency: formData.tueFrequency,
                    wedFrequency: formData.wedFrequency,
                    thuFrequency: formData.thuFrequency,
                    friFrequency: formData.friFrequency,
                    satFrequency: formData.satFrequency,
                    sunFrequency: formData.sunFrequency,
                    current: formData.current,
                }),
            });

            if (response.ok) {
                await fetchHabits();
                resetForm();
                setEditingHabit(null);
                setShowAddForm(false);
            }
        } catch (error) {
            console.error("Error saving habit:", error);
        }
    };

    const handleEdit = (habit: Habit) => {
        setEditingHabit(habit.id);
        setFormData({
            title: habit.title,
            notes: habit.notes || "",
            monFrequency: habit.monFrequency || 0,
            tueFrequency: habit.tueFrequency || 0,
            wedFrequency: habit.wedFrequency || 0,
            thuFrequency: habit.thuFrequency || 0,
            friFrequency: habit.friFrequency || 0,
            satFrequency: habit.satFrequency || 0,
            sunFrequency: habit.sunFrequency || 0,
            current: habit.current,
        });
        setShowAddForm(true);
    };

    const handleDelete = async (habitId: string) => {
        if (confirm("Are you sure you want to delete this habit?")) {
            try {
                const response = await fetch(`/api/admin/habits/${habitId}`, {
                    method: "DELETE",
                });

                if (response.ok) {
                    await fetchHabits();
                }
            } catch (error) {
                console.error("Error deleting habit:", error);
            }
        }
    };

    const handleIncrementAll = () => {
        setFormData(prevFormData => {
            const newFormData: HabitFormData = { ...prevFormData };
            frequencyKeys.forEach(key => {
                newFormData[key] = Math.min(newFormData[key] + 1, 9);
            });
            return newFormData;
        });
    };

    const handleDecrementAll = () => {
        setFormData(prevFormData => {
            const newFormData: HabitFormData = { ...prevFormData };
            frequencyKeys.forEach(key => {
                newFormData[key] = Math.max(newFormData[key] - 1, 0);
            });
            return newFormData;
        });
    };

    const resetForm = () => {
        setFormData({
            title: "",
            notes: "",
            monFrequency: 0,
            tueFrequency: 0,
            wedFrequency: 0,
            thuFrequency: 0,
            friFrequency: 0,
            satFrequency: 0,
            sunFrequency: 0,
            current: true,
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                    <p className="mt-2">Loading habits...</p>
                </div>
            </div>
        );
    }

    return (
        <ProtectedRoute requiredRoles={[UserRole.Admin, UserRole.SystemAdmin]}>
            <div className="container mx-auto p-6">

                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-3xl font-bold">Habits Management</h1>
                        <p className="text-gray-600">Manage wellness habits and their frequency settings</p>
                    </div>
                    <Button
                        onClick={() => {
                            setShowAddForm(true);
                            setEditingHabit(null);
                            resetForm();
                        }}
                        className="flex items-center gap-2"
                    >
                        <Plus className="h-4 w-4" />
                        Add New Habit
                    </Button>
                </div>

                {/* Add/Edit Form */}
                {showAddForm && (
                    <Card className="mb-6">
                        <CardHeader>
                            <CardTitle>
                                {editingHabit ? "Edit Habit" : "Add New Habit"}
                            </CardTitle>
                            <CardDescription>
                                {editingHabit
                                    ? "Update the habit details below"
                                    : "Create a new wellness habit"
                                }
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <Label htmlFor="title">Title</Label>
                                    <Input
                                        id="title"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        placeholder="e.g., Physical Activity"
                                        required
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="notes">Description</Label>
                                    <Textarea
                                        id="notes"
                                        value={formData.notes}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                        placeholder="Describe the habit and its benefits..."
                                        rows={3}
                                    />
                                </div>

                                <div className="grid grid-cols-7 gap-2 mb-4 text-center font-medium">
                                    {daysOfWeek.map((day) => (
                                        <div key={day}>{day}</div>
                                    ))}
                                </div>
                                <div className="grid grid-cols-[auto_repeat(7,minmax(0,1fr))_auto] gap-2 items-center">
                                    <Button
                                            type="button"
                                            variant="secondary"
                                            size="sm"
                                            onClick={handleDecrementAll}
                                            className="h-auto px-2 py-1"
                                        >
                                            <ArrowDown className="h-4 w-4" />
                                        </Button>
                                    {daysOfWeek.map((day, index) => {
                                        const frequencyKey = `${day.toLowerCase()}Frequency` as keyof HabitFormData;
                                        return (
                                            <FrequencyCombobox
                                                key={day}
                                                value={formData[frequencyKey] as number}
                                                onChange={(newValue) => setFormData(prev => ({
                                                    ...prev,
                                                    [frequencyKey]: newValue
                                                }))}
                                                options={frequencyOptions}
                                            />
                                        )
                                    })}
                                    <Button
                                            type="button"
                                            variant="secondary"
                                            size="sm"
                                            onClick={handleIncrementAll}
                                            className="h-auto px-2 py-1"
                                        >
                                            <ArrowUp className="h-4 w-4" />
                                        </Button>
                                </div>

                                <div className="flex items-center space-x-2 mt-4">
                                    <input
                                        type="checkbox"
                                        id="current"
                                        checked={formData.current}
                                        onChange={(e) => setFormData({ ...formData, current: e.target.checked })}
                                        className="rounded"
                                    />
                                    <Label htmlFor="current">Currently Active</Label>
                                </div>

                                <div className="flex gap-2 mt-4">
                                    <Button type="submit">
                                        {editingHabit ? "Update Habit" : "Create Habit"}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => {
                                            setShowAddForm(false);
                                            setEditingHabit(null);
                                            resetForm();
                                        }}
                                    >
                                        Cancel
                                    </Button>
                                </div>

                            </form>
                        </CardContent>
                    </Card>
                )}

                {/* Habits List */}
                <div className="grid gap-4">
                    {habits.map((habit) => (
                        <Card key={habit.id}>
                            <CardContent className="p-6">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-xl font-semibold">{habit.title}</h3>
                                            <Badge variant={habit.current ? "default" : "secondary"}>
                                                {habit.current ? "Active" : "Inactive"}
                                            </Badge>
                                        </div>

                                        {habit.notes && (
                                            <p className="text-gray-600 mb-3">{habit.notes}</p>
                                        )}

                                        <div className="flex flex-wrap gap-2 text-sm text-gray-500">
                                            {daysOfWeek.map((day, index) => {
                                                const frequencyKey = `${day.toLowerCase()}Frequency` as keyof Habit;
                                                return (
                                                    <span key={day}>
                                                        {day}: {habit[frequencyKey] || 0}
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleEdit(habit)}
                                        >
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleDelete(habit.id)}
                                            className="text-red-600 hover:text-red-700"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {habits.length === 0 && (
                    <Card>
                        <CardContent className="p-12 text-center">
                            <p className="text-gray-500">No habits found. Create your first habit to get started.</p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </ProtectedRoute>
    );
} 