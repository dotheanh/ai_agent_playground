'use client';

import { useState, useEffect, useRef } from 'react';

// Icons
const IconBrain = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
  </svg>
);

const IconRobot = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const IconCode = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
  </svg>
);

const IconSparkles = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
  </svg>
);

const IconCheck = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const IconArrowRight = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
  </svg>
);

const IconCloud = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
  </svg>
);

const IconDatabase = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
  </svg>
);

const IconShield = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

const IconLightning = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

const IconCpu = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
  </svg>
);

const IconPlay = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M8 5v14l11-7z" />
  </svg>
);

const IconStar = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);

const aiFeatures = [
  { icon: IconBrain, title: 'Neural Networks', desc: 'Mạng nơ-ron nhân tạo mô phỏng hoạt động của não bộ' },
  { icon: IconCloud, title: 'Cloud Computing', desc: 'Xử lý dữ liệu lớn trên hạ tầng đám mây' },
  { icon: IconDatabase, title: 'Big Data', desc: 'Phân tích hàng tỷ dữ liệu trong thời gian thực' },
  { icon: IconShield, title: 'Cyber Security', desc: 'Bảo mật và phát hiện xâm nhập tự động' },
];

const agentFeatures = [
  { title: 'Planning', desc: 'Tự động lập kế hoạch và chia nhỏ mục tiêu thành các bước khả thi' },
  { title: 'Execution', desc: 'Thực thi tác vụ một cách autonomous mà không cần giám sát liên tục' },
  { title: 'Learning', desc: 'Học hỏi từ kết quả và cải thiện hiệu suất theo thời gian' },
  { title: 'Collaboration', desc: 'Phối hợp với các agent khác và con người một cách hiệu quả' },
];

const claudeFeatures = [
  { title: 'Context Awareness', desc: 'Hiểu sâu kiến trúc project và ngữ cảnh code' },
  { title: 'Smart Autocomplete', desc: 'Gợi ý code thông minh dựa trên patterns và best practices' },
  { title: 'Refactoring', desc: 'Tự động refactor code để cải thiện performance và readability' },
  { title: 'Debugging', desc: 'Phát hiện và sửa lỗi nhanh chóng với AI-powered analysis' },
  { title: 'Terminal Integration', desc: 'Chạy commands trực tiếp mà không cần rời khỏi editor' },
  { title: 'Multi-file Edits', desc: 'Đồng thời edit nhiều files với changes tracking' },
];

// Animated background orbs component
const BackgroundOrbs = ({ scrollY }: { scrollY: number }) => (
  <>
    <div style={{
      position: 'fixed',
      width: 800,
      height: 800,
      borderRadius: '50%',
      filter: 'blur(150px)',
      opacity: 0.2,
      background: 'radial-gradient(circle, #3B82F6 0%, transparent 70%)',
      top: '5%',
      left: '10%',
      transform: `translateY(${scrollY * 0.3}px)`,
      transition: 'transform 0.1s ease-out',
      zIndex: 0,
    }} />
    <div style={{
      position: 'fixed',
      width: 600,
      height: 600,
      borderRadius: '50%',
      filter: 'blur(120px)',
      opacity: 0.15,
      background: 'radial-gradient(circle, #8B5CF6 0%, transparent 70%)',
      top: '30%',
      right: '10%',
      transform: `translateY(${-scrollY * 0.2}px)`,
      transition: 'transform 0.1s ease-out',
      zIndex: 0,
    }} />
    <div style={{
      position: 'fixed',
      width: 500,
      height: 500,
      borderRadius: '50%',
      filter: 'blur(100px)',
      opacity: 0.1,
      background: 'radial-gradient(circle, #06B6D4 0%, transparent 70%)',
      top: '60%',
      left: '30%',
      transform: `translateY(${-scrollY * 0.15}px)`,
      transition: 'transform 0.1s ease-out',
      zIndex: 0,
    }} />
    <div style={{
      position: 'fixed',
      width: 400,
      height: 400,
      borderRadius: '50%',
      filter: 'blur(80px)',
      opacity: 0.15,
      background: 'radial-gradient(circle, #F97316 0%, transparent 70%)',
      bottom: '10%',
      right: '20%',
      transform: `translateY(${scrollY * 0.1}px)`,
      transition: 'transform 0.1s ease-out',
      zIndex: 0,
    }} />
  </>
);

// Floating particles
const FloatingParticles = () => {
  const particles = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 10,
    duration: 15 + Math.random() * 15,
    size: 2 + Math.random() * 4,
  }));

  return (
    <>
      {particles.map((p) => (
        <div
          key={p.id}
          style={{
            position: 'fixed',
            left: `${p.left}%`,
            width: p.size,
            height: p.size,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.3)',
            animation: `floatParticle ${p.duration}s linear infinite`,
            animationDelay: `${p.delay}s`,
            zIndex: 1,
            pointerEvents: 'none',
          }}
        />
      ))}
      <style>{`
        @keyframes floatParticle {
          0% { transform: translateY(100vh) rotate(0deg); opacity: 0; }
          10% { opacity: 0.8; }
          90% { opacity: 0.8; }
          100% { transform: translateY(-100vh) rotate(720deg); opacity: 0; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0) translateX(0); }
          33% { transform: translateY(-30px) translateX(15px); }
          66% { transform: translateY(-20px) translateX(-15px); }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.2); opacity: 0.8; }
        }
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInScale {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </>
  );
};

// Scroll animation hook
const useScrollAnimation = (threshold: number = 0) => {
  const [visible, setVisible] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
      const element = document.getElementById('main-content');
      if (element) {
        const rect = element.getBoundingClientRect();
        setVisible(rect.top < window.innerHeight * 0.85);
      }
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return { visible, scrollY };
};

export default function Home() {
  const [scrollY, setScrollY] = useState(0);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(true);
    const handleScroll = () => setScrollY(window.scrollY);
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({
        x: (e.clientX / window.innerWidth - 0.5) * 2,
        y: (e.clientY / window.innerHeight - 0.5) * 2,
      });
    };
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <div id="main-content" style={{ width: '100%', maxWidth: '100%', margin: 0, padding: 0, background: '#0a0a0a', overflow: 'hidden' }}>
      {/* Animated Background */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0 }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, #020617, #0f172a, #581c87)' }} />
        <BackgroundOrbs scrollY={scrollY} />
        {/* Grid overlay */}
        <div style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.03,
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '80px 80px',
          transform: `perspective(1000px) rotateX(60deg) scale(2.5) translateY(${scrollY * 0.15}px)`,
        }} />
      </div>

      <FloatingParticles />

      {/* Navigation */}
      <nav style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        padding: '20px 0',
        background: scrollY > 100 ? 'rgba(0,0,0,0.9)' : 'transparent',
        backdropFilter: scrollY > 100 ? 'blur(20px)' : 'none',
        borderBottom: scrollY > 100 ? '1px solid rgba(255,255,255,0.05)' : 'none',
        transition: 'all 0.3s',
      }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: 'linear-gradient(to bottom right, #3B82F6, #8B5CF6, #06B6D4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              animation: 'pulse 3s ease-in-out infinite',
            }}>
              <IconSparkles className="text-white w-6 h-6" />
            </div>
            <span style={{ fontSize: 24, fontWeight: 700, color: 'white' }}>AI Universe</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 40 }}>
            {['AI', 'Agents', 'Claude Code', 'Future'].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase().replace(' ', '')}`}
                style={{
                  color: '#9ca3af',
                  textDecoration: 'none',
                  fontSize: 14,
                  fontWeight: 500,
                  transition: 'color 0.3s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'white'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#9ca3af'}
              >
                {item}
              </a>
            ))}
            <button style={{
              padding: '12px 24px',
              background: 'linear-gradient(to right, #3B82F6, #8B5CF6)',
              borderRadius: 12,
              color: 'white',
              fontWeight: 600,
              fontSize: 14,
              border: 'none',
              cursor: 'pointer',
              transition: 'transform 0.3s, box-shadow 0.3s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
              e.currentTarget.style.boxShadow = '0 10px 40px rgba(59, 130, 246, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = 'none';
            }}
            >
              Bắt đầu ngay
            </button>
          </div>
        </div>
      </nav>

      {/* SECTION 1: HERO */}
      <section style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        zIndex: 20,
        padding: '120px 32px 80px',
      }}>
        <div style={{
          maxWidth: 1200,
          width: '100%',
          textAlign: 'center',
          transform: `translateY(${scrollY * 0.1}px)`,
          transition: 'transform 0.1s ease-out',
        }}>
          {/* Hero glow */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: 1000,
            height: 1000,
            borderRadius: '50%',
            filter: 'blur(150px)',
            opacity: 0.3,
            background: 'linear-gradient(to right, rgba(59,130,246,0.3), rgba(139,92,246,0.3), rgba(6,182,212,0.3))',
            transform: 'translate(-50%, -50%)',
            animation: 'spin 30s linear infinite',
          }} />

          <div style={{
            position: 'relative',
            zIndex: 1,
            opacity: loaded ? 1 : 0,
            transform: loaded ? 'translateY(0)' : 'translateY(30px)',
            transition: 'all 1s ease-out',
          }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 12,
              padding: '12px 24px',
              borderRadius: 9999,
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              marginBottom: 48,
              animation: 'fadeInUp 1s ease-out 0.2s both',
            }}>
              <span style={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                background: '#4ade80',
                animation: 'pulse 2s ease-in-out infinite',
              }} />
              <span style={{ color: '#d1d5db', fontSize: 14 }}>The Future of Technology</span>
            </div>

            <h1 style={{
              fontSize: 'clamp(48px, 10vw, 96px)',
              fontWeight: 700,
              color: 'white',
              marginBottom: 32,
              lineHeight: 1.1,
              animation: 'fadeInUp 1s ease-out 0.4s both',
            }}>
              <span style={{
                background: 'linear-gradient(to right, #60a5fa, #a78bfa, #22d3ee)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundSize: '200% 200%',
                animation: 'gradientShift 5s ease infinite',
              }}>Artificial</span>
              <br />
              <span>Intelligence</span>
            </h1>

            <p style={{
              fontSize: 'clamp(18px, 3vw, 24px)',
              color: '#9ca3af',
              maxWidth: 800,
              margin: '0 auto 64px',
              lineHeight: 1.6,
              animation: 'fadeInUp 1s ease-out 0.6s both',
            }}>
              Khám phá sức mạnh vô tận của AI, Agent thông minh và công cụ lập trình tiên tiến nhất.
              <br />
              <span style={{ color: '#6b7280' }}>Tương lai đã ở đây - bạn sẵn sàng chưa?</span>
            </p>

            <div style={{
              display: 'flex',
              gap: 24,
              justifyContent: 'center',
              marginBottom: 80,
              flexWrap: 'wrap',
              animation: 'fadeInUp 1s ease-out 0.8s both',
            }}>
              <button style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                padding: '20px 40px',
                background: 'linear-gradient(to right, #3B82F6, #8B5CF6, #06B6D4)',
                borderRadius: 16,
                color: 'white',
                fontWeight: 700,
                fontSize: 18,
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 25px 50px -12px rgba(59, 130, 246, 0.25)',
                transition: 'all 0.3s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05) translateY(-5px)';
                e.currentTarget.style.boxShadow = '0 30px 60px -12px rgba(59, 130, 246, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1) translateY(0)';
                e.currentTarget.style.boxShadow = '0 25px 50px -12px rgba(59, 130, 246, 0.25)';
              }}
              >
                <IconBrain className="w-6 h-6" />
                Khám phá AI
                <IconArrowRight className="w-5 h-5" />
              </button>
              <button style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '20px 40px',
                borderRadius: 16,
                color: 'white',
                fontWeight: 700,
                fontSize: 18,
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.2)',
                cursor: 'pointer',
                transition: 'all 0.3s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.transform = 'scale(1)';
              }}
              >
                <IconPlay className="w-5 h-5" />
                Xem Demo
              </button>
            </div>

            {/* Stats with parallax */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 24,
              maxWidth: 800,
              margin: '0 auto',
              transform: `translateY(${scrollY * -0.05}px)`,
            }}>
              {[
                { value: '500M+', label: 'AI Users Worldwide' },
                { value: '$1.8T', label: 'Market Value 2024' },
                { value: '10B+', label: 'Daily API Calls' },
                { value: '99.9%', label: 'Accuracy Rate' },
              ].map((stat, i) => (
                <div
                  key={i}
                  style={{
                    padding: 24,
                    borderRadius: 16,
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    textAlign: 'center',
                    transition: 'all 0.3s',
                    animation: `fadeInUp 1s ease-out ${1 + i * 0.1}s both`,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                    e.currentTarget.style.transform = 'translateY(-10px)';
                    e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                  }}
                >
                  <div style={{ fontSize: 36, fontWeight: 700, color: 'white', marginBottom: 8 }}>{stat.value}</div>
                  <div style={{ color: '#6b7280', fontSize: 14 }}>{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div style={{
          position: 'absolute',
          bottom: 40,
          left: '50%',
          transform: 'translateX(-50%)',
          animation: 'bounce 2s ease-in-out infinite',
        }}>
          <div style={{
            width: 32,
            height: 56,
            border: '2px solid rgba(255,255,255,0.2)',
            borderRadius: 999,
            display: 'flex',
            justifyContent: 'center',
            paddingTop: 8,
          }}>
            <div style={{
              width: 4,
              height: 16,
              borderRadius: 999,
              background: 'rgba(255,255,255,0.4)',
              animation: 'pulse 2s ease-in-out infinite',
            }} />
          </div>
        </div>
      </section>

      {/* SECTION 2: WHAT IS AI */}
      <section id="ai" style={{
        padding: '160px 32px',
        position: 'relative',
        zIndex: 20,
        transform: `translateY(${scrollY * -0.1}px)`,
      }}>
        <div style={{
          maxWidth: 1280,
          margin: '0 auto',
          textAlign: 'center',
          transition: 'transform 0.1s ease-out',
        }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 12,
            padding: '12px 24px',
            borderRadius: 9999,
            background: 'rgba(59, 130, 246, 0.1)',
            border: '1px solid rgba(59, 130, 246, 0.2)',
            color: '#60a5fa',
            marginBottom: 32,
          }}>
            <span style={{ fontWeight: 700 }}>01</span>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#60a5fa' }} />
            <span>Foundation</span>
          </div>

          <h2 style={{
            fontSize: 'clamp(36px, 8vw, 72px)',
            fontWeight: 700,
            color: 'white',
            marginBottom: 32,
          }}>
            What is
            <br />
            <span style={{
              background: 'linear-gradient(to right, #60a5fa, #22d3ee)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>Artificial Intelligence?</span>
          </h2>

          <p style={{
            fontSize: 20,
            color: '#9ca3af',
            maxWidth: 800,
            margin: '0 auto 80px',
            lineHeight: 1.6,
          }}>
            Trí tuệ nhân tạo là công nghệ mô phỏng khả năng tư duy, học hỏi và ra quyết định của con người.
            Từ nhận dạng giọng nói đến xe tự hành, AI đang cách mạng hóa mọi ngành công nghiệp.
          </p>

          {/* Features with mouse tracking */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 32,
            textAlign: 'left',
            marginBottom: 80,
          }}>
            {aiFeatures.map((feature, i) => (
              <div
                key={i}
                style={{
                  padding: 32,
                  borderRadius: 24,
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  transition: 'all 0.4s ease',
                  cursor: 'pointer',
                  transform: `translate(${mousePos.x * 10}px, ${mousePos.y * 10}px)`,
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget;
                  el.style.background = 'rgba(255,255,255,0.1)';
                  el.style.borderColor = 'rgba(59, 130, 246, 0.3)';
                  el.style.transform = 'translateY(-10px) scale(1.02)';
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget;
                  el.style.background = 'rgba(255,255,255,0.05)';
                  el.style.borderColor = 'rgba(255,255,255,0.1)';
                  el.style.transform = 'translateY(0) scale(1)';
                }}
              >
                <div style={{
                  width: 64,
                  height: 64,
                  borderRadius: 16,
                  background: 'linear-gradient(to bottom right, rgba(59, 130, 246, 0.2), rgba(139, 92, 246, 0.2))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 24,
                  transition: 'transform 0.3s',
                }}>
                  <feature.icon className="text-blue-400 w-8 h-8" />
                </div>
                <h4 style={{ fontSize: 20, fontWeight: 700, color: 'white', marginBottom: 12 }}>{feature.title}</h4>
                <p style={{ color: '#9ca3af', lineHeight: 1.6 }}>{feature.desc}</p>
              </div>
            ))}
          </div>

          {/* More cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32, textAlign: 'left' }}>
            {[
              { title: 'Machine Learning', desc: 'Thuật toán tự học từ dữ liệu mà không cần lập trình rõ ràng. ML là nền tảng của mọi ứng dụng AI hiện đại.' },
              { title: 'Deep Learning', desc: 'Mạng nơ-ron nhiều lớp có khả năng học các patterns phức tạp từ lượng dữ liệu khổng lồ.' },
              { title: 'Natural Language', desc: 'Xử lý và hiểu ngôn ngữ tự nhiên của con người, từ văn bản đến giọng nói.' },
            ].map((item, i) => (
              <div
                key={i}
                style={{
                  padding: 40,
                  borderRadius: 32,
                  background: 'linear-gradient(to bottom right, rgba(255,255,255,0.05), rgba(255,255,255,0))',
                  border: '1px solid rgba(255,255,255,0.1)',
                  textAlign: 'center',
                  transition: 'all 0.4s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-15px) scale(1.02)';
                  e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.3)';
                  e.currentTarget.style.boxShadow = '0 30px 60px -20px rgba(59, 130, 246, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0) scale(1)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{
                  width: 56,
                  height: 56,
                  borderRadius: 16,
                  background: 'linear-gradient(to bottom right, #3B82F6, #22d3ee)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 24px',
                }}>
                  <span style={{ color: 'white', fontWeight: 700, fontSize: 24 }}>{i + 1}</span>
                </div>
                <h4 style={{ fontSize: 24, fontWeight: 700, color: 'white', marginBottom: 16 }}>{item.title}</h4>
                <p style={{ color: '#9ca3af', lineHeight: 1.6 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 3: AI AGENTS */}
      <section id="agents" style={{
        padding: '160px 32px',
        position: 'relative',
        zIndex: 20,
        background: 'linear-gradient(to bottom, transparent, rgba(88, 28, 135, 0.3), transparent)',
      }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', textAlign: 'center' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 12,
            padding: '12px 24px',
            borderRadius: 9999,
            background: 'rgba(139, 92, 246, 0.1)',
            border: '1px solid rgba(139, 92, 246, 0.2)',
            color: '#a78bfa',
            marginBottom: 32,
          }}>
            <span style={{ fontWeight: 700 }}>02</span>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#a78bfa' }} />
            <span>Autonomous Systems</span>
          </div>

          <h2 style={{
            fontSize: 'clamp(36px, 8vw, 72px)',
            fontWeight: 700,
            color: 'white',
            marginBottom: 32,
          }}>
            AI
            <span style={{
              background: 'linear-gradient(to right, #a78bfa, #f472b6)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}> Agents</span>
          </h2>

          <p style={{
            fontSize: 20,
            color: '#9ca3af',
            maxWidth: 800,
            margin: '0 auto 80px',
            lineHeight: 1.6,
          }}>
            Agent AI là hệ thống tự chủ có khả năng lập kế hoạch, thực thi và học hỏi từ kết quả.
            Chúng không chỉ trả lời câu hỏi mà còn hành động để đạt được mục tiêu.
          </p>

          {/* Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 32,
            marginBottom: 80,
            textAlign: 'left',
          }}>
            {agentFeatures.map((feature, i) => (
              <div
                key={i}
                style={{
                  padding: 40,
                  borderRadius: 32,
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  backdropFilter: 'blur(20px)',
                  transition: 'all 0.4s ease',
                  animation: `fadeInScale 0.8s ease-out ${i * 0.1}s both`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-15px) rotateX(5deg)';
                  e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.4)';
                  e.currentTarget.style.boxShadow = '0 30px 60px -20px rgba(139, 92, 246, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0) rotateX(0)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{
                  width: 64,
                  height: 64,
                  borderRadius: 16,
                  background: ['linear-gradient(to bottom right, #3B82F6, #22d3ee)', 'linear-gradient(to bottom right, #8B5CF6, #ec4899)', 'linear-gradient(to bottom right, #f97316, #ef4444)', 'linear-gradient(to bottom right, #22c55e, #10b981)'][i],
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 24,
                  transition: 'transform 0.3s',
                }}>
                  <IconRobot className="text-white w-8 h-8" />
                </div>
                <h4 style={{ fontSize: 24, fontWeight: 700, color: 'white', marginBottom: 16 }}>{feature.title}</h4>
                <p style={{ color: '#9ca3af', lineHeight: 1.6 }}>{feature.desc}</p>
              </div>
            ))}
          </div>

          {/* Code section */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, textAlign: 'left', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: 36, fontWeight: 700, color: 'white', marginBottom: 24 }}>How Agents Work</h3>
              <p style={{ fontSize: 18, color: '#9ca3af', marginBottom: 32, lineHeight: 1.6 }}>
                Agent hoạt động theo vòng lặp Observe → Think → Act → Learn.
                Chúng sử dụng tools để tương tác với thế giới bên ngoài và liên tục cải thiện dựa trên feedback.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {['Autonomous Task Execution', 'Multi-step Planning', 'Tool Use & Integration', 'Self-Correction'].map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: 'rgba(139, 92, 246, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <IconCheck className="text-purple-400 w-4 h-4" />
                    </div>
                    <span style={{ color: 'white' }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{
              padding: 32,
              borderRadius: 24,
              background: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid rgba(255,255,255,0.1)',
              backdropFilter: 'blur(20px)',
              textAlign: 'left',
              transition: 'transform 0.3s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.02)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#ef4444' }} />
                <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#eab308' }} />
                <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#22c55e' }} />
                <span style={{ marginLeft: 16, color: '#9ca3af', fontSize: 14 }}>agent.ts</span>
              </div>
              <pre style={{ fontFamily: 'monospace', fontSize: 14, color: '#d1d5db', overflow: 'auto' }}>
                <code>{`// AI Agent Architecture
class AIAgent {
  private model: LLM;
  private tools: Tool[];

  async execute(task) {
    const context = await this.observe(task);
    const plan = await this.think(context);
    const result = await this.act(plan);
    await this.learn(task, result);
    return result;
  }
}`}</code>
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: CLAUDE CODE */}
      <section id="claude" style={{ padding: '160px 32px', position: 'relative', zIndex: 20 }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', textAlign: 'center' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 12,
            padding: '12px 24px',
            borderRadius: 9999,
            background: 'rgba(251, 191, 36, 0.1)',
            border: '1px solid rgba(251, 191, 36, 0.2)',
            color: '#fbbf24',
            marginBottom: 32,
          }}>
            <span style={{ fontWeight: 700 }}>03</span>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#fbbf24' }} />
            <span>Developer Tool</span>
          </div>

          <h2 style={{ fontSize: 'clamp(36px, 8vw, 72px)', fontWeight: 700, color: 'white', marginBottom: 32 }}>
            Claude
            <br />
            <span style={{
              background: 'linear-gradient(to right, #fbbf24, #f97316)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>Code</span>
          </h2>

          <p style={{ fontSize: 20, color: '#9ca3af', maxWidth: 800, margin: '0 auto 80px', lineHeight: 1.6 }}>
            Claude Code là AI coding assistant mạnh nhất từ Anthropic. Được thiết kế để hiểu code,
            viết code, và xử lý các tác vụ phức tạp với độ chính xác cao nhất.
          </p>

          {/* Features grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32, marginBottom: 80, textAlign: 'left' }}>
            {claudeFeatures.map((feature, i) => (
              <div
                key={i}
                style={{
                  padding: 40,
                  borderRadius: 32,
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  backdropFilter: 'blur(20px)',
                  transition: 'all 0.4s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-15px)';
                  e.currentTarget.style.borderColor = 'rgba(251, 191, 36, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                }}
              >
                <div style={{
                  width: 56,
                  height: 56,
                  borderRadius: 16,
                  background: 'linear-gradient(to bottom right, rgba(251, 191, 36, 0.2), rgba(249, 115, 22, 0.2))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 24,
                }}>
                  <IconCode className="text-amber-400 w-7 h-7" />
                </div>
                <h4 style={{ fontSize: 20, fontWeight: 700, color: 'white', marginBottom: 12 }}>{feature.title}</h4>
                <p style={{ color: '#9ca3af', lineHeight: 1.6 }}>{feature.desc}</p>
              </div>
            ))}
          </div>

          {/* Comparison */}
          <div style={{
            padding: 40,
            borderRadius: 32,
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
          }}>
            <h3 style={{ fontSize: 24, fontWeight: 700, color: 'white', marginBottom: 32 }}>Claude Code vs Traditional Coding</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
              <div style={{
                padding: 24,
                borderRadius: 16,
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                textAlign: 'left',
              }}>
                <h4 style={{ color: '#f87171', fontWeight: 700, marginBottom: 16 }}>Traditional</h4>
                <ul style={{ color: '#9ca3af', listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <li>• Viết boilerplate code thủ công</li>
                  <li>• Debug mất hàng giờ</li>
                  <li>• Copy-paste từ StackOverflow</li>
                  <li>• Refactor manually</li>
                </ul>
              </div>
              <div style={{
                padding: 24,
                borderRadius: 16,
                background: 'rgba(34, 197, 94, 0.1)',
                border: '1px solid rgba(34, 197, 94, 0.2)',
                textAlign: 'left',
              }}>
                <h4 style={{ color: '#4ade80', fontWeight: 700, marginBottom: 16 }}>With Claude Code</h4>
                <ul style={{ color: '#d1d5db', listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <li>• AI tự động generate code</li>
                  <li>• Instant bug detection</li>
                  <li>• Context-aware suggestions</li>
                  <li>• One-click refactoring</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5: FUTURE */}
      <section id="future" style={{ padding: '160px 32px', position: 'relative', zIndex: 20 }}>
        <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 12,
            padding: '12px 24px',
            borderRadius: 9999,
            background: 'rgba(34, 211, 238, 0.1)',
            border: '1px solid rgba(34, 211, 238, 0.2)',
            color: '#22d3ee',
            marginBottom: 48,
          }}>
            <span style={{ fontWeight: 700 }}>04</span>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22d3ee' }} />
            <span>The Future</span>
          </div>

          <h2 style={{ fontSize: 'clamp(36px, 8vw, 72px)', fontWeight: 700, color: 'white', marginBottom: 48 }}>
            The Future is
            <br />
            <span style={{
              background: 'linear-gradient(to right, #22d3ee, #60a5fa, #a78bfa)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundSize: '200% 200%',
              animation: 'gradientShift 5s ease infinite',
            }}>Now</span>
          </h2>

          <p style={{ fontSize: 20, color: '#9ca3af', marginBottom: 80, lineHeight: 1.6 }}>
            AI không chỉ là công cụ - nó là đối tác trong hành trình sáng tạo của bạn.
            Hãy bắt đầu ngay hôm nay và trở thành người tiên phong trong kỷ nguyên mới.
          </p>

          <div style={{ display: 'flex', gap: 24, justifyContent: 'center', marginBottom: 80, flexWrap: 'wrap' }}>
            <button style={{
              padding: '24px 48px',
              background: 'linear-gradient(to right, #3B82F6, #8B5CF6, #06B6D4)',
              borderRadius: 16,
              color: 'white',
              fontWeight: 700,
              fontSize: 18,
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 25px 50px -12px rgba(59, 130, 246, 0.25)',
              transition: 'all 0.3s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05) translateY(-5px)';
              e.currentTarget.style.boxShadow = '0 30px 60px -12px rgba(59, 130, 246, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1) translateY(0)';
              e.currentTarget.style.boxShadow = '0 25px 50px -12px rgba(59, 130, 246, 0.25)';
            }}
            >
              Bắt đầu miễn phí
            </button>
            <button style={{
              padding: '24px 48px',
              borderRadius: 16,
              color: 'white',
              fontWeight: 700,
              fontSize: 18,
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.2)',
              cursor: 'pointer',
              transition: 'all 0.3s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
            >
              Liên hệ tư vấn
            </button>
          </div>

          <blockquote style={{ fontSize: 'clamp(24px, 4vw, 36px)', color: 'white', fontWeight: 300, lineHeight: 1.6 }}>
            "AI sẽ không thay thế con người,
            <br />
            nhưng những người dùng AI sẽ thay thế những người không dùng AI."
          </blockquote>
          <cite style={{ display: 'block', marginTop: 32, color: '#6b7280', fontStyle: 'normal' }}>— Sam Altman, CEO OpenAI</cite>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{
        padding: '64px 32px',
        borderTop: '1px solid rgba(255,255,255,0.1)',
        position: 'relative',
        zIndex: 20,
      }}>
        <div style={{
          maxWidth: 1280,
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 32,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: 'linear-gradient(to bottom right, #3B82F6, #8B5CF6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <IconSparkles className="text-white w-6 h-6" />
            </div>
            <span style={{ fontSize: 24, fontWeight: 700, color: 'white' }}>AI Universe</span>
          </div>
          <div style={{ display: 'flex', gap: 32 }}>
            {['Privacy', 'Terms', 'Contact'].map((item) => (
              <a
                key={item}
                href="#"
                style={{
                  color: '#6b7280',
                  textDecoration: 'none',
                  transition: 'color 0.3s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'white'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#6b7280'}
              >
                {item}
              </a>
            ))}
          </div>
          <p style={{ color: '#6b7280', width: '100%', textAlign: 'center', marginTop: 16 }}>
            © 2024 AI Universe. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
