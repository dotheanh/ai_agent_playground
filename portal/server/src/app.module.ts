import { Module } from '@nestjs/common';
import { ContactController } from './contact.controller';

@Module({
  imports: [],
  controllers: [ContactController],
  providers: [],
})
export class AppModule {}
