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

interface ProgrammeHabit {
    id: string
    programmeId: string
    habitId: string
    notes: string | null
    frequencyPerWeek: any
    frequencyPerDay: number | null
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
    frequencyPerWeek: any
    frequencyPerDay: number | null
    current: boolean
}

function ProgrammeHabitManagementContent() {
    const { data: session } = useSession()
    const router = useRouter()
    const searchParams = useSearchParams()
    const programmeId = searchParams.get('programmeId')
    const programmeName = searchParams.get('programmeName')

    const [programmeHabits, setProgrammeHabits] = useState<ProgrammeHabit[]>([])
    const [availableHabits, setAvailableHabits] = useState<Habit[]>([])
    const [loading, setLoading] = useState(true)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [formData, setFormData] = useState({
        programmeId: programmeId || '',
        habitId: '',
        notes: '',
        frequencyPerWeek: { per_week: 5 as number | string, per_day: null },
        frequencyPerDay: null as number | null,
        current: true
    })
    const [isAdding, setIsAdding] = useState(false)

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
            frequencyPerWeek: programmeHabit.frequencyPerWeek,
            frequencyPerDay: programmeHabit.frequencyPerDay,
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
            frequencyPerWeek: { per_week: 5, per_day: null },
            frequencyPerDay: null,
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

    const formatFrequency = (frequencyPerWeek: any, frequencyPerDay: number | null) => {
        let frequency = ''

        if (frequencyPerWeek && typeof frequencyPerWeek === 'object') {
            if (frequencyPerWeek.per_week) {
                if (frequencyPerWeek.per_week === 'Every day' || frequencyPerWeek.per_week === 7) {
                    frequency = 'Every day'
                } else if (frequencyPerWeek.per_week === 1) {
                    frequency = 'Once per week'
                } else {
                    frequency = `${frequencyPerWeek.per_week} times per week`
                }
            }
        }

        if (frequencyPerDay && frequencyPerDay > 1) {
            frequency += `, ${frequencyPerDay} times per day`
        }

        return frequency || 'Not specified'
    }

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

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="frequencyPerWeek">Frequency per Week</Label>
                                    <select
                                        id="frequencyPerWeek"
                                        value={formData.frequencyPerWeek.per_week}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            frequencyPerWeek: { ...formData.frequencyPerWeek, per_week: e.target.value }
                                        })}
                                        className="w-full p-2 border rounded-md"
                                    >
                                        <option value="1">Once per week</option>
                                        <option value="2">2 times per week</option>
                                        <option value="3">3 times per week</option>
                                        <option value="4">4 times per week</option>
                                        <option value="5">5 times per week</option>
                                        <option value="6">6 times per week</option>
                                        <option value="7">Every day</option>
                                    </select>
                                </div>
                                <div>
                                    <Label htmlFor="frequencyPerDay">Times per Day</Label>
                                    <Input
                                        id="frequencyPerDay"
                                        type="number"
                                        min="1"
                                        max="10"
                                        value={formData.frequencyPerDay || ''}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            frequencyPerDay: e.target.value ? parseInt(e.target.value) : null
                                        })}
                                        placeholder="1"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="current"
                                    checked={formData.current}
                                    onCheckedChange={(checked) => setFormData({ ...formData, current: checked })}
                                />
                                <Label htmlFor="current">Currently Active</Label>
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
                                    <div className="space-y-4">
                                        <div>
                                            <div>
                                                <Label>Notes</Label>
                                                <Input
                                                    value={formData.notes}
                                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <Label>Frequency per Week</Label>
                                                <select
                                                    value={formData.frequencyPerWeek.per_week}
                                                    onChange={(e) => setFormData({
                                                        ...formData,
                                                        frequencyPerWeek: { ...formData.frequencyPerWeek, per_week: e.target.value }
                                                    })}
                                                    className="w-full p-2 border rounded-md"
                                                >
                                                    <option value="1">Once per week</option>
                                                    <option value="2">2 times per week</option>
                                                    <option value="3">3 times per week</option>
                                                    <option value="4">4 times per week</option>
                                                    <option value="5">5 times per week</option>
                                                    <option value="6">6 times per week</option>
                                                    <option value="7">Every day</option>
                                                </select>
                                            </div>
                                            <div>
                                                <Label>Times per Day</Label>
                                                <Input
                                                    type="number"
                                                    min="1"
                                                    max="10"
                                                    value={formData.frequencyPerDay || ''}
                                                    onChange={(e) => setFormData({
                                                        ...formData,
                                                        frequencyPerDay: e.target.value ? parseInt(e.target.value) : null
                                                    })}
                                                    placeholder="1"
                                                />
                                            </div>
                                        </div>

                                        <div className="flex items-center space-x-2">
                                            <Switch
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
                                    </div>
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
                                                <p><strong>Frequency:</strong> {formatFrequency(programmeHabit.frequencyPerWeek, programmeHabit.frequencyPerDay)}</p>
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