import { FastifyInstance } from 'fastify';
import { GesdepClient } from '../../gesdep/actions/gesdepClient.js';
import { GetTeamMatchStatsUseCase } from '../../application/getTeamMatchStatsUseCase.js';
import { TeamMatchStatsReadService } from '../../application/teamMatchStatsReadService.js';
import { MatchCompetition, MatchResultFilter, TeamMatchStatsResponse } from '../../domain/types.js';

export interface RegisterTeamMatchStatsRouteDeps {
  readService?: TeamMatchStatsReadService;
}

const competitionEnum = ['all', 'league', 'cup', 'friendly', 'tournament'] as const;
const resultEnum = ['all', 'won', 'drawn', 'lost'] as const;

export const registerTeamMatchStatsRoute = (app: FastifyInstance, deps: RegisterTeamMatchStatsRouteDeps = {}) => {
  const readService = deps.readService ?? new TeamMatchStatsReadService({
    onlineUseCase: new GetTeamMatchStatsUseCase({ navigator: new GesdepClient() })
  });

  app.get<{
    Params: { teamId: string };
    Querystring: { competition?: MatchCompetition; result?: MatchResultFilter };
    Reply: TeamMatchStatsResponse;
  }>('/teams/:teamId/matches/stats', {
    preHandler: async (request, reply) => app.authenticate(request, reply),
    schema: {
      tags: ['teams', 'stats'],
      summary: 'Estadisticas y partidos jugados por equipo',
      description:
        'Devuelve la tabla de estadisticas de partidos jugados de la temporada actual para un equipo. ' +
        'Lee desde MySQL si el batch diario ya materializo el snapshot de estadisticas por competicion y resultado; en otro caso hace consulta online a Gesdep.',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['teamId'],
        properties: {
          teamId: { type: 'string', description: 'Identificador del equipo en Gesdep' }
        }
      },
      querystring: {
        type: 'object',
        properties: {
          competition: { type: 'string', enum: competitionEnum, default: 'all' },
          result: { type: 'string', enum: resultEnum, default: 'all' }
        }
      },
      response: {
        200: {
          type: 'object',
          required: ['item', 'meta'],
          properties: {
            item: {
              type: 'object',
              required: ['teamId', 'teamName', 'filters', 'stats'],
              properties: {
                teamId: { type: 'string' },
                teamName: { type: ['string', 'null'] },
                filters: {
                  type: 'object',
                  required: ['competition', 'result'],
                  properties: {
                    competition: { type: 'string', enum: competitionEnum },
                    result: { type: 'string', enum: resultEnum }
                  }
                },
                stats: {
                  type: 'object',
                  required: ['total', 'local', 'visitante'],
                  properties: {
                    total: {
                      type: 'object',
                      properties: {
                        PJ: { type: 'integer', minimum: 0 },
                        GA: { type: 'integer', minimum: 0 },
                        EM: { type: 'integer', minimum: 0 },
                        PE: { type: 'integer', minimum: 0 },
                        GF: { type: 'integer', minimum: 0 },
                        GC: { type: 'integer', minimum: 0 },
                        PTS: { type: 'integer', minimum: 0 }
                      }
                    },
                    local: {
                      type: 'object',
                      properties: {
                        PJ: { type: 'integer', minimum: 0 },
                        GA: { type: 'integer', minimum: 0 },
                        EM: { type: 'integer', minimum: 0 },
                        PE: { type: 'integer', minimum: 0 },
                        GF: { type: 'integer', minimum: 0 },
                        GC: { type: 'integer', minimum: 0 },
                        PTS: { type: 'integer', minimum: 0 }
                      }
                    },
                    visitante: {
                      type: 'object',
                      properties: {
                        PJ: { type: 'integer', minimum: 0 },
                        GA: { type: 'integer', minimum: 0 },
                        EM: { type: 'integer', minimum: 0 },
                        PE: { type: 'integer', minimum: 0 },
                        GF: { type: 'integer', minimum: 0 },
                        GC: { type: 'integer', minimum: 0 },
                        PTS: { type: 'integer', minimum: 0 }
                      }
                    }
                  }
                }
              }
            },
            meta: {
              type: 'object',
              required: ['source'],
              properties: {
                source: { type: 'string', enum: ['gesdep', 'mysql'] }
              }
            }
          }
        },
        401: {
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        }
      }
    } as any
  }, async (request, reply) => {
    const { teamId } = request.params;
    const competition = request.query.competition ?? 'all';
    const result = request.query.result ?? 'all';
    const payload = await readService.get(teamId, competition, result);
    reply.send(payload);
  });
};
