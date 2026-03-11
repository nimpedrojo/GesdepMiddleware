import { describe, expect, it } from 'vitest';
import { buildServer } from '../src/api/server.js';

describe('auth routes', () => {
  it('returns a token with valid credentials', async () => {
    const app = buildServer();

    const response = await app.inject({
      method: 'POST',
      url: '/auth/token',
      payload: {
        username: 'admin',
        password: 'admin'
      }
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      tokenType: 'Bearer',
      expiresIn: '1d'
    });
    expect(response.json().accessToken).toEqual(expect.any(String));
  });

  it('rejects protected endpoints without token', async () => {
    const app = buildServer({
      teamsRoute: {
        readService: {
          async listBasic() {
            return {
              items: [],
              meta: {
                source: 'mysql' as const,
                count: 0
              }
            };
          },
          async listExtended() {
            return {
              items: [],
              meta: {
                source: 'mysql' as const,
                count: 0
              }
            };
          }
        } as any
      }
    });

    const response = await app.inject({
      method: 'GET',
      url: '/teams'
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toMatchObject({
      error: 'Invalid or missing bearer token'
    });
  });

  it('allows protected endpoints with token', async () => {
    const app = buildServer({
      teamsRoute: {
        readService: {
          async listBasic() {
            return {
              items: [
                {
                  id: 'TEAM-1',
                  name: 'Equipo 1',
                  category: null,
                  season: '2025-26',
                  status: 'active'
                }
              ],
              meta: {
                source: 'mysql' as const,
                count: 1
              }
            };
          },
          async listExtended() {
            return {
              items: [],
              meta: {
                source: 'mysql' as const,
                count: 0
              }
            };
          }
        } as any
      }
    });

    const authResponse = await app.inject({
      method: 'POST',
      url: '/auth/token',
      payload: {
        username: 'admin',
        password: 'admin'
      }
    });

    const { accessToken } = authResponse.json();

    const response = await app.inject({
      method: 'GET',
      url: '/teams',
      headers: {
        authorization: `Bearer ${accessToken}`
      }
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      items: [
        {
          id: 'TEAM-1'
        }
      ],
      meta: {
        source: 'mysql',
        count: 1
      }
    });
  });
});
