import { timingSafeEqual } from 'node:crypto';
import { FastifyInstance } from 'fastify';
import { config } from '../../shared/config.js';
import { AuthError } from '../../shared/errors.js';

interface AuthTokenBody {
  username: string;
  password: string;
}

interface AuthTokenReply {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: string;
}

const safeEquals = (left: string, right: string) => {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
};

export const registerAuthRoute = (app: FastifyInstance) => {
  app.post<{
    Body: AuthTokenBody;
    Reply: AuthTokenReply;
  }>('/auth/token', {
    schema: {
      tags: ['auth'],
      summary: 'Obtiene un token Bearer para consumir la API',
      description:
        'Valida las credenciales propias de la API y devuelve un JWT Bearer. ' +
        'Ese token debe enviarse en el header Authorization para consumir los endpoints protegidos.',
      body: {
        type: 'object',
        required: ['username', 'password'],
        properties: {
          username: { type: 'string', description: 'Usuario configurado en API_AUTH_USERNAME' },
          password: { type: 'string', description: 'Password configurado en API_AUTH_PASSWORD' }
        }
      },
      response: {
        200: {
          type: 'object',
          required: ['accessToken', 'tokenType', 'expiresIn'],
          properties: {
            accessToken: { type: 'string' },
            tokenType: { type: 'string', enum: ['Bearer'] },
            expiresIn: { type: 'string' }
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
    const { username, password } = request.body;

    if (!safeEquals(username, config.API_AUTH_USERNAME) || !safeEquals(password, config.API_AUTH_PASSWORD)) {
      throw new AuthError('Invalid API credentials');
    }

    const accessToken = await reply.jwtSign(
      {
        sub: username
      },
      {
        expiresIn: config.API_JWT_EXPIRES_IN
      }
    );

    reply.send({
      accessToken,
      tokenType: 'Bearer',
      expiresIn: config.API_JWT_EXPIRES_IN
    });
  });
};
