import { readTransactions } from "@/server-actions/admin/transactions/actions";
import { readAllClients } from "@/server-actions/admin/clients/actions";
import TransactionManager from "@/components/dashboard/admin/transactions/transaction-manager";

export default async function TransactionsWrapper() {
  const [transactionsResult, clientsResult] = await Promise.all([
    readTransactions(),
    readAllClients(),
  ]);

  const transactions = transactionsResult.success
    ? transactionsResult.data
    : [];
  const transactionsError = transactionsResult.success
    ? null
    : transactionsResult.message;
  const clients = clientsResult.success ? clientsResult.data : [];
  const clientError = clientsResult.success ? null : clientsResult.message;

  return (
    <TransactionManager
      initialTransactions={transactions}
      transactionsError={transactionsError}
      initialClients={clients}
      clientError={clientError}
    />
  );
}