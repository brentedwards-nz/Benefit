"use client";

import { useEffect, useState } from "react";
import { readProgramTemplates, createProgramTemplate, updateProgramTemplate } from "@/server-actions/programme/actions";
import { ProgrammeTemplate, ProgrammeTemplateCreateInput, SessionsDescription } from "@/server-actions/programme/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

const ProgrammeTemplates = () => {
    const [templates, setTemplates] = useState<ProgrammeTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
    const [isEditing, setIsEditing] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState<{
        name: string;
        maxClients: number;
        programmeCost: number;
        notes: string;
        sessionsDescription: {
            totalWeeks: number;
            sessionsPerWeek: number;
            schedule: any[];
        };
    }>({
        name: "",
        maxClients: 0,
        programmeCost: 0,
        notes: "",
        sessionsDescription: {
            totalWeeks: 0,
            sessionsPerWeek: 0,
            schedule: []
        }
    });

    useEffect(() => {
        const fetchTemplates = async () => {
            try {
                setLoading(true);
                const result = await readProgramTemplates();

                if (result.success) {
                    setTemplates(result.data);
                } else {
                    setError(result.message);
                }
            } catch (err) {
                setError("Failed to fetch programme templates");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchTemplates();
    }, []);

    const handleTemplateSelect = (templateId: string) => {
        setSelectedTemplateId(templateId);

        if (templateId === "create-new") {
            setIsCreating(true);
            setIsEditing(false);
            setFormData({
                name: "",
                maxClients: 0,
                programmeCost: 0,
                notes: "",
                sessionsDescription: {
                    totalWeeks: 0,
                    sessionsPerWeek: 0,
                    schedule: []
                }
            });
        } else {
            setIsCreating(false);
            setIsEditing(true);
            const template = templates.find(t => t.id === templateId);
            if (template) {
                setFormData({
                    name: template.name,
                    maxClients: template.maxClients,
                    programmeCost: template.programmeCost,
                    notes: template.notes || "",
                    sessionsDescription: template.sessionsDescription || {
                        totalWeeks: 0,
                        sessionsPerWeek: 0,
                        schedule: []
                    }
                });
            }
        }
        // Clear any previous errors when switching templates
        setError(null);
    };

    const handleInputChange = (field: string, value: any) => {
        console.log("handleInputChange called with field:", field, "value:", value);
        console.log("formData before change:", formData);
        console.log("formData has startDate before:", 'startDate' in formData);

        setFormData(prev => {
            const newData = {
                ...prev,
                [field]: value
            };
            console.log("formData after change:", newData);
            console.log("newData has startDate:", 'startDate' in newData);
            return newData;
        });
    };

    const handleSessionsDescriptionChange = (field: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            sessionsDescription: {
                ...prev.sessionsDescription,
                [field]: value
            }
        } as any));
    };

    const handleSubmit = async () => {
        try {
            setIsSubmitting(true);
            setError(null); // Clear previous errors

            console.log("Form data before submission:", formData);
            console.log("Form data keys:", Object.keys(formData));
            console.log("Form data has startDate:", 'startDate' in formData);
            console.log("Form data startDate value:", (formData as any).startDate);

            // Validate required fields
            if (!formData.name || formData.maxClients === undefined || formData.maxClients <= 0) {
                const errorMsg = "Please fill in all required fields (Name, Max Clients)";
                console.log("Validation error:", errorMsg);
                setError(errorMsg);
                toast.error(errorMsg);
                return;
            }

            if (isCreating) {
                // Create a completely new object with only the fields we need
                const createData: ProgrammeTemplateCreateInput = {
                    name: String(formData.name || ''),
                    maxClients: Number(formData.maxClients || 0),
                    programmeCost: Number(formData.programmeCost || 0),
                    notes: formData.notes || undefined,
                    sessionsDescription: formData.sessionsDescription || undefined,
                    adhocData: undefined
                };

                // Double-check that no unexpected fields exist
                const allowedKeys = ['name', 'maxClients', 'programmeCost', 'notes', 'sessionsDescription', 'adhocData'];
                const hasUnexpectedFields = Object.keys(createData).some(key => !allowedKeys.includes(key));

                if (hasUnexpectedFields) {
                    console.error("Unexpected fields found in createData:", Object.keys(createData));
                    setError("Unexpected data fields detected. Please try again.");
                    return;
                }

                console.log("Creating template with data:", createData);
                console.log("Create data keys:", Object.keys(createData));
                console.log("Create data has startDate:", 'startDate' in createData);
                const result = await createProgramTemplate(createData);
                console.log("Create result:", result);

                if (result.success) {
                    console.log("Template created successfully");
                    toast.success("Template created successfully!");

                    // Refresh templates and reset form
                    const refreshResult = await readProgramTemplates();
                    if (refreshResult.success) {
                        setTemplates(refreshResult.data);
                    }

                    // Close form and return to summary
                    setIsCreating(false);
                    setSelectedTemplateId("");
                    setFormData({
                        name: "",
                        maxClients: 0,
                        programmeCost: 0,
                        notes: "",
                        sessionsDescription: {
                            totalWeeks: 0,
                            sessionsPerWeek: 0,
                            schedule: []
                        }
                    });
                    setError(null);
                } else {
                    const errorMsg = result.message || "Failed to create template";
                    console.log("Create failed:", errorMsg);
                    setError(errorMsg);
                    toast.error(errorMsg);
                }
            } else if (isEditing && selectedTemplateId !== "create-new") {
                const updateData = {
                    name: formData.name,
                    maxClients: formData.maxClients,
                    programmeCost: formData.programmeCost,
                    notes: formData.notes,
                    sessionsDescription: formData.sessionsDescription,
                    adhocData: undefined
                };

                console.log("Updating template with data:", updateData);
                const result = await updateProgramTemplate(selectedTemplateId, updateData);
                console.log("Update result:", result);

                if (result.success) {
                    console.log("Template updated successfully");
                    toast.success("Template updated successfully!");

                    // Refresh templates
                    const refreshResult = await readProgramTemplates();
                    if (refreshResult.success) {
                        setTemplates(refreshResult.data);
                    }

                    // Close form and return to summary
                    setIsEditing(false);
                    setSelectedTemplateId("");
                    setFormData({
                        name: "",
                        maxClients: 0,
                        programmeCost: 0,
                        notes: "",
                        sessionsDescription: {
                            totalWeeks: 0,
                            sessionsPerWeek: 0,
                            schedule: []
                        }
                    });
                    setError(null);
                } else {
                    const errorMsg = result.message || "Failed to update template";
                    console.log("Update failed:", errorMsg);
                    setError(errorMsg);
                    toast.error(errorMsg);
                }
            }
        } catch (err: any) {
            console.error("Error saving template:", err);
            const errorMsg = `An unexpected error occurred: ${err.message || "Unknown error"}`;
            console.log("Exception error:", errorMsg);
            setError(errorMsg);
            toast.error(errorMsg);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
        setIsCreating(false);
        setSelectedTemplateId("");
        setFormData({
            name: "",
            maxClients: 0,
            programmeCost: 0,
            notes: "",
            sessionsDescription: {
                totalWeeks: 0,
                sessionsPerWeek: 0,
                schedule: []
            }
        });
        setError(null); // Clear any previous errors
    };

    if (loading) {
        return (
            <div className="flex flex-1 flex-col gap-4 p-4">
                <div className="bg-muted/50 flex-1 rounded-xl md:min-h-min p-4">
                    <div className="animate-pulse">Loading programme templates...</div>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="flex flex-1 flex-col gap-4 p-4">
                <div className="bg-muted/50 flex-1 rounded-xl md:min-h-min p-4">
                    <h1 className="text-2xl font-bold mb-4">Programme Templates</h1>

                    {/* Template Selector */}
                    <div className="mb-6">
                        <Label htmlFor="template-select" className="text-sm font-medium mb-2 block">
                            Select Template to Edit
                        </Label>
                        <Select value={selectedTemplateId} onValueChange={handleTemplateSelect}>
                            <SelectTrigger className="w-full max-w-md">
                                <SelectValue placeholder="Choose a template or create new..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="create-new">➕ Create New Template</SelectItem>
                                <Separator />
                                {templates.map((template) => (
                                    <SelectItem key={template.id} value={template.id}>
                                        {template.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Template Form */}
                    {(isEditing || isCreating) && (
                        <Card className="mb-6">
                            <CardHeader>
                                <CardTitle>
                                    {isCreating ? "Create New Template" : "Edit Template"}
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

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <Label htmlFor="name">Template Name</Label>
                                        <Input
                                            id="name"
                                            value={formData.name || ""}
                                            onChange={(e) => handleInputChange("name", e.target.value)}
                                            placeholder="Enter template name"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="maxClients">Max Clients</Label>
                                        <Input
                                            id="maxClients"
                                            type="number"
                                            value={formData.maxClients || ""}
                                            onChange={(e) => handleInputChange("maxClients", parseInt(e.target.value))}
                                            placeholder="0"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="programmeCost">Programme Cost</Label>
                                        <Input
                                            id="programmeCost"
                                            type="number"
                                            step="0.01"
                                            value={formData.programmeCost || ""}
                                            onChange={(e) => handleInputChange("programmeCost", parseFloat(e.target.value) || 0)}
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <Label htmlFor="notes">Notes</Label>
                                    <Textarea
                                        id="notes"
                                        value={formData.notes || ""}
                                        onChange={(e) => handleInputChange("notes", e.target.value)}
                                        placeholder="Enter any additional notes..."
                                        rows={3}
                                    />
                                </div>

                                {/* Sessions Description */}
                                <div className="space-y-4">
                                    <Label className="text-base font-medium">Sessions Description</Label>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <Label htmlFor="totalWeeks">Total Weeks</Label>
                                            <Input
                                                id="totalWeeks"
                                                type="number"
                                                value={formData.sessionsDescription?.totalWeeks || ""}
                                                onChange={(e) => handleSessionsDescriptionChange("totalWeeks", parseInt(e.target.value))}
                                                placeholder="0"
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="sessionsPerWeek">Sessions per Week</Label>
                                            <Input
                                                id="sessionsPerWeek"
                                                type="number"
                                                value={formData.sessionsDescription?.sessionsPerWeek || ""}
                                                onChange={(e) => handleSessionsDescriptionChange("sessionsPerWeek", parseInt(e.target.value))}
                                                placeholder="0"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-2 pt-4">
                                    <Button
                                        onClick={handleSubmit}
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? "Saving..." : (isCreating ? "Create Template" : "Save Changes")}
                                    </Button>
                                    <Button variant="outline" onClick={handleCancel} disabled={isSubmitting}>
                                        Cancel
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Templates List */}
                    {!isEditing && !isCreating && (
                        <>
                            {templates.length === 0 ? (
                                <p className="text-muted-foreground">No programme templates found. Create your first template to get started.</p>
                            ) : (
                                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                    {templates.map((template) => (
                                        <div key={template.id} className="bg-background border rounded-lg p-4 shadow-sm">
                                            <h3 className="font-semibold text-lg mb-2">{template.name}</h3>
                                            <div className="space-y-2 text-sm text-muted-foreground">
                                                <p><strong>Max Clients:</strong> {template.maxClients}</p>
                                                <p><strong>Cost:</strong> ${template.programmeCost.toString()}</p>
                                                {template.notes && (
                                                    <p><strong>Notes:</strong> {template.notes}</p>
                                                )}
                                                {template.sessionsDescription && (
                                                    <div>
                                                        <strong>Sessions:</strong>
                                                        <p className="ml-2">
                                                            {template.sessionsDescription.totalWeeks} weeks,
                                                            {template.sessionsDescription.sessionsPerWeek} per week
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </>
    );
};

export default ProgrammeTemplates;
