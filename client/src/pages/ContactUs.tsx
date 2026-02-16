import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Send, CheckCircle, Mail, MapPin, MessageSquare, Phone } from 'lucide-react';

export default function ContactUs() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const send = async () => {
    // Validation
    if (!form.name || !form.email || !form.message) {
      alert("Please fill in all fields");
      return;
    }

    setLoading(true);
    const { error } = await supabase.from('messages').insert([{
      name: form.name.toUpperCase(),
      email: form.email.toLowerCase(),
      message: form.message
    }]);

    setLoading(false);

    if (!error) {
      setShowSuccess(true);
      setTimeout(() => {
        setDone(true);
      }, 2000);
    } else {
      alert("Error sending message. Please try again.");
    }
  };

  // Success Popup Modal
  if (showSuccess && !done) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/90 backdrop-blur-md animate-in fade-in">
        <div className="bg-zinc-950 border border-green-500/20 p-12 rounded-3xl text-center max-w-md w-full shadow-2xl animate-in zoom-in">
          <div className="bg-green-500 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-green-500/40 shadow-lg">
            <CheckCircle size={40} className="text-black" />
          </div>
          <h2 className="text-3xl font-black italic uppercase mb-3">Message Sent!</h2>
          <p className="text-zinc-500 text-sm font-bold">
            We've received your message and will get back to you soon.
          </p>
        </div>
      </div>
    );
  }

  // Success State - Full Screen
  if (done) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center">
        <CheckCircle className="text-green-500 mb-6" size={64} />
        <h2 className="text-4xl font-black italic uppercase mb-3">Thank You!</h2>
        <p className="text-zinc-500 text-sm font-bold mb-8 max-w-md">
          Your message has been sent successfully. We'll respond to you shortly.
        </p>
        <button 
          onClick={() => window.location.href = '/'} 
          className="bg-white text-black px-8 py-4 rounded-2xl text-xs font-black uppercase hover:bg-zinc-200 transition-all"
        >
          Back to Market
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-transparent pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-12 md:py-16 relative z-10">

        {/* HEADER */}
        <div className="text-center mb-12 md:mb-16">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black italic tracking-tighter uppercase mb-4">
            Get In Touch
          </h1>
          <p className="text-zinc-600 text-xs md:text-sm font-black uppercase tracking-[0.3em]">
            We're Here to Help
          </p>
        </div>

        {/* TWO-PANE LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">

          {/* LEFT PANE - QUICK INFO */}
          <div className="space-y-6">
            {/* MAIN INFO CARD */}
            <div className="bg-zinc-950/50 backdrop-blur-md border border-zinc-900 p-8 md:p-10 rounded-3xl">
              <h2 className="text-2xl font-black italic uppercase mb-8">Contact Information</h2>

              <div className="space-y-6">
                {/* Email */}
                <div className="flex items-start gap-4 group cursor-pointer">
                  <div className="bg-orange-500/10 p-3 rounded-xl group-hover:bg-orange-500 transition-all">
                    <Mail size={20} className="text-orange-500 group-hover:text-black transition-colors" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-zinc-500 uppercase mb-1">Email</p>
                    <a 
                      href="mailto:lawalenoch23@gmail.com" 
                      className="text-sm font-bold hover:text-orange-500 transition-colors"
                    >
                      lawalenoch23@gmail.com
                    </a>
                  </div>
                </div>

                {/* Location */}
                <div className="flex items-start gap-4">
                  <div className="bg-blue-500/10 p-3 rounded-xl">
                    <MapPin size={20} className="text-blue-500" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-zinc-500 uppercase mb-1">Location</p>
                    <p className="text-sm font-bold">Ibadan, Oyo State, Nigeria</p>
                  </div>
                </div>

                {/* Support Hours */}
                <div className="flex items-start gap-4">
                  <div className="bg-green-500/10 p-3 rounded-xl">
                    <MessageSquare size={20} className="text-green-500" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-zinc-500 uppercase mb-1">Support Hours</p>
                    <p className="text-sm font-bold">Mon - Sat: 8AM - 8PM</p>
                    <p className="text-xs text-zinc-600 font-medium mt-1">Sunday: Closed</p>
                  </div>
                </div>
              </div>
            </div>

            {/* WHATSAPP CARD */}
            <a
              href="https://wa.me/2348165154912"
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-gradient-to-br from-green-500/20 to-green-600/10 backdrop-blur-md border border-green-500/30 p-8 rounded-3xl hover:border-green-500/50 transition-all group"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="bg-green-500 p-3 rounded-xl group-hover:scale-110 transition-transform">
                  <Phone size={24} className="text-black" />
                </div>
                <div>
                  <p className="text-xs font-black text-green-400 uppercase mb-1">Quick Response</p>
                  <p className="text-lg font-black italic uppercase">Chat on WhatsApp</p>
                </div>
              </div>
              <p className="text-xs text-zinc-400 font-medium">
                Get instant support and answers to your questions
              </p>
            </a>

            {/* DEMO REQUEST INFO */}
            <div className="bg-orange-500/5 backdrop-blur-md border border-orange-500/20 p-6 rounded-2xl">
              <p className="text-xs font-black text-orange-500 uppercase mb-2">Interested in a Demo?</p>
              <p className="text-xs text-zinc-400 font-medium leading-relaxed">
                If you're a business owner looking to set up your own digital market, mention "Demo Request" in your message and we'll get back to you with details.
              </p>
            </div>
          </div>

          {/* RIGHT PANE - CONTACT FORM */}
          <div className="bg-zinc-950/50 backdrop-blur-md border border-zinc-900 p-8 md:p-10 rounded-3xl">
            <h2 className="text-2xl font-black italic uppercase mb-2">Send us a Message</h2>
            <p className="text-zinc-600 text-xs font-bold mb-8">
              Fill out the form below and we'll respond within 24 hours
            </p>

            <div className="space-y-4">
              {/* Name Input */}
              <div>
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-wider mb-2 block">
                  Full Name *
                </label>
                <input 
                  type="text"
                  placeholder="JOHN DOE" 
                  value={form.name}
                  className="w-full bg-black border border-zinc-800 p-4 rounded-2xl text-sm font-bold uppercase outline-none focus:border-orange-500 transition-all" 
                  onChange={e => setForm({...form, name: e.target.value})} 
                />
              </div>

              {/* Email Input */}
              <div>
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-wider mb-2 block">
                  Email Address *
                </label>
                <input 
                  type="email"
                  placeholder="YOUR.EMAIL@EXAMPLE.COM" 
                  value={form.email}
                  className="w-full bg-black border border-zinc-800 p-4 rounded-2xl text-sm font-medium lowercase outline-none focus:border-orange-500 transition-all" 
                  onChange={e => setForm({...form, email: e.target.value})} 
                />
              </div>

              {/* Message Input */}
              <div>
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-wider mb-2 block">
                  Your Message *
                </label>
                <textarea 
                  placeholder="HOW CAN WE HELP YOU?" 
                  rows={6} 
                  value={form.message}
                  className="w-full bg-black border border-zinc-800 p-4 rounded-2xl text-sm font-medium outline-none focus:border-orange-500 transition-all resize-none" 
                  onChange={e => setForm({...form, message: e.target.value})} 
                />
              </div>

              {/* Submit Button */}
              <button 
                onClick={send} 
                disabled={loading}
                className={`w-full py-5 rounded-2xl text-sm font-black uppercase flex justify-center items-center gap-3 transition-all active:scale-95 ${
                  loading 
                    ? 'bg-zinc-800 cursor-not-allowed' 
                    : 'bg-orange-600 hover:bg-orange-500 shadow-lg shadow-orange-500/20'
                }`}
              >
                {loading ? (
                  <>
                    <div className="animate-spin h-5 w-5 border-2 border-black border-t-transparent rounded-full" />
                    <span className="text-black">Sending...</span>
                  </>
                ) : (
                  <>
                    <Send size={18} className="text-black"/> 
                    <span className="text-black">Send Message</span>
                  </>
                )}
              </button>

              {/* Privacy Note */}
              <p className="text-[9px] text-zinc-600 text-center font-medium leading-relaxed">
                By submitting this form, you agree to our terms of service. We respect your privacy and will never share your information.
              </p>
            </div>
          </div>
        </div>

        {/* FOOTER NOTE */}
        <div className="mt-16 text-center">
          <p className="text-xs text-zinc-700 font-bold uppercase tracking-widest">
            Popop's Dream • 2026
          </p>
        </div>
      </div>
    </div>
  );
}