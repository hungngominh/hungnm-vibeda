import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { successResponse, failResponse } from '@vegabase/core';
import { Argon2idHasher } from '@vegabase/api';
import { prisma } from '../../infrastructure/prisma.js';

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

const hasher = new Argon2idHasher();

export const adminRoutes: FastifyPluginAsync = async (app) => {
  app.post('/api/admin/login', async (req, reply) => {
    const traceId = crypto.randomUUID();
    const { username, password } = loginSchema.parse(req.body);

    const user = await prisma.user.findFirst({ where: { username, isDeleted: false } });
    if (!user) {
      return reply.status(401).send(
        failResponse([{ code: 'UNAUTHORIZED', message: 'Invalid credentials' }], traceId),
      );
    }

    const valid = await hasher.verify(password, user.passwordHash);
    if (!valid) {
      return reply.status(401).send(
        failResponse([{ code: 'UNAUTHORIZED', message: 'Invalid credentials' }], traceId),
      );
    }

    const token = (req.server as any).jwt.sign(
      { sub: user.username, roles: ['admin'] },
      { expiresIn: '8h' },
    );

    return reply.send(successResponse({ token }, traceId));
  });
};
