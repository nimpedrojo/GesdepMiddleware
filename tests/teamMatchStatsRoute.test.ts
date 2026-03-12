import { describe, expect, it } from 'vitest';
import { buildServer } from '../src/api/server.js';

describe('team match stats route', () => {
  it('returns team match stats for authenticated users', async () => {
    const app = buildServer({
      teamMatchStatsRoute: {
        readService: {
          async get(teamId: string, competition: string, result: string) {
            return {
              item: {
                teamId,
                teamName: 'JUVENIL PREFERENTE',
                filters: { competition, result },
                stats: {
                  total: { PJ: 1, GA: 1, EM: 0, PE: 0, GF: 2, GC: 1, PTS: 3 },
                  local: { PJ: 1, GA: 1, EM: 0, PE: 0, GF: 2, GC: 1, PTS: 3 },
                  visitante: { PJ: 0, GA: 0, EM: 0, PE: 0, GF: 0, GC: 0, PTS: 0 }
                }
              },
              meta: { source: 'mysql' as const }
            };
          }
        } as any
      }
    });

    const authResponse = await app.inject({
      method: 'POST',
      url: '/auth/token',
      payload: { username: 'admin', password: 'admin' }
    });
    const { accessToken } = authResponse.json();

    const response = await app.inject({
      method: 'GET',
      url: '/teams/636/matches/stats?competition=league&result=won',
      headers: { authorization: `Bearer ${accessToken}` }
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      item: { teamId: '636', filters: { competition: 'league', result: 'won' } },
      meta: { source: 'mysql' }
    });
  });
});
