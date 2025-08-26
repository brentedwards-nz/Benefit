"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  readProgrammes,
  createProgramme,
  updateProgramme,
} from "@/server-actions/programme/actions";
import { readProgramTemplates } from "@/server-actions/programme/actions";
import {
  Programme as ProgrammeType,
  ProgrammeTemplate,
  ProgrammeCreateInput,
} from "@/server-actions/programme/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

const Programme = () => {
  const router = useRouter();
  const [programmes, setProgrammes] = useState<ProgrammeType[]>([]);
  const [templates, setTemplates] = useState<ProgrammeTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProgrammeId, setSelectedProgrammeId] = useState<string>("");
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<Partial<ProgrammeType>>({
    name: "",
    startDate: new Date(),
    endDate: undefined,
    maxClients: 0,
    programmeCost: 0,
    notes: "",
    sessionsDescription: {
      totalWeeks: 0,
      sessionsPerWeek: 0,
      schedule: [],
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [programmesResult, templatesResult] = await Promise.all([
          readProgrammes(),
          readProgramTemplates(),
        ]);

        if (programmesResult.success) {
          setProgrammes(programmesResult.data);
        } else {
          setError(programmesResult.message);
        }

        if (templatesResult.success) {
          setTemplates(templatesResult.data);
        }
      } catch (err) {
        setError("Failed to fetch data");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleProgrammeSelect = async (programmeId: string) => {
    setSelectedProgrammeId(programmeId);

    if (programmeId === "create-new") {
      setIsCreating(true);
      setIsEditing(false);
      setFormData({
        name: "",
        startDate: new Date(),
        maxClients: 0,
        programmeCost: 0,
        notes: "",
        sessionsDescription: {
          totalWeeks: 0,
          sessionsPerWeek: 0,
          schedule: [],
        },
      });
    } else if (programmeId === "create-new-template") {
      // Navigate to ProgrammeTemplate page
      router.push("/dashboard/admin/templates");
      return;
    } else {
      setIsCreating(false);
      setIsEditing(true);
      const programme = programmes.find((p) => p.id === programmeId);
      if (programme) {
        setFormData({
          name: programme.name,
          startDate: programme.startDate,
          endDate: programme.endDate,
          maxClients: programme.maxClients,
          programmeCost: programme.programmeCost,
          notes: programme.notes || "",
          sessionsDescription: programme.sessionsDescription || {
            totalWeeks: 0,
            sessionsPerWeek: 0,
            schedule: [],
          },
        });
      }
    }
    // Clear any previous errors when switching programmes
    setError(null);
  };

  const handleCopyFromSelection = (selectionId: string) => {
    if (selectionId.startsWith("template-")) {
      // Copy from template
      const templateId = selectionId.replace("template-", "");
      const template = templates.find((t) => t.id === templateId);
      if (template) {
        setFormData({
          name: template.name,
          startDate: new Date(),
          maxClients: template.maxClients,
          programmeCost: template.programmeCost,
          notes: template.notes || "",
          sessionsDescription: template.sessionsDescription || {
            totalWeeks: 0,
            sessionsPerWeek: 0,
            schedule: [],
          },
        });
        toast.success("Template data copied to form!");
      }
    } else if (selectionId.startsWith("programme-")) {
      // Copy from programme
      const programmeId = selectionId.replace("programme-", "");
      const programme = programmes.find((p) => p.id === programmeId);
      if (programme) {
        setFormData({
          name: programme.name,
          startDate: new Date(),
          maxClients: programme.maxClients,
          programmeCost: programme.programmeCost,
          notes: programme.notes || "",
          sessionsDescription: programme.sessionsDescription || {
            totalWeeks: 0,
            sessionsPerWeek: 0,
            schedule: [],
          },
        });
        toast.success("Programme data copied to form!");
      }
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSessionsDescriptionChange = (field: string, value: any) => {
    setFormData(
      (prev) =>
        ({
          ...prev,
          sessionsDescription: {
            ...prev.sessionsDescription,
            [field]: value,
          },
        } as any)
    );
  };

  const handleSubmit = async () => {
    if (
      !formData.name ||
      !formData.startDate ||
      !formData.maxClients ||
      formData.maxClients <= 0
    ) {
      const errorMsg =
        "Please fill in all required fields (Name, Start Date, Max Clients)";
      toast.error(errorMsg);
      setError(errorMsg);
      return;
    }

    try {
      setIsSubmitting(true);

      if (isCreating) {
        // For now, we'll use the first template. In a real app, you'd let the user select one
        if (templates.length === 0) {
          toast.error(
            "No templates available. Please create a template first."
          );
          return;
        }

        const templateId = templates[0].id; // Use first template for now
        const createData: ProgrammeCreateInput = {
          programmeTemplateId: templateId,
          humanReadableId: `PROGRAMME_${Date.now()}`,
          name: formData.name,
          startDate: formData.startDate!,
          endDate: formData.endDate,
          maxClients: formData.maxClients,
          programmeCost: formData.programmeCost || 0,
          notes: formData.notes || undefined,
          sessionsDescription: formData.sessionsDescription || undefined,
          adhocData: undefined,
        };

        const result = await createProgramme(createData);

        if (result.success) {
          toast.success("Programme created successfully!");
          // Refresh programmes list
          const refreshResult = await readProgrammes();
          if (refreshResult.success) {
            setProgrammes(refreshResult.data);
          }
          // Close form and return to summary
          setIsCreating(false);
          setSelectedProgrammeId("");
          setFormData({
            name: "",
            startDate: new Date(),
            endDate: undefined,
            maxClients: 0,
            programmeCost: 0,
            notes: "",
            sessionsDescription: {
              totalWeeks: 0,
              sessionsPerWeek: 0,
              schedule: [],
            },
          });
          setError(null);
        } else {
          toast.error(result.message || "Failed to create programme");
          setError(result.message || "Failed to create programme");
        }
      } else if (isEditing && selectedProgrammeId) {
        // Update existing programme
        const updateData = {
          name: formData.name,
          startDate: formData.startDate,
          endDate: formData.endDate,
          maxClients: formData.maxClients,
          programmeCost: formData.programmeCost || 0,
          notes: formData.notes,
          sessionsDescription: formData.sessionsDescription,
        };

        const result = await updateProgramme(selectedProgrammeId, updateData);

        if (result.success) {
          toast.success("Programme updated successfully!");
          // Refresh programmes list
          const refreshResult = await readProgrammes();
          if (refreshResult.success) {
            setProgrammes(refreshResult.data);
          }
          // Close form and return to summary
          setIsEditing(false);
          setSelectedProgrammeId("");
          setFormData({
            name: "",
            startDate: new Date(),
            endDate: undefined,
            maxClients: 0,
            programmeCost: 0,
            notes: "",
            sessionsDescription: {
              totalWeeks: 0,
              sessionsPerWeek: 0,
              schedule: [],
            },
          });
          setError(null);
        } else {
          toast.error(result.message || "Failed to update programme");
          setError(result.message || "Failed to update programme");
        }
      }
    } catch (err: any) {
      console.error("Error saving programme:", err);
      const errorMsg = `An unexpected error occurred: ${
        err.message || "Unknown error"
      }`;
      toast.error(errorMsg);
      setError(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setIsCreating(false);
    setSelectedProgrammeId("");
    setFormData({
      name: "",
      startDate: new Date(),
      maxClients: 0,
      programmeCost: 0,
      notes: "",
      sessionsDescription: {
        totalWeeks: 0,
        sessionsPerWeek: 0,
        schedule: [],
      },
    });
    setError(null);
  };

  if (loading) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="bg-muted/50 flex-1 rounded-xl md:min-h-min p-4">
          <div className="animate-pulse">Loading programmes...</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="flex-1 rounded-xl md:min-h-min p-4 border">
          <h1 className="text-2xl font-bold mb-4">Programmes</h1>

          {/* Programme Selector */}
          <div className="mb-6">
            <Label
              htmlFor="programme-select"
              className="text-sm font-medium mb-2 block"
            >
              Select Action
            </Label>
            <Select
              value={selectedProgrammeId}
              onValueChange={handleProgrammeSelect}
            >
              <SelectTrigger className="w-full max-w-md">
                <SelectValue placeholder="Choose an action..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="create-new">
                  ➕ Create New Programme
                </SelectItem>
                <SelectItem value="create-new-template">
                  🎯 Create New Template
                </SelectItem>
                <Separator />
                {programmes.map((programme) => (
                  <SelectItem key={programme.id} value={programme.id}>
                    ✏️ {programme.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Programme Form */}
          {(isEditing || isCreating) && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>
                  {isCreating ? "Create New Programme" : "Edit Programme"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Error Message at Top of Form */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                    <h3 className="text-red-800 font-medium">Error</h3>
                    <p className="text-red-600">{error}</p>
                  </div>
                )}

                {/* Copy From Selection - Only show when creating */}
                {isCreating && (
                  <div className="mb-6">
                    <Label
                      htmlFor="copy-from"
                      className="text-sm font-medium mb-2 block"
                    >
                      Copy From (Optional)
                    </Label>
                    <Select onValueChange={handleCopyFromSelection}>
                      <SelectTrigger className="w-full max-w-md">
                        <SelectValue placeholder="Select template or programme to copy from..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">
                          Start with empty form
                        </SelectItem>
                        <Separator />
                        <div className="px-2 py-1 text-sm font-medium text-muted-foreground">
                          Templates
                        </div>
                        {templates.map((template) => (
                          <SelectItem
                            key={`template-${template.id}`}
                            value={`template-${template.id}`}
                          >
                            🎯 {template.name}
                          </SelectItem>
                        ))}
                        <Separator />
                        <div className="px-2 py-1 text-sm font-medium text-muted-foreground">
                          Existing Programmes
                        </div>
                        {programmes.map((programme) => (
                          <SelectItem
                            key={`programme-${programme.id}`}
                            value={`programme-${programme.id}`}
                          >
                            📋 {programme.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="name">Programme Name</Label>
                    <Input
                      id="name"
                      value={formData.name || ""}
                      onChange={(e) =>
                        handleInputChange("name", e.target.value)
                      }
                      placeholder="Enter programme name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={
                        formData.startDate
                          ? new Date(formData.startDate)
                              .toISOString()
                              .split("T")[0]
                          : ""
                      }
                      onChange={(e) =>
                        handleInputChange("startDate", new Date(e.target.value))
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="endDate">End Date</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={
                        formData.endDate
                          ? new Date(formData.endDate)
                              .toISOString()
                              .split("T")[0]
                          : ""
                      }
                      onChange={(e) =>
                        handleInputChange(
                          "endDate",
                          e.target.value ? new Date(e.target.value) : undefined
                        )
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="maxClients">Max Clients</Label>
                    <Input
                      id="maxClients"
                      type="number"
                      value={formData.maxClients || ""}
                      onChange={(e) =>
                        handleInputChange(
                          "maxClients",
                          parseInt(e.target.value)
                        )
                      }
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="programmeCost">Programme Cost</Label>
                    <Input
                      id="programmeCost"
                      type="number"
                      step="0.01"
                      value={formData.programmeCost || ""}
                      onChange={(e) =>
                        handleInputChange(
                          "programmeCost",
                          parseFloat(e.target.value) || 0
                        )
                      }
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label htmlFor="notes">Notes</Label>
                    <Input
                      id="notes"
                      value={formData.notes || ""}
                      onChange={(e) =>
                        handleInputChange("notes", e.target.value)
                      }
                      placeholder="Enter any additional notes..."
                    />
                  </div>
                </div>

                {/* Sessions Description */}
                <div className="space-y-4">
                  <Label className="text-base font-medium">
                    Sessions Description
                  </Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="totalWeeks">Total Weeks</Label>
                      <Input
                        id="totalWeeks"
                        type="number"
                        value={formData.sessionsDescription?.totalWeeks || ""}
                        onChange={(e) =>
                          handleSessionsDescriptionChange(
                            "totalWeeks",
                            parseInt(e.target.value)
                          )
                        }
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <Label htmlFor="sessionsPerWeek">Sessions per Week</Label>
                      <Input
                        id="sessionsPerWeek"
                        type="number"
                        value={
                          formData.sessionsDescription?.sessionsPerWeek || ""
                        }
                        onChange={(e) =>
                          handleSessionsDescriptionChange(
                            "sessionsPerWeek",
                            parseInt(e.target.value)
                          )
                        }
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button onClick={handleSubmit} disabled={isSubmitting}>
                    {isSubmitting
                      ? isCreating
                        ? "Creating..."
                        : "Updating..."
                      : isCreating
                      ? "Create Programme"
                      : "Update Programme"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleCancel}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Programmes List */}
          {!isEditing && !isCreating && (
            <>
              {programmes.length === 0 ? (
                <p className="text-muted-foreground">
                  No programmes found. Create your first programme to get
                  started.
                </p>
              ) : (
                <>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {programmes.map((programme) => (
                      <div
                        key={programme.id}
                        className={`bg-background border rounded-lg p-4 shadow-sm hover:shadow-lg hover:scale-[1.02] transition-all duration-300 cursor-pointer hover:border-primary/50 hover:bg-muted/30 group active:scale-[0.98] ${
                          selectedProgrammeId === programme.id
                            ? "ring-2 ring-primary ring-offset-2"
                            : ""
                        }`}
                        onClick={() => handleProgrammeSelect(programme.id)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            handleProgrammeSelect(programme.id);
                          }
                        }}
                      >
                        <div className="mb-2">
                          <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                            {programme.name}
                          </h3>
                        </div>
                        <div className="space-y-2 text-sm text-muted-foreground">
                          <p>
                            <strong>ID:</strong> {programme.humanReadableId}
                          </p>
                          <p>
                            <strong>Start Date:</strong>{" "}
                            {programme.startDate.toLocaleDateString()}
                          </p>
                          {programme.endDate && (
                            <p>
                              <strong>End Date:</strong>{" "}
                              {programme.endDate.toLocaleDateString()}
                            </p>
                          )}
                          <p>
                            <strong>Max Clients:</strong> {programme.maxClients}
                          </p>
                          <p>
                            <strong>Cost:</strong> $
                            {programme.programmeCost.toString()}
                          </p>
                          {programme.notes && (
                            <p>
                              <strong>Notes:</strong> {programme.notes}
                            </p>
                          )}
                          {programme.sessionsDescription && (
                            <div>
                              <strong>Sessions:</strong>
                              <p className="ml-2">
                                {programme.sessionsDescription.totalWeeks}{" "}
                                weeks,
                                {
                                  programme.sessionsDescription.sessionsPerWeek
                                }{" "}
                                per week
                              </p>
                            </div>
                          )}
                          <p>
                            <strong>Created:</strong>{" "}
                            {programme.createdAt?.toLocaleDateString()}
                          </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-border">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(
                                `/dashboard/trainer/programmes/clients?programmeId=${
                                  programme.id
                                }&programmeName=${encodeURIComponent(
                                  programme.name
                                )}`
                              );
                            }}
                            className="text-xs px-2 py-1 h-7 w-full"
                          >
                            👥 Clients
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(
                                `/dashboard/trainer/programmes/habit?programmeId=${
                                  programme.id
                                }&programmeName=${encodeURIComponent(
                                  programme.name
                                )}`
                              );
                            }}
                            className="text-xs px-2 py-1 h-7 w-full"
                          >
                            💪 Habits
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleProgrammeSelect(programme.id);
                            }}
                            className="text-xs px-2 py-1 h-7 w-full"
                          >
                            ✏️ Edit
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default Programme;
