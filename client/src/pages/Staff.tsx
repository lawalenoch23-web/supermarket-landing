import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import ExpiryBadge from '../components/ExpiryBadge';
import {
  ShoppingCart, Package, Clock, CheckCircle, Truck, AlertCircle,
  User, MapPin, Phone, Plus, Minus, Trash2, LogOut, X, Save, Edit3,
  Search, AlertTriangle, Bell, Upload, PackagePlus, PlusCircle,
  ChevronDown, ChevronUp, ShoppingBag, DollarSign, Layers
} from 'lucide-react';

type OrderStatus = 'PENDING' | 'PREPARING' | 'READY' | 'OUT_FOR_DELIVERY' | 'DONE';

interface CounterItem {
  productId: number;
  name: string;
  price: number;
  quantity: number;
}

const formatOrderDateTime = (isoString: string): string => {
  if (!isoString) return '—';
  const d = new Date(isoString);
  return d.toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
};

const statusStyle = (status: string) => {
  switch (status) {
    case 'PENDING': return { bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/25' };
    case 'PREPARING': return { bg: 'bg-blue-500/15', text: 'text-blue-400', border: 'border-blue-500/25' };
    case 'READY': return { bg: 'bg-green-500/15', text: 'text-green-400', border: 'border-green-500/25' };
    case 'OUT_FOR_DELIVERY': return { bg: 'bg-purple-500/15', text: 'text-purple-400', border: 'border-purple-500/25' };
    case 'DONE': return { bg: 'bg-zinc-800', text: 'text-zinc-400', border: 'border-zinc-700' };
    default: return { bg: 'bg-zinc-800', text: 'text-zinc-400', border: 'border-zinc-700' };
  }
};

export default function StaffOS() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [onlineOrders, setOnlineOrders] = useState<any[]>([]);
  const [pickupOrders, setPickupOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [counterCart, setCounterCart] = useState<CounterItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [processingCheckout, setProcessingCheckout] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newStock, setNewStock] = useState('10');
  const [newCategory, setNewCategory] = useState('');
  const [newProduct, setNewProduct] = useState({
    name: '', price: '', image_url: '', category: '', stock: '10',
    expiry_date: null as string | null, is_perishable: false, alert_days_before: 7
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('DEFAULT');
  const [activeView, setActiveView] = useState<'pos' | 'inventory' | 'orders' | 'payments'>('pos');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [newOrderGlow, setNewOrderGlow] = useState(false);
  const [orderFilter, setOrderFilter] = useState('ALL');
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({ name: '', price: '', stock: '', image_url: '', category: '' });
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchProduct, setBatchProduct] = useState<any>(null);
  const [newBatchName, setNewBatchName] = useState('');
  const [newBatchQty, setNewBatchQty] = useState('');
  const [newBatchExpiry, setNewBatchExpiry] = useState('');
  const [savingBatch, setSavingBatch] = useState(false);
  const [showOnlineSidebar, setShowOnlineSidebar] = useState(false);

  const playNotificationSound = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.frequency.value = 880;
      oscillator.type = 'sine';
      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.6);
    } catch (e) {}
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [productsRes, categoriesRes, onlineOrdersRes, pickupOrdersRes, batchesRes] = await Promise.all([
        supabase.from('products').select('*').order('name'),
        supabase.from('categories').select('*').order('name'),
        supabase.from('orders').select('*').not('address', 'is', null).order('created_at', { ascending: false }),
        supabase.from('orders').select('*').is('address', null).order('created_at', { ascending: false }),
        supabase.from('product_batches').select('*').order('expiry_date', { ascending: true })
      ]);
      if (productsRes.data) setProducts(productsRes.data);
      if (categoriesRes.data) setCategories(categoriesRes.data);
      if (onlineOrdersRes.data) {
        const previousCount = onlineOrders.length;
        if (onlineOrdersRes.data.length > previousCount && previousCount > 0) triggerNewOrderNotification();
        setOnlineOrders(onlineOrdersRes.data);
      }
      if (pickupOrdersRes.data) setPickupOrders(pickupOrdersRes.data);
      if (batchesRes.data) setBatches(batchesRes.data);
    } catch (err) {
      console.error("Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrdersOnly = async () => {
    try {
      const [onlineOrdersRes, pickupOrdersRes] = await Promise.all([
        supabase.from('orders').select('*').not('address', 'is', null).order('created_at', { ascending: false }),
        supabase.from('orders').select('*').is('address', null).order('created_at', { ascending: false })
      ]);
      if (onlineOrdersRes.data) setOnlineOrders(onlineOrdersRes.data);
      if (pickupOrdersRes.data) setPickupOrders(pickupOrdersRes.data);
    } catch (err) {}
  };

  const triggerNewOrderNotification = () => {
    setNewOrderGlow(true);
    playNotificationSound();
    setTimeout(() => setNewOrderGlow(false), 3000);
  };

  const simulateNewOrder = async () => {
    const mockOrder = {
      customer_name: 'DEMO CUSTOMER', phone_number: '08012345678',
      address: '123 Demo Street, Lagos', items: 'Milk, Bread, Eggs',
      total_price: 1600, status: 'PENDING', payment_method: 'cash',
      created_at: new Date().toISOString()
    };
    await supabase.from('orders').insert([mockOrder]);
    fetchData();
  };

  const fetchDataRef = useRef(fetchData);
  useEffect(() => { fetchDataRef.current = fetchData; });

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => { fetchOrdersOnly(); }, 10000);
    const channel = supabase.channel('staff-os-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, (payload) => {
        if (payload.new?.address) triggerNewOrderNotification();
        fetchOrdersOnly();
      })
      .subscribe();
    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, []);

  const handleLogout = () => {
    if (confirm('Are you sure you want to logout?')) {
      localStorage.removeItem('staff_session');
      localStorage.removeItem('staff_session_time');
      window.location.href = '/login';
    }
  };

  const addToCounter = (product: any) => {
    const existing = counterCart.find(item => item.productId === product.id);
    if (existing) {
      setCounterCart(counterCart.map(item =>
        item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      setCounterCart([...counterCart, { productId: product.id, name: product.name, price: product.price, quantity: 1 }]);
    }
  };

  const updateCounterQuantity = (productId: number, delta: number) => {
    setCounterCart(counterCart.map(item => {
      if (item.productId === productId) {
        const newQty = Math.max(0, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const removeFromCounter = (productId: number) => {
    setCounterCart(counterCart.filter(item => item.productId !== productId));
  };

  const counterTotal = counterCart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const processCounterSale = async () => {
    if (counterCart.length === 0) { alert('Cart is empty'); return; }
    if (!customerName.trim()) { alert('Please enter customer name'); return; }
    setProcessingCheckout(true);
    try {
      const itemsString = counterCart.map(item => `${item.name} (${item.quantity}x)`).join(', ');
      const orderData = {
        customer_name: customerName.toUpperCase(), phone_number: customerPhone || 'N/A',
        address: null, items: itemsString, total_price: counterTotal,
        status: 'READY', payment_status: 'paid', payment_method: 'cash',
        created_at: new Date().toISOString()
      };
      const { error } = await supabase.from('orders').insert([orderData]);
      if (error) throw error;
      for (const item of counterCart) {
        const product = products.find(p => p.id === item.productId);
        if (product) {
          const newStock = Math.max(0, (product.stock || 0) - item.quantity);
          await supabase.from('products').update({ stock: newStock }).eq('id', item.productId);
        }
      }
      alert(`✅ Sale completed! Total: ₦${counterTotal.toLocaleString()}`);
      setCounterCart([]);
      setCustomerName('');
      setCustomerPhone('');
      fetchData();
    } catch (err: any) {
      alert('Checkout failed: ' + err.message);
    } finally {
      setProcessingCheckout(false);
    }
  };

  const updateOrderStatus = async (orderId: number, newStatus: OrderStatus) => {
    try {
      const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
      if (error) throw error;
      setOnlineOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      setPickupOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    } catch (err: any) {
      alert('Failed to update status: ' + err.message);
    }
  };

  const openEditModal = (product: any) => {
    setEditingProduct(product);
    setEditForm({
      name: product.name, price: product.price.toString(),
      stock: product.stock?.toString() || '0',
      image_url: product.image_url || product.image || '',
      category: product.category || ''
    });
  };

  const closeEditModal = () => {
    setEditingProduct(null);
    setEditForm({ name: '', price: '', stock: '', image_url: '', category: '' });
  };

  const saveProductEdit = async () => {
    if (!editingProduct) return;
    try {
      const { error } = await supabase.from('products').update({
        name: editForm.name, price: parseFloat(editForm.price),
        stock: parseInt(editForm.stock), image: editForm.image_url,
        image_url: editForm.image_url, category: editForm.category
      }).eq('id', editingProduct.id);
      if (error) throw error;
      alert('✅ Product updated!');
      closeEditModal();
      fetchData();
    } catch (err: any) {
      alert('Update failed: ' + err.message);
    }
  };

  const markOutOfStock = async (productId: number) => {
    if (confirm('Mark this product as out of stock?')) {
      try {
        const { error } = await supabase.from('products').update({ stock: 0 }).eq('id', productId);
        if (error) throw error;
        fetchData();
      } catch (err: any) {
        alert('Failed: ' + err.message);
      }
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName) return;
    const { error } = await supabase.from('categories').insert([{ name: newCategoryName.toUpperCase() }]);
    if (!error) { setNewCategoryName(''); fetchData(); alert('Category added!'); }
  };

  const deleteCategory = async (id: number) => {
    if (!confirm("Delete category? Products using it will need reassignment.")) return;
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) alert("Error: Category may still be in use.");
    else { fetchData(); alert('Category deleted!'); }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const { error } = await supabase.storage.from('stock-images').upload(fileName, file);
    if (error) { alert("Upload failed: " + error.message); return; }
    const { data: { publicUrl } } = supabase.storage.from('stock-images').getPublicUrl(fileName);
    setNewProduct((prev: any) => ({ ...prev, image_url: publicUrl }));
    alert("Image uploaded ✓");
  };

  const handleReplaceProductImage = async (id: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const fileName = `${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage.from('stock-images').upload(fileName, file);
    if (uploadError) return alert(uploadError.message);
    const { data: { publicUrl } } = supabase.storage.from('stock-images').getPublicUrl(fileName);
    const { error: dbError } = await supabase.from('products').update({ image: publicUrl, image_url: publicUrl }).eq('id', id);
    if (!dbError) fetchData();
  };

  const handleAddProduct = async () => {
    if (!newName || !newPrice || !newCategory) { alert("Please fill in product name, price, and category"); return; }
    const { error } = await supabase.from('products').insert([{
      name: newName.toUpperCase(), price: parseFloat(newPrice), category: newCategory,
      image: newProduct.image_url || 'https://via.placeholder.com/400',
      image_url: newProduct.image_url || 'https://via.placeholder.com/400',
      stock: parseInt(newStock) || 10, expiry_date: newProduct.expiry_date,
      is_perishable: newProduct.is_perishable, alert_days_before: newProduct.alert_days_before || 7
    }]);
    if (error) { alert("Failed to add product: " + error.message); }
    else {
      setNewName(''); setNewPrice(''); setNewCategory(''); setNewStock('10');
      setNewProduct({ name: '', price: '', image_url: '', category: '', stock: '10', expiry_date: null, is_perishable: false, alert_days_before: 7 });
      fetchData(); alert("Product added!");
    }
  };

  const deleteProduct = async (id: number) => {
    if (!confirm("Delete this product?")) return;
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) alert("Delete failed: " + error.message);
    else { fetchData(); alert("Product deleted!"); }
  };

  const inventoryFilteredProducts = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'PRICE_LOW') return a.price - b.price;
      if (sortBy === 'PRICE_HIGH') return b.price - a.price;
      if (sortBy === 'STOCK_LOW') return (a.stock || 0) - (b.stock || 0);
      if (sortBy === 'CATEGORY') return (a.category || '').localeCompare(b.category || '');
      return 0;
    });

  const toggleSelectProduct = (id: number) => {
    setSelectedProducts(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleSelectAll = () => {
    if (selectedProducts.length === inventoryFilteredProducts.length) setSelectedProducts([]);
    else setSelectedProducts(inventoryFilteredProducts.map(p => p.id));
  };

  const handleBulkDelete = async () => {
    if (selectedProducts.length === 0) return;
    if (!confirm(`Delete ${selectedProducts.length} product(s)? This cannot be undone.`)) return;
    try {
      for (const id of selectedProducts) await supabase.from('products').delete().eq('id', id);
      setSelectedProducts([]);
      fetchData();
      alert(`✅ ${selectedProducts.length} product(s) deleted!`);
    } catch (err: any) {
      alert('Bulk delete failed: ' + err.message);
    }
  };

  const openBatchModal = (product: any) => {
    setBatchProduct(product);
    setShowBatchModal(true);
    setNewBatchName('');
    setNewBatchQty('');
    setNewBatchExpiry('');
  };

  const closeBatchModal = () => {
    setShowBatchModal(false);
    setBatchProduct(null);
  };

  const handleAddBatch = async () => {
    if (!newBatchExpiry || !newBatchQty) { alert('Please fill in quantity and expiry date'); return; }
    setSavingBatch(true);
    try {
      const { error } = await supabase.from('product_batches').insert([{
        product_id: batchProduct.id,
        batch_name: newBatchName || `Batch ${(batches.filter(b => b.product_id === batchProduct.id).length + 1)}`,
        quantity: parseInt(newBatchQty),
        expiry_date: newBatchExpiry,
      }]);
      if (error) throw error;
      setNewBatchName(''); setNewBatchQty(''); setNewBatchExpiry('');
      fetchData(); alert('✅ Batch added!');
    } catch (err: any) {
      alert('Failed to add batch: ' + err.message);
    } finally {
      setSavingBatch(false);
    }
  };

  const handleDeleteBatch = async (batchId: number) => {
    if (!confirm('Delete this batch?')) return;
    const { error } = await supabase.from('product_batches').delete().eq('id', batchId);
    if (error) alert('Failed: ' + error.message);
    else fetchData();
  };

  const getProductBatches = (productId: number) => batches.filter(b => b.product_id === productId);
  const getNearestExpiry = (productId: number) => {
    const pb = getProductBatches(productId);
    if (pb.length === 0) return null;
    return pb.sort((a, b) => new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime())[0].expiry_date;
  };

  const deliveredUnpaidOrders = onlineOrders.filter(o => o.status === 'DONE' && o.payment_status === 'unpaid');
  const cashInField = deliveredUnpaidOrders.reduce((sum, order) => sum + (order.total_price || 0), 0);

  const confirmPaymentReceived = async (orderId: number) => {
    if (!confirm('Confirm payment received from driver?')) return;
    try {
      const { error } = await supabase.from('orders').update({ payment_status: 'paid' }).eq('id', orderId);
      if (error) throw error;
      setOnlineOrders(prev => prev.map(o => o.id === orderId ? { ...o, payment_status: 'paid' } : o));
      alert('✅ Payment confirmed!');
    } catch (err: any) {
      alert('Failed: ' + err.message);
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const filteredPickupOrders = pickupOrders.filter(o => orderFilter === 'ALL' || o.status === orderFilter);
  const pendingCount = onlineOrders.filter(o => o.status === 'PENDING').length + pickupOrders.filter(o => o.status === 'PENDING').length;
  const preparingCount = onlineOrders.filter(o => o.status === 'PREPARING').length + pickupOrders.filter(o => o.status === 'PREPARING').length;
  const readyCount = onlineOrders.filter(o => o.status === 'READY').length + pickupOrders.filter(o => o.status === 'READY').length;
  const activeOnline = onlineOrders.filter(o => o.status !== 'COMPLETED').length;

  // ────────────────────────────────────────────────
  //  MAIN INTERFACE
  // ────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#111] text-white flex flex-col">
      <style>{`
        .staff-scroll::-webkit-scrollbar { width: 4px; height: 4px; }
        .staff-scroll::-webkit-scrollbar-track { background: transparent; }
        .staff-scroll::-webkit-scrollbar-thumb { background: #3f3f46; border-radius: 99px; }
        .staff-scroll::-webkit-scrollbar-thumb:hover { background: #ff8c00; }
      `}</style>

      {/* ── HEADER ── */}
      <header className="sticky top-0 z-50 bg-[#111]/95 backdrop-blur-xl border-b border-zinc-800/80">
        <div className="px-4 md:px-6 flex items-center justify-between h-14">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-[#ff8c00]/15 border border-[#ff8c00]/25 rounded-lg flex items-center justify-center">
              <ShoppingCart size={16} className="text-[#ff8c00]" />
            </div>
            <div>
              <p className="text-sm font-black uppercase tracking-tight leading-none">Staff OS</p>
              <p className="text-[9px] text-zinc-600 font-semibold uppercase tracking-wider">POS System</p>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-2">
            {[
              { val: pendingCount, label: 'Pending', color: 'text-amber-400' },
              { val: preparingCount, label: 'Preparing', color: 'text-blue-400' },
              { val: readyCount, label: 'Ready', color: 'text-green-400' },
            ].map(s => (
              <div key={s.label} className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-lg">
                <span className={`text-sm font-black ${s.color}`}>{s.val}</span>
                <span className="text-[9px] font-bold text-zinc-500 uppercase">{s.label}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => setShowOnlineSidebar(!showOnlineSidebar)}
              className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-black uppercase transition-all ${newOrderGlow ? 'bg-[#ff8c00]/20 border-[#ff8c00]/50 text-[#ff8c00]' : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'}`}>
              <Package size={13} className={newOrderGlow ? 'text-[#ff8c00]' : ''} />
              <span className="hidden sm:inline">Online</span>
              {activeOnline > 0 && (
                <span className="flex items-center justify-center w-4 h-4 bg-[#ff8c00] text-black text-[9px] font-black rounded-full">{activeOnline}</span>
              )}
              {newOrderGlow && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-ping" />}
            </button>
            <button onClick={simulateNewOrder} title="Test Alert"
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-white transition-all">
              <Bell size={13} />
            </button>
            <button onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-red-600/15 border border-zinc-800 hover:border-red-500/30 text-zinc-400 hover:text-red-400 rounded-lg text-xs font-black uppercase transition-all">
              <LogOut size={12} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>

        <div className="flex gap-1 px-4 md:px-6 pb-3 overflow-x-auto staff-scroll">
          {[
            { id: 'pos', label: '🛒 POS', badge: 0 },
            { id: 'inventory', label: '📦 Inventory', badge: 0 },
            { id: 'orders', label: '📋 Pickup', badge: pendingCount },
            { id: 'payments', label: '💵 Payments', badge: deliveredUnpaidOrders.length },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveView(tab.id as any)}
              className={`relative flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl font-black text-xs uppercase tracking-wide transition-all ${activeView === tab.id ? 'bg-[#ff8c00] text-black shadow-lg shadow-[#ff8c00]/20' : 'bg-zinc-900 text-zinc-500 hover:bg-zinc-800 hover:text-white'}`}>
              {tab.label}
              {tab.badge > 0 && (
                <span className={`flex items-center justify-center w-4 h-4 rounded-full text-[9px] font-black ${activeView === tab.id ? 'bg-black/25 text-black' : 'bg-[#ff8c00] text-black'}`}>
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </header>

      <div className="md:hidden grid grid-cols-3 gap-2 px-4 py-2 border-b border-zinc-800/50">
        {[
          { val: pendingCount, label: 'Pending', color: 'text-amber-400' },
          { val: preparingCount, label: 'Preparing', color: 'text-blue-400' },
          { val: readyCount, label: 'Ready', color: 'text-green-400' },
        ].map(s => (
          <div key={s.label} className="bg-zinc-900 rounded-xl p-2 text-center">
            <p className={`text-xl font-black ${s.color}`}>{s.val}</p>
            <p className="text-[8px] font-bold text-zinc-600 uppercase">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto staff-scroll">

          {/* POS VIEW */}
          {activeView === 'pos' && (
            <div className="p-4 md:p-5">
              <div className="flex gap-3 mb-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-600" size={15} />
                  <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search products..."
                    className="w-full bg-[#1a1a1a] border border-zinc-800 text-white pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none focus:border-[#ff8c00]/60 transition-all" />
                </div>
                <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}
                  className="bg-[#1a1a1a] border border-zinc-800 text-white px-3 py-2.5 rounded-xl text-sm outline-none focus:border-[#ff8c00]/60 transition-all">
                  <option value="All">All</option>
                  {categories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {filteredProducts.map(product => {
                  const stock = product.stock || 0;
                  const isSoldOut = stock <= 0;
                  const isLowStock = stock > 0 && stock < 5;
                  const nearestExpiry = getNearestExpiry(product.id);
                  return (
                    <button key={product.id}
                      onClick={() => !isSoldOut && addToCounter(product)}
                      disabled={isSoldOut}
                      className={`bg-[#1a1a1a] border rounded-2xl overflow-hidden text-left transition-all active:scale-95 group ${isSoldOut ? 'opacity-40 cursor-not-allowed border-zinc-800' : 'border-zinc-800 hover:border-[#ff8c00]/50 hover:shadow-lg hover:shadow-[#ff8c00]/10'}`}>
                      <div className="relative">
                        {(product.image_url || product.image) ? (
                          <img src={product.image_url || product.image} alt={product.name} className={`w-full h-28 object-cover transition-transform duration-300 ${!isSoldOut ? 'group-hover:scale-105' : 'grayscale'}`} />
                        ) : (
                          <div className="w-full h-28 bg-zinc-800 flex items-center justify-center">
                            <Package size={28} className="text-zinc-700" />
                          </div>
                        )}
                        {isSoldOut && (
                          <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                            <span className="bg-red-600 text-white text-[9px] font-black uppercase px-2 py-1 rounded -rotate-12">Sold Out</span>
                          </div>
                        )}
                        {isLowStock && !isSoldOut && (
                          <div className="absolute top-2 left-2 bg-amber-500 text-black text-[8px] font-black uppercase px-1.5 py-0.5 rounded-md">
                            {stock} left
                          </div>
                        )}
                      </div>
                      <div className="p-3">
                        <h3 className="text-xs font-bold text-white truncate mb-1">{product.name}</h3>
                        <ExpiryBadge expiryDate={product.expiry_date || nearestExpiry} />
                        {nearestExpiry && !product.expiry_date && (
                          <p className="text-[8px] text-zinc-600 font-bold">📦 {getProductBatches(product.id).length} batch{getProductBatches(product.id).length !== 1 ? 'es' : ''}</p>
                        )}
                        <p className="text-[#ff8c00] font-black text-base mt-1">₦{(product.price || 0).toLocaleString()}</p>
                        {!isSoldOut && <p className="text-[9px] text-zinc-600 font-bold">Stock: {stock}</p>}
                      </div>
                    </button>
                  );
                })}
                {filteredProducts.length === 0 && (
                  <div className="col-span-full text-center py-20 text-zinc-700">
                    <Package size={40} className="mx-auto mb-3 opacity-30" />
                    <p className="text-xs font-black uppercase">No products found</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* INVENTORY VIEW */}
          {activeView === 'inventory' && (
            <div className="p-4 md:p-5 space-y-4">
              <div className="bg-[#1a1a1a] border border-zinc-800 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <PlusCircle size={13} className="text-[#ff8c00]" />
                  <h3 className="text-xs font-black uppercase tracking-wider">Categories</h3>
                  <span className="text-[9px] text-zinc-600 font-bold ml-auto">{categories.length} total</span>
                </div>
                <div className="flex gap-2 mb-3">
                  <input value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="New category name..."
                    onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                    className="flex-1 bg-black border border-zinc-800 rounded-xl px-3 py-2.5 text-xs font-black uppercase outline-none focus:border-[#ff8c00]/60 transition-all" />
                  <button onClick={handleAddCategory}
                    className="bg-[#ff8c00] hover:bg-[#ff9f1a] px-4 py-2.5 rounded-xl flex items-center gap-1.5 font-black uppercase text-xs transition-all active:scale-95 text-black">
                    <Save size={11} /> Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {categories.map(c => (
                    <div key={c.id} className="flex items-center gap-1.5 bg-black border border-zinc-800 hover:border-[#ff8c00]/30 px-3 py-1.5 rounded-lg group transition-all">
                      <span className="text-xs font-black uppercase">{c.name}</span>
                      <span className="text-[9px] text-zinc-600">({products.filter(p => p.category === c.name).length})</span>
                      <button onClick={() => deleteCategory(c.id)} className="text-zinc-700 hover:text-red-500 transition-colors ml-0.5">
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                  {categories.length === 0 && <p className="text-xs text-zinc-600 font-bold uppercase">No categories yet</p>}
                </div>
              </div>

              <div className="bg-[#1a1a1a] border border-zinc-800 rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-zinc-800/50 flex items-center gap-2">
                  <PackagePlus size={14} className="text-[#ff8c00]" />
                  <h2 className="text-xs font-black uppercase tracking-wider">Add New Product</h2>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                    {[
                      { label: 'Product Name', val: newName, set: setNewName, type: 'text', ph: 'e.g. INDOMIE NOODLES' },
                      { label: 'Price (₦)', val: newPrice, set: setNewPrice, type: 'number', ph: 'e.g. 1500' },
                      { label: 'Stock Quantity', val: newStock, set: setNewStock, type: 'number', ph: 'e.g. 10' },
                    ].map(f => (
                      <div key={f.label}>
                        <label className="text-[9px] font-black text-zinc-500 uppercase tracking-wider mb-1.5 block">{f.label}</label>
                        <input placeholder={f.ph} type={f.type} value={f.val} onChange={e => f.set(e.target.value)}
                          className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-xs font-black uppercase outline-none focus:border-[#ff8c00]/60 transition-all" />
                      </div>
                    ))}
                    <div>
                      <label className="text-[9px] font-black text-zinc-500 uppercase tracking-wider mb-1.5 block">Category</label>
                      <select value={newCategory} onChange={e => setNewCategory(e.target.value)}
                        className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-xs font-black uppercase appearance-none outline-none focus:border-[#ff8c00]/60 transition-all">
                        <option value="">Select Category...</option>
                        {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="flex items-center gap-2 text-[9px] font-black text-zinc-500 uppercase tracking-wider mb-1.5 cursor-pointer">
                        <input type="checkbox" checked={newProduct.is_perishable || false}
                          onChange={(e) => setNewProduct({ ...newProduct, is_perishable: e.target.checked })}
                          className="rounded accent-[#ff8c00]" />
                        Perishable Item
                      </label>
                      {newProduct.is_perishable && (
                        <div className="space-y-2 mt-2">
                          <label className="text-[9px] font-black text-zinc-500 uppercase mb-1.5 block">Expiry Date</label>
                          <input type="date" value={newProduct.expiry_date || ''}
                            onChange={(e) => setNewProduct({ ...newProduct, expiry_date: e.target.value })}
                            className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-xs font-black outline-none focus:border-[#ff8c00]/60 transition-all"
                            min={new Date().toISOString().split('T')[0]} />
                          <p className="text-[9px] text-zinc-600">⚠️ Use "Batches" for multiple expiry dates.</p>
                        </div>
                      )}
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-[9px] font-black text-zinc-500 uppercase tracking-wider mb-1.5 block">Product Image</label>
                      <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" id="product-image" />
                      {newProduct.image_url ? (
                        <div className="flex items-center gap-3 bg-black border border-green-500/25 rounded-xl p-3">
                          <img src={newProduct.image_url} className="w-14 h-14 object-cover rounded-lg border border-zinc-800" alt="Preview" />
                          <div className="flex-1"><p className="text-xs font-black text-green-500">✓ Image Ready</p></div>
                          <label htmlFor="product-image" className="bg-zinc-800 hover:bg-zinc-700 text-white px-3 py-2 rounded-lg text-[9px] font-black uppercase cursor-pointer transition-all">Replace</label>
                        </div>
                      ) : (
                        <label htmlFor="product-image"
                          className="w-full bg-black border border-dashed border-zinc-800 rounded-xl px-4 py-5 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-[#ff8c00]/50 transition-all group">
                          <Upload size={18} className="text-zinc-700 group-hover:text-[#ff8c00] transition-colors" />
                          <p className="text-xs font-black uppercase text-zinc-600 group-hover:text-[#ff8c00] transition-colors">Upload Product Image</p>
                        </label>
                      )}
                    </div>
                  </div>
                  <button onClick={handleAddProduct}
                    className="w-full bg-[#ff8c00] hover:bg-[#ff9f1a] text-black py-3.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all active:scale-95">
                    + Add Product to Inventory
                  </button>
                </div>
              </div>

              <div className="bg-[#1a1a1a] border border-zinc-800 rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-zinc-800/50 flex flex-col sm:flex-row gap-2 flex-wrap">
                  <input type="text" placeholder="Search products..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 bg-black border border-zinc-800 rounded-xl px-4 py-2.5 text-xs font-black uppercase outline-none focus:border-[#ff8c00]/60 transition-all" />
                  <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
                    className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs font-black uppercase outline-none text-zinc-400">
                    <option value="DEFAULT">Sort By</option>
                    <option value="PRICE_LOW">Price: Low → High</option>
                    <option value="PRICE_HIGH">Price: High → Low</option>
                    <option value="STOCK_LOW">Stock: Low → High</option>
                    <option value="CATEGORY">Category A-Z</option>
                  </select>
                  <button onClick={handleSelectAll}
                    className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2.5 rounded-xl text-xs font-black uppercase transition-all whitespace-nowrap">
                    {selectedProducts.length === inventoryFilteredProducts.length && inventoryFilteredProducts.length > 0 ? 'Deselect All' : 'Select All'}
                  </button>
                  {selectedProducts.length > 0 && (
                    <button onClick={handleBulkDelete}
                      className="bg-red-600 hover:bg-red-500 text-white px-4 py-2.5 rounded-xl text-xs font-black uppercase transition-all flex items-center gap-1.5 whitespace-nowrap">
                      <Trash2 size={11} /> Delete ({selectedProducts.length})
                    </button>
                  )}
                </div>
                {selectedProducts.length > 0 && (
                  <div className="px-4 py-2 bg-red-500/8 border-b border-red-500/15 text-xs font-bold text-red-400">
                    {selectedProducts.length} selected
                  </div>
                )}
                <div className="p-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 max-h-[500px] overflow-y-auto staff-scroll">
                    {inventoryFilteredProducts.map(p => {
                      const stock = p.stock || 0;
                      const isLowStock = stock > 0 && stock < 5;
                      const isSoldOut = stock <= 0;
                      const isSelected = selectedProducts.includes(p.id);
                      const productBatches = getProductBatches(p.id);
                      const nearestExpiry = getNearestExpiry(p.id);
                      return (
                        <div key={p.id} className={`bg-black p-2 rounded-xl border flex flex-col gap-1.5 group transition-all ${isSelected ? 'border-red-500 bg-red-500/5' : isSoldOut ? 'border-red-900/40' : isLowStock ? 'border-amber-900/40' : 'border-zinc-900 hover:border-[#ff8c00]/35'}`}>
                          <div className="flex items-center justify-between">
                            <input type="checkbox" checked={isSelected} onChange={() => toggleSelectProduct(p.id)} className="w-3.5 h-3.5 accent-red-500 cursor-pointer" />
                            {productBatches.length > 0 && (
                              <span className="text-[8px] font-black text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded">
                                {productBatches.length}B
                              </span>
                            )}
                          </div>
                          <div className="relative aspect-square overflow-hidden rounded-lg group/img">
                            <img src={p.image || p.image_url || 'https://via.placeholder.com/400'} className="w-full h-full object-cover bg-zinc-900" alt={p.name}
                              onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400?text=No+Image'; }} />
                            <div className={`absolute top-1 left-1 px-1.5 py-0.5 rounded text-[7px] font-black ${isSoldOut ? 'bg-red-600 text-white' : isLowStock ? 'bg-amber-500 text-black' : 'bg-green-600 text-white'}`}>
                              {isSoldOut ? 'OUT' : stock}
                            </div>
                            <input type="file" accept="image/*" id={`replace-${p.id}`} className="hidden" onChange={(e) => handleReplaceProductImage(p.id, e)} />
                            <label htmlFor={`replace-${p.id}`}
                              className="absolute inset-0 bg-black/80 opacity-0 group-hover/img:opacity-100 transition-all flex flex-col items-center justify-center cursor-pointer text-[8px] font-black gap-1">
                              <Upload size={11} /> Update
                            </label>
                          </div>
                          <div className="px-0.5">
                            <p className="text-[9px] font-black uppercase truncate leading-tight text-white">{p.name}</p>
                            <p className="text-[9px] text-[#ff8c00] font-bold">₦{(p.price || 0).toLocaleString()}</p>
                            <p className="text-[8px] text-zinc-600 uppercase font-bold">{p.category}</p>
                            {(p.expiry_date || nearestExpiry) && <ExpiryBadge expiryDate={p.expiry_date || nearestExpiry} />}
                          </div>
                          <div className="flex gap-1">
                            <button onClick={() => openEditModal(p)}
                              className="flex-1 flex items-center justify-center gap-0.5 py-1.5 bg-zinc-900 hover:bg-blue-600 text-zinc-600 hover:text-white rounded-lg text-[8px] font-black uppercase transition-all active:scale-95">
                              <Edit3 size={8} /> Edit
                            </button>
                            <button onClick={() => openBatchModal(p)}
                              className="flex-1 flex items-center justify-center gap-0.5 py-1.5 bg-zinc-900 hover:bg-purple-600 text-zinc-600 hover:text-white rounded-lg text-[8px] font-black uppercase transition-all active:scale-95">
                              <Layers size={8} /> Batch
                            </button>
                            <button onClick={() => markOutOfStock(p.id)}
                              className="py-1.5 px-1.5 bg-zinc-900 hover:bg-amber-600 text-zinc-600 hover:text-white rounded-lg text-[8px] font-black uppercase transition-all active:scale-95">
                              <AlertTriangle size={8} />
                            </button>
                            <button onClick={() => deleteProduct(p.id)}
                              className="py-1.5 px-1.5 bg-zinc-900 hover:bg-red-600 text-zinc-600 hover:text-white rounded-lg text-[8px] font-black uppercase transition-all active:scale-95">
                              <Trash2 size={8} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                    {inventoryFilteredProducts.length === 0 && (
                      <div className="col-span-full text-center py-12">
                        <PackagePlus size={28} className="text-zinc-800 mx-auto mb-2" />
                        <p className="text-zinc-600 text-xs font-black uppercase">No products found</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ORDERS VIEW */}
          {activeView === 'orders' && (
            <div className="p-4 md:p-5 space-y-4">
              <div className="bg-[#1a1a1a] border border-zinc-800 rounded-2xl p-4">
                <p className="text-[9px] font-black text-zinc-600 uppercase tracking-wider mb-3">Filter by Status</p>
                <div className="flex flex-wrap gap-2">
                  {['ALL', 'PENDING', 'PREPARING', 'READY', 'DONE'].map((status) => {
                    const s = statusStyle(status);
                    const count = status !== 'ALL' ? pickupOrders.filter(o => o.status === status).length : pickupOrders.length;
                    return (
                      <button key={status} onClick={() => setOrderFilter(status)}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all active:scale-95 border ${orderFilter === status ? `${s.bg} ${s.text} ${s.border}` : 'bg-zinc-900/50 text-zinc-600 border-zinc-800 hover:bg-zinc-800 hover:text-zinc-400'}`}>
                        {status} ({count})
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="bg-[#1a1a1a] border border-zinc-800 rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-zinc-800/50 flex items-center justify-between">
                  <h2 className="text-xs font-black uppercase flex items-center gap-2">
                    <ShoppingBag size={13} className="text-[#ff8c00]" /> Pickup Orders
                  </h2>
                  <span className="text-[9px] font-black text-zinc-600 bg-zinc-900 px-2 py-1 rounded-lg">{filteredPickupOrders.length} order{filteredPickupOrders.length !== 1 ? 's' : ''}</span>
                </div>
                <div className="divide-y divide-zinc-900 max-h-[600px] overflow-y-auto staff-scroll">
                  {filteredPickupOrders.length === 0 ? (
                    <div className="p-16 text-center">
                      <ShoppingBag size={32} className="text-zinc-800 mx-auto mb-3" />
                      <p className="text-xs font-black uppercase text-zinc-600">No pickup orders found</p>
                    </div>
                  ) : (
                    filteredPickupOrders.map(order => {
                      const isExpanded = expandedOrderId === order.id;
                      const s = statusStyle(order.status);
                      return (
                        <div key={order.id} className="hover:bg-white/[0.015] transition-colors">
                          <div className="p-4 flex items-center gap-3 cursor-pointer select-none"
                            onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}>
                            <div className="bg-black border border-zinc-800 px-2.5 py-1.5 rounded-lg flex-shrink-0">
                              <p className="text-xs font-black">#{order.id}</p>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-black uppercase truncate">{order.customer_name}</p>
                              <p className="text-[10px] font-bold text-orange-400 flex items-center gap-1 mt-0.5">
                                <Clock size={9} />{formatOrderDateTime(order.created_at)}
                              </p>
                              {order.phone_number && <p className="text-[10px] text-green-500 font-bold">📞 {order.phone_number}</p>}
                            </div>
                            <select value={order.status} onClick={e => e.stopPropagation()}
                              onChange={(e) => updateOrderStatus(order.id, e.target.value as OrderStatus)}
                              className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase border outline-none flex-shrink-0 ${s.bg} ${s.text} ${s.border}`}>
                              {['PENDING','PREPARING','READY','DONE'].map(st => <option key={st} value={st}>{st}</option>)}
                            </select>
                            <p className="text-base font-black text-[#ff8c00] flex-shrink-0">₦{(order.total_price || 0).toLocaleString()}</p>
                            <div className="text-zinc-600 flex-shrink-0">{isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}</div>
                          </div>
                          {isExpanded && (
                            <div className="px-4 pb-4">
                              <div className="bg-black border border-zinc-900 p-4 rounded-xl">
                                <p className="text-[9px] font-black uppercase text-zinc-600 mb-2 tracking-wider">Items Ordered</p>
                                <div className="space-y-1.5 mb-3">
                                  {order.items?.split(', ').map((item: string, idx: number) => (
                                    <div key={idx} className="flex items-center gap-2 text-xs">
                                      <div className="w-1 h-1 bg-[#ff8c00] rounded-full flex-shrink-0" />
                                      <span className="text-zinc-300 font-medium">{item}</span>
                                    </div>
                                  ))}
                                </div>
                                <div className="flex justify-between items-center pt-3 border-t border-zinc-900">
                                  <span className="text-xs font-black uppercase text-zinc-500">Total</span>
                                  <span className="text-lg font-black text-[#ff8c00]">₦{(order.total_price || 0).toLocaleString()}</span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}

          {/* PAYMENTS VIEW */}
          {activeView === 'payments' && (
            <div className="p-4 md:p-5 space-y-4">
              <div className="bg-[#ff8c00]/8 border border-[#ff8c00]/20 rounded-2xl p-6">
                <p className="text-xs font-black uppercase text-[#ff8c00] mb-1">💵 Cash in Field</p>
                <p className="text-4xl font-black text-[#ff8c00]">₦{cashInField.toLocaleString()}</p>
                <p className="text-xs text-zinc-500 mt-1">{deliveredUnpaidOrders.length} order{deliveredUnpaidOrders.length !== 1 ? 's' : ''} awaiting collection</p>
              </div>

              <div className="bg-[#1a1a1a] border border-zinc-800 rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-zinc-800/50 flex items-center gap-2">
                  <AlertTriangle size={13} className="text-[#ff8c00]" />
                  <h2 className="text-xs font-black uppercase">Awaiting Payment Confirmation</h2>
                </div>
                {deliveredUnpaidOrders.length === 0 ? (
                  <div className="p-16 text-center">
                    <CheckCircle size={40} className="text-green-500 mx-auto mb-3" />
                    <p className="text-sm font-black uppercase text-zinc-600">All Payments Collected!</p>
                  </div>
                ) : (
                  <div className="divide-y divide-zinc-800">
                    {deliveredUnpaidOrders.map(order => (
                      <div key={order.id} className="p-5 hover:bg-white/[0.02] transition-colors">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-base font-black text-[#ff8c00]">Order #{order.id}</span>
                              <span className="px-2 py-0.5 bg-[#ff8c00]/15 text-[#ff8c00] text-[9px] font-black uppercase rounded-full">Unpaid</span>
                            </div>
                            <p className="text-sm font-bold text-white">{order.customer_name}</p>
                            <p className="text-xs text-zinc-500 mt-0.5">{order.phone_number}</p>
                            <p className="text-xs text-zinc-600 mt-0.5">{formatOrderDateTime(order.created_at)}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-2xl font-black text-[#ff8c00]">₦{(order.total_price || 0).toLocaleString()}</span>
                            <button onClick={() => confirmPaymentReceived(order.id)}
                              className="px-4 py-2.5 bg-green-600 hover:bg-green-500 text-white rounded-xl font-black uppercase text-xs tracking-wide transition-all active:scale-95 flex items-center gap-1.5">
                              <CheckCircle size={12} /> Confirm
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT SIDEBAR */}
        <div className={`${activeView === 'pos' ? 'w-72 lg:w-80' : 'w-0 lg:w-72'} flex-shrink-0 bg-[#161616] border-l border-zinc-800 overflow-hidden transition-all duration-300`}>
          <div className="h-full overflow-y-auto staff-scroll">
            {activeView === 'pos' && (
              <div className="p-4 border-b border-zinc-800">
                <h2 className="text-sm font-black uppercase mb-3 flex items-center gap-2">
                  <ShoppingCart size={15} className="text-[#ff8c00]" /> Counter Sale
                </h2>
                <div className="space-y-2 mb-4">
                  <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Customer Name *"
                    className="w-full bg-black border border-zinc-800 text-white px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:border-[#ff8c00]/60 transition-all" />
                  <input type="tel" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="Phone (Optional)"
                    className="w-full bg-black border border-zinc-800 text-white px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:border-[#ff8c00]/60 transition-all" />
                </div>

                {counterCart.length === 0 ? (
                  <div className="text-center py-8 text-zinc-700">
                    <ShoppingCart size={28} className="mx-auto mb-2 opacity-30" />
                    <p className="text-xs font-bold uppercase">Cart is empty</p>
                    <p className="text-[10px] text-zinc-700 mt-1">Tap a product to add it</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2 mb-4 max-h-52 overflow-y-auto staff-scroll">
                      {counterCart.map(item => (
                        <div key={item.productId} className="bg-black border border-zinc-800 rounded-xl p-3">
                          <div className="flex items-start justify-between mb-2">
                            <p className="font-bold text-sm flex-1 leading-tight">{item.name}</p>
                            <button onClick={() => removeFromCounter(item.productId)} className="text-zinc-600 hover:text-red-500 transition-colors flex-shrink-0 ml-1">
                              <Trash2 size={13} />
                            </button>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <button onClick={() => updateCounterQuantity(item.productId, -1)}
                                className="w-7 h-7 bg-zinc-800 hover:bg-zinc-700 rounded-lg flex items-center justify-center transition-all active:scale-90">
                                <Minus size={12} />
                              </button>
                              <span className="font-black w-6 text-center text-sm">{item.quantity}</span>
                              <button onClick={() => updateCounterQuantity(item.productId, 1)}
                                className="w-7 h-7 bg-zinc-800 hover:bg-zinc-700 rounded-lg flex items-center justify-center transition-all active:scale-90">
                                <Plus size={12} />
                              </button>
                            </div>
                            <p className="text-[#ff8c00] font-black text-sm">₦{(item.price * item.quantity).toLocaleString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="bg-black border border-zinc-800 rounded-xl p-4 mb-3">
                      <div className="flex justify-between items-center">
                        <span className="text-base font-black uppercase text-white">Total</span>
                        <span className="text-2xl font-black text-[#ff8c00]">₦{counterTotal.toLocaleString()}</span>
                      </div>
                    </div>
                    <button onClick={processCounterSale} disabled={processingCheckout || !customerName.trim()}
                      className="w-full bg-[#ff8c00] hover:bg-[#ff9f1a] disabled:bg-zinc-800 disabled:text-zinc-600 text-black font-black py-3.5 rounded-xl uppercase tracking-widest text-sm transition-all active:scale-95 disabled:cursor-not-allowed">
                      {processingCheckout ? 'Processing...' : 'Complete Sale'}
                    </button>
                  </>
                )}
              </div>
            )}

            <div className={`p-4 ${newOrderGlow ? 'bg-[#ff8c00]/5' : ''} transition-colors`}>
              <div className="flex items-center gap-2 mb-4">
                <Package size={15} className={newOrderGlow ? 'text-[#ff8c00]' : 'text-zinc-500'} />
                <h2 className="text-sm font-black uppercase">Online Orders</h2>
                {newOrderGlow && <span className="text-[9px] bg-[#ff8c00] text-black px-2 py-0.5 rounded-full font-black animate-bounce">NEW!</span>}
                {activeOnline > 0 && !newOrderGlow && (
                  <span className="text-[9px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full font-black">{activeOnline}</span>
                )}
              </div>

              {onlineOrders.filter(o => o.status !== 'COMPLETED').length === 0 ? (
                <div className="text-center py-8 text-zinc-700">
                  <Package size={28} className="mx-auto mb-2 opacity-30" />
                  <p className="text-xs font-bold uppercase">No active orders</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {onlineOrders.filter(o => o.status !== 'COMPLETED').map(order => {
                    const s = statusStyle(order.status);
                    return (
                      <div key={order.id} className="bg-black border border-zinc-800 rounded-xl p-3.5 hover:border-zinc-700 transition-all">
                        <div className="flex items-start justify-between mb-2.5">
                          <div>
                            <p className="font-black text-[#ff8c00] text-lg leading-none">#{order.id}</p>
                            <p className="text-[9px] text-zinc-600 mt-0.5">{formatOrderDateTime(order.created_at)}</p>
                          </div>
                          <div className={`px-2.5 py-1 rounded-full text-[9px] font-black border ${s.bg} ${s.text} ${s.border}`}>
                            {order.status}
                          </div>
                        </div>
                        <div className="space-y-1.5 mb-3 text-xs">
                          <div className="flex items-center gap-1.5"><User size={11} className="text-zinc-600 flex-shrink-0" /><span className="font-bold truncate">{order.customer_name}</span></div>
                          <div className="flex items-center gap-1.5"><Phone size={11} className="text-zinc-600 flex-shrink-0" /><span className="text-zinc-400">{order.phone_number}</span></div>
                          <div className="flex items-start gap-1.5"><MapPin size={11} className="text-zinc-600 flex-shrink-0 mt-0.5" /><span className="text-zinc-500 text-[10px] leading-tight">{order.address || 'N/A'}</span></div>
                          <div className="pt-2 border-t border-zinc-900">
                            <p className="text-zinc-500 text-[9px] mb-1 uppercase font-black">Items</p>
                            <p className="text-zinc-300 text-[10px] leading-relaxed">{order.items}</p>
                          </div>
                          <div className="flex justify-between items-center pt-2 border-t border-zinc-900">
                            <span className="text-zinc-500 text-[9px] uppercase font-black">Total</span>
                            <span className="text-[#ff8c00] font-black text-base">₦{(order.total_price || 0).toLocaleString()}</span>
                          </div>
                        </div>
                        {order.status === 'PENDING' && (
                          <button onClick={() => updateOrderStatus(order.id, 'PREPARING')}
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-2 rounded-lg uppercase text-[10px] tracking-wider transition-all active:scale-95">
                            <Clock size={11} className="inline mr-1.5" />Start Packing
                          </button>
                        )}
                        {order.status === 'PREPARING' && (
                          <button onClick={() => updateOrderStatus(order.id, 'READY')}
                            className="w-full bg-green-600 hover:bg-green-500 text-white font-black py-2 rounded-lg uppercase text-[10px] tracking-wider transition-all active:scale-95">
                            <CheckCircle size={11} className="inline mr-1.5" />Mark Ready
                          </button>
                        )}
                        {order.status === 'READY' && (
                          <div className="bg-green-500/10 border border-green-500/20 text-green-400 px-3 py-2 rounded-lg text-center">
                            <Truck size={12} className="inline mr-1.5" />
                            <span className="text-[10px] font-bold uppercase">Waiting for Driver</span>
                          </div>
                        )}
                        {order.status === 'OUT_FOR_DELIVERY' && (
                          <div className="bg-purple-500/10 border border-purple-500/20 text-purple-400 px-3 py-2 rounded-lg text-center">
                            <Truck size={12} className="inline mr-1.5" />
                            <span className="text-[10px] font-bold uppercase">Out for Delivery</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {[...onlineOrders, ...pickupOrders].filter(o => o.status === 'COMPLETED').length > 0 && (
                <div className="mt-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex-1 h-px bg-zinc-800" />
                    <span className="text-[9px] font-black text-green-500 uppercase whitespace-nowrap">
                      ✅ Completed ({[...onlineOrders, ...pickupOrders].filter(o => o.status === 'COMPLETED').length})
                    </span>
                    <div className="flex-1 h-px bg-zinc-800" />
                  </div>
                  {[...onlineOrders, ...pickupOrders].filter(o => o.status === 'COMPLETED').map(order => (
                    <div key={order.id} className="bg-green-500/5 border border-green-500/15 rounded-xl p-3 mb-2">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-xs font-black text-green-400">#{order.id} — {order.customer_name}</span>
                        <span className="text-xs font-black text-green-500">₦{(order.total_price || 0).toLocaleString()}</span>
                      </div>
                      <p className="text-[9px] text-zinc-600">{formatOrderDateTime(order.created_at)}</p>
                      <p className="text-[9px] text-zinc-500 mt-0.5 truncate">{order.items}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ONLINE ORDERS OVERLAY (mobile) */}
      {showOnlineSidebar && (
        <div className="lg:hidden fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm" onClick={() => setShowOnlineSidebar(false)}>
          <div className="absolute right-0 top-0 bottom-0 w-80 bg-[#161616] border-l border-zinc-800 overflow-y-auto staff-scroll" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
              <h2 className="text-sm font-black uppercase flex items-center gap-2"><Package size={14} className="text-[#ff8c00]" /> Online Orders</h2>
              <button onClick={() => setShowOnlineSidebar(false)} className="text-zinc-500 hover:text-white transition-colors"><X size={18} /></button>
            </div>
            <div className="p-4 space-y-3">
              {onlineOrders.filter(o => o.status !== 'COMPLETED').map(order => {
                const s = statusStyle(order.status);
                return (
                  <div key={order.id} className="bg-black border border-zinc-800 rounded-xl p-3.5">
                    <div className="flex items-start justify-between mb-2">
                      <p className="font-black text-[#ff8c00] text-lg">#{order.id}</p>
                      <div className={`px-2.5 py-1 rounded-full text-[9px] font-black border ${s.bg} ${s.text} ${s.border}`}>{order.status}</div>
                    </div>
                    <p className="text-sm font-bold text-white mb-1">{order.customer_name}</p>
                    <p className="text-xs text-zinc-400 mb-2">{order.items}</p>
                    <div className="flex justify-between items-center mb-3 pt-2 border-t border-zinc-900">
                      <span className="text-xs text-zinc-500 font-black uppercase">Total</span>
                      <span className="text-base font-black text-[#ff8c00]">₦{(order.total_price || 0).toLocaleString()}</span>
                    </div>
                    {order.status === 'PENDING' && (
                      <button onClick={() => updateOrderStatus(order.id, 'PREPARING')}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-2 rounded-lg uppercase text-xs tracking-wider transition-all">
                        Start Packing
                      </button>
                    )}
                    {order.status === 'PREPARING' && (
                      <button onClick={() => updateOrderStatus(order.id, 'READY')}
                        className="w-full bg-green-600 hover:bg-green-500 text-white font-black py-2 rounded-lg uppercase text-xs tracking-wider transition-all">
                        Mark Ready
                      </button>
                    )}
                  </div>
                );
              })}
              {onlineOrders.filter(o => o.status !== 'COMPLETED').length === 0 && (
                <div className="text-center py-12 text-zinc-700">
                  <Package size={32} className="mx-auto mb-3 opacity-30" />
                  <p className="text-xs font-black uppercase">No active orders</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* EDIT PRODUCT MODAL */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black/85 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1a] border border-zinc-800 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-black uppercase flex items-center gap-2"><Edit3 size={14} className="text-[#ff8c00]" /> Edit Product</h2>
              <button onClick={closeEditModal} className="text-zinc-500 hover:text-white transition-colors"><X size={20} /></button>
            </div>
            <div className="space-y-3.5">
              <div>
                <label className="text-[10px] font-black text-zinc-500 uppercase mb-1.5 block">Product Name</label>
                <input type="text" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full bg-black border border-zinc-800 text-white px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-[#ff8c00]/60 transition-all" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[{ label: 'Price (₦)', field: 'price' }, { label: 'Stock', field: 'stock' }].map(f => (
                  <div key={f.field}>
                    <label className="text-[10px] font-black text-zinc-500 uppercase mb-1.5 block">{f.label}</label>
                    <input type="number" value={(editForm as any)[f.field]} onChange={(e) => setEditForm({ ...editForm, [f.field]: e.target.value })}
                      className="w-full bg-black border border-zinc-800 text-white px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-[#ff8c00]/60 transition-all" />
                  </div>
                ))}
              </div>
              <div>
                <label className="text-[10px] font-black text-zinc-500 uppercase mb-1.5 block">Category</label>
                <select value={editForm.category} onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                  className="w-full bg-black border border-zinc-800 text-white px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-[#ff8c00]/60 appearance-none transition-all">
                  <option value="">Select category</option>
                  {categories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black text-zinc-500 uppercase mb-1.5 block">Image URL</label>
                <input type="text" value={editForm.image_url} onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
                  className="w-full bg-black border border-zinc-800 text-white px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-[#ff8c00]/60 transition-all"
                  placeholder="https://..." />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={saveProductEdit}
                  className="flex-1 bg-[#ff8c00] hover:bg-[#ff9f1a] text-black font-black py-3 rounded-xl uppercase tracking-wider text-sm transition-all active:scale-95">
                  <Save size={14} className="inline mr-1.5" />Save
                </button>
                <button onClick={closeEditModal}
                  className="px-6 bg-zinc-800 hover:bg-zinc-700 text-white font-black py-3 rounded-xl uppercase text-sm transition-all active:scale-95">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* BATCH MODAL */}
      {showBatchModal && batchProduct && (
        <div className="fixed inset-0 bg-black/85 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1a] border border-zinc-800 rounded-2xl w-full max-w-lg max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-zinc-800">
              <div>
                <h2 className="text-sm font-black uppercase flex items-center gap-2"><Layers size={15} className="text-purple-500" /> Batches</h2>
                <p className="text-xs text-zinc-500 mt-0.5">{batchProduct.name}</p>
              </div>
              <button onClick={closeBatchModal} className="text-zinc-500 hover:text-white transition-colors"><X size={20} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-4 staff-scroll">
              <div className="bg-purple-500/8 border border-purple-500/15 rounded-xl p-3">
                <p className="text-xs text-purple-300 font-bold">📦 Use batches when the same product has different expiry dates.</p>
              </div>
              {getProductBatches(batchProduct.id).length > 0 ? (
                <div>
                  <p className="text-[9px] font-black text-zinc-500 uppercase tracking-wider mb-2">Existing Batches</p>
                  <div className="space-y-2">
                    {getProductBatches(batchProduct.id).map(batch => (
                      <div key={batch.id} className="flex items-center justify-between bg-black border border-zinc-800 rounded-xl px-4 py-3">
                        <div>
                          <p className="text-xs font-black uppercase">{batch.batch_name}</p>
                          <p className="text-[10px] text-zinc-500 mt-0.5">Qty: {batch.quantity} units</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <ExpiryBadge expiryDate={batch.expiry_date} />
                          <button onClick={() => handleDeleteBatch(batch.id)} className="text-zinc-600 hover:text-red-500 transition-colors">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-zinc-700">
                  <Layers size={28} className="mx-auto mb-2 opacity-30" />
                  <p className="text-xs font-black uppercase">No batches yet</p>
                </div>
              )}
              <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4">
                <p className="text-[9px] font-black text-zinc-500 uppercase tracking-wider mb-3">Add New Batch</p>
                <div className="space-y-3">
                  <div>
                    <label className="text-[9px] font-black text-zinc-500 uppercase mb-1.5 block">Batch Name (Optional)</label>
                    <input type="text" placeholder="e.g. March Delivery" value={newBatchName} onChange={e => setNewBatchName(e.target.value)}
                      className="w-full bg-black border border-zinc-800 rounded-xl px-3 py-2.5 text-xs font-black outline-none focus:border-purple-500/60 transition-all" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[9px] font-black text-zinc-500 uppercase mb-1.5 block">Quantity</label>
                      <input type="number" placeholder="e.g. 20" value={newBatchQty} onChange={e => setNewBatchQty(e.target.value)}
                        className="w-full bg-black border border-zinc-800 rounded-xl px-3 py-2.5 text-xs font-black outline-none focus:border-purple-500/60 transition-all" />
                    </div>
                    <div>
                      <label className="text-[9px] font-black text-zinc-500 uppercase mb-1.5 block">Expiry Date</label>
                      <input type="date" value={newBatchExpiry} onChange={e => setNewBatchExpiry(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full bg-black border border-zinc-800 rounded-xl px-3 py-2.5 text-xs font-black outline-none focus:border-purple-500/60 transition-all" />
                    </div>
                  </div>
                  <button onClick={handleAddBatch} disabled={savingBatch}
                    className="w-full bg-purple-600 hover:bg-purple-500 disabled:bg-zinc-800 text-white py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all active:scale-95">
                    {savingBatch ? 'Saving...' : '+ Add Batch'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}