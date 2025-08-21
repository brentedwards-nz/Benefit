'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { ArrowLeft, Plus, Edit, Trash2, Save, X } from 'lucide-react'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { UserRole } from '@prisma/client'
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { ArrowUp, ArrowDown } from "lucide-react";

interface ProgrammeHabit {
    id: string
    programmeId: string
    habitId: string
    notes: string | null
    monFrequency: number
    tueFrequency: number
    wedFrequency: number
    thuFrequency: number
    friFrequency: number
    satFrequency: number
    sunFrequency: number
    current: boolean
    createdAt: string
    updatedAt: string
    programme: {
        id: string
        name: string
        humanReadableId: string
    }
    habit: {
        id: string
        title: string
        notes: string | null
    }
}

interface Habit {
    id: string
    title: string
    notes: string | null
    monFrequency: number
    tueFrequency: number
    wedFrequency: number
    thuFrequency: number
    friFrequency: number
    satFrequency: number
    sunFrequency: number
    current: boolean
}

interface FrequencyComboboxProps {
    value: number | null;
    onChange: (value: number) => void;
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

interface ProgrammeHabitFormData {
    programmeId: string;
    habitId: string;
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

function ProgrammeHabitManagementContent() {
    const { data: session } = useSession()
    const router = useRouter()
    const searchParams = useSearchParams()
    const programmeId = searchParams.get('programmeId')
    const programmeName = searchParams.get('programmeName')

    const [programmeHabits, setProgrammeHabits] = useState<ProgrammeHabit[]>([])
    const [availableHabits, setAvailableHabits] = useState<Habit[]>([])
    const [programmes, setProgrammes] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [formData, setFormData] = useState<ProgrammeHabitFormData>({
        programmeId: programmeId || '',
        habitId: '',
        notes: '',
        monFrequency: 0,
        tueFrequency: 0,
        wedFrequency: 0,
        thuFrequency: 0,
        friFrequency: 0,
        satFrequency: 0,
        sunFrequency: 0,
        current: true
    })
    const [isAdding, setIsAdding] = useState(false)

    type FrequencyKey = 'monFrequency' | 'tueFrequency' | 'wedFrequency' | 'thuFrequency' | 'friFrequency' | 'satFrequency' | 'sunFrequency';
    const frequencyKeys: FrequencyKey[] = [
        'monFrequency', 'tueFrequency', 'wedFrequency', 'thuFrequency', 'friFrequency', 'satFrequency', 'sunFrequency'
    ];

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            setLoading(true)

            // Fetch programme habits
            const phUrl = programmeId
                ? `/api/admin/programme-habits?programmeId=${programmeId}`
                : '/api/admin/programme-habits'
            const phResponse = await fetch(phUrl)
            if (phResponse.ok) {
                const phData = await phResponse.json()
                setProgrammeHabits(phData)
            }

            // Fetch available habits
            const habitsResponse = await fetch('/api/admin/habits')
            if (habitsResponse.ok) {
                const habitsData = await habitsResponse.json()
                setAvailableHabits(habitsData)
            }


            // Fetch programmes
            const programmesResponse = await fetch('/api/admin/programmes')
            if (programmesResponse.ok) {
                const programmesData = await programmesResponse.json()
                setProgrammes(programmesData)
            }

        } catch (error) {
            console.error('Error fetching data:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleEdit = (programmeHabit: ProgrammeHabit) => {
        setEditingId(programmeHabit.id)
        setFormData({
            programmeId: programmeHabit.programmeId,
            habitId: programmeHabit.habitId,
            notes: programmeHabit.notes || '',
            monFrequency: programmeHabit.monFrequency,
            tueFrequency: programmeHabit.tueFrequency,
            wedFrequency: programmeHabit.wedFrequency,
            thuFrequency: programmeHabit.thuFrequency,
            friFrequency: programmeHabit.friFrequency,
            satFrequency: programmeHabit.satFrequency,
            sunFrequency: programmeHabit.sunFrequency,
            current: programmeHabit.current
        })
    }

    const handleSave = async () => {
        try {
            // Validate required fields
            if (!formData.habitId) {
                alert('Please select a base habit')
                return
            }

            // Ensure programmeId is set (either from URL or form)
            const finalProgrammeId = programmeId || formData.programmeId
            if (!finalProgrammeId) {
                alert('Please select a programme')
                return
            }

            if (editingId) {
                // Update existing programme habit
                const response = await fetch(`/api/admin/programme-habits/${editingId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                })

                if (response.ok) {
                    setEditingId(null)
                    fetchData()
                }
            } else {
                // Create new programme habit
                const response = await fetch('/api/admin/programme-habits', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        ...formData,
                        programmeId: finalProgrammeId
                    })
                })

                if (response.ok) {
                    setIsAdding(false)
                    resetForm()
                    fetchData()
                }
            }
        } catch (error) {
            console.error('Error saving programme habit:', error)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this programme habit?')) return

        try {
            const response = await fetch(`/api/admin/programme-habits/${id}`, {
                method: 'DELETE'
            })

            if (response.ok) {
                fetchData()
            }
        } catch (error) {
            console.error('Error deleting programme habit:', error)
        }
    }

    const resetForm = () => {
        setFormData({
            programmeId: programmeId || '', // Preserve programmeId from URL
            habitId: '',
            notes: '',
            monFrequency: 0,
            tueFrequency: 0,
            wedFrequency: 0,
            thuFrequency: 0,
            friFrequency: 0,
            satFrequency: 0,
            sunFrequency: 0,
            current: true
        })
    }

    const handleAddNew = () => {
        setIsAdding(true)
        setEditingId(null)
        resetForm()
        // Ensure programmeId is set from URL if available
        if (programmeId) {
            setFormData(prev => ({ ...prev, programmeId }))
        }
    }

    const handleCancel = () => {
        setIsAdding(false)
        setEditingId(null)
        resetForm()
    }

    const getHabitTitle = (habitId: string) => {
        const habit = availableHabits.find(h => h.id === habitId)
        return habit ? habit.title : 'Unknown Habit'
    }

    const formatFrequency = (
        monFrequency: number,
        tueFrequency: number,
        wedFrequency: number,
        thuFrequency: number,
        friFrequency: number,
        satFrequency: number,
        sunFrequency: number
    ) => {
        const frequencies: string[] = [];
        if (monFrequency > 0) frequencies.push(`Mon: ${monFrequency}`);
        if (tueFrequency > 0) frequencies.push(`Tue: ${tueFrequency}`);
        if (wedFrequency > 0) frequencies.push(`Wed: ${wedFrequency}`);
        if (thuFrequency > 0) frequencies.push(`Thu: ${thuFrequency}`);
        if (friFrequency > 0) frequencies.push(`Fri: ${friFrequency}`);
        if (satFrequency > 0) frequencies.push(`Sat: ${satFrequency}`);
        if (sunFrequency > 0) frequencies.push(`Sun: ${sunFrequency}`);

        return frequencies.length > 0 ? frequencies.join(', ') : 'Not specified';
    }

    const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const frequencyOptions = Array.from({ length: 11 }, (_, i) => ({
        value: i.toString(),
        label: i.toString(),
    }));

    const handleIncrementAll = () => {
        setFormData(prevFormData => {
            const newFormData: ProgrammeHabitFormData = { ...prevFormData };
            frequencyKeys.forEach(key => {
                newFormData[key] = Math.min(newFormData[key] + 1, 9);
            });
            return newFormData;
        });
    };

    const handleDecrementAll = () => {
        setFormData(prevFormData => {
            const newFormData: ProgrammeHabitFormData = { ...prevFormData };
            frequencyKeys.forEach(key => {
                newFormData[key] = Math.max(newFormData[key] - 1, 0);
            });
            return newFormData;
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
                    <p className="mt-4 text-lg">Loading programme habits...</p>
                </div>
            </div>
        )
    }

    return (
        <ProtectedRoute requiredRoles={[UserRole.Admin, UserRole.SystemAdmin]}>
            <div className="container mx-auto p-6">
                <div className="flex items-center gap-4 mb-6">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.back()}
                        className="flex items-center gap-2"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold">
                            {programmeName ? `Habits for ${programmeName}` : 'Programme Habit Management'}
                        </h1>
                        <p className="text-muted-foreground">
                            {programmeName
                                ? `Manage habits assigned to ${programmeName}`
                                : 'Manage habits assigned to programmes'
                            }
                        </p>
                    </div>
                </div>

                {/* Add New Programme Habit */}
                {isAdding && (
                    <Card className="mb-6">
                        <CardHeader>
                            <CardTitle>Add New Programme Habit</CardTitle>
                            {programmeId && (
                                <CardDescription>
                                    Programme: <strong>{programmeName}</strong>
                                </CardDescription>
                            )}
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-4">
                                {!programmeId && (
                                    <div>
                                        <Label htmlFor="programmeId">Programme</Label>
                                        <select
                                            id="programmeId"
                                            value={formData.programmeId}
                                            onChange={(e) => setFormData({ ...formData, programmeId: e.target.value })}
                                            className="w-full p-2 border rounded-md"
                                        >
                                            <option value="">Select Programme</option>
                                            {programmes.map((programme) => (
                                                <option key={programme.id} value={programme.id}>
                                                    {programme.name} ({programme.humanReadableId})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                <div>
                                    <Label htmlFor="habitId">Base Habit</Label>
                                    <select
                                        id="habitId"
                                        value={formData.habitId}
                                        onChange={(e) => setFormData({ ...formData, habitId: e.target.value })}
                                        className="w-full p-2 border rounded-md"
                                    >
                                        <option value="">Select Habit</option>
                                        {availableHabits.map((habit) => (
                                            <option key={habit.id} value={habit.id}>
                                                {habit.title}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <Label htmlFor="notes">Notes</Label>
                                    <Textarea
                                        id="notes"
                                        value={formData.notes}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                        placeholder="Programme-specific notes"
                                    />
                                </div>

                                <div className="grid grid-cols-7 gap-2 mb-4 text-center font-medium">
                                    {daysOfWeek.map((day) => (
                                        <div key={day}>{day}</div>
                                    ))}
                                </div>
                                <div className="flex items-center gap-2">
                                    {isAdding && (
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            size="sm"
                                            onClick={handleDecrementAll}
                                            className="h-auto px-2 py-1"
                                        >
                                            <ArrowDown className="h-4 w-4" />
                                        </Button>
                                    )}
                                    <div className="grid grid-cols-7 gap-2 flex-1">
                                        {daysOfWeek.map((day) => {
                                            const frequencyKey = `${day.toLowerCase()}Frequency` as keyof typeof formData;
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
                                    </div>
                                    {isAdding && (
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            size="sm"
                                            onClick={handleIncrementAll}
                                            className="h-auto px-2 py-1"
                                        >
                                            <ArrowUp className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>

                                <div className="flex items-center space-x-2 mt-4">
                                    <Switch
                                        id="current"
                                        checked={formData.current}
                                        onCheckedChange={(checked) => setFormData({ ...formData, current: checked })}
                                    />
                                    <Label htmlFor="current">Currently Active</Label>
                                </div>

                                <div className="flex gap-2 mt-4">
                                    <Button type="submit" className="flex items-center gap-2">
                                        <Save className="h-4 w-4" />
                                        Save
                                    </Button>
                                    <Button variant="outline" onClick={handleCancel}>
                                        <X className="h-4 w-4" />
                                        Cancel
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                )}

                {/* Programme Habits List */}
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-semibold">
                        {programmeName ? `Habits for ${programmeName}` : 'All Programme Habits'}
                    </h2>
                    {!isAdding && (
                        <Button onClick={handleAddNew} className="flex items-center gap-2">
                            <Plus className="h-4 w-4" />
                            Add Programme Habit
                        </Button>
                    )}
                </div>

                <div className="grid gap-4">
                    {programmeHabits.map((programmeHabit) => (
                        <Card key={programmeHabit.id}>
                            <CardContent className="p-6">
                                {editingId === programmeHabit.id ? (
                                    <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-4">
                                        <div>
                                            <Label htmlFor="notes">Notes</Label>
                                            <Textarea
                                                id="notes"
                                                value={formData.notes}
                                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                                placeholder="Programme-specific notes"
                                            />
                                        </div>

                                        <div className="grid grid-cols-7 gap-2 mb-4 text-center font-medium">
                                            {daysOfWeek.map((day) => (
                                                <div key={day}>{day}</div>
                                            ))}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {editingId && (
                                                <Button
                                                    type="button"
                                                    variant="secondary"
                                                    size="sm"
                                                    onClick={handleDecrementAll}
                                                    className="h-auto px-2 py-1"
                                                >
                                                    <ArrowDown className="h-4 w-4" />
                                                </Button>
                                            )}
                                            <div className="grid grid-cols-7 gap-2 flex-1">
                                                {daysOfWeek.map((day) => {
                                                    const frequencyKey = `${day.toLowerCase()}Frequency` as keyof typeof formData;
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
                                            </div>
                                            {editingId && (
                                                <Button
                                                    type="button"
                                                    variant="secondary"
                                                    size="sm"
                                                    onClick={handleIncrementAll}
                                                    className="h-auto px-2 py-1"
                                                >
                                                    <ArrowUp className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>

                                        <div className="flex items-center space-x-2">
                                            <Switch
                                                id="current"
                                                checked={formData.current}
                                                onCheckedChange={(checked) => setFormData({ ...formData, current: checked })}
                                            />
                                            <Label>Currently Active</Label>
                                        </div>

                                        <div className="flex gap-2">
                                            <Button onClick={handleSave} className="flex items-center gap-2">
                                                <Save className="h-4 w-4" />
                                                Save
                                            </Button>
                                            <Button variant="outline" onClick={handleCancel}>
                                                <X className="h-4 w-4" />
                                                Cancel
                                            </Button>
                                        </div>
                                    </form>
                                ) : (
                                    <div className="flex justify-between items-start">
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-lg font-semibold">{getHabitTitle(programmeHabit.habitId)}</h3>
                                                <Badge variant={programmeHabit.current ? "default" : "secondary"}>
                                                    {programmeHabit.current ? "Active" : "Inactive"}
                                                </Badge>
                                            </div>

                                            <div className="text-sm text-muted-foreground space-y-1">
                                                {programmeHabit.notes && <p><strong>Notes:</strong> {programmeHabit.notes}</p>}
                                                <p><strong>Frequency:</strong> {formatFrequency(
                                                    programmeHabit.monFrequency,
                                                    programmeHabit.tueFrequency,
                                                    programmeHabit.wedFrequency,
                                                    programmeHabit.thuFrequency,
                                                    programmeHabit.friFrequency,
                                                    programmeHabit.satFrequency,
                                                    programmeHabit.sunFrequency
                                                )}</p>
                                            </div>
                                        </div>

                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleEdit(programmeHabit)}
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleDelete(programmeHabit.id)}
                                                className="text-red-600 hover:text-red-700"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {programmeHabits.length === 0 && (
                    <Card>
                        <CardContent className="p-6 text-center">
                            <p className="text-muted-foreground">No programme habits found.</p>
                            <Button onClick={handleAddNew} className="mt-2">
                                <Plus className="h-4 w-4 mr-2" />
                                Add Your First Programme Habit
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </div>
        </ProtectedRoute>
    )
}

export default function ProgrammeHabitManagementPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
                    <p className="mt-4 text-lg">Loading...</p>
                </div>
            </div>
        }>
            <ProgrammeHabitManagementContent />
        </Suspense>
    )
} 