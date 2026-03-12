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
                summary: {
                  total: { played: 1, won: 1, drawn: 0, lost: 0, goalsFor: 2, goalsAgainst: 1, points: 3 },
                  home: { played: 1, won: 1, drawn: 0, lost: 0, goalsFor: 2, goalsAgainst: 1, points: 3 },
                  away: { played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0 }
                },
                chart: { won: 1, drawn: 0, lost: 0 },
                matches: []
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
