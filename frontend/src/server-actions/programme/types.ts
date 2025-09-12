import { Prisma } from "@prisma/client";

// Types for the sessionsDescription JSON structure
export type SessionSchedule = {
  dayOfWeek: string;
  time: string;
  duration: number; // in minutes
  location: string;
};

export type SessionsDescription = {
  totalWeeks: number;
  sessionsPerWeek: number;
  schedule: SessionSchedule[];
  additionalInfo?: string;
};

export type Programme = {
  id: string;
  humanReadableId: string;
  name: string;
  startDate: Date;
  endDate?: Date | null;
  maxClients: number;
  sessionsDescription?: SessionsDescription | null;
  programmeCost: number; // Changed from Prisma.Decimal to number for client-side compatibility
  notes?: string | null;
  adhocData?: Prisma.JsonValue | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
};

export type ProgrammeCreateInput = Omit<
  Programme,
  "id" | "createdAt" | "updatedAt"
>;

export type ProgrammeUpdateInput = Partial<
  Omit<Programme, "id" | "createdAt" | "updatedAt">
>;

export type ProgrammeWithEnrolments = Programme & {
  enrolments?: ProgrammeEnrolment[];
};

export type ProgrammeEnrolment = {
  id: string;
  programId: string;
  clientId: string;
  notes?: string | null;
  adhocData?: Prisma.JsonValue | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
};