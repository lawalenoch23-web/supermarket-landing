import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useTheme } from '../components/ThemeProvider';
import { Send, CheckCircle, Mail, MapPin, MessageSquare, Phone, Package, ArrowLeft } from 'lucide-react';

export default function ContactUs() {
  const theme = useTheme();
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const send = async () => {
    if (!form.name || !form.email || !form.message) { alert('Please fill in all fields'); return; }
    setLoading(true);
    const { error } = await supabase.from('messages').insert([{
      name: form.name.toUpperCase(),
      email: form.email.toLowerCase(),
      message: form.message
    }]);
    setLoading(false);
    if (!error) {
      setShowSuccess(true);
      setTimeout(() => setDone(true), 2200);
    } else {
      alert('Error sending message. Please try again.');
    }
  };

  if (showSuccess && !done) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{ background: 'var(--bg-color)' }}>
        <div className="text-center max-w-xs">
          <div className="w-20 h-20 bg-green-500/15 border border-green-500/30 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={36} className="text-green-500" />
          </div>
          <h2 className="text-3xl font-black uppercase tracking-tight mb-2" style={{ color: 'var(--text-color)' }}>Message Sent!</h2>
          <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>We'll get back to you soon.</p>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center" style={{ background: 'var(--bg-color)', color: 'var(--text-color)' }}>
        <div className="w-16 h-16 bg-green-500/12 border border-green-500/20 rounded-2xl flex items-center justify-center mb-6">
          <CheckCircle size={28} className="text-green-500" />
        </div>
        <h2 className="text-4xl font-black uppercase tracking-tight mb-3" style={{ color: 'var(--text-color)' }}>Thank You!</h2>
        <p className="text-sm font-medium mb-8 max-w-sm" style={{ color: 'var(--text-muted)' }}>Your message was sent. We'll respond within 24 hours.</p>
        <button onClick={() => window.location.href = '/'}
          className="px-8 py-3.5 rounded-xl text-sm font-black uppercase tracking-wider transition-all active:scale-95"
          style={{ background: 'var(--primary-color)', color: '#000' }}>
          Back to Market
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen font-sans" style={{ background: 'var(--bg-color)', color: 'var(--text-color)' }}>
      <style>{`
        @keyframes fade-up { from { opacity:0; transform: translateY(20px); } to { opacity:1; transform: translateY(0); } }
        .fade-up { animation: fade-up 0.5s ease both; }
        .fade-up-1 { animation-delay: 0.05s; }
        .fade-up-2 { animation-delay: 0.12s; }
        .fade-up-3 { animation-delay: 0.19s; }
        .ct-input { background: var(--input-bg); border-color: var(--input-border); color: var(--text-color); }
        .ct-input:focus { border-color: var(--primary-color); outline: none; }
        .ct-input::placeholder { color: var(--text-muted); opacity: 0.6; }
        .ct-card { background: var(--card-bg); border-color: var(--card-border); }
        .ct-nav { background: var(--nav-bg); border-color: var(--card-border); }
      `}</style>

      {/* ── BRANDED NAV ── */}
      <nav className="sticky top-0 z-50 ct-nav backdrop-blur-xl border-b">
        <div className="max-w-5xl mx-auto px-4 md:px-6 lg:px-8 h-14 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2.5">
            {theme.logo_url ? (
              <img src={theme.logo_url} alt={theme.store_name} className="h-8 w-8 object-contain rounded-lg" />
            ) : (
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: 'var(--primary-color)' }}>
                <Package size={16} className="text-black" />
              </div>
            )}
            <span className="text-sm font-black uppercase tracking-tight" style={{ color: 'var(--text-color)' }}>
              {theme.store_name}
            </span>
          </a>
          <a href="/" className="flex items-center gap-1.5 text-xs font-black uppercase transition-colors"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--primary-color)'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'}>
            <ArrowLeft size={13} /> Back to Store
          </a>
        </div>
      </nav>

      {/* Subtle background glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[200px] rounded-full"
          style={{ background: 'color-mix(in srgb, var(--primary-color) 5%, transparent)', filter: 'blur(100px)' }} />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 md:px-6 lg:px-8 py-12 md:py-16 lg:py-20">

        {/* Header */}
        <div className="text-center mb-12 md:mb-16 fade-up">
          <p className="text-[10px] font-black uppercase tracking-[0.35em] mb-4" style={{ color: 'var(--primary-color)' }}>Support & Inquiries</p>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black uppercase tracking-tight leading-none mb-3" style={{ color: 'var(--text-color)' }}>
            Get In Touch
          </h1>
          <p className="text-xs md:text-sm font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>We respond within 24 hours</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 items-start">

          {/* LEFT: INFO */}
          <div className="space-y-4 fade-up fade-up-1">

            <div className="border rounded-2xl p-6 md:p-7 ct-card">
              <h2 className="text-base font-black uppercase tracking-tight mb-6" style={{ color: 'var(--text-color)' }}>Contact Information</h2>
              <div className="space-y-5">
                {[
                  {
                    icon: <Mail size={16} style={{ color: 'var(--primary-color)' }} />,
                    bgStyle: { background: 'color-mix(in srgb, var(--primary-color) 10%, transparent)' },
                    label: 'Email',
                    content: (
                      <a href="mailto:lawalenoch23@gmail.com"
                        className="text-sm font-bold transition-colors"
                        style={{ color: 'var(--text-color)' }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--primary-color)'}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-color)'}>
                        lawalenoch23@gmail.com
                      </a>
                    )
                  },
                  {
                    icon: <MapPin size={16} className="text-blue-500" />,
                    bgStyle: { background: 'rgba(59,130,246,0.1)' },
                    label: 'Location',
                    content: <p className="text-sm font-bold" style={{ color: 'var(--text-color)' }}>Ibadan, Oyo State, Nigeria</p>
                  },
                  {
                    icon: <MessageSquare size={16} className="text-green-500" />,
                    bgStyle: { background: 'rgba(34,197,94,0.1)' },
                    label: 'Support Hours',
                    content: (
                      <div>
                        <p className="text-sm font-bold" style={{ color: 'var(--text-color)' }}>Mon – Sat: 8AM – 8PM</p>
                        <p className="text-xs font-medium mt-0.5" style={{ color: 'var(--text-muted)' }}>Sunday: Closed</p>
                      </div>
                    )
                  },
                ].map(item => (
                  <div key={item.label} className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={item.bgStyle}>
                      {item.icon}
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>{item.label}</p>
                      {item.content}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* WhatsApp CTA */}
            <a
              href="https://wa.me/2348165154912"
              target="_blank"
              rel="noopener noreferrer"
              className="block border rounded-2xl p-5 transition-all group active:scale-[0.98]"
              style={{ background: 'rgba(34,197,94,0.08)', borderColor: 'rgba(34,197,94,0.2)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(34,197,94,0.4)'; (e.currentTarget as HTMLElement).style.background = 'rgba(34,197,94,0.12)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(34,197,94,0.2)'; (e.currentTarget as HTMLElement).style.background = 'rgba(34,197,94,0.08)'; }}>
              <div className="flex items-center gap-4 mb-2">
                <div className="bg-green-500 w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0">
                  <Phone size={18} className="text-black" />
                </div>
                <div>
                  <p className="text-[10px] text-green-400 font-black uppercase tracking-wider">Quick Response</p>
                  <p className="text-base font-black uppercase" style={{ color: 'var(--text-color)' }}>Chat on WhatsApp</p>
                </div>
              </div>
              <p className="text-xs font-medium pl-14" style={{ color: 'var(--text-muted)' }}>Get instant support and answers to your questions.</p>
            </a>

            {/* Demo note */}
            <div className="rounded-2xl p-5" style={{ background: 'color-mix(in srgb, var(--primary-color) 5%, transparent)', border: '1px solid color-mix(in srgb, var(--primary-color) 15%, transparent)' }}>
              <p className="text-xs font-black uppercase tracking-wider mb-2" style={{ color: 'var(--primary-color)' }}>Interested in a Demo?</p>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                Business owner? Mention <strong style={{ color: 'var(--text-color)' }}>"Demo Request"</strong> in your message and we'll send you setup details for your own digital market.
              </p>
            </div>
          </div>

          {/* RIGHT: FORM */}
          <div className="border rounded-2xl p-6 md:p-7 ct-card fade-up fade-up-2">
            <h2 className="text-base font-black uppercase tracking-tight mb-1" style={{ color: 'var(--text-color)' }}>Send a Message</h2>
            <p className="text-xs font-medium mb-6" style={{ color: 'var(--text-muted)' }}>Fill out the form and we'll respond within 24 hours.</p>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest mb-2 block" style={{ color: 'var(--text-muted)' }}>Full Name *</label>
                <input
                  type="text"
                  placeholder="Your name"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="ct-input w-full border rounded-xl px-4 py-3.5 text-sm font-semibold transition-all"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest mb-2 block" style={{ color: 'var(--text-muted)' }}>Email Address *</label>
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  className="ct-input w-full border rounded-xl px-4 py-3.5 text-sm font-medium transition-all"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest mb-2 block" style={{ color: 'var(--text-muted)' }}>Message *</label>
                <textarea
                  placeholder="How can we help you?"
                  rows={5}
                  value={form.message}
                  onChange={e => setForm({ ...form, message: e.target.value })}
                  className="ct-input w-full border rounded-xl px-4 py-3.5 text-sm font-medium transition-all resize-none"
                />
              </div>

              <button
                onClick={send}
                disabled={loading}
                className="w-full py-4 rounded-xl text-sm font-black uppercase tracking-widest flex items-center justify-center gap-2.5 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: loading ? 'var(--card-border)' : 'var(--primary-color)', color: '#000' }}>
                {loading ? (
                  <><div className="animate-spin h-4 w-4 border-2 border-black/40 border-t-transparent rounded-full" /> Sending...</>
                ) : (
                  <><Send size={16} /> Send Message</>
                )}
              </button>

              <p className="text-[10px] text-center font-medium leading-relaxed" style={{ color: 'var(--text-muted)', opacity: 0.6 }}>
                We respect your privacy and will never share your information.
              </p>
            </div>
          </div>
        </div>

        <p className="text-center text-[10px] font-bold uppercase tracking-[0.3em] mt-16 fade-up fade-up-3" style={{ color: 'var(--card-border)' }}>
          {theme.store_name} • 2026
        </p>
      </div>
    </div>
  );
}