import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Search, Package } from 'lucide-react';

export default function TrackOrder() {
  const [id, setId] = useState('');
  const [res, setRes] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const search = async () => {
    setLoading(true);
    // Remove the '#' if the user pasted it with the ID
    const cleanId = id.replace('#', '').trim();

    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', cleanId)
      .single();

    setRes(data || "Not Found");
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-black text-white p-10 flex flex-col items-center font-black uppercase italic">
      <Package className="text-orange-500 mb-4" size={40} />
      <h1 className="text-2xl mb-8 tracking-tighter">Track My Order</h1>

      <div className="flex gap-2 w-full max-w-sm mb-10">
        <input 
          placeholder="ENTER ORDER ID" 
          className="flex-1 bg-zinc-900 border border-zinc-800 p-4 rounded-xl text-[10px] outline-none focus:border-orange-500 transition-all"
          onChange={(e) => setId(e.target.value)} 
        />
        <button 
          onClick={search} 
          className="bg-orange-600 px-6 rounded-xl hover:bg-orange-500 transition-colors"
        >
          <Search size={18} className="text-black" />
        </button>
      </div>

      {loading && <p className="text-orange-500 text-[10px] animate-pulse">Searching Database...</p>}

      {res && res !== "Not Found" && (
        <div className="w-full max-w-sm bg-zinc-950 border border-zinc-900 p-8 rounded-[2.5rem] animate-in fade-in slide-in-from-bottom-4">
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="text-[9px] text-zinc-500 mb-1">Current Status</p>
              {/* This now pulls the REAL status: PENDING, READY, etc. */}
              <p className="text-sm text-orange-500">{res.status}</p>
            </div>
            <div className="text-right">
              <p className="text-[9px] text-zinc-500 mb-1">Total</p>
              {/* Changed to Naira (₦) and formatted with commas */}
              <p className="text-lg">₦{Number(res.total_price).toLocaleString()}</p>
            </div>
          </div>

          <div className="p-4 bg-black rounded-2xl border border-zinc-900">
            <p className="text-[9px] text-zinc-600 mb-2">Order Summary</p>
            <p className="text-[10px] text-zinc-400 normal-case leading-relaxed">
              {res.items}
            </p>
          </div>
        </div>
      )}

      {res === "Not Found" && (
        <p className="text-red-500 text-[10px]">Order ID not found. Please check and try again.</p>
      )}
    </div>
  );
}