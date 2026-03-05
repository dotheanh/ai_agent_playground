import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContactController } from './contact.controller';
import { PortalController } from './portal.controller';
import {
  GuestbookEntry,
  VisitorStats,
  ContactSubmission,
  NewsletterSubscriber,
} from './entities';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqljs',
      autoSave: true,
      location: 'portal.db',
      entities: [
        GuestbookEntry,
        VisitorStats,
        ContactSubmission,
        NewsletterSubscriber,
      ],
      synchronize: true,
    }),
    TypeOrmModule.forFeature([
      GuestbookEntry,
      VisitorStats,
      ContactSubmission,
      NewsletterSubscriber,
    ]),
  ],
  controllers: [ContactController, PortalController],
  providers: [],
})
export class AppModule {}
