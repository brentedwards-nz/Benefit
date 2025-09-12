"use client";

import { useState, useEffect, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  ChevronsUpDown,
  ArrowDown,
  ArrowUp,
} from "lucide-react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { UserRole } from "@prisma/client";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";

interface ProgrammeHabit {
  id: string;
  programmeId: string;
  habitId: string;
  notes: string | null;
  monFrequency: number | 0;
  tueFrequency: number | 0;
  wedFrequency: number | 0;
  thuFrequency: number | 0;
  friFrequency: number | 0;
  satFrequency: number | 0;
  sunFrequency: number | 0;
  current: boolean;
  createdAt: string;
  updatedAt: string;
  programme: {
    id: string;
    name: string;
    humanReadableId: string;
  };
  habit: {
    id: string;
    title: string;
    notes: string | null;
  };
}

interface Habit {
  id: string;
  title: string;
  notes: string | null;
  monFrequency: number | 0;
  tueFrequency: number | 0;
  wedFrequency: number | 0;
  thuFrequency: number | 0;
  friFrequency: number | 0;
  satFrequency: number | 0;
  sunFrequency: number | 0;
  current: boolean;
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

function FrequencyCombobox({
  value,
  onChange,
  options,
}: FrequencyComboboxProps) {
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

function ProgrammeHabitManagementContent() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const programmeId = searchParams.get("programmeId");
  const programmeName = searchParams.get("programmeName");

  const [programmeHabits, setProgrammeHabits] = useState<ProgrammeHabit[]>([]);
  const [availableHabits, setAvailableHabits] = useState<Habit[]>([]);
  const [programmes, setProgrammes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    programmeId: programmeId || "",
    habitId: "",
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
  const [isAdding, setIsAdding] = useState(false);
  const [habitToDelete, setHabitToDelete] = useState<string | null>(null);

  type FrequencyKey =
    | "monFrequency"
    | "tueFrequency"
    | "wedFrequency"
    | "thuFrequency"
    | "friFrequency"
    | "satFrequency"
    | "sunFrequency";
  const frequencyKeys: FrequencyKey[] = [
    "monFrequency",
    "tueFrequency",
    "wedFrequency",
    "thuFrequency",
    "friFrequency",
    "satFrequency",
    "sunFrequency",
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch programme habits
      const phUrl = programmeId
        ? `/api/admin/programme-habits?programmeId=${programmeId}`
        : "/api/admin/programme-habits";
      const phResponse = await fetch(phUrl);
      if (phResponse.ok) {
        const phData = await phResponse.json();
        setProgrammeHabits(phData);
      }

      // Fetch available habits
      const habitsResponse = await fetch("/api/admin/habits");
      if (habitsResponse.ok) {
        const habitsData = await habitsResponse.json();
        setAvailableHabits(habitsData);
      }

      // Fetch programmes
      const programmesResponse = await fetch("/api/admin/programmes");
      if (programmesResponse.ok) {
        const programmesData = await programmesResponse.json();
        setProgrammes(programmesData);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleHabitSelect = (habitId: string) => {
    const selectedHabit = availableHabits.find((h) => h.id === habitId);
    if (selectedHabit) {
      setFormData((prev) => ({
        ...prev,
        habitId: selectedHabit.id,
        notes: selectedHabit.notes || "",
        monFrequency: selectedHabit.monFrequency || 0,
        tueFrequency: selectedHabit.tueFrequency || 0,
        wedFrequency: selectedHabit.wedFrequency || 0,
        thuFrequency: selectedHabit.thuFrequency || 0,
        friFrequency: selectedHabit.friFrequency || 0,
        satFrequency: selectedHabit.satFrequency || 0,
        sunFrequency: selectedHabit.sunFrequency || 0,
      }));
    }
  };

  const handleEdit = (programmeHabit: ProgrammeHabit) => {
    setEditingId(programmeHabit.id);
    setIsAdding(false);
    setFormData({
      programmeId: programmeHabit.programmeId,
      habitId: programmeHabit.habitId,
      notes: programmeHabit.notes || "",
      monFrequency: programmeHabit.monFrequency || 0,
      tueFrequency: programmeHabit.tueFrequency || 0,
      wedFrequency: programmeHabit.wedFrequency || 0,
      thuFrequency: programmeHabit.thuFrequency || 0,
      friFrequency: programmeHabit.friFrequency || 0,
      satFrequency: programmeHabit.satFrequency || 0,
      sunFrequency: programmeHabit.sunFrequency || 0,
      current: programmeHabit.current,
    });
  };

  const handleSave = async () => {
    try {
      // Validate required fields
      if (!formData.habitId) {
        alert("Please select a base habit");
        return;
      }

      // Ensure programmeId is set (either from URL or form)
      const finalProgrammeId = programmeId || formData.programmeId;
      if (!finalProgrammeId) {
        alert("Please select a programme");
        return;
      }

      if (editingId) {
        // Update existing programme habit
        const response = await fetch(
          `/api/admin/programme-habits/${editingId}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData),
          }
        );

        if (response.ok) {
          setEditingId(null);
          fetchData();
        }
      } else {
        // Create new programme habit
        const response = await fetch("/api/admin/programme-habits", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...formData,
            programmeId: finalProgrammeId,
          }),
        });

        if (response.ok) {
          setIsAdding(false);
          resetForm();
          fetchData();
        }
      }
    } catch (error) {
      console.error("Error saving programme habit:", error);
    }
  };

  const handleDelete = (id: string) => {
    setHabitToDelete(id);
  };

  const confirmDelete = async () => {
    if (!habitToDelete) return;

    try {
      const response = await fetch(
        `/api/admin/programme-habits/${habitToDelete}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        toast.success("Programme habit deleted successfully.");
        fetchData();
      } else {
        toast.error("Failed to delete programme habit.");
      }
    } catch (error) {
      toast.error("An error occurred while deleting the programme habit.");
      console.error("Error deleting programme habit:", error);
    } finally {
      setHabitToDelete(null);
    }
  };

  const handleIncrementAll = () => {
    setFormData((prevFormData) => {
      const newFormData = { ...prevFormData };
      frequencyKeys.forEach((key) => {
        newFormData[key] = Math.min(newFormData[key] + 1, 9);
      });
      return newFormData;
    });
  };

  const handleDecrementAll = () => {
    setFormData((prevFormData) => {
      const newFormData = { ...prevFormData };
      frequencyKeys.forEach((key) => {
        newFormData[key] = Math.max(newFormData[key] - 1, 0);
      });
      return newFormData;
    });
  };

  const resetForm = () => {
    setFormData({
      programmeId: programmeId || "", // Preserve programmeId from URL
      habitId: "",
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

  const handleAddNew = () => {
    setIsAdding(true);
    setEditingId(null);
    resetForm();
    // Ensure programmeId is set from URL if available
    if (programmeId) {
      setFormData((prev) => ({ ...prev, programmeId }));
    }
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
    resetForm();
  };

  const getHabitTitle = (habitId: string) => {
    const habit = availableHabits.find((h) => h.id === habitId);
    return habit ? habit.title : "Unknown Habit";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
          <p className="mt-4 text-lg">Loading programme habits...</p>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute requiredRoles={[UserRole.Admin, UserRole.SystemAdmin]}>
      <div className="container mx-auto p-4">
        <div className="flex items-center justify-between gap-4 mb-6 w-full">
          <div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </div>
          <div>
            <h1 className="text-3xl font-bold">
              {programmeName
                ? `Habits for ${programmeName}`
                : "Programme Habit Management"}
            </h1>
            <p className="text-muted-foreground">
              {programmeName
                ? `Manage habits assigned to ${programmeName}`
                : "Manage habits assigned to programmes"}
            </p>
          </div>
          <div>
            {" "}
            {/* Remove the redundant justify-end class here */}
            {!isAdding && (
              <Button
                onClick={handleAddNew}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Programme Habit
              </Button>
            )}
          </div>
        </div>

        {/* Add New Programme Habit */}
        {isAdding && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>
                {editingId ? "Edit Programme Habit" : "Add New Programme Habit"}
              </CardTitle>
              {programmeId && (
                <CardDescription>
                  Programme: <strong>{programmeName}</strong>
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {!programmeId && (
                <div>
                  <Label>Programme</Label>
                  <Select
                    value={formData.programmeId}
                    onValueChange={(value) =>
                      setFormData({ ...formData, programmeId: value })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select Programme" />
                    </SelectTrigger>
                    <SelectContent>
                      {programmes.map((programme) => (
                        <SelectItem key={programme.id} value={programme.id}>
                          {programme.name} ({programme.humanReadableId})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <Label>Base Habit</Label>
                <Select
                  value={formData.habitId}
                  onValueChange={handleHabitSelect}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Habit" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableHabits.map((habit) => (
                      <SelectItem key={habit.id} value={habit.id}>
                        {habit.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  placeholder="Programme-specific notes"
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
                {daysOfWeek.map((day) => {
                  const frequencyKey =
                    `${day.toLowerCase()}Frequency` as keyof typeof formData;
                  return (
                    <FrequencyCombobox
                      key={day}
                      value={formData[frequencyKey] as number}
                      onChange={(newValue) =>
                        setFormData((prev) => ({
                          ...prev,
                          [frequencyKey]: newValue,
                        }))
                      }
                      options={frequencyOptions}
                    />
                  );
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

              <div className="flex items-center space-x-2">
                <Switch
                  id="current"
                  checked={formData.current}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, current: checked })
                  }
                />
                <Label htmlFor="current">Currently Active</Label>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleSave}
                  className="flex items-center gap-2"
                >
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

        <div className="grid gap-2">
          {programmeHabits.map((programmeHabit) => (
            <Card key={programmeHabit.id} className="pt-4 pb-4">
              <CardContent className="p-4 pt-0 pb-0">
                {editingId === programmeHabit.id ? (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold mb-2">
                      {getHabitTitle(programmeHabit.habitId)}
                    </h3>
                    <div>
                      <div>
                        <Label>Notes</Label>
                        <Input
                          value={formData.notes}
                          onChange={(e) =>
                            setFormData({ ...formData, notes: e.target.value })
                          }
                        />
                      </div>
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
                      {daysOfWeek.map((day) => {
                        const frequencyKey =
                          `${day.toLowerCase()}Frequency` as keyof typeof formData;
                        return (
                          <FrequencyCombobox
                            key={day}
                            value={formData[frequencyKey] as number}
                            onChange={(newValue) =>
                              setFormData((prev) => ({
                                ...prev,
                                [frequencyKey]: newValue,
                              }))
                            }
                            options={frequencyOptions}
                          />
                        );
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

                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={formData.current}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, current: checked })
                        }
                      />
                      <Label>Currently Active</Label>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={handleSave}
                        className="flex items-center gap-2"
                      >
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
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold">
                          {getHabitTitle(programmeHabit.habitId)}
                        </h3>
                        <Badge
                          variant={
                            programmeHabit.current ? "default" : "secondary"
                          }
                        >
                          {programmeHabit.current ? "Active" : "Inactive"}
                        </Badge>
                      </div>

                      <div className="text-sm text-muted-foreground space-y-1">
                        {programmeHabit.notes && (
                          <p>
                            <strong>Notes:</strong> {programmeHabit.notes}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-2 text-sm">
                          {daysOfWeek.map((day) => {
                            const frequencyKey =
                              `${day.toLowerCase()}Frequency` as FrequencyKey;
                            return (
                              <span key={day}>
                                <strong>{day}:</strong>{" "}
                                {programmeHabit[frequencyKey] || 0}
                              </span>
                            );
                          })}
                        </div>
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
                      <AlertDialog
                        onOpenChange={(open) => {
                          if (!open) setHabitToDelete(null);
                        }}
                        open={habitToDelete === programmeHabit.id}
                      >
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(programmeHabit.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will
                              permanently delete the habit from the programme.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={confirmDelete}>
                              Continue
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {programmeHabits.length === 0 && (
          <Card>
            <CardContent className="p-2 text-center">
              <p className="text-muted-foreground">
                No programme habits found.
              </p>
              <Button onClick={handleAddNew} className="mt-2">
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Programme Habit
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </ProtectedRoute>
  );
}

export default function ProgrammeHabitManagementPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
            <p className="mt-4 text-lg">Loading...</p>
          </div>
        </div>
      }
    >
      <ProgrammeHabitManagementContent />
    </Suspense>
  );
}
