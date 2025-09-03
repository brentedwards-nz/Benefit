import { z } from 'zod';
import { SystemSettingType } from '@prisma/client';

export const SystemSettingSchema = z.object({
  id: z.string().cuid().optional(),
  key: z.string().min(3, 'Key must be at least 3 characters long.'),
  value: z.string().min(1, 'Value cannot be empty.'),
  type: z.nativeEnum(SystemSettingType),
  description: z.string().nullable().optional(),
});

export type SystemSetting = z.infer<typeof SystemSettingSchema>;
