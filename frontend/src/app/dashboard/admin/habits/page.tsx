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


interface Habit {
    id: string;
    title: string;
    notes: string | null;
    frequencyPerWeek: any;
    frequencyPerDay: number | null;
    current: boolean;
    createdAt: string;
    updatedAt: string;
}

interface HabitFormData {
    title: string;
    notes: string;
    frequencyPerWeek: {
        per_week: string | number;
        per_day: number | null;
    };
    frequencyPerDay: number | null;
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
        frequencyPerWeek: { per_week: "", per_day: null },
        frequencyPerDay: null,
        current: true,
    });

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
                body: JSON.stringify(formData),
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
            frequencyPerWeek: habit.frequencyPerWeek,
            frequencyPerDay: habit.frequencyPerDay,
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

    const resetForm = () => {
        setFormData({
            title: "",
            notes: "",
            frequencyPerWeek: { per_week: "", per_day: null },
            frequencyPerDay: null,
            current: true,
        });
    };

    const formatFrequency = (frequency: any) => {
        if (typeof frequency.per_week === "number") {
            return `${frequency.per_week} times per week`;
        }
        return frequency.per_week;
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

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="frequencyPerWeek">Frequency Per Week</Label>
                                        <Input
                                            id="frequencyPerWeek"
                                            value={formData.frequencyPerWeek.per_week}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                frequencyPerWeek: {
                                                    ...formData.frequencyPerWeek,
                                                    per_week: e.target.value
                                                }
                                            })}
                                            placeholder="e.g., 5 or 'Every day'"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="frequencyPerDay">Frequency Per Day (Optional)</Label>
                                        <Input
                                            id="frequencyPerDay"
                                            type="number"
                                            value={formData.frequencyPerDay || ""}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                frequencyPerDay: e.target.value ? parseInt(e.target.value) : null
                                            })}
                                            placeholder="e.g., 3"
                                            min="1"
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        id="current"
                                        checked={formData.current}
                                        onChange={(e) => setFormData({ ...formData, current: e.target.checked })}
                                        className="rounded"
                                    />
                                    <Label htmlFor="current">Currently Active</Label>
                                </div>

                                <div className="flex gap-2">
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
                                            <span>Frequency: {formatFrequency(habit.frequencyPerWeek)}</span>
                                            {habit.frequencyPerDay && (
                                                <span>• {habit.frequencyPerDay} times per day</span>
                                            )}
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