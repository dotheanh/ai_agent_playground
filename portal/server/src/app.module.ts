import { Module } from '@nestjs/common';
import { ContactController } from './contact.controller';
import { PortalController } from './portal.controller';

@Module({
  imports: [],
  controllers: [ContactController, PortalController],
  providers: [],
})
export class AppModule {}
