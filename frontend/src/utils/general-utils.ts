// A helper function to get the correct color class
export const getDayColor = (completionRate: number): string => {
  if (completionRate >= 1.0) return "bg-green-500";
  if (completionRate >= 0.9) return "bg-green-400";
  if (completionRate >= 0.8) return "bg-lime-500";
  if (completionRate >= 0.7) return "bg-lime-400";
  if (completionRate >= 0.6) return "bg-yellow-400";
  if (completionRate >= 0.5) return "bg-amber-400";
  if (completionRate >= 0.4) return "bg-orange-400";
  if (completionRate >= 0.3) return "bg-orange-500";
  if (completionRate >= 0.2) return "bg-red-300";
  if (completionRate >= 0.1) return "bg-red-400";
  return "bg-red-500";
};

export const getDayColor_ = (completionRate: number): string => {
  if (completionRate >= 1.0) return "bg-green-500";
  if (completionRate >= 0.9) return "bg-green-400";
  if (completionRate >= 0.8) return "bg-blue-500";
  if (completionRate >= 0.7) return "bg-blue-400";
  if (completionRate >= 0.6) return "bg-yellow-400";
  if (completionRate >= 0.5) return "bg-yellow-500";
  if (completionRate >= 0.4) return "bg-orange-400";
  if (completionRate >= 0.3) return "bg-orange-500";
  if (completionRate >= 0.2) return "bg-red-300";
  if (completionRate >= 0.1) return "bg-red-400";
  return "bg-red-500";
};

export const getDayColor_old = (completionRate: number): string => {
  if (completionRate === 1) return "bg-green-500";
  if (completionRate === 0) return "bg-red-500";

  if (completionRate >= 0.8) return "bg-orange-400";
  if (completionRate >= 0.6) return "bg-orange-500";
  if (completionRate >= 0.4) return "bg-orange-600";
  return "bg-orange-700";
};
