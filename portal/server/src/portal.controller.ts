import { Controller, Get, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GuestbookEntry, VisitorStats } from './entities';

// Quiz questions are static data — no need to persist
const QUIZ_QUESTIONS = [
  {
    question: 'AI là viết tắt của?',
    options: ['Artificial Intelligence', 'Automated Interface', 'Advanced Integration', 'Artificial Interface'],
    correctAnswer: 0,
  },
  {
    question: 'Machine Learning là gì?',
    options: ['Máy học từ dữ liệu', 'Máy tính chạy nhanh', 'Hệ thống tự động', 'Mạng máy tính'],
    correctAnswer: 0,
  },
  {
    question: 'Neural Network mô phỏng hoạt động của?',
    options: ['Não bộ con người', 'Máy tính', 'Điện thoại', 'Internet'],
    correctAnswer: 0,
  },
  {
    question: 'GPT trong GPT-4 có nghĩa là?',
    options: [
      'General Purpose Transformer',
      'Generative Pre-trained Transformer',
      'Global Processing Technology',
      'Graph Processing Tool',
    ],
    correctAnswer: 1,
  },
  {
    question: 'Claude Code được phát triển bởi?',
    options: ['OpenAI', 'Google', 'Anthropic', 'Microsoft'],
    correctAnswer: 2,
  },
  {
    question: 'AI Agent có khả năng?',
    options: [
      'Chỉ trả lời câu hỏi',
      'Tự động hành động để đạt mục tiêu',
      'Thay thế hoàn toàn con người',
      'Hack hệ thống khác',
    ],
    correctAnswer: 1,
  },
  {
    question: 'Deep Learning khác Machine Learning ở điểm?',
    options: ['Không cần dữ liệu', 'Sử dụng mạng nơ-ron nhiều lớp', 'Chạy trên điện thoại', 'Không cần máy tính'],
    correctAnswer: 1,
  },
  {
    question: 'Token trong AI là gì?',
    options: ['Một loại tiền điện tử', 'Đơn vị nhỏ nhất của văn bản', 'Một file code', 'Một hình ảnh'],
    correctAnswer: 1,
  },
];

// Online sessions stay in-memory — real-time only, no need to persist
const onlineSessions: Record<string, number> = {};

@Controller('api')
export class PortalController {
  constructor(
    @InjectRepository(GuestbookEntry)
    private guestbookRepo: Repository<GuestbookEntry>,
    @InjectRepository(VisitorStats)
    private statsRepo: Repository<VisitorStats>,
  ) {}

  // Ensure a single stats row exists
  private async getStats(): Promise<VisitorStats> {
    let stats = await this.statsRepo.findOne({ where: { id: 1 } });
    if (!stats) {
      stats = this.statsRepo.create({ id: 1, pageViews: 0, uniqueVisitors: 0, onlineSessions: {} });
      await this.statsRepo.save(stats);
    }
    return stats;
  }

  // ==================== VISITOR COUNTER ====================
  @Get('stats/visitors')
  async getVisitorStats() {
    const stats = await this.getStats();
    const onlineUsers = this.countOnlineUsers();
    return {
      pageViews: Number(stats.pageViews),
      uniqueVisitors: Number(stats.uniqueVisitors),
      onlineUsers,
    };
  }

  @Post('stats/heartbeat')
  @HttpCode(HttpStatus.OK)
  async heartbeat(@Body() body: { sessionId: string }) {
    const { sessionId } = body;
    const isNew = !onlineSessions[sessionId];

    onlineSessions[sessionId] = Date.now();

    const stats = await this.getStats();
    stats.pageViews = Number(stats.pageViews) + 1;
    if (isNew) stats.uniqueVisitors = Number(stats.uniqueVisitors) + 1;
    await this.statsRepo.save(stats);

    return { success: true };
  }

  @Post('stats/visit')
  @HttpCode(HttpStatus.OK)
  async trackVisit(@Body() body: { sessionId: string; page: string }) {
    const stats = await this.getStats();
    stats.pageViews = Number(stats.pageViews) + 1;
    await this.statsRepo.save(stats);
    return { success: true };
  }

  // ==================== LIVE STATS ====================
  @Get('stats/live')
  async getLiveStats() {
    const stats = await this.getStats();
    const onlineUsers = this.countOnlineUsers();
    return {
      pageViews: Number(stats.pageViews),
      uniqueVisitors: Number(stats.uniqueVisitors),
      onlineUsers,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  }

  private countOnlineUsers(): number {
    const now = Date.now();
    // Clean up stale sessions (inactive > 30s)
    for (const id of Object.keys(onlineSessions)) {
      if (now - onlineSessions[id] > 30000) delete onlineSessions[id];
    }
    return Object.keys(onlineSessions).length;
  }

  // ==================== AI QUIZ ====================
  @Get('quiz/questions')
  getQuizQuestions() {
    const shuffled = [...QUIZ_QUESTIONS].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 5).map((q, index) => ({
      id: index + 1,
      question: q.question,
      options: q.options,
    }));
  }

  @Post('quiz/submit')
  @HttpCode(HttpStatus.OK)
  submitQuiz(@Body() body: { answers: number[] }) {
    const shuffled = [...QUIZ_QUESTIONS].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, 5);

    const correct = body.answers.filter((ans, i) => ans === selected[i].correctAnswer).length;
    const percentage = Math.round((correct / selected.length) * 100);

    let message = 'Hãy khám phá thêm về AI nhé! 🚀';
    if (percentage >= 80) message = 'Xuất sắc! Bạn là chuyên gia AI! 🏆';
    else if (percentage >= 60) message = 'Tốt lắm! Kiến thức AI của bạn rất vững! 👍';
    else if (percentage >= 40) message = 'Không tồi! Hãy tìm hiểu thêm về AI nhé! 💪';

    return { score: correct, total: selected.length, percentage, message };
  }

  // ==================== GUESTBOOK ====================
  @Get('guestbook')
  async getGuestbook() {
    return this.guestbookRepo.find({
      order: { createdAt: 'DESC' },
      take: 100,
    });
  }

  @Post('guestbook')
  @HttpCode(HttpStatus.OK)
  async addGuestbookEntry(@Body() body: { name: string; message: string }) {
    const entry = this.guestbookRepo.create({ name: body.name, message: body.message });
    await this.guestbookRepo.save(entry);
    return { success: true, entry };
  }

  // ==================== AI CHAT ====================
  @Post('chat')
  @HttpCode(HttpStatus.OK)
  aiChat(@Body() body: { message: string; history: Array<{ role: string; content: string }> }) {
    const msg = body.message.toLowerCase();
    let response = 'Câu hỏi thú vị! Bạn có thể hỏi tôi về:\n• AI là gì?\n• Agent là gì?\n• Claude Code\n• Machine Learning\n• Ứng dụng của AI\n\nHãy thử nhé! 🤖';

    if (msg.includes('xin chào') || msg.includes('hello') || msg.includes('hi'))
      response = 'Xin chào! Tôi là AI Assistant. Bạn muốn tìm hiểu về AI, Agent hay Claude Code? Hãy hỏi tôi nhé! 🤖';
    else if (msg.includes('ai là gì') || msg.includes('ai là'))
      response = 'AI (Trí tuệ nhân tạo) là công nghệ mô phỏng khả năng tư duy của con người. AI có thể học, suy nghĩ và đưa ra quyết định! 🧠';
    else if (msg.includes('agent là gì') || msg.includes('ai agent'))
      response = 'AI Agent là hệ thống tự chủ có thể lập kế hoạch, thực thi và học hỏi. Khác với chatbot thông thường, agent có thể HÀNH ĐỘNG thay vì chỉ trả lời! 🤖';
    else if (msg.includes('claude') || msg.includes('code'))
      response = 'Claude Code là AI coding assistant từ Anthropic. Nó có thể hiểu code, viết code, refactor, debug và thậm chí chạy commands! 💻';
    else if (msg.includes('machine learning') || msg.includes('ml'))
      response = 'Machine Learning (Học máy) là thuật toán cho phép máy tính học từ dữ liệu mà không cần lập trình rõ ràng. Đây là nền tảng của AI hiện đại! 📊';
    else if (msg.includes('deep learning'))
      response = 'Deep Learning (Học sâu) sử dụng mạng nơ-ron nhiều lớp để học các patterns phức tạp. Nó chịu trách nhiệm cho các breakthrough gần đây trong AI! 🧠';
    else if (msg.includes('tương lai') || msg.includes('future'))
      response = 'Tương lai của AI rất hứa hẹn! AI sẽ ngày càng thông minh hơn và trở thành công cụ hỗ trợ đắc lực cho con người trong mọi lĩnh vực! 🚀';
    else if (msg.includes('ứng dụng') || msg.includes('dùng'))
      response = 'AI được ứng dụng trong nhiều lĩnh vực: Y tế, Tài chính, Giáo dục, Tự động hóa, và còn nhiều hơn nữa! 🎯';

    return { response, timestamp: new Date().toISOString() };
  }
}
