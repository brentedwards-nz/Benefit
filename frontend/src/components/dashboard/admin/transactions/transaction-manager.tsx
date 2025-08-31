"use client";

import { useState, useEffect, useTransition } from "react";
import {
  createTransaction,
  deleteTransaction,
  updateTransaction,
} from "@/server-actions/admin/transactions/actions";
import { useRouter } from "next/navigation";
import { ClientTransaction } from "@/server-actions/admin/transactions/types";
import { TransactionStatus, TransactionType } from "@prisma/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Pencil, Trash2, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Combobox } from "@/components/ui/combobox";
import {
  searchClients,
  ClientSearchResult,
} from "@/server-actions/admin/clients/actions";
import { toast } from "sonner";
import { TransactionForm, TransactionFormValues } from "./transaction-form";

export default function TransactionManager({
  initialTransactions,
  transactionsError,
  initialClients,
  clientError,
}: {
  initialTransactions: ClientTransaction[];
  transactionsError: string | null;
  initialClients: ClientSearchResult[];
  clientError: string | null;
}) {
  const router = useRouter();

  const [transactions, setTransactions] =
    useState<ClientTransaction[]>(initialTransactions);
  const [transactionsErrorState, setTransactionsErrorState] = useState<
    string | null
  >(transactionsError);
  const [clients, setClients] = useState<ClientSearchResult[]>(initialClients);
  const [clientErrorState, setClientErrorState] = useState<string | null>(
    clientError
  );
  const [filters, setFilters] = useState<{
    clientId?: string;
    startDate?: Date;
    endDate?: Date;
    transactionType?: TransactionType;
    status?: TransactionStatus;
  }>({});
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<ClientTransaction | null>(null);
  const [isStartDatePopoverOpen, setIsStartDatePopoverOpen] = useState(false);
  const [isEndDatePopoverOpen, setIsEndDatePopoverOpen] = useState(false);
  const [clientSearchTerm, setClientSearchTerm] = useState("");
  const [searchedClients, setSearchedClients] = useState<ClientSearchResult[]>(
    initialClients
  );
  const [isSearching, startSearch] = useTransition();

  const handleEdit = (transaction: ClientTransaction) => {
    setEditingTransaction(transaction);
    setIsDialogOpen(true);
  };

  const handleUpdateTransaction = async (values: TransactionFormValues) => {
    if (!editingTransaction) return;

    const result = await updateTransaction({
      ...editingTransaction,
      ...values,
    });

    if (result.success && result.data) {
      toast.success("Transaction updated successfully!");
      setTransactions(
        transactions.map((tx) =>
          tx.id === result.data.id ? result.data : tx
        )
      );
      setIsDialogOpen(false);
      setEditingTransaction(null);
    } else if (!result.success) {
      toast.error(`Failed to update transaction: ${result.message}`);
    }
  };

  useEffect(() => {
    startSearch(async () => {
      if (clientSearchTerm) {
        const result = await searchClients(clientSearchTerm);
        setSearchedClients(result);
      } else {
        setSearchedClients(initialClients);
      }
    });
  }, [clientSearchTerm, initialClients]);

  const handleDelete = async (id: string) => {
    const result = await deleteTransaction(id);
    if (result.success) {
      toast.success("Transaction deleted successfully!");
      setTransactions(transactions.filter((tx) => tx.id !== id));
    } else {
      toast.error(`Failed to delete transaction: ${result.message}`);
    }
  };

  const handleCreateTransaction = async (values: TransactionFormValues) => {
    const result = await createTransaction({
      ...values,
      programmeEnrolmentId: values.programmeEnrolmentId || null,
    });
    if (result.success && result.data) {
      toast.success("Transaction created successfully!");
      setTransactions([result.data, ...transactions]);
      setIsDialogOpen(false);
    } else if (!result.success) {
      toast.error(`Failed to create transaction: ${result.message}`);
    }
  };

  const filteredTransactions = transactions.filter((tx) => {
    if (filters.clientId && tx.clientId !== filters.clientId) {
      return false;
    }
    if (filters.startDate && new Date(tx.transactionDate) < filters.startDate) {
      return false;
    }
    if (filters.endDate && new Date(tx.transactionDate) > filters.endDate) {
      return false;
    }
    if (
      filters.transactionType &&
      tx.transactionType !== filters.transactionType
    ) {
      return false;
    }
    if (filters.status && tx.status !== filters.status) {
      return false;
    }
    return true;
  });

  return (
    <div className="container mx-auto py-8">
      <div className="flex-1">
        <h1 className="text-3xl font-bold">Transactions</h1>
        {transactionsErrorState && (
          <p className="text-red-500">
            Error fetching transactions: {transactionsErrorState}
          </p>
        )}
        {clientErrorState && (
          <p className="text-red-500">
            Error fetching clients: {clientErrorState}
          </p>
        )}
      </div>

      {/* Client Filter & Start Date & End Date*/}
      <div className="flex flex-col gap-4">
        {/* Client Filter */}
        <div className="flex flex-col gap-4 md:flex-row">
          <div className="flex-1">
            <label className="text-sm font-medium">Client</label>
            <Combobox
              options={searchedClients.map((client) => ({
                value: client.id,
                label: `${client.firstName} ${client.lastName} (${
                  client.email || "No email"
                })`,
              }))}
              value={filters.clientId || ""}
              onValueChange={(value) =>
                setFilters({ ...filters, clientId: value })
              }
              placeholder="Filter by Client"
              searchPlaceholder="Search clients..."
              noResultsText="No clients found."
              onSearchChange={setClientSearchTerm}
            />
          </div>

          <div className="flex-1">
            <Label>Start Date</Label>
            <Popover
              open={isStartDatePopoverOpen}
              onOpenChange={setIsStartDatePopoverOpen}
            >
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !filters.startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.startDate ? (
                    format(filters.startDate, "dd-MMM-yyyy")
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[320px] p-0">
                <Calendar
                  mode="single"
                  selected={filters.startDate}
                  onSelect={(newDate) => {
                    setFilters({ ...filters, startDate: newDate || undefined });
                    setIsStartDatePopoverOpen(false);
                  }}
                  className="w-full"
                  weekStartsOn={1}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex-1">
            <Label>End Date</Label>
            <Popover
              open={isEndDatePopoverOpen}
              onOpenChange={setIsEndDatePopoverOpen}
            >
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !filters.endDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.endDate ? (
                    format(filters.endDate, "dd-MMM-yyyy")
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[320px] p-0">
                <Calendar
                  mode="single"
                  selected={filters.endDate}
                  onSelect={(newDate) => {
                    setFilters({ ...filters, endDate: newDate || undefined });
                    setIsEndDatePopoverOpen(false);
                  }}
                  className="w-full"
                  weekStartsOn={1}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Type and Status Filters*/}
        <div className="flex flex-col md:flex-row gap-4 w-full">
          <Select
            onValueChange={(value) =>
              setFilters({
                ...filters,
                transactionType: value as TransactionType,
              })
            }
          >
            <SelectTrigger className="w-full md:flex-1">
              <SelectValue placeholder="Filter by Type" />
            </SelectTrigger>
            <SelectContent>
              {Object.values(TransactionType).map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            onValueChange={(value) =>
              setFilters({ ...filters, status: value as TransactionStatus })
            }
          >
            <SelectTrigger className="w-full md:flex-1">
              <SelectValue placeholder="Filter by Status" />
            </SelectTrigger>
            <SelectContent>
              {Object.values(TransactionStatus).map((status) => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col md:flex-row gap-4 w-full">
          <Button className="w-full md:flex-1" onClick={() => setFilters({})}>
            Clear Filters
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={(isOpen) => {
            setIsDialogOpen(isOpen);
            if (!isOpen) {
              setEditingTransaction(null);
            }
          }}>
            <DialogTrigger asChild>
              <Button className="w-full md:flex-1">Add Transaction</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingTransaction ? "Edit Transaction" : "Add New Transaction"}</DialogTitle>
              </DialogHeader>
              <TransactionForm
                transaction={editingTransaction ?? undefined}
                clients={clients}
                onSubmit={editingTransaction ? handleUpdateTransaction : handleCreateTransaction}
                onCancel={() => {
                  setIsDialogOpen(false);
                  setEditingTransaction(null);
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredTransactions.map((tx) => (
            <TableRow key={tx.id}>
              <TableCell>
                {format(new Date(tx.transactionDate), "dd-MMM-yyyy")}
              </TableCell>
              <TableCell>
                {clients.find((c) => c.id === tx.clientId)?.firstName}{" "}
                {clients.find((c) => c.id === tx.clientId)?.lastName}
              </TableCell>
              <TableCell>{tx.description}</TableCell>
              <TableCell>{tx.amount.toString()}</TableCell>
              <TableCell>{tx.status}</TableCell>
              <TableCell>{tx.transactionType}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(tx)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently
                          delete the transaction.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(tx.id)}>
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}