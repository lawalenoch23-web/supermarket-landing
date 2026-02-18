import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { 
  ShoppingCart, Package, Clock, CheckCircle, Truck, AlertCircle, 
  User, MapPin, Phone, Plus, Minus, Trash2, LogOut, X, Save, Edit3, 
  Search, AlertTriangle, Bell, Upload, PackagePlus, PlusCircle,
  ChevronDown, ChevronUp, ShoppingBag, DollarSign
} from 'lucide-react';

// ══════════════════════════════════════════════════════════════
// TYPES & FORMATTERS
// ══════════════════════════════════════════════════════════════

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

// ══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════

export default function StaffOS() {
  // ─── AUTHENTICATION ───
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // ─── DATA STATE ───
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [onlineOrders, setOnlineOrders] = useState<any[]>([]);
  const [pickupOrders, setPickupOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // ─── COUNTER SALE (POS) ───
  const [counterCart, setCounterCart] = useState<CounterItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [processingCheckout, setProcessingCheckout] = useState(false);

  // ─── INVENTORY MANAGEMENT ───
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newStock, setNewStock] = useState('10');
  const [newCategory, setNewCategory] = useState('');
  const [newProduct, setNewProduct] = useState({ name: '', price: '', image_url: '', category: '', stock: '10' });
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('DEFAULT');

  // ─── UI STATE ───
  const [activeView, setActiveView] = useState<'pos' | 'inventory' | 'categories' | 'orders' | 'payments'>('pos');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [newOrderGlow, setNewOrderGlow] = useState(false);
  const [orderFilter, setOrderFilter] = useState('ALL');
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // ─── PRODUCT EDIT MODAL ───
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({ name: '', price: '', stock: '', image_url: '', category: '' });

  // ─── CHECK AUTH ON MOUNT ───
  useEffect(() => {
    const session = localStorage.getItem('staff_session');
    const sessionTime = localStorage.getItem('staff_session_time');
    if (session && sessionTime) {
      const now = new Date().getTime();
      const sessionAge = now - parseInt(sessionTime);
      if (sessionAge < 12 * 60 * 60 * 1000) {
        setIsAuthenticated(true);
      } else {
        localStorage.removeItem('staff_session');
        localStorage.removeItem('staff_session_time');
      }
    }
  }, []);

  // ─── FETCH DATA ───
  const fetchData = async () => {
    setLoading(true);
    try {
      const [productsRes, categoriesRes, onlineOrdersRes, pickupOrdersRes] = await Promise.all([
        supabase.from('products').select('*').order('name'),
        supabase.from('categories').select('*').order('name'),
        supabase.from('orders').select('*').not('address', 'is', null).order('created_at', { ascending: false }),
        supabase.from('orders').select('*').is('address', null).order('created_at', { ascending: false })
      ]);

      if (productsRes.data) setProducts(productsRes.data);
      if (categoriesRes.data) setCategories(categoriesRes.data);

      if (onlineOrdersRes.data) {
        const previousCount = onlineOrders.length;
        const newCount = onlineOrdersRes.data.length;

        // Trigger notification if new order arrived
        if (newCount > previousCount && previousCount > 0) {
          triggerNewOrderNotification();
        }

        setOnlineOrders(onlineOrdersRes.data);
      }

      if (pickupOrdersRes.data) setPickupOrders(pickupOrdersRes.data);
    } catch (err) {
      console.error("Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  // ─── REALTIME SUBSCRIPTION ───
  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
      const channel = supabase.channel('staff-os-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, fetchData)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, fetchData)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchData)
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [isAuthenticated, onlineOrders.length]);

  // ─── NEW ORDER NOTIFICATION ───
  const triggerNewOrderNotification = () => {
    setNewOrderGlow(true);
    if (audioRef.current) {
      audioRef.current.play().catch(err => console.log('Audio play failed:', err));
    }
    setTimeout(() => setNewOrderGlow(false), 3000);
  };

  // ─── SIMULATE NEW ORDER (FOR DEMO) ───
  const simulateNewOrder = async () => {
    const mockOrder = {
      customer_name: 'DEMO CUSTOMER',
      phone_number: '08012345678',
      address: '123 Demo Street, Lagos',
      items: 'Milk, Bread, Eggs',
      grand_total: 1600,
      status: 'PENDING',
      payment_method: 'cash',
      created_at: new Date().toISOString()
    };

    await supabase.from('orders').insert([mockOrder]);
    fetchData();
  };

  // ─── AUTHENTICATION ───
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError('');
    try {
      const { data, error } = await supabase.from('store_settings').select('staff_password').eq('id', 1).single();
      if (error) throw error;

      setTimeout(() => {
        if (passwordInput === data?.staff_password || passwordInput === import.meta.env.VITE_MASTER_KEY) {
          localStorage.setItem('staff_session', 'authenticated');
          localStorage.setItem('staff_session_time', new Date().getTime().toString());
          setIsAuthenticated(true);
          setPasswordInput('');
        } else {
          setLoginError('Invalid password');
        }
        setIsLoggingIn(false);
      }, 600);
    } catch (err: any) {
      setLoginError('Authentication failed');
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    if (confirm('Are you sure you want to logout?')) {
      localStorage.removeItem('staff_session');
      localStorage.removeItem('staff_session_time');
      setIsAuthenticated(false);
      setCounterCart([]);
      setCustomerName('');
      setCustomerPhone('');
    }
  };

  // ─── COUNTER SALE (POS) FUNCTIONS ───
  const addToCounter = (product: any) => {
    const existing = counterCart.find(item => item.productId === product.id);
    if (existing) {
      setCounterCart(counterCart.map(item =>
        item.productId === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCounterCart([...counterCart, {
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity: 1
      }]);
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
    if (counterCart.length === 0) {
      alert('Cart is empty');
      return;
    }
    if (!customerName.trim()) {
      alert('Please enter customer name');
      return;
    }

    setProcessingCheckout(true);
    try {
      const itemsString = counterCart.map(item => `${item.name} (${item.quantity}x)`).join(', ');

      const orderData = {
        customer_name: customerName.toUpperCase(),
        phone_number: customerPhone || 'N/A',
        address: null, // null = pickup order
        items: itemsString,
        total_price: counterTotal,
        status: 'READY',
        payment_status: 'paid',  // Counter sales are paid immediately
        payment_method: 'cash',
        created_at: new Date().toISOString()
      };

      const { error } = await supabase.from('orders').insert([orderData]);
      if (error) throw error;

      // Deduct stock
      for (const item of counterCart) {
        const product = products.find(p => p.id === item.productId);
        if (product) {
          const newStock = Math.max(0, (product.stock || 0) - item.quantity);
          await supabase.from('products').update({ stock: newStock }).eq('id', item.productId);
        }
      }

      alert(`✅ Sale completed! Total: ₦${counterTotal.toLocaleString()}`);

      // Reset
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

  // ─── ONLINE ORDER STATUS TRANSITIONS ───
  const updateOrderStatus = async (orderId: number, newStatus: OrderStatus) => {
    try {
      const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
      if (error) throw error;

      // Update local state immediately (no reload needed)
      setOnlineOrders(prev => prev.map(o => 
        o.id === orderId ? { ...o, status: newStatus } : o
      ));
      setPickupOrders(prev => prev.map(o => 
        o.id === orderId ? { ...o, status: newStatus } : o
      ));
    } catch (err: any) {
      alert('Failed to update status: ' + err.message);
    }
  };

  // ─── PRODUCT MANAGEMENT ───
  const openEditModal = (product: any) => {
    setEditingProduct(product);
    setEditForm({
      name: product.name,
      price: product.price.toString(),
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
        name: editForm.name,
        price: parseFloat(editForm.price),
        stock: parseInt(editForm.stock),
        image: editForm.image_url,
        image_url: editForm.image_url,
        category: editForm.category
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

  // ─── CATEGORY MANAGEMENT ───
  const handleAddCategory = async () => {
    if (!newCategoryName) return;
    const { error } = await supabase.from('categories').insert([{ name: newCategoryName.toUpperCase() }]);
    if (!error) { setNewCategoryName(''); fetchData(); alert('Category added!'); }
  };

  const deleteCategory = async (id: number) => {
    if (!confirm("Delete category? Products using this category will need reassignment.")) return;
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) alert("Error: Category may still be in use.");
    else { fetchData(); alert('Category deleted!'); }
  };

  // ─── INVENTORY FUNCTIONS ───
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
      name: newName.toUpperCase(),
      price: parseFloat(newPrice),
      category: newCategory,
      image: newProduct.image_url || 'https://via.placeholder.com/400',
      image_url: newProduct.image_url || 'https://via.placeholder.com/400',
      stock: parseInt(newStock) || 10
    }]);
    if (error) { alert("Failed to add product: " + error.message); }
    else {
      setNewName(''); setNewPrice(''); setNewCategory(''); setNewStock('10');
      setNewProduct({ name: '', price: '', image_url: '', category: '', stock: '10' });
      fetchData(); alert("Product added!");
    }
  };

  const deleteProduct = async (id: number) => {
    if (!confirm("Delete this product?")) return;
    const { error} = await supabase.from('products').delete().eq('id', id);
    if (error) alert("Delete failed: " + error.message);
    else { fetchData(); alert("Product deleted!"); }
  };

  // ─── FILTERS ───

  // ─── PAYMENT TRACKING ───
  const deliveredUnpaidOrders = onlineOrders.filter(o => 
    o.status === 'DONE' && 
    o.payment_status === 'unpaid'
  );
  const cashInField = deliveredUnpaidOrders.reduce((sum, order) => sum + (order.total_price || 0), 0);

  const confirmPaymentReceived = async (orderId: number) => {
    if (!confirm('Confirm payment received from driver?')) return;
    try {
      const { error } = await supabase.from('orders').update({ payment_status: 'paid' }).eq('id', orderId);
      if (error) throw error;

      // Update local state immediately (no reload needed)
      setOnlineOrders(prev => prev.map(o => 
        o.id === orderId ? { ...o, payment_status: 'paid' } : o
      ));

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

  const inventoryFilteredProducts = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'PRICE_LOW') return a.price - b.price;
      if (sortBy === 'PRICE_HIGH') return b.price - a.price;
      if (sortBy === 'STOCK_LOW') return (a.stock || 0) - (b.stock || 0);
      if (sortBy === 'CATEGORY') return (a.category || '').localeCompare(b.category || '');
      return 0;
    });

  const filteredPickupOrders = pickupOrders.filter(o => orderFilter === 'ALL' || o.status === orderFilter);

  const pendingCount = onlineOrders.filter(o => o.status === 'PENDING').length + pickupOrders.filter(o => o.status === 'PENDING').length;
  const preparingCount = onlineOrders.filter(o => o.status === 'PREPARING').length + pickupOrders.filter(o => o.status === 'PREPARING').length;
  const readyCount = onlineOrders.filter(o => o.status === 'READY').length + pickupOrders.filter(o => o.status === 'READY').length;

  // ══════════════════════════════════════════════════════════════
  // LOGIN SCREEN
  // ══════════════════════════════════════════════════════════════

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-[#242424] border border-zinc-800 rounded-2xl p-8 shadow-2xl">
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 bg-[#ff8c00] rounded-xl flex items-center justify-center">
              <ShoppingCart size={32} className="text-black" />
            </div>
          </div>
          <h1 className="text-2xl font-black text-white text-center mb-2 uppercase tracking-tight">Staff Portal</h1>
          <p className="text-zinc-500 text-sm text-center mb-8 tracking-wide">Supermarket Operating System</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-zinc-400 text-xs font-bold mb-2 uppercase tracking-wider">Access Code</label>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="w-full bg-[#1a1a1a] border border-zinc-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-[#ff8c00] transition-colors"
                placeholder="Enter staff password"
                disabled={isLoggingIn}
              />
            </div>

            {loginError && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-2 rounded-lg text-sm flex items-center gap-2">
                <AlertCircle size={16} />
                {loginError}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full bg-[#ff8c00] hover:bg-[#ff9f1a] text-black font-black py-4 rounded-xl uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoggingIn ? 'Authenticating...' : 'Access System'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════
  // MAIN DASHBOARD
  // ══════════════════════════════════════════════════════════════

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white">

      {/* Hidden audio for notification */}
      <audio ref={audioRef}>
        <source src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZSA0PVqzn77BdGAg+ltryxnMpBSuAzu/cjToJGGS57OihUBELTKXh8bllHAU2jdXzzn0uBSV6yO/ekEIJE12y6OytWRcJP5fZ8sh0KwUthM/v3Y4+CRdpvO3mnE0ODFGn4/G1ZB0FN4/W88x9LgUme8rx3I9ECRNdr+nvrVgXCUCY2fLJdiwFLoXP7t2PQAkWaMDu4JpLDQxPqePwtWMcBTmO1fPMfi8GJ37K79+RRQoSXbDp7K1aGAhBmNryyXUsBS+F0O7dj0AIFmjA7eCaSw0MUKjj8LRjHAU6jtXzzH4vBih+yO/ejkUKEl6w6eyvWhcJQpja8sl0LAUwiNDu3Y5BCBZowO3nmkoPDFCo4/C0YhwFO47W88yALgYof8rs3Y5GDBJdsOnrr1oXCUKZ2vLJdiwFMIfR7duNQAgXadTu3ZRFDA5Rq+PysmMcBjqN1vLNgC8FKH/K7N2PQwsTXbDo7K9aGAhDmtrxyXQrBS+I0e7djkEJF2fU7d6UQw0LUqzj8rRiHQU6jtXzzYEvBSiAyu3dkEQNE12v6O2vWhgIQ5nb8sh0KgYviNHu3Y9ACBdm1O3flEkMDlKs5PKzYhwFOo7W881/LwYogcvt3I5FDRNdr+nur1kXCUSZ2vLJdSwGMIjQ7t2OQQgWZ9Xs3JFGCw5RrOPy3YxBCUOZ2/LIcysGMIjR7tyOQQkXZdXt3JNFCw5RrOPytmQdBTqO1vLMgC4GKH/K7d2PQwwUXK/p7K9aGQhDmdvxxnUsBjCG0e7djkIIGGnU7NyPRAkLU6rj87JiHQc5j9XzzH4uBSh/y+3ejkMNEl2v6O2wWhgHRJrc8Ml0LAUwh9Lu3Y9ACBdm1O7dj0MMDQ==" type="audio/wav" />
      </audio>

      {/* ══ TOP NAV ══ */}
      <nav className="bg-[#242424] border-b border-zinc-800 px-6 py-4 sticky top-0 z-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#ff8c00] rounded-lg flex items-center justify-center">
              <ShoppingCart size={24} className="text-black" />
            </div>
            <div>
              <h1 className="text-xl font-black uppercase tracking-tight">Staff OS</h1>
              <p className="text-xs text-zinc-500 tracking-wider">Point of Sale System</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={simulateNewOrder}
              className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors"
            >
              <Bell size={14} className="inline mr-2" />
              Test Alert
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-2"
            >
              <LogOut size={14} />
              Logout
            </button>
          </div>
        </div>

        {/* View Tabs */}
        <div className="flex gap-2 mt-4 overflow-x-auto">
          <button
            onClick={() => setActiveView('pos')}
            className={`px-5 py-2.5 rounded-lg font-bold text-sm uppercase tracking-wider transition-colors whitespace-nowrap ${
              activeView === 'pos' ? 'bg-[#ff8c00] text-black' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
            }`}
          >
            <ShoppingCart size={16} className="inline mr-2" />
            POS / Counter
          </button>
          <button
            onClick={() => setActiveView('inventory')}
            className={`px-5 py-2.5 rounded-lg font-bold text-sm uppercase tracking-wider transition-colors whitespace-nowrap ${
              activeView === 'inventory' ? 'bg-[#ff8c00] text-black' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
            }`}
          >
            <Package size={16} className="inline mr-2" />
            Inventory
          </button>
          <button
            onClick={() => setActiveView('categories')}
            className={`px-5 py-2.5 rounded-lg font-bold text-sm uppercase tracking-wider transition-colors whitespace-nowrap ${
              activeView === 'categories' ? 'bg-[#ff8c00] text-black' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
            }`}
          >
            <PlusCircle size={16} className="inline mr-2" />
            Categories
          </button>
          <button
            onClick={() => setActiveView('orders')}
            className={`px-5 py-2.5 rounded-lg font-bold text-sm uppercase tracking-wider transition-colors whitespace-nowrap ${
              activeView === 'orders' ? 'bg-[#ff8c00] text-black' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
            }`}
          >
            <ShoppingBag size={16} className="inline mr-2" />
            Pickup Orders {pendingCount > 0 && `(${pendingCount})`}
          </button>
          <button
            onClick={() => setActiveView('payments')}
            className={`px-5 py-2.5 rounded-lg font-bold text-sm uppercase tracking-wider transition-colors whitespace-nowrap ${
              activeView === 'payments' ? 'bg-[#ff8c00] text-black' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
            }`}
          >
            <DollarSign size={16} className="inline mr-2" />
            Payments
          </button>
        </div>
      </nav>

      {/* ══ STATS BAR ══ */}
      <div className="bg-[#242424] border-b border-zinc-800 px-6 py-4">
        <div className="grid grid-cols-3 gap-4 max-w-4xl">
          <div className="bg-[#1a1a1a] border border-zinc-800 p-3 rounded-lg text-center">
            <p className="text-2xl font-black text-yellow-500">{pendingCount}</p>
            <p className="text-[9px] font-black uppercase text-zinc-500 mt-1">Pending</p>
          </div>
          <div className="bg-[#1a1a1a] border border-zinc-800 p-3 rounded-lg text-center">
            <p className="text-2xl font-black text-blue-500">{preparingCount}</p>
            <p className="text-[9px] font-black uppercase text-zinc-500 mt-1">Preparing</p>
          </div>
          <div className="bg-[#1a1a1a] border border-zinc-800 p-3 rounded-lg text-center">
            <p className="text-2xl font-black text-green-500">{readyCount}</p>
            <p className="text-[9px] font-black uppercase text-zinc-500 mt-1">Ready</p>
          </div>
        </div>
      </div>

      {/* ══ MAIN LAYOUT ══ */}
      <div className="flex">

        {/* ─── LEFT/CENTER: Main Content Area ─── */}
        <div className="flex-1 p-6 overflow-y-auto" style={{ height: 'calc(100vh - 220px)' }}>

          {activeView === 'pos' && (
            <>
              {/* Search & Filters */}
              <div className="mb-6 flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search products..."
                    className="w-full bg-[#242424] border border-zinc-800 text-white pl-12 pr-4 py-3 rounded-xl focus:outline-none focus:border-[#ff8c00]"
                  />
                </div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="bg-[#242424] border border-zinc-800 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-[#ff8c00]"
                >
                  <option value="All">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
              </div>

              {/* Product Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredProducts.map(product => {
                  const stock = product.stock || 0;
                  const isSoldOut = stock <= 0;
                  const isLowStock = stock > 0 && stock < 5;

                  return (
                    <button
                      key={product.id}
                      onClick={() => !isSoldOut && addToCounter(product)}
                      disabled={isSoldOut}
                      className={`bg-[#242424] border rounded-xl p-4 text-left transition-all hover:border-[#ff8c00] active:scale-95 ${
                        isSoldOut 
                          ? 'opacity-40 cursor-not-allowed border-zinc-800' 
                          : 'border-zinc-800 hover:shadow-lg hover:shadow-[#ff8c00]/20'
                      }`}
                    >
                      {(product.image_url || product.image) ? (
                        <img src={product.image_url || product.image} alt={product.name} className="w-full h-32 object-cover rounded-lg mb-3" />
                      ) : (
                        <div className="w-full h-32 bg-zinc-800 rounded-lg mb-3 flex items-center justify-center">
                          <Package size={32} className="text-zinc-600" />
                        </div>
                      )}
                      <h3 className="font-bold text-white mb-1 truncate">{product.name}</h3>
                      <p className="text-[#ff8c00] font-black text-lg">₦{(product.price || 0).toLocaleString()}</p>
                      <p className={`text-xs mt-1 font-bold ${isSoldOut ? 'text-red-500' : isLowStock ? 'text-yellow-500' : 'text-zinc-500'}`}>
                        {isSoldOut ? 'OUT OF STOCK' : `Stock: ${stock}`}
                      </p>
                    </button>
                  );
                })}
              </div>

              {filteredProducts.length === 0 && (
                <div className="text-center py-20 text-zinc-600">
                  <Package size={64} className="mx-auto mb-4 opacity-30" />
                  <p className="font-bold uppercase tracking-wider">No products found</p>
                </div>
              )}
            </>
          )}

          {activeView === 'inventory' && (
            <>
              {/* ADD PRODUCT FORM */}
              <div className="bg-[#242424] border border-zinc-800 rounded-xl overflow-hidden mb-6">
                <div className="p-5 border-b border-zinc-800 bg-zinc-900/30">
                  <h2 className="text-sm font-black uppercase flex items-center gap-2">
                    <PackagePlus size={16} className="text-[#ff8c00]" /> Add New Product
                  </h2>
                </div>
                <div className="p-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                    <div>
                      <label className="text-[9px] font-black text-zinc-500 uppercase tracking-wider mb-1.5 block">Product Name</label>
                      <input placeholder="e.g. INDOMIE NOODLES" value={newName} onChange={e => setNewName(e.target.value)} className="w-full bg-[#1a1a1a] border border-zinc-800 rounded-xl px-4 py-3 text-xs font-black uppercase outline-none focus:border-[#ff8c00] transition-all" />
                    </div>
                    <div>
                      <label className="text-[9px] font-black text-zinc-500 uppercase tracking-wider mb-1.5 block">Price (₦)</label>
                      <input placeholder="e.g. 1500" type="number" value={newPrice} onChange={e => setNewPrice(e.target.value)} className="w-full bg-[#1a1a1a] border border-zinc-800 rounded-xl px-4 py-3 text-xs font-black uppercase outline-none focus:border-[#ff8c00] transition-all" />
                    </div>
                    <div>
                      <label className="text-[9px] font-black text-zinc-500 uppercase tracking-wider mb-1.5 block">Stock Quantity</label>
                      <input placeholder="e.g. 10" type="number" value={newStock} onChange={e => setNewStock(e.target.value)} className="w-full bg-[#1a1a1a] border border-zinc-800 rounded-xl px-4 py-3 text-xs font-black uppercase outline-none focus:border-[#ff8c00] transition-all" />
                    </div>
                    <div>
                      <label className="text-[9px] font-black text-zinc-500 uppercase tracking-wider mb-1.5 block">Category</label>
                      <select value={newCategory} onChange={e => setNewCategory(e.target.value)} className="w-full bg-[#1a1a1a] border border-zinc-800 rounded-xl px-4 py-3 text-xs font-black uppercase appearance-none outline-none focus:border-[#ff8c00] transition-all">
                        <option value="">Select Category...</option>
                        {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-[9px] font-black text-zinc-500 uppercase tracking-wider mb-1.5 block">Product Image</label>
                      <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" id="product-image" />
                      {newProduct.image_url ? (
                        <div className="flex items-center gap-3 bg-[#1a1a1a] border border-green-500/30 rounded-xl p-3">
                          <img src={newProduct.image_url} className="w-16 h-16 object-cover rounded-lg border border-zinc-800" alt="Preview" />
                          <div className="flex-1"><p className="text-xs font-black text-green-500 uppercase mb-1">✓ Image Ready</p></div>
                          <label htmlFor="product-image" className="bg-zinc-800 hover:bg-zinc-700 text-white px-3 py-2 rounded-lg text-[9px] font-black uppercase cursor-pointer transition-all">Replace</label>
                        </div>
                      ) : (
                        <label htmlFor="product-image" className="w-full bg-[#1a1a1a] border border-dashed border-zinc-700 rounded-xl px-4 py-6 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-[#ff8c00] hover:bg-zinc-950 transition-all group">
                          <Upload size={20} className="text-zinc-600 group-hover:text-[#ff8c00] transition-colors" />
                          <p className="text-xs font-black uppercase text-zinc-500 group-hover:text-[#ff8c00] transition-colors">Upload Product Image</p>
                        </label>
                      )}
                    </div>
                  </div>
                  <button onClick={handleAddProduct} className="w-full bg-[#ff8c00] hover:bg-[#ff9f1a] py-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all active:scale-95">+ Add Product to Inventory</button>
                </div>
              </div>

              {/* PRODUCTS GRID */}
              <div className="bg-[#242424] border border-zinc-800 rounded-xl overflow-hidden">
                <div className="p-4 border-b border-zinc-800 bg-zinc-900/20 flex flex-col sm:flex-row gap-2">
                  <input type="text" placeholder="SEARCH PRODUCTS..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="flex-1 bg-[#1a1a1a] border border-zinc-800 rounded-lg px-4 py-2.5 text-xs font-black uppercase outline-none focus:border-[#ff8c00] transition-all" />
                  <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 text-xs font-black uppercase outline-none text-zinc-400">
                    <option value="DEFAULT">SORT BY</option>
                    <option value="PRICE_LOW">PRICE: LOW → HIGH</option>
                    <option value="PRICE_HIGH">PRICE: HIGH → LOW</option>
                    <option value="STOCK_LOW">STOCK: LOW → HIGH</option>
                    <option value="CATEGORY">CATEGORY A-Z</option>
                  </select>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-[550px] overflow-y-auto">
                    {inventoryFilteredProducts.map(p => {
                      const stock = p.stock || 0;
                      const isLowStock = stock > 0 && stock < 5;
                      const isSoldOut = stock <= 0;
                      return (
                        <div key={p.id} className={`bg-[#1a1a1a] p-2 rounded-xl border flex flex-col gap-1.5 group hover:border-[#ff8c00]/50 transition-all ${isSoldOut ? 'border-red-900/50 opacity-70' : isLowStock ? 'border-yellow-900/50' : 'border-zinc-900'}`}>
                          <div className="relative aspect-square overflow-hidden rounded-lg group/img">
                            <img src={p.image || p.image_url || 'https://via.placeholder.com/400'} className="w-full h-full object-cover bg-zinc-900" alt={p.name} onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400?text=No+Image'; }} />
                            <div className={`absolute top-1.5 left-1.5 px-2 py-0.5 rounded-md text-[7px] font-black ${isSoldOut ? 'bg-red-600 text-white' : isLowStock ? 'bg-yellow-500 text-black' : 'bg-green-600 text-white'}`}>{isSoldOut ? 'SOLD OUT' : `${stock} LEFT`}</div>
                            <input type="file" accept="image/*" id={`replace-${p.id}`} className="hidden" onChange={(e) => handleReplaceProductImage(p.id, e)} />
                            <label htmlFor={`replace-${p.id}`} className="absolute inset-0 bg-black/80 opacity-0 group-hover/img:opacity-100 transition-all flex flex-col items-center justify-center cursor-pointer text-[8px] font-black gap-1"><Upload size={12} /> UPDATE IMG</label>
                          </div>
                          <div className="px-0.5">
                            <p className="text-[9px] font-black uppercase truncate leading-tight">{p.name}</p>
                            <p className="text-[9px] text-[#ff8c00] font-bold">₦{(p.price || 0).toLocaleString()}</p>
                            <p className="text-[8px] text-zinc-600 uppercase font-bold">{p.category}</p>
                          </div>
                          <div className="flex gap-1">
                            <button onClick={() => openEditModal(p)} className="flex-1 flex items-center justify-center gap-1 py-1 bg-zinc-900 hover:bg-blue-600 text-zinc-600 hover:text-white rounded-lg text-[8px] font-black uppercase transition-all active:scale-95">
                              <Edit3 size={9} /> Edit
                            </button>
                            <button onClick={() => markOutOfStock(p.id)} className="flex-1 flex items-center justify-center gap-1 py-1 bg-zinc-900 hover:bg-yellow-600 text-zinc-600 hover:text-white rounded-lg text-[8px] font-black uppercase transition-all active:scale-95">
                              <AlertTriangle size={9} /> 0
                            </button>
                            <button onClick={() => deleteProduct(p.id)} className="flex-1 flex items-center justify-center gap-1 py-1 bg-zinc-900 hover:bg-red-600 text-zinc-600 hover:text-white rounded-lg text-[8px] font-black uppercase transition-all active:scale-95">
                              <Trash2 size={9} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                    {inventoryFilteredProducts.length === 0 && (
                      <div className="col-span-full text-center py-16">
                        <PackagePlus size={32} className="text-zinc-800 mx-auto mb-3" />
                        <p className="text-zinc-600 text-xs font-black uppercase">No products found</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {activeView === 'categories' && (
            <>
              <div className="bg-[#242424] border border-zinc-800 p-6 rounded-xl mb-6">
                <h2 className="text-sm font-black uppercase mb-4 flex items-center gap-2"><PlusCircle size={16} className="text-[#ff8c00]" /> Add New Category</h2>
                <div className="flex gap-3">
                  <input value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="CATEGORY NAME..." className="flex-1 bg-[#1a1a1a] border border-zinc-800 rounded-xl px-4 py-3 text-sm font-black uppercase outline-none focus:border-[#ff8c00] transition-all" />
                  <button onClick={handleAddCategory} className="bg-[#ff8c00] hover:bg-[#ff9f1a] px-8 py-3 rounded-xl flex items-center gap-2 font-black uppercase text-sm transition-all active:scale-95"><Save size={16} /> Add</button>
                </div>
              </div>
              <div className="bg-[#242424] border border-zinc-800 p-6 rounded-xl">
                <h3 className="text-xs font-black uppercase text-zinc-500 mb-4">All Categories ({categories.length})</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {categories.map(c => (
                    <div key={c.id} className="flex justify-between items-center bg-[#1a1a1a] border border-zinc-900 px-4 py-3 rounded-xl group hover:border-[#ff8c00]/50 transition-all">
                      <div>
                        <span className="text-sm font-black uppercase">{c.name}</span>
                        <p className="text-[9px] text-zinc-600 font-bold">{products.filter(p => p.category === c.name).length} products</p>
                      </div>
                      <button onClick={() => deleteCategory(c.id)} className="text-zinc-600 hover:text-red-500 transition-colors p-2"><Trash2 size={14} /></button>
                    </div>
                  ))}
                  {categories.length === 0 && <div className="col-span-full text-center py-10 text-zinc-600"><p className="text-xs font-black uppercase">No categories yet</p></div>}
                </div>
              </div>
            </>
          )}

          {activeView === 'orders' && (
            <>
              <div className="bg-[#242424] border border-zinc-800 rounded-xl p-4 mb-6">
                <p className="text-[9px] font-black text-zinc-600 uppercase tracking-wider mb-3">Filter by Status</p>
                <div className="flex flex-wrap gap-2">
                  {['ALL', 'PENDING', 'PREPARING', 'READY', 'DONE'].map((status) => (
                    <button key={status} onClick={() => setOrderFilter(status)} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all active:scale-95 ${orderFilter === status ? status === 'ALL' ? 'bg-white text-black' : status === 'PENDING' ? 'bg-orange-500 text-black' : status === 'PREPARING' ? 'bg-yellow-500 text-black' : status === 'READY' ? 'bg-blue-500 text-white' : 'bg-green-500 text-black' : 'bg-zinc-900/50 text-zinc-600 hover:bg-zinc-800 hover:text-zinc-400'}`}>
                      {status} {status !== 'ALL' && `(${pickupOrders.filter(o => o.status === status).length})`}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-[#242424] border border-zinc-800 rounded-xl overflow-hidden">
                <div className="p-5 border-b border-zinc-800 bg-zinc-900/20 flex items-center gap-2">
                  <ShoppingBag size={14} className="text-[#ff8c00]" />
                  <h2 className="text-xs font-black uppercase tracking-widest">📦 Pickup Orders Only</h2>
                  <span className="ml-auto text-[9px] font-black text-zinc-600 bg-zinc-900 px-2 py-1 rounded-lg uppercase">{filteredPickupOrders.length} Order{filteredPickupOrders.length !== 1 ? 's' : ''}</span>
                </div>

                <div className="divide-y divide-zinc-900 max-h-[600px] overflow-y-auto">
                  {filteredPickupOrders.length === 0 ? (
                    <div className="p-16 text-center">
                      <ShoppingBag size={36} className="text-zinc-800 mx-auto mb-3" />
                      <p className="text-xs font-black uppercase text-zinc-600">No pickup orders found</p>
                    </div>
                  ) : (
                    filteredPickupOrders.map(order => {
                      const isExpanded = expandedOrderId === order.id;
                      return (
                        <div key={order.id} className="hover:bg-white/[0.02] transition-colors">
                          <div className="p-4 flex items-center gap-3 cursor-pointer select-none" onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}>
                            <div className="bg-black border border-zinc-800 px-2.5 py-1.5 rounded-lg flex-shrink-0">
                              <p className="text-xs font-black"># {order.id}</p>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-black uppercase truncate">{order.customer_name}</p>
                              <p className="text-xs font-bold text-orange-400 mt-0.5 flex items-center gap-1">
                                <Clock size={9} className="text-orange-500" />
                                {formatOrderDateTime(order.created_at)}
                              </p>
                              {order.phone_number && <span className="text-xs text-green-500 font-bold">📞 {order.phone_number}</span>}
                            </div>
                            <select value={order.status} onClick={e => e.stopPropagation()} onChange={(e) => updateOrderStatus(order.id, e.target.value as OrderStatus)} className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase border-none outline-none flex-shrink-0 ${order.status === 'DONE' ? 'bg-green-600/20 text-green-500' : order.status === 'READY' ? 'bg-blue-600/20 text-blue-500' : order.status === 'PREPARING' ? 'bg-yellow-600/20 text-yellow-500' : 'bg-orange-600/20 text-orange-500'}`}>
                              <option value="PENDING">PENDING</option>
                              <option value="PREPARING">PREPARING</option>
                              <option value="READY">READY</option>
                              <option value="DONE">DONE</option>
                            </select>
                            <p className="text-base font-black text-orange-500 flex-shrink-0">₦{(order.total_price || order.total_price || 0).toLocaleString()}</p>
                            <div className="text-zinc-600 flex-shrink-0">{isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</div>
                          </div>

                          {isExpanded && (
                            <div className="px-4 pb-4 animate-in slide-in-from-top-2 fade-in duration-200">
                              <div className="bg-[#1a1a1a] border border-zinc-900 p-4 rounded-xl">
                                <p className="text-[9px] font-black uppercase text-zinc-600 mb-3 tracking-wider">Items Ordered</p>
                                <div className="space-y-1.5 mb-4">
                                  {order.items?.split(', ').map((item: string, idx: number) => (
                                    <div key={idx} className="flex items-center gap-2 text-xs">
                                      <div className="w-1.5 h-1.5 bg-[#ff8c00] rounded-full flex-shrink-0" />
                                      <span className="font-medium">{item}</span>
                                    </div>
                                  ))}
                                </div>
                                <div className="flex justify-between items-center pt-3 border-t border-zinc-900">
                                  <span className="text-xs font-black uppercase text-zinc-500">Total Paid</span>
                                  <span className="text-lg font-black text-orange-500">₦{(order.total_price || order.total_price || 0).toLocaleString()}</span>
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
            </>
          )}

          {activeView === 'payments' && (
            <>
              {/* CASH IN FIELD METRIC */}
              <div className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border-2 border-orange-500/30 p-6 rounded-xl mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-black uppercase text-orange-400 mb-2">💵 Cash in Field</p>
                    <p className="text-4xl font-black text-orange-500">₦{cashInField.toLocaleString()}</p>
                    <p className="text-xs text-zinc-400 mt-2">
                      {deliveredUnpaidOrders.length} order{deliveredUnpaidOrders.length !== 1 ? 's' : ''} awaiting collection
                    </p>
                  </div>
                  <div className="bg-orange-500/20 p-4 rounded-xl">
                    <DollarSign size={48} className="text-orange-500" />
                  </div>
                </div>
              </div>

              {/* UNPAID ORDERS LIST */}
              <div className="bg-[#242424] border border-zinc-800 rounded-xl overflow-hidden">
                <div className="p-5 border-b border-zinc-800 bg-zinc-900/20">
                  <h2 className="text-sm font-black uppercase flex items-center gap-2">
                    <AlertTriangle size={16} className="text-orange-500" />
                    Awaiting Payment Confirmation
                  </h2>
                </div>

                {deliveredUnpaidOrders.length === 0 ? (
                  <div className="p-16 text-center">
                    <CheckCircle size={48} className="text-green-500 mx-auto mb-3" />
                    <p className="text-sm font-black uppercase text-zinc-600">All Payments Collected!</p>
                  </div>
                ) : (
                  <div className="divide-y divide-zinc-800">
                    {deliveredUnpaidOrders.map(order => (
                      <div key={order.id} className="p-5 hover:bg-white/[0.02] transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="text-lg font-black text-orange-500">Order #{order.id}</span>
                              <span className="px-2 py-1 bg-orange-500/20 text-orange-400 text-[10px] font-black uppercase rounded">Unpaid</span>
                            </div>
                            <p className="text-sm font-bold text-white mb-1">{order.customer_name}</p>
                            <p className="text-xs text-zinc-500">{order.phone_number}</p>
                            <p className="text-xs text-zinc-600 mt-1">{formatOrderDateTime(order.created_at)}</p>
                          </div>

                          <div className="text-right">
                            <p className="text-2xl font-black text-orange-500 mb-3">₦{(order.total_price || 0).toLocaleString()}</p>
                            <button
                              onClick={() => confirmPaymentReceived(order.id)}
                              className="px-6 py-3 bg-green-600 hover:bg-green-500 text-white rounded-xl font-black uppercase text-xs tracking-wider transition-all active:scale-95"
                            >
                              <CheckCircle size={14} className="inline mr-2" />
                              Confirm Payment
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* ─── RIGHT SIDEBAR: Counter Cart + Online Orders ─── */}
        <div className="w-96 bg-[#242424] border-l border-zinc-800 overflow-y-auto sticky top-[220px]" style={{ height: 'calc(100vh - 220px)' }}>

          {activeView === 'pos' && (
            <>
              {/* Counter Cart */}
              <div className="p-4 border-b border-zinc-800">
                <h2 className="text-lg font-black uppercase mb-4 flex items-center gap-2">
                  <ShoppingCart size={18} />
                  Counter Sale
                </h2>

                <div className="space-y-2 mb-4">
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Customer Name *"
                    className="w-full bg-[#1a1a1a] border border-zinc-700 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-[#ff8c00]"
                  />
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="Phone (Optional)"
                    className="w-full bg-[#1a1a1a] border border-zinc-700 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-[#ff8c00]"
                  />
                </div>

                {counterCart.length === 0 ? (
                  <div className="text-center py-8 text-zinc-600">
                    <ShoppingCart size={32} className="mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Cart is empty</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2 mb-4 max-h-60 overflow-y-auto">
                      {counterCart.map(item => (
                        <div key={item.productId} className="bg-[#1a1a1a] border border-zinc-800 rounded-lg p-3">
                          <div className="flex items-start justify-between mb-2">
                            <p className="font-bold text-sm flex-1">{item.name}</p>
                            <button
                              onClick={() => removeFromCounter(item.productId)}
                              className="text-red-500 hover:text-red-400"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => updateCounterQuantity(item.productId, -1)}
                                className="w-7 h-7 bg-zinc-700 hover:bg-zinc-600 rounded flex items-center justify-center"
                              >
                                <Minus size={14} />
                              </button>
                              <span className="font-bold w-8 text-center">{item.quantity}</span>
                              <button
                                onClick={() => updateCounterQuantity(item.productId, 1)}
                                className="w-7 h-7 bg-zinc-700 hover:bg-zinc-600 rounded flex items-center justify-center"
                              >
                                <Plus size={14} />
                              </button>
                            </div>
                            <p className="text-[#ff8c00] font-black">₦{(item.price * item.quantity).toLocaleString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="bg-[#1a1a1a] border border-zinc-800 rounded-lg p-4 mb-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xl font-black uppercase">Total</span>
                        <span className="text-2xl font-black text-[#ff8c00]">₦{counterTotal.toLocaleString()}</span>
                      </div>
                    </div>

                    <button
                      onClick={processCounterSale}
                      disabled={processingCheckout || !customerName.trim()}
                      className="w-full bg-[#ff8c00] hover:bg-[#ff9f1a] text-black font-black py-4 rounded-xl uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {processingCheckout ? 'Processing...' : 'Complete Sale'}
                    </button>
                  </>
                )}
              </div>
            </>
          )}

          {/* Online Orders Feed */}
          <div className={`p-4 ${newOrderGlow ? 'animate-pulse bg-[#ff8c00]/10' : ''}`}>
            <h2 className="text-lg font-black uppercase mb-4 flex items-center gap-2">
              <Package size={18} className={newOrderGlow ? 'text-[#ff8c00]' : ''} />
              Online Orders
              {newOrderGlow && <span className="text-xs bg-[#ff8c00] text-black px-2 py-1 rounded-full font-black">NEW!</span>}
            </h2>

            {onlineOrders.length === 0 ? (
              <div className="text-center py-8 text-zinc-600">
                <Package size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">No orders yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {onlineOrders.map(order => (
                  <div key={order.id} className="bg-[#1a1a1a] border border-zinc-800 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-black text-[#ff8c00] text-lg">#{order.id}</p>
                        <p className="text-xs text-zinc-500">{formatOrderDateTime(order.created_at)}</p>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-black ${
                        order.status === 'PENDING' ? 'bg-yellow-500/20 text-yellow-400' :
                        order.status === 'PREPARING' ? 'bg-blue-500/20 text-blue-400' :
                        order.status === 'READY' ? 'bg-green-500/20 text-green-400' :
                        'bg-purple-500/20 text-purple-400'
                      }`}>
                        {order.status}
                      </div>
                    </div>

                    <div className="space-y-2 mb-3 text-sm">
                      <div className="flex items-center gap-2">
                        <User size={14} className="text-zinc-600" />
                        <span className="font-bold">{order.customer_name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone size={14} className="text-zinc-600" />
                        <span>{order.phone_number}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <MapPin size={14} className="text-zinc-600 mt-0.5" />
                        <span className="text-xs text-zinc-400">{order.address || 'N/A'}</span>
                      </div>
                      <div className="pt-2 border-t border-zinc-800">
                        <p className="text-zinc-500 text-xs mb-1">Items:</p>
                        <p className="text-sm">{order.items}</p>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-zinc-800">
                        <span className="text-zinc-500 text-xs uppercase font-bold">Total</span>
                        <span className="text-[#ff8c00] font-black text-lg">₦{(order.total_price || 0).toLocaleString()}</span>
                      </div>
                    </div>

                    {order.status === 'PENDING' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'PREPARING')}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded-lg uppercase text-xs tracking-wider transition-colors"
                      >
                        <Clock size={14} className="inline mr-2" />
                        Start Packing
                      </button>
                    )}
                    {order.status === 'PREPARING' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'READY')}
                        className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-2 rounded-lg uppercase text-xs tracking-wider transition-colors"
                      >
                        <CheckCircle size={14} className="inline mr-2" />
                        Mark Ready
                      </button>
                    )}
                    {order.status === 'READY' && (
                      <div className="bg-green-500/10 border border-green-500/30 text-green-400 px-3 py-2 rounded-lg text-center">
                        <Truck size={16} className="inline mr-2" />
                        <span className="text-xs font-bold uppercase">Waiting for Driver</span>
                      </div>
                    )}
                    {order.status === 'OUT_FOR_DELIVERY' && (
                      <div className="bg-purple-500/10 border border-purple-500/30 text-purple-400 px-3 py-2 rounded-lg text-center">
                        <Truck size={16} className="inline mr-2" />
                        <span className="text-xs font-bold uppercase">Out for Delivery</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ══ EDIT PRODUCT MODAL ══ */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#242424] border border-zinc-800 rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black uppercase">Edit Product</h2>
              <button onClick={closeEditModal} className="text-zinc-500 hover:text-white">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-zinc-400 text-xs font-bold mb-2 uppercase">Product Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full bg-[#1a1a1a] border border-zinc-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-[#ff8c00]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-zinc-400 text-xs font-bold mb-2 uppercase">Price (₦)</label>
                  <input
                    type="number"
                    value={editForm.price}
                    onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                    className="w-full bg-[#1a1a1a] border border-zinc-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-[#ff8c00]"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 text-xs font-bold mb-2 uppercase">Stock</label>
                  <input
                    type="number"
                    value={editForm.stock}
                    onChange={(e) => setEditForm({ ...editForm, stock: e.target.value })}
                    className="w-full bg-[#1a1a1a] border border-zinc-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-[#ff8c00]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 text-xs font-bold mb-2 uppercase">Category</label>
                <select
                  value={editForm.category}
                  onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                  className="w-full bg-[#1a1a1a] border border-zinc-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-[#ff8c00]"
                >
                  <option value="">Select category</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-zinc-400 text-xs font-bold mb-2 uppercase">Image URL</label>
                <input
                  type="text"
                  value={editForm.image_url}
                  onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
                  className="w-full bg-[#1a1a1a] border border-zinc-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-[#ff8c00]"
                  placeholder="https://..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={saveProductEdit}
                  className="flex-1 bg-[#ff8c00] hover:bg-[#ff9f1a] text-black font-bold py-3 rounded-lg uppercase tracking-wider transition-colors"
                >
                  <Save size={16} className="inline mr-2" />
                  Save Changes
                </button>
                <button
                  onClick={closeEditModal}
                  className="px-6 bg-zinc-700 hover:bg-zinc-600 text-white font-bold py-3 rounded-lg uppercase tracking-wider transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}