"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Trash2 } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronsUpDown } from "lucide-react";
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
  initiateFitbitOAuth,
  readClientSettings,
  deleteClientSetting,
  createManualClientSetting,
  type ClientSetting,
  type SettingProperty,
} from "@/server-actions/client/integrations/fitbit";

const errorMessages: Record<string, string> = {
  server_config_error: "Server configuration missing for Fitbit connector.",
  fitbit_auth_denied: "Fitbit access denied by user.",
  no_auth_code: "Authentication failed: No code received from the OAuth provider.",
  state_missing: "Security error: State parameter missing or invalid.",
  client_not_found_or_mismatch: "Security error: Client not found or state mismatch.",
  fitbit_token_exchange_failed: "Fitbit token exchange failed.",
  no_refresh_token_issued_fitbit: "Authentication failed: No refresh token issued from Fitbit.",
  fitbit_profile_fetch_failed: "Failed to fetch Fitbit profile.",
  db_config_failed_client_fitbit: "Failed to save client Fitbit OAuth configuration.",
  unauthenticated: "You are not authenticated. Please sign in.",
};

const ClientSettingsPage = () => {
  const [settings, setSettings] = useState<ClientSetting[]>([]);
  const [isPending, startTransition] = useTransition();
  const [manualSettingId, setManualSettingId] = useState("");
  const [manualSettingType, setManualSettingType] = useState("Manual"); // New: type for manual setting
  const [manualProperties, setManualProperties] = useState<SettingProperty[]>([
    { name: "name", value: "", editable: true, encrypted: false },
    { name: "value", value: "", editable: true, encrypted: false },
  ]); // New: properties for manual setting
  const [isManualSettingOpen, setIsManualSettingOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false); // New state for dialog
  const [settingToDeleteId, setSettingToDeleteId] = useState<string | null>(null); // New state to store id of setting to delete

  const searchParams = useSearchParams();
  const router = useRouter();

  // Function to refresh settings
  const refreshSettings = async () => {
    startTransition(async () => {
      const response = await readClientSettings();
      if (response.success && response.data) {
        setSettings(response.data);
      } else {
        toast.error("Failed to load settings", {
          description: response.error || "Could not fetch client settings.",
        });
      }
    });
  };

  useEffect(() => {
    refreshSettings();

    // Handle URL parameters for success/error messages
    const success = searchParams.get("success");
    const error = searchParams.get("error");
    const details = searchParams.get("details");

    if (success === "fitbit_connected") {
      toast.success("Fitbit Account Connected!", {
        description: "Your Fitbit account has been successfully linked.",
      });
      // Clean up URL
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete("success");
      router.replace(newUrl.toString());
    } else if (error) {
      console.error("Client Settings Page Error:", error, details); // Add this line
      const errorMessage = errorMessages[error] || "An unknown error occurred.";
      toast.error("Connection Failed!", {
        description: details ? `${errorMessage} Details: ${details}` : errorMessage,
      });
      // Clean up URL
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete("error");
      newUrl.searchParams.delete("details");
      router.replace(newUrl.toString());
    }
  }, [searchParams, router]);

  const handleInitiateFitbit = async () => {
    const response = await initiateFitbitOAuth();
    if (response.success && response.authorizeUrl) {
      router.push(response.authorizeUrl);
    } else {
      toast.error("Fitbit Connection Failed", {
        description: response.error || "Could not initiate Fitbit OAuth process.",
      });
    }
  };

  const handleDeleteSetting = async (id: string) => {
    // if (!window.confirm("Are you sure you want to delete this setting?")) return;
    startTransition(async () => {
      const response = await deleteClientSetting(id);
      if (response.success) {
        toast.success("Setting Deleted", {
          description: response.message,
        });
        refreshSettings();
        setIsDeleteDialogOpen(false); // Close dialog on success
      } else {
        toast.error("Deletion Failed", {
          description: response.error || "Could not delete setting.",
        });
      }
    });
  };

  const handleCreateManualSetting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualSettingId || manualProperties.some(p => !p.name || !p.value)) {
      toast.error("Missing Information", { description: "Please fill in all required fields for the setting and its properties." });
      return;
    }
    startTransition(async () => {
      const response = await createManualClientSetting(
        manualSettingId,
        manualSettingType,
        manualProperties
      );
      if (response.success) {
        toast.success("Setting Created", {
          description: response.message,
        });
        setManualSettingId("");
        setManualSettingType("Manual");
        setManualProperties([
          { name: "name", value: "", editable: true, encrypted: false },
          { name: "value", value: "", editable: true, encrypted: false },
        ]); // Reset to default
        refreshSettings();
      } else {
        toast.error("Creation Failed", {
          description: response.error || "Could not create manual setting.",
        });
      }
    });
  };

  const handleAddProperty = () => {
    setManualProperties(prev => [...prev, { name: "", value: "", editable: true, encrypted: false }]);
  };

  const handleRemoveProperty = (index: number) => {
    setManualProperties(prev => prev.filter((_, i) => i !== index));
  };

  const handlePropertyChange = (index: number, field: keyof SettingProperty, value: string | boolean) => {
    setManualProperties(prev => prev.map((prop, i) => i === index ? { ...prop, [field]: value } : prop));
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Client Settings</h1>

      {/* Fitbit Connection Section */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-2xl">Fitbit Integration</CardTitle>
          <CardDescription>
            Connect your personal Fitbit account to integrate health and activity data.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleInitiateFitbit} disabled={isPending}>
            Connect Fitbit Account
          </Button>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog - Moved to wrap the table */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        {/* Display Connected Settings Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Your Current Settings</CardTitle>
            <CardDescription>
              Manage your connected integrations and custom settings.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isPending && settings.length === 0 ? (
              <p>Loading settings...</p>
            ) : settings.length === 0 ? (
              <p>No settings are currently connected.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table className="min-w-full">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">Type</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead className="text-right w-[80px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {settings.map((setting) => (
                      <TableRow key={setting.id}>
                        <TableCell className="font-medium whitespace-nowrap">{setting.type}</TableCell>
                        <TableCell>
                          <div className="flex flex-col space-y-1 text-sm">
                            {setting.properties.map((prop, propIndex) => {
                              let displayValue = prop.value;
                              if (prop.encrypted) {
                                displayValue = "********";
                              } else if (prop.name === "expiresAt") {
                                displayValue = new Date(prop.value).toLocaleString();
                              }
                              return (
                                <div key={propIndex} className="flex items-start">
                                  <span className="font-semibold mr-2 whitespace-nowrap">{prop.name}:</span>
                                  <span className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap">{displayValue}</span>
                                </div>
                              );
                            })}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="destructive"
                              size="icon"
                              onClick={() => {
                                setSettingToDeleteId(setting.id);
                                setIsDeleteDialogOpen(true);
                              }}
                              disabled={isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your setting.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (settingToDeleteId) {
                  handleDeleteSetting(settingToDeleteId);
                }
              }}
              disabled={isPending}
            >
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Manual Setting Creation Section */}
      <Collapsible open={isManualSettingOpen} onOpenChange={setIsManualSettingOpen} className="mb-8 mt-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4">
            <div className="flex-1">
              <CardTitle className="text-2xl">Create New Manual Setting</CardTitle>
              <CardDescription>
                Add custom key-value settings for your client profile. Sensitive values will be encrypted.
              </CardDescription>
            </div>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="icon">
                <ChevronsUpDown className="h-4 w-4" />
                <span className="sr-only">Toggle manual settings</span>
              </Button>
            </CollapsibleTrigger>
          </CardHeader>
          <CollapsibleContent className="pt-0">
            <CardContent className="p-4">
              <form onSubmit={handleCreateManualSetting} className="space-y-4">
                <div>
                  <Label htmlFor="settingId">Unique Identifier</Label>
                  <Input
                    id="settingId"
                    value={manualSettingId}
                    onChange={(e) => setManualSettingId(e.target.value)}
                    placeholder="e.g., aiAgentConfig, customApiCredential"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="settingType">Setting Type</Label>
                  <Input
                    id="settingType"
                    value={manualSettingType}
                    onChange={(e) => setManualSettingType(e.target.value)}
                    placeholder="e.g., Manual, API_Key"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Properties</Label>
                  {manualProperties.map((prop, index) => (
                    <div key={index} className="flex flex-col space-y-2 md:flex-row md:items-end md:space-x-2 md:space-y-0 border-b pb-4 mb-4 last:border-b-0 last:pb-0 last:mb-0">
                      <div className="flex-1">
                        <Label htmlFor={`prop-name-${index}`}>Name</Label>
                        <Input
                          id={`prop-name-${index}`}
                          value={prop.name}
                          onChange={(e) => handlePropertyChange(index, "name", e.target.value)}
                          placeholder="Property Name (e.g., token, model)"
                          required
                        />
                      </div>
                      <div className="flex-1">
                        <Label htmlFor={`prop-value-${index}`}>Value</Label>
                        <Input
                          id={`prop-value-${index}`}
                          value={prop.value}
                          onChange={(e) => handlePropertyChange(index, "value", e.target.value)}
                          placeholder="Property Value"
                          required
                          type={prop.encrypted ? "password" : "text"}
                        />
                      </div>
                      <div className="flex items-center space-x-2 pt-2 md:pt-0">
                        <Switch
                          id={`prop-editable-${index}`}
                          checked={prop.editable}
                          onCheckedChange={(checked) => handlePropertyChange(index, "editable", checked)}
                        />
                        <Label htmlFor={`prop-editable-${index}`}>Editable</Label>
                      </div>
                      <div className="flex items-center space-x-2 pt-2 md:pt-0">
                        <Switch
                          id={`prop-hidden-${index}`}
                          checked={prop.encrypted}
                          onCheckedChange={(checked) => handlePropertyChange(index, "encrypted", checked)}
                        />
                        <Label htmlFor={`prop-hidden-${index}`}>Encrypted</Label>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => handleRemoveProperty(index)}
                        className="mt-2 md:mt-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button type="button" variant="outline" onClick={handleAddProperty}>
                    Add Property
                  </Button>
                </div>
                <Button type="submit" disabled={isPending}>
                  Create Setting
                </Button>
              </form>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </div>
  );
};

export default ClientSettingsPage;
