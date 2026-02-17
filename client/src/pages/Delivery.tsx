import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { 
  Package, Phone, MapPin, User, Clock, CheckCircle2, 
  Truck, AlertCircle, LogOut, RefreshCw, X, DollarSign 
} from 'lucide-react';

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

export default function Delivery() {
  // --- AUTHENTICATION STATE ---
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  // --- DATA STATE ---
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<number | null>(null);
  const [distanceInput, setDistanceInput] = useState('');
  const [feeInput, setFeeInput] = useState('');
  const [showFeeCalculator, setShowFeeCalculator] = useState<number | null>(null);

  // --- CHECK AUTHENTICATION ON MOUNT ---
  useEffect(() => {
    const session = localStorage.getItem('delivery_session');
    const sessionTime = localStorage.getItem('delivery_session_time');
    if (session && sessionTime) {
      const now = new Date().getTime();
      const sessionAge = now - parseInt(sessionTime);
      if (sessionAge < 12 * 60 * 60 * 1000) {
        setIsAuthenticated(true);
      } else {
        localStorage.removeItem('delivery_session');
        localStorage.removeItem('delivery_session_time');
      }
    }
  }, []);

  // --- FETCH ORDERS (DELIVERY ONLY) ---
  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .not('address', 'is', null)
        .neq('status', 'DONE')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  // --- REAL-TIME SUBSCRIPTION ---
  useEffect(() => {
    if (isAuthenticated) {
      fetchOrders();
      const channel = supabase
        .channel('delivery-orders')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => { fetchOrders(); })
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [isAuthenticated]);

  // --- DATABASE-DRIVEN AUTHENTICATION ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError('');
    try {
      const { data: authData, error } = await supabase.from('store_settings').select('delivery_password').eq('id', 1).single();
      if (error) throw error;
      const dbPassword = authData?.delivery_password;
      setTimeout(() => {
        if (passwordInput === dbPassword) {
          localStorage.setItem('delivery_session', 'authenticated');
          localStorage.setItem('delivery_session_time', new Date().getTime().toString());
          setIsAuthenticated(true);
          setPasswordInput('');
        } else {
          setLoginError('Incorrect access code. Please try again.');
          setPasswordInput('');
        }
        setIsLoggingIn(false);
      }, 500);
    } catch (error) {
      setLoginError('Login failed. Please contact the Store Manager.');
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    if (confirm('Are you sure you want to logout?')) {
      localStorage.removeItem('delivery_session');
      localStorage.removeItem('delivery_session_time');
      setIsAuthenticated(false);
    }
  };

  // --- UPDATE ORDER STATUS ---
  const updateOrderStatus = async (orderId: number, newStatus: string) => {
    setUpdating(orderId);
    try {
      const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
      if (error) throw error;
      await fetchOrders();
    } catch (err) {
      alert('Failed to update order status. Please try again.');
    } finally {
      setUpdating(null);
    }
  };

  // --- LOGIN SCREEN ---
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-20 right-20 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="bg-zinc-950/90 backdrop-blur-xl border border-zinc-800 p-8 rounded-3xl shadow-2xl max-w-md w-full relative z-10 animate-in fade-in zoom-in duration-500">
          <div className="flex justify-center mb-6">
            <div className="bg-blue-500/10 p-4 rounded-2xl"><Truck className="text-blue-500" size={40} /></div>
          </div>
          <div className="text-center mb-8">
            <h1 className="text-3xl font-black italic uppercase tracking-tighter text-white mb-2">Delivery Portal</h1>
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Grandpa's Supermart</p>
          </div>

          {!showForgotPassword ? (
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="text-xs font-black text-zinc-500 uppercase tracking-wider mb-2 block">Access Code</label>
                <input type="password" value={passwordInput} onChange={(e) => { setPasswordInput(e.target.value); setLoginError(''); }} placeholder="Enter your delivery code" className="w-full bg-black/50 border border-zinc-800 rounded-xl px-4 py-4 text-sm font-medium text-white placeholder:text-zinc-600 outline-none focus:border-blue-500 transition-all" disabled={isLoggingIn} autoFocus />
              </div>
              {loginError && <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3"><p className="text-red-500 text-xs font-bold text-center">{loginError}</p></div>}
              <button type="submit" disabled={!passwordInput || isLoggingIn} className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 disabled:cursor-not-allowed text-white py-4 rounded-xl font-black uppercase text-sm tracking-widest transition-all active:scale-95">
                {isLoggingIn ? <div className="flex items-center justify-center gap-2"><div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" /><span>Verifying...</span></div> : 'Access Deliveries'}
              </button>
              <button type="button" onClick={() => setShowForgotPassword(true)} className="w-full text-zinc-500 hover:text-blue-500 text-xs font-bold uppercase tracking-wider transition-colors">Forgot Password?</button>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-6">
                <div className="flex items-start gap-3 mb-4">
                  <AlertCircle className="text-blue-500 flex-shrink-0 mt-0.5" size={20} />
                  <div>
                    <h3 className="text-sm font-black text-white uppercase mb-2">Reset Access Code</h3>
                    <p className="text-xs text-zinc-400 leading-relaxed">Please contact the Store Manager to reset your delivery access code.</p>
                  </div>
                </div>
              </div>
              <button onClick={() => setShowForgotPassword(false)} className="w-full bg-zinc-900 hover:bg-zinc-800 text-white py-4 rounded-xl font-black uppercase text-xs tracking-widest transition-all">Back to Login</button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // --- DELIVERY DASHBOARD ---
  return (
    <div className="min-h-screen bg-black text-white pb-20">
      {/* HEADER */}
      <header className="sticky top-0 bg-black/90 backdrop-blur-xl border-b border-zinc-900 z-50">
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="bg-blue-500/10 p-2 rounded-xl"><Truck className="text-blue-500" size={24} /></div>
              <div>
                <h1 className="text-xl font-black italic uppercase tracking-tighter">Deliveries</h1>
                <p className="text-xs text-zinc-500 font-bold">Grandpa's Supermart</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={fetchOrders} disabled={loading} className="bg-zinc-900 p-2.5 rounded-xl hover:bg-zinc-800 transition-all active:scale-95 disabled:opacity-50">
                <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
              </button>
              <button onClick={handleLogout} className="bg-zinc-900 p-2.5 rounded-xl hover:bg-red-600 transition-all active:scale-95"><LogOut size={18} /></button>
            </div>
          </div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            <div className="bg-zinc-950 border border-zinc-900 px-4 py-2 rounded-xl flex items-center gap-2 whitespace-nowrap">
              <Package size={14} className="text-orange-500" />
              <span className="text-xs font-black">{orders.length} Active</span>
            </div>
            <div className="bg-zinc-950 border border-zinc-900 px-4 py-2 rounded-xl flex items-center gap-2 whitespace-nowrap">
              <Clock size={14} className="text-blue-500" />
              <span className="text-xs font-black">{orders.filter(o => o.status === 'READY').length} Ready</span>
            </div>
            <div className="bg-zinc-950 border border-zinc-900 px-4 py-2 rounded-xl flex items-center gap-2 whitespace-nowrap">
              <Truck size={14} className="text-green-500" />
              <span className="text-xs font-black">{orders.filter(o => o.status === 'SHIPPED').length} En Route</span>
            </div>
          </div>
        </div>
      </header>

      {/* ORDERS LIST */}
      <div className="p-4 space-y-4">
        {loading && orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full mb-4" />
            <p className="text-zinc-500 text-sm font-bold">Loading deliveries...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="bg-zinc-950 border border-zinc-900 p-8 rounded-3xl text-center">
              <CheckCircle2 size={48} className="text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-black uppercase mb-2">All Caught Up!</h3>
              <p className="text-zinc-500 text-sm font-medium">No active deliveries at the moment.</p>
            </div>
          </div>
        ) : (
          orders.map((order) => (
            <div key={order.id} className="bg-zinc-950/50 backdrop-blur-md border border-zinc-900 rounded-3xl p-5 space-y-4 hover:border-zinc-800 transition-all">

              {/* FEE CALCULATOR MODAL */}
              {showFeeCalculator === order.id && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
                  <div className="bg-zinc-950 border border-zinc-800 w-full max-w-md rounded-2xl shadow-2xl p-6">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-lg font-black uppercase">Calculate Delivery Fee</h3>
                      <button onClick={() => { setShowFeeCalculator(null); setDistanceInput(''); setFeeInput(''); }} className="text-zinc-500 hover:text-white"><X size={20} /></button>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="text-xs font-black text-zinc-500 uppercase mb-2 block">Actual Distance Traveled (KM)</label>
                        <input type="number" step="0.1" value={distanceInput} onChange={(e) => { setDistanceInput(e.target.value); const distance = parseFloat(e.target.value) || 0; setFeeInput((200 + (distance * 150)).toFixed(2)); }} placeholder="Enter kilometers" className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-blue-500" />
                      </div>
                      {feeInput && (
                        <div className="bg-blue-500/10 border border-blue-500/30 p-4 rounded-xl text-center">
                          <p className="text-xs text-blue-400 font-black uppercase mb-1">Calculated Fee</p>
                          <p className="text-3xl font-black text-blue-500">₦{parseFloat(feeInput).toLocaleString()}</p>
                          <p className="text-xs text-zinc-500 mt-2">Base: ₦200 + ({distanceInput}km × ₦150/km)</p>
                        </div>
                      )}
                      <div>
                        <label className="text-xs font-black text-zinc-500 uppercase mb-2 block">Delivery Fee (Override if needed)</label>
                        <input type="number" step="0.01" value={feeInput} onChange={(e) => setFeeInput(e.target.value)} placeholder="Enter delivery fee" className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-blue-500" />
                      </div>
                      <button
                        onClick={async () => {
                          if (!distanceInput || !feeInput) { alert('Please enter distance and fee'); return; }
                          const productsTotal = order.total_price || 0;
                          const deliveryFee = parseFloat(feeInput);
                          const finalTotal = productsTotal + deliveryFee;
                          const { error } = await supabase.from('orders').update({ delivery_distance: parseFloat(distanceInput), delivery_fee: deliveryFee, final_total: finalTotal }).eq('id', order.id);
                          if (error) { alert('Failed to update: ' + error.message); }
                          else { alert('Delivery fee updated successfully!'); setShowFeeCalculator(null); setDistanceInput(''); setFeeInput(''); fetchOrders(); }
                        }}
                        className="w-full bg-blue-600 hover:bg-blue-500 py-4 rounded-xl font-black uppercase text-sm transition-all"
                      >
                        Save Delivery Fee
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Calculate Fee Button */}
              {order.delivery_fee === 0 && (
                <button onClick={() => setShowFeeCalculator(order.id)} className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-2xl font-black uppercase text-sm tracking-wider flex items-center justify-center gap-2 active:scale-95 transition-all">
                  <DollarSign size={18} /> Calculate Delivery Fee
                </button>
              )}

              {/* Delivery Fee Display */}
              {order.delivery_fee > 0 && (
                <div className="bg-green-500/10 border border-green-500/30 p-3 rounded-xl">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-black text-green-400 uppercase">Delivery Fee</span>
                    <span className="text-lg font-black text-green-500">₦{order.delivery_fee.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-zinc-500">Distance: {order.delivery_distance}km</span>
                    <span className="text-zinc-500">Total: ₦{(order.final_total || 0).toLocaleString()}</span>
                  </div>
                </div>
              )}

              {/* Order Header */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-black text-zinc-500 uppercase">Order #{order.id}</span>
                    <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase ${order.status === 'READY' ? 'bg-blue-600/20 text-blue-500' : order.status === 'SHIPPED' ? 'bg-green-600/20 text-green-500' : order.status === 'PREPARING' ? 'bg-yellow-600/20 text-yellow-500' : 'bg-orange-600/20 text-orange-500'}`}>
                      {order.status}
                    </span>
                  </div>
                  {/* ✅ Full date/time displayed clearly */}
                  <p className="text-xs font-bold text-orange-400 flex items-center gap-1">
                    <Clock size={10} className="text-orange-500" />
                    {formatOrderDateTime(order.created_at)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-zinc-500 font-bold uppercase mb-1">Products</p>
                  <p className="text-lg font-black text-orange-500">₦{order.total_price?.toLocaleString()}</p>
                </div>
              </div>

              {/* Customer Info */}
              <div className="bg-black/50 border border-zinc-900 p-4 rounded-2xl space-y-3">
                <div className="flex items-center gap-2">
                  <User size={16} className="text-blue-500" />
                  <div className="flex-1">
                    <p className="text-xs text-zinc-500 font-bold uppercase">Customer</p>
                    <p className="text-sm font-black">{order.customer_name}</p>
                    {order.phone_number && <p className="text-xs text-green-400 font-bold mt-1">📞 {order.phone_number}</p>}
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin size={16} className="text-green-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-zinc-500 font-bold uppercase mb-1">Delivery Address</p>
                    <p className="text-sm font-medium leading-relaxed">{order.address}</p>
                    {order.payment_method && (
                      <p className="text-xs text-zinc-500 mt-2">Payment: {order.payment_method === 'cash' ? '💵 Cash' : '📱 Transfer'} on delivery</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Items Summary */}
              <div className="bg-black/30 border border-zinc-900 p-3 rounded-xl">
                <p className="text-xs text-zinc-500 font-black uppercase mb-2">Order Items</p>
                <p className="text-xs font-medium leading-relaxed text-zinc-400">{order.items}</p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                {order.phone_number && (
                  <a href={`tel:${order.phone_number}`} className="w-full bg-green-600 hover:bg-green-500 border border-green-500 text-white py-4 rounded-2xl font-black uppercase text-sm tracking-wider flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg shadow-green-500/20">
                    <Phone size={18} /> Call {order.customer_name.split(' ')[0]}
                  </a>
                )}
                <div className="grid grid-cols-3 gap-2">
                  {order.status !== 'READY' && (
                    <button onClick={() => updateOrderStatus(order.id, 'READY')} disabled={updating === order.id} className="bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 text-white py-4 rounded-xl font-black uppercase text-xs tracking-wider flex flex-col items-center justify-center gap-1 active:scale-95 transition-all disabled:opacity-50">
                      <Package size={18} /><span>Pick Up</span>
                    </button>
                  )}
                  {order.status !== 'SHIPPED' && (
                    <button onClick={() => updateOrderStatus(order.id, 'SHIPPED')} disabled={updating === order.id} className="bg-yellow-600 hover:bg-yellow-500 disabled:bg-zinc-800 text-white py-4 rounded-xl font-black uppercase text-xs tracking-wider flex flex-col items-center justify-center gap-1 active:scale-95 transition-all disabled:opacity-50">
                      <Truck size={18} /><span>On Way</span>
                    </button>
                  )}
                  <button onClick={() => updateOrderStatus(order.id, 'DONE')} disabled={updating === order.id} className="bg-green-600 hover:bg-green-500 disabled:bg-zinc-800 text-white py-4 rounded-xl font-black uppercase text-xs tracking-wider flex flex-col items-center justify-center gap-1 active:scale-95 transition-all disabled:opacity-50">
                    <CheckCircle2 size={18} /><span>Delivered</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}