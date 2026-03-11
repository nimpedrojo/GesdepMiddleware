import { z } from 'zod';

export interface HealthStatus {
  status: 'ok';
  timestamp: string;
}

export const teamItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.string().nullable(),
  season: z.string().nullable(),
  status: z.string().nullable()
});

export const listTeamsResponseSchema = z.object({
  items: z.array(teamItemSchema),
  meta: z.object({
    source: z.literal('gesdep'),
    count: z.number().int().nonnegative()
  })
});

export type TeamItem = z.infer<typeof teamItemSchema>;
export type ListTeamsResponse = z.infer<typeof listTeamsResponseSchema>;
