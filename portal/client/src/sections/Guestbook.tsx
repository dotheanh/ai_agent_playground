import { useState, useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MessageCircle, Send, User, Calendar, Loader2 } from 'lucide-react';
import { api } from '../lib/api';

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

  // Load guestbook entries
  useEffect(() => {
    const loadEntries = async () => {
      try {
        const data = await api.getGuestbook();
        setEntries(data);
      } catch (err) {
        console.error('Failed to load guestbook:', err);
        setError('Unable to load messages');
      } finally {
        setLoading(false);
      }
    };

    loadEntries();
  }, []);

  // GSAP animation
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
      setError('Failed to send message');
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
    <section id="guestbook" ref={containerRef} className="py-20 bg-void-black relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-void-dark/50 to-void-black" />
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-crimson/30 to-transparent" />

      <div className="relative z-10 max-w-4xl mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-crimson/10 rounded-full mb-4">
            <MessageCircle className="w-4 h-4 text-crimson" />
            <span className="font-mono text-xs text-crimson uppercase tracking-wider">Guestbook</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Leave a <span className="text-crimson">Message</span>
          </h2>
          <p className="text-white/60 max-w-2xl mx-auto">
            Share your thoughts or just say hello!
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Form */}
          <div className="guestbook-card bg-void-dark/50 border border-white/5 rounded-2xl p-6">
            <h3 className="text-xl text-white font-semibold mb-6 flex items-center gap-2">
              <Send className="w-5 h-5 text-crimson" />
              Write a message
            </h3>

            {success && (
              <div className="mb-4 p-3 bg-green-500/20 border border-green-500/30 rounded-lg text-green-400 text-sm">
                {success}
              </div>
            )}

            {error && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-crimson/50 transition-colors"
                />
              </div>
              <div>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Your message..."
                  required
                  rows={4}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-crimson/50 transition-colors resize-none"
                />
              </div>
              <button
                type="submit"
                disabled={submitting || !name.trim() || !message.trim()}
                className="w-full py-3 bg-crimson text-white font-semibold rounded-xl hover:bg-crimson-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Send Message
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Messages List */}
          <div className="guestbook-card bg-void-dark/50 border border-white/5 rounded-2xl p-6 max-h-[500px] overflow-y-auto">
            <h3 className="text-xl text-white font-semibold mb-6 flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-crimson" />
              Recent Messages
            </h3>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 text-crimson animate-spin" />
              </div>
            ) : entries.length === 0 ? (
              <p className="text-white/40 text-center py-8">No messages yet. Be the first!</p>
            ) : (
              <div className="space-y-4">
                {entries.map((entry, index) => (
                  <div
                    key={index}
                    className="p-4 bg-white/5 rounded-xl border border-white/5"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 bg-crimson/20 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-crimson" />
                      </div>
                      <span className="text-white font-medium">{entry.name}</span>
                    </div>
                    <p className="text-white/60 text-sm mb-2">{entry.message}</p>
                    <div className="flex items-center gap-1 text-white/30 text-xs">
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
