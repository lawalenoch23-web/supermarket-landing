import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Send, CheckCircle } from 'lucide-react';

export default function ContactUs() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const send = async () => {
    setLoading(true);
    const { error } = await supabase.from('messages').insert([form]);
    if (!error) {
      setDone(true);
    } else {
      alert("Error sending message. Please try again.");
    }
    setLoading(false);
  };

  if (done) return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-10 text-center">
      <CheckCircle className="text-orange-500 mb-4" size={50} />
      <div className="text-orange-500 font-black uppercase italic text-2xl">Message Sent!</div>
      <p className="text-zinc-500 text-[10px] mt-2 uppercase font-black">Grandpa will get back to you soon.</p>
      <button onClick={() => window.location.href = '/'} className="mt-8 text-white border border-zinc-800 px-6 py-2 rounded-full text-[10px] font-black uppercase">Back Home</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white p-10 flex flex-col items-center font-black uppercase italic">
      <h1 className="text-2xl mb-8 tracking-tighter">Contact Us</h1>

      <div className="w-full max-w-sm space-y-3">
        <input 
          placeholder="FULL NAME" 
          className="w-full bg-zinc-900 border border-zinc-800 p-4 rounded-xl text-[10px] outline-none focus:border-orange-500 transition-all" 
          onChange={e => setForm({...form, name: e.target.value.toUpperCase()})} 
        />
        <input 
          placeholder="EMAIL ADDRESS" 
          className="w-full bg-zinc-900 border border-zinc-800 p-4 rounded-xl text-[10px] outline-none focus:border-orange-500 transition-all" 
          onChange={e => setForm({...form, email: e.target.value.toUpperCase()})} 
        />
        <textarea 
          placeholder="HOW CAN WE HELP?" 
          rows={4} 
          className="w-full bg-zinc-900 border border-zinc-800 p-4 rounded-xl text-[10px] outline-none focus:border-orange-500 transition-all resize-none" 
          onChange={e => setForm({...form, message: e.target.value.toUpperCase()})} 
        />

        <button 
          onClick={send} 
          disabled={loading}
          className={`w-full ${loading ? 'bg-zinc-800' : 'bg-orange-600 hover:bg-orange-500'} py-4 rounded-xl text-[10px] flex justify-center items-center gap-2 transition-colors`}
        >
          <Send size={14} className="text-black"/> 
          <span className="text-black">{loading ? 'SENDING...' : 'SEND TO GRANDPA'}</span>
        </button>
      </div>

      {/* WhatsApp Quick Link */}
      <a 
        href="https://wa.me/YOUR_NUMBER" 
        className="mt-10 flex items-center gap-2 text-zinc-500 hover:text-green-500 transition-colors"
      >
        <span className="text-[10px]">Chat on WhatsApp</span>
      </a>
    </div>
  );
}