import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { 
  Users, PlusCircle, Save, Trash2, Upload, X, PackagePlus, LogOut
} from 'lucide-react';

export default function Staff() {
  // --- AUTHENTICATION STATE ---
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // --- DATA STATE ---
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // --- FORM STATE ---
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: '',
    image_url: '',
    category: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [activeView, setActiveView] = useState<'products' | 'categories'>('products');

  // --- CHECK AUTHENTICATION ON MOUNT ---
  useEffect(() => {
    const session = localStorage.getItem('staff_session');
    const sessionTime = localStorage.getItem('staff_session_time');

    if (session && sessionTime) {
      const now = new Date().getTime();
      const sessionAge = now - parseInt(sessionTime);

      // Session expires after 12 hours
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
      const { data: settingsData } = await supabase
        .from('store_settings')
        .select('staff_password')
        .eq('id', 1)
        .single();

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
      console.error('Login error:', error);
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
    if (!error) { 
      setNewCategoryName(''); 
      fetchData();
      alert('Category added successfully!');
    }
  };

  const deleteCategory = async (id: number) => {
    if (!confirm("Delete category? Products using this category will need reassignment.")) return;
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) alert("Error: Category may still be in use by products.");
    else {
      fetchData();
      alert('Category deleted!');
    }
  };

  // --- PRODUCT ACTIONS ---
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { data, error } = await supabase.storage
      .from('stock-images')
      .upload(filePath, file);

    if (error) {
      alert("Upload failed: " + error.message);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('stock-images')
      .getPublicUrl(filePath);

    setNewProduct((prev: any) => ({ ...prev, image_url: publicUrl }));
    alert("Image uploaded successfully!");
  };

  const handleAddProduct = async () => {
    if (!newName || !newPrice || !newCategory) {
      alert("Please fill in product name, price, and category");
      return;
    }

    const { error } = await supabase.from('products').insert([{
      name: newName.toUpperCase(),
      price: parseFloat(newPrice),
      category: newCategory,
      image: newProduct.image_url || 'https://via.placeholder.com/400'
    }]);

    if (error) {
      console.error("Error:", error);
      alert("Failed to add product: " + error.message);
    } else {
      setNewName(''); 
      setNewPrice(''); 
      setNewCategory('');
      setNewProduct({ name: '', price: '', image_url: '', category: '' });
      fetchData();
      alert("Product added successfully!");
    }
  };

  const deleteProduct = async (id: number) => {
    if (!confirm("Delete this product?")) return;

    const { error } = await supabase.from('products').delete().eq('id', id);

    if (error) {
      alert("Delete failed: " + error.message);
    } else {
      fetchData();
      alert("Product deleted!");
    }
  };

  // --- LOGIN SCREEN ---
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-transparent pointer-events-none" />

        <div className="bg-zinc-950/80 backdrop-blur-xl border border-zinc-800 p-12 rounded-3xl shadow-2xl max-w-md w-full relative z-10 animate-in fade-in zoom-in duration-500">
          <div className="flex justify-center mb-8">
            <div className="bg-blue-500/10 p-4 rounded-2xl">
              <Users className="text-blue-500" size={40} />
            </div>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-3xl font-black italic uppercase tracking-tighter text-white mb-2">
              Staff Portal
            </h1>
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">
              Product & Category Management
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="text-xs font-black text-zinc-500 uppercase tracking-wider mb-2 block">
                Staff Code
              </label>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => {
                  setPasswordInput(e.target.value);
                  setLoginError('');
                }}
                placeholder="Enter staff access code"
                className="w-full bg-black/50 backdrop-blur-sm border border-zinc-800 rounded-xl px-4 py-4 text-sm font-medium text-white placeholder:text-zinc-600 outline-none focus:border-blue-500 transition-all"
                disabled={isLoggingIn}
                autoFocus
              />
            </div>

            {loginError && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3">
                <p className="text-red-500 text-xs font-bold text-center">{loginError}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={!passwordInput || isLoggingIn}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 text-white py-4 rounded-xl font-black uppercase text-sm tracking-widest transition-all active:scale-95 shadow-lg shadow-blue-500/20"
            >
              {isLoggingIn ? 'Verifying...' : 'Access Portal'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-zinc-800">
            <p className="text-center text-zinc-600 text-[9px] font-medium uppercase tracking-widest">
              Staff Access Only
            </p>
          </div>
        </div>
      </div>
    );
  }

  // --- STAFF DASHBOARD ---
  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        {/* HEADER */}
        <header className="mb-8 border-b border-zinc-900 pb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <Users className="text-blue-500" size={28} />
              <div>
                <h1 className="text-2xl md:text-3xl font-black italic uppercase tracking-tighter">Staff Portal</h1>
                <p className="text-xs text-zinc-500 font-bold uppercase">Inventory Management</p>
              </div>
            </div>

            <button 
              onClick={handleLogout} 
              className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 px-4 py-2 rounded-xl text-xs font-black uppercase hover:bg-red-600 hover:border-red-600 hover:text-white transition-all"
            >
              <LogOut size={14} /> Logout
            </button>
          </div>
        </header>

        {/* VIEW TOGGLE */}
        <div className="flex gap-2 mb-6 border-b border-zinc-900">
          <button
            onClick={() => setActiveView('products')}
            className={`px-6 py-3 rounded-t-xl text-sm font-black uppercase transition-all ${
              activeView === 'products'
                ? 'bg-zinc-950 border border-b-0 border-zinc-900 text-white'
                : 'text-zinc-600 hover:text-zinc-400'
            }`}
          >
            📦 Products
          </button>
          <button
            onClick={() => setActiveView('categories')}
            className={`px-6 py-3 rounded-t-xl text-sm font-black uppercase transition-all ${
              activeView === 'categories'
                ? 'bg-zinc-950 border border-b-0 border-zinc-900 text-white'
                : 'text-zinc-600 hover:text-zinc-400'
            }`}
          >
            🏷️ Categories
          </button>
        </div>

        {/* PRODUCTS VIEW */}
        {activeView === 'products' && (
          <div className="space-y-6">
            {/* ADD PRODUCT FORM */}
            <div className="bg-zinc-950 border border-zinc-900 p-6 rounded-2xl">
              <h2 className="text-lg font-black italic uppercase mb-4 flex items-center gap-2">
                <PackagePlus size={18} className="text-blue-500"/> Add New Product
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <input 
                  placeholder="PRODUCT NAME" 
                  value={newName} 
                  onChange={e => setNewName(e.target.value)} 
                  className="bg-black border border-zinc-800 rounded-xl px-4 py-3 text-sm font-black uppercase outline-none focus:border-blue-500" 
                />
                <input 
                  placeholder="PRICE (₦)" 
                  type="number" 
                  value={newPrice} 
                  onChange={e => setNewPrice(e.target.value)} 
                  className="bg-black border border-zinc-800 rounded-xl px-4 py-3 text-sm font-black uppercase outline-none focus:border-blue-500" 
                />
                <select 
                  value={newCategory} 
                  onChange={e => setNewCategory(e.target.value)} 
                  className="bg-black border border-zinc-800 rounded-xl px-4 py-3 text-sm font-black uppercase"
                >
                  <option value="">SELECT CATEGORY</option>
                  {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>

                <div className="relative">
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" id="product-image" />
                  <label htmlFor="product-image" className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm font-black uppercase flex items-center justify-center gap-2 cursor-pointer hover:bg-zinc-800">
                    <Upload size={14} />
                    {newProduct.image_url ? 'IMAGE UPLOADED ✓' : 'UPLOAD IMAGE'}
                  </label>
                </div>
              </div>

              <button 
                onClick={handleAddProduct} 
                className="w-full bg-blue-600 hover:bg-blue-500 py-4 rounded-xl text-sm font-black uppercase tracking-widest transition-all active:scale-95"
              >
                Add Product to Inventory
              </button>
            </div>

            {/* PRODUCTS LIST */}
            <div className="bg-zinc-950 border border-zinc-900 rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-zinc-900 bg-zinc-900/20">
                <input 
                  type="text"
                  placeholder="SEARCH PRODUCTS..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-xs font-black uppercase outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 p-4 max-h-[500px] overflow-y-auto">
                {products
                  .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map(p => (
                    <div key={p.id} className="bg-black/40 border border-zinc-900 p-3 rounded-xl group hover:border-blue-500/50 transition-all">
                      <div className="aspect-square rounded-lg overflow-hidden mb-3">
                        <img 
                          src={p.image || 'https://via.placeholder.com/400'} 
                          className="w-full h-full object-cover"
                          alt={p.name}
                        />
                      </div>
                      <p className="text-xs font-black uppercase truncate mb-2">{p.name}</p>
                      <div className="flex justify-between items-center">
                        <p className="text-sm text-blue-500 font-bold">₦{p.price.toLocaleString()}</p>
                        <button 
                          onClick={() => deleteProduct(p.id)} 
                          className="text-zinc-600 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* CATEGORIES VIEW */}
        {activeView === 'categories' && (
          <div className="space-y-6">
            {/* ADD CATEGORY FORM */}
            <div className="bg-zinc-950 border border-zinc-900 p-6 rounded-2xl">
              <h2 className="text-lg font-black italic uppercase mb-4 flex items-center gap-2">
                <PlusCircle size={18} className="text-blue-500"/> Add New Category
              </h2>

              <div className="flex gap-3">
                <input 
                  value={newCategoryName} 
                  onChange={(e) => setNewCategoryName(e.target.value)} 
                  placeholder="CATEGORY NAME..." 
                  className="flex-1 bg-black border border-zinc-800 rounded-xl px-4 py-3 text-sm font-black uppercase outline-none focus:border-blue-500" 
                />
                <button 
                  onClick={handleAddCategory} 
                  className="bg-blue-600 hover:bg-blue-500 px-8 py-3 rounded-xl flex items-center gap-2 font-black uppercase text-sm transition-all active:scale-95"
                >
                  <Save size={16} /> Add
                </button>
              </div>
            </div>

            {/* CATEGORIES LIST */}
            <div className="bg-zinc-950 border border-zinc-900 p-6 rounded-2xl">
              <h3 className="text-sm font-black uppercase mb-4 text-zinc-500">All Categories</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {categories.map(c => (
                  <div key={c.id} className="flex justify-between items-center bg-black/40 border border-zinc-900 px-4 py-3 rounded-xl group hover:border-blue-500/50 transition-all">
                    <span className="text-sm font-black uppercase">{c.name}</span>
                    <button 
                      onClick={() => deleteCategory(c.id)} 
                      className="text-zinc-600 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}