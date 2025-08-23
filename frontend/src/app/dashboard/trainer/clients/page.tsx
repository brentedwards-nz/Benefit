"use client";

import { useState, useEffect, useTransition } from "react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Combobox } from "@/components/ui/combobox";

import { fetchClientsForTrainer, ClientForTrainer } from "@/server-actions/trainer/clients/actions";

// Placeholder for client data type - to be defined in a server action
interface Client extends ClientForTrainer {} // Extend from the new interface

// Placeholder for server actions to fetch clients
// async function fetchClients(query?: string): Promise<Client[]> {
//   // Simulate API call
//   return new Promise((resolve) => {
//     setTimeout(() => {
//       const allClients: Client[] = [
//         {
//           id: "1",
//           name: "Alice Smith",
//           email: "alice@example.com",
//           phone: "123-456-7890",
//           dateOfBirth: "1990-05-15",
//           avatarUrl: "https://github.com/shadcn.png",
//         },
//         {
//           id: "2",
//           name: "Bob Johnson",
//           email: "bob@example.com",
//           phone: "098-765-4321",
//           dateOfBirth: "1988-11-22",
//           avatarUrl: "https://avatars.githubusercontent.com/u/124599?s=400&v=4",
//         },
//         {
//           id: "3",
//           name: "Charlie Brown",
//           email: "charlie@example.com",
//           phone: "555-123-4567",
//           dateOfBirth: "1995-01-01",
//         },
//       ];
//       if (query) {
//         resolve(
//           allClients.filter(
//             (client) =>
//               client.name.toLowerCase().includes(query.toLowerCase()) ||
//               client.email.toLowerCase().includes(query.toLowerCase())
//           )
//         );
//       } else {
//         resolve(allClients);
//       }
//     }, 500);
//   });
// }

const TrainerClientsPage = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    startTransition(async () => {
      try {
        const fetchedClients = await fetchClientsForTrainer(); // Use new server action
        setClients(fetchedClients);
      } catch (error) {
        console.error("Failed to fetch clients:", error);
        toast.error("Failed to load clients", { description: "Could not retrieve client list." });
      }
    });
  }, []);

  useEffect(() => {
    if (selectedClientId) {
      setSelectedClient(clients.find((c) => c.id === selectedClientId) || null);
    } else {
      setSelectedClient(null);
    }
  }, [selectedClientId, clients]);

  // Remove handleSearch function as it's no longer needed
  // const handleSearch = () => {
  //   startTransition(async () => {
  //     try {
  //       const fetchedClients = await fetchClientsForTrainer(searchTerm); // Use query parameter
  //       setClients(fetchedClients);
  //       // If no client is selected, default to the first one if available after search
  //       if (!selectedClientId && fetchedClients.length > 0) {
  //         setSelectedClientId(fetchedClients[0].id);
  //       } else if (fetchedClients.length === 0) {
  //         setSelectedClientId(null);
  //       }
  //     } catch (error) {
  //       console.error("Failed to search clients:", error);
  //       toast.error("Search Failed", { description: "Could not search for clients." });
  //     }
  //   });
  // };

  const calculateAge = (dateOfBirth: string | undefined) => {
    if (!dateOfBirth) return "N/A";
    const dob = new Date(dateOfBirth);
    const diff_ms = Date.now() - dob.getTime();
    const age_dt = new Date(diff_ms);
    return Math.abs(age_dt.getUTCFullYear() - 1970);
  };

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <h1 className="text-3xl font-bold mb-6">Client Management</h1>

      {/* Client Search Section */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-2xl">Find a Client</CardTitle>
          <CardDescription>
            Search for clients by name or email, or select from the list of current clients.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Label htmlFor="client-select">Select Client</Label>
            <Combobox
              options={clients.map(client => ({ value: client.id, label: `${client.name} (${client.email})` }))}
              value={selectedClientId || ""}
              onValueChange={setSelectedClientId}
              placeholder="Select a client..."
              searchPlaceholder="Search clients..."
              noResultsText="No clients found."
            />
          </div>
          {/* Remove Search by Name or Email section */}
        </CardContent>
      </Card>

      {/* Client Details Section */}
      {selectedClient && (
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Client Details</CardTitle>
            <CardDescription>View selected client's information.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col md:flex-row items-center gap-6">
            <Avatar className="h-24 w-24 md:h-32 md:w-32">
              <AvatarImage src={selectedClient.avatarUrl || "/placeholder-avatar.jpg"} alt={selectedClient.name} />
              <AvatarFallback>{selectedClient.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2 text-center md:text-left">
              <p className="text-xl font-semibold">{selectedClient.name}</p>
              <p className="text-gray-600">Email: {selectedClient.email}</p>
              {selectedClient.phone && <p className="text-gray-600">Phone: {selectedClient.phone}</p>}
              {selectedClient.dateOfBirth && (
                <p className="text-gray-600">
                  Date of Birth: {new Date(selectedClient.dateOfBirth).toLocaleDateString()} (Age:{" "}
                  {calculateAge(selectedClient.dateOfBirth)})
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TrainerClientsPage;
