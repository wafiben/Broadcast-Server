import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import open from 'open';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT ?? 3000);
  const url = 'https://amritb.github.io/socketio-client-tool/';
  open(url);
}
bootstrap();
