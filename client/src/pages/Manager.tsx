import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { 
  Trash2, LayoutDashboard, PlusCircle, 
  Save, Clock, MapPin, Calendar, PackagePlus, Edit3, DollarSign, ShoppingBag, AlertTriangle, Download, Upload, ChevronUp, X, Filter, Package
} from 'lucide-react';
import SettingsTab from '../components/SettingsTab';

export default function Manager() {
  // --- 0. AUTHENTICATION STATE ---
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // --- 1. STATE ---
  const [activeTab, setActiveTab] = useState<'dashboard' | 'settings'>('dashboard');
  const [orders, setOrders] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [msgs, setMsgs] = useState<any[]>([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newImage, setNewImage] = useState('');
  const [newStock, setNewStock] = useState('10');
  const [showAddresses, setShowAddresses] = useState(false);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('ALL_TIME');
  const [orderTypeFilter, setOrderTypeFilter] = useState<'PICKUP' | 'DELIVERY' | 'ALL'>('PICKUP');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('DEFAULT');
  const [showInventory, setShowInventory] = useState(false);
  const [showCategoryBreakdown, setShowCategoryBreakdown] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: '',
    image_url: '',
    category: '',
    stock: '10'
  });
  const [deliveryFeePerKm, setDeliveryFeePerKm] = useState('150');
  const [isSavingFee, setIsSavingFee] = useState(false);

  // ✅ NEW: Edit Modal State
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // --- 2. ANALYTICS ---
  const filteredOrders = orders.filter(order => {
    const matchesStatus = filterStatus === 'ALL' || order.status === filterStatus;
    const orderDate = new Date(order.created_at);
    const now = new Date();
    let matchesDate = true;

    if (dateFilter === '24H') {
      matchesDate = (now.getTime() - orderDate.getTime()) <= 24 * 60 * 60 * 1000;
    } else if (dateFilter === 'WEEK') {
      matchesDate = (now.getTime() - orderDate.getTime()) <= 7 * 24 * 60 * 60 * 1000;
    } else if (dateFilter === 'MONTH') {
      matchesDate = (now.getTime() - orderDate.getTime()) <= 30 * 24 * 60 * 60 * 1000;
    } else if (dateFilter === 'YEAR') {
      matchesDate = (now.getTime() - orderDate.getTime()) <= 365 * 24 * 60 * 60 * 1000;
    }

    // Order type filtering
    let matchesOrderType = true;
    if (orderTypeFilter === 'PICKUP') {
      matchesOrderType = !order.address || order.address === null;
    } else if (orderTypeFilter === 'DELIVERY') {
      matchesOrderType = order.address && order.address !== null;
    }

    return matchesStatus && matchesDate && matchesOrderType;
  });

  const totalRevenue = filteredOrders.reduce((sum, order) => sum + (order.total_price || 0), 0);

  // Calculate total stock value (price × stock for all products)
  const totalStockValue = products.reduce((sum, product) => {
    const stock = product.stock || 0;
    const price = product.price || 0;
    return sum + (stock * price);
  }, 0);

  // Calculate total items in stock
  const totalStockItems = products.reduce((sum, product) => sum + (product.stock || 0), 0);

  // Calculate stock value by category
  const stockByCategory = categories.map(category => {
    const categoryProducts = products.filter(p => p.category === category.name);
    const totalValue = categoryProducts.reduce((sum, p) => sum + ((p.stock || 0) * (p.price || 0)), 0);
    const totalItems = categoryProducts.reduce((sum, p) => sum + (p.stock || 0), 0);
    const productCount = categoryProducts.length;

    return {
      name: category.name,
      totalValue,
      totalItems,
      productCount
    };
  }).sort((a, b) => b.totalValue - a.totalValue); // Sort by value descending

  // --- 3. DATA FETCH ---
  const fetchManagerData = async () => {
    console.log("🔄 Fetching manager data...");
    setLoading(true);
    try {
      const { data: oData } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
      if (oData) setOrders(oData);

      const { data: mData } = await supabase.from('messages').select('*').order('created_at', { ascending: false });
      if (mData) setMsgs(mData);

      const { data: cData } = await supabase.from('categories').select('*').order('name', { ascending: true });
      if (cData) setCategories(cData);

      const { data: pData } = await supabase.from('products').select('*').order('created_at', { ascending: false });
      if (pData) {
        console.log("✅ Products fetched:", pData.length);
        setProducts(pData);
      }

      const { data: sData } = await supabase.from('store_settings').select('delivery_fee_per_km').eq('id', 1).single();
      if (sData) setDeliveryFeePerKm(String(sData.delivery_fee_per_km || 150));
    } catch (err) {
      console.error("❌ Sync Error:", err);
    } finally {
      setLoading(false);
      console.log("✅ Manager data fetch complete");
    }
  };

  // --- CHECK AUTHENTICATION ON MOUNT ---
  useEffect(() => {
    const session = localStorage.getItem('manager_session');
    const sessionTime = localStorage.getItem('manager_session_time');

    if (session && sessionTime) {
      const now = new Date().getTime();
      const sessionAge = now - parseInt(sessionTime);

      // Session expires after 24 hours
      if (sessionAge < 24 * 60 * 60 * 1000) {
        setIsAuthenticated(true);
      } else {
        localStorage.removeItem('manager_session');
        localStorage.removeItem('manager_session_time');
      }
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchManagerData();
      const channel = supabase.channel('manager-stable-view')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchManagerData)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, fetchManagerData)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, fetchManagerData)
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [isAuthenticated]);

  // --- AUTHENTICATION HANDLERS ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError('');

    try {
      // Fetch password from database
      const { data: settingsData } = await supabase
        .from('store_settings')
        .select('manager_password')
        .eq('id', 1)
        .single();

      const dbPassword = settingsData?.manager_password;
      const masterKey = import.meta.env.VITE_MASTER_RECOVERY_KEY;

      setTimeout(() => {
        // Check database password OR master key
        if (passwordInput === dbPassword || passwordInput === masterKey) {
          localStorage.setItem('manager_session', 'authenticated');
          localStorage.setItem('manager_session_time', new Date().getTime().toString());
          setIsAuthenticated(true);
          setPasswordInput('');
        } else {
          setLoginError('Incorrect password. Please try again.');
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
      localStorage.removeItem('manager_session');
      localStorage.removeItem('manager_session_time');
      setIsAuthenticated(false);
    }
  };

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

  // --- DELIVERY FEE UPDATE ---
  const handleUpdateDeliveryFee = async () => {
    setIsSavingFee(true);
    try {
      const { error } = await supabase
        .from('store_settings')
        .update({ delivery_fee_per_km: parseFloat(deliveryFeePerKm) })
        .eq('id', 1);

      if (error) throw error;
      alert('Delivery fee updated successfully!');
    } catch (err) {
      console.error('Error updating delivery fee:', err);
      alert('Failed to update delivery fee');
    } finally {
      setIsSavingFee(false);
    }
  };

  // --- 4. ACTIONS ---
  const handleAddCategory = async () => {
    if (!newCategoryName) return;
    const { error } = await supabase.from('categories').insert([{ name: newCategoryName.toUpperCase() }]);
    if (!error) { setNewCategoryName(''); fetchManagerData(); }
  };

  const deleteCategory = async (id: number) => {
    if (!confirm("Delete category?")) return;
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) alert("Error: Category is still in use.");
    else fetchManagerData();
  };

  const handleAddProduct = async () => {
    if (!newName || !newPrice || !newCategory) {
      alert("Please fill in all fields");
      return;
    }

    const { error } = await supabase.from('products').insert([{
      name: newName.toUpperCase(),
      price: parseFloat(newPrice),
      category: newCategory,
      image: newProduct.image_url,
      stock: parseInt(newStock) || 10
    }]);

    if (error) {
      console.error("Supabase Error:", error);
      alert("Upload failed: " + error.message);
    } else {
      setNewName(''); 
      setNewPrice(''); 
      setNewCategory('');
      setNewStock('10');
      setNewProduct({ name: '', price: '', image_url: '', category: '', stock: '10' });
      alert("Product added successfully!");
      fetchManagerData();
    }
  };

  // ✅ FIXED: Open Edit Modal with product data
  const openEditModal = (product: any) => {
    setEditingProduct({
      id: product.id,
      name: product.name,
      price: String(product.price),
      stock: String(product.stock || 0),
      category: product.category,
      image_url: product.image || product.image_url || ''
    });
    setShowEditModal(true);
  };

  // ✅ FIXED: Handle Edit Form Changes with proper spread operator
  const handleEditChange = (field: string, value: string) => {
    setEditingProduct((prev: any) => ({
      ...prev,  // ✅ Preserve all existing fields
      [field]: value
    }));
  };

  // ✅ FIXED: Save edited product with proper type conversion
  const handleSaveEdit = async () => {
    if (!editingProduct) return;

    // Validate inputs
    if (!editingProduct.name || !editingProduct.price || !editingProduct.category) {
      alert("Please fill in all required fields (Name, Price, Category)");
      return;
    }

    const priceValue = parseFloat(editingProduct.price);
    const stockValue = parseInt(editingProduct.stock);

    if (isNaN(priceValue) || priceValue < 0) {
      alert("Please enter a valid price");
      return;
    }

    if (isNaN(stockValue) || stockValue < 0) {
      alert("Please enter a valid stock quantity");
      return;
    }

    console.log("🔄 Updating product:", {
      id: editingProduct.id,
      name: editingProduct.name,
      price: priceValue,
      stock: stockValue,
      category: editingProduct.category
    });

    try {
      // First, verify the product exists
      const { data: existingProduct, error: checkError } = await supabase
        .from('products')
        .select('*')
        .eq('id', editingProduct.id)
        .single();

      if (checkError || !existingProduct) {
        console.error("❌ Product not found:", checkError);
        alert("Error: Product not found in database");
        return;
      }

      console.log("✅ Product exists:", existingProduct);

      // Now update it
      const { data, error } = await supabase
        .from('products')
        .update({
          name: editingProduct.name.toUpperCase(),
          price: priceValue,
          stock: stockValue,
          category: editingProduct.category,
          image: editingProduct.image_url
        })
        .eq('id', editingProduct.id)
        .select()
        .single(); // ✅ Return updated data

      if (error) {
        console.error("❌ Update Error:", error);
        alert("Update failed: " + error.message + "\n\nCheck console for details.");
        return;
      }

      console.log("✅ Update successful, returned data:", data);

      // ✅ Immediately update local state for instant UI feedback
      setProducts(prevProducts => 
        prevProducts.map(p => 
          p.id === editingProduct.id 
            ? { ...p, name: editingProduct.name.toUpperCase(), price: priceValue, stock: stockValue, category: editingProduct.category, image: editingProduct.image_url }
            : p
        )
      );

      alert("✅ Product updated successfully!");
      setShowEditModal(false);
      setEditingProduct(null);

      // Fetch fresh data from database
      console.log("🔄 Fetching fresh data...");
      await fetchManagerData();

    } catch (err) {
      console.error("❌ Unexpected error:", err);
      alert("An unexpected error occurred. Please check console and try again.");
    }
  };

  const updatePrice = async (id: number) => {
    const p = prompt("Enter new price:");
    if (p && !isNaN(parseFloat(p))) {
      const { error } = await supabase.from('products').update({ price: parseFloat(p) }).eq('id', id);
      if (!error) fetchManagerData();
    }
  };

  const updateStock = async (id: number) => {
    const s = prompt("Enter new stock quantity:");
    if (s && !isNaN(parseInt(s))) {
      const { error } = await supabase.from('products').update({ stock: parseInt(s) }).eq('id', id);
      if (!error) fetchManagerData();
    }
  };

  const deleteProduct = async (id: number) => {
    if (!id) {
      alert("Error: This product has no ID. Refresh the page and try again.");
      return;
    }

    if (!confirm("Delete product?")) return;

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) {
      console.error("Delete Error:", error);
      alert("Delete failed: " + error.message);
    } else {
      alert("Product deleted successfully!");
      fetchManagerData();
    }
  };

  const updateStatus = async (orderId: number, newStatus: string) => {
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId);
    if (!error) fetchManagerData();
  };

  const handleDeleteAllOrders = async () => {
    if (confirm("THIS WILL WIPE ALL ORDERS. ARE YOU SURE?")) {
      await supabase.from('orders').delete().neq('id', 0);
      fetchManagerData();
    }
  };

  const handleClearMessages = async () => {
    if (confirm("Are you sure you want to delete ALL support messages?")) {
      await supabase.from('messages').delete().neq('id', 0);
      fetchManagerData();
    }
  };

  const exportCSV = () => {
    const headers = "Date,Customer,Phone,Items,Total,Address\n";
    const rows = orders.map(o => `${o.created_at},${o.customer_name},"${o.phone_number || 'N/A'}","${o.items}",${o.total_price},"${o.address || 'PICKUP'}"`).join("\n");
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales_report_${new Date().toLocaleDateString()}.csv`;
    a.click();
  };

  const handleReplaceImageUrl = async (id: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const fileName = `${Date.now()}-${file.name}`;
    const { data, error: uploadError } = await supabase.storage
      .from('stock-images')
      .upload(fileName, file);

    if (uploadError) return alert(uploadError.message);

    const { data: { publicUrl } } = supabase.storage
      .from('stock-images')
      .getPublicUrl(fileName);

    const { error: dbError } = await supabase
      .from('products') 
      .update({ image: publicUrl })
      .eq('id', id);

    if (!dbError) fetchManagerData(); 
  };

  const formatTime = (ts: string) => {
    const d = new Date(ts);
    return {
      t: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      day: d.toLocaleDateString([], { month: 'short', day: 'numeric' })
    };
  };

  // --- LOGIN SCREEN ---
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-20 left-20 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="bg-zinc-950/80 backdrop-blur-xl border border-zinc-800 p-12 rounded-3xl shadow-2xl max-w-md w-full relative z-10 animate-in fade-in zoom-in duration-500">
          {/* Logo/Icon */}
          <div className="flex justify-center mb-8">
            <div className="bg-orange-500/10 p-4 rounded-2xl">
              <LayoutDashboard className="text-orange-500" size={40} />
            </div>
          </div>

          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-black italic uppercase tracking-tighter text-white mb-2">
              Manager Access
            </h1>
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">
              Authorized Personnel Only
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="text-xs font-black text-zinc-500 uppercase tracking-wider mb-2 block">
                Password
              </label>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => {
                  setPasswordInput(e.target.value);
                  setLoginError('');
                }}
                placeholder="Enter manager password"
                className="w-full bg-black/50 backdrop-blur-sm border border-zinc-800 rounded-xl px-4 py-4 text-sm font-medium text-white placeholder:text-zinc-600 outline-none focus:border-orange-500 transition-all"
                disabled={isLoggingIn}
                autoFocus
              />
            </div>

            {/* Error Message */}
            {loginError && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 animate-in fade-in slide-in-from-top-2">
                <p className="text-red-500 text-xs font-bold text-center">{loginError}</p>
              </div>
            )}

            {/* Login Button */}
            <button
              type="submit"
              disabled={!passwordInput || isLoggingIn}
              className="w-full bg-orange-600 hover:bg-orange-500 disabled:bg-zinc-800 disabled:cursor-not-allowed text-white py-4 rounded-xl font-black uppercase text-sm tracking-widest transition-all active:scale-95 disabled:active:scale-100 shadow-lg shadow-orange-500/20 disabled:shadow-none"
            >
              {isLoggingIn ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  <span>Verifying...</span>
                </div>
              ) : (
                'Access Dashboard'
              )}
            </button>
          </form>

          {/* Footer Note */}
          <div className="mt-8 pt-6 border-t border-zinc-800">
            <p className="text-center text-zinc-600 text-[9px] font-medium uppercase tracking-widest">
              Secure Manager Portal
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
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
      `}</style>

      <div className="min-h-screen bg-black text-white p-4 md:p-6 lg:p-8 font-sans">
        <div className="max-w-7xl mx-auto">
          {/* HEADER */}
          <header className="mb-8 border-b border-zinc-900 pb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <LayoutDashboard className="text-orange-500" size={28} />
                <h1 className="text-2xl md:text-3xl font-black italic uppercase tracking-tighter">Inventory & Sales</h1>
              </div>

              <div className="flex flex-wrap gap-2">
                <button 
                  onClick={() => setShowAddresses(!showAddresses)}
                  className={`px-3 py-2 rounded-xl text-xs font-black uppercase transition-all ${
                    showAddresses ? 'bg-orange-500 text-black' : 'bg-zinc-900 text-zinc-500 hover:bg-zinc-800'
                  }`}
                >
                  {showAddresses ? 'Hide Addresses' : 'Show Addresses'}
                </button>

                <button onClick={handleDeleteAllOrders} className="flex items-center gap-2 bg-red-900/20 text-red-500 px-3 py-2 rounded-xl text-xs font-bold uppercase hover:bg-red-600 hover:text-white transition-all">
                  <AlertTriangle size={12} /> Clear Orders
                </button>

                <button onClick={handleClearMessages} className="flex items-center gap-2 bg-zinc-900 text-zinc-400 px-3 py-2 rounded-xl text-xs font-bold uppercase hover:bg-orange-500 hover:text-white transition-all">
                  <Trash2 size={12} /> Clear Messages
                </button>

                <button onClick={exportCSV} className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 px-3 py-2 rounded-xl text-xs font-black uppercase hover:bg-white hover:text-black transition-all">
                  <Download size={12} /> Export CSV
                </button>

                {/* LOGOUT BUTTON */}
                <button 
                  onClick={handleLogout} 
                  className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 px-3 py-2 rounded-xl text-xs font-black uppercase hover:bg-red-600 hover:border-red-600 hover:text-white transition-all"
                >
                  <X size={12} /> Logout
                </button>
              </div>
            </div>

            {/* TAB NAVIGATION */}
            <div className="flex gap-2 mb-6 border-b border-zinc-900">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`px-6 py-3 rounded-t-xl text-sm font-black uppercase transition-all ${
                  activeTab === 'dashboard'
                    ? 'bg-zinc-950 border border-b-0 border-zinc-900 text-white'
                    : 'text-zinc-600 hover:text-zinc-400'
                }`}
              >
                📊 Dashboard
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`px-6 py-3 rounded-t-xl text-sm font-black uppercase transition-all ${
                  activeTab === 'settings'
                    ? 'bg-zinc-950 border border-b-0 border-zinc-900 text-white'
                    : 'text-zinc-600 hover:text-zinc-400'
                }`}
              >
                ⚙️ Settings
              </button>
            </div>

            {/* CONDITIONAL CONTENT */}
            {activeTab === 'settings' ? (
              <div className="space-y-6">
                <SettingsTab onSettingsSaved={fetchManagerData} />

                {/* DELIVERY FEE SETTINGS */}
                <div className="bg-zinc-950 border border-zinc-900 p-6 rounded-2xl">
                  <h3 className="text-xs font-black uppercase text-orange-500 mb-4 flex items-center gap-2">
                    <DollarSign size={12}/> Delivery Fee Settings
                  </h3>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="text-xs font-bold text-zinc-500 uppercase mb-2 block">
                        Fee Per Kilometer (₦)
                      </label>
                      <input 
                        type="number"
                        value={deliveryFeePerKm} 
                        onChange={(e) => setDeliveryFeePerKm(e.target.value)} 
                        placeholder="150" 
                        className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-sm font-black uppercase outline-none focus:border-orange-500" 
                      />
                    </div>
                    <button 
                      onClick={handleUpdateDeliveryFee}
                      disabled={isSavingFee}
                      className="bg-orange-600 hover:bg-orange-500 disabled:bg-zinc-800 text-white px-6 rounded-xl text-xs font-black uppercase transition-all self-end"
                    >
                      {isSavingFee ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                  <p className="text-xs text-zinc-600 mt-3 italic">
                    This rate is used to calculate estimated delivery fees shown to customers during checkout.
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* FILTERS - REDESIGNED & Mobile Optimized */}
                <div className="bg-zinc-950/50 border border-zinc-900 rounded-2xl p-3 md:p-4 mb-6">
                  {/* ORDER TYPE FILTER - Primary */}
                  <div className="mb-3 md:mb-4 pb-3 md:pb-4 border-b border-zinc-800/50">
                    <div className="flex items-center gap-2 mb-2 md:mb-3">
                      <Filter size={12} className="text-orange-500 md:w-3.5 md:h-3.5" />
                      <span className="text-[9px] md:text-[10px] font-black text-zinc-600 uppercase tracking-wider">Order Type</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {['PICKUP', 'DELIVERY', 'ALL'].map((type) => (
                        <button
                          key={type}
                          onClick={() => setOrderTypeFilter(type as 'PICKUP' | 'DELIVERY' | 'ALL')}
                          className={`py-2.5 md:py-3 rounded-xl text-[10px] md:text-xs font-black transition-all active:scale-95 ${
                            orderTypeFilter === type 
                              ? 'bg-orange-500 text-black shadow-lg shadow-orange-500/20' 
                              : 'bg-zinc-900/50 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-400'
                          }`}
                        >
                          <span className="hidden sm:inline">{type === 'PICKUP' ? '📦 PICKUP' : type === 'DELIVERY' ? '🚚 DELIVERY' : '🔍 ALL'}</span>
                          <span className="sm:hidden">{type === 'PICKUP' ? '📦' : type === 'DELIVERY' ? '🚚' : '🔍'}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* STATUS & DATE - Secondary Filters */}
                  <div className="grid grid-cols-1 gap-3 md:gap-4">
                    {/* Status Filter */}
                    <div>
                      <span className="text-[9px] md:text-[10px] font-black text-zinc-600 uppercase tracking-wider mb-2 block">Status</span>
                      <div className="flex flex-wrap gap-1.5 md:gap-2">
                        {['ALL', 'PENDING', 'PREPARING', 'READY', 'DONE'].map((status) => (
                          <button
                            key={status}
                            onClick={() => setFilterStatus(status)}
                            className={`px-2.5 md:px-3 py-1.5 rounded-lg text-[9px] md:text-[10px] font-black transition-all active:scale-95 ${
                              filterStatus === status 
                                ? 'bg-white text-black' 
                                : 'bg-zinc-900/50 text-zinc-600 hover:bg-zinc-800 hover:text-zinc-400'
                            }`}
                          >
                            {status}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Date Filter */}
                    <div>
                      <span className="text-[9px] md:text-[10px] font-black text-zinc-600 uppercase tracking-wider mb-2 block">Time Period</span>
                      <div className="flex flex-wrap gap-1.5 md:gap-2">
                        {[
                          { id: '24H', label: '24H' },
                          { id: 'WEEK', label: 'WEEK' },
                          { id: 'MONTH', label: 'MONTH' },
                          { id: 'YEAR', label: 'YEAR' },
                          { id: 'ALL_TIME', label: 'ALL' }
                        ].map((range) => (
                          <button
                            key={range.id}
                            onClick={() => setDateFilter(range.id)}
                            className={`px-2.5 md:px-3 py-1.5 rounded-lg text-[9px] md:text-[10px] font-black transition-all active:scale-95 ${
                              dateFilter === range.id 
                                ? 'bg-white text-black' 
                                : 'bg-zinc-900/50 text-zinc-600 hover:bg-zinc-800 hover:text-zinc-400'
                            }`}
                          >
                            {range.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* STATS - Mobile Optimized */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                  <div className="bg-zinc-950 border border-zinc-900 p-4 md:p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between">
                    <div>
                      <p className="text-[10px] md:text-xs font-black text-zinc-500 uppercase mb-1">Revenue</p>
                      <p className="text-xl md:text-2xl lg:text-3xl font-black text-orange-500 italic">₦{(totalRevenue / 1000).toFixed(0)}K</p>
                    </div>
                    <DollarSign className="text-zinc-800 hidden md:block" size={36} />
                  </div>
                  <div className="bg-zinc-950 border border-zinc-900 p-4 md:p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between">
                    <div>
                      <p className="text-[10px] md:text-xs font-black text-zinc-500 uppercase mb-1">Orders</p>
                      <p className="text-xl md:text-2xl lg:text-3xl font-black text-white italic">{filteredOrders.length}</p>
                    </div>
                    <ShoppingBag className="text-zinc-800 hidden md:block" size={36} />
                  </div>
                  <div 
                    className="bg-zinc-950 border border-zinc-900 p-4 md:p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between cursor-pointer hover:border-green-500/30 transition-all group active:scale-95"
                    onClick={() => setShowCategoryBreakdown(!showCategoryBreakdown)}
                  >
                    <div>
                      <p className="text-[10px] md:text-xs font-black text-zinc-500 uppercase mb-1 group-hover:text-green-500 transition-colors">Stock</p>
                      <p className="text-xl md:text-2xl lg:text-3xl font-black text-green-500 italic">₦{(totalStockValue / 1000).toFixed(0)}K</p>
                      <p className="text-[8px] md:text-[9px] text-zinc-600 font-bold mt-1 uppercase">Tap for details</p>
                    </div>
                    <PackagePlus className="text-zinc-800 group-hover:text-green-500/20 transition-colors hidden md:block" size={36} />
                  </div>
                  <div className="bg-zinc-950 border border-zinc-900 p-4 md:p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between">
                    <div>
                      <p className="text-[10px] md:text-xs font-black text-zinc-500 uppercase mb-1">Items</p>
                      <p className="text-xl md:text-2xl lg:text-3xl font-black text-blue-500 italic">{totalStockItems}</p>
                    </div>
                    <Package className="text-zinc-800 hidden md:block" size={36} />
                  </div>
                </div>

                {/* CATEGORY BREAKDOWN - EXPANDABLE - Mobile Optimized */}
                {showCategoryBreakdown && (
                  <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-4 md:p-6 mb-6 animate-in slide-in-from-top-2 fade-in">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xs md:text-sm font-black uppercase text-green-500 flex items-center gap-2">
                        <PackagePlus size={14} className="md:w-4 md:h-4" /> Stock by Category
                      </h3>
                      <button 
                        onClick={() => setShowCategoryBreakdown(false)}
                        className="text-zinc-600 hover:text-white transition-colors p-2 active:scale-95"
                      >
                        <X size={18} />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {stockByCategory.map((cat, idx) => (
                        <div 
                          key={cat.name}
                          className="bg-black/40 border border-zinc-900 p-4 rounded-xl hover:border-green-500/30 transition-all active:scale-[0.98]"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <p className="text-xs md:text-sm font-black uppercase text-white mb-1 line-clamp-1">{cat.name}</p>
                              <p className="text-[9px] md:text-[10px] text-zinc-600 font-bold uppercase">{cat.productCount} Product{cat.productCount !== 1 ? 's' : ''}</p>
                            </div>
                            <div className="bg-green-500/10 px-2 py-1 rounded-lg flex-shrink-0 ml-2">
                              <p className="text-[9px] md:text-[10px] font-black text-green-500">#{idx + 1}</p>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-[9px] md:text-[10px] text-zinc-500 font-bold uppercase">Value</span>
                              <span className="text-base md:text-lg font-black text-green-500">₦{cat.totalValue.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center pt-2 border-t border-zinc-900">
                              <span className="text-[9px] md:text-[10px] text-zinc-500 font-bold uppercase">Stock</span>
                              <span className="text-sm md:text-base font-black text-blue-500">{cat.totalItems}</span>
                            </div>
                          </div>

                          {/* Progress bar showing percentage of total value */}
                          <div className="mt-3">
                            <div className="h-1.5 md:h-1 bg-zinc-900 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-green-500 to-green-400 transition-all duration-500"
                                style={{ width: `${totalStockValue > 0 ? (cat.totalValue / totalStockValue) * 100 : 0}%` }}
                              />
                            </div>
                            <p className="text-[8px] md:text-[9px] text-zinc-600 font-bold mt-1 text-right">
                              {totalStockValue > 0 ? ((cat.totalValue / totalStockValue) * 100).toFixed(1) : 0}% of total
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {stockByCategory.length === 0 && (
                      <div className="text-center py-8 md:py-12">
                        <PackagePlus size={40} className="text-zinc-800 mx-auto mb-3" />
                        <p className="text-zinc-600 text-xs font-bold uppercase">No categories with stock</p>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </header>

          {/* MAIN CONTENT - Only show if Dashboard tab is active */}
          {activeTab === 'dashboard' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* LEFT SIDEBAR */}
              <div className="lg:col-span-1 space-y-6">
                {/* CATEGORIES */}
                <section className="bg-zinc-950 border border-zinc-900 p-6 rounded-2xl">
                  <h2 className="text-xs font-black uppercase text-orange-500 mb-4 flex items-center gap-2">
                    <PlusCircle size={12}/> Categories
                  </h2>
                  <div className="flex gap-2 mb-4">
                    <input 
                      value={newCategoryName} 
                      onChange={(e) => setNewCategoryName(e.target.value)} 
                      placeholder="NAME..." 
                      className="flex-1 bg-black border border-zinc-800 rounded-xl px-3 py-2 text-xs font-black uppercase outline-none focus:border-orange-500" 
                    />
                    <button onClick={handleAddCategory} className="bg-white text-black p-2 rounded-xl">
                      <Save size={16} />
                    </button>
                  </div>
                  <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                    {categories.map(c => (
                      <div key={c.id} className="flex justify-between items-center bg-black/40 border border-zinc-900 px-3 py-2 rounded-xl">
                        <span className="text-xs font-black uppercase">{c.name}</span>
                        <button onClick={() => deleteCategory(c.id)} className="text-zinc-800 hover:text-red-500">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </section>

                {/* MESSAGES */}
                {msgs.map((m: any) => (
                  <div key={m.id} className="bg-zinc-950 border border-zinc-900 p-6 rounded-2xl group relative">
                    <button 
                      onClick={async () => {
                        if(confirm("Delete this message?")) {
                          await supabase.from('messages').delete().eq('id', m.id);
                          fetchManagerData();
                        }
                      }}
                      className="absolute top-4 right-4 text-zinc-700 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>

                    <div className="flex justify-between items-start mb-3">
                      <span className="text-xs font-black text-white bg-zinc-900 px-3 py-1 rounded-full uppercase italic">
                        {m.name}
                      </span>
                      <span className="text-zinc-600 text-xs font-bold mr-6">
                        {new Date(m.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <p className="text-xs text-zinc-500 mb-3 font-bold lowercase tracking-tight">
                      {m.email}
                    </p>

                    <div className="bg-black p-3 rounded-xl border border-zinc-900 group-hover:border-orange-500/30 transition-colors">
                      <p className="text-xs text-zinc-300 leading-relaxed italic font-medium">
                        "{m.message}"
                      </p>
                    </div>

                    <a 
                      href={`mailto:${m.email}?subject=Grandpa's Supermart Support`}
                      className="mt-3 inline-block text-xs font-black uppercase text-orange-500 hover:text-orange-400"
                    >
                      Reply to {m.name} →
                    </a>
                  </div>
                ))}

                {/* INVENTORY TOGGLE */}
                <button 
                  onClick={() => setShowInventory(!showInventory)}
                  className="w-full py-3 bg-zinc-900/50 border border-zinc-800 rounded-2xl flex items-center justify-center gap-3 hover:bg-orange-600/10 hover:border-orange-500/50 transition-all group"
                >
                  <div className={`p-1 rounded-full transition-colors ${showInventory ? 'bg-orange-500 text-black' : 'bg-zinc-800 text-zinc-500'}`}>
                    {showInventory ? <ChevronUp size={14} /> : <PackagePlus size={14} />}
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[0.15em]">
                    {showInventory ? "Hide Inventory" : "Manage Inventory"}
                  </span>
                </button>
              </div>

              {/* RIGHT CONTENT - ORDERS */}
              <div className="lg:col-span-2">
                <section className="bg-zinc-950 border border-zinc-900 rounded-2xl overflow-hidden">
                  <div className="p-6 border-b border-zinc-900 bg-zinc-900/20">
                    <h2 className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                      <Clock size={12} className="text-orange-500"/> Recent Sales ({orderTypeFilter})
                    </h2>
                  </div>
                  <div className="divide-y divide-zinc-900 max-h-[600px] overflow-y-auto custom-scrollbar">
                    {filteredOrders.length === 0 ? (
                      <div className="p-20 text-center opacity-20">
                        <p className="text-xs font-black uppercase tracking-widest">No orders found</p>
                      </div>
                    ) : (
                      filteredOrders.map(order => {
                        const time = formatTime(order.created_at);
                        const isPickup = !order.address || order.address === null;

                        return (
                          <div key={order.id} className="p-5 hover:bg-white/5 transition-colors group">
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-3">
                              <div className="flex items-center gap-3">
                                <div className="bg-black border border-zinc-800 px-2 py-1 rounded-lg">
                                  <p className="text-xs font-black uppercase tracking-tighter">#{order.id}</p>
                                </div>
                                <div>
                                  <p className="text-xs font-black italic uppercase">{order.customer_name}</p>
                                  <div className="flex items-center gap-2 text-xs font-bold text-zinc-500 uppercase mt-1">
                                    <Calendar size={9}/> {time.day} <Clock size={9}/> {time.t}
                                  </div>
                                  {order.phone_number && (
                                    <p className="text-xs text-green-500 font-bold mt-1">📞 {order.phone_number}</p>
                                  )}
                                  {/* Pickup/Delivery Badge */}
                                  <span className={`inline-block mt-2 px-2 py-1 rounded-lg text-[9px] font-black uppercase ${
                                    isPickup ? 'bg-blue-600/20 text-blue-500' : 'bg-green-600/20 text-green-500'
                                  }`}>
                                    {isPickup ? '📦 PICKUP' : '🚚 DELIVERY'}
                                  </span>
                                </div>
                              </div>
                              <select 
                                value={order.status} 
                                onChange={(e) => updateStatus(order.id, e.target.value)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase border-none outline-none ${
                                  order.status === 'DONE' ? 'bg-green-600/20 text-green-500' :
                                  order.status === 'READY' ? 'bg-blue-600/20 text-blue-500' :
                                  order.status === 'PENDING' ? 'bg-orange-600/20 text-orange-500' :
                                  'bg-zinc-800 text-zinc-400'
                                }`}
                              >
                                <option value="PENDING">PENDING</option>
                                <option value="PREPARING">PREPARING</option>
                                <option value="READY">READY</option>
                                <option value="DONE">DONE</option>
                              </select>
                            </div>
                            <div className="bg-black/40 border border-zinc-900 p-4 rounded-xl mb-3">
                              <p className="text-xs font-black uppercase tracking-widest text-zinc-600 mb-2 italic">Items Summary</p>
                              <p className="text-xs font-medium leading-relaxed">{order.items}</p>
                              <div className="mt-3 flex justify-between items-center border-t border-zinc-900/50 pt-3">
                                <p className="text-xs font-black uppercase">Total Paid</p>
                                <p className="text-lg font-black italic text-orange-500">₦{order.total_price?.toLocaleString()}</p>
                              </div>
                            </div>
                            {showAddresses && !isPickup && (
                              <div className="mt-3 space-y-2">
                                <div className="flex items-start gap-2 p-3 bg-orange-500/5 border border-orange-500/10 rounded-xl">
                                  <MapPin size={12} className="text-orange-500 shrink-0 mt-0.5" />
                                  <div>
                                    <p className="text-xs font-black text-orange-500 uppercase tracking-widest mb-1">Delivery</p>
                                    <p className="text-xs font-bold italic leading-tight">{order.address}</p>
                                    {order.payment_method && (
                                      <p className="text-xs text-zinc-500 mt-1">
                                        Payment: {order.payment_method === 'cash' ? '💵 Cash' : '📱 Transfer'} on delivery
                                      </p>
                                    )}
                                  </div>
                                </div>

                                {order.delivery_fee > 0 && (
                                  <div className="bg-green-500/10 border border-green-500/30 p-3 rounded-xl">
                                    <div className="flex justify-between items-center">
                                      <div>
                                        <p className="text-xs font-black text-green-400 uppercase">Delivery Fee Collected</p>
                                        <p className="text-xs text-zinc-500 mt-1">{order.delivery_distance}km traveled</p>
                                      </div>
                                      <div className="text-right">
                                        <p className="text-sm font-black text-green-500">₦{order.delivery_fee.toLocaleString()}</p>
                                        <p className="text-xs text-zinc-500">Final: ₦{(order.final_total || order.total_price).toLocaleString()}</p>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {order.delivery_fee === 0 && order.status !== 'DONE' && (
                                  <div className="bg-yellow-500/10 border border-yellow-500/30 p-2 rounded-lg">
                                    <p className="text-xs text-yellow-500 font-bold text-center">
                                      ⏳ Delivery fee pending calculation
                                    </p>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </section>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* INVENTORY MODAL */}
      {showInventory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
          <div className="bg-zinc-950 border border-zinc-800 w-full max-w-5xl h-[85vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden">
            {/* MODAL HEADER - STICKY */}
            <div className="flex-shrink-0 p-4 border-b border-zinc-800 bg-zinc-950">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-black uppercase text-white flex items-center gap-2">
                  <PackagePlus size={16}/> Inventory Management
                </h2>
                <button 
                  onClick={() => setShowInventory(false)}
                  className="text-zinc-500 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* SEARCH & SORT */}
              <div className="flex flex-col sm:flex-row gap-2">
                <input 
                  type="text"
                  placeholder="SEARCH PRODUCTS..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 bg-black border border-zinc-800 rounded-lg px-3 py-2 text-xs font-black uppercase outline-none focus:border-orange-500 transition-colors"
                />
                <select 
                  value={sortBy} 
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-black uppercase outline-none text-zinc-400"
                >
                  <option value="DEFAULT">SORT BY</option>
                  <option value="PRICE_LOW">PRICE: LOW TO HIGH</option>
                  <option value="PRICE_HIGH">PRICE: HIGH TO LOW</option>
                  <option value="STOCK_LOW">STOCK: LOW TO HIGH</option>
                  <option value="CATEGORY">CATEGORY</option>
                </select>
              </div>
            </div>

            {/* SCROLLABLE PRODUCT GRID */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                {products
                  .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
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
                      <div key={p.id} className={`bg-black/40 p-2 rounded-lg border flex flex-col gap-1.5 group hover:border-orange-500/50 transition-all ${
                        isSoldOut ? 'border-red-900/50' : isLowStock ? 'border-yellow-900/50' : 'border-zinc-900'
                      }`}>
                        <div className="relative group/img aspect-square overflow-hidden rounded-md">
                          <img 
                            src={p.image || p.image_url || 'https://via.placeholder.com/400'} 
                            className="w-full h-full object-cover bg-zinc-900"
                            onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400?text=Error'; }}
                          />

                          {/* Stock badge */}
                          <div className={`absolute top-1 left-1 px-2 py-1 rounded-md text-[8px] font-black ${
                            isSoldOut ? 'bg-red-600 text-white' :
                            isLowStock ? 'bg-yellow-500 text-black' :
                            'bg-green-600 text-white'
                          }`}>
                            {stock} IN STOCK
                          </div>

                          <input 
                            type="file" accept="image/*" id={`replace-${p.id}`} className="hidden" 
                            onChange={(e) => handleReplaceImageUrl(p.id, e)} 
                          />
                          <label htmlFor={`replace-${p.id}`} className="absolute inset-0 bg-black/80 opacity-0 group-hover/img:opacity-100 transition-all flex flex-col items-center justify-center cursor-pointer text-[8px] font-black">
                            <Upload size={12} className="mb-1" />
                            UPDATE
                          </label>
                        </div>

                        <div className="min-w-0 px-0.5">
                          <p className="text-[9px] font-black uppercase truncate leading-tight mb-0.5">{p.name}</p>
                          <div className="flex justify-between items-center mb-1">
                            <p className="text-[9px] text-orange-500 font-bold">₦{p.price.toLocaleString()}</p>
                          </div>

                          {/* ✅ REPLACED: Quick action buttons now include full edit */}
                          <div className="flex gap-1.5 justify-between">
                            <button 
                              onClick={() => openEditModal(p)}
                              className="flex-1 bg-blue-600 hover:bg-blue-500 text-white px-2 py-1 rounded text-[8px] font-black uppercase transition-colors"
                            >
                              EDIT
                            </button>
                            <button onClick={() => deleteProduct(p.id)} className="text-zinc-600 hover:text-red-500 transition-colors">
                              <Trash2 size={10} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* ADD PRODUCT FORM - STICKY FOOTER */}
            <div className="flex-shrink-0 p-4 border-t border-zinc-800 bg-zinc-950">
              <p className="text-[9px] font-black text-zinc-600 uppercase mb-2 italic text-center">Add New Item</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input 
                  placeholder="NAME" 
                  value={newName} 
                  onChange={e => setNewName(e.target.value)} 
                  className="bg-black border border-zinc-800 rounded-lg px-3 py-2 text-[10px] font-black uppercase outline-none focus:border-orange-500" 
                />
                <input 
                  placeholder="PRICE" 
                  type="number" 
                  value={newPrice} 
                  onChange={e => setNewPrice(e.target.value)} 
                  className="bg-black border border-zinc-800 rounded-lg px-3 py-2 text-[10px] font-black uppercase outline-none focus:border-orange-500" 
                />
                <input 
                  placeholder="STOCK" 
                  type="number" 
                  value={newStock} 
                  onChange={e => setNewStock(e.target.value)} 
                  className="bg-black border border-zinc-800 rounded-lg px-3 py-2 text-[10px] font-black uppercase outline-none focus:border-orange-500" 
                />
                <select 
                  value={newCategory} 
                  onChange={e => setNewCategory(e.target.value)} 
                  className="bg-black border border-zinc-800 rounded-lg px-3 py-2 text-[10px] font-black uppercase"
                >
                  <option value="">CATEGORY</option>
                  {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>

                <div className="relative sm:col-span-2">
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" id="new-product-modal" />
                  <label htmlFor="new-product-modal" className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-[10px] font-black uppercase flex items-center justify-center gap-2 cursor-pointer hover:bg-zinc-800">
                    <Upload size={10} />
                    {newProduct.image_url ? 'UPLOADED ✓' : 'UPLOAD IMAGE'}
                  </label>
                </div>
              </div>

              <button 
                onClick={handleAddProduct} 
                className="w-full bg-orange-600 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-orange-500 transition-colors mt-2"
              >
                Add to Inventory
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ NEW: EDIT PRODUCT MODAL - Full form with working stock input */}
      {showEditModal && editingProduct && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-black/95 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-950 border border-zinc-800 w-full max-w-md max-h-[90vh] sm:max-h-[85vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">

            {/* Header - FIXED/STICKY */}
            <div className="flex-shrink-0 p-4 sm:p-6 border-b border-zinc-800 bg-zinc-900/50">
              <div className="flex items-center justify-between">
                <h3 className="text-xs sm:text-sm font-black uppercase text-white flex items-center gap-2">
                  <Edit3 size={14} className="text-orange-500 sm:w-4 sm:h-4" /> Edit Product
                </h3>
                <button 
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingProduct(null);
                  }}
                  className="text-zinc-500 hover:text-white transition-colors p-1 active:scale-95"
                >
                  <X size={18} className="sm:w-5 sm:h-5" />
                </button>
              </div>
            </div>

            {/* Form - SCROLLABLE */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 sm:space-y-4 custom-scrollbar">
              {/* Product Name */}
              <div>
                <label className="text-[9px] sm:text-[10px] font-black text-zinc-500 uppercase tracking-wider mb-1.5 sm:mb-2 block">
                  Product Name
                </label>
                <input 
                  type="text"
                  value={editingProduct.name}
                  onChange={(e) => handleEditChange('name', e.target.value)}
                  className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 sm:py-2.5 text-xs font-black uppercase outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                  placeholder="PRODUCT NAME"
                />
              </div>

              {/* Price and Stock - Grid on larger screens */}
              <div className="grid grid-cols-2 gap-3">
                {/* Price */}
                <div>
                  <label className="text-[9px] sm:text-[10px] font-black text-zinc-500 uppercase tracking-wider mb-1.5 sm:mb-2 block">
                    Price (₦)
                  </label>
                  <input 
                    type="number"
                    value={editingProduct.price}
                    onChange={(e) => handleEditChange('price', e.target.value)}
                    className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 sm:py-2.5 text-xs font-black uppercase outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                    placeholder="0"
                  />
                </div>

                {/* ✅ STOCK INPUT - Now with proper onChange handler */}
                <div>
                  <label className="text-[9px] sm:text-[10px] font-black text-zinc-500 uppercase tracking-wider mb-1.5 sm:mb-2 block">
                    Stock Qty
                  </label>
                  <input 
                    type="number"
                    value={editingProduct.stock}
                    onChange={(e) => handleEditChange('stock', e.target.value)}  
                    className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 sm:py-2.5 text-xs font-black uppercase outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="text-[9px] sm:text-[10px] font-black text-zinc-500 uppercase tracking-wider mb-1.5 sm:mb-2 block">
                  Category
                </label>
                <select 
                  value={editingProduct.category}
                  onChange={(e) => handleEditChange('category', e.target.value)}
                  className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 sm:py-2.5 text-xs font-black uppercase outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all appearance-none cursor-pointer"
                >
                  <option value="">SELECT CATEGORY</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Image Preview */}
              {editingProduct.image_url && (
                <div>
                  <label className="text-[9px] sm:text-[10px] font-black text-zinc-500 uppercase tracking-wider mb-1.5 sm:mb-2 block">
                    Current Image
                  </label>
                  <div className="relative group/preview">
                    <img 
                      src={editingProduct.image_url} 
                      alt="Product" 
                      className="w-full h-40 sm:h-48 object-cover rounded-lg border border-zinc-800"
                      onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400?text=No+Image'; }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover/preview:opacity-100 transition-opacity rounded-lg flex items-end p-3">
                      <p className="text-[8px] sm:text-[9px] text-zinc-400 font-bold uppercase">Product Image Preview</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Info Card */}
              <div className="bg-orange-500/5 border border-orange-500/20 rounded-lg p-3">
                <p className="text-[9px] sm:text-[10px] text-orange-500/80 font-bold uppercase tracking-wider text-center">
                  💡 Changes will be saved to database
                </p>
              </div>
            </div>

            {/* Footer Actions - FIXED/STICKY */}
            <div className="flex-shrink-0 p-4 sm:p-6 border-t border-zinc-800 bg-zinc-900/50 flex flex-col sm:flex-row gap-2 sm:gap-3">
              <button 
                onClick={() => {
                  setShowEditModal(false);
                  setEditingProduct(null);
                }}
                className="flex-1 bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-white py-2.5 sm:py-3 rounded-lg text-xs font-black uppercase transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveEdit}
                className="flex-1 bg-orange-600 hover:bg-orange-500 active:scale-95 text-white py-2.5 sm:py-3 rounded-lg text-xs font-black uppercase transition-all shadow-lg shadow-orange-500/20"
              >
                💾 Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}