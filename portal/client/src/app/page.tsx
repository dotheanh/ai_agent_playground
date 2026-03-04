'use client';

import { useState, useEffect } from 'react';

// Icons as SVG components
const IconRocket = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

const IconShield = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

const IconChart = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const IconCloud = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
  </svg>
);

const IconCheck = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const IconMenu = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

const IconClose = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

// Feature data
const features = [
  {
    icon: <IconRocket />,
    title: 'Tốc độ vượt trội',
    description: 'Hiệu suất cực nhanh với công nghệ tối ưu hiện đại, mang lại trải nghiệm mượt mà.'
  },
  {
    icon: <IconShield />,
    title: 'Bảo mật cao cấp',
    description: 'Mã hóa dữ liệu đầu cuối và bảo vệ toàn diện với các tiêu chuẩn bảo mật quốc tế.'
  },
  {
    icon: <IconChart />,
    title: 'Phân tích thông minh',
    description: 'Công cụ analytics mạnh mẽ giúp bạn hiểu rõ hành vi người dùng và tối ưu hóa.'
  },
  {
    icon: <IconCloud />,
    title: 'Cloud Native',
    description: 'Hạ tầng cloud đám mây linh hoạt, dễ dàng mở rộng theo nhu cầu phát triển.'
  }
];

export default function Home() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [formStatus, setFormStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterStatus, setNewsletterStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormStatus('loading');

    try {
      const res = await fetch('http://localhost:3001/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setFormStatus('success');
        setFormData({ name: '', email: '', message: '' });
      } else {
        setFormStatus('error');
      }
    } catch {
      setFormStatus('error');
    }
  };

  const handleNewsletter = async (e: React.FormEvent) => {
    e.preventDefault();
    setNewsletterStatus('loading');

    try {
      const res = await fetch('http://localhost:3001/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newsletterEmail }),
      });

      if (res.ok) {
        setNewsletterStatus('success');
        setNewsletterEmail('');
      } else {
        setNewsletterStatus('error');
      }
    } catch {
      setNewsletterStatus('error');
    }
  };

  return (
    <main className="min-h-screen gradient-mesh">
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'glass py-3' : 'py-5'}`}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <a href="#" className="text-2xl font-bold font-heading text-gradient">
            Portal
          </a>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-gray-700 hover:text-primary transition-colors font-medium">Tính năng</a>
            <a href="#about" className="text-gray-700 hover:text-primary transition-colors font-medium">Về chúng tôi</a>
            <a href="#contact" className="text-gray-700 hover:text-primary transition-colors font-medium">Liên hệ</a>
            <button className="btn-primary">Bắt đầu ngay</button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-gray-700"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <IconClose /> : <IconMenu />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden glass absolute top-full left-0 right-0 p-6 flex flex-col gap-4">
            <a href="#features" className="text-gray-700 hover:text-primary transition-colors font-medium" onClick={() => setMobileMenuOpen(false)}>Tính năng</a>
            <a href="#about" className="text-gray-700 hover:text-primary transition-colors font-medium" onClick={() => setMobileMenuOpen(false)}>Về chúng tôi</a>
            <a href="#contact" className="text-gray-700 hover:text-primary transition-colors font-medium" onClick={() => setMobileMenuOpen(false)}>Liên hệ</a>
            <button className="btn-primary w-full">Bắt đầu ngay</button>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="min-h-screen flex items-center justify-center pt-20 relative overflow-hidden">
        {/* Floating Elements */}
        <div className="absolute top-32 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-32 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-float-delayed" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-secondary/5 rounded-full blur-3xl animate-spin-slow" />

        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">
          {/* Hero Content */}
          <div className="text-center lg:text-left animate-slide-up">
            <div className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full mb-6">
              <span className="w-2 h-2 bg-accent rounded-full animate-pulse" />
              <span className="text-sm font-medium text-gray-600">Công nghệ của tương lai</span>
            </div>

            <h1 className="text-5xl lg:text-7xl font-bold font-heading leading-tight mb-6">
              Khám phá sức mạnh của{' '}
              <span className="text-gradient">Portal</span>
            </h1>

            <p className="text-xl text-gray-600 mb-8 max-w-xl mx-auto lg:mx-0">
              Nền tảng đột phá giúp doanh nghiệp chuyển đổi số hiệu quả. Nhanh hơn, an toàn hơn, thông minh hơn.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <button className="btn-primary flex items-center justify-center gap-2">
                <IconRocket />
                Dùng thử miễn phí
              </button>
              <button className="glass hover-lift px-8 py-4 rounded-xl font-semibold text-gray-700 transition-all cursor-pointer">
                Xem demo
              </button>
            </div>

            {/* Stats */}
            <div className="flex gap-8 justify-center lg:justify-start mt-12">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary font-heading">99.9%</div>
                <div className="text-gray-500">Uptime</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary font-heading">50K+</div>
                <div className="text-gray-500">Người dùng</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary font-heading">150+</div>
                <div className="text-gray-500">Quốc gia</div>
              </div>
            </div>
          </div>

          {/* Hero Visual */}
          <div className="relative animate-scale-in">
            <div className="glass rounded-3xl p-8 hover-lift cursor-pointer">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-3 h-3 bg-red-500 rounded-full" />
                <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                <div className="w-3 h-3 bg-green-500 rounded-full" />
              </div>
              <div className="space-y-4">
                <div className="h-4 bg-primary/20 rounded w-3/4" />
                <div className="h-4 bg-secondary/20 rounded w-1/2" />
                <div className="h-4 bg-accent/20 rounded w-2/3" />
                <div className="grid grid-cols-3 gap-3 mt-6">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="glass-dark h-24 rounded-xl flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full gradient-primary animate-pulse-glow" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Floating Cards */}
            <div className="absolute -top-4 -right-4 glass p-4 rounded-xl animate-float">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 gradient-accent rounded-full flex items-center justify-center">
                  <IconCheck />
                </div>
                <div>
                  <div className="font-semibold text-sm">Thành công!</div>
                  <div className="text-xs text-gray-500">Đăng ký mới</div>
                </div>
              </div>
            </div>

            <div className="absolute -bottom-4 -left-4 glass p-4 rounded-xl animate-float-delayed">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 gradient-primary rounded-full flex items-center justify-center text-white">
                  <IconChart />
                </div>
                <div>
                  <div className="font-semibold text-sm">+150%</div>
                  <div className="text-xs text-gray-500">Tăng trưởng</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-gray-400 rounded-full flex justify-center pt-2">
            <div className="w-1 h-3 bg-gray-400 rounded-full animate-pulse" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16 animate-slide-up">
            <div className="inline-block glass px-4 py-2 rounded-full mb-4">
              <span className="text-primary font-medium">Tính năng nổi bật</span>
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold font-heading mb-4">
              Tại sao chọn <span className="text-gradient">Portal?</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Chúng tôi cung cấp giải pháp toàn diện với những tính năng vượt trội
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="glass p-8 rounded-2xl hover-lift cursor-pointer animate-slide-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="w-14 h-14 gradient-primary rounded-xl flex items-center justify-center text-white mb-6">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold font-heading mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-24 relative">
        <div className="absolute inset-0 bg-primary/5" />
        <div className="max-w-7xl mx-auto px-6 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="animate-slide-in-left">
              <div className="relative">
                <div className="glass p-8 rounded-3xl">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="gradient-primary p-6 rounded-2xl text-white text-center">
                      <div className="text-4xl font-bold font-heading">10+</div>
                      <div className="text-sm opacity-80">Năm kinh nghiệm</div>
                    </div>
                    <div className="gradient-accent p-6 rounded-2xl text-white text-center">
                      <div className="text-4xl font-bold font-heading">200+</div>
                      <div className="text-sm opacity-80">Dự án</div>
                    </div>
                    <div className="glass-dark p-6 rounded-2xl text-center">
                      <div className="text-4xl font-bold text-primary font-heading">50+</div>
                      <div className="text-sm text-gray-400">Chuyên gia</div>
                    </div>
                    <div className="glass p-6 rounded-2xl text-center">
                      <div className="text-4xl font-bold text-accent font-heading">24/7</div>
                      <div className="text-sm text-gray-500">Hỗ trợ</div>
                    </div>
                  </div>
                </div>

                {/* Decorative elements */}
                <div className="absolute -top-6 -right-6 w-24 h-24 bg-accent/20 rounded-full blur-2xl" />
                <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-primary/20 rounded-full blur-2xl" />
              </div>
            </div>

            <div className="animate-slide-in-right">
              <h2 className="text-4xl lg:text-5xl font-bold font-heading mb-6">
                Đồng hành cùng{' '}
                <span className="text-gradient">thành công</span> của bạn
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                Portal được xây dựng với sứ mệnh giúp doanh nghiệp chuyển đổi số một cách hiệu quả nhất. Chúng tôi tự hào là đối tác công nghệ đáng tin cậy của hàng trăm doanh nghiệp hàng đầu.
              </p>

              <ul className="space-y-4">
                {[
                  'Giao diện trực quan, dễ sử dụng',
                  'Tích hợp đa nền tảng',
                  'Hỗ trợ kỹ thuật 24/7',
                  'Cập nhật liên tục với công nghệ mới'
                ].map((item, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <div className="w-6 h-6 gradient-primary rounded-full flex items-center justify-center text-white">
                      <IconCheck />
                    </div>
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 gradient-primary opacity-5" />
        <div className="max-w-4xl mx-auto px-6 relative">
          <div className="glass rounded-3xl p-12 lg:p-16 text-center animate-scale-in">
            <h2 className="text-4xl lg:text-5xl font-bold font-heading mb-6">
              Sẵn sàng để bắt đầu?
            </h2>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Hãy trở thành người đầu tiên trải nghiệm Portal. Đăng ký ngay hôm nay để nhận ưu đãi đặc biệt!
            </p>

            <form onSubmit={handleNewsletter} className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto">
              <input
                type="email"
                placeholder="Nhập email của bạn"
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                className="flex-1 px-6 py-4 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                required
              />
              <button
                type="submit"
                disabled={newsletterStatus === 'loading'}
                className="btn-accent disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {newsletterStatus === 'loading' ? 'Đang gửi...' : 'Đăng ký ngay'}
              </button>
            </form>

            {newsletterStatus === 'success' && (
              <p className="text-green-600 mt-4 font-medium">Đăng ký thành công! Cảm ơn bạn.</p>
            )}
            {newsletterStatus === 'error' && (
              <p className="text-red-600 mt-4 font-medium">Có lỗi xảy ra. Vui lòng thử lại.</p>
            )}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-24 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-block glass px-4 py-2 rounded-full mb-4">
              <span className="text-primary font-medium">Liên hệ</span>
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold font-heading mb-4">
              Kết nối với{' '}
              <span className="text-gradient">chúng tôi</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Bạn có câu hỏi hoặc cần hỗ trợ? Hãy liên hệ với chúng tôi ngay!
            </p>
          </div>

          <div className="max-w-2xl mx-auto">
            <form onSubmit={handleSubmit} className="glass p-8 lg:p-10 rounded-3xl">
              <div className="space-y-6">
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Họ và tên</label>
                  <input
                    type="text"
                    placeholder="Nhập họ và tên của bạn"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-6 py-4 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">Email</label>
                  <input
                    type="email"
                    placeholder="Nhập email của bạn"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-6 py-4 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">Tin nhắn</label>
                  <textarea
                    placeholder="Nhập tin nhắn của bạn"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    rows={5}
                    className="w-full px-6 py-4 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={formStatus === 'loading'}
                  className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {formStatus === 'loading' ? 'Đang gửi...' : 'Gửi tin nhắn'}
                </button>
              </div>

              {formStatus === 'success' && (
                <p className="text-green-600 mt-4 font-medium text-center">Tin nhắn đã được gửi thành công!</p>
              )}
              {formStatus === 'error' && (
                <p className="text-red-600 mt-4 font-medium text-center">Có lỗi xảy ra. Vui lòng thử lại.</p>
              )}
            </form>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 glass-dark">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <a href="#" className="text-2xl font-bold font-heading text-gradient mb-4 block">
                Portal
              </a>
              <p className="text-gray-400">
                Nền tảng công nghệ của tương lai giúp doanh nghiệp phát triển bền vững.
              </p>
            </div>

            <div>
              <h4 className="font-bold mb-4 text-white">Sản phẩm</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-primary transition-colors">Tính năng</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Bảng giá</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">API</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-4 text-white">Công ty</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-primary transition-colors">Về chúng tôi</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Tuyển dụng</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Liên hệ</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-4 text-white">Pháp lý</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-primary transition-colors">Điều khoản</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Bảo mật</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Chính sách</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-700 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Portal. Tất cả các quyền được bảo lưu.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
