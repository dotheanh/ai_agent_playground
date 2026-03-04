import { Controller, Get, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';

class QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
}

class QuizResult {
  score: number;
  total: number;
  percentage: number;
}

@Controller('api')
export class PortalController {
  // Visitor Counter
  private pageViews = 0;
  private uniqueVisitors = new Set<string>();
  private onlineUsers = 0;
  private lastHeartbeat: Record<string, number> = {};

  // Guestbook
  private guestbook: Array<{
    name: string;
    message: string;
    createdAt: string;
  }> = [];

  // AI Quiz
  private quizQuestions: QuizQuestion[] = [
    {
      question: 'AI là viết tắt của?',
      options: ['Artificial Intelligence', 'Automated Interface', 'Advanced Integration', 'Artificial Interface'],
      correctAnswer: 0,
    },
    {
      question: 'Machine Learning là gì?',
      options: [
        'Máy học từ dữ liệu',
        'Máy tính chạy nhanh',
        'Hệ thống tự động',
        'Mạng máy tính',
      ],
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
      options: [
        'Không cần dữ liệu',
        'Sử dụng mạng nơ-ron nhiều lớp',
        'Chạy trên điện thoại',
        'Không cần máy tính',
      ],
      correctAnswer: 1,
    },
    {
      question: 'Token trong AI là gì?',
      options: [
        'Một loại tiền điện tử',
        'Đơn vị nhỏ nhất của văn bản',
        'Một file code',
        'Một hình ảnh',
      ],
      correctAnswer: 1,
    },
  ];

  // ==================== VISITOR COUNTER ====================
  @Get('stats/visitors')
  getVisitorStats() {
    return {
      pageViews: this.pageViews,
      uniqueVisitors: this.uniqueVisitors.size,
      onlineUsers: this.onlineUsers,
    };
  }

  @Post('stats/heartbeat')
  @HttpCode(HttpStatus.OK)
  heartbeat(@Body() body: { sessionId: string }) {
    this.pageViews++;
    this.uniqueVisitors.add(body.sessionId);
    this.lastHeartbeat[body.sessionId] = Date.now();

    // Count online users (active in last 30 seconds)
    const now = Date.now();
    this.onlineUsers = Object.keys(this.lastHeartbeat).filter(
      id => now - this.lastHeartbeat[id] < 30000
    ).length;

    return { success: true };
  }

  @Post('stats/visit')
  @HttpCode(HttpStatus.OK)
  trackVisit(@Body() body: { sessionId: string; page: string }) {
    this.pageViews++;
    this.uniqueVisitors.add(body.sessionId);
    return { success: true };
  }

  // ==================== LIVE STATS ====================
  @Get('stats/live')
  getLiveStats() {
    const now = Date.now();

    // Clean up old heartbeats
    Object.keys(this.lastHeartbeat).forEach(id => {
      if (now - this.lastHeartbeat[id] > 30000) {
        delete this.lastHeartbeat[id];
      }
    });

    this.onlineUsers = Object.keys(this.lastHeartbeat).length;

    return {
      pageViews: this.pageViews,
      uniqueVisitors: this.uniqueVisitors.size,
      onlineUsers: this.onlineUsers,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  }

  // ==================== AI QUIZ ====================
  @Get('quiz/questions')
  getQuizQuestions() {
    // Shuffle and return 5 random questions
    const shuffled = [...this.quizQuestions].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, 5);

    return selected.map((q, index) => ({
      id: index + 1,
      question: q.question,
      options: q.options,
    }));
  }

  @Post('quiz/submit')
  @HttpCode(HttpStatus.OK)
  submitQuiz(@Body() body: { answers: number[] }) {
    const shuffled = [...this.quizQuestions].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, 5);

    let correct = 0;
    body.answers.forEach((answer, index) => {
      if (answer === selected[index].correctAnswer) {
        correct++;
      }
    });

    const percentage = Math.round((correct / selected.length) * 100);

    let message = '';
    if (percentage >= 80) message = 'Xuất sắc! Bạn là chuyên gia AI! 🏆';
    else if (percentage >= 60) message = 'Tốt lắm! Kiến thức AI của bạn rất vững! 👍';
    else if (percentage >= 40) message = 'Không tồi! Hãy tìm hiểu thêm về AI nhé! 💪';
    else message = 'Hãy khám phá thêm về AI nhé! 🚀';

    return {
      score: correct,
      total: selected.length,
      percentage,
      message,
    };
  }

  // ==================== GUESTBOOK ====================
  @Get('guestbook')
  getGuestbook() {
    return this.guestbook;
  }

  @Post('guestbook')
  @HttpCode(HttpStatus.OK)
  addGuestbookEntry(@Body() body: { name: string; message: string }) {
    const entry = {
      name: body.name,
      message: body.message,
      createdAt: new Date().toISOString(),
    };
    this.guestbook.unshift(entry); // Add to beginning

    // Keep only last 100 entries
    if (this.guestbook.length > 100) {
      this.guestbook = this.guestbook.slice(0, 100);
    }

    return { success: true, entry };
  }

  // ==================== AI CHAT ====================
  @Post('chat')
  @HttpCode(HttpStatus.OK)
  async aiChat(@Body() body: { message: string; history: Array<{ role: string; content: string }> }) {
    const userMessage = body.message.toLowerCase();

    // Simple AI responses (demo)
    let response = '';

    if (userMessage.includes('xin chào') || userMessage.includes('hello') || userMessage.includes('hi')) {
      response = 'Xin chào! Tôi là AI Assistant. Bạn muốn tìm hiểu về AI, Agent hay Claude Code? Hãy hỏi tôi nhé! 🤖';
    }
    else if (userMessage.includes('ai là gì') || userMessage.includes('ai là')) {
      response = 'AI (Trí tuệ nhân tạo) là công nghệ mô phỏng khả năng tư duy của con người. AI có thể học, suy nghĩ và đưa ra quyết định! 🧠';
    }
    else if (userMessage.includes('agent là gì') || userMessage.includes('ai agent')) {
      response = 'AI Agent là hệ thống tự chủ có thể lập kế hoạch, thực thi và học hỏi. Khác với chatbot thông thường, agent có thể HÀNH ĐỘNG thay vì chỉ trả lời! 🤖';
    }
    else if (userMessage.includes('claude') || userMessage.includes('code')) {
      response = 'Claude Code là AI coding assistant từ Anthropic. Nó có thể hiểu code, viết code, refactor, debug và thậm chí chạy commands! 💻';
    }
    else if (userMessage.includes('machine learning') || userMessage.includes('ml')) {
      response = 'Machine Learning (Học máy) là thuật toán cho phép máy tính học từ dữ liệu mà không cần lập trình rõ ràng. Đây là nền tảng của AI hiện đại! 📊';
    }
    else if (userMessage.includes('deep learning')) {
      response = 'Deep Learning (Học sâu) sử dụng mạng nơ-ron nhiều lớp để học các patterns phức tạp. Nó chịu trách nhiệm cho các breakthrough gần đây trong AI! 🧠';
    }
    else if (userMessage.includes('tương lai') || userMessage.includes('future')) {
      response = 'Tương lai của AI rất hứa hẹn! AI sẽ ngày càng thông minh hơn và trở thành công cụ hỗ trợ đắc lực cho con người trong mọi lĩnh vực! 🚀';
    }
    else if (userMessage.includes('ứng dụng') || userMessage.includes('dùng')) {
      response = 'AI được ứng dụng trong nhiều lĩnh vực: Y tế (chẩn đoán bệnh), Tài chính (dự đoán thị trường), Giáo dục (học tập cá nhân hóa), Tự động hóa (xe tự hành), và còn nhiều hơn nữa! 🎯';
    }
    else {
      response = 'Câu hỏi thú vị! Bạn có thể hỏi tôi về:\n• AI là gì?\n• Agent là gì?\n• Claude Code\n• Machine Learning\n• Ứng dụng của AI\n\nHãy thử nhé! 🤖';
    }

    return {
      response,
      timestamp: new Date().toISOString(),
    };
  }
}
