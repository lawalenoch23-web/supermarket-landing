import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import {
  Package, Phone, MapPin, User, Clock, CheckCircle2,
  Truck, AlertCircle, LogOut, RefreshCw, X, DollarSign
} from 'lucide-react';

const formatOrderDateTime = (isoString: string): string => {
  if (!isoString) return '—';
  const d = new Date(isoString);
  return d.toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
};

export default function Delivery() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<number | null>(null);
  const [distanceInput, setDistanceInput] = useState('');
  const [feeInput, setFeeInput] = useState('');
  const [showFeeCalculator, setShowFeeCalculator] = useState<number | null>(null);
  const [deliveryFeePerKm, setDeliveryFeePerKm] = useState(150);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const yesterday = new Date();
      yesterday.setHours(yesterday.getHours() - 24);
      const { data: activeData } = await supabase.from('orders').select('*').not('address', 'is', null)
        .in('status', ['READY', 'OUT_FOR_DELIVERY']).order('created_at', { ascending: false });
      const { data: doneData } = await supabase.from('orders').select('*').not('address', 'is', null)
        .in('status', ['DONE', 'COMPLETED']).gte('created_at', yesterday.toISOString())
        .order('created_at', { ascending: false });
      setOrders([...(activeData || []), ...(doneData || [])]);
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDeliveryRate = async () => {
    try {
      const { data } = await supabase.from('store_settings').select('delivery_fee_per_km').eq('id', 1).single();
      if (data) setDeliveryFeePerKm(data.delivery_fee_per_km || 150);
    } catch (err) { console.error('Error fetching delivery rate:', err); }
  };

  useEffect(() => {
    fetchOrders();
    fetchDeliveryRate();
    const channel = supabase.channel('delivery-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => fetchOrders())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleLogout = () => {
    if (confirm('Are you sure you want to logout?')) {
      localStorage.removeItem('delivery_session');
      localStorage.removeItem('delivery_session_time');
      window.location.href = '/login';
    }
  };

  const updateOrderStatus = async (orderId: number, newStatus: string) => {
    setUpdating(orderId);
    try {
      const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
      if (error) throw error;
      await fetchOrders();
    } catch { alert('Failed to update order status. Please try again.'); }
    finally { setUpdating(null); }
  };

  const activeOrders = orders.filter(o => o.status === 'READY' || o.status === 'OUT_FOR_DELIVERY');
  const completedOrders = orders.filter(o => o.status === 'DONE' || o.status === 'COMPLETED');

  const statusBadge = (status: string) => {
    switch (status) {
      case 'READY': return 'bg-green-500/15 text-green-400 border-green-500/25';
      case 'OUT_FOR_DELIVERY': return 'bg-orange-500/15 text-orange-400 border-orange-500/25';
      case 'DONE': return 'bg-amber-500/15 text-amber-400 border-amber-500/25';
      case 'COMPLETED': return 'bg-purple-500/15 text-purple-400 border-purple-500/25';
      default: return 'bg-zinc-800 text-zinc-400 border-zinc-700';
    }
  };

  // ── ORDER CARD ──
  const OrderCard = ({ order, isCompleted = false }: { order: any; isCompleted?: boolean }) => (
    <div className={`border rounded-2xl overflow-hidden transition-all ${isCompleted ? 'bg-zinc-950/50 border-zinc-900' : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'}`}>

      {showFeeCalculator === order.id && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="bg-[#0f0f0f] border border-zinc-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-zinc-800">
              <h3 className="text-sm font-black uppercase flex items-center gap-2"><DollarSign size={14} className="text-blue-500" /> Delivery Fee</h3>
              <button onClick={() => { setShowFeeCalculator(null); setDistanceInput(''); setFeeInput(''); }}
                className="text-zinc-500 hover:text-white transition-colors"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-3">
                <p className="text-[10px] text-zinc-500 font-bold">Rate: ₦{deliveryFeePerKm}/km + ₦200 base. Fee is auto-calculated and cannot be changed.</p>
              </div>
              <div>
                <label className="text-[10px] font-black text-zinc-500 uppercase mb-2 block">Distance Traveled (km)</label>
                <input type="number" step="0.1" value={distanceInput}
                  onChange={(e) => {
                    setDistanceInput(e.target.value);
                    const distance = parseFloat(e.target.value) || 0;
                    setFeeInput((200 + (distance * deliveryFeePerKm)).toFixed(2));
                  }}
                  placeholder="e.g. 5.2"
                  className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-blue-500/60 transition-all" />
              </div>
              {feeInput && (
                <div className="bg-blue-500/8 border border-blue-500/20 p-4 rounded-xl text-center">
                  <p className="text-[10px] text-blue-400 font-black uppercase mb-1 tracking-wider">Calculated Fee</p>
                  <p className="text-3xl font-black text-blue-400">₦{parseFloat(feeInput).toLocaleString()}</p>
                  <p className="text-[10px] text-zinc-600 mt-1.5">₦200 base + {distanceInput}km × ₦{deliveryFeePerKm}/km</p>
                  <div className="mt-2 flex items-center justify-center gap-1.5 bg-zinc-900 rounded-lg px-3 py-1.5">
                    <CheckCircle2 size={11} className="text-zinc-500" />
                    <p className="text-[10px] text-zinc-500 font-bold uppercase">Read-only — set by store</p>
                  </div>
                </div>
              )}
              <button
                disabled={!distanceInput || !feeInput}
                onClick={async () => {
                  if (!distanceInput || !feeInput) { alert('Please enter the distance'); return; }
                  const deliveryFee = parseFloat(feeInput);
                  const finalTotal = (order.total_price || 0) + deliveryFee;
                  const { error } = await supabase.from('orders').update({
                    delivery_distance: parseFloat(distanceInput),
                    delivery_fee: deliveryFee,
                    final_total: finalTotal
                  }).eq('id', order.id);
                  if (error) alert('Failed to update: ' + error.message);
                  else { setShowFeeCalculator(null); setDistanceInput(''); setFeeInput(''); fetchOrders(); }
                }}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 disabled:text-zinc-600 disabled:cursor-not-allowed text-white py-3.5 rounded-xl font-black uppercase text-sm tracking-wider transition-all active:scale-95">
                Confirm Fee — ₦{feeInput ? parseFloat(feeInput).toLocaleString() : '0'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="p-4 md:p-5">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-black text-zinc-500">Order #{order.id}</span>
              <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase border ${statusBadge(order.status)}`}>
                {order.status.replace('_', ' ')}
              </span>
            </div>
            <p className="text-[10px] text-orange-400 font-bold flex items-center gap-1">
              <Clock size={9} /> {formatOrderDateTime(order.created_at)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[9px] text-zinc-600 font-bold uppercase">Products</p>
            <p className="text-lg font-black text-orange-500">₦{order.total_price?.toLocaleString()}</p>
          </div>
        </div>

        {order.status === 'DONE' && (
          <div className="flex items-center gap-2.5 bg-amber-500/8 border border-amber-500/20 rounded-xl px-3 py-2.5 mb-3">
            <Clock size={13} className="text-amber-400 flex-shrink-0" />
            <div>
              <p className="text-xs font-black text-amber-400">Waiting for Customer Confirmation</p>
              <p className="text-[10px] text-zinc-600 mt-0.5">Customer confirms on Track Order page</p>
            </div>
          </div>
        )}
        {order.status === 'COMPLETED' && (
          <div className="flex items-center gap-2.5 bg-green-500/8 border border-green-500/20 rounded-xl px-3 py-2.5 mb-3">
            <CheckCircle2 size={13} className="text-green-400 flex-shrink-0" />
            <div>
              <p className="text-xs font-black text-green-400">Customer Confirmed Receipt</p>
              <p className="text-[10px] text-zinc-600 mt-0.5">Order fully completed</p>
            </div>
          </div>
        )}

        <div className="bg-black/40 border border-zinc-900 rounded-xl p-3.5 mb-3 space-y-2.5">
          <div className="flex items-center gap-2">
            <User size={13} className="text-blue-500 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black text-white">{order.customer_name}</p>
              {order.phone_number && <p className="text-[10px] text-green-400 font-bold mt-0.5">📞 {order.phone_number}</p>}
            </div>
          </div>
          <div className="flex items-start gap-2">
            <MapPin size={13} className="text-green-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-zinc-300 leading-relaxed">{order.address}</p>
              {order.payment_method && (
                <p className="text-[10px] text-zinc-500 mt-1 font-semibold">
                  {order.payment_method === 'cash' ? '💵 Cash' : '📱 Transfer'} on delivery
                </p>
              )}
            </div>
          </div>
        </div>

        {order.payment_status === 'unpaid' && order.address && (
          <div className="flex items-center gap-2 bg-orange-500/8 border border-orange-500/20 rounded-xl px-3 py-2.5 mb-3">
            <DollarSign size={13} className="text-orange-400 flex-shrink-0" />
            <div>
              <p className="text-xs font-black text-orange-400">Collect Payment</p>
              <p className="text-[10px] text-zinc-600">₦{(order.total_price || 0).toLocaleString()} on delivery</p>
            </div>
          </div>
        )}

        {order.delivery_fee > 0 && (
          <div className="bg-green-500/8 border border-green-500/20 rounded-xl p-3 mb-3">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-xs font-black text-green-400">Delivery Fee</span>
              <span className="text-base font-black text-green-400">₦{order.delivery_fee.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-[10px] text-zinc-600">
              <span>Distance: {order.delivery_distance}km</span>
              <span>Total: ₦{(order.final_total || 0).toLocaleString()}</span>
            </div>
          </div>
        )}

        <div className="bg-black/30 border border-zinc-900 rounded-xl px-3 py-2.5 mb-4">
          <p className="text-[9px] text-zinc-600 font-black uppercase mb-1.5">Items</p>
          <p className="text-xs text-zinc-400 leading-relaxed">{order.items}</p>
        </div>

        <div className="space-y-2.5">
          {order.delivery_fee === 0 && !isCompleted && (
            <button onClick={() => setShowFeeCalculator(order.id)}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3.5 rounded-xl font-black uppercase text-xs tracking-wider flex items-center justify-center gap-2 transition-all active:scale-95">
              <DollarSign size={15} /> Calculate Delivery Fee
            </button>
          )}

          {order.phone_number && (
            <a href={`tel:${order.phone_number}`}
              className={`w-full py-3.5 rounded-xl font-black uppercase text-xs tracking-wider flex items-center justify-center gap-2 transition-all active:scale-95 border ${
                isCompleted
                  ? 'bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-zinc-400'
                  : 'bg-green-600 hover:bg-green-500 border-green-500 text-white shadow-lg shadow-green-500/15'
              }`}>
              <Phone size={15} /> Call {order.customer_name.split(' ')[0]}
            </a>
          )}

          {order.status === 'READY' && (
            <>
              {!order.delivery_fee && (
                <div className="flex items-center gap-2 bg-red-500/8 border border-red-500/20 rounded-xl px-3 py-2.5">
                  <AlertCircle size={13} className="text-red-400 flex-shrink-0" />
                  <p className="text-xs font-black text-red-400">Calculate fee before accepting</p>
                </div>
              )}
              <button
                onClick={() => updateOrderStatus(order.id, 'OUT_FOR_DELIVERY')}
                disabled={updating === order.id || !order.delivery_fee}
                className="w-full bg-orange-600 hover:bg-orange-500 disabled:bg-zinc-800 disabled:text-zinc-600 disabled:cursor-not-allowed text-black py-4 rounded-xl font-black uppercase text-sm tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-orange-500/20">
                <Truck size={18} /> Accept Delivery
              </button>
            </>
          )}

          {order.status === 'OUT_FOR_DELIVERY' && (
            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => updateOrderStatus(order.id, 'DONE')}
                disabled={updating === order.id || !order.delivery_fee}
                title={!order.delivery_fee ? 'Calculate fee first' : ''}
                className="bg-green-600 hover:bg-green-500 disabled:bg-zinc-800 disabled:text-zinc-600 disabled:cursor-not-allowed text-white py-3.5 rounded-xl font-black uppercase text-xs tracking-wide flex flex-col items-center justify-center gap-1 transition-all active:scale-95">
                <CheckCircle2 size={16} /> Mark Delivered
              </button>
              <button onClick={() => updateOrderStatus(order.id, 'READY')} disabled={updating === order.id}
                className="bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white py-3.5 rounded-xl font-black uppercase text-xs tracking-wide flex flex-col items-center justify-center gap-1 transition-all active:scale-95">
                <Package size={16} /> Return to Queue
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // ── MAIN VIEW ──
  return (
    <div className="min-h-screen bg-[#080808] text-white pb-10">
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <header className="sticky top-0 bg-[#080808]/97 backdrop-blur-xl border-b border-zinc-900 z-40">
        <div className="px-4 md:px-6 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-blue-500/12 border border-blue-500/20 rounded-xl flex items-center justify-center">
                <Truck size={17} className="text-blue-500" />
              </div>
              <div>
                <h1 className="text-lg font-black uppercase tracking-tight leading-none">Deliveries</h1>
                <p className="text-[10px] text-zinc-600 font-semibold uppercase tracking-wider">Driver Portal</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={fetchOrders} disabled={loading}
                className="w-9 h-9 flex items-center justify-center bg-zinc-900 border border-zinc-800 rounded-xl hover:bg-zinc-800 transition-all active:scale-95 disabled:opacity-50">
                <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
              </button>
              <button onClick={handleLogout}
                className="w-9 h-9 flex items-center justify-center bg-zinc-900 border border-zinc-800 rounded-xl hover:bg-red-600/20 hover:border-red-500/30 text-zinc-400 hover:text-red-400 transition-all active:scale-95">
                <LogOut size={15} />
              </button>
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {[
              { icon: <Package size={12} className="text-orange-500" />, label: 'Active', val: activeOrders.length, col: 'text-white' },
              { icon: <Clock size={12} className="text-green-500" />, label: 'Ready', val: activeOrders.filter(o => o.status === 'READY').length, col: 'text-green-400' },
              { icon: <Truck size={12} className="text-orange-500" />, label: 'En Route', val: activeOrders.filter(o => o.status === 'OUT_FOR_DELIVERY').length, col: 'text-orange-400' },
              { icon: <CheckCircle2 size={12} className="text-purple-500" />, label: 'Done Today', val: completedOrders.length, col: 'text-purple-400' },
            ].map(s => (
              <div key={s.label} className="flex items-center gap-1.5 bg-zinc-950 border border-zinc-900 px-3 py-2 rounded-xl whitespace-nowrap flex-shrink-0">
                {s.icon}
                <span className={`text-xs font-black ${s.col}`}>{s.val}</span>
                <span className="text-[10px] text-zinc-600 font-bold">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </header>

      <div className="p-4 md:p-6 space-y-4 max-w-xl mx-auto">
        {loading && orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="animate-spin h-10 w-10 border-[3px] border-blue-500 border-t-transparent rounded-full mb-4" />
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-wide">Loading deliveries...</p>
          </div>
        ) : (
          <>
            {activeOrders.length === 0 ? (
              <div className="bg-zinc-950 border border-zinc-800 p-10 rounded-2xl text-center">
                <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 size={22} className="text-green-500" />
                </div>
                <h3 className="text-lg font-black uppercase mb-1">All Caught Up!</h3>
                <p className="text-zinc-600 text-xs font-medium">No active deliveries right now.</p>
              </div>
            ) : (
              activeOrders.map(order => <OrderCard key={order.id} order={order} isCompleted={false} />)
            )}

            {completedOrders.length > 0 && (
              <div className="mt-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex-1 h-px bg-zinc-900" />
                  <p className="text-[10px] font-black text-zinc-600 uppercase tracking-wider whitespace-nowrap">
                    ✅ Completed Today ({completedOrders.length})
                  </p>
                  <div className="flex-1 h-px bg-zinc-900" />
                </div>
                <div className="space-y-3">
                  {completedOrders.map(order => <OrderCard key={order.id} order={order} isCompleted={true} />)}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}