import { useState, useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MessageCircle, Send, User, Calendar, Loader2, Heart, Sparkles, Gift } from 'lucide-react';
import { api } from '../lib/api';
import { tourScheduleConfig } from '../config';

gsap.registerPlugin(ScrollTrigger);

interface GuestbookEntry {
  name: string;
  message: string;
  createdAt: string;
}

const Guestbook = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [entries, setEntries] = useState<GuestbookEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const loadEntries = async () => {
      try {
        const data = await api.getGuestbook();
        setEntries(data);
      } catch (err) {
        console.error('Failed to load guestbook:', err);
        setError('Không thể tải tin nhắn');
      } finally {
        setLoading(false);
      }
    };
    loadEntries();
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.guestbook-card',
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
  }, [entries]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !message.trim()) return;

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await api.addGuestbookEntry(name.trim(), message.trim());
      if (result.success) {
        setEntries([result.entry, ...entries]);
        setName('');
        setMessage('');
        setSuccess('Tin nhắn đã được gửi thành công!');
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      console.error('Failed to submit:', err);
      setError('Gửi tin nhắn thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const TOUR_DATES = tourScheduleConfig.tourDates;

  return (
    <section id="guestbook" ref={containerRef} className="relative w-full min-h-screen bg-gradient-to-br from-pink-200 via-pink-100 to-pink-50 py-20 overflow-hidden">
      {/* Floating hearts background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <Heart className="absolute top-20 left-[10%] w-12 h-12 text-pink-300/40 fill-pink-300/40 animate-heart-float" />
        <Heart className="absolute top-40 right-[15%] w-8 h-8 text-pink-400/30 fill-pink-400/30 animate-heart-float" style={{ animationDelay: '0.5s' }} />
        <Heart className="absolute bottom-40 left-[20%] w-10 h-10 text-pink-300/40 fill-pink-300/40 animate-heart-float" style={{ animationDelay: '1s' }} />
        <Sparkles className="absolute top-1/3 right-[8%] w-10 h-10 text-pink-400/30 animate-sparkle" />
        <Heart className="absolute bottom-1/4 right-[25%] w-14 h-14 text-pink-300/30 fill-pink-300/30 animate-heart-float" style={{ animationDelay: '0.8s' }} />
      </div>

      {/* Content container */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12">
        {/* Section header */}
        <div className="mb-16 text-center">
          <div className="flex justify-center gap-2 mb-4">
            <Heart className="w-6 h-6 text-pink-400 fill-pink-400 animate-pulse-heart" />
            <Heart className="w-8 h-8 text-pink-500 fill-pink-500 animate-pulse-heart" style={{ animationDelay: '0.2s' }} />
            <Heart className="w-6 h-6 text-pink-400 fill-pink-400 animate-pulse-heart" style={{ animationDelay: '0.4s' }} />
          </div>
          <p className="font-cute text-xs text-pink-500 uppercase tracking-wider mb-2">
            {tourScheduleConfig.sectionLabel}
          </p>
          <h2 className="font-display text-5xl md:text-7xl text-pink-500 gradient-text">
            {tourScheduleConfig.sectionTitle}
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left column: Team wishes */}
          <div className="guestbook-card lg:col-span-1 space-y-4">
            <h3 className="text-xl text-pink-900 font-semibold mb-4 flex items-center gap-2">
              <Gift className="w-5 h-5 text-pink-500" />
              Lời Chúc Từ Team
            </h3>
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
              {TOUR_DATES.map((tour) => (
                <div
                  key={tour.id}
                  className="group relative p-4 rounded-2xl bg-white/70 backdrop-blur-sm border-2 border-pink-200 hover:border-pink-400 hover:bg-white/90 transition-all duration-300"
                >
                  <div className="flex items-start gap-3">
                    <img
                      src={tour.image}
                      alt={tour.city}
                      className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
                    />
                    <div className="flex-grow min-w-0">
                      <p className="font-display text-lg text-pink-600 flex items-center gap-1">
                        <Heart className="w-4 h-4 fill-pink-500 text-pink-500" />
                        {tour.city}
                      </p>
                      <p className="text-sm text-pink-500/70 line-clamp-2">
                        {tour.venue}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Middle: Write message */}
          <div className="guestbook-card lg:col-span-1 bg-white/80 backdrop-blur-sm border border-pink-200 rounded-2xl p-6">
            <h3 className="text-xl text-pink-900 font-semibold mb-6 flex items-center gap-2">
              <Send className="w-5 h-5 text-pink-500" />
              Viết lời chúc
            </h3>

            {success && (
              <div className="mb-4 p-3 bg-green-100 border border-green-300 rounded-lg text-green-700 text-sm">
                {success}
              </div>
            )}

            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Tên của bạn"
                  required
                  className="w-full bg-pink-50 border border-pink-200 rounded-xl px-4 py-3 text-pink-900 placeholder:text-pink-400 focus:outline-none focus:border-pink-400 transition-colors"
                />
              </div>
              <div>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Lời chúc của bạn..."
                  required
                  rows={5}
                  className="w-full bg-pink-50 border border-pink-200 rounded-xl px-4 py-3 text-pink-900 placeholder:text-pink-400 focus:outline-none focus:border-pink-400 transition-colors resize-none"
                />
              </div>
              <button
                type="submit"
                disabled={submitting || !name.trim() || !message.trim()}
                className="w-full py-3 bg-pink-500 text-white font-semibold rounded-xl hover:bg-pink-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Đang gửi...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Gửi Lời Chúc
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Right: Messages list */}
          <div className="guestbook-card lg:col-span-1 bg-white/80 backdrop-blur-sm border border-pink-200 rounded-2xl p-6 max-h-[500px] overflow-y-auto">
            <h3 className="text-xl text-pink-900 font-semibold mb-6 flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-pink-500" />
              Lời Chúc Gần Đây
            </h3>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 text-pink-500 animate-spin" />
              </div>
            ) : entries.length === 0 ? (
              <p className="text-pink-400 text-center py-8">Chưa có lời chúc nào. Hãy là người đầu tiên nhé!</p>
            ) : (
              <div className="space-y-4">
                {entries.map((entry) => (
                  <div
                    key={entry.name + entry.createdAt}
                    className="p-4 bg-pink-50 rounded-xl border border-pink-100"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 bg-pink-200 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-pink-600" />
                      </div>
                      <span className="text-pink-900 font-medium">{entry.name}</span>
                    </div>
                    <p className="text-pink-700 text-sm mb-2">{entry.message}</p>
                    <div className="flex items-center gap-1 text-pink-400 text-xs">
                      <Calendar className="w-3 h-3" />
                      {formatDate(entry.createdAt)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <p className="font-cute text-sm text-pink-500/70 mb-4">
            {tourScheduleConfig.bottomNote}
          </p>
          <button className="btn-cute flex items-center gap-2 mx-auto">
            <Heart className="w-5 h-5" />
            {tourScheduleConfig.bottomCtaText}
          </button>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-pink-400/30 to-transparent" />
    </section>
  );
};

export default Guestbook;
