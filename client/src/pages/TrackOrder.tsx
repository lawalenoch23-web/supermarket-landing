import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Search, Package, Clock, Truck, CheckCircle2, X, MapPin, DollarSign, AlertCircle, HelpCircle, Copy, Calendar } from 'lucide-react';

// ✅ Shared date/time formatter
const formatOrderDateTime = (isoString: string): string => {
  if (!isoString) return '—';
  const d = new Date(isoString);
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

export default function TrackOrder() {
  const [id, setId] = useState('');
  const [res, setRes] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [recentOrders, setRecentOrders] = useState<string[]>([]);
  const [showHelp, setShowHelp] = useState(false);
  const [copied, setCopied] = useState(false);

  // ✅ Auto-load active order from localStorage
  useEffect(() => {
    const activeOrderId = localStorage.getItem('active_order_id');
    if (activeOrderId) {
      setId(activeOrderId);
      search(activeOrderId);
    }
    const orderHistory = localStorage.getItem('order_history');
    if (orderHistory) {
      try {
        const parsed = JSON.parse(orderHistory);
        setRecentOrders(Array.isArray(parsed) ? parsed : []);
      } catch (err) {
        console.error('Error loading order history:', err);
      }
    }
  }, []);

  const search = async (searchId?: string) => {
    const queryId = searchId || id;
    if (!queryId.trim()) return;
    setLoading(true);
    setShowHelp(false);
    const cleanId = queryId.replace('#', '').trim();
    const { data, error } = await supabase.from('orders').select('*').eq('id', cleanId).single();
    setRes(data || "Not Found");
    setLoading(false);
  };

  const quickSearch = (orderId: string) => {
    setId(orderId);
    search(orderId);
  };

  const copyOrderId = (orderId: string) => {
    navigator.clipboard.writeText(`${orderId}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStatusSteps = (currentStatus: string) => {
    const statuses = ['PENDING', 'PREPARING', 'READY', 'DONE'];
    const currentIndex = statuses.indexOf(currentStatus);
    return statuses.map((status, index) => ({
      label: status,
      icon: index === 0 ? Clock : index === 1 ? Package : index === 2 ? Truck : CheckCircle2,
      completed: index <= currentIndex,
      active: index === currentIndex,
    }));
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8 md:py-12">

        {/* STICKY HEADER */}
        <div className="sticky top-0 bg-black/95 backdrop-blur-md z-50 pb-6 md:pb-8 mb-8 md:mb-12 border-b border-zinc-900">
          <div className="flex flex-col items-center text-center mb-6">
            <Package className="text-orange-500 mb-4" size={40} />
            <h1 className="text-3xl md:text-4xl font-black italic tracking-tighter uppercase">Track Order</h1>
            <p className="text-zinc-600 text-[10px] font-black uppercase tracking-[0.3em] mt-2">Real-Time Status Updates</p>
          </div>

          {/* SEARCH BAR */}
          <div className="flex gap-2 w-full max-w-2xl mx-auto">
            <div className="flex-1 relative">
              <input
                placeholder="ENTER ORDER ID (e.g., 123 or #123)"
                value={id}
                className="w-full bg-zinc-950 border border-zinc-800 p-4 md:p-5 rounded-2xl text-xs md:text-sm font-black uppercase outline-none focus:border-orange-500 transition-all pl-4"
                onChange={(e) => setId(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && search()}
                onFocus={() => !id && setShowHelp(true)}
                onBlur={() => setTimeout(() => setShowHelp(false), 200)}
              />
              {showHelp && !id && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-900 border border-orange-500/30 p-4 rounded-xl animate-in fade-in slide-in-from-top-2 z-10">
                  <div className="flex items-start gap-2">
                    <HelpCircle size={16} className="text-orange-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-orange-400 mb-1">💡 Where to find your Order ID:</p>
                      <ul className="text-xs text-zinc-400 space-y-1">
                        <li>• Check your downloaded receipt image</li>
                        <li>• Look in your clipboard if you copied it</li>
                        <li>• Check recent orders below</li>
                        <li>• Auto-filled if you came from checkout</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <button onClick={() => search()} disabled={loading} className="bg-orange-600 px-6 md:px-8 rounded-2xl hover:bg-orange-500 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? <div className="animate-spin h-5 w-5 border-2 border-black border-t-transparent rounded-full" /> : <Search size={20} className="text-black" />}
            </button>
          </div>

          {/* Recent Orders Quick Access */}
          {recentOrders.length > 0 && !res && (
            <div className="mt-6 max-w-2xl mx-auto">
              <p className="text-xs font-black text-zinc-600 uppercase mb-3 text-center">📋 Recent Orders</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {recentOrders.slice(0, 3).map((orderId) => (
                  <button key={orderId} onClick={() => quickSearch(orderId)} className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-orange-500 px-4 py-2 rounded-xl text-xs font-black uppercase transition-all active:scale-95 flex items-center gap-2">
                    <Package size={12} className="text-orange-500" /> #{orderId}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* LOADING STATE */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin h-12 w-12 border-4 border-orange-500 border-t-transparent rounded-full mb-4" />
            <p className="text-orange-500 text-sm font-black uppercase animate-pulse">Searching Database...</p>
          </div>
        )}

        {/* NOT FOUND STATE */}
        {res === "Not Found" && !loading && (
          <div className="max-w-lg mx-auto text-center py-20 animate-in fade-in slide-in-from-bottom-4">
            <div className="bg-zinc-950 border border-red-900/30 p-12 rounded-3xl">
              <X size={48} className="text-red-500 mx-auto mb-4" />
              <h3 className="text-2xl font-black uppercase mb-2">Order Not Found</h3>
              <p className="text-zinc-500 text-xs font-bold mb-6">Order ID #{id} doesn't exist. Please check the ID and try again.</p>
              <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl text-left">
                <p className="text-xs font-black text-zinc-400 uppercase mb-2">💡 Tips:</p>
                <ul className="text-xs text-zinc-500 space-y-1">
                  <li>• Make sure you entered the correct ID</li>
                  <li>• Remove any '#' symbol if included</li>
                  <li>• Check your recent orders above</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* ORDER FOUND - TWO PANE LAYOUT */}
        {res && res !== "Not Found" && !loading && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 animate-in fade-in slide-in-from-bottom-4">

            {/* LEFT PANE - ORDER STATUS TIMELINE */}
            <div className="bg-zinc-950 border border-zinc-900 p-6 md:p-8 rounded-3xl">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-xs font-black text-zinc-500 uppercase mb-1">Order ID</p>
                  <div className="flex items-center gap-2">
                    <p className="text-2xl md:text-3xl font-black italic">#{res.id}</p>
                    <button onClick={() => copyOrderId(res.id)} className="text-zinc-600 hover:text-orange-500 transition-colors p-2" title="Copy Order ID">
                      {copied ? <CheckCircle2 size={16} className="text-green-500" /> : <Copy size={16} />}
                    </button>
                  </div>
                </div>
                <div className={`px-4 py-2 rounded-xl text-xs font-black uppercase ${res.status === 'DONE' ? 'bg-green-600/20 text-green-500' : res.status === 'READY' ? 'bg-blue-600/20 text-blue-500' : res.status === 'PREPARING' ? 'bg-yellow-600/20 text-yellow-500' : 'bg-orange-600/20 text-orange-500'}`}>
                  {res.status}
                </div>
              </div>

              {/* ✅ Order placed date/time — prominent display */}
              <div className="bg-zinc-900/60 border border-zinc-800 px-4 py-3 rounded-xl mb-6 flex items-center gap-3">
                <Calendar size={16} className="text-orange-500 flex-shrink-0" />
                <div>
                  <p className="text-[9px] text-zinc-500 font-black uppercase tracking-widest">Order Placed</p>
                  <p className="text-sm font-black text-white">{formatOrderDateTime(res.created_at)}</p>
                </div>
              </div>

              {/* PROGRESS STEPPER */}
              <div className="relative">
                <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-zinc-800" />
                <div className="space-y-6 relative">
                  {getStatusSteps(res.status).map((step) => {
                    const Icon = step.icon;
                    return (
                      <div key={step.label} className="flex items-start gap-4">
                        <div className={`relative z-10 flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all ${step.completed ? 'bg-orange-500 border-orange-500' : 'bg-zinc-900 border-zinc-700'}`}>
                          <Icon size={18} className={step.completed ? 'text-black' : 'text-zinc-600'} />
                        </div>
                        <div className="flex-1 pb-2">
                          <p className={`text-sm font-black uppercase ${step.completed ? 'text-white' : 'text-zinc-600'}`}>{step.label}</p>
                          <p className="text-xs text-zinc-600 font-bold mt-1">{step.completed ? (step.active ? 'In Progress' : 'Completed') : 'Pending'}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ORDER DETAILS */}
              <div className="mt-8 pt-6 border-t border-zinc-900 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-zinc-500 font-black uppercase">Customer</span>
                  <span className="text-xs font-black uppercase">{res.customer_name}</span>
                </div>
                {res.address && res.address !== null && (
                  <div className="flex items-start gap-2 bg-orange-500/5 p-3 rounded-xl border border-orange-500/20">
                    <MapPin size={14} className="text-orange-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-[9px] text-orange-500 font-black uppercase mb-1">Delivery Address</p>
                      <p className="text-xs font-bold mb-2">{res.address}</p>
                      {res.payment_method && (
                        <p className="text-[9px] text-zinc-500 font-bold">Payment: {res.payment_method === 'cash' ? '💵 Cash' : '📱 Transfer'} on delivery</p>
                      )}
                    </div>
                  </div>
                )}
                {(!res.address || res.address === null) && (
                  <div className="bg-blue-500/10 border border-blue-500/30 p-3 rounded-xl text-center">
                    <p className="text-xs text-blue-400 font-black uppercase">📦 Pickup Order</p>
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT PANE - ORDER SUMMARY */}
            <div className="bg-zinc-950 border border-zinc-900 p-6 md:p-8 rounded-3xl">
              <h3 className="text-xl font-black italic uppercase mb-6 flex items-center gap-2">
                <Package size={20} className="text-orange-500" /> Order Summary
              </h3>

              {/* ITEMS LIST */}
              <div className="bg-black/40 border border-zinc-900 rounded-2xl p-5 mb-6">
                <p className="text-[9px] text-zinc-600 font-black uppercase mb-3">Items Ordered</p>
                <div className="space-y-2">
                  {res.items.split(', ').map((item: string, idx: number) => (
                    <div key={idx} className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-orange-500 rounded-full" />
                      <p className="text-sm font-medium">{item}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* PRICING BREAKDOWN */}
              <div className="space-y-3 pb-6 border-b border-zinc-900">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-zinc-500 font-bold uppercase">Products Total</span>
                  <span className="text-sm font-bold">₦{Number(res.total_price).toLocaleString()}</span>
                </div>
                {res.discount_code && res.discount_amount > 0 && (
                  <div className="flex justify-between items-center text-green-500">
                    <span className="text-xs font-bold uppercase">Discount ({res.discount_code})</span>
                    <span className="text-sm font-bold">-₦{Number(res.discount_amount).toFixed(0)}</span>
                  </div>
                )}
                {res.address && res.address !== null && (
                  <>
                    {res.delivery_fee > 0 ? (
                      <div className="bg-green-500/10 border border-green-500/30 p-3 rounded-xl">
                        <div className="flex justify-between items-center mb-2">
                          <div>
                            <p className="text-xs text-green-400 font-black uppercase">Delivery Fee</p>
                            <p className="text-[9px] text-zinc-500 mt-1">Distance: {res.delivery_distance}km</p>
                          </div>
                          <p className="text-lg font-black text-green-500">₦{Number(res.delivery_fee).toLocaleString()}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-yellow-500/10 border border-yellow-500/30 p-3 rounded-xl">
                        <div className="flex items-start gap-2">
                          <AlertCircle size={14} className="text-yellow-500 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs text-yellow-500 font-black uppercase mb-1">Delivery Fee Pending</p>
                            <p className="text-[9px] text-yellow-500/70">Fee will be calculated based on actual distance and collected on delivery</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* TOTAL */}
              <div className="flex justify-between items-center pt-6">
                <span className="text-lg font-black italic uppercase">
                  {res.address && res.address !== null && res.delivery_fee > 0 ? 'Total Amount' : 'Total Paid'}
                </span>
                <span className="text-2xl md:text-3xl font-black italic text-orange-500">₦{(res.final_total || res.total_price).toLocaleString()}</span>
              </div>

              {res.address && res.address !== null && res.delivery_fee === 0 && (
                <div className="mt-4 bg-zinc-900/50 border border-zinc-800 p-3 rounded-xl">
                  <p className="text-[9px] text-zinc-500 text-center font-bold">+ Delivery fee (to be calculated and collected on arrival)</p>
                </div>
              )}

              {/* ACTION BUTTONS */}
              <div className="mt-8 space-y-2">
                <button onClick={() => window.print()} className="w-full bg-zinc-900 hover:bg-zinc-800 text-white py-4 rounded-2xl text-xs font-black uppercase transition-all">Print Receipt</button>
                <button onClick={() => { setRes(null); setId(''); }} className="w-full bg-black border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white py-4 rounded-2xl text-xs font-black uppercase transition-all">Track Another Order</button>
              </div>
            </div>
          </div>
        )}

        {/* EMPTY STATE */}
        {!res && !loading && (
          <div className="max-w-lg mx-auto text-center py-20">
            <div className="bg-zinc-950/50 border border-zinc-900 p-12 md:p-16 rounded-3xl">
              <Package size={64} className="text-zinc-800 mx-auto mb-6" />
              <h3 className="text-2xl font-black italic uppercase mb-3">Track Your Order</h3>
              <p className="text-zinc-600 text-xs font-bold leading-relaxed mb-6">Enter your order ID above to view real-time status updates and delivery information.</p>
              <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl text-left">
                <p className="text-xs font-black text-orange-500 uppercase mb-3 text-center">📋 How to Track</p>
                <div className="space-y-2 text-xs text-zinc-400">
                  <div className="flex gap-2"><span className="text-orange-500 font-black">1.</span><p>Find your Order ID on your receipt</p></div>
                  <div className="flex gap-2"><span className="text-orange-500 font-black">2.</span><p>Enter the ID above (auto-filled from checkout)</p></div>
                  <div className="flex gap-2"><span className="text-orange-500 font-black">3.</span><p>View live updates on your order's status</p></div>
                  <div className="flex gap-2"><span className="text-orange-500 font-black">4.</span><p>See the full date & time your order was placed</p></div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}