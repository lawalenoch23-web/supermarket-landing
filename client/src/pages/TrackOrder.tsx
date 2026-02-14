import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Search, Package } from 'lucide-react';

export default function TrackOrder() {
  const [id, setId] = useState('');
  const [res, setRes] = useState<any>(null);

  const search = async () => {
    const { data } = await supabase.from('orders').select('*').eq('id', id).single();
    setRes(data || "Not Found");
  };

  return (
    <div className="min-h-screen bg-black text-white p-10 flex flex-col items-center">
      <Package className="text-orange-500 mb-4" size={40} />
      <h1 className="text-2xl font-black uppercase mb-8 italic">Track My Order</h1>
      <div className="flex gap-2 w-full max-w-sm mb-10">
        <input 
          placeholder="ENTER ORDER ID" 
          className="flex-1 bg-zinc-900 border border-zinc-800 p-3 rounded-xl text-xs uppercase font-black outline-none focus:border-orange-500"
          onChange={(e) => setId(e.target.value)} 
        />
        <button onClick={search} className="bg-orange-600 px-6 rounded-xl hover:bg-orange-500"><Search size={18}/></button>
      </div>

      {res && res !== "Not Found" && (
        <div className="w-full max-w-sm bg-zinc-950 border border-zinc-900 p-6 rounded-[2rem]">
          <p className="text-[10px] font-black text-zinc-500 uppercase">Status: <span className="text-orange-500">Processing</span></p>
          <p className="text-xl font-black mt-2 italic">${res.total_price}</p>
          <div className="mt-4 p-4 bg-black rounded-xl text-xs text-zinc-400 italic border border-zinc-900">{res.items}</div>
        </div>
      )}
    </div>
  );
}