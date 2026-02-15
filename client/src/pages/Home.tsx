import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Heart, ShoppingBag, Search, Edit3, Save, Trash2, CheckCircle2, Send, RefreshCw, X, Minus, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
export default function Home() {
  // --- 1. CORE SYSTEM & UI STATE ---
  const [storeName, setStoreName] = useState('LOCAL MARKET');
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState('LOCAL MARKET');
  const [isUiHidden, setIsUiHidden] = useState(false);
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);
  const [showTracking, setShowTracking] = useState(true);
  const [showAddresses, setShowAddresses] = useState(false);
  const [orderId, setOrderId] = useState<string | number>('');
  const [checkoutStep, setCheckoutStep] = useState<'shopping' | 'success' | 'error'>('shopping');
  const [isDelivery, setIsDelivery] = useState(false);

  // --- 2. SHOPPING & FILTER STATE ---
  const [cart, setCart] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [showCheckout, setShowCheckout] = useState(false);
  const [cartEffect, setCartEffect] = useState(false);

  // --- 3. DATABASE STATE ---
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [allOrders, setAllOrders] = useState<any[]>([]);
  const [orderStatus, setOrderStatus] = useState<'shopping' | 'loading' | 'success'>('shopping');

  // --- 4. FORM & DEMO STATE ---
  const [clientName, setClientName] = useState('');
  const [address, setAddress] = useState('');
  const [demoOwner, setDemoOwner] = useState('');
  const [emailSent, setEmailSent] = useState(false);

  // --- 5. DATA FETCHING ---
  const fetchProducts = async () => {
    const { data } = await supabase.from('products').select('*').order('id', { ascending: true });
    if (data) setMenuItems(data);
  };
  const fetchCategories = async () => {
    const { data } = await supabase.from('categories').select('*').order('name');
    if (data) setCategories(data);
  };
  const fetchOrders = async () => {
    const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    if (data) setAllOrders(data);
  };

  // --- 6. REAL-TIME SUBSCRIPTION ---
  useEffect(() => {
    fetchProducts();
    fetchOrders();
    fetchCategories();

    const channel = supabase
      .channel('db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        if (isAutoRefresh) fetchOrders();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
        if (isAutoRefresh) fetchProducts();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAutoRefresh]);

  // --- 7. ACTIONS ---
  const triggerCartEffect = () => {
    setCartEffect(true);
    setTimeout(() => setCartEffect(false), 800);
  };

  const handleDemoEmail = () => {
    if (!demoOwner) return;
    setEmailSent(true);
    const subject = encodeURIComponent(`Demo Inquiry: ${demoOwner}`);
    const body = encodeURIComponent(`I would like a demo for ${storeName}. \n\nOwner: ${demoOwner}`);
    window.location.href = `mailto:lawalenoch23@gmail.com?subject=${subject}&body=${body}`;
    setTimeout(() => setEmailSent(false), 3000);
  };

  const handleConfirmOrder = async () => {
    if (!clientName || (showAddresses && !address) || cart.length === 0) return;
    setOrderStatus('loading');

    const orderItems = cart.map(i => i.name).join(', ');
    const totalPrice = cart.reduce((s, i) => s + i.price, 0) + (showAddresses ? 5.99 : 0);

    const { data, error } = await supabase.from('orders').insert([{
      customer_name: clientName.toUpperCase(),
      total_price: totalPrice,
      items: orderItems,
      address: showAddresses ? address : "PICK-UP ONLY", 
      status: "PENDING"
    }]).select();

    if (data && data.length > 0) {
      setOrderId(data[0].id);
      setOrderStatus('success');
      setCheckoutStep('success');
      setCart([]);
    } else {
      setOrderStatus('shopping');
      alert("Order failed. Please try again.");
    }
  };

  const filteredItems = menuItems.filter(item => {
    const matchesSearch = item.name.toUpperCase().includes(searchQuery.toUpperCase());
    const matchesCategory = activeCategory === 'All' || 
                           (activeCategory === 'Favs' && favorites.includes(item.id)) || 
                           item.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  // --- 8. SUCCESS VIEW ---
  if (orderStatus === 'success') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6 text-white animate-in zoom-in">
        <div className="bg-[#111] border border-orange-500/20 p-12 rounded-[3.5rem] text-center max-w-sm w-full shadow-2xl">
          <div className="bg-green-500 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-green-500/40 shadow-lg"><CheckCircle2 size={32} /></div>
          <h2 className="text-4xl font-black italic uppercase mb-2">ORDER LOGGED</h2>
          <p className="text-orange-500 text-[9px] font-black uppercase mb-4 tracking-[0.4em]">{storeName}</p>
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl mb-10">
            <p className="text-zinc-500 text-[10px] uppercase font-black mb-2">Your Tracking ID</p>
            <p className="text-4xl font-black">#{orderId}</p>
          </div>
          <button onClick={() => window.print()} className="w-full bg-white text-black py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest mb-4">Print Receipt</button>
          <button onClick={() => setOrderStatus('shopping')} className="w-full bg-zinc-900 text-white py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest">Back to Market</button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-black text-white font-sans transition-all duration-700 ${isUiHidden ? 'grayscale brightness-50' : ''}`}>

      {/* NAVIGATION */}
      <nav className="p-8 flex justify-between items-start max-w-7xl mx-auto sticky top-0 bg-black/80 backdrop-blur-md z-50">
        <div className="group relative">
          {isEditingName ? (
            <div className="flex gap-2">
              <input value={tempName} onChange={(e) => setTempName(e.target.value.toUpperCase())} className="bg-zinc-900 border border-orange-500/50 rounded-lg px-4 py-2 font-black italic uppercase outline-none" autoFocus />
              <button onClick={() => { setStoreName(tempName); setIsEditingName(false); }} className="bg-orange-600 p-2 rounded-lg hover:bg-orange-500 transition-colors"><Save size={16}/></button>
            </div>
          ) : (
            <div className="cursor-pointer" onClick={() => setIsEditingName(true)}>
              <h1 className="text-2xl font-black italic tracking-tighter uppercase flex items-center gap-2">{storeName} <Edit3 size={14} className="opacity-0 group-hover:opacity-100 text-orange-500"/></h1>
              <p className="text-[10px] font-bold text-zinc-600 tracking-widest uppercase italic tracking-[0.3em]">Partner Store</p>
            </div>
          )}
        </div>

        <div className="flex justify-center gap-6 mt-10 pb-10">
          <Link to="/track" className="text-[10px] font-black text-zinc-500 hover:text-orange-500 uppercase italic">
            Track Order
          </Link>
          <Link to="/contact" className="text-[10px] font-black text-zinc-500 hover:text-orange-500 uppercase italic">
            Contact Us
          </Link>
        </div>
        <div className="flex gap-4">
          <button onClick={() => setShowCheckout(true)} className={`border border-white/20 rounded-full px-8 py-3 text-[10px] font-black uppercase tracking-widest bg-black transition-all ${cartEffect ? 'scale-110 border-orange-500 shadow-[0_0_30px_rgba(234,88,12,0.5)]' : ''}`}>Bag ({cart.length})</button>
        </div>
      </nav>

      {/* HERO */}
      <div className="max-w-7xl mx-auto px-8 mt-12">
        <div className="bg-zinc-950/20 border border-orange-500/10 rounded-[4rem] p-24 text-center relative overflow-hidden group">
          <p className="text-orange-500 text-[9px] font-black uppercase tracking-[0.5em] mb-4 italic">Partner Selection</p>
          <h2 className="text-8xl font-black italic uppercase tracking-tighter mb-4 leading-none">{storeName}</h2>
          <p className="text-zinc-600 text-[10px] uppercase tracking-[0.8em] italic">Honoring a Vision for Local Markets</p>
        </div>
      </div>

      {/* SEARCH */}
      <div className="max-w-xl mx-auto px-6 mt-16 text-center">
        <div className="relative group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-700 group-focus-within:text-orange-500 transition-colors" size={20} />
          <input placeholder="SEARCH MARKET..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-zinc-950 border border-zinc-900 rounded-[2rem] py-7 pl-16 pr-8 text-[11px] font-black uppercase tracking-[0.3em] outline-none focus:border-orange-500/40 transition-all shadow-2xl" />
        </div>
      </div>

      {/* CATEGORIES */}
      <div className="flex gap-3 overflow-x-auto no-scrollbar py-4 px-8 max-w-7xl mx-auto mt-8">
        {['All', 'Favs', ...categories.map(c => c.name)].map((catName) => (
          <button 
            key={catName}
            onClick={() => setActiveCategory(catName)}
            className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase border transition-all whitespace-nowrap ${
              activeCategory === catName ? 'bg-orange-600 border-orange-600 text-white' : 'bg-zinc-900 border-zinc-800 text-zinc-500'
            }`}
          >
            {catName}
          </button>
        ))}
      </div>
      
      {/* PRODUCT GRID */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 px-8 py-20">
        {filteredItems.map((item) => (
          <div key={item.id} className="bg-zinc-950 border border-zinc-900 rounded-[3rem] p-5 group transition-all hover:border-orange-500/20">
            <div className="relative aspect-[4/3] rounded-[2.5rem] overflow-hidden mb-8">
              <img src={item.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={item.name} />
              <button onClick={() => setFavorites(f => f.includes(item.id) ? f.filter(x => x!==item.id) : [...f, item.id])} className="absolute top-5 right-5 bg-black/50 p-4 rounded-full backdrop-blur-md">
                <Heart size={16} className={favorites.includes(item.id) ? 'fill-orange-500 text-orange-500' : 'text-white'}/>
              </button>
            </div>
            <div className="px-4 text-center">
              <h3 className="text-xs font-black italic uppercase mb-2">{item.name}</h3>
              <p className="text-orange-500 font-black mb-8 text-xl italic">₦{item.price?.toLocaleString()}</p>
              <button onClick={() => { setCart([...cart, item]); triggerCartEffect(); }} className="w-full bg-zinc-900 text-zinc-500 py-5 rounded-2xl text-[10px] font-black uppercase group-hover:bg-white group-hover:text-black transition-all">Add to Bag</button>
            </div>
          </div>
        ))}
      </div>

      {/* DEMO REQUEST */}
      <div className="max-w-4xl mx-auto py-24 px-6">
        <div className="bg-zinc-950 border border-zinc-900 p-24 rounded-[4rem] text-center shadow-2xl relative overflow-hidden">
           <h3 className="text-4xl font-black italic uppercase mb-4">Request a Demo</h3>
           <p className="text-zinc-600 text-[10px] font-black uppercase mb-12 tracking-[0.4em]">Fulfilling a Vision</p>
           <div className="max-w-md mx-auto space-y-4 relative z-10">
             <input placeholder="OWNER NAME" value={demoOwner} onChange={e => setDemoOwner(e.target.value.toUpperCase())} className="w-full bg-black border border-zinc-900 rounded-2xl py-7 px-8 text-center text-[10px] font-black uppercase outline-none focus:border-orange-500" />
             <button onClick={handleDemoEmail} className={`w-full py-7 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all flex items-center justify-center gap-3 ${emailSent ? 'bg-green-600 text-white' : 'bg-white text-black hover:invert shadow-xl'}`}>
               {emailSent ? <><CheckCircle2 size={16}/> Inquiry Sent</> : <><Send size={16}/> Email Enoch Lawal</>}
             </button>
           </div>
        </div>
      </div>

      {/* CHECKOUT MODAL */}
      {showCheckout && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/95 backdrop-blur-md">
          <div className="bg-[#0c0c0c] border border-zinc-900 w-full max-w-lg rounded-[4rem] p-12 shadow-2xl animate-in zoom-in">
            <div className="flex justify-between items-center mb-10">
              <h2 className="text-4xl font-black italic uppercase">Your Bag</h2>
              <button onClick={() => setShowCheckout(false)} className="text-zinc-600 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <div className="space-y-3 mb-10 max-h-[150px] overflow-y-auto no-scrollbar pr-2">
              {cart.map((item, i) => (
                <div key={i} className="bg-black border border-zinc-900 p-5 rounded-2xl flex justify-between items-center group">
                  <span className="text-[10px] font-black uppercase italic tracking-tighter">{item.name}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-orange-500 font-bold text-[10px]">₦{item.price.toLocaleString()}</span>
                    <button onClick={() => { const n = [...cart]; n.splice(i,1); setCart(n); }} className="text-red-900 hover:text-red-500 text-[8px] font-black uppercase opacity-0 group-hover:opacity-100 transition-opacity">Remove</button>
                  </div>
                </div>
              ))}
              {cart.length === 0 && <p className="text-center text-zinc-700 text-[9px] font-black py-4 uppercase tracking-widest">Bag is Empty</p>}
            </div>

            <div className="space-y-4 mb-10">
              <input placeholder="FULL NAME" value={clientName} onChange={e => setClientName(e.target.value.toUpperCase())} className="w-full bg-black border border-zinc-900 rounded-2xl py-6 px-8 text-[11px] font-black uppercase outline-none focus:border-orange-500" />
              
              <div className="flex items-center justify-between p-3 bg-zinc-900/50 rounded-xl mb-4 border border-zinc-800">
                <span className="text-[10px] font-black text-zinc-500 uppercase">Need Delivery? (+₦5.99)</span>
                <button 
                  onClick={() => setShowAddresses(!showAddresses)}
                  className={`w-10 h-5 rounded-full transition-all relative ${showAddresses ? 'bg-orange-500' : 'bg-zinc-700'}`}
                >
                  <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${showAddresses ? 'left-6' : 'left-1'}`} />
                </button>
              </div>

              {showAddresses && (
                <input
                  placeholder="DELIVERY ADDRESS"
                  value={address}
                  onChange={(e) => setAddress(e.target.value.toUpperCase())}
                  className="w-full bg-zinc-900 border border-zinc-800 py-6 px-8 rounded-2xl mb-4 text-white text-[11px] font-black uppercase outline-none focus:border-orange-500"
                />
              )}
            </div>

            <div className="flex justify-between items-center mb-10 px-4 border-t border-zinc-900 pt-8">
              <span className="text-2xl font-black italic uppercase">Total</span>
              <span className="text-2xl font-black italic text-orange-500">
                ₦{(cart.reduce((s, i) => s + i.price, 0) + (showAddresses ? 5.99 : 0)).toLocaleString()}
              </span>
            </div>

            <button 
              onClick={handleConfirmOrder} 
              disabled={orderStatus === 'loading'}
              className="w-full bg-orange-600 text-white py-7 rounded-[2.5rem] font-black uppercase text-xs tracking-[0.2em] shadow-2xl active:scale-95 transition-all disabled:opacity-50"
            >
              {orderStatus === 'loading' ? 'Processing...' : 'Confirm Order'}
            </button>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="py-20 text-center border-t border-zinc-900 mt-20 opacity-40">
         <button onClick={() => setIsUiHidden(!isUiHidden)} className="text-[9px] font-black text-white uppercase tracking-[0.5em] mb-10 hover:text-orange-500 transition-colors">Hide UI</button>
         <p className="text-[9px] font-bold tracking-[1.5em] text-white uppercase">P O P O P ' S  D R E A M  •  2 0 2 6</p>
      </footer>
    </div>
  );
}