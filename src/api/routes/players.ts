import { FastifyInstance } from 'fastify';
import { GesdepClient } from '../../gesdep/actions/gesdepClient.js';
import { GetPlayerUseCase } from '../../application/getPlayerUseCase.js';
import { GetPlayerResponse } from '../../domain/types.js';
import { PlayerReadService } from '../../application/playerReadService.js';

export interface RegisterPlayersRouteDeps {
  readService?: PlayerReadService;
}

export const registerPlayersRoute = (app: FastifyInstance, deps: RegisterPlayersRouteDeps = {}) => {
  const readService = deps.readService ?? new PlayerReadService({
    onlineUseCase: new GetPlayerUseCase({ navigator: new GesdepClient() })
  });

  app.get<{
    Params: { id: string };
    Reply: GetPlayerResponse;
  }>('/players/:id', {
    preHandler: async (request, reply) => app.authenticate(request, reply),
    schema: {
      tags: ['players'],
      summary: 'Detalle de un jugador',
      description:
        'Devuelve la ficha detallada de un jugador por su identificador externo de Gesdep. ' +
        'Lee desde MySQL cuando existe snapshot local y hace fallback online a Gesdep cuando falta informacion.',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: {
            type: 'string',
            description: 'Identificador externo del jugador en Gesdep'
          }
        }
      },
      response: {
        200: {
          type: 'object',
          required: ['item', 'meta'],
          properties: {
            item: {
              type: 'object',
              required: ['id', 'shortName', 'fullName', 'fields'],
              properties: {
                id: { type: 'string' },
                shortName: { type: ['string', 'null'] },
                fullName: { type: ['string', 'null'] },
                fields: {
                  type: 'object',
                  additionalProperties: {
                    type: ['string', 'null']
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
          },
          401: {
            type: 'object',
            properties: {
              error: { type: 'string' }
            }
          }
        }
      }
    } as any
  }, async (request, reply) => {
    const payload = await readService.getById(request.params.id);
    reply.send(payload);
  });
};
