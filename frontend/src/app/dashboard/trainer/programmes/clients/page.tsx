"use client";

import { useState, useEffect, Suspense } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Search,
  UserPlus,
} from "lucide-react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { UserRole } from "@prisma/client";

interface ProgrammeEnrolment {
  id: string;
  programId: string;
  clientId: string;
  notes: string | null;
  adhocData: any;
  createdAt: string;
  updatedAt: string;
  client: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    contactInfo: any;
  };
  programme: {
    id: string;
    name: string;
    humanReadableId: string;
    maxClients: number;
  };
  transactions:
    | {
        total: number;
      }[]
    | null;
}

interface Client {
  id: string;
  firstName: string | null;
  lastName: string | null;
  contactInfo: any;
  roles: string[];
}

function ProgrammeClientsManagementContent() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const programmeId = searchParams.get("programmeId");
  const programmeName = searchParams.get("programmeName");

  const [enrolments, setEnrolments] = useState<ProgrammeEnrolment[]>([]);
  const [availableClients, setAvailableClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    clientId: "",
    notes: "",
    adhocData: {},
  });
  const [isAdding, setIsAdding] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [enrolmentToDelete, setEnrolmentToDelete] =
    useState<ProgrammeEnrolment | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch programme enrolments
      const enrolmentsResponse = await fetch(
        `/api/admin/programme-enrolments?programmeId=${programmeId}`
      );
      if (enrolmentsResponse.ok) {
        const enrolmentsData = await enrolmentsResponse.json();
        setEnrolments(enrolmentsData);
      }

      // Fetch available clients
      const clientsResponse = await fetch("/api/admin/clients");
      if (clientsResponse.ok) {
        const clientsData = await clientsResponse.json();
        setAvailableClients(clientsData);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (enrolment: ProgrammeEnrolment) => {
    setEditingId(enrolment.id);
    setFormData({
      clientId: enrolment.clientId,
      notes: enrolment.notes || "",
      adhocData: enrolment.adhocData || {},
    });
  };

  const handleSave = async () => {
    try {
      if (editingId) {
        // Update existing enrolment
        const response = await fetch(
          `/api/admin/programme-enrolments/${editingId}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              notes: formData.notes,
              adhocData: formData.adhocData,
            }),
          }
        );

        if (response.ok) {
          setEditingId(null);
          fetchData();
          toast.success("Enrolment updated successfully.");
        } else {
          toast.error("Failed to update enrolment.");
        }
      } else {
        // Create new enrolment
        const response = await fetch("/api/admin/programme-enrolments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...formData,
            programId: programmeId,
          }),
        });

        if (response.ok) {
          setIsAdding(false);
          resetForm();
          fetchData();
          toast.success("Client added to programme successfully.");
        } else {
          toast.error("Failed to add client to programme.");
        }
      }
    } catch (error) {
      console.error("Error saving programme enrolment:", error);
      toast.error("An unexpected error occurred.");
    }
  };

  const handleDelete = (enrolment: ProgrammeEnrolment) => {
    setEnrolmentToDelete(enrolment);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!enrolmentToDelete) return;

    try {
      const response = await fetch(
        `/api/admin/programme-enrolments/${enrolmentToDelete.id}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        fetchData();
        setEnrolmentToDelete(null);
        toast.success("Client removed from programme successfully.");
      } else {
        toast.error("Failed to remove client from programme.");
      }
    } catch (error) {
      console.error("Error deleting programme enrolment:", error);
      toast.error("An unexpected error occurred.");
    } finally {
      setShowDeleteDialog(false);
    }
  };

  const resetForm = () => {
    setFormData({
      clientId: "",
      notes: "",
      adhocData: {},
    });
    setSelectedClient(null);
    setSearchTerm("");
    setSearchResults([]);
  };

  const handleAddNew = () => {
    setIsAdding(true);
    setEditingId(null);
    resetForm();
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
    resetForm();
  };

  const handleSearch = async (searchTerm: string) => {
    setSearchTerm(searchTerm);
    if (searchTerm.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      const response = await fetch(
        `/api/admin/clients/search?q=${encodeURIComponent(searchTerm)}`
      );
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data);
      } else {
        console.error("Failed to search clients.");
      }
    } catch (error) {
      console.error("Error searching clients:", error);
    }
  };

  const handleClientSelect = (client: Client) => {
    setSelectedClient(client);
    setFormData((prev) => ({ ...prev, clientId: client.id }));
    setSearchResults([]);
    setSearchTerm("");
  };

  const getClientName = (clientId: string) => {
    const client = availableClients.find((c) => c.id === clientId);
    return client
      ? `${client.firstName || ""} ${client.lastName || ""}`.trim() ||
          "Unknown Client"
      : "Unknown Client";
  };

  const getClientContact = (clientId: string) => {
    const client = availableClients.find((c) => c.id === clientId);
    if (client?.contactInfo && Array.isArray(client.contactInfo)) {
      const primaryContact = client.contactInfo.find((c: any) => c.primary);
      return primaryContact?.value || "No contact info";
    }
    return "No contact info";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
          <p className="mt-4 text-lg">Loading programme clients...</p>
        </div>
      </div>
    );
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
              {programmeName
                ? `${programmeName}`
                : "Programme Client Management"}
            </h1>
          </div>
        </div>

        {/* Add New Client Enrolment */}
        {isAdding && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Add Client to Programme</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="search">Search for Client</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    placeholder="Search by name or email..."
                    className="pl-10"
                  />
                </div>

                {/* Search Results */}
                {searchResults.length > 0 && (
                  <div className="mt-2 max-h-40 overflow-y-auto border rounded-md">
                    {searchResults.map((client) => (
                      <div
                        key={client.id}
                        className={`p-2 cursor-pointer hover:bg-muted transition-colors ${
                          selectedClient?.id === client.id
                            ? "bg-primary/10 border-primary"
                            : ""
                        }`}
                        onClick={() => handleClientSelect(client)}
                      >
                        <div className="font-medium">
                          {client.firstName} {client.lastName}
                        </div>
                        {client.contactInfo &&
                          Array.isArray(client.contactInfo) && (
                            <div className="text-sm text-muted-foreground">
                              {client.contactInfo.find((c: any) => c.primary)
                                ?.value || "No contact info"}
                            </div>
                          )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {selectedClient && (
                <div className="p-3 bg-muted rounded-md">
                  <div className="flex items-center gap-2">
                    <UserPlus className="h-4 w-4" />
                    <span className="font-medium">Selected Client:</span>
                    <span>
                      {selectedClient.firstName} {selectedClient.lastName}
                    </span>
                  </div>
                </div>
              )}

              <div>
                <Label htmlFor="notes">Enrolment Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  placeholder="Optional notes about this enrolment..."
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleSave}
                  disabled={!selectedClient}
                  className="flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  Add Client
                </Button>
                <Button variant="outline" onClick={handleCancel}>
                  <X className="h-4 w-4" />
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Programme Enrolments List */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">
            {programmeName ? `Enrolled Clients` : "All Programme Enrolments"}
          </h2>
          {!isAdding && (
            <Button onClick={handleAddNew} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Client
            </Button>
          )}
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Invoice</TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {enrolments.map((enrolment) =>
              editingId === enrolment.id ? (
                <TableRow key={enrolment.id} className="bg-muted/50">
                  <TableCell className="font-medium">
                    {getClientName(enrolment.clientId)}
                  </TableCell>
                  <TableCell>{getClientContact(enrolment.clientId)}</TableCell>
                  <TableCell>
                    {enrolment.transactions && enrolment.transactions.length > 0
                      ? (() => {
                          const firstTransaction = enrolment.transactions.at(0);
                          if (firstTransaction) {
                            const totalAsString =
                              firstTransaction.total.toString();
                            const totalAsNumber = parseFloat(totalAsString);
                            return `${totalAsNumber.toFixed(2)}`;
                          }
                          return "Invalid Invoice";
                        })()
                      : "No Invoice"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Button
                        onClick={handleSave}
                        size="sm"
                        className="flex items-center gap-2"
                      >
                        <Save className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={handleCancel}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                <TableRow key={enrolment.id}>
                  <TableCell className="font-medium">
                    {getClientName(enrolment.clientId)}
                  </TableCell>
                  <TableCell>{getClientContact(enrolment.clientId)}</TableCell>
                  <TableCell>
                    {enrolment.transactions && enrolment.transactions.length > 0
                      ? (() => {
                          const firstTransaction = enrolment.transactions.at(0);
                          if (firstTransaction) {
                            const totalAsString =
                              firstTransaction.total.toString();
                            const totalAsNumber = parseFloat(totalAsString);
                            return `${totalAsNumber.toFixed(2)}`;
                          }
                          return "Invalid Invoice";
                        })()
                      : "No Invoice"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(enrolment)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(enrolment)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            )}
          </TableBody>
        </Table>

        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently remove the
                client from the programme.
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

        {enrolments.length === 0 && (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">
                No clients enrolled in this programme yet.
              </p>
              <Button onClick={handleAddNew} className="mt-2">
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Client
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </ProtectedRoute>
  );
}

export default function ProgrammeClientsManagementPage() {
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
      <ProgrammeClientsManagementContent />
    </Suspense>
  );
}
