import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ContactDto, NewsletterDto } from './dto/contact.dto';

@Controller('api')
export class ContactController {
  private contacts: ContactDto[] = [];
  private subscribers: string[] = [];

  @Post('contact')
  @HttpCode(HttpStatus.OK)
  async submitContact(@Body() dto: ContactDto) {
    this.contacts.push(dto);
    console.log('📬 New contact submission:', dto);

    return {
      success: true,
      message: 'Tin nhắn của bạn đã được gửi thành công!',
      data: {
        id: Date.now(),
        ...dto,
        createdAt: new Date().toISOString(),
      },
    };
  }

  @Post('newsletter')
  @HttpCode(HttpStatus.OK)
  async subscribeNewsletter(@Body() dto: NewsletterDto) {
    if (this.subscribers.includes(dto.email)) {
      return {
        success: false,
        message: 'Email này đã đăng ký nhận tin rồi!',
      };
    }

    this.subscribers.push(dto.email);
    console.log('📧 New newsletter subscriber:', dto.email);

    return {
      success: true,
      message: 'Đăng ký nhận tin thành công!',
      data: {
        email: dto.email,
        subscribedAt: new Date().toISOString(),
      },
    };
  }
}
