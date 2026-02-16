import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Heart, ShoppingBag, Search, Edit3, Save, Trash2, CheckCircle2, Send, RefreshCw, X, Minus, Plus, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Home() {
  // --- 1. CORE SYSTEM & UI STATE ---
  const [storeName, setStoreName] = useState('LOCAL MARKET');
  const [storeSettings, setStoreSettings] = useState<any>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState('LOCAL MARKET');
  const [isUiHidden, setIsUiHidden] = useState(false);
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);
  const [showTracking, setShowTracking] = useState(true);
  const [showAddresses, setShowAddresses] = useState(false);
  const [orderId, setOrderId] = useState<string | number>('');
  const [checkoutStep, setCheckoutStep] = useState<'shopping' | 'success' | 'error'>('shopping');
  const [deliveryFeePerKm, setDeliveryFeePerKm] = useState(150);

  // --- 2. SHOPPING & FILTER STATE ---
  const [cart, setCart] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [showCheckout, setShowCheckout] = useState(false);
  const [cartEffect, setCartEffect] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash'); 

  // --- LOAD FAVORITES FROM LOCALSTORAGE ---
  useEffect(() => {
    const savedFavorites = localStorage.getItem('customer_favorites');
    if (savedFavorites) {
      try {
        const parsed = JSON.parse(savedFavorites);
        setFavorites(Array.isArray(parsed) ? parsed : []);
      } catch (err) {
        console.error('Error loading favorites:', err);
        setFavorites([]);
      }
    }
  }, []);

  // --- SAVE FAVORITES TO LOCALSTORAGE WHEN CHANGED ---
  useEffect(() => {
    if (favorites.length >= 0) {
      localStorage.setItem('customer_favorites', JSON.stringify(favorites));
    }
  }, [favorites]);

  // --- 3. DATABASE STATE ---
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [allOrders, setAllOrders] = useState<any[]>([]);
  const [orderStatus, setOrderStatus] = useState<'shopping' | 'loading' | 'success'>('shopping');

  // --- 4. FORM & DEMO STATE ---
  const [clientName, setClientName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
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

  const fetchStoreSettings = async () => {
    try {
      const { data } = await supabase
        .from('store_settings')
        .select('*')
        .eq('id', 1)
        .single();

      if (data) {
        setStoreSettings(data);
        setStoreName(data.store_name);
        setTempName(data.store_name);
        setDeliveryFeePerKm(data.delivery_fee_per_km || 150);
      }
    } catch (err) {
      console.error('Error fetching store settings:', err);
    }
  };

  // --- 6. REAL-TIME SUBSCRIPTION ---
  useEffect(() => {
    fetchProducts();
    fetchOrders();
    fetchCategories();
    fetchStoreSettings();

    const channel = supabase
      .channel('db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        if (isAutoRefresh) fetchOrders();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
        if (isAutoRefresh) fetchProducts();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'store_settings' }, () => {
        fetchStoreSettings();
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
    // Only require name and address (if delivery is selected)
    if (!clientName.trim()) {
      alert('Please enter your name');
      return;
    }

    if (showAddresses && !address.trim()) {
      alert('Please enter delivery address');
      return;
    }

    if (cart.length === 0) {
      alert('Your bag is empty');
      return;
    }

    setOrderStatus('loading');

    const orderItems = cart.map(i => i.name).join(', ');
    const totalPrice = cart.reduce((s, i) => s + i.price, 0);

    // Insert order first
    const { data, error } = await supabase.from('orders').insert([{
      customer_name: clientName.toUpperCase(),
      phone_number: phoneNumber.trim() || null,
      total_price: parseFloat(totalPrice.toFixed(2)),
      items: orderItems,
      address: showAddresses ? address : null,
      status: "PENDING",
      store_name: storeSettings?.store_name || storeName,
      payment_method: showAddresses ? paymentMethod : 'pickup'
    } as any]).select();

    if (error) {
      console.error('Order Error:', error);
      setOrderStatus('shopping');
      alert("Order failed: " + error.message);
      return;
    }

    // **CRITICAL: Decrement stock for each item in cart**
    for (const item of cart) {
      const currentStock = item.stock || 0;
      const newStock = Math.max(0, currentStock - 1);

      await supabase
        .from('products')
        .update({ stock: newStock })
        .eq('id', item.id);
    }

    if (data && data.length > 0) {
      setOrderId(data[0].id);
      setOrderStatus('success');
      setCheckoutStep('success');
      setCart([]);
      setClientName('');
      setPhoneNumber('');
      setAddress('');

      // Refresh products to show updated stock
      fetchProducts();
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

  // Calculate estimated delivery fee
  const estimatedDeliveryFee = deliveryFeePerKm * 2; // Assuming average 2km

  // --- 8. SUCCESS VIEW ---
  if (orderStatus === 'success') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4 md:p-6 text-white animate-in zoom-in">
        <div className="bg-[#111] border border-orange-500/20 p-8 md:p-12 rounded-3xl md:rounded-[3.5rem] text-center max-w-sm w-full shadow-2xl">
          <div className="bg-green-500 w-14 h-14 md:w-16 md:h-16 rounded-xl md:rounded-2xl flex items-center justify-center mx-auto mb-6 md:mb-8 shadow-green-500/40 shadow-lg">
            <CheckCircle2 size={28} className="md:w-8 md:h-8" />
          </div>
          <h2 className="text-3xl md:text-4xl font-black italic uppercase mb-2">ORDER LOGGED</h2>
          <p className="text-orange-500 text-[9px] md:text-[10px] font-black uppercase mb-4 tracking-[0.3em] md:tracking-[0.4em]">{storeName}</p>
          <div className="bg-zinc-900 border border-zinc-800 p-5 md:p-6 rounded-2xl md:rounded-3xl mb-8 md:mb-10">
            <p className="text-zinc-500 text-[10px] md:text-[11px] uppercase font-black mb-2">Your Tracking ID</p>
            <p className="text-3xl md:text-4xl font-black">#{orderId}</p>
          </div>
          <button onClick={() => window.print()} className="w-full bg-white text-black py-4 md:py-5 rounded-xl md:rounded-2xl font-black uppercase text-xs md:text-[10px] tracking-widest mb-3 md:mb-4 active:scale-95 transition-all">Print Receipt</button>
          <button onClick={() => setOrderStatus('shopping')} className="w-full bg-zinc-900 text-white py-4 md:py-5 rounded-xl md:rounded-2xl font-black uppercase text-xs md:text-[10px] tracking-widest active:scale-95 transition-all">Back to Market</button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-black text-white font-sans transition-all duration-700 ${isUiHidden ? 'grayscale brightness-50' : ''}`}>

      {/* NAVIGATION */}
      <nav className="p-4 md:p-6 lg:p-8 flex flex-col md:flex-row justify-between items-center gap-4 max-w-full px-6 lg:px-20 mx-auto sticky top-0 bg-black/90 backdrop-blur-xl z-50 border-b border-zinc-900">
        <div className="group relative">
          {isEditingName ? (
            <div className="flex gap-2">
              <input value={tempName} onChange={(e) => setTempName(e.target.value.toUpperCase())} className="bg-zinc-900 border border-orange-500/50 rounded-lg px-4 py-2 font-black italic uppercase outline-none" autoFocus />
              <button onClick={() => { setStoreName(tempName); setIsEditingName(false); }} className="bg-orange-600 p-2 rounded-lg hover:bg-orange-500 transition-colors"><Save size={16}/></button>
            </div>
          ) : 
            <div className="cursor-pointer" onClick={() => setIsEditingName(true)}>
              <h1 className="text-2xl font-black italic tracking-tighter uppercase flex items-center gap-2">{storeName} <Edit3 size={14} className="opacity-0 group-hover:opacity-100 text-orange-500"/></h1>
              <p className="text-[10px] font-bold text-zinc-600 tracking-widest uppercase italic tracking-[0.3em]">Partner Store</p>
            </div>
          }
        </div>

        <div className="flex gap-4 md:gap-6">
          <Link to="/track" className="text-xs md:text-[10px] font-black text-zinc-500 hover:text-orange-500 uppercase italic transition-colors">
            Track Order
          </Link>
          <Link to="/contact" className="text-xs md:text-[10px] font-black text-zinc-500 hover:text-orange-500 uppercase italic transition-colors">
            Contact Us
          </Link>
        </div>

        <div className="flex gap-4">
          <button onClick={() => setShowCheckout(true)} className={`border border-white/20 rounded-full px-6 md:px-8 py-3 md:py-3 text-xs md:text-[10px] font-black uppercase tracking-widest bg-black transition-all ${cartEffect ? 'scale-110 border-orange-500 shadow-[0_0_30px_rgba(234,88,12,0.5)]' : ''}`}>Bag ({cart.length})</button>
        </div>
      </nav>

      {/* HERO */}
      <div className="max-w-full px-6 lg:px-20 mx-auto mt-8 md:mt-12">
        <div className="bg-zinc-950/20 backdrop-blur-md border border-orange-500/10 rounded-3xl md:rounded-[4rem] p-12 md:p-24 text-center relative overflow-hidden group">
          <p className="text-orange-500 text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] md:tracking-[0.5em] mb-3 md:mb-4 italic">Partner Selection</p>
          <h2 className="text-4xl md:text-6xl lg:text-8xl font-black italic uppercase tracking-tighter mb-3 md:mb-4 leading-none">{storeName}</h2>
          <p className="text-zinc-600 text-[9px] md:text-[10px] uppercase tracking-[0.5em] md:tracking-[0.8em] italic">Honoring a Vision for Local Markets</p>
        </div>
      </div>

      {/* SEARCH */}
      <div className="max-w-2xl mx-auto px-6 lg:px-8 mt-12 md:mt-16 text-center">
        <div className="relative group">
          <Search className="absolute left-4 md:left-6 top-1/2 -translate-y-1/2 text-zinc-700 group-focus-within:text-orange-500 transition-colors" size={20} />
          <input placeholder="SEARCH MARKET..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-zinc-950/50 backdrop-blur-md border border-zinc-900 rounded-2xl md:rounded-[2rem] py-5 md:py-7 pl-12 md:pl-16 pr-6 md:pr-8 text-xs md:text-[11px] font-black uppercase tracking-[0.2em] md:tracking-[0.3em] outline-none focus:border-orange-500/40 transition-all shadow-2xl" />
        </div>
      </div>

      {/* CATEGORIES */}
      <div className="flex gap-2 md:gap-3 overflow-x-auto no-scrollbar py-4 px-6 lg:px-20 max-w-full mx-auto mt-6 md:mt-8">
        {['All', 'Favs', ...categories.map(c => c.name)].map((catName) => (
          <button 
            key={catName}
            onClick={() => setActiveCategory(catName)}
            className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase border transition-all whitespace-nowrap ${
              activeCategory === catName ? 'bg-orange-600 border-orange-600 text-white' : 'bg-zinc-900 border-zinc-800 text-zinc-500'
            }`}
          >
            {catName === 'Favs' ? `❤️ ${catName} (${favorites.length})` : catName}
          </button>
        ))}
      </div>

      {/* PRODUCT GRID */}
      <div className="max-w-full px-6 lg:px-20 mx-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6 lg:gap-8 py-12 md:py-20">
        {filteredItems.map((item) => {
          const stock = item.stock || 0;
          const isSoldOut = stock <= 0;
          const isLowStock = stock > 0 && stock < 5;

          return (
            <div key={item.id} className={`bg-zinc-950/50 backdrop-blur-md border border-zinc-900 rounded-2xl md:rounded-[3rem] p-3 md:p-5 group transition-all hover:border-orange-500/30 hover:scale-105 hover:shadow-2xl hover:shadow-orange-500/10 ${isSoldOut ? 'opacity-60' : ''}`}>
              <div className="relative aspect-square md:aspect-[4/3] rounded-xl md:rounded-[2.5rem] overflow-hidden mb-4 md:mb-8">
                <img src={item.image} className={`w-full h-full object-cover transition-transform duration-700 ${isSoldOut ? 'grayscale' : 'group-hover:scale-110'}`} alt={item.name} />

                {/* SOLD OUT OVERLAY */}
                {isSoldOut && (
                  <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center">
                    <div className="bg-red-600 px-4 py-2 rounded-xl rotate-[-15deg]">
                      <p className="text-white font-black text-sm uppercase tracking-wider">SOLD OUT</p>
                    </div>
                  </div>
                )}

                {/* LOW STOCK BADGE */}
                {isLowStock && !isSoldOut && (
                  <div className="absolute top-3 left-3 bg-yellow-500 px-3 py-1 rounded-lg">
                    <p className="text-black font-black text-[8px] uppercase">Only {stock} left!</p>
                  </div>
                )}

                <button 
                  onClick={() => {
                    setFavorites(f => {
                      const isFavorited = f.includes(item.id);
                      if (isFavorited) {
                        return f.filter(x => x !== item.id);
                      } else {
                        return [...f, item.id];
                      }
                    });
                  }} 
                  className="absolute top-3 right-3 md:top-5 md:right-5 bg-black/50 p-2 md:p-4 rounded-full backdrop-blur-md hover:bg-black/70 transition-all active:scale-95"
                >
                  <Heart 
                    size={14} 
                    className={`md:w-4 md:h-4 transition-all ${
                      favorites.includes(item.id) 
                        ? 'fill-orange-500 text-orange-500 scale-110' 
                        : 'text-white'
                    }`}
                  />
                </button>
              </div>
              <div className="px-2 md:px-4 text-center">
                <h3 className="text-[10px] md:text-xs font-black italic uppercase mb-2 line-clamp-2">{item.name}</h3>
                <p className="text-orange-500 font-black mb-4 md:mb-8 text-lg md:text-xl italic">₦{item.price?.toLocaleString()}</p>
                <button 
                  onClick={() => { 
                    if (!isSoldOut) {
                      setCart([...cart, item]); 
                      triggerCartEffect(); 
                    }
                  }} 
                  disabled={isSoldOut}
                  className={`w-full py-3 md:py-5 rounded-xl md:rounded-2xl text-[9px] md:text-[10px] font-black uppercase transition-all active:scale-95 ${
                    isSoldOut 
                      ? 'bg-zinc-900/50 text-zinc-600 cursor-not-allowed' 
                      : 'bg-zinc-900/80 backdrop-blur-sm text-zinc-500 group-hover:bg-white group-hover:text-black'
                  }`}
                >
                  {isSoldOut ? 'Out of Stock' : 'Add to Bag'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* DEMO REQUEST */}
      <div className="max-w-4xl mx-auto py-16 md:py-24 px-6">
        <div className="bg-zinc-950/50 backdrop-blur-md border border-zinc-900 p-12 md:p-24 rounded-3xl md:rounded-[4rem] text-center shadow-2xl relative overflow-hidden">
           <h3 className="text-2xl md:text-4xl font-black italic uppercase mb-3 md:mb-4">Request a Demo</h3>
           <p className="text-zinc-600 text-[9px] md:text-[10px] font-black uppercase mb-8 md:mb-12 tracking-[0.3em] md:tracking-[0.4em]">Fulfilling a Vision</p>
           <div className="max-w-md mx-auto space-y-3 md:space-y-4 relative z-10">
             <input placeholder="OWNER NAME" value={demoOwner} onChange={e => setDemoOwner(e.target.value.toUpperCase())} className="w-full bg-black/50 backdrop-blur-sm border border-zinc-900 rounded-xl md:rounded-2xl py-5 md:py-7 px-6 md:px-8 text-center text-xs md:text-[10px] font-black uppercase outline-none focus:border-orange-500 transition-all" />
             <button onClick={handleDemoEmail} className={`w-full py-5 md:py-7 rounded-xl md:rounded-2xl font-black uppercase text-xs md:text-[10px] tracking-widest transition-all flex items-center justify-center gap-3 active:scale-95 ${emailSent ? 'bg-green-600 text-white' : 'bg-white text-black hover:bg-orange-500 hover:text-white shadow-xl'}`}>
               {emailSent ? <><CheckCircle2 size={16}/> Inquiry Sent</> : <><Send size={16}/> Email Enoch Lawal</>}
             </button>
           </div>
        </div>
      </div>

      {/* CHECKOUT MODAL - FIXED HEIGHT FOR MOBILE */}
      {showCheckout && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-6 bg-black/95 backdrop-blur-md">
          <div className="bg-[#0c0c0c] border border-zinc-900 w-full max-w-lg rounded-3xl md:rounded-[4rem] shadow-2xl animate-in zoom-in max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="p-6 md:p-10">
              <div className="flex justify-between items-center mb-8 md:mb-10">
                <h2 className="text-3xl md:text-4xl font-black italic uppercase">Your Bag</h2>
                <button onClick={() => setShowCheckout(false)} className="text-zinc-600 hover:text-white transition-colors p-2">
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-2 md:space-y-3 mb-8 md:mb-10 max-h-[200px] overflow-y-auto custom-scrollbar pr-2">
                {cart.map((item, i) => (
                  <div key={i} className="bg-black/50 backdrop-blur-sm border border-zinc-900 p-4 md:p-5 rounded-xl md:rounded-2xl flex justify-between items-center group">
                    <span className="text-xs md:text-[10px] font-black uppercase italic tracking-tighter">{item.name}</span>
                    <div className="flex items-center gap-3 md:gap-4">
                      <span className="text-orange-500 font-bold text-xs md:text-[10px]">₦{item.price.toLocaleString()}</span>
                      <button onClick={() => { const n = [...cart]; n.splice(i,1); setCart(n); }} className="text-red-900 hover:text-red-500 text-[9px] md:text-[8px] font-black uppercase opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity px-2 py-1">Remove</button>
                    </div>
                  </div>
                ))}
                {cart.length === 0 && <p className="text-center text-zinc-700 text-xs md:text-[9px] font-black py-8 md:py-4 uppercase tracking-widest">Bag is Empty</p>}
              </div>

              <div className="space-y-3 md:space-y-4 mb-8 md:mb-10">
                <input 
                  placeholder="FULL NAME" 
                  value={clientName} 
                  onChange={e => setClientName(e.target.value.toUpperCase())} 
                  className="w-full bg-black/50 backdrop-blur-sm border border-zinc-900 rounded-xl md:rounded-2xl py-5 md:py-6 px-6 md:px-8 text-xs md:text-[11px] font-black uppercase outline-none focus:border-orange-500 transition-all" 
                />

                <input 
                  placeholder="PHONE NUMBER (Optional)" 
                  value={phoneNumber} 
                  onChange={e => setPhoneNumber(e.target.value)} 
                  className="w-full bg-black/50 backdrop-blur-sm border border-zinc-900 rounded-xl md:rounded-2xl py-5 md:py-6 px-6 md:px-8 text-xs md:text-[11px] font-black uppercase outline-none focus:border-orange-500 transition-all" 
                  type="tel" 
                />

                <div className="flex items-center justify-between p-4 md:p-3 bg-zinc-900/50 backdrop-blur-sm rounded-xl border border-zinc-800">
                  <span className="text-xs md:text-[10px] font-black text-zinc-500 uppercase">Need Delivery?</span>
                  <button 
                    onClick={() => setShowAddresses(!showAddresses)}
                    className={`w-12 h-6 md:w-10 md:h-5 rounded-full transition-all relative ${showAddresses ? 'bg-orange-500' : 'bg-zinc-700'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 md:w-3 md:h-3 bg-white rounded-full transition-all ${showAddresses ? 'left-7 md:left-6' : 'left-1'}`} />
                  </button>
                </div>

                {showAddresses && (
                  <>
                    <input
                      placeholder="DELIVERY ADDRESS"
                      value={address}
                      onChange={(e) => setAddress(e.target.value.toUpperCase())}
                      className="w-full bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 py-5 md:py-6 px-6 md:px-8 rounded-xl md:rounded-2xl text-white text-xs md:text-[11px] font-black uppercase outline-none focus:border-orange-500 transition-all"
                    />

                    {/* PAYMENT METHOD */}
                    <div className="bg-blue-500/10 border border-blue-500/30 p-4 rounded-xl">
                      <p className="text-xs font-black text-blue-400 uppercase mb-3">Payment Method</p>
                      <div className="space-y-2">
                        <button
                          onClick={() => setPaymentMethod('cash')}
                          className={`w-full p-3 rounded-lg font-black text-xs uppercase transition-all ${
                            paymentMethod === 'cash'
                              ? 'bg-blue-600 text-white'
                              : 'bg-black/50 text-zinc-400 hover:bg-black/70'
                          }`}
                        >
                          💵 Cash on Delivery
                        </button>
                        <button
                          onClick={() => setPaymentMethod('transfer')}
                          className={`w-full p-3 rounded-lg font-black text-xs uppercase transition-all ${
                            paymentMethod === 'transfer'
                              ? 'bg-blue-600 text-white'
                              : 'bg-black/50 text-zinc-400 hover:bg-black/70'
                          }`}
                        >
                          📱 Transfer on Delivery
                        </button>
                      </div>
                    </div>

                    {/* DELIVERY INFO WITH ESTIMATED FEE */}
                    <div className="bg-orange-500/10 border border-orange-500/30 p-4 rounded-xl">
                      <div className="flex items-start gap-2 mb-3">
                        <AlertCircle size={16} className="text-orange-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-black text-orange-400 uppercase mb-1">Delivery Fee</p>
                          <p className="text-xs text-orange-400/80 leading-relaxed">
                            <strong>Estimated:</strong> ₦{estimatedDeliveryFee.toLocaleString()} (₦{deliveryFeePerKm}/km)
                          </p>
                          <p className="text-xs text-orange-400/60 leading-relaxed mt-2">
                            Final fee will be calculated based on actual distance traveled. 
                            Our driver will measure and inform you upon arrival. 
                            Pay {paymentMethod === 'cash' ? 'cash' : 'via transfer'} on delivery.
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* UPDATE TOTAL DISPLAY */}
              <div className="flex justify-between items-center mb-8 md:mb-10 px-2 md:px-4 border-t border-zinc-900 pt-6 md:pt-8">
                <span className="text-xl md:text-2xl font-black italic uppercase">
                  {showAddresses ? 'Products Total' : 'Total'}
                </span>
                <span className="text-xl md:text-2xl font-black italic text-orange-500">
                  ₦{cart.reduce((s, i) => s + i.price, 0).toLocaleString()}
                </span>
              </div>

              {showAddresses && (
                <div className="bg-zinc-900/50 p-4 rounded-xl mb-8 text-center">
                  <p className="text-xs text-zinc-400 font-bold">
                    + Delivery Fee (≈ ₦{estimatedDeliveryFee.toLocaleString()}, calculated on arrival)
                  </p>
                </div>
              )}

              <button 
                onClick={handleConfirmOrder}
                disabled={orderStatus === 'loading'}
                className={`w-full py-6 rounded-2xl font-black uppercase text-sm tracking-widest transition-all active:scale-95 mb-4 ${
                  orderStatus === 'loading' 
                    ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' 
                    : 'bg-orange-600 text-white hover:bg-orange-500 shadow-xl shadow-orange-900/20'
                }`}
              >
                {orderStatus === 'loading' ? (
                  <div className="flex items-center justify-center gap-2">
                    <RefreshCw size={16} className="animate-spin" /> PROCESSING...
                  </div>
                ) : (
                  'Place Order'
                )}
              </button>

              <button 
                onClick={() => setShowCheckout(false)}
                className="w-full py-4 text-[10px] font-black uppercase text-zinc-600 hover:text-white transition-colors"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="py-12 md:py-20 text-center border-t border-zinc-900 mt-16 md:mt-20 opacity-40">
         <button onClick={() => setIsUiHidden(!isUiHidden)} className="text-[9px] md:text-[10px] font-black text-white uppercase tracking-[0.4em] md:tracking-[0.5em] mb-6 md:mb-10 hover:text-orange-500 transition-colors">Hide UI</button>
         <p className="text-[9px] md:text-[10px] font-bold tracking-[1em] md:tracking-[1.5em] text-white uppercase">P O P O P ' S  D R E A M  •  2 0 2 6</p>
      </footer>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #18181b;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #3f3f46;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #f97316;
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}