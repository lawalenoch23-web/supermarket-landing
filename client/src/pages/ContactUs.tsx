import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Send } from 'lucide-react';

export default function ContactUs() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [done, setDone] = useState(false);

  const send = async () => {
    const { error } = await supabase.from('messages').insert([form]);
    if (!error) setDone(true);
  };

  if (done) return <div className="text-center p-20 text-orange-500 font-black uppercase">Message Sent!</div>;

  return (
    <div className="min-h-screen bg-black text-white p-10 flex flex-col items-center">
      <h1 className="text-2xl font-black uppercase mb-8 italic">Contact Us</h1>
      <div className="w-full max-w-sm space-y-3">
        <input placeholder="NAME" className="w-full bg-zinc-900 border border-zinc-800 p-3 rounded-xl text-xs font-black uppercase" onChange={e => setForm({...form, name: e.target.value})} />
        <input placeholder="EMAIL" className="w-full bg-zinc-900 border border-zinc-800 p-3 rounded-xl text-xs font-black uppercase" onChange={e => setForm({...form, email: e.target.value})} />
        <textarea placeholder="MESSAGE" rows={4} className="w-full bg-zinc-900 border border-zinc-800 p-3 rounded-xl text-xs font-black uppercase" onChange={e => setForm({...form, message: e.target.value})} />
        <button onClick={send} className="w-full bg-orange-600 py-4 rounded-xl text-[10px] font-black uppercase flex justify-center gap-2"><Send size={14}/> Send to Grandpa</button>
      </div>
    </div>
  );
}