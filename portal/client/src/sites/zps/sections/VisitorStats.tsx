import { useEffect, useState, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Users, Eye, Clock, Activity, Zap } from 'lucide-react';
import { api, getSessionId, type LiveStats } from '../../lib/api';

gsap.registerPlugin(ScrollTrigger);

const VisitorStats = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [stats, setStats] = useState<LiveStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      const sessionId = getSessionId();
      await api.heartbeat(sessionId);
      const data = await api.getLiveStats();
      setStats(data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
      setError('Unable to connect to server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.stat-card',
        { y: 30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          stagger: 0.1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: containerRef.current,
            start: 'top 80%',
          },
        }
      );
    }, containerRef);
    return () => ctx.revert();
  }, [stats]);

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const statItems = [
    {
      icon: Eye,
      label: 'Lượt xem',
      value: stats?.pageViews ?? 0,
      color: 'text-pink-500',
      bgColor: 'bg-pink-100',
    },
    {
      icon: Users,
      label: 'Khách tham quan',
      value: stats?.uniqueVisitors ?? 0,
      color: 'text-pink-600',
      bgColor: 'bg-pink-200',
    },
    {
      icon: Activity,
      label: 'Đang online',
      value: stats?.onlineUsers ?? 0,
      color: 'text-pink-700',
      bgColor: 'bg-pink-300',
    },
    {
      icon: Clock,
      label: 'Thời gian hoạt động',
      value: stats?.uptime ? formatUptime(stats.uptime) : '-',
      color: 'text-pink-800',
      bgColor: 'bg-pink-400',
    },
  ];

  return (
    <section
      id="stats"
      ref={containerRef}
      className="relative py-20 bg-gradient-to-b from-pink-50 via-white to-pink-100 overflow-hidden"
    >
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-pink-300 to-transparent" />

      <div className="relative z-10 max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-pink-100 rounded-full mb-4">
            <Zap className="w-4 h-4 text-pink-500" />
            <span className="font-mono text-xs text-pink-600 uppercase tracking-wider">Dữ liệu thời gian thực</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-pink-900 mb-4">
            Thống Kê <span className="text-pink-500">Real-Time</span>
          </h2>
          <p className="text-pink-600/80 max-w-2xl mx-auto">
            Theo dõi lượt truy cập và tương tác của khách hàng
          </p>
        </div>

        {error && (
          <div className="text-center py-8">
            <p className="text-red-500 font-mono">{error}</p>
            <button
              onClick={fetchStats}
              className="mt-4 px-6 py-2 bg-pink-200 text-pink-700 rounded-full hover:bg-pink-300 transition-colors"
            >
              Thử lại
            </button>
          </div>
        )}

        {!error && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {statItems.map((item) => (
              <div
                key={item.label}
                className="stat-card group relative p-6 bg-white/80 backdrop-blur-sm border border-pink-200 rounded-2xl hover:border-pink-400 hover:shadow-lg transition-all duration-300"
              >
                <div className={`relative z-10 w-12 h-12 ${item.bgColor} rounded-xl flex items-center justify-center mb-4`}>
                  <item.icon className={`w-6 h-6 ${item.color}`} />
                </div>
                <p className="text-pink-600/80 text-sm mb-1">{item.label}</p>
                <p className={`text-3xl font-bold ${item.color}`}>
                  {loading ? (
                    <span className="animate-pulse">...</span>
                  ) : (
                    item.value
                  )}
                </p>
              </div>
            ))}
          </div>
        )}

        {stats?.timestamp && (
          <p className="text-center text-pink-400 text-xs mt-8 font-mono">
            Cập nhật lần cuối: {new Date(stats.timestamp).toLocaleTimeString('vi-VN')}
          </p>
        )}
      </div>
    </section>
  );
};

export default VisitorStats;
