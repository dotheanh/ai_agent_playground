import { useState, useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MessageCircle, Send, User, Calendar, Loader2 } from 'lucide-react';
import { api } from '../../lib/api';

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

  return (
    <section id="guestbook" ref={containerRef} className="py-20 bg-gradient-to-b from-pink-50 via-white to-pink-100 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-pink-300 to-transparent" />

      <div className="relative z-10 max-w-4xl mx-auto px-4">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-pink-100 rounded-full mb-4">
            <MessageCircle className="w-4 h-4 text-pink-500" />
            <span className="font-mono text-xs text-pink-600 uppercase tracking-wider">Sổ Lưu Niệm</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-pink-900 mb-4">
            Để Lại <span className="text-pink-500">Lời Chúc</span>
          </h2>
          <p className="text-pink-600/80 max-w-2xl mx-auto">
            Chia sẻ những lời chúc tốt đẹp nhất dành cho các chị em Zingplay nhé!
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="guestbook-card bg-white/80 backdrop-blur-sm border border-pink-200 rounded-2xl p-6">
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
                  rows={4}
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

          <div className="guestbook-card bg-white/80 backdrop-blur-sm border border-pink-200 rounded-2xl p-6 max-h-[500px] overflow-y-auto">
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
                {entries.map((entry, index) => (
                  <div
                    key={index}
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
      </div>
    </section>
  );
};

export default Guestbook;
