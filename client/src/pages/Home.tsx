import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { Heart, ShoppingBag, Search, CheckCircle2, X, AlertCircle, Download, Copy, Package } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import html2canvas from 'html2canvas';

// ✅ Custom SVG icons
const InstagramIcon = ({ size = 16, className = '' }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
  </svg>
);

const TwitterXIcon = ({ size = 16, className = '' }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const WhatsAppIcon = ({ size = 16, className = '' }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
  </svg>
);

// ✅ Shared date formatter used across receipt and displays
const formatOrderDateTime = (isoString: string): string => {
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

export default function Home() {
  const navigate = useNavigate();
  const receiptRef = useRef<HTMLDivElement>(null);

  // --- 1. CORE SYSTEM & UI STATE ---
  const [storeName, setStoreName] = useState('LOCAL MARKET');
  const [storeSettings, setStoreSettings] = useState<any>(null);
  const [isUiHidden, setIsUiHidden] = useState(false);
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);
  const [showAddresses, setShowAddresses] = useState(false);
  const [orderId, setOrderId] = useState<string | number>('');
  const [deliveryFeePerKm, setDeliveryFeePerKm] = useState(150);
  const [hasActiveOrder, setHasActiveOrder] = useState(false);

  // --- 2. SHOPPING & FILTER STATE ---
  const [cart, setCart] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [showCheckout, setShowCheckout] = useState(false);
  const [cartEffect, setCartEffect] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');

  // --- 3. DISCOUNT STATE ---
  const [promoCode, setPromoCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<any>(null);
  const [promoError, setPromoError] = useState('');

  // --- 4. ORDER SUCCESS STATE ---
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [orderIdCopied, setOrderIdCopied] = useState(false);

  // --- LOAD FAVORITES & ACTIVE ORDER FROM LOCALSTORAGE ---
  useEffect(() => {
    const savedFavorites = localStorage.getItem('customer_favorites');
    if (savedFavorites) {
      try {
        const parsed = JSON.parse(savedFavorites);
        setFavorites(Array.isArray(parsed) ? parsed : []);
      } catch (err) {
        setFavorites([]);
      }
    }
    const savedOrderId = localStorage.getItem('active_order_id');
    if (savedOrderId) setHasActiveOrder(true);
  }, []);

  useEffect(() => {
    if (favorites.length >= 0) {
      localStorage.setItem('customer_favorites', JSON.stringify(favorites));
    }
  }, [favorites]);

  // --- 5. DATABASE STATE ---
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [allOrders, setAllOrders] = useState<any[]>([]);
  const [orderStatus, setOrderStatus] = useState<'shopping' | 'loading' | 'success'>('shopping');

  // --- 6. FORM STATE ---
  const [clientName, setClientName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');

  // --- 7. DATA FETCHING ---
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
      const { data } = await supabase.from('store_settings').select('*').eq('id', 1).single();
      if (data) {
        setStoreSettings(data);
        setStoreName(data.store_name);
        setDeliveryFeePerKm(data.delivery_fee_per_km || 150);
      }
    } catch (err) {
      console.error('Error fetching store settings:', err);
    }
  };

  // --- 8. REAL-TIME SUBSCRIPTION ---
  useEffect(() => {
    fetchProducts();
    fetchOrders();
    fetchCategories();
    fetchStoreSettings();

    const channel = supabase
      .channel('db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => { if (isAutoRefresh) fetchOrders(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => { if (isAutoRefresh) fetchProducts(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'store_settings' }, () => { fetchStoreSettings(); })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [isAutoRefresh]);

  // --- 9. PROMO CODE VALIDATION ---
  const applyPromoCode = async () => {
    if (!promoCode.trim()) return;
    setPromoError('');
    const { data, error } = await supabase
      .from('discounts')
      .select('*')
      .eq('code_name', promoCode.toUpperCase())
      .eq('is_active', true)
      .single();

    if (error || !data) {
      setPromoError('Invalid or expired promo code');
      setAppliedDiscount(null);
      return;
    }
    setAppliedDiscount(data);
    setPromoError('');
  };

  const removeDiscount = () => {
    setAppliedDiscount(null);
    setPromoCode('');
    setPromoError('');
  };

  // --- 10. CART CALCULATIONS ---
  const subtotal = cart.reduce((s, i) => s + i.price, 0);
  const discountAmount = appliedDiscount ? (subtotal * appliedDiscount.percentage_off) / 100 : 0;
  const afterDiscount = subtotal - discountAmount;
  const grandTotal = afterDiscount;

  // --- 11. ACTIONS ---
  const triggerCartEffect = () => {
    setCartEffect(true);
    setTimeout(() => setCartEffect(false), 800);
  };

  const handleConfirmOrder = async () => {
    if (!clientName.trim()) { alert('Please enter your name'); return; }
    if (showAddresses && !address.trim()) { alert('Please enter delivery address'); return; }
    if (cart.length === 0) { alert('Your bag is empty'); return; }

    setOrderStatus('loading');
    const orderItems = cart.map(i => i.name).join(', ');
    const currentDate = new Date().toISOString();

    const orderData: any = {
      customer_name: clientName.toUpperCase(),
      phone_number: phoneNumber.trim() || null,
      total_price: parseFloat(afterDiscount.toFixed(2)),
      items: orderItems,
      address: showAddresses ? address : null,
      status: "PENDING",
      store_name: storeSettings?.store_name || storeName,
      payment_method: showAddresses ? paymentMethod : 'pickup',
      discount_code: appliedDiscount ? appliedDiscount.code_name : null,
      discount_amount: discountAmount,
      created_at: currentDate
    };

    const { data, error } = await supabase.from('orders').insert([orderData]).select();

    if (error) {
      console.error('Order Error:', error);
      setOrderStatus('shopping');
      alert("Order failed: " + error.message);
      return;
    }

    for (const item of cart) {
      const currentStock = item.stock || 0;
      const newStock = Math.max(0, currentStock - 1);
      await supabase.from('products').update({ stock: newStock }).eq('id', item.id);
    }

    if (data && data.length > 0) {
      const newOrderId = data[0].id;
      setOrderId(newOrderId);

      setOrderDetails({
        id: newOrderId,
        customer_name: clientName.toUpperCase(),
        phone_number: phoneNumber || 'N/A',
        items: orderItems,
        subtotal: subtotal,
        discount_code: appliedDiscount?.code_name || null,
        discount_amount: discountAmount,
        grand_total: grandTotal,
        address: showAddresses ? address : null,
        payment_method: showAddresses ? paymentMethod : 'pickup',
        created_at: currentDate,
        store_name: storeSettings?.store_name || storeName
      });

      localStorage.setItem('active_order_id', newOrderId.toString());
      localStorage.setItem('order_timestamp', currentDate);
      const orderHistory = JSON.parse(localStorage.getItem('order_history') || '[]');
      orderHistory.unshift(newOrderId);
      localStorage.setItem('order_history', JSON.stringify(orderHistory.slice(0, 3)));

      setHasActiveOrder(true);
      setOrderStatus('success');
      setCart([]);
      setClientName('');
      setPhoneNumber('');
      setAddress('');
      setPromoCode('');
      setAppliedDiscount(null);
      fetchProducts();
    } else {
      setOrderStatus('shopping');
      alert("Order failed. Please try again.");
    }
  };

  // --- 12. RECEIPT FUNCTIONS ---
  const copyOrderId = () => {
    navigator.clipboard.writeText(`${orderId}`);
    setOrderIdCopied(true);
    setTimeout(() => setOrderIdCopied(false), 2000);
  };

  const saveReceiptAsImage = async () => {
    const receiptElement = receiptRef.current;
    if (!receiptElement) {
      alert('Receipt not ready. Please wait a moment and try again.');
      return;
    }
    try {
      // Brief wait so the hidden element is fully painted
      await new Promise(resolve => setTimeout(resolve, 400));
      const canvas = await html2canvas(receiptElement, {
        backgroundColor: '#0a0a0a',
        scale: 3,
        logging: false,
        useCORS: true,
        allowTaint: true,
        windowWidth: 480,
      });
      const link = document.createElement('a');
      link.download = `receipt-${orderId}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      alert('✅ Receipt saved!');
    } catch (err) {
      console.error('Receipt save error:', err);
      alert(`Could not save receipt. Please screenshot it instead.\n\nError: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleTrackNow = () => { navigate('/track'); };

  const filteredItems = menuItems.filter(item => {
    const matchesSearch = item.name.toUpperCase().includes(searchQuery.toUpperCase());
    const matchesCategory = activeCategory === 'All' ||
      (activeCategory === 'Favs' && favorites.includes(item.id)) ||
      item.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  // --- 13. SUCCESS VIEW — PROFESSIONAL RECEIPT ---
  if (orderStatus === 'success' && orderDetails) {
    const mono = "'Courier New', Courier, monospace";
    const barWidths = [2,1,3,1,2,4,1,2,1,3,2,1,4,1,2,1,3,2,1,2,4,1,3,1,2,1,2,3,1,4,2,1,2,1,3];
    const barcodeNum = `${String(orderDetails.id).padStart(4,'0')}-${new Date(orderDetails.created_at).getTime().toString().slice(-8)}`;
    const itemsList: string[] = orderDetails.items.split(', ');

    // The hidden receipt rendered off-screen — captured by html2canvas with 100% inline styles
    const HiddenReceipt = () => (
      <div ref={receiptRef} style={{
        position: 'fixed', left: '-9999px', top: '0',
        width: '480px', fontFamily: mono, color: '#ffffff',
        background: '#0a0a0a',
      }}>
        {/* header */}
        <div style={{ background: '#f97316', padding: '28px 32px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: '26px', fontWeight: '900', letterSpacing: '0.22em', textTransform: 'uppercase', color: '#000000', marginBottom: '4px' }}>
            {orderDetails.store_name}
          </div>
          <div style={{ fontSize: '9px', fontWeight: '700', letterSpacing: '0.4em', textTransform: 'uppercase', color: 'rgba(0,0,0,0.6)' }}>
            Official Purchase Receipt
          </div>
        </div>

        {/* confirmed strip */}
        <div style={{ background: '#161616', padding: '10px 32px', textAlign: 'center', borderBottom: '1px solid #222' }}>
          <span style={{ fontSize: '10px', fontWeight: '900', letterSpacing: '0.4em', textTransform: 'uppercase', color: '#22c55e' }}>
            ✓ &nbsp; ORDER CONFIRMED &nbsp; ✓
          </span>
        </div>

        {/* body */}
        <div style={{ background: '#111111', padding: '28px 32px', borderLeft: '1px solid #1f1f1f', borderRight: '1px solid #1f1f1f' }}>

          {/* order number */}
          <div style={{ textAlign: 'center', paddingBottom: '22px', borderBottom: '1px dashed #2c2c2c', marginBottom: '20px' }}>
            <div style={{ fontSize: '9px', fontWeight: '700', letterSpacing: '0.45em', color: '#555555', textTransform: 'uppercase', marginBottom: '8px' }}>Order Reference</div>
            <div style={{ fontSize: '52px', fontWeight: '900', color: '#ffffff', lineHeight: '1', letterSpacing: '-0.02em' }}>#{orderDetails.id}</div>
          </div>

          {/* date row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', borderBottom: '1px dashed #2c2c2c', marginBottom: '16px' }}>
            <span style={{ fontSize: '9px', fontWeight: '700', letterSpacing: '0.35em', color: '#555555', textTransform: 'uppercase' }}>Date &amp; Time</span>
            <span style={{ fontSize: '12px', fontWeight: '800', color: '#e0e0e0' }}>{formatOrderDateTime(orderDetails.created_at)}</span>
          </div>

          {/* customer */}
          <div style={{ display: 'flex', gap: '0', paddingBottom: '16px', borderBottom: '1px dashed #2c2c2c', marginBottom: '16px' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '9px', fontWeight: '700', letterSpacing: '0.35em', color: '#555555', textTransform: 'uppercase', marginBottom: '5px' }}>Customer</div>
              <div style={{ fontSize: '13px', fontWeight: '900', color: '#ffffff', textTransform: 'uppercase' }}>{orderDetails.customer_name}</div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '9px', fontWeight: '700', letterSpacing: '0.35em', color: '#555555', textTransform: 'uppercase', marginBottom: '5px' }}>Phone</div>
              <div style={{ fontSize: '13px', fontWeight: '800', color: '#ffffff' }}>{orderDetails.phone_number}</div>
            </div>
          </div>

          {/* address */}
          {orderDetails.address && (
            <div style={{ background: '#1a1200', borderLeft: '3px solid #f97316', padding: '12px 16px', marginBottom: '16px' }}>
              <div style={{ fontSize: '9px', fontWeight: '700', letterSpacing: '0.35em', color: '#f97316', textTransform: 'uppercase', marginBottom: '6px' }}>Delivery Address</div>
              <div style={{ fontSize: '12px', fontWeight: '800', color: '#ffffff', textTransform: 'uppercase', marginBottom: '5px' }}>{orderDetails.address}</div>
              <div style={{ fontSize: '10px', fontWeight: '600', color: '#888888' }}>
                {orderDetails.payment_method === 'cash' ? 'Cash on Delivery' : 'Transfer on Delivery'}
              </div>
            </div>
          )}

          {/* items label */}
          <div style={{ fontSize: '9px', fontWeight: '700', letterSpacing: '0.45em', color: '#555555', textTransform: 'uppercase', marginBottom: '12px' }}>Items Ordered</div>

          {/* item rows */}
          {itemsList.map((item, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '9px 0', borderBottom: '1px solid #1d1d1d' }}>
              <div style={{ width: '6px', height: '6px', background: '#f97316', borderRadius: '50%', flexShrink: 0 }} />
              <span style={{ fontSize: '13px', fontWeight: '700', color: '#dddddd', textTransform: 'uppercase' }}>{item}</span>
            </div>
          ))}

          {/* pricing */}
          <div style={{ marginTop: '18px', paddingTop: '18px', borderTop: '1px dashed #2c2c2c' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0' }}>
              <span style={{ fontSize: '11px', fontWeight: '600', color: '#777777', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Subtotal</span>
              <span style={{ fontSize: '13px', fontWeight: '800', color: '#cccccc' }}>&#8358;{orderDetails.subtotal.toLocaleString()}</span>
            </div>
            {orderDetails.discount_code && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0' }}>
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#22c55e', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Discount ({orderDetails.discount_code})</span>
                <span style={{ fontSize: '13px', fontWeight: '800', color: '#22c55e' }}>-&#8358;{orderDetails.discount_amount.toFixed(0)}</span>
              </div>
            )}
            {/* total line */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', paddingTop: '16px', borderTop: '2px solid #f97316' }}>
              <span style={{ fontSize: '14px', fontWeight: '900', color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.2em' }}>Total</span>
              <span style={{ fontSize: '36px', fontWeight: '900', color: '#f97316', lineHeight: '1', letterSpacing: '-0.02em' }}>&#8358;{orderDetails.grand_total.toLocaleString()}</span>
            </div>
            {orderDetails.address && (
              <div style={{ marginTop: '12px', padding: '9px 14px', background: '#140c00', border: '1px solid rgba(249,115,22,0.35)', textAlign: 'center' }}>
                <span style={{ fontSize: '9px', fontWeight: '700', color: '#f97316', textTransform: 'uppercase', letterSpacing: '0.2em' }}>
                  + Delivery fee collected on arrival (&#8358;{deliveryFeePerKm}/km)
                </span>
              </div>
            )}
          </div>
        </div>

        {/* footer */}
        <div style={{ background: '#0d0d0d', borderLeft: '1px solid #1f1f1f', borderRight: '1px solid #1f1f1f', borderBottom: '1px solid #1f1f1f', padding: '22px 32px 20px' }}>
          {/* barcode */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '2px', marginBottom: '8px' }}>
            {barWidths.map((w, i) => (
              <div key={i} style={{ width: `${w}px`, height: '56px', background: i % 2 === 0 ? '#ffffff' : '#000000', flexShrink: 0 }} />
            ))}
          </div>
          <div style={{ textAlign: 'center', fontSize: '9px', color: '#333333', letterSpacing: '0.2em', fontFamily: mono, marginBottom: '16px' }}>
            {barcodeNum}
          </div>
          <div style={{ borderTop: '1px dashed #222222', marginBottom: '16px' }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '9px', fontWeight: '700', letterSpacing: '0.5em', color: '#3a3a3a', textTransform: 'uppercase', marginBottom: '5px' }}>Thank you for your purchase</div>
            <div style={{ fontSize: '9px', fontWeight: '700', letterSpacing: '0.4em', color: '#2a2a2a', textTransform: 'uppercase', marginBottom: '10px' }}>Keep this receipt for your records</div>
            <div style={{ fontSize: '10px', fontWeight: '900', letterSpacing: '0.4em', color: '#f97316', textTransform: 'uppercase' }}>
              {orderDetails.store_name} • 2026
            </div>
          </div>
        </div>
      </div>
    );

    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-6 text-white">

        {/* Hidden receipt for download — rendered off-screen */}
        <HiddenReceipt />

        {/* ══ ON-SCREEN RECEIPT — beautiful Tailwind version ══ */}
        <div className="w-full max-w-md">
          <div className="rounded-none shadow-2xl shadow-black overflow-hidden mb-5">

            {/* orange header */}
            <div className="bg-orange-500 px-8 py-6 text-center">
              <h1 className="text-2xl font-black tracking-[0.2em] uppercase text-black mb-1">{orderDetails.store_name}</h1>
              <p className="text-[9px] font-bold tracking-[0.4em] uppercase text-black/60">Official Purchase Receipt</p>
            </div>

            {/* confirmed strip */}
            <div className="bg-[#161616] py-2.5 text-center border-b border-white/5">
              <span className="text-[10px] font-black tracking-[0.4em] uppercase text-green-400">✓ &nbsp; Order Confirmed &nbsp; ✓</span>
            </div>

            {/* body */}
            <div className="bg-[#111] px-8 py-7 border-x border-white/5">

              {/* order number */}
              <div className="text-center pb-5 border-b border-dashed border-white/10 mb-5">
                <p className="text-[9px] font-bold tracking-[0.45em] uppercase text-zinc-600 mb-2">Order Reference</p>
                <p className="text-5xl font-black text-white" style={{ fontFamily: mono }}>#{orderDetails.id}</p>
              </div>

              {/* date */}
              <div className="flex justify-between items-center pb-4 border-b border-dashed border-white/10 mb-4">
                <span className="text-[9px] font-bold tracking-widest uppercase text-zinc-600">Date &amp; Time</span>
                <span className="text-xs font-bold text-zinc-200">{formatOrderDateTime(orderDetails.created_at)}</span>
              </div>

              {/* customer */}
              <div className="flex pb-4 border-b border-dashed border-white/10 mb-4">
                <div className="flex-1">
                  <p className="text-[9px] font-bold tracking-widest uppercase text-zinc-600 mb-1">Customer</p>
                  <p className="text-sm font-black uppercase text-white">{orderDetails.customer_name}</p>
                </div>
                <div className="flex-1">
                  <p className="text-[9px] font-bold tracking-widest uppercase text-zinc-600 mb-1">Phone</p>
                  <p className="text-sm font-bold text-white">{orderDetails.phone_number}</p>
                </div>
              </div>

              {/* address */}
              {orderDetails.address && (
                <div className="border-l-[3px] border-orange-500 bg-orange-950/30 pl-4 py-3 mb-4">
                  <p className="text-[9px] font-bold tracking-widest uppercase text-orange-400 mb-1.5">Delivery Address</p>
                  <p className="text-xs font-black uppercase text-white mb-1">{orderDetails.address}</p>
                  <p className="text-[10px] text-zinc-500">{orderDetails.payment_method === 'cash' ? 'Cash on Delivery' : 'Transfer on Delivery'}</p>
                </div>
              )}

              {/* items */}
              <p className="text-[9px] font-bold tracking-[0.45em] uppercase text-zinc-600 mb-3">Items Ordered</p>
              {itemsList.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 py-2.5 border-b border-white/5">
                  <div className="w-1.5 h-1.5 bg-orange-500 rounded-full flex-shrink-0" />
                  <span className="text-sm font-bold uppercase text-zinc-300">{item}</span>
                </div>
              ))}

              {/* pricing */}
              <div className="mt-5 pt-5 border-t border-dashed border-white/10">
                <div className="flex justify-between py-1">
                  <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Subtotal</span>
                  <span className="text-sm font-bold text-zinc-300">₦{orderDetails.subtotal.toLocaleString()}</span>
                </div>
                {orderDetails.discount_code && (
                  <div className="flex justify-between py-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-green-400">Discount ({orderDetails.discount_code})</span>
                    <span className="text-sm font-bold text-green-400">−₦{orderDetails.discount_amount.toFixed(0)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center mt-4 pt-4 border-t-2 border-orange-500">
                  <span className="text-sm font-black uppercase tracking-widest text-white">Total</span>
                  <span className="text-4xl font-black text-orange-500 leading-none" style={{ fontFamily: mono }}>₦{orderDetails.grand_total.toLocaleString()}</span>
                </div>
                {orderDetails.address && (
                  <div className="mt-3 py-2 px-3 bg-orange-950/40 border border-orange-500/30 text-center">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-orange-400">+ Delivery fee collected on arrival (₦{deliveryFeePerKm}/km)</p>
                  </div>
                )}
              </div>
            </div>

            {/* footer */}
            <div className="bg-[#0d0d0d] border-x border-b border-white/5 px-8 py-5">
              {/* barcode */}
              <div className="flex justify-center gap-0.5 mb-2">
                {barWidths.map((w, i) => (
                  <div key={i} style={{ width: `${w}px` }} className={`h-12 ${i % 2 === 0 ? 'bg-white' : 'bg-black'} flex-shrink-0`} />
                ))}
              </div>
              <p className="text-center text-[8px] text-zinc-700 tracking-widest mb-4" style={{ fontFamily: mono }}>{barcodeNum}</p>
              <div className="border-t border-dashed border-white/10 mb-4" />
              <div className="text-center space-y-1">
                <p className="text-[9px] font-bold tracking-[0.5em] uppercase text-zinc-700">Thank you for your purchase</p>
                <p className="text-[9px] font-bold tracking-[0.4em] uppercase text-zinc-800">Keep this receipt for your records</p>
                <p className="text-[10px] font-black tracking-[0.4em] uppercase text-orange-500 pt-1">{orderDetails.store_name} • 2026</p>
              </div>
            </div>
          </div>

          {/* ── ACTION BUTTONS ── */}
          <div className="space-y-3">
            <div className="bg-zinc-950 border border-zinc-900 p-4 rounded-xl">
              <p className="text-xs font-black text-orange-500 uppercase mb-3 flex items-center gap-2">
                <Package size={14} /> How to Track Your Order
              </p>
              <div className="space-y-1.5 text-xs text-zinc-400">
                <div className="flex gap-2"><span className="text-orange-500 font-black">1.</span><p>Click <strong className="text-white">"Copy Order ID"</strong> below</p></div>
                <div className="flex gap-2"><span className="text-orange-500 font-black">2.</span><p>Click <strong className="text-white">"Track Now"</strong> — your ID is auto-filled</p></div>
                <div className="flex gap-2"><span className="text-orange-500 font-black">3.</span><p>Save the receipt image as your purchase record</p></div>
              </div>
            </div>

            <button onClick={copyOrderId} className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-xl font-black uppercase text-xs tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2">
              {orderIdCopied ? <><CheckCircle2 size={16} /> Copied!</> : <><Copy size={16} /> Copy Order ID #{orderId}</>}
            </button>

            <button onClick={saveReceiptAsImage} className="w-full bg-green-600 hover:bg-green-500 text-white py-4 rounded-xl font-black uppercase text-xs tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2">
              <Download size={16} /> Save Receipt as Image
            </button>

            <button onClick={handleTrackNow} className="w-full bg-orange-600 hover:bg-orange-500 text-white py-4 rounded-xl font-black uppercase text-xs tracking-widest transition-all active:scale-95 shadow-lg shadow-orange-500/30">
              🚀 Track My Order Now
            </button>

            <button onClick={() => setOrderStatus('shopping')} className="w-full bg-zinc-900 text-zinc-400 hover:text-white py-4 rounded-xl font-black uppercase text-xs tracking-widest transition-all active:scale-95">
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-black text-white font-sans transition-all duration-700 ${isUiHidden ? 'grayscale brightness-50' : ''}`}>

      {/* NAVIGATION */}
      <nav className="p-4 md:p-6 lg:p-8 flex justify-between items-center max-w-full px-6 lg:px-20 mx-auto sticky top-0 bg-black/90 backdrop-blur-xl z-50 border-b border-zinc-900">
        <div className="flex items-center gap-3">
          <div className="bg-orange-500/10 p-2 rounded-lg">
            <ShoppingBag className="text-orange-500" size={20} />
          </div>
          <div>
            <h1 className="text-xl font-black italic tracking-tighter uppercase">{storeName}</h1>
            <p className="text-[8px] font-bold text-zinc-600 tracking-widest uppercase">Partner Store</p>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-5">
          <Link to="/track" className="text-xs font-black text-zinc-500 hover:text-orange-500 uppercase italic transition-colors relative">
            Track Order
            {hasActiveOrder && (
              <span className="absolute -top-1 -right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            )}
          </Link>
          <Link to="/contact" className="text-xs font-black text-zinc-500 hover:text-orange-500 uppercase italic transition-colors">
            Contact Us
          </Link>
          {storeSettings && (storeSettings.instagram_url || storeSettings.whatsapp_url || storeSettings.twitter_url) && (
            <div className="flex items-center gap-2 border-l border-zinc-800 pl-5">
              {storeSettings.instagram_url && (
                <a href={storeSettings.instagram_url} target="_blank" rel="noopener noreferrer" className="text-zinc-600 hover:text-pink-500 transition-all hover:scale-110 p-1.5 rounded-lg hover:bg-pink-500/10" title="Instagram">
                  <InstagramIcon size={15} />
                </a>
              )}
              {storeSettings.whatsapp_url && (
                <a href={storeSettings.whatsapp_url} target="_blank" rel="noopener noreferrer" className="text-zinc-600 hover:text-green-500 transition-all hover:scale-110 p-1.5 rounded-lg hover:bg-green-500/10" title="WhatsApp">
                  <WhatsAppIcon size={15} />
                </a>
              )}
              {storeSettings.twitter_url && (
                <a href={storeSettings.twitter_url} target="_blank" rel="noopener noreferrer" className="text-zinc-600 hover:text-sky-400 transition-all hover:scale-110 p-1.5 rounded-lg hover:bg-sky-500/10" title="Twitter / X">
                  <TwitterXIcon size={15} />
                </a>
              )}
            </div>
          )}
        </div>

        <button
          onClick={() => setShowCheckout(true)}
          className={`border border-white/20 rounded-full px-6 py-3 text-xs font-black uppercase tracking-widest bg-black transition-all ${cartEffect ? 'scale-110 border-orange-500 shadow-[0_0_30px_rgba(234,88,12,0.5)]' : ''}`}
        >
          Bag ({cart.length})
        </button>
      </nav>

      {/* SEARCH */}
      <div className="max-w-2xl mx-auto px-6 lg:px-8 mt-12 text-center">
        <div className="relative group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-700 group-focus-within:text-orange-500 transition-colors" size={20} />
          <input
            placeholder="SEARCH MARKET..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-950/50 backdrop-blur-md border border-zinc-900 rounded-2xl py-7 pl-16 pr-8 text-xs font-black uppercase tracking-[0.3em] outline-none focus:border-orange-500/40 transition-all shadow-2xl"
          />
        </div>
      </div>

      {/* CATEGORIES */}
      <div className="flex gap-3 overflow-x-auto no-scrollbar py-4 px-6 lg:px-20 max-w-full mx-auto mt-8">
        {['All', 'Favs', ...categories.map(c => c.name)].map((catName) => (
          <button
            key={catName}
            onClick={() => setActiveCategory(catName)}
            className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase border transition-all whitespace-nowrap ${activeCategory === catName ? 'bg-orange-600 border-orange-600 text-white' : 'bg-zinc-900 border-zinc-800 text-zinc-500'}`}
          >
            {catName === 'Favs' ? `❤️ ${catName} (${favorites.length})` : catName}
          </button>
        ))}
      </div>

      {/* PRODUCT GRID */}
      <div className="max-w-full px-6 lg:px-20 mx-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 py-12">
        {filteredItems.map((item) => {
          const stock = item.stock || 0;
          const isSoldOut = stock <= 0;
          const isLowStock = stock > 0 && stock < 5;

          return (
            <div key={item.id} className={`bg-zinc-950/50 backdrop-blur-md border border-zinc-900 rounded-3xl p-5 group transition-all hover:border-orange-500/30 hover:scale-105 hover:shadow-2xl hover:shadow-orange-500/10 ${isSoldOut ? 'opacity-60' : ''}`}>
              <div className="relative aspect-[4/3] rounded-[2.5rem] overflow-hidden mb-8">
                <img src={item.image} className={`w-full h-full object-cover transition-transform duration-700 ${isSoldOut ? 'grayscale' : 'group-hover:scale-110'}`} alt={item.name} />
                {isSoldOut && (
                  <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center">
                    <div className="bg-red-600 px-4 py-2 rounded-xl rotate-[-15deg]">
                      <p className="text-white font-black text-sm uppercase tracking-wider">SOLD OUT</p>
                    </div>
                  </div>
                )}
                {isLowStock && !isSoldOut && (
                  <div className="absolute top-3 left-3 bg-yellow-500 px-3 py-1 rounded-lg">
                    <p className="text-black font-black text-[8px] uppercase">Only {stock} left!</p>
                  </div>
                )}
                <button
                  onClick={() => {
                    setFavorites(f => {
                      const isFavorited = f.includes(item.id);
                      return isFavorited ? f.filter(x => x !== item.id) : [...f, item.id];
                    });
                  }}
                  className="absolute top-5 right-5 bg-black/50 p-4 rounded-full backdrop-blur-md hover:bg-black/70 transition-all active:scale-95"
                >
                  <Heart size={14} className={`transition-all ${favorites.includes(item.id) ? 'fill-orange-500 text-orange-500 scale-110' : 'text-white'}`} />
                </button>
              </div>
              <div className="px-4 text-center">
                <h3 className="text-xs font-black italic uppercase mb-2 line-clamp-2">{item.name}</h3>
                <p className="text-orange-500 font-black mb-8 text-xl italic">₦{item.price?.toLocaleString()}</p>
                <button
                  onClick={() => { if (!isSoldOut) { setCart([...cart, item]); triggerCartEffect(); } }}
                  disabled={isSoldOut}
                  className={`w-full py-5 rounded-2xl text-[10px] font-black uppercase transition-all active:scale-95 ${isSoldOut ? 'bg-zinc-900/50 text-zinc-600 cursor-not-allowed' : 'bg-zinc-900/80 backdrop-blur-sm text-zinc-500 group-hover:bg-white group-hover:text-black'}`}
                >
                  {isSoldOut ? 'Out of Stock' : 'Add to Bag'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* CHECKOUT MODAL */}
      {showCheckout && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/95 backdrop-blur-md">
          <div className="bg-[#0c0c0c] border border-zinc-900 w-full max-w-lg rounded-[4rem] shadow-2xl animate-in zoom-in max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="p-10">
              <div className="flex justify-between items-center mb-10">
                <h2 className="text-4xl font-black italic uppercase">Your Bag</h2>
                <button onClick={() => setShowCheckout(false)} className="text-zinc-600 hover:text-white transition-colors p-2">
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-3 mb-10 max-h-[200px] overflow-y-auto custom-scrollbar pr-2">
                {cart.map((item, i) => (
                  <div key={i} className="bg-black/50 backdrop-blur-sm border border-zinc-900 p-5 rounded-2xl flex justify-between items-center group">
                    <span className="text-[10px] font-black uppercase italic tracking-tighter">{item.name}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-orange-500 font-bold text-[10px]">₦{item.price.toLocaleString()}</span>
                      <button onClick={() => { const n = [...cart]; n.splice(i, 1); setCart(n); }} className="text-red-900 hover:text-red-500 text-[8px] font-black uppercase opacity-0 group-hover:opacity-100 transition-opacity px-2 py-1">Remove</button>
                    </div>
                  </div>
                ))}
                {cart.length === 0 && <p className="text-center text-zinc-700 text-[9px] font-black py-4 uppercase tracking-widest">Bag is Empty</p>}
              </div>

              <div className="space-y-4 mb-10">
                <input
                  placeholder="FULL NAME"
                  value={clientName}
                  onChange={e => setClientName(e.target.value.toUpperCase())}
                  className="w-full bg-black/50 backdrop-blur-sm border border-zinc-900 rounded-2xl py-6 px-8 text-[11px] font-black uppercase outline-none focus:border-orange-500 transition-all"
                />
                <input
                  placeholder="PHONE NUMBER (Optional)"
                  value={phoneNumber}
                  onChange={e => setPhoneNumber(e.target.value)}
                  className="w-full bg-black/50 backdrop-blur-sm border border-zinc-900 rounded-2xl py-6 px-8 text-[11px] font-black uppercase outline-none focus:border-orange-500 transition-all"
                  type="tel"
                />

                <div className="bg-purple-500/10 border border-purple-500/30 p-4 rounded-2xl">
                  <p className="text-xs font-black text-purple-400 uppercase mb-3">🎉 Have a Promo Code?</p>
                  <div className="flex gap-2">
                    <input
                      placeholder="ENTER CODE"
                      value={promoCode}
                      onChange={e => setPromoCode(e.target.value.toUpperCase())}
                      disabled={!!appliedDiscount}
                      className="flex-1 bg-black/50 border border-purple-500/30 rounded-xl py-3 px-4 text-xs font-black uppercase outline-none focus:border-purple-500 disabled:opacity-50"
                    />
                    {appliedDiscount ? (
                      <button onClick={removeDiscount} className="bg-red-600 hover:bg-red-500 px-4 rounded-xl text-xs font-black uppercase transition-all">Remove</button>
                    ) : (
                      <button onClick={applyPromoCode} className="bg-purple-600 hover:bg-purple-500 px-4 rounded-xl text-xs font-black uppercase transition-all">Apply</button>
                    )}
                  </div>
                  {promoError && <p className="text-red-500 text-xs font-bold mt-2">{promoError}</p>}
                  {appliedDiscount && (
                    <div className="mt-3 bg-green-500/10 border border-green-500/30 p-2 rounded-lg">
                      <p className="text-green-500 text-xs font-bold">✅ {appliedDiscount.percentage_off}% OFF Applied!</p>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between p-3 bg-zinc-900/50 backdrop-blur-sm rounded-xl border border-zinc-800">
                  <span className="text-[10px] font-black text-zinc-500 uppercase">Need Delivery?</span>
                  <button
                    onClick={() => setShowAddresses(!showAddresses)}
                    className={`w-10 h-5 rounded-full transition-all relative ${showAddresses ? 'bg-orange-500' : 'bg-zinc-700'}`}
                  >
                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${showAddresses ? 'left-6' : 'left-1'}`} />
                  </button>
                </div>

                {showAddresses && (
                  <>
                    <input
                      placeholder="DELIVERY ADDRESS"
                      value={address}
                      onChange={(e) => setAddress(e.target.value.toUpperCase())}
                      className="w-full bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 py-6 px-8 rounded-2xl text-white text-[11px] font-black uppercase outline-none focus:border-orange-500 transition-all"
                    />
                    <div className="bg-blue-500/10 border border-blue-500/30 p-4 rounded-xl">
                      <p className="text-xs font-black text-blue-400 uppercase mb-3">Payment Method</p>
                      <div className="space-y-2">
                        <button onClick={() => setPaymentMethod('cash')} className={`w-full p-3 rounded-lg font-black text-xs uppercase transition-all ${paymentMethod === 'cash' ? 'bg-blue-600 text-white' : 'bg-black/50 text-zinc-400 hover:bg-black/70'}`}>
                          💵 Cash on Delivery
                        </button>
                        <button onClick={() => setPaymentMethod('transfer')} className={`w-full p-3 rounded-lg font-black text-xs uppercase transition-all ${paymentMethod === 'transfer' ? 'bg-blue-600 text-white' : 'bg-black/50 text-zinc-400 hover:bg-black/70'}`}>
                          📱 Transfer on Delivery
                        </button>
                      </div>
                    </div>
                    <div className="bg-orange-500/10 border border-orange-500/30 p-4 rounded-xl">
                      <div className="flex items-start gap-2">
                        <AlertCircle size={16} className="text-orange-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-black text-orange-400 uppercase mb-1">Delivery Fee</p>
                          <p className="text-xs text-orange-400/80 leading-relaxed">Calculated on arrival (₦{deliveryFeePerKm}/km based on distance)</p>
                          <p className="text-xs text-orange-400/60 leading-relaxed mt-2">Pay {paymentMethod === 'cash' ? 'cash' : 'via transfer'} on delivery</p>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="space-y-3 mb-8">
                <div className="flex justify-between text-sm">
                  <span className="font-bold uppercase text-zinc-500">Subtotal</span>
                  <span className="font-black">₦{subtotal.toLocaleString()}</span>
                </div>
                {appliedDiscount && (
                  <div className="flex justify-between text-sm text-green-500">
                    <span className="font-bold uppercase">Discount ({appliedDiscount.code_name})</span>
                    <span className="font-black">-₦{discountAmount.toFixed(0)}</span>
                  </div>
                )}
                <div className="pt-4 border-t border-zinc-900 flex justify-between">
                  <span className="text-2xl font-black italic uppercase">Total</span>
                  <span className="text-2xl font-black italic text-orange-500">₦{grandTotal.toLocaleString()}</span>
                </div>
                {showAddresses && <p className="text-[9px] text-zinc-500 text-center italic">+ Delivery fee (calculated on arrival)</p>}
              </div>

              <button
                onClick={handleConfirmOrder}
                disabled={orderStatus === 'loading'}
                className={`w-full py-6 rounded-2xl font-black uppercase text-sm tracking-widest transition-all active:scale-95 mb-4 ${orderStatus === 'loading' ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' : 'bg-orange-600 text-white hover:bg-orange-500 shadow-xl shadow-orange-900/20'}`}
              >
                {orderStatus === 'loading' ? 'PROCESSING...' : 'Place Order'}
              </button>

              <button onClick={() => setShowCheckout(false)} className="w-full py-4 text-[10px] font-black uppercase text-zinc-600 hover:text-white transition-colors">
                Continue Shopping
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="py-20 text-center border-t border-zinc-900 mt-20 opacity-40">
        <button onClick={() => setIsUiHidden(!isUiHidden)} className="text-[10px] font-black text-white uppercase tracking-[0.5em] mb-10 hover:text-orange-500 transition-colors">Hide UI</button>
        <p className="text-[10px] font-bold tracking-[1.5em] text-white uppercase">P O P O P ' S  D R E A M  •  2 0 2 6</p>
      </footer>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #18181b; border-radius: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #3f3f46; border-radius: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #f97316; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}