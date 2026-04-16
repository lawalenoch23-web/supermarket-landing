import ExpiryBadge from '../components/ExpiryBadge';
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { Heart, ShoppingBag, Search, CheckCircle2, X, AlertCircle, Download, Copy, Package } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import ThemeProvider from '../components/ThemeProvider';
import html2canvas from 'html2canvas';
import AnnouncementBanner from '../components/AnnouncementBanner';
import TransferPaymentDetails from '../components/TransferPayment';
import { calculateAutoDiscount, calculateDiscountedPrice, DiscountBadge, PriceDisplay } from '../components/DiscountHelper';

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

const formatOrderDateTime = (isoString: string): string => {
  const d = new Date(isoString);
  return d.toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
};

export default function Home() {
  const navigate = useNavigate();
  const receiptRef = useRef<HTMLDivElement>(null);

  const [storeName, setStoreName] = useState('LOCAL MARKET');
  const [storeSettings, setStoreSettings] = useState<any>(null);
  const [isUiHidden, setIsUiHidden] = useState(false);
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);
  const [showAddresses, setShowAddresses] = useState(false);
  const [orderId, setOrderId] = useState<string | number>('');
  const [deliveryFeePerKm, setDeliveryFeePerKm] = useState(150);
  const [hasActiveOrder, setHasActiveOrder] = useState(false);
  const [orderConfirmed, setOrderConfirmed] = useState(false);
  const [confirmCountdown, setConfirmCountdown] = useState(900); // 15 min
  const [cart, setCart] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [showCheckout, setShowCheckout] = useState(false);
  const [cartEffect, setCartEffect] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');

  const [promoCode, setPromoCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<any>(null);
  const [promoError, setPromoError] = useState('');
  const [productDiscounts, setProductDiscounts] = useState<{[key: number]: number}>({});

  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [orderIdCopied, setOrderIdCopied] = useState(false);

  const [toastItem, setToastItem] = useState<string | null>(null);
  const [toastVisible, setToastVisible] = useState(false);

  const showToast = (itemName: string) => {
    setToastItem(itemName);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2200);
  };

  useEffect(() => {
    const savedFavorites = localStorage.getItem('customer_favorites');
    if (savedFavorites) {
      try {
        const parsed = JSON.parse(savedFavorites);
        setFavorites(Array.isArray(parsed) ? parsed : []);
      } catch (err) { setFavorites([]); }
    }
    const savedOrderId = localStorage.getItem('active_order_id');
    if (savedOrderId) setHasActiveOrder(true);
  }, []);

  useEffect(() => {
    if (favorites.length >= 0) localStorage.setItem('customer_favorites', JSON.stringify(favorites));
  }, [favorites]);

  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [allOrders, setAllOrders] = useState<any[]>([]);
  const [orderStatus, setOrderStatus] = useState<'shopping' | 'loading' | 'success'>('shopping');

  const [clientName, setClientName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');

  const fetchProducts = async () => {
    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase.from('products').select('*').gt('stock', 0)
      .or(`expiry_date.is.null,expiry_date.gte.${today}`).order('id', { ascending: true });
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
    } catch (err) { console.error('Error fetching store settings:', err); }
  };

  useEffect(() => {
    const calculateDiscounts = async () => {
      const discounts: {[key: number]: number} = {};
      for (const product of menuItems) {
        const autoDiscount = await calculateAutoDiscount(product.expiry_date);
        discounts[product.id] = autoDiscount;
      }
      setProductDiscounts(discounts);
    };
    if (menuItems.length > 0) calculateDiscounts();
  }, [menuItems]);

  useEffect(() => {
    fetchProducts(); fetchOrders(); fetchCategories(); fetchStoreSettings();
    const channel = supabase.channel('db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => { if (isAutoRefresh) fetchOrders(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => { if (isAutoRefresh) fetchProducts(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'store_settings' }, () => { fetchStoreSettings(); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [isAutoRefresh]);
   
  useEffect(() => {
    if (orderStatus !== 'success') return;
    if (!orderDetails?.address) return; // pickup — no countdown needed
    if (orderConfirmed) return;
    const timer = setInterval(() => {
      setConfirmCountdown(prev => {
        if (prev <= 1) { clearInterval(timer); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [orderStatus, orderConfirmed, orderDetails?.address]);
  const applyPromoCode = async () => {
    if (!promoCode.trim()) return;
    setPromoError('');
    const { data, error } = await supabase.from('discounts').select('*')
      .eq('code_name', promoCode.toUpperCase()).eq('is_active', true).single();
    if (error || !data) { setPromoError('Invalid or expired promo code'); setAppliedDiscount(null); return; }
    setAppliedDiscount(data); setPromoError('');
  };

  const removeDiscount = () => { setAppliedDiscount(null); setPromoCode(''); setPromoError(''); };

  const subtotal = cart.reduce((s, i) => s + i.price, 0);
  const discountAmount = appliedDiscount ? (subtotal * appliedDiscount.percentage_off) / 100 : 0;
  const afterDiscount = subtotal - discountAmount;
  const grandTotal = afterDiscount;

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
      status: showAddresses ? "AWAITING_CONFIRMATION" : "PENDING",
      payment_status: showAddresses ? 'unpaid' : 'paid',
      store_name: storeSettings?.store_name || storeName,
      payment_method: showAddresses ? paymentMethod : 'pickup',
      discount_code: appliedDiscount ? appliedDiscount.code_name : null,
      discount_amount: discountAmount,
      created_at: currentDate
    };
    const { data, error } = await supabase.from('orders').insert([orderData]).select();
    if (error) { console.error('Order Error:', error); setOrderStatus('shopping'); alert("Order failed: " + error.message); return; }
    for (const item of cart) {
      const currentStock = item.stock || 0;
      await supabase.from('products').update({ stock: Math.max(0, currentStock - 1) }).eq('id', item.id);
    }
    if (data && data.length > 0) {
      const newOrderId = data[0].id;
      setOrderId(newOrderId);
      setOrderDetails({
        id: newOrderId, customer_name: clientName.toUpperCase(),
        phone_number: phoneNumber || 'N/A', items: orderItems,
        subtotal, discount_code: appliedDiscount?.code_name || null,
        discount_amount: discountAmount, grand_total: grandTotal,
        address: showAddresses ? address : null,
        payment_method: showAddresses ? paymentMethod : 'pickup',
        created_at: currentDate, store_name: storeSettings?.store_name || storeName
      });
      localStorage.setItem('active_order_id', newOrderId.toString());
      localStorage.setItem('order_timestamp', currentDate);
      const orderHistory = JSON.parse(localStorage.getItem('order_history') || '[]');
      orderHistory.unshift(newOrderId);
      localStorage.setItem('order_history', JSON.stringify(orderHistory.slice(0, 3)));
      setHasActiveOrder(true);
      setOrderStatus('success');
      setCart([]); setClientName(''); setPhoneNumber(''); setAddress('');
      setPromoCode(''); setAppliedDiscount(null);
      fetchProducts();
    } else { setOrderStatus('shopping'); alert("Order failed. Please try again."); }
  };

  const copyOrderId = () => {
    navigator.clipboard.writeText(`${orderId}`);
    setOrderIdCopied(true);
    setTimeout(() => setOrderIdCopied(false), 2000);
  };

  const saveReceiptAsImage = async () => {
    const receiptElement = receiptRef.current;
    if (!receiptElement) { alert('Receipt not ready. Please wait a moment and try again.'); return; }
    try {
      await new Promise(resolve => setTimeout(resolve, 400));
      const canvas = await html2canvas(receiptElement, {
        backgroundColor: '#0a0a0a', scale: 3, logging: false,
        useCORS: true, allowTaint: true, windowWidth: 480,
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
   
  const handleConfirmDeliveryOrder = async () => {
    const { error } = await supabase.from('orders').update({ status: 'PENDING' }).eq('id', orderId);
    if (!error) setOrderConfirmed(true);
    else alert('Failed to confirm. Please try again or visit the Track page.');
  };

  const formatCountdown = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };
  // ─────────────────────────────────────────────
  //  SUCCESS VIEW — RECEIPT
  // ─────────────────────────────────────────────
  if (orderStatus === 'success' && orderDetails) {
    const mono = "'Courier New', Courier, monospace";
    const barWidths = [2,1,3,1,2,4,1,2,1,3,2,1,4,1,2,1,3,2,1,2,4,1,3,1,2,1,2,3,1,4,2,1,2,1,3];
    const barcodeNum = `${String(orderDetails.id).padStart(4,'0')}-${new Date(orderDetails.created_at).getTime().toString().slice(-8)}`;
    const itemsList: string[] = (orderDetails.items || '').split(', ').filter(Boolean);
    const primaryColor = storeSettings?.primary_color || '#f97316';

    // ── HIDDEN RECEIPT (for html2canvas) ──
    const hiddenReceiptJsx = (
      <div ref={receiptRef} style={{
        position: 'fixed', left: '-9999px', top: '0',
        width: '480px', fontFamily: mono, color: '#ffffff', background: '#0a0a0a',
      }}>
        <div style={{ background: primaryColor, padding: '28px 32px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: '26px', fontWeight: '900', letterSpacing: '0.22em', textTransform: 'uppercase', color: '#000000', marginBottom: '4px' }}>
            {orderDetails.store_name}
          </div>
          <div style={{ fontSize: '9px', fontWeight: '700', letterSpacing: '0.4em', textTransform: 'uppercase', color: 'rgba(0,0,0,0.6)' }}>
            Official Purchase Receipt
          </div>
        </div>
        <div style={{ background: '#161616', padding: '10px 32px', textAlign: 'center', borderBottom: '1px solid #222' }}>
          <span style={{ fontSize: '10px', fontWeight: '900', letterSpacing: '0.4em', textTransform: 'uppercase', color: '#22c55e' }}>
            ✓ &nbsp; ORDER CONFIRMED &nbsp; ✓
          </span>
        </div>
        <div style={{ background: '#111111', padding: '28px 32px', borderLeft: '1px solid #1f1f1f', borderRight: '1px solid #1f1f1f' }}>
          <div style={{ textAlign: 'center', paddingBottom: '22px', borderBottom: '1px dashed #2c2c2c', marginBottom: '20px' }}>
            <div style={{ fontSize: '9px', fontWeight: '700', letterSpacing: '0.45em', color: '#555555', textTransform: 'uppercase', marginBottom: '8px' }}>Order Reference</div>
            <div style={{ fontSize: '52px', fontWeight: '900', color: '#ffffff', lineHeight: '1', letterSpacing: '-0.02em' }}>#{orderDetails.id}</div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', borderBottom: '1px dashed #2c2c2c', marginBottom: '16px' }}>
            <span style={{ fontSize: '9px', fontWeight: '700', letterSpacing: '0.35em', color: '#555555', textTransform: 'uppercase' }}>Date &amp; Time</span>
            <span style={{ fontSize: '12px', fontWeight: '800', color: '#e0e0e0' }}>{formatOrderDateTime(orderDetails.created_at)}</span>
          </div>
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
          {orderDetails.address && (
            <div style={{ background: `color-mix(in srgb, ${primaryColor} 8%, #000)`, borderLeft: `3px solid ${primaryColor}`, padding: '12px 16px', marginBottom: '16px' }}>
              <div style={{ fontSize: '9px', fontWeight: '700', letterSpacing: '0.35em', color: primaryColor, textTransform: 'uppercase', marginBottom: '6px' }}>Delivery Address</div>
              <div style={{ fontSize: '12px', fontWeight: '800', color: '#ffffff', textTransform: 'uppercase', marginBottom: '5px' }}>{orderDetails.address}</div>
              <div style={{ fontSize: '10px', fontWeight: '600', color: '#888888' }}>
                {orderDetails.payment_method === 'cash' ? 'Cash on Delivery' : 'Transfer on Delivery'}
              </div>
            </div>
          )}
          <div style={{ fontSize: '9px', fontWeight: '700', letterSpacing: '0.45em', color: '#555555', textTransform: 'uppercase', marginBottom: '12px' }}>Items Ordered</div>
          {itemsList.map((item, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '9px 0', borderBottom: '1px solid #1d1d1d' }}>
              <div style={{ width: '6px', height: '6px', background: primaryColor, borderRadius: '50%', flexShrink: 0 }} />
              <span style={{ fontSize: '13px', fontWeight: '700', color: '#dddddd', textTransform: 'uppercase' }}>{item}</span>
            </div>
          ))}
          <div style={{ marginTop: '18px', paddingTop: '18px', borderTop: '1px dashed #2c2c2c' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0' }}>
              <span style={{ fontSize: '11px', fontWeight: '600', color: '#777777', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Subtotal</span>
              <span style={{ fontSize: '13px', fontWeight: '800', color: '#cccccc' }}>&#8358;{(orderDetails.subtotal || 0).toLocaleString()}</span>
            </div>
            {orderDetails.discount_code && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0' }}>
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#22c55e', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Discount ({orderDetails.discount_code})</span>
                <span style={{ fontSize: '13px', fontWeight: '800', color: '#22c55e' }}>-&#8358;{orderDetails.discount_amount.toFixed(0)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', paddingTop: '16px', borderTop: `2px solid ${primaryColor}` }}>
              <span style={{ fontSize: '14px', fontWeight: '900', color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.2em' }}>Total</span>
              <span style={{ fontSize: '36px', fontWeight: '900', color: primaryColor, lineHeight: '1', letterSpacing: '-0.02em' }}>&#8358;{(orderDetails.grand_total || 0).toLocaleString()}</span>
            </div>
            {orderDetails.address && (
              <div style={{ marginTop: '12px', padding: '9px 14px', background: `color-mix(in srgb, ${primaryColor} 6%, #000)`, border: `1px solid color-mix(in srgb, ${primaryColor} 35%, transparent)`, textAlign: 'center' }}>
                <span style={{ fontSize: '9px', fontWeight: '700', color: primaryColor, textTransform: 'uppercase', letterSpacing: '0.2em' }}>
                  + Delivery fee collected on arrival (&#8358;{deliveryFeePerKm}/km)
                </span>
              </div>
            )}
          </div>
        </div>
        <div style={{ background: '#0d0d0d', borderLeft: '1px solid #1f1f1f', borderRight: '1px solid #1f1f1f', borderBottom: '1px solid #1f1f1f', padding: '22px 32px 20px' }}>
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
            <div style={{ fontSize: '10px', fontWeight: '900', letterSpacing: '0.4em', color: primaryColor, textTransform: 'uppercase' }}>
              {orderDetails.store_name} • 2026
            </div>
          </div>
        </div>
      </div>
    );

    return (
      <ThemeProvider>
        <div className="min-h-screen flex flex-col items-center justify-center p-6"
          style={{ backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}>
          {hiddenReceiptJsx}
          <div className="w-full max-w-md">

            {/* ── VISIBLE RECEIPT ── */}
            <div className="rounded-none shadow-2xl shadow-black overflow-hidden mb-5">

              {/* Header — dynamic primary color */}
              <div className="px-8 py-6 text-center" style={{ backgroundColor: primaryColor }}>
                <h1 className="text-2xl font-black tracking-[0.2em] uppercase text-black mb-1">{orderDetails.store_name}</h1>
                <p className="text-[9px] font-bold tracking-[0.4em] uppercase text-black/60">Official Purchase Receipt</p>
              </div>

              <div className="bg-[#161616] py-2.5 text-center border-b border-white/5">
                <span className="text-[10px] font-black tracking-[0.4em] uppercase text-green-400">✓ &nbsp; Order Confirmed &nbsp; ✓</span>
              </div>

              <div className="bg-[#111] px-8 py-7 border-x border-white/5">
                {/* Order ref */}
                <div className="text-center pb-5 border-b border-dashed border-white/10 mb-5">
                  <p className="text-[9px] font-bold tracking-[0.45em] uppercase text-zinc-600 mb-2">Order Reference</p>
                  <p className="text-5xl font-black text-white" style={{ fontFamily: mono }}>#{orderDetails.id}</p>
                </div>

                {/* Date */}
                <div className="flex justify-between items-center pb-4 border-b border-dashed border-white/10 mb-4">
                  <span className="text-[9px] font-bold tracking-widest uppercase text-zinc-600">Date &amp; Time</span>
                  <span className="text-xs font-bold text-zinc-200">{formatOrderDateTime(orderDetails.created_at)}</span>
                </div>

                {/* Customer */}
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

                {/* Address */}
                {orderDetails.address && (
                  <div className="pl-4 py-3 mb-4" style={{
                    borderLeft: `3px solid ${primaryColor}`,
                    background: `color-mix(in srgb, ${primaryColor} 10%, transparent)`
                  }}>
                    <p className="text-[9px] font-bold tracking-widest uppercase mb-1.5" style={{ color: primaryColor }}>Delivery Address</p>
                    <p className="text-xs font-black uppercase text-white mb-1">{orderDetails.address}</p>
                    <p className="text-[10px] text-zinc-500">{orderDetails.payment_method === 'cash' ? 'Cash on Delivery' : 'Transfer on Delivery'}</p>
                  </div>
                )}

                {/* Items */}
                <p className="text-[9px] font-bold tracking-[0.45em] uppercase text-zinc-600 mb-3">Items Ordered</p>
                {itemsList.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 py-2.5 border-b border-white/5">
                    <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: primaryColor }} />
                    <span className="text-sm font-bold uppercase text-zinc-300">{item}</span>
                  </div>
                ))}

                {/* Totals */}
                <div className="mt-5 pt-5 border-t border-dashed border-white/10">
                  <div className="flex justify-between py-1">
                    <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Subtotal</span>
                    <span className="text-sm font-bold text-zinc-300">₦{(orderDetails.subtotal || 0).toLocaleString()}</span>
                  </div>
                  {orderDetails.discount_code && (
                    <div className="flex justify-between py-1">
                      <span className="text-xs font-bold uppercase tracking-wider text-green-400">Discount ({orderDetails.discount_code})</span>
                      <span className="text-sm font-bold text-green-400">−₦{orderDetails.discount_amount.toFixed(0)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center mt-4 pt-4" style={{ borderTop: `2px solid ${primaryColor}` }}>
                    <span className="text-sm font-black uppercase tracking-widest text-white">Total</span>
                    <span className="text-4xl font-black leading-none" style={{ fontFamily: mono, color: primaryColor }}>
                      ₦{(orderDetails.grand_total || 0).toLocaleString()}
                    </span>
                  </div>
                  {orderDetails.address && (
                    <div className="mt-3 py-2 px-3 text-center" style={{
                      background: `color-mix(in srgb, ${primaryColor} 8%, transparent)`,
                      border: `1px solid color-mix(in srgb, ${primaryColor} 30%, transparent)`
                    }}>
                      <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: primaryColor }}>
                        + Delivery fee collected on arrival (₦{deliveryFeePerKm}/km)
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Barcode footer */}
              <div className="bg-[#0d0d0d] border-x border-b border-white/5 px-8 py-5">
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
                  <p className="text-[10px] font-black tracking-[0.4em] uppercase pt-1" style={{ color: primaryColor }}>
                    {orderDetails.store_name} • 2026
                  </p>
                </div>
              </div>
            </div>
            {/* ── DELIVERY CONFIRMATION BANNER ── */}
            {orderDetails.address && !orderConfirmed && (
              <div className="mb-5 rounded-2xl overflow-hidden border"
                style={{ borderColor: confirmCountdown === 0 ? 'rgba(239,68,68,0.4)' : `color-mix(in srgb, ${primaryColor} 40%, transparent)` }}>
                <div className="px-5 py-3 text-center text-[10px] font-black uppercase tracking-widest"
                  style={{ backgroundColor: confirmCountdown === 0 ? 'rgba(239,68,68,0.12)' : `color-mix(in srgb, ${primaryColor} 10%, transparent)`,
                           color: confirmCountdown === 0 ? '#ef4444' : primaryColor }}>
                  {confirmCountdown === 0
                    ? '⚠️ Confirmation window expired — contact the store'
                    : `⏳ Confirm within ${formatCountdown(confirmCountdown)} or order auto-cancels`}
                </div>
                {confirmCountdown > 0 && (
                  <div className="p-5 bg-black/30">
                    <p className="text-xs text-zinc-400 text-center mb-4">
                      Tap below to confirm this is a real order. Your driver won't be dispatched until you do.
                    </p>
                    <button onClick={handleConfirmDeliveryOrder}
                      className="w-full py-4 rounded-xl font-black uppercase text-sm tracking-widest text-white transition-all active:scale-95 animate-pulse"
                      style={{ backgroundColor: primaryColor, animationDuration: '2s',
                               boxShadow: `0 8px 28px color-mix(in srgb, ${primaryColor} 40%, transparent)` }}>
                      ✅ Yes, Confirm My Order
                    </button>
                  </div>
                )}
              </div>
            )}

            {orderDetails.address && orderConfirmed && (
              <div className="mb-5 rounded-2xl p-4 text-center border border-green-500/25 bg-green-500/8">
                <p className="text-sm font-black text-green-400">✓ Order Confirmed — Driver will be notified</p>
              </div>
            )}
            {/* ── ACTION BUTTONS ── */}
            <div className="space-y-3">
              <div className="bg-zinc-950 border border-zinc-900 p-4 rounded-xl">
                <p className="text-xs font-black uppercase mb-3 flex items-center gap-2" style={{ color: primaryColor }}>
                  <Package size={14} /> How to Track Your Order
                </p>
                <div className="space-y-1.5 text-xs text-zinc-400">
                  <div className="flex gap-2"><span className="font-black" style={{ color: primaryColor }}>1.</span><p>Click <strong className="text-white">"Copy Order ID"</strong> below</p></div>
                  <div className="flex gap-2"><span className="font-black" style={{ color: primaryColor }}>2.</span><p>Click <strong className="text-white">"Track Now"</strong> — your ID is auto-filled</p></div>
                  <div className="flex gap-2"><span className="font-black" style={{ color: primaryColor }}>3.</span><p>Save the receipt image as your purchase record</p></div>
                </div>
              </div>
              <button onClick={copyOrderId} className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-xl font-black uppercase text-xs tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2">
                {orderIdCopied ? <><CheckCircle2 size={16} /> Copied!</> : <><Copy size={16} /> Copy Order ID #{orderId}</>}
              </button>
              <button onClick={saveReceiptAsImage} className="w-full bg-green-600 hover:bg-green-500 text-white py-4 rounded-xl font-black uppercase text-xs tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2">
                <Download size={16} /> Save Receipt as Image
              </button>
              <button onClick={handleTrackNow} className="w-full text-white py-4 rounded-xl font-black uppercase text-xs tracking-widest transition-all active:scale-95 shadow-lg"
                style={{ backgroundColor: primaryColor, boxShadow: `0 8px 24px color-mix(in srgb, ${primaryColor} 30%, transparent)` }}>
                🚀 Track My Order Now
              </button>
              <button onClick={() => setOrderStatus('shopping')} className="w-full bg-zinc-900 text-zinc-400 hover:text-white py-4 rounded-xl font-black uppercase text-xs tracking-widest transition-all active:scale-95">
                Continue Shopping
              </button>
            </div>
          </div>
        </div>
      </ThemeProvider>
    );
  }

  // ═══════════════════════════════════════════════════
  //  MAIN SHOPPING VIEW
  // ═══════════════════════════════════════════════════
  return (
    <ThemeProvider>
      <div className="min-h-screen font-sans" style={{ backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}>

        {/* ── TOAST ── */}
        <div style={{
          position: 'fixed', bottom: '32px', left: '50%',
          transform: `translateX(-50%) translateY(${toastVisible ? '0' : '90px'})`,
          opacity: toastVisible ? 1 : 0,
          transition: 'transform 0.38s cubic-bezier(0.34,1.56,0.64,1), opacity 0.22s ease',
          zIndex: 9999, pointerEvents: 'none',
          width: 'calc(100% - 40px)', maxWidth: '340px',
        }}>
          <div className="flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl w-full" style={{
            backgroundColor: 'var(--primary-color)',
            boxShadow: '0 8px 32px color-mix(in srgb, var(--primary-color) 45%, rgba(0,0,0,0.4))',
          }}>
            <span style={{ fontSize: '18px' }}>🛒</span>
            <div className="min-w-0">
              <p className="text-white font-black text-xs uppercase tracking-wide truncate">Added to bag!</p>
              <p className="text-white/75 text-xs font-semibold truncate">{toastItem}</p>
            </div>
            <CheckCircle2 size={16} className="text-white/80 flex-shrink-0" />
          </div>
        </div>

        {/* ── NAV ── */}
        <nav className="sticky top-0 z-50" style={{
          backgroundColor: 'var(--nav-bg)', borderBottom: '1px solid var(--card-border)',
          backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        }}>
          <div className="flex items-center gap-3 px-4 md:px-10 lg:px-16 h-[62px] md:h-[80px]">
            <div className="flex items-center gap-2.5 md:gap-3 flex-shrink-0">
              {storeSettings?.logo_url ? (
                <img src={storeSettings.logo_url} alt={storeName} className="h-9 md:h-12 w-auto object-contain" />
              ) : (
                <div className="w-9 h-9 md:w-12 md:h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'var(--primary-color)' }}>
                  <ShoppingBag size={18} color="#fff" />
                </div>
              )}
              <div className="min-w-0">
                <h1 className="text-base md:text-xl lg:text-2xl font-black uppercase tracking-tight leading-tight truncate" style={{ color: 'var(--text-color)' }}>{storeName}</h1>
                <p className="text-[9px] md:text-[10px] font-semibold tracking-widest uppercase hidden sm:block" style={{ color: 'var(--text-muted)' }}>Fresh &amp; Fast</p>
              </div>
            </div>

            <div className="flex-1 hidden md:block mx-6 lg:mx-10">
              <div className="relative flex items-center rounded-xl overflow-hidden" style={{ backgroundColor: 'var(--input-bg)', border: '1.5px solid var(--card-border)' }}>
                <Search className="absolute left-4" size={16} style={{ color: 'var(--text-muted)' }} />
                <input placeholder="Search products..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent py-3 pl-11 pr-10 text-sm font-semibold outline-none" style={{ color: 'var(--text-color)' }} />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute right-4 opacity-50 hover:opacity-100 transition-opacity">
                    <X size={14} style={{ color: 'var(--text-color)' }} />
                  </button>
                )}
              </div>
            </div>

            <div className="hidden lg:flex items-center gap-4 flex-shrink-0">
              <Link to="/track" className="relative flex items-center gap-1.5 text-sm font-bold uppercase tracking-wide transition-colors whitespace-nowrap"
                style={{ color: 'var(--text-muted)' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--primary-color)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}>
                Track Order
                {hasActiveOrder && <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />}
              </Link>
              <Link to="/contact" className="text-sm font-bold uppercase tracking-wide transition-colors whitespace-nowrap"
                style={{ color: 'var(--text-muted)' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--primary-color)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}>
                Contact
              </Link>
              {storeSettings && (storeSettings.instagram_url || storeSettings.whatsapp_url || storeSettings.twitter_url) && (
                <div className="flex items-center gap-0.5 pl-4" style={{ borderLeft: '1px solid var(--card-border)' }}>
                  {storeSettings.instagram_url && (
                    <a href={storeSettings.instagram_url} target="_blank" rel="noopener noreferrer"
                      className="p-2 rounded-lg transition-all hover:scale-110" style={{ color: 'var(--text-muted)' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#e1306c'; (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(225,48,108,0.1)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'; (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}>
                      <InstagramIcon size={17} />
                    </a>
                  )}
                  {storeSettings.whatsapp_url && (
                    <a href={storeSettings.whatsapp_url} target="_blank" rel="noopener noreferrer"
                      className="p-2 rounded-lg transition-all hover:scale-110" style={{ color: 'var(--text-muted)' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#25d366'; (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(37,211,102,0.1)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'; (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}>
                      <WhatsAppIcon size={17} />
                    </a>
                  )}
                  {storeSettings.twitter_url && (
                    <a href={storeSettings.twitter_url} target="_blank" rel="noopener noreferrer"
                      className="p-2 rounded-lg transition-all hover:scale-110" style={{ color: 'var(--text-muted)' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#1d9bf0'; (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(29,155,240,0.1)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'; (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}>
                      <TwitterXIcon size={17} />
                    </a>
                  )}
                </div>
              )}
            </div>

            <button onClick={() => setShowCheckout(true)}
              className="flex-shrink-0 ml-auto lg:ml-0 flex items-center gap-2 rounded-full font-black text-sm text-white transition-all active:scale-95 px-4 py-2.5 md:px-5 md:py-3"
              style={{
                backgroundColor: 'var(--primary-color)',
                transform: cartEffect ? 'scale(1.1)' : 'scale(1)',
                boxShadow: cartEffect ? '0 0 28px color-mix(in srgb, var(--primary-color) 60%, transparent)' : '0 4px 16px color-mix(in srgb, var(--primary-color) 32%, transparent)',
                transition: 'all 0.3s cubic-bezier(0.34,1.56,0.64,1)', minHeight: '44px',
              }}>
              <ShoppingBag size={17} />
              <span className="hidden sm:inline font-black uppercase tracking-wide text-xs">Bag</span>
              {cart.length > 0 && (
                <span className="flex items-center justify-center w-5 h-5 rounded-full text-[11px] font-black" style={{ backgroundColor: 'rgba(0,0,0,0.28)' }}>
                  {cart.length}
                </span>
              )}
            </button>
          </div>

          {/* Mobile search */}
          <div className="md:hidden px-3 pb-2">
            <div className="relative flex items-center rounded-xl overflow-hidden" style={{ backgroundColor: 'var(--input-bg)', border: '1.5px solid var(--card-border)', minHeight: '42px' }}>
              <Search className="absolute left-3.5" size={15} style={{ color: 'var(--text-muted)' }} />
              <input placeholder="Search products..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent py-2.5 pl-10 pr-9 text-sm font-semibold outline-none" style={{ color: 'var(--text-color)' }} />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 opacity-50 hover:opacity-100 transition-opacity">
                  <X size={14} style={{ color: 'var(--text-color)' }} />
                </button>
              )}
            </div>
          </div>

          {/* Mobile links + socials */}
          <div className="md:hidden flex items-center justify-between px-4 pb-2.5 pt-0.5" style={{ borderTop: '1px solid var(--card-border)' }}>
            <div className="flex items-center gap-1">
              <Link to="/track" className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide transition-all active:scale-95"
                style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-color)', border: '1px solid var(--card-border)' }}>
                {hasActiveOrder && <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse flex-shrink-0" />}
                📦 Track
              </Link>
              <Link to="/contact" className="flex items-center px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide transition-all active:scale-95"
                style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-color)', border: '1px solid var(--card-border)' }}>
                💬 Contact
              </Link>
            </div>
            {storeSettings && (storeSettings.instagram_url || storeSettings.whatsapp_url || storeSettings.twitter_url) && (
              <div className="flex items-center gap-0.5">
                {storeSettings.instagram_url && (
                  <a href={storeSettings.instagram_url} target="_blank" rel="noopener noreferrer"
                    className="w-8 h-8 flex items-center justify-center rounded-full transition-all active:scale-90"
                    style={{ backgroundColor: 'var(--input-bg)', color: '#e1306c', border: '1px solid var(--card-border)' }}>
                    <InstagramIcon size={14} />
                  </a>
                )}
                {storeSettings.whatsapp_url && (
                  <a href={storeSettings.whatsapp_url} target="_blank" rel="noopener noreferrer"
                    className="w-8 h-8 flex items-center justify-center rounded-full transition-all active:scale-90"
                    style={{ backgroundColor: 'var(--input-bg)', color: '#25d366', border: '1px solid var(--card-border)' }}>
                    <WhatsAppIcon size={14} />
                  </a>
                )}
                {storeSettings.twitter_url && (
                  <a href={storeSettings.twitter_url} target="_blank" rel="noopener noreferrer"
                    className="w-8 h-8 flex items-center justify-center rounded-full transition-all active:scale-90"
                    style={{ backgroundColor: 'var(--input-bg)', color: '#1d9bf0', border: '1px solid var(--card-border)' }}>
                    <TwitterXIcon size={14} />
                  </a>
                )}
              </div>
            )}
          </div>
        </nav>

        {/* ── CATEGORY PILLS ── */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar px-3 md:px-10 lg:px-16 py-3 md:py-4">
          {['All', 'Favs', ...categories.map(c => c.name)].map((catName) => {
            const isActive = activeCategory === catName;
            return (
              <button key={catName} onClick={() => setActiveCategory(catName)}
                className="flex-shrink-0 px-4 md:px-5 py-2 md:py-2.5 rounded-full text-xs md:text-sm font-bold uppercase tracking-wide transition-all active:scale-95"
                style={isActive ? {
                  backgroundColor: 'var(--primary-color)', color: '#ffffff',
                  boxShadow: '0 4px 16px color-mix(in srgb, var(--primary-color) 40%, transparent)',
                  border: '1.5px solid var(--primary-color)',
                } : {
                  backgroundColor: 'var(--card-bg)', color: 'var(--text-muted)',
                  border: '1.5px solid var(--card-border)',
                }}>
                {catName === 'Favs' ? `♥ Favs${favorites.length > 0 ? ` (${favorites.length})` : ''}` : catName}
              </button>
            );
          })}
        </div>

        {/* ── ANNOUNCEMENT BANNER ── */}
        <AnnouncementBanner />

        {/* ── PRODUCT GRID ── */}
        <div className="px-3 md:px-10 lg:px-16 pb-28 pt-2 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-5">
          {filteredItems.map((item) => {
            const stock = item.stock || 0;
            const isSoldOut = stock <= 0;
            const isLowStock = stock > 0 && stock < 5;
            const manualDiscount = item.manual_discount || 0;
            const autoDiscount = productDiscounts[item.id] || 0;
            const { finalPrice, discountPercent } = calculateDiscountedPrice(item.price, manualDiscount, autoDiscount);

            return (
              <div key={item.id}
                className={`group flex flex-col rounded-2xl overflow-hidden transition-all duration-300 ${isSoldOut ? 'opacity-60' : 'hover:-translate-y-1'}`}
                style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)', boxShadow: '0 2px 14px rgba(0,0,0,0.1)' }}
                onMouseEnter={e => {
                  if (!isSoldOut) {
                    (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 28px color-mix(in srgb, var(--primary-color) 18%, rgba(0,0,0,0.22))';
                    (e.currentTarget as HTMLElement).style.borderColor = 'color-mix(in srgb, var(--primary-color) 45%, var(--card-border))';
                  }
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 14px rgba(0,0,0,0.1)';
                  (e.currentTarget as HTMLElement).style.borderColor = 'var(--card-border)';
                }}>
                <div className="relative w-full overflow-hidden bg-black/10" style={{ aspectRatio: '3/2' }}>
                  <img src={item.image} alt={item.name}
                    className={`w-full h-full object-cover transition-transform duration-500 ${isSoldOut ? 'grayscale' : 'group-hover:scale-105'}`} />
                  <DiscountBadge discountPercent={discountPercent} />
                  {isSoldOut && (
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-[2px] flex items-center justify-center">
                      <div className="bg-red-600 px-3 py-1.5 rounded-lg -rotate-12">
                        <p className="text-white font-black text-xs uppercase tracking-wider">SOLD OUT</p>
                      </div>
                    </div>
                  )}
                  {isLowStock && !isSoldOut && (
                    <div className="absolute bottom-2 left-2 bg-amber-500 px-2 py-0.5 rounded-md">
                      <p className="text-black font-black text-[10px] uppercase">Only {stock} left</p>
                    </div>
                  )}
                  <div className="absolute top-2 left-2">
                    <ExpiryBadge expiryDate={item.expiry_date} />
                  </div>
                  <button
                    onClick={() => setFavorites(f => f.includes(item.id) ? f.filter(x => x !== item.id) : [...f, item.id])}
                    className="absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-90"
                    style={{ backgroundColor: favorites.includes(item.id) ? 'color-mix(in srgb, var(--primary-color) 25%, rgba(0,0,0,0.55))' : 'rgba(0,0,0,0.45)', backdropFilter: 'blur(8px)' }}>
                    <Heart size={13} style={favorites.includes(item.id) ? { fill: 'var(--primary-color)', color: 'var(--primary-color)' } : { color: 'rgba(255,255,255,0.8)' }} />
                  </button>
                </div>
                <div className="flex flex-col p-2.5 md:p-4 gap-1.5 md:gap-2">
                  <h3 className="text-sm md:text-base font-bold leading-snug line-clamp-2" style={{ color: 'var(--text-color)', minHeight: '2.5rem' }}>{item.name}</h3>
                  <PriceDisplay originalPrice={item.price} discountedPrice={finalPrice} hasDiscount={discountPercent > 0} />
                  <button
                    onClick={() => { if (!isSoldOut) { setCart([...cart, { ...item, price: finalPrice }]); triggerCartEffect(); showToast(item.name); } }}
                    disabled={isSoldOut}
                    className="w-full rounded-xl text-sm font-black uppercase tracking-wide transition-all active:scale-95"
                    style={{
                      minHeight: '44px',
                      ...(isSoldOut
                        ? { backgroundColor: 'var(--card-border)', color: 'var(--text-muted)', cursor: 'not-allowed' }
                        : { backgroundColor: 'var(--primary-color)', color: '#ffffff', boxShadow: '0 2px 10px color-mix(in srgb, var(--primary-color) 28%, transparent)' }
                      )
                    }}
                    onMouseEnter={e => { if (!isSoldOut) (e.currentTarget as HTMLElement).style.opacity = '0.88'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}>
                    {isSoldOut ? 'Out of Stock' : '+ Add to Bag'}
                  </button>
                </div>
              </div>
            );
          })}

          {filteredItems.length === 0 && (
            <div className="col-span-full py-24 text-center">
              <p className="text-5xl mb-4">🛒</p>
              <p className="text-lg font-bold" style={{ color: 'var(--text-muted)' }}>
                {searchQuery ? `No results for "${searchQuery}"` : 'No products available'}
              </p>
            </div>
          )}
        </div>

        {/* ── CHECKOUT MODAL ── */}
        {showCheckout && (
          <div className="fixed inset-0 z-[200] flex items-end md:items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="w-full md:max-w-lg md:rounded-3xl rounded-t-[28px] shadow-2xl max-h-[94vh] md:max-h-[90vh] overflow-y-auto custom-scrollbar"
              style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
              <div className="flex justify-center pt-3 pb-1 md:hidden">
                <div className="w-10 h-1 rounded-full" style={{ backgroundColor: 'var(--card-border)' }} />
              </div>
              <div className="p-5 md:p-8">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-2xl font-black uppercase" style={{ color: 'var(--text-color)' }}>Your Bag</h2>
                    <p className="text-sm font-semibold mt-0.5" style={{ color: 'var(--text-muted)' }}>{cart.length} {cart.length === 1 ? 'item' : 'items'}</p>
                  </div>
                  <button onClick={() => setShowCheckout(false)}
                    className="w-10 h-10 rounded-full flex items-center justify-center transition-colors"
                    style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-muted)' }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-color)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}>
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-2 mb-6 max-h-[200px] overflow-y-auto custom-scrollbar pr-1">
                  {cart.map((item, i) => (
                    <div key={i} className="group flex justify-between items-center p-4 rounded-xl"
                      style={{ backgroundColor: 'var(--input-bg)', border: '1px solid var(--card-border)' }}>
                      <span className="text-sm font-semibold truncate mr-3" style={{ color: 'var(--text-color)' }}>{item.name}</span>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className="text-sm font-black" style={{ color: 'var(--primary-color)' }}>₦{item.price?.toLocaleString()}</span>
                        <button onClick={() => { const n = [...cart]; n.splice(i, 1); setCart(n); }}
                          className="text-xs font-black uppercase opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-400 px-2 py-1 rounded">✕</button>
                      </div>
                    </div>
                  ))}
                  {cart.length === 0 && <p className="text-center py-8 text-base font-semibold" style={{ color: 'var(--text-muted)' }}>Your bag is empty</p>}
                </div>

                <div className="space-y-3 mb-6">
                  <input placeholder="Full Name" value={clientName} onChange={e => setClientName(e.target.value.toUpperCase())}
                    className="w-full rounded-xl py-4 px-5 text-base font-semibold outline-none transition-all"
                    style={{ backgroundColor: 'var(--input-bg)', border: '1.5px solid var(--input-border)', color: 'var(--text-color)' }} />
                  <input placeholder="Phone Number (Optional)" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)}
                    className="w-full rounded-xl py-4 px-5 text-base font-semibold outline-none transition-all"
                    style={{ backgroundColor: 'var(--input-bg)', border: '1.5px solid var(--input-border)', color: 'var(--text-color)' }} type="tel" />

                  <div className="p-4 rounded-xl" style={{ backgroundColor: 'color-mix(in srgb, #a855f7 8%, var(--input-bg))', border: '1px solid rgba(168,85,247,0.25)' }}>
                    <p className="text-sm font-black text-purple-400 uppercase mb-3">🎉 Promo Code</p>
                    <div className="flex gap-2">
                      <input placeholder="Enter code" value={promoCode} onChange={e => setPromoCode(e.target.value.toUpperCase())}
                        disabled={!!appliedDiscount}
                        className="flex-1 rounded-lg py-3 px-4 text-sm font-bold uppercase outline-none disabled:opacity-50"
                        style={{ backgroundColor: 'var(--input-bg)', border: '1px solid rgba(168,85,247,0.3)', color: 'var(--text-color)' }} />
                      {appliedDiscount
                        ? <button onClick={removeDiscount} className="bg-red-600 hover:bg-red-500 text-white px-5 rounded-lg text-sm font-black uppercase transition-all">Remove</button>
                        : <button onClick={applyPromoCode} className="bg-purple-600 hover:bg-purple-500 text-white px-5 rounded-lg text-sm font-black uppercase transition-all">Apply</button>
                      }
                    </div>
                    {promoError && <p className="text-red-400 text-sm font-semibold mt-2">{promoError}</p>}
                    {appliedDiscount && <p className="text-green-400 text-sm font-bold mt-2">✅ {appliedDiscount.percentage_off}% OFF applied!</p>}
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-xl" style={{ backgroundColor: 'var(--input-bg)', border: '1px solid var(--card-border)' }}>
                    <span className="text-base font-semibold" style={{ color: 'var(--text-color)' }}>Need Delivery?</span>
                    <button onClick={() => setShowAddresses(!showAddresses)}
                      className="w-12 h-6 rounded-full relative transition-all flex-shrink-0"
                      style={{ backgroundColor: showAddresses ? 'var(--primary-color)' : 'var(--card-border)' }}>
                      <div className="absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm" style={{ left: showAddresses ? '28px' : '4px' }} />
                    </button>
                  </div>

                  {showAddresses && (
                    <>
                      <input placeholder="Delivery Address" value={address} onChange={(e) => setAddress(e.target.value.toUpperCase())}
                        className="w-full rounded-xl py-4 px-5 text-base font-semibold outline-none transition-all"
                        style={{ backgroundColor: 'var(--input-bg)', border: '1.5px solid var(--input-border)', color: 'var(--text-color)' }} />
                      <div className="p-4 rounded-xl" style={{ backgroundColor: 'color-mix(in srgb, #3b82f6 8%, var(--input-bg))', border: '1px solid rgba(59,130,246,0.25)' }}>
                        <p className="text-sm font-black text-blue-400 uppercase mb-3">Payment Method</p>
                        <div className="grid grid-cols-2 gap-2">
                          {['cash', 'transfer'].map(method => (
                            <button key={method} onClick={() => setPaymentMethod(method)}
                              className="py-3 rounded-lg text-sm font-black uppercase transition-all"
                              style={paymentMethod === method
                                ? { backgroundColor: 'var(--primary-color)', color: '#fff' }
                                : { backgroundColor: 'var(--input-bg)', color: 'var(--text-muted)', border: '1px solid var(--card-border)' }}>
                              {method === 'cash' ? '💵 Cash' : '📱 Transfer'}
                            </button>
                          ))}
                        </div>
                      </div>
                      <TransferPaymentDetails isVisible={showAddresses && paymentMethod === 'transfer'} />
                      <div className="flex items-start gap-3 p-4 rounded-xl"
                        style={{ backgroundColor: 'color-mix(in srgb, var(--primary-color) 8%, var(--input-bg))', border: '1px solid color-mix(in srgb, var(--primary-color) 25%, transparent)' }}>
                        <AlertCircle size={17} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--primary-color)' }} />
                        <div>
                          <p className="text-sm font-bold uppercase mb-0.5" style={{ color: 'var(--primary-color)' }}>Delivery Fee</p>
                          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>₦{deliveryFeePerKm}/km · calculated on arrival</p>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <div className="p-5 rounded-2xl mb-5 space-y-2.5" style={{ backgroundColor: 'var(--input-bg)', border: '1px solid var(--card-border)' }}>
                  <div className="flex justify-between">
                    <span className="text-base font-semibold" style={{ color: 'var(--text-muted)' }}>Subtotal</span>
                    <span className="text-base font-bold" style={{ color: 'var(--text-color)' }}>₦{subtotal.toLocaleString()}</span>
                  </div>
                  {appliedDiscount && (
                    <div className="flex justify-between">
                      <span className="text-base font-semibold text-green-400">Discount ({appliedDiscount.code_name})</span>
                      <span className="text-base font-bold text-green-400">−₦{discountAmount.toFixed(0)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-3 mt-1" style={{ borderTop: '1px solid var(--card-border)' }}>
                    <span className="text-lg font-black uppercase" style={{ color: 'var(--text-color)' }}>Total</span>
                    <span className="text-3xl font-black" style={{ color: 'var(--primary-color)' }}>₦{grandTotal.toLocaleString()}</span>
                  </div>
                  {showAddresses && <p className="text-sm text-center" style={{ color: 'var(--text-muted)' }}>+ delivery fee added on arrival</p>}
                </div>

                <button onClick={handleConfirmOrder} disabled={orderStatus === 'loading'}
                  className="w-full py-4 rounded-xl font-black uppercase text-base tracking-widest transition-all active:scale-[0.98] mb-3 text-white"
                  style={orderStatus !== 'loading'
                    ? { backgroundColor: 'var(--primary-color)', boxShadow: '0 6px 24px color-mix(in srgb, var(--primary-color) 35%, transparent)' }
                    : { backgroundColor: 'var(--card-border)', color: 'var(--text-muted)', cursor: 'not-allowed' }}>
                  {orderStatus === 'loading' ? 'Processing...' : 'Place Order →'}
                </button>
                <button onClick={() => setShowCheckout(false)}
                  className="w-full py-3 text-sm font-bold uppercase transition-colors"
                  style={{ color: 'var(--text-muted)' }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-color)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}>
                  Continue Shopping
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── FOOTER ── */}
        <footer className="py-14 text-center mt-4" style={{ borderTop: '1px solid var(--card-border)', opacity: 0.45 }}>
          <button onClick={() => setIsUiHidden(!isUiHidden)}
            className="text-xs font-bold uppercase tracking-[0.4em] mb-6 block mx-auto transition-colors"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--primary-color)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}>
            Hide UI
          </button>
          <div className="mb-3">
            <a href="https://lawalenoch23-web.github.io/supermarket-landing/" target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-bold transition-colors"
              style={{ color: 'var(--text-muted)' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--primary-color)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}>
              Powered by <strong>Grandpa's Dream 🛒</strong>
            </a>
          </div>
          <p className="text-xs font-bold tracking-[1.2em] uppercase" style={{ color: 'var(--text-muted)' }}>{storeName} • 2026</p>
        </footer>

        <style>{`
          .custom-scrollbar::-webkit-scrollbar { width: 5px; height: 5px; }
          .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background: var(--card-border); border-radius: 99px; }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: var(--primary-color); }
          .no-scrollbar::-webkit-scrollbar { display: none; }
          .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        `}</style>
      </div>
    </ThemeProvider>
  );
}