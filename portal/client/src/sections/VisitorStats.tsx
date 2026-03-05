import { useEffect, useState, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Users, Eye, Clock, Activity, Zap } from 'lucide-react';
import { api, getSessionId, type LiveStats } from '../lib/api';

gsap.registerPlugin(ScrollTrigger);

const VisitorStats = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [stats, setStats] = useState<LiveStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch stats
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

    // Refresh every 10 seconds
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, []);

  // GSAP animation
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
      label: 'Page Views',
      value: stats?.pageViews ?? 0,
      color: 'text-crimson',
      bgColor: 'bg-crimson/10',
    },
    {
      icon: Users,
      label: 'Unique Visitors',
      value: stats?.uniqueVisitors ?? 0,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-400/10',
    },
    {
      icon: Activity,
      label: 'Online Now',
      value: stats?.onlineUsers ?? 0,
      color: 'text-green-400',
      bgColor: 'bg-green-400/10',
    },
    {
      icon: Clock,
      label: 'Server Uptime',
      value: stats?.uptime ? formatUptime(stats.uptime) : '-',
      color: 'text-purple-400',
      bgColor: 'bg-purple-400/10',
    },
  ];

  return (
    <section
      id="stats"
      ref={containerRef}
      className="relative py-20 bg-void-black overflow-hidden"
    >
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-void-dark/50 to-void-black" />
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-crimson/30 to-transparent" />

      <div className="relative z-10 max-w-6xl mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-crimson/10 rounded-full mb-4">
            <Zap className="w-4 h-4 text-crimson" />
            <span className="font-mono text-xs text-crimson uppercase tracking-wider">Live Data</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Real-Time <span className="text-crimson">Statistics</span>
          </h2>
          <p className="text-white/60 max-w-2xl mx-auto">
            Track visitor engagement and server performance in real-time
          </p>
        </div>

        {/* Error State */}
        {error && (
          <div className="text-center py-8">
            <p className="text-red-400 font-mono">{error}</p>
            <button
              onClick={fetchStats}
              className="mt-4 px-6 py-2 bg-crimson/20 text-crimson rounded-full hover:bg-crimson/30 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* Stats Grid */}
        {!error && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {statItems.map((item) => (
              <div
                key={item.label}
                className="stat-card group relative p-6 bg-void-dark/50 border border-white/5 rounded-2xl hover:border-crimson/30 transition-all duration-300"
              >
                {/* Glow effect */}
                <div className="absolute inset-0 rounded-2xl bg-crimson/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                <div className={`relative z-10 w-12 h-12 ${item.bgColor} rounded-xl flex items-center justify-center mb-4`}>
                  <item.icon className={`w-6 h-6 ${item.color}`} />
                </div>

                <p className="text-white/60 text-sm mb-1">{item.label}</p>
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

        {/* Last updated */}
        {stats?.timestamp && (
          <p className="text-center text-white/40 text-xs mt-8 font-mono">
            Last updated: {new Date(stats.timestamp).toLocaleTimeString()}
          </p>
        )}
      </div>
    </section>
  );
};

export default VisitorStats;
