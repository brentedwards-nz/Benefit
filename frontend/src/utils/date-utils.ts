import { number } from "zod";

export interface BenefitDateRange {
  start: Date;
  end: Date;
  duration: number;
}

import { addDays } from "date-fns";

export function toBenefitDateRange(
  startDate: Date,
  endDate: Date
): BenefitDateRange {
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    throw new Error("Invalid date(s) provided");
  }

  if (startDate > endDate) {
    throw new Error("Start date must be before or equal to end date");
  }

  // Normalize start and end dates to midnight of their respective days
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);

  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);

  // Add one day to the end date to ensure the entire last day is included
  const finalEnd = addDays(end, 1);

  // Calculate the duration in days
  const duration = Math.ceil(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  return {
    start: startDate,
    end: endDate,
    duration: duration,
  };
}
