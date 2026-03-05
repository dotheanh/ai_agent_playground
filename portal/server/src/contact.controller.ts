import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContactDto, NewsletterDto } from './dto/contact.dto';
import { ContactSubmission, NewsletterSubscriber } from './entities';

@Controller('api')
export class ContactController {
  constructor(
    @InjectRepository(ContactSubmission)
    private contactRepo: Repository<ContactSubmission>,
    @InjectRepository(NewsletterSubscriber)
    private subscriberRepo: Repository<NewsletterSubscriber>,
  ) {}

  @Post('contact')
  @HttpCode(HttpStatus.OK)
  async submitContact(@Body() dto: ContactDto) {
    const submission = this.contactRepo.create(dto);
    const saved = await this.contactRepo.save(submission);
    console.log('📬 New contact submission:', dto);

    return {
      success: true,
      message: 'Tin nhắn của bạn đã được gửi thành công!',
      data: saved,
    };
  }

  @Post('newsletter')
  @HttpCode(HttpStatus.OK)
  async subscribeNewsletter(@Body() dto: NewsletterDto) {
    const existing = await this.subscriberRepo.findOne({ where: { email: dto.email } });
    if (existing) {
      return { success: false, message: 'Email này đã đăng ký nhận tin rồi!' };
    }

    const subscriber = this.subscriberRepo.create({ email: dto.email });
    const saved = await this.subscriberRepo.save(subscriber);
    console.log('📧 New newsletter subscriber:', dto.email);

    return {
      success: true,
      message: 'Đăng ký nhận tin thành công!',
      data: saved,
    };
  }
}
