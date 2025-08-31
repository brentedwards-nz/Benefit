"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Combobox } from "@/components/ui/combobox";
import { TransactionStatus, TransactionType } from "@prisma/client";
import { ClientTransaction } from "@/server-actions/admin/transactions/types";
import { ClientSearchResult } from "@/server-actions/admin/clients/actions";
import { useState, useEffect } from "react";
import { searchClients } from "@/server-actions/admin/clients/actions";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const transactionSchema = z.object({
  clientId: z.string().min(1, "Client is required"),
  description: z.string().min(1, "Description is required"),
  amount: z.number(),
  taxAmount: z.number(),
  total: z.number(),
  taxRate: z.number(),
  transactionType: z.nativeEnum(TransactionType),
  status: z.nativeEnum(TransactionStatus),
  programmeEnrolmentId: z.string().nullable().optional(),
  transactionDate: z.date(),
});

export type TransactionFormValues = z.infer<typeof transactionSchema>;

interface TransactionFormProps {
  transaction?: ClientTransaction;
  clients: ClientSearchResult[];
  onSubmit: (values: TransactionFormValues) => void;
  onCancel: () => void;
}

export function TransactionForm({
  transaction,
  clients,
  onSubmit,
  onCancel,
}: TransactionFormProps) {
  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: transaction
      ? {
          ...transaction,
          transactionDate: new Date(transaction.transactionDate),
          programmeEnrolmentId: transaction.programmeEnrolmentId || undefined,
        }
      : {
          clientId: "",
          description: "",
          amount: 0,
          taxAmount: 0,
          total: 0,
          taxRate: 0.125,
          transactionType: TransactionType.Invoice,
          status: TransactionStatus.Pending,
          programmeEnrolmentId: undefined,
          transactionDate: new Date(),
        },
  });

  const [clientSearchTerm, setClientSearchTerm] = useState("");
  const [searchedClients, setSearchedClients] =
    useState<ClientSearchResult[]>(clients);

  useEffect(() => {
    if (clientSearchTerm) {
      searchClients(clientSearchTerm).then(setSearchedClients);
    } else {
      setSearchedClients(clients);
    }
  }, [clientSearchTerm, clients]);

  const amount = form.watch("amount");
  const taxRate = form.watch("taxRate");

  useEffect(() => {
    const taxAmount = amount * taxRate;
    form.setValue("taxAmount", taxAmount);
    form.setValue("total", amount + taxAmount);
  }, [amount, taxRate, form]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="clientId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Client</FormLabel>
              <FormControl>
                <Combobox
                  options={searchedClients.map((client) => ({
                    value: client.id,
                    label: `${client.firstName} ${client.lastName} (${
                      client.email || "No email"
                    })`,
                  }))}
                  value={field.value}
                  onValueChange={field.onChange}
                  placeholder="Select a client"
                  searchPlaceholder="Search clients..."
                  noResultsText="No clients found."
                  onSearchChange={setClientSearchTerm}
                  modal={true}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex gap-4 md:flex-row">
          <div className="w-[50%]">
            <FormField
              control={form.control}
              name="transactionType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.values(TransactionType).map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="w-[50%]">
            <FormField
              control={form.control}
              name="transactionDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "dd-MMM-yyyy")
                          ) : (
                            "Pick a date"
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date > new Date() || date < new Date("1900-01-01")
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Transaction description"
                  className="resize-y" // Optional: allows vertical resizing by the user
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => {
              const [inputValue, setInputValue] = useState(
                typeof field.value === "number" ? field.value.toFixed(2) : ""
              );

              useEffect(() => {
                if (typeof field.value === "number") {
                  setInputValue(field.value.toFixed(2));
                }
              }, [field.value]);

              return (
                <FormItem>
                  <FormLabel>Amount (GST Excl.)</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
                        $
                      </span>
                      <Input
                        type="text"
                        placeholder="Amount"
                        className="pl-7"
                        value={inputValue}
                        onChange={(e) => {
                          setInputValue(e.target.value);
                          const numValue = parseFloat(e.target.value);
                          if (!isNaN(numValue)) {
                            field.onChange(numValue);
                          } else {
                            field.onChange(0);
                          }
                        }}
                        onBlur={(e) => {
                          const numValue = parseFloat(e.target.value);
                          if (!isNaN(numValue)) {
                            setInputValue(numValue.toFixed(2));
                          } else {
                            setInputValue("0.00");
                          }
                        }}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              );
            }}
          />
          <FormField
            control={form.control}
            name="taxRate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tax Rate</FormLabel>
                <FormControl>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
                      %
                    </span>
                    <Input
                      type="number"
                      step="0.0001"
                      placeholder="Tax Rate"
                      className="pl-7"
                      {...field}
                      onChange={(e) =>
                        field.onChange(parseFloat(e.target.value))
                      }
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="taxAmount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tax Amount</FormLabel>
                <FormControl>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
                      $
                    </span>
                    <Input
                      type="text"
                      placeholder="Tax Amount"
                      className="pl-7"
                      readOnly
                      {...field}
                      value={field.value.toFixed(2)}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="total"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Total</FormLabel>
                <FormControl>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
                      $
                    </span>
                    <Input
                      type="text"
                      placeholder="Total"
                      className="pl-7"
                      readOnly
                      {...field}
                      value={field.value.toFixed(2)}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="w-full">
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.values(TransactionStatus).map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="flex flex-col gap-4 md:flex-row">
          <Button
            className="flex-1"
            type="button"
            variant="outline"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button className="flex-1" type="submit">
            {transaction ? "Update" : "Create"} Transaction
          </Button>
        </div>
      </form>
    </Form>
  );
}
