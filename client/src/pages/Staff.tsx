import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { 
  Users, PlusCircle, Save, Trash2, Upload, X, PackagePlus, LogOut,
  Clock, Calendar, ShoppingBag, ChevronDown, ChevronUp, Edit3
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

export default function Staff() {
  // --- AUTHENTICATION STATE ---
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // --- DATA STATE ---
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // --- FORM STATE ---
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newStock, setNewStock] = useState('10');
  const [newCategory, setNewCategory] = useState('');
  const [newProduct, setNewProduct] = useState({ name: '', price: '', image_url: '', category: '', stock: '10' });
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('DEFAULT');
  const [activeView, setActiveView] = useState<'products' | 'categories' | 'orders'>('products');

  // --- ORDERS STATE ---
  const [orderFilter, setOrderFilter] = useState('ALL');
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);

  // --- CHECK AUTHENTICATION ON MOUNT ---
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

  // --- FETCH DATA ---
  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: cData } = await supabase.from('categories').select('*').order('name', { ascending: true });
      if (cData) setCategories(cData);

      const { data: pData } = await supabase.from('products').select('*').order('created_at', { ascending: false });
      if (pData) setProducts(pData);

      const { data: oData } = await supabase.from('orders').select('*').is('address', null).order('created_at', { ascending: false });
      if (oData) setOrders(oData);
    } catch (err) {
      console.error("Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
      const channel = supabase.channel('staff-updates')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, fetchData)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, fetchData)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchData)
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [isAuthenticated]);

  // --- AUTHENTICATION ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError('');
    try {
      const { data: settingsData } = await supabase.from('store_settings').select('staff_password').eq('id', 1).single();
      const dbPassword = settingsData?.staff_password || 'staff123';
      const masterKey = import.meta.env.VITE_MASTER_RECOVERY_KEY;
      setTimeout(() => {
        if (passwordInput === dbPassword || passwordInput === masterKey) {
          localStorage.setItem('staff_session', 'authenticated');
          localStorage.setItem('staff_session_time', new Date().getTime().toString());
          setIsAuthenticated(true);
          setPasswordInput('');
        } else {
          setLoginError('Incorrect staff code. Please try again.');
          setPasswordInput('');
        }
        setIsLoggingIn(false);
      }, 500);
    } catch (error) {
      setLoginError('Login failed. Please try again.');
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    if (confirm('Are you sure you want to logout?')) {
      localStorage.removeItem('staff_session');
      localStorage.removeItem('staff_session_time');
      setIsAuthenticated(false);
    }
  };

  // --- CATEGORY ACTIONS ---
  const handleAddCategory = async () => {
    if (!newCategoryName) return;
    const { error } = await supabase.from('categories').insert([{ name: newCategoryName.toUpperCase() }]);
    if (!error) { setNewCategoryName(''); fetchData(); alert('Category added successfully!'); }
  };

  const deleteCategory = async (id: number) => {
    if (!confirm("Delete category? Products using this category will need reassignment.")) return;
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) alert("Error: Category may still be in use by products.");
    else { fetchData(); alert('Category deleted!'); }
  };

  // --- PRODUCT ACTIONS ---
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
    const { error: dbError } = await supabase.from('products').update({ image: publicUrl }).eq('id', id);
    if (!dbError) fetchData();
  };

  const handleAddProduct = async () => {
    if (!newName || !newPrice || !newCategory) { alert("Please fill in product name, price, and category"); return; }
    const { error } = await supabase.from('products').insert([{
      name: newName.toUpperCase(),
      price: parseFloat(newPrice),
      category: newCategory,
      image: newProduct.image_url || 'https://via.placeholder.com/400',
      stock: parseInt(newStock) || 10
    }]);
    if (error) { alert("Failed to add product: " + error.message); }
    else {
      setNewName(''); setNewPrice(''); setNewCategory(''); setNewStock('10');
      setNewProduct({ name: '', price: '', image_url: '', category: '', stock: '10' });
      fetchData(); alert("Product added successfully!");
    }
  };

  const deleteProduct = async (id: number) => {
    if (!confirm("Delete this product?")) return;
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) alert("Delete failed: " + error.message);
    else { fetchData(); alert("Product deleted!"); }
  };

  // --- ORDER STATUS UPDATE ---
  const updateStatus = async (orderId: number, newStatus: string) => {
    const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
    if (!error) fetchData();
  };

  const filteredOrders = orders.filter(o => orderFilter === 'ALL' || o.status === orderFilter);
  const pendingCount = orders.filter(o => o.status === 'PENDING').length;
  const preparingCount = orders.filter(o => o.status === 'PREPARING').length;
  const readyCount = orders.filter(o => o.status === 'READY').length;
  const doneCount = orders.filter(o => o.status === 'DONE').length;

  // --- LOGIN SCREEN ---
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-transparent pointer-events-none" />
        <div className="bg-zinc-950/80 backdrop-blur-xl border border-zinc-800 p-12 rounded-3xl shadow-2xl max-w-md w-full relative z-10 animate-in fade-in zoom-in duration-500">
          <div className="flex justify-center mb-8">
            <div className="bg-blue-500/10 p-4 rounded-2xl"><Users className="text-blue-500" size={40} /></div>
          </div>
          <div className="text-center mb-8">
            <h1 className="text-3xl font-black italic uppercase tracking-tighter text-white mb-2">Staff Portal</h1>
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Product & Order Management</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="text-xs font-black text-zinc-500 uppercase tracking-wider mb-2 block">Staff Code</label>
              <input type="password" value={passwordInput} onChange={(e) => { setPasswordInput(e.target.value); setLoginError(''); }} placeholder="Enter staff access code" className="w-full bg-black/50 border border-zinc-800 rounded-xl px-4 py-4 text-sm font-medium text-white placeholder:text-zinc-600 outline-none focus:border-blue-500 transition-all" disabled={isLoggingIn} autoFocus />
            </div>
            {loginError && <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3"><p className="text-red-500 text-xs font-bold text-center">{loginError}</p></div>}
            <button type="submit" disabled={!passwordInput || isLoggingIn} className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 text-white py-4 rounded-xl font-black uppercase text-sm tracking-widest transition-all active:scale-95 shadow-lg shadow-blue-500/20">
              {isLoggingIn ? <div className="flex items-center justify-center gap-2"><div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />Verifying...</div> : 'Access Portal'}
            </button>
          </form>
          <div className="mt-8 pt-6 border-t border-zinc-800">
            <p className="text-center text-zinc-600 text-[9px] font-medium uppercase tracking-widest">Staff Access Only</p>
          </div>
        </div>
      </div>
    );
  }

  // --- STAFF DASHBOARD ---
  return (
    <>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #18181b; border-radius: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #3f3f46; border-radius: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #3b82f6; }
      `}</style>

      <div className="min-h-screen bg-black text-white p-4 md:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto">

          {/* HEADER */}
          <header className="mb-8 border-b border-zinc-900 pb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="bg-blue-500/10 p-2 rounded-xl"><Users className="text-blue-500" size={22} /></div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-black italic uppercase tracking-tighter">Staff Portal</h1>
                  <p className="text-xs text-zinc-500 font-bold uppercase">Inventory & Order Management</p>
                </div>
              </div>
              <button onClick={handleLogout} className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 px-4 py-2 rounded-xl text-xs font-black uppercase hover:bg-red-600 hover:border-red-600 hover:text-white transition-all w-fit">
                <LogOut size={14} /> Logout
              </button>
            </div>
          </header>

          {/* STATS BAR */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <div className="bg-zinc-950 border border-zinc-900 p-4 rounded-xl text-center"><p className="text-2xl font-black text-orange-500">{pendingCount}</p><p className="text-[9px] font-black uppercase text-zinc-500 mt-1">Pending</p></div>
            <div className="bg-zinc-950 border border-zinc-900 p-4 rounded-xl text-center"><p className="text-2xl font-black text-yellow-500">{preparingCount}</p><p className="text-[9px] font-black uppercase text-zinc-500 mt-1">Preparing</p></div>
            <div className="bg-zinc-950 border border-zinc-900 p-4 rounded-xl text-center"><p className="text-2xl font-black text-blue-500">{readyCount}</p><p className="text-[9px] font-black uppercase text-zinc-500 mt-1">Ready</p></div>
            <div className="bg-zinc-950 border border-zinc-900 p-4 rounded-xl text-center"><p className="text-2xl font-black text-green-500">{doneCount}</p><p className="text-[9px] font-black uppercase text-zinc-500 mt-1">Done Today</p></div>
          </div>

          {/* VIEW TOGGLE */}
          <div className="flex gap-2 mb-6 border-b border-zinc-900">
            {[
              { id: 'products', label: '📦 Products' },
              { id: 'categories', label: '🏷️ Categories' },
              { id: 'orders', label: `📋 Pickup Orders${pendingCount > 0 ? ` (${pendingCount} new)` : ''}` },
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveView(tab.id as any)} className={`px-5 py-3 rounded-t-xl text-xs font-black uppercase transition-all whitespace-nowrap ${activeView === tab.id ? 'bg-zinc-950 border border-b-0 border-zinc-900 text-white' : 'text-zinc-600 hover:text-zinc-400'}`}>
                {tab.label}
              </button>
            ))}
          </div>

          {/* ==================== PRODUCTS VIEW ==================== */}
          {activeView === 'products' && (
            <div className="space-y-6">
              {/* ADD PRODUCT FORM */}
              <div className="bg-zinc-950 border border-zinc-900 rounded-2xl overflow-hidden">
                <div className="p-5 border-b border-zinc-900 bg-zinc-900/30">
                  <h2 className="text-sm font-black italic uppercase flex items-center gap-2"><PackagePlus size={16} className="text-blue-500" /> Add New Product</h2>
                </div>
                <div className="p-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                    <div>
                      <label className="text-[9px] font-black text-zinc-500 uppercase tracking-wider mb-1.5 block">Product Name</label>
                      <input placeholder="e.g. INDOMIE NOODLES" value={newName} onChange={e => setNewName(e.target.value)} className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-xs font-black uppercase outline-none focus:border-blue-500 transition-all" />
                    </div>
                    <div>
                      <label className="text-[9px] font-black text-zinc-500 uppercase tracking-wider mb-1.5 block">Price (₦)</label>
                      <input placeholder="e.g. 1500" type="number" value={newPrice} onChange={e => setNewPrice(e.target.value)} className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-xs font-black uppercase outline-none focus:border-blue-500 transition-all" />
                    </div>
                    <div>
                      <label className="text-[9px] font-black text-zinc-500 uppercase tracking-wider mb-1.5 block">Stock Quantity</label>
                      <input placeholder="e.g. 10" type="number" value={newStock} onChange={e => setNewStock(e.target.value)} className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-xs font-black uppercase outline-none focus:border-blue-500 transition-all" />
                    </div>
                    <div>
                      <label className="text-[9px] font-black text-zinc-500 uppercase tracking-wider mb-1.5 block">Category</label>
                      <select value={newCategory} onChange={e => setNewCategory(e.target.value)} className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-xs font-black uppercase appearance-none outline-none focus:border-blue-500 transition-all">
                        <option value="">Select Category...</option>
                        {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-[9px] font-black text-zinc-500 uppercase tracking-wider mb-1.5 block">Product Image</label>
                      <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" id="product-image" />
                      {newProduct.image_url ? (
                        <div className="flex items-center gap-3 bg-black/40 border border-green-500/30 rounded-xl p-3">
                          <img src={newProduct.image_url} className="w-16 h-16 object-cover rounded-lg border border-zinc-800" alt="Preview" />
                          <div className="flex-1"><p className="text-xs font-black text-green-500 uppercase mb-1">✓ Image Ready</p></div>
                          <label htmlFor="product-image" className="bg-zinc-800 hover:bg-zinc-700 text-white px-3 py-2 rounded-lg text-[9px] font-black uppercase cursor-pointer transition-all">Replace</label>
                        </div>
                      ) : (
                        <label htmlFor="product-image" className="w-full bg-black border border-dashed border-zinc-700 rounded-xl px-4 py-6 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-blue-500 hover:bg-zinc-950 transition-all group">
                          <Upload size={20} className="text-zinc-600 group-hover:text-blue-500 transition-colors" />
                          <p className="text-xs font-black uppercase text-zinc-500 group-hover:text-blue-400 transition-colors">Upload Product Image</p>
                        </label>
                      )}
                    </div>
                  </div>
                  <button onClick={handleAddProduct} className="w-full bg-blue-600 hover:bg-blue-500 py-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-blue-500/20">＋ Add Product to Inventory</button>
                </div>
              </div>

              {/* PRODUCTS GRID */}
              <div className="bg-zinc-950 border border-zinc-900 rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-zinc-900 bg-zinc-900/20 flex flex-col sm:flex-row gap-2">
                  <input type="text" placeholder="SEARCH PRODUCTS..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="flex-1 bg-black border border-zinc-800 rounded-lg px-4 py-2.5 text-xs font-black uppercase outline-none focus:border-blue-500 transition-all" />
                  <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 text-xs font-black uppercase outline-none text-zinc-400">
                    <option value="DEFAULT">SORT BY</option>
                    <option value="PRICE_LOW">PRICE: LOW → HIGH</option>
                    <option value="PRICE_HIGH">PRICE: HIGH → LOW</option>
                    <option value="STOCK_LOW">STOCK: LOW → HIGH</option>
                    <option value="CATEGORY">CATEGORY A-Z</option>
                  </select>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 max-h-[550px] overflow-y-auto custom-scrollbar">
                    {products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
                      .sort((a, b) => {
                        if (sortBy === 'PRICE_LOW') return a.price - b.price;
                        if (sortBy === 'PRICE_HIGH') return b.price - a.price;
                        if (sortBy === 'STOCK_LOW') return (a.stock || 0) - (b.stock || 0);
                        if (sortBy === 'CATEGORY') return (a.category || '').localeCompare(b.category || '');
                        return 0;
                      })
                      .map(p => {
                        const stock = p.stock || 0;
                        const isLowStock = stock > 0 && stock < 5;
                        const isSoldOut = stock <= 0;
                        return (
                          <div key={p.id} className={`bg-black/40 p-2 rounded-xl border flex flex-col gap-1.5 group hover:border-blue-500/50 transition-all ${isSoldOut ? 'border-red-900/50 opacity-70' : isLowStock ? 'border-yellow-900/50' : 'border-zinc-900'}`}>
                            <div className="relative aspect-square overflow-hidden rounded-lg group/img">
                              <img src={p.image || p.image_url || 'https://via.placeholder.com/400'} className="w-full h-full object-cover bg-zinc-900" alt={p.name} onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400?text=No+Image'; }} />
                              <div className={`absolute top-1.5 left-1.5 px-2 py-0.5 rounded-md text-[7px] font-black ${isSoldOut ? 'bg-red-600 text-white' : isLowStock ? 'bg-yellow-500 text-black' : 'bg-green-600 text-white'}`}>{isSoldOut ? 'SOLD OUT' : `${stock} LEFT`}</div>
                              <input type="file" accept="image/*" id={`replace-${p.id}`} className="hidden" onChange={(e) => handleReplaceProductImage(p.id, e)} />
                              <label htmlFor={`replace-${p.id}`} className="absolute inset-0 bg-black/80 opacity-0 group-hover/img:opacity-100 transition-all flex flex-col items-center justify-center cursor-pointer text-[8px] font-black gap-1"><Upload size={12} /> UPDATE IMG</label>
                            </div>
                            <div className="px-0.5">
                              <p className="text-[9px] font-black uppercase truncate leading-tight">{p.name}</p>
                              <p className="text-[9px] text-blue-400 font-bold">₦{p.price?.toLocaleString()}</p>
                              <p className="text-[8px] text-zinc-600 uppercase font-bold">{p.category}</p>
                            </div>
                            <button onClick={() => deleteProduct(p.id)} className="w-full flex items-center justify-center gap-1 py-1 bg-zinc-900 hover:bg-red-600 text-zinc-600 hover:text-white rounded-lg text-[8px] font-black uppercase transition-all active:scale-95">
                              <Trash2 size={9} /> Delete
                            </button>
                          </div>
                        );
                      })}
                    {products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 && (
                      <div className="col-span-full text-center py-16">
                        <PackagePlus size={32} className="text-zinc-800 mx-auto mb-3" />
                        <p className="text-zinc-600 text-xs font-black uppercase">No products found</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ==================== CATEGORIES VIEW ==================== */}
          {activeView === 'categories' && (
            <div className="space-y-6">
              <div className="bg-zinc-950 border border-zinc-900 p-6 rounded-2xl">
                <h2 className="text-sm font-black italic uppercase mb-4 flex items-center gap-2"><PlusCircle size={16} className="text-blue-500" /> Add New Category</h2>
                <div className="flex gap-3">
                  <input value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="CATEGORY NAME..." className="flex-1 bg-black border border-zinc-800 rounded-xl px-4 py-3 text-sm font-black uppercase outline-none focus:border-blue-500 transition-all" />
                  <button onClick={handleAddCategory} className="bg-blue-600 hover:bg-blue-500 px-8 py-3 rounded-xl flex items-center gap-2 font-black uppercase text-sm transition-all active:scale-95"><Save size={16} /> Add</button>
                </div>
              </div>
              <div className="bg-zinc-950 border border-zinc-900 p-6 rounded-2xl">
                <h3 className="text-xs font-black uppercase text-zinc-500 mb-4">All Categories ({categories.length})</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {categories.map(c => (
                    <div key={c.id} className="flex justify-between items-center bg-black/40 border border-zinc-900 px-4 py-3 rounded-xl group hover:border-blue-500/50 transition-all">
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
            </div>
          )}

          {/* ==================== ORDERS VIEW (PICKUP ONLY) ==================== */}
          {activeView === 'orders' && (
            <div className="space-y-6">
              {/* STATUS FILTER */}
              <div className="bg-zinc-950/50 border border-zinc-900 rounded-2xl p-4">
                <p className="text-[9px] font-black text-zinc-600 uppercase tracking-wider mb-3">Filter by Status</p>
                <div className="flex flex-wrap gap-2">
                  {['ALL', 'PENDING', 'PREPARING', 'READY', 'DONE'].map((status) => (
                    <button key={status} onClick={() => setOrderFilter(status)} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all active:scale-95 ${orderFilter === status ? status === 'ALL' ? 'bg-white text-black' : status === 'PENDING' ? 'bg-orange-500 text-black' : status === 'PREPARING' ? 'bg-yellow-500 text-black' : status === 'READY' ? 'bg-blue-500 text-white' : 'bg-green-500 text-black' : 'bg-zinc-900/50 text-zinc-600 hover:bg-zinc-800 hover:text-zinc-400'}`}>
                      {status} {status !== 'ALL' && `(${orders.filter(o => o.status === status).length})`}
                    </button>
                  ))}
                </div>
              </div>

              {/* ORDERS LIST */}
              <div className="bg-zinc-950 border border-zinc-900 rounded-2xl overflow-hidden">
                <div className="p-5 border-b border-zinc-900 bg-zinc-900/20 flex items-center gap-2">
                  <ShoppingBag size={14} className="text-blue-500" />
                  <h2 className="text-xs font-black uppercase tracking-widest">📦 Pickup Orders Only</h2>
                  <span className="ml-auto text-[9px] font-black text-zinc-600 bg-zinc-900 px-2 py-1 rounded-lg uppercase">{filteredOrders.length} Order{filteredOrders.length !== 1 ? 's' : ''}</span>
                </div>

                <div className="divide-y divide-zinc-900 max-h-[600px] overflow-y-auto custom-scrollbar">
                  {filteredOrders.length === 0 ? (
                    <div className="p-16 text-center">
                      <ShoppingBag size={36} className="text-zinc-800 mx-auto mb-3" />
                      <p className="text-xs font-black uppercase text-zinc-600">No pickup orders found</p>
                    </div>
                  ) : (
                    filteredOrders.map(order => {
                      const isExpanded = expandedOrderId === order.id;
                      return (
                        <div key={order.id} className="hover:bg-white/[0.02] transition-colors">
                          {/* ORDER HEADER ROW */}
                          <div className="p-4 flex items-center gap-3 cursor-pointer select-none" onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}>
                            <div className="bg-black border border-zinc-800 px-2.5 py-1.5 rounded-lg flex-shrink-0">
                              <p className="text-xs font-black"># {order.id}</p>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-black italic uppercase truncate">{order.customer_name}</p>
                              {/* ✅ Full date/time clearly displayed */}
                              <p className="text-xs font-bold text-orange-400 mt-0.5 flex items-center gap-1">
                                <Clock size={9} className="text-orange-500" />
                                {formatOrderDateTime(order.created_at)}
                              </p>
                              {order.phone_number && <span className="text-xs text-green-500 font-bold">📞 {order.phone_number}</span>}
                            </div>
                            <select value={order.status} onClick={e => e.stopPropagation()} onChange={(e) => updateStatus(order.id, e.target.value)} className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase border-none outline-none flex-shrink-0 ${order.status === 'DONE' ? 'bg-green-600/20 text-green-500' : order.status === 'READY' ? 'bg-blue-600/20 text-blue-500' : order.status === 'PREPARING' ? 'bg-yellow-600/20 text-yellow-500' : 'bg-orange-600/20 text-orange-500'}`}>
                              <option value="PENDING">PENDING</option>
                              <option value="PREPARING">PREPARING</option>
                              <option value="READY">READY</option>
                              <option value="DONE">DONE</option>
                            </select>
                            <p className="text-base font-black italic text-orange-500 flex-shrink-0">₦{order.total_price?.toLocaleString()}</p>
                            <div className="text-zinc-600 flex-shrink-0">{isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</div>
                          </div>

                          {/* EXPANDED ORDER DETAILS */}
                          {isExpanded && (
                            <div className="px-4 pb-4 animate-in slide-in-from-top-2 fade-in duration-200">
                              <div className="bg-black/40 border border-zinc-900 p-4 rounded-xl">
                                <p className="text-[9px] font-black uppercase text-zinc-600 mb-3 tracking-wider">Items Ordered</p>
                                <div className="space-y-1.5 mb-4">
                                  {order.items?.split(', ').map((item: string, idx: number) => (
                                    <div key={idx} className="flex items-center gap-2 text-xs">
                                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0" />
                                      <span className="font-medium">{item}</span>
                                    </div>
                                  ))}
                                </div>
                                {order.discount_code && (
                                  <div className="bg-purple-500/10 border border-purple-500/20 p-2 rounded-lg mb-3">
                                    <p className="text-xs text-purple-400 font-bold">🎉 Discount: {order.discount_code} (-₦{order.discount_amount?.toFixed(0) || 0})</p>
                                  </div>
                                )}
                                <div className="flex justify-between items-center pt-3 border-t border-zinc-900">
                                  <span className="text-xs font-black uppercase text-zinc-500">Total Paid</span>
                                  <span className="text-lg font-black italic text-orange-500">₦{order.total_price?.toLocaleString()}</span>
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

        </div>
      </div>
    </>
  );
}