import fp from 'fastify-plugin';
import jwt from '@fastify/jwt';
import { FastifyReply, FastifyRequest } from 'fastify';
import { AuthError } from '../shared/errors.js';
import { config } from '../shared/config.js';

export const authPlugin = fp(async (app) => {
  await app.register(jwt, {
    secret: config.API_JWT_SECRET
  });

  app.decorate('authenticate', async (request: FastifyRequest, _reply: FastifyReply) => {
    try {
      await request.jwtVerify();
    } catch {
      throw new AuthError('Invalid or missing bearer token');
    }
  });
});
