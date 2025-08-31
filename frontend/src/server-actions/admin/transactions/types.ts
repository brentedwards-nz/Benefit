import { TransactionStatus, TransactionType } from "@prisma/client";

export interface ClientTransaction {
  id: string;
  clientId: string;
  programmeEnrolmentId: string | null;
  transactionDate: Date;
  description: string;
  amount: number;
  taxAmount: number;
  total: number;
  taxRate: number;
  status: TransactionStatus;
  transactionType: TransactionType;
}