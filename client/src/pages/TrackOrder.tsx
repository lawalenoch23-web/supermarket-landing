import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useTheme } from '../components/ThemeProvider';
import { Search, Package, Clock, Truck, CheckCircle2, X, MapPin, AlertCircle, HelpCircle, Copy, Calendar, ArrowLeft } from 'lucide-react';

const formatOrderDateTime = (isoString: string): string => {
  if (!isoString) return '—';
  const d = new Date(isoString);
  return d.toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
};

export default function TrackOrder() {
  const theme = useTheme();
  const [id, setId] = useState('');
  const [res, setRes] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [recentOrders, setRecentOrders] = useState<string[]>([]);
  const [showHelp, setShowHelp] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const activeOrderId = localStorage.getItem('active_order_id');
    if (activeOrderId) { setId(activeOrderId); search(activeOrderId); }
    const orderHistory = localStorage.getItem('order_history');
    if (orderHistory) {
      try {
        const parsed = JSON.parse(orderHistory);
        setRecentOrders(Array.isArray(parsed) ? parsed : []);
      } catch (err) { console.error('Error loading order history:', err); }
    }
  }, []);

  const search = async (searchId?: string) => {
    const queryId = searchId || id;
    if (!queryId.trim()) return;
    setLoading(true);
    setShowHelp(false);
    const cleanId = queryId.replace('#', '').trim();
    const { data } = await supabase.from('orders').select('*').eq('id', cleanId).single();
    setRes(data || 'Not Found');
    if (data) autoCancelIfExpired(data);
    setLoading(false);
  };

  const quickSearch = (orderId: string) => { setId(orderId); search(orderId); };

  const copyOrderId = (orderId: string) => {
    navigator.clipboard.writeText(`${orderId}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStatusSteps = (currentStatus: string, isDelivery: boolean) => {
    if (currentStatus === 'CANCELLED') {
      return [{ label: 'CANCELLED', icon: X, completed: true, active: false }];
    }
    const base = isDelivery
      ? ['AWAITING_CONFIRMATION', 'PENDING', 'PREPARING', 'READY', 'DONE', 'COMPLETED']
      : ['PENDING', 'PREPARING', 'READY', 'DONE', 'COMPLETED'];
    const mappedStatus = currentStatus === 'OUT_FOR_DELIVERY' ? 'READY' : currentStatus;
    const currentIndex = base.indexOf(mappedStatus);
    const icons = isDelivery
      ? [AlertCircle, Clock, Package, Truck, CheckCircle2, CheckCircle2]
      : [Clock, Package, Truck, CheckCircle2, CheckCircle2];
    const labels: Record<string, string> = {
      AWAITING_CONFIRMATION: 'CONFIRM ORDER',
      PENDING: 'PENDING',
      PREPARING: 'PREPARING',
      READY: 'READY',
      DONE: 'DELIVERED',
      COMPLETED: 'CONFIRMED',
    };
    return base.map((status, index) => ({
      label: labels[status] || status,
      icon: icons[index],
      completed: index <= currentIndex,
      active: index === currentIndex,
    }));
  };

  const confirmReceipt = async (orderId: number) => {
    if (!confirm('Confirm that you have received your order?')) return;
    try {
      const { error } = await supabase.from('orders').update({ status: 'COMPLETED' }).eq('id', orderId);
      if (error) throw error;
      if (typeof res === 'object' && res !== null) setRes({ ...res, status: 'COMPLETED' });
      alert('✅ Thank you for confirming! Order marked as completed.');
    } catch (err: any) {
      alert('Failed to confirm: ' + err.message);
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
        // Add these two cases inside the statusColor switch:
      case 'AWAITING_CONFIRMATION': return 'bg-yellow-500/15 text-yellow-400 border-yellow-500/25';
      case 'CANCELLED': return 'bg-red-500/15 text-red-400 border-red-500/25';
      case 'PENDING': return 'bg-amber-500/15 text-amber-400 border-amber-500/25';
      case 'PREPARING': return 'bg-blue-500/15 text-blue-400 border-blue-500/25';
      case 'READY': return 'bg-green-500/15 text-green-400 border-green-500/25';
      case 'DONE': return 'bg-orange-500/15 text-orange-400 border-orange-500/25';
      case 'COMPLETED': return 'bg-purple-500/15 text-purple-400 border-purple-500/25';
      default: return 'bg-zinc-800 text-zinc-400 border-zinc-700';
    }
  };

  const autoCancelIfExpired = async (order: any) => {
    if (order.status !== 'AWAITING_CONFIRMATION') return;
    const age = (Date.now() - new Date(order.created_at).getTime()) / 1000;
    if (age > 900) { // 15 minutes
      await supabase.from('orders').update({ status: 'CANCELLED' }).eq('id', order.id);
      setRes({ ...order, status: 'CANCELLED' });
    }
  };

  const confirmFromTrackPage = async (orderId: number) => {
    if (!confirm('Confirm this is your order and you want to proceed?')) return;
    const { error } = await supabase.from('orders').update({ status: 'PENDING' }).eq('id', orderId);
    if (!error) setRes((prev: any) => ({ ...prev, status: 'PENDING' }));
    else alert('Failed to confirm. Please try again.');
  };
  
  return (
    <div className="min-h-screen font-sans" style={{ background: 'var(--bg-color)', color: 'var(--text-color)' }}>
      <style>{`
        .trk-scroll::-webkit-scrollbar { width: 4px; }
        .trk-scroll::-webkit-scrollbar-track { background: transparent; }
        .trk-scroll::-webkit-scrollbar-thumb { background: var(--primary-color); border-radius: 99px; opacity: 0.4; }
        @keyframes slide-up { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        .slide-up { animation: slide-up 0.35s ease both; }
        .trk-input { background: var(--input-bg); border-color: var(--input-border); color: var(--text-color); }
        .trk-input:focus { border-color: var(--primary-color); }
        .trk-card { background: var(--card-bg); border-color: var(--card-border); }
        .trk-nav { background: var(--nav-bg); border-color: var(--card-border); }
      `}</style>

      {/* ── BRANDED NAV ── */}
      <nav className="sticky top-0 z-50 trk-nav backdrop-blur-xl border-b">
        <div className="max-w-3xl mx-auto px-4 md:px-6 h-14 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2.5 group">
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

      {/* ── STICKY SEARCH HEADER ── */}
      <div className="sticky top-14 z-40 backdrop-blur-xl border-b trk-nav">
        <div className="max-w-3xl mx-auto px-4 md:px-6 py-5 md:py-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'color-mix(in srgb, var(--primary-color) 12%, transparent)', border: '1px solid color-mix(in srgb, var(--primary-color) 20%, transparent)' }}>
              <Package size={17} style={{ color: 'var(--primary-color)' }} />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black uppercase tracking-tight leading-none" style={{ color: 'var(--text-color)' }}>Track Order</h1>
              <p className="text-[10px] font-semibold uppercase tracking-widest mt-0.5" style={{ color: 'var(--text-muted)' }}>Real-time updates</p>
            </div>
          </div>

          {/* Search */}
          <div className="flex gap-2 relative">
            <div className="flex-1 relative">
              <input
                placeholder="Order ID (e.g. 123 or #123)"
                value={id}
                className="trk-input w-full border rounded-xl py-3.5 pl-4 pr-4 text-sm font-semibold outline-none transition-all"
                onChange={(e) => setId(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && search()}
                onFocus={() => !id && setShowHelp(true)}
                onBlur={() => setTimeout(() => setShowHelp(false), 200)}
              />
              {showHelp && !id && (
                <div className="absolute top-full left-0 right-0 mt-2 border p-4 rounded-xl z-10 shadow-xl trk-card"
                  style={{ borderColor: 'color-mix(in srgb, var(--primary-color) 20%, transparent)' }}>
                  <div className="flex items-start gap-2">
                    <HelpCircle size={14} style={{ color: 'var(--primary-color)' }} className="flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold mb-1.5" style={{ color: 'var(--primary-color)' }}>Where's my Order ID?</p>
                      <ul className="text-xs space-y-1" style={{ color: 'var(--text-muted)' }}>
                        <li>• Auto-filled if you came from checkout</li>
                        <li>• On your downloaded receipt image</li>
                        <li>• In your clipboard if you copied it</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <button onClick={() => search()} disabled={loading}
              className="px-5 rounded-xl transition-all active:scale-95 flex items-center justify-center min-w-[52px] disabled:opacity-50"
              style={{ background: 'var(--primary-color)' }}>
              {loading
                ? <div className="animate-spin h-4 w-4 border-2 border-black border-t-transparent rounded-full" />
                : <Search size={18} className="text-black" />
              }
            </button>
          </div>

          {/* Recent orders */}
          {recentOrders.length > 0 && !res && (
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="text-[10px] font-bold uppercase self-center mr-1" style={{ color: 'var(--text-muted)' }}>Recent:</span>
              {recentOrders.slice(0, 3).map((orderId) => (
                <button key={orderId} onClick={() => quickSearch(orderId)}
                  className="flex items-center gap-1.5 border px-3 py-1.5 rounded-lg text-xs font-black transition-all active:scale-95 trk-card"
                  style={{ color: 'var(--text-color)' }}>
                  <Package size={10} style={{ color: 'var(--primary-color)' }} /> #{orderId}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 md:px-6 py-6 md:py-8">

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="animate-spin h-10 w-10 border-[3px] border-t-transparent rounded-full mb-4"
              style={{ borderColor: 'var(--primary-color)', borderTopColor: 'transparent' }} />
            <p className="text-xs font-black uppercase tracking-widest animate-pulse" style={{ color: 'var(--primary-color)' }}>Searching...</p>
          </div>
        )}

        {/* Not Found */}
        {res === 'Not Found' && !loading && (
          <div className="max-w-sm mx-auto text-center py-16 slide-up">
            <div className="border p-10 rounded-2xl trk-card" style={{ borderColor: 'rgba(239,68,68,0.15)' }}>
              <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <X size={22} className="text-red-500" />
              </div>
              <h3 className="text-lg font-black uppercase mb-2" style={{ color: 'var(--text-color)' }}>Not Found</h3>
              <p className="text-xs font-medium mb-5" style={{ color: 'var(--text-muted)' }}>Order #{id} doesn't exist. Please check the ID.</p>
              <div className="border p-4 rounded-xl text-left space-y-1.5" style={{ background: 'rgba(0,0,0,0.2)', borderColor: 'var(--card-border)' }}>
                {['Double-check the order number', "Remove '#' if included", 'Try a recent order from the list above'].map(tip => (
                  <p key={tip} className="text-xs flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
                    <span className="w-1 h-1 rounded-full flex-shrink-0" style={{ background: 'var(--primary-color)' }} />{tip}
                  </p>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Order Found */}
        {res && res !== 'Not Found' && !loading && (
          <div className="space-y-4 slide-up">

            {/* ORDER HEADER CARD */}
            <div className="border rounded-2xl p-5 md:p-6 trk-card">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Order Reference</p>
                  <div className="flex items-center gap-2">
                    <h2 className="text-3xl md:text-4xl font-black tracking-tight" style={{ color: 'var(--text-color)' }}>#{res.id}</h2>
                    <button onClick={() => copyOrderId(res.id)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg border transition-all"
                      style={{ background: 'var(--input-bg)', borderColor: 'var(--card-border)', color: 'var(--text-muted)' }}>
                      {copied ? <CheckCircle2 size={14} className="text-green-500" /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>
                <div className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase border ${statusColor(res.status)}`}>
                  {res.status.replace('_', ' ')}
                </div>
              </div>
              <div className="flex items-center gap-2.5 border px-4 py-3 rounded-xl"
                style={{ background: 'rgba(0,0,0,0.2)', borderColor: 'var(--card-border)' }}>
                <Calendar size={14} style={{ color: 'var(--primary-color)' }} className="flex-shrink-0" />
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Order Placed</p>
                  <p className="text-sm font-bold mt-0.5" style={{ color: 'var(--text-color)' }}>{formatOrderDateTime(res.created_at)}</p>
                </div>
              </div>
            </div>

            {/* PROGRESS STEPPER */}
            <div className="border rounded-2xl p-5 md:p-6 trk-card">
              <p className="text-[10px] font-black uppercase tracking-wider mb-5" style={{ color: 'var(--text-muted)' }}>Order Progress</p>
              <div className="relative">
                <div className="absolute left-4 top-4 bottom-4 w-px" style={{ background: 'var(--card-border)' }} />
                <div className="space-y-5 relative">
                  {getStatusSteps(res.status, !!res.address).map((step) => {
                    const Icon = step.icon;
                    return (
                      <div key={step.label} className="flex items-center gap-4">
                        <div className="relative z-10 w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all"
                          style={step.completed
                            ? { background: 'var(--primary-color)', borderColor: 'var(--primary-color)', boxShadow: '0 0 12px color-mix(in srgb, var(--primary-color) 30%, transparent)' }
                            : { background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
                          <Icon size={14} style={{ color: step.completed ? '#000' : 'var(--text-muted)' }} />
                        </div>
                        <div className="flex-1 flex items-center justify-between">
                          <div>
                            <p className="text-sm font-black uppercase" style={{ color: step.completed ? 'var(--text-color)' : 'var(--text-muted)' }}>{step.label}</p>
                            <p className="text-[10px] font-semibold mt-0.5" style={{ color: 'var(--text-muted)' }}>
                              {step.active ? '⟶ In progress' : step.completed ? 'Done' : 'Waiting'}
                            </p>
                          </div>
                          {step.active && <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: 'var(--primary-color)' }} />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {res.status === 'AWAITING_CONFIRMATION' && (
                <div className="mt-5 rounded-xl p-4" style={{ background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.2)' }}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 bg-yellow-500/15 rounded-lg flex items-center justify-center flex-shrink-0">
                      <AlertCircle size={15} className="text-yellow-400" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-yellow-400">Action Required</p>
                      <p className="text-xs text-zinc-500 mt-0.5">Confirm your order to notify the driver</p>
                    </div>
                  </div>
                  <button onClick={() => confirmFromTrackPage(res.id)}
                    className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-black py-3.5 rounded-xl uppercase text-sm tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2">
                    ✅ Confirm My Order
                  </button>
                </div>
              )}

              {res.status === 'CANCELLED' && (
                <div className="mt-5 rounded-xl p-4 text-center" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                  <p className="text-sm font-black text-red-400">✗ Order Cancelled</p>
                  <p className="text-xs text-zinc-500 mt-1">This order expired before confirmation. Please place a new order.</p>
                </div>
              )}

              {/* Confirm Receipt */}
              {(res.status === 'DONE' || res.status === 'OUT_FOR_DELIVERY') && (
                <div className="mt-5 rounded-xl p-4" style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 bg-green-500/15 rounded-lg flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 size={15} className="text-green-500" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-green-400">Order Delivered!</p>
                      <p className="text-xs text-zinc-500 mt-0.5">Please confirm you received your order</p>
                    </div>
                  </div>
                  <button onClick={() => confirmReceipt(res.id)}
                    className="w-full bg-green-600 hover:bg-green-500 text-white font-black py-3.5 rounded-xl uppercase text-sm tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2">
                    <CheckCircle2 size={16} /> Confirm Receipt
                  </button>
                </div>
              )}

              {res.status === 'COMPLETED' && (
                <div className="mt-5 rounded-xl p-4 text-center" style={{ background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.2)' }}>
                  <p className="text-sm font-black text-purple-400">✓ Order Completed</p>
                  <p className="text-xs text-zinc-500 mt-1">Thank you for your confirmation!</p>
                </div>
              )}
            </div>

            {/* ORDER DETAILS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border rounded-2xl p-5 trk-card">
                <p className="text-[10px] font-black uppercase tracking-wider mb-4" style={{ color: 'var(--text-muted)' }}>Customer Info</p>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Name</span>
                    <span className="text-sm font-black uppercase" style={{ color: 'var(--text-color)' }}>{res.customer_name}</span>
                  </div>
                  {res.address ? (
                    <div className="p-3 rounded-xl" style={{ background: 'color-mix(in srgb, var(--primary-color) 5%, transparent)', border: '1px solid color-mix(in srgb, var(--primary-color) 15%, transparent)' }}>
                      <div className="flex items-start gap-2">
                        <MapPin size={13} style={{ color: 'var(--primary-color)' }} className="flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-[9px] font-black uppercase mb-1" style={{ color: 'var(--primary-color)' }}>Delivery Address</p>
                          <p className="text-xs font-bold leading-relaxed" style={{ color: 'var(--text-color)' }}>{res.address}</p>
                          {res.payment_method && (
                            <p className="text-[10px] mt-1.5 font-semibold" style={{ color: 'var(--text-muted)' }}>
                              {res.payment_method === 'cash' ? '💵 Cash' : '📱 Transfer'} on delivery
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl text-center" style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)' }}>
                      <p className="text-xs text-blue-400 font-black uppercase">📦 Pickup Order</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="border rounded-2xl p-5 trk-card">
                <p className="text-[10px] font-black uppercase tracking-wider mb-4" style={{ color: 'var(--text-muted)' }}>Order Summary</p>
                <div className="border rounded-xl p-3 mb-3 max-h-28 overflow-y-auto trk-scroll"
                  style={{ background: 'rgba(0,0,0,0.2)', borderColor: 'var(--card-border)' }}>
                  <p className="text-[9px] font-black uppercase mb-2" style={{ color: 'var(--text-muted)' }}>Items</p>
                  <div className="space-y-1.5">
                    {res.items.split(', ').map((item: string, idx: number) => (
                      <div key={idx} className="flex items-center gap-2">
                        <div className="w-1 h-1 rounded-full flex-shrink-0" style={{ background: 'var(--primary-color)' }} />
                        <p className="text-xs font-medium" style={{ color: 'var(--text-color)' }}>{item}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Products</span>
                    <span className="text-sm font-bold" style={{ color: 'var(--text-color)' }}>₦{Number(res.total_price).toLocaleString()}</span>
                  </div>
                  {res.discount_code && res.discount_amount > 0 && (
                    <div className="flex justify-between text-green-500">
                      <span className="text-xs font-bold">Discount ({res.discount_code})</span>
                      <span className="text-sm font-bold">−₦{Number(res.discount_amount).toFixed(0)}</span>
                    </div>
                  )}
                  {res.address && res.delivery_fee > 0 ? (
                    <div className="flex justify-between text-blue-400">
                      <span className="text-xs font-bold">Delivery ({res.delivery_distance}km)</span>
                      <span className="text-sm font-bold">₦{Number(res.delivery_fee).toLocaleString()}</span>
                    </div>
                  ) : res.address ? (
                    <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
                      <AlertCircle size={11} className="text-amber-500 flex-shrink-0" />
                      <p className="text-[10px] text-amber-400 font-semibold">Delivery fee calculated on arrival</p>
                    </div>
                  ) : null}
                  <div className="flex justify-between items-center pt-2 border-t mt-1" style={{ borderColor: 'var(--card-border)' }}>
                    <span className="text-sm font-black uppercase" style={{ color: 'var(--text-color)' }}>Total</span>
                    <span className="text-xl font-black" style={{ color: 'var(--primary-color)' }}>₦{(res.final_total || res.total_price).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button onClick={() => window.print()}
                className="flex-1 border py-3.5 rounded-xl text-xs font-black uppercase tracking-wide transition-all trk-card"
                style={{ color: 'var(--text-color)' }}>
                Print Receipt
              </button>
              <button onClick={() => { setRes(null); setId(''); }}
                className="flex-1 border py-3.5 rounded-xl text-xs font-black uppercase tracking-wide transition-all trk-card"
                style={{ color: 'var(--text-muted)' }}>
                Track Another
              </button>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!res && !loading && (
          <div className="max-w-sm mx-auto text-center py-16">
            <div className="w-16 h-16 border rounded-2xl flex items-center justify-center mx-auto mb-5 trk-card">
              <Package size={28} style={{ color: 'var(--text-muted)' }} />
            </div>
            <h3 className="text-xl font-black uppercase mb-2" style={{ color: 'var(--text-color)' }}>Track Your Order</h3>
            <p className="text-xs font-medium leading-relaxed mb-6" style={{ color: 'var(--text-muted)' }}>Enter your order ID above to see real-time status and delivery information.</p>
            <div className="border p-5 rounded-2xl text-left trk-card">
              <p className="text-[10px] font-black uppercase mb-3 text-center tracking-wider" style={{ color: 'var(--primary-color)' }}>How It Works</p>
              {[
                'Find your Order ID on the receipt',
                'Enter or paste it in the search bar',
                'See live updates on your order status',
                'Confirm receipt once delivered',
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-2.5 mb-2 last:mb-0">
                  <span className="font-black text-xs flex-shrink-0" style={{ color: 'var(--primary-color)' }}>{i + 1}.</span>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{step}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}