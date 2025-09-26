"use client";

import { useQuery } from "@tanstack/react-query";
import { readTransactions } from "@/server-actions/admin/transactions/actions";
import { readAllClients } from "@/server-actions/admin/clients/actions";
import TransactionManager from "@/components/dashboard/admin/transactions/transaction-manager";
import { Loading } from "@/components/ui/loading";

export default function ClientTransactions() {
  const {
    data: transactionsResult,
    error: transactionsError,
    isLoading: isLoadingTransactions,
  } = useQuery({
    queryKey: ["transactions"],
    queryFn: () => readTransactions(),
  });

  const {
    data: clientsResult,
    error: clientsError,
    isLoading: isLoadingClients,
  } = useQuery({
    queryKey: ["clients"],
    queryFn: () => readAllClients(),
  });

  if (isLoadingTransactions || isLoadingClients) {
    return <Loading title="Loading..." />;
  }

  const transactions = transactionsResult?.success
    ? transactionsResult.data
    : [];
  const clients = clientsResult?.success ? clientsResult.data : [];

  return (
    <TransactionManager
      initialTransactions={transactions}
      transactionsError={
        transactionsError?.message ||
        (!transactionsResult?.success && transactionsResult?.message) ||
        null
      }
      initialClients={clients}
      clientError={
        clientsError?.message ||
        (!clientsResult?.success && clientsResult?.message) ||
        null
      }
    />
  );
}
