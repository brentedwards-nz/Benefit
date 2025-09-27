"use server";

import prisma from "@/utils/prisma/client";
import { ActionResult } from "@/types/server-action-results";
import { ClientTransaction } from "./types";
import { getServerSession } from "next-auth/next";
import { startOfDay, endOfDay } from "date-fns";
import {
  UserRole,
  Prisma,
  TransactionStatus,
  TransactionType,
  $Enums,
} from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function readTransactions(
  clientId?: string,
  startDate?: Date,
  endDate?: Date,
  transactionType?: TransactionType,
  status?: TransactionStatus
): Promise<ActionResult<ClientTransaction[]>> {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.id) {
    return {
      success: false,
      message: "You must be logged in to perform this action.",
      code: "UNAUTHENTICATED",
    };
  }

  try {
    if (
      !session.user.roles ||
      (!session.user.roles.includes($Enums.UserRole.Admin) &&
        !session.user.roles.includes($Enums.UserRole.SystemAdmin))
    ) {
      return {
        success: false,
        message: "You are not authorized to view all transactions.",
        code: "UNAUTHORIZED",
      };
    }
  } catch (err: any) {
    console.error(err);

    return {
      success: false,
      message: `An unexpected server error occurred: ${
        err.message || "Unknown error"
      }`,
      code: "UNEXPECTED_SERVER_ERROR",
      details:
        process.env.NODE_ENV === "development"
          ? { stack: err.stack }
          : undefined,
    };
  }

  try {
    const where: any = {};
    if (clientId) {
      where.clientId = clientId;
    }
    if (transactionType) {
      where.transactionType = transactionType;
    }
    if (status) {
      where.status = status;
    }

    const dateFilter: any = {};
    if (startDate) {
      dateFilter.gte = startOfDay(startDate);
    }
    if (endDate) {
      dateFilter.lte = endOfDay(endDate);
    }
    if (Object.keys(dateFilter).length > 0) {
      where.transactionDate = dateFilter;
    }

    const transactions = await prisma.clientTransaction.findMany({
      where,
      orderBy: {
        transactionDate: "desc",
      },
    });

    return {
      success: true,
      data: transactions.map((tx) => ({
        ...tx,
        amount: tx.amount.toNumber(),
        taxAmount: tx.taxAmount.toNumber(),
        total: tx.total.toNumber(),
        taxRate: tx.taxRate.toNumber(),
        programmeEnrolmentId: tx.programmeEnrolmentId || null,
      })),
    };
  } catch (err: any) {
    console.error(err);

    return {
      success: false,
      message: `An unexpected server error occurred: ${
        err.message || "Unknown error"
      }`,
      code: "UNEXPECTED_SERVER_ERROR",
      details:
        process.env.NODE_ENV === "development"
          ? { stack: err.stack }
          : undefined,
    };
  }
}

export async function createTransaction(
  transaction: Omit<ClientTransaction, "id" | "transactionDate">
): Promise<ActionResult<ClientTransaction>> {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return {
      success: false,
      message: "You must be logged in to perform this action.",
      code: "UNAUTHENTICATED",
    };
  }

  const userRoles = session.user.roles as UserRole[] | undefined;
  if (
    !userRoles ||
    (!userRoles.includes(UserRole.Admin) &&
      !userRoles.includes(UserRole.SystemAdmin))
  ) {
    return {
      success: false,
      message: "Error ***: You are not authorized to create transactions.",
      code: "UNAUTHORIZED",
    };
  }

  try {
    const newTransaction = await prisma.clientTransaction.create({
      data: {
        ...transaction,
        amount: new Prisma.Decimal(transaction.amount),
        taxAmount: new Prisma.Decimal(transaction.taxAmount),
      },
    });

    return {
      success: true,
      data: {
        ...newTransaction,
        amount: newTransaction.amount.toNumber(),
        taxAmount: newTransaction.taxAmount.toNumber(),
        total: newTransaction.total.toNumber(),
        taxRate: newTransaction.taxRate.toNumber(),
      },
    };
  } catch (err: any) {
    console.error(err);

    return {
      success: false,
      message: `An unexpected server error occurred: ${
        err.message || "Unknown error"
      }`,
      code: "UNEXPECTED_SERVER_ERROR",
      details:
        process.env.NODE_ENV === "development"
          ? { stack: err.stack }
          : undefined,
    };
  }
}

export async function deleteTransaction(
  transactionId: string
): Promise<ActionResult<{ id: string }>> {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return {
      success: false,
      message: "You must be logged in to perform this action.",
      code: "UNAUTHENTICATED",
    };
  }

  const userRoles = session.user.roles as UserRole[] | undefined;
  if (
    !userRoles ||
    (!userRoles.includes(UserRole.Admin) &&
      !userRoles.includes(UserRole.SystemAdmin))
  ) {
    return {
      success: false,
      message: "You are not authorized to delete transactions.",
      code: "UNAUTHORIZED",
    };
  }

  try {
    await prisma.clientTransaction.delete({
      where: { id: transactionId },
    });

    return {
      success: true,
      data: { id: transactionId },
    };
  } catch (err: any) {
    console.error(err);

    return {
      success: false,
      message: `An unexpected server error occurred: ${
        err.message || "Unknown error"
      }`,
      code: "UNEXPECTED_SERVER_ERROR",
      details:
        process.env.NODE_ENV === "development"
          ? { stack: err.stack }
          : undefined,
    };
  }
}

export async function updateTransaction(
  transaction: ClientTransaction
): Promise<ActionResult<ClientTransaction>> {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return {
      success: false,
      message: "You must be logged in to perform this action.",
      code: "UNAUTHENTICATED",
    };
  }

  const userRoles = session.user.roles as UserRole[] | undefined;
  if (
    !userRoles ||
    (!userRoles.includes(UserRole.Admin) &&
      !userRoles.includes(UserRole.SystemAdmin))
  ) {
    return {
      success: false,
      message: "You are not authorized to update transactions.",
      code: "UNAUTHORIZED",
    };
  }

  try {
    const updatedTransaction = await prisma.clientTransaction.update({
      where: { id: transaction.id },
      data: {
        ...transaction,
        amount: new Prisma.Decimal(transaction.amount),
        taxAmount: new Prisma.Decimal(transaction.taxAmount),
      },
    });

    return {
      success: true,
      data: {
        ...updatedTransaction,
        amount: updatedTransaction.amount.toNumber(),
        taxAmount: updatedTransaction.taxAmount.toNumber(),
        total: updatedTransaction.total.toNumber(),
        taxRate: updatedTransaction.taxRate.toNumber(),
      },
    };
  } catch (err: any) {
    console.error(err);

    return {
      success: false,
      message: `An unexpected server error occurred: ${
        err.message || "Unknown error"
      }`,
      code: "UNEXPECTED_SERVER_ERROR",
      details:
        process.env.NODE_ENV === "development"
          ? { stack: err.stack }
          : undefined,
    };
  }
}

export async function importPayments(
  formData: FormData
): Promise<ActionResult<{ message: string }>> {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return {
      success: false,
      message: "You must be logged in to perform this action.",
      code: "UNAUTHENTICATED",
    };
  }

  const userRoles = session.user.roles as UserRole[] | undefined;
  if (
    !userRoles ||
    (!userRoles.includes(UserRole.Admin) &&
      !userRoles.includes(UserRole.SystemAdmin))
  ) {
    return {
      success: false,
      message: "You are not authorized to import payments.",
      code: "UNAUTHORIZED",
    };
  }

  try {
    // Dummy implementation that waits for 5 seconds
    await new Promise((resolve) => setTimeout(resolve, 5000));

    if (Math.random() > 0.5) {
      return {
        success: false,
        message: "The import failed due to a random error.",
        code: "RANDOM_ERROR",
      };
    }

    const file = formData.get("file") as File;
    console.log("Processing file:", file.name);

    revalidatePath("/dashboard/admin/transactions");

    return {
      success: true,
      data: { message: "Import completed successfully." },
    };
  } catch (err: any) {
    console.error(err);

    return {
      success: false,
      message: `An unexpected server error occurred: ${
        err.message || "Unknown error"
      }`,
      code: "UNEXPECTED_SERVER_ERROR",
      details:
        process.env.NODE_ENV === "development"
          ? { stack: err.stack }
          : undefined,
    };
  }
}