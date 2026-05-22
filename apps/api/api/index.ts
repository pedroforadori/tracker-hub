import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';
import helmet from 'helmet';
import { AppModule } from '../src/app.module';

const server = express();

// Raw body must be captured before any other middleware for Stripe webhook verification
server.use(
  express.json({
    verify: (req: any, _res: any, buf: Buffer) => {
      req.rawBody = buf;
    },
  }),
);
server.use(express.urlencoded({ extended: true }));

const app$ = NestFactory.create(AppModule, new ExpressAdapter(server), {
  bodyParser: false,
}).then(async (app) => {
  app.use(helmet());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.enableCors({
    origin: process.env.CORS_ORIGINS?.split(',') ?? [],
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  });
  await app.init();
});

export default async function handler(
  req: express.Request,
  res: express.Response,
) {
  await app$;
  server(req, res);
}
