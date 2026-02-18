import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { 
  Trash2, LayoutDashboard, PlusCircle, 
  Save, Clock, MapPin, Calendar, PackagePlus, Edit3, DollarSign, ShoppingBag, AlertTriangle, Download, Upload, ChevronUp, X, Filter, Package, Settings, Tag, Percent
} from 'lucide-react';
import SettingsTab from '../components/SettingsTab';

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

export default function Manager() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [activeTab, setActiveTab] = useState<'dashboard' | 'settings' | 'payments'>('dashboard');
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
  const [newProduct, setNewProduct] = useState({ name: '', price: '', image_url: '', category: '', stock: '10' });
  const [deliveryFeePerKm, setDeliveryFeePerKm] = useState('150');
  const [isSavingFee, setIsSavingFee] = useState(false);

  const [instagramUrl, setInstagramUrl] = useState('');
  const [whatsappUrl, setWhatsAppUrl] = useState('');
  const [twitterUrl, setTwitterUrl] = useState('');
  const [isSavingSocials, setIsSavingSocials] = useState(false);

  const [discounts, setDiscounts] = useState<any[]>([]);
  const [newDiscountCode, setNewDiscountCode] = useState('');
  const [newDiscountPercent, setNewDiscountPercent] = useState('');
  const [showAddDiscount, setShowAddDiscount] = useState(false);

  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const filteredOrders = orders.filter(order => {
    const matchesStatus = filterStatus === 'ALL' || order.status === filterStatus;
    const orderDate = new Date(order.created_at);
    const now = new Date();
    let matchesDate = true;
    if (dateFilter === '24H') matchesDate = (now.getTime() - orderDate.getTime()) <= 24 * 60 * 60 * 1000;
    else if (dateFilter === 'WEEK') matchesDate = (now.getTime() - orderDate.getTime()) <= 7 * 24 * 60 * 60 * 1000;
    else if (dateFilter === 'MONTH') matchesDate = (now.getTime() - orderDate.getTime()) <= 30 * 24 * 60 * 60 * 1000;
    else if (dateFilter === 'YEAR') matchesDate = (now.getTime() - orderDate.getTime()) <= 365 * 24 * 60 * 60 * 1000;

    let matchesOrderType = true;
    if (orderTypeFilter === 'PICKUP') matchesOrderType = !order.address || order.address === null;
    else if (orderTypeFilter === 'DELIVERY') matchesOrderType = order.address && order.address !== null;

    return matchesStatus && matchesDate && matchesOrderType;
  });

  const totalRevenue = filteredOrders.reduce((sum, order) => sum + (order.total_price || 0), 0);

  const deliveredUnpaidOrders = orders.filter(o => 
    o.status === 'DONE' && 
    o.payment_status === 'unpaid' && 
    o.address !== null
  );

  const cashInField = deliveredUnpaidOrders.reduce((sum, order) => sum + (order.total_price || 0), 0);
  const paidRevenue = orders.filter(o => o.payment_status === 'paid').reduce((sum, order) => sum + (order.total_price || 0), 0);
  const totalStockValue = products.reduce((sum, product) => sum + ((product.stock || 0) * (product.price || 0)), 0);
  const totalStockItems = products.reduce((sum, product) => sum + (product.stock || 0), 0);

  const stockByCategory = categories.map(category => {
    const categoryProducts = products.filter(p => p.category === category.name);
    const totalValue = categoryProducts.reduce((sum, p) => sum + ((p.stock || 0) * (p.price || 0)), 0);
    const totalItems = categoryProducts.reduce((sum, p) => sum + (p.stock || 0), 0);
    return { name: category.name, totalValue, totalItems, productCount: categoryProducts.length };
  }).sort((a, b) => b.totalValue - a.totalValue);

  const fetchManagerData = async () => {
    setLoading(true);
    try {
      const { data: oData } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
      if (oData) setOrders(oData);

      const { data: mData } = await supabase.from('messages').select('*').order('created_at', { ascending: false });
      if (mData) setMsgs(mData);

      const { data: cData } = await supabase.from('categories').select('*').order('name', { ascending: true });
      if (cData) setCategories(cData);

      const { data: pData } = await supabase.from('products').select('*').order('created_at', { ascending: false });
      if (pData) setProducts(pData);

      const { data: sData } = await supabase.from('store_settings').select('*').eq('id', 1).single();
      if (sData) {
        setDeliveryFeePerKm(String(sData.delivery_fee_per_km || 150));
        setInstagramUrl(sData.instagram_url || '');
        setWhatsAppUrl(sData.whatsapp_url || '');
        setTwitterUrl(sData.twitter_url || '');
      }

      const { data: dData } = await supabase.from('discounts').select('*').order('created_at', { ascending: false });
      if (dData) setDiscounts(dData);
    } catch (err) {
      console.error("❌ Sync Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const session = localStorage.getItem('manager_session');
    const sessionTime = localStorage.getItem('manager_session_time');
    if (session && sessionTime) {
      const now = new Date().getTime();
      const sessionAge = now - parseInt(sessionTime);
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
        .on('postgres_changes', { event: '*', schema: 'public', table: 'discounts' }, fetchManagerData)
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [isAuthenticated]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError('');
    try {
      const { data: settingsData } = await supabase.from('store_settings').select('manager_password').eq('id', 1).single();
      const dbPassword = settingsData?.manager_password;
      const masterKey = import.meta.env.VITE_MASTER_RECOVERY_KEY;
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
    } catch (error) {
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

  const handleSaveSocials = async () => {
    setIsSavingSocials(true);
    try {
      const { error } = await supabase.from('store_settings').update({ instagram_url: instagramUrl.trim() || null, whatsapp_url: whatsappUrl.trim() || null, twitter_url: twitterUrl.trim() || null }).eq('id', 1);
      if (error) throw error;
      alert('✅ Social media links saved!');
      fetchManagerData();
    } catch (err: any) {
      alert('❌ Failed to save social links: ' + (err?.message || String(err)));
    } finally {
      setIsSavingSocials(false);
    }
  };

  const handleAddDiscount = async () => {
    if (!newDiscountCode.trim() || !newDiscountPercent) { alert('Please fill in all fields'); return; }
    const percent = parseFloat(newDiscountPercent);
    if (isNaN(percent) || percent < 0 || percent > 100) { alert('Please enter a valid percentage (0-100)'); return; }
    try {
      const { error } = await supabase.from('discounts').insert([{ code_name: newDiscountCode.toUpperCase(), percentage_off: percent, is_active: true }]);
      if (error) throw error;
      setNewDiscountCode('');
      setNewDiscountPercent('');
      setShowAddDiscount(false);
      alert('✅ Discount code added!');
      fetchManagerData();
    } catch (err: any) {
      if (err.code === '23505') alert('❌ This discount code already exists');
      else alert('❌ Failed to add discount: ' + err.message);
    }
  };

  const handleToggleDiscount = async (id: number, currentStatus: boolean) => {
    try {
      const { error } = await supabase.from('discounts').update({ is_active: !currentStatus }).eq('id', id);
      if (error) throw error;
      fetchManagerData();
    } catch (err) { alert('❌ Failed to update discount'); }
  };

  const handleDeleteDiscount = async (id: number) => {
    if (!confirm('Delete this discount code?')) return;
    try {
      const { error } = await supabase.from('discounts').delete().eq('id', id);
      if (error) throw error;
      fetchManagerData();
    } catch (err) { alert('❌ Failed to delete discount'); }
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
    alert("Image uploaded successfully!");
  };

  const handleUpdateDeliveryFee = async () => {
    setIsSavingFee(true);
    try {
      const { error } = await supabase.from('store_settings').update({ delivery_fee_per_km: parseFloat(deliveryFeePerKm) }).eq('id', 1);
      if (error) throw error;
      alert('✅ Delivery fee updated successfully!');
    } catch (err: any) {
      alert('❌ Failed to update delivery fee: ' + (err?.message || String(err)));
    } finally {
      setIsSavingFee(false);
    }
  };

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
    if (!newName || !newPrice || !newCategory) { alert("Please fill in all fields"); return; }
    const { error } = await supabase.from('products').insert([{
      name: newName.toUpperCase(),
      price: parseFloat(newPrice),
      category: newCategory,
      image: newProduct.image_url,
      stock: parseInt(newStock) || 10
    }]);
    if (error) { alert("Upload failed: " + error.message); }
    else {
      setNewName(''); setNewPrice(''); setNewCategory(''); setNewStock('10');
      setNewProduct({ name: '', price: '', image_url: '', category: '', stock: '10' });
      alert("Product added successfully!");
      fetchManagerData();
    }
  };

  const openEditModal = (product: any) => {
    setEditingProduct({ id: product.id, name: product.name, price: String(product.price), stock: String(product.stock || 0), category: product.category, image_url: product.image || product.image_url || '' });
    setShowEditModal(true);
  };

  const handleEditChange = (field: string, value: string) => {
    setEditingProduct((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleSaveEdit = async () => {
    if (!editingProduct) return;
    if (!editingProduct.name || !editingProduct.price || !editingProduct.category) { alert("Please fill in all required fields"); return; }
    const priceValue = parseFloat(editingProduct.price);
    const stockValue = parseInt(editingProduct.stock);
    try {
      const { error } = await supabase.from('products').update({ name: editingProduct.name.toUpperCase(), price: priceValue, stock: stockValue, category: editingProduct.category, image: editingProduct.image_url }).eq('id', editingProduct.id);
      if (error) throw error;
      alert("✅ Product updated successfully!");
      setShowEditModal(false);
      setEditingProduct(null);
      fetchManagerData();
    } catch (err: any) {
      alert("Update failed: " + err.message);
    }
  };

  const deleteProduct = async (id: number) => {
    if (!confirm("Delete product?")) return;
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) alert("Delete failed: " + error.message);
    else fetchManagerData();
  };

  const updateStatus = async (orderId: number, newStatus: string) => {
    const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
    if (!error) fetchManagerData();
  };

  const confirmPaymentReceived = async (orderId: number) => {
    if (!confirm("Confirm payment received?")) return;
    const { error } = await supabase.from('orders').update({ payment_status: 'paid' }).eq('id', orderId);
    if (error) alert(error.message);
    else fetchManagerData();
  };

  const handleDeleteAllOrders = async () => {
    if (confirm("THIS WILL WIPE ALL ORDERS. ARE YOU SURE?")) {
      await supabase.from('orders').delete().neq('id', 0);
      fetchManagerData();
    }
  };

  const handleClearMessages = async () => {
    if (confirm("Delete ALL support messages?")) {
      await supabase.from('messages').delete().neq('id', 0);
      fetchManagerData();
    }
  };

  const exportCSV = () => {
    const headers = "Date,Customer,Phone,Items,Total,Address\n";
    const rows = orders.map(o => `"${formatOrderDateTime(o.created_at)}",${o.customer_name},"${o.phone_number || 'N/A'}","${o.items}",${o.total_price},"${o.address || 'PICKUP'}"`).join("\n");
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
    const { error: uploadError } = await supabase.storage.from('stock-images').upload(fileName, file);
    if (uploadError) return alert(uploadError.message);
    const { data: { publicUrl } } = supabase.storage.from('stock-images').getPublicUrl(fileName);
    const { error: dbError } = await supabase.from('products').update({ image: publicUrl }).eq('id', id);
    if (!dbError) fetchManagerData();
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6 relative overflow-hidden">
        <div className="bg-zinc-950 border border-zinc-800 p-12 rounded-3xl shadow-2xl max-w-md w-full relative z-10 animate-in fade-in zoom-in duration-500">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-black italic uppercase tracking-tighter text-white mb-2">Manager Access</h1>
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Authorized Personnel Only</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-6">
            <input type="password" value={passwordInput} onChange={(e) => { setPasswordInput(e.target.value); setLoginError(''); }} placeholder="Enter manager password" className="w-full bg-black/50 border border-zinc-800 rounded-xl px-4 py-4 text-sm font-medium text-white outline-none focus:border-orange-500 transition-all" disabled={isLoggingIn} autoFocus />
            {loginError && <p className="text-red-500 text-xs font-bold text-center">{loginError}</p>}
            <button type="submit" disabled={!passwordInput || isLoggingIn} className="w-full bg-orange-600 hover:bg-orange-500 text-white py-4 rounded-xl font-black uppercase text-sm tracking-widest transition-all">
              {isLoggingIn ? 'Verifying...' : 'Access Dashboard'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-black text-white p-4 md:p-6 lg:p-8 font-sans">
        <div className="max-w-7xl mx-auto">
          <header className="mb-8 border-b border-zinc-900 pb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <LayoutDashboard className="text-orange-500" size={28} />
                <h1 className="text-2xl md:text-3xl font-black italic uppercase tracking-tighter">Inventory & Sales</h1>
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => setShowAddresses(!showAddresses)} className={`px-3 py-2 rounded-xl text-xs font-black uppercase transition-all ${showAddresses ? 'bg-orange-500 text-black' : 'bg-zinc-900 text-zinc-500 hover:bg-zinc-800'}`}>{showAddresses ? 'Hide Addresses' : 'Show Addresses'}</button>
                <button onClick={handleDeleteAllOrders} className="bg-red-900/20 text-red-500 px-3 py-2 rounded-xl text-xs font-bold uppercase hover:bg-red-600 hover:text-white transition-all">Clear Orders</button>
                <button onClick={exportCSV} className="bg-zinc-900 border border-zinc-800 px-3 py-2 rounded-xl text-xs font-black uppercase hover:bg-white hover:text-black transition-all">Export CSV</button>
                <button onClick={handleLogout} className="bg-zinc-900 border border-zinc-800 px-3 py-2 rounded-xl text-xs font-black uppercase hover:bg-red-600 hover:text-white transition-all">Logout</button>
              </div>
            </div>

            <div className="flex gap-2 mb-6 border-b border-zinc-900">
              <button onClick={() => setActiveTab('dashboard')} className={`px-6 py-3 rounded-t-xl text-sm font-black uppercase transition-all ${activeTab === 'dashboard' ? 'bg-zinc-950 text-white' : 'text-zinc-600'}`}>📊 Dashboard</button>
              <button onClick={() => setActiveTab('payments')} className={`px-6 py-3 rounded-t-xl text-sm font-black uppercase transition-all ${activeTab === 'payments' ? 'bg-zinc-950 text-white' : 'text-zinc-600'}`}>💰 Payments</button>
              <button onClick={() => setActiveTab('settings')} className={`px-6 py-3 rounded-t-xl text-sm font-black uppercase transition-all ${activeTab === 'settings' ? 'bg-zinc-950 text-white' : 'text-zinc-600'}`}>⚙️ Settings</button>
            </div>

            {activeTab === 'payments' ? (
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border-2 border-orange-500/30 p-8 rounded-2xl">
                  <p className="text-xs font-black uppercase text-orange-400 mb-2">💵 Cash Currently in Field</p>
                  <p className="text-4xl md:text-5xl font-black text-orange-500">₦{cashInField.toLocaleString()}</p>
                </div>
                <div className="bg-zinc-950 border border-zinc-900 rounded-2xl overflow-hidden">
                  <div className="divide-y divide-zinc-900">
                    {deliveredUnpaidOrders.length === 0 ? (
                      <div className="p-16 text-center text-zinc-600 uppercase font-black">All Payments Collected!</div>
                    ) : (
                      deliveredUnpaidOrders.map(order => (
                        <div key={order.id} className="p-5 flex justify-between items-center">
                          <div>
                            <p className="font-black text-orange-500">Order #{order.id}</p>
                            <p className="text-sm text-white">{order.customer_name}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-black text-orange-500 mb-2">₦{(order.total_price || 0).toLocaleString()}</p>
                            <button onClick={() => confirmPaymentReceived(order.id)} className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg text-xs font-black uppercase">Confirm Payment</button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            ) : activeTab === 'settings' ? (
              <div className="space-y-6">
                <SettingsTab onSettingsSaved={fetchManagerData} />
                <div className="bg-zinc-950 border border-zinc-900 p-6 rounded-2xl">
                  <h3 className="text-xs font-black uppercase text-orange-500 mb-4">Social Media Links</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input type="url" value={instagramUrl} onChange={(e) => setInstagramUrl(e.target.value)} placeholder="Instagram URL" className="bg-black border border-zinc-800 rounded-xl p-3 text-sm" />
                    <input type="url" value={whatsappUrl} onChange={(e) => setWhatsAppUrl(e.target.value)} placeholder="WhatsApp URL" className="bg-black border border-zinc-800 rounded-xl p-3 text-sm" />
                    <input type="url" value={twitterUrl} onChange={(e) => setTwitterUrl(e.target.value)} placeholder="Twitter URL" className="bg-black border border-zinc-800 rounded-xl p-3 text-sm" />
                  </div>
                  <button onClick={handleSaveSocials} disabled={isSavingSocials} className="w-full mt-4 bg-orange-600 py-3 rounded-xl font-black uppercase text-xs">Save Social Links</button>
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                  <div className="bg-zinc-950 border border-zinc-900 p-5 rounded-2xl">
                    <p className="text-xs font-black text-zinc-500 uppercase mb-1">Revenue</p>
                    <p className="text-2xl font-black text-orange-500 italic">₦{totalRevenue.toLocaleString()}</p>
                  </div>
                  <div className="bg-zinc-950 border border-zinc-900 p-5 rounded-2xl">
                    <p className="text-xs font-black text-zinc-500 uppercase mb-1">Orders</p>
                    <p className="text-2xl font-black text-white italic">{filteredOrders.length}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-1 space-y-6">
                    <section className="bg-zinc-950 border border-zinc-900 p-6 rounded-2xl">
                      <h2 className="text-xs font-black uppercase text-orange-500 mb-4">Categories</h2>
                      <div className="flex gap-2 mb-4">
                        <input value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="NAME..." className="flex-1 bg-black border border-zinc-800 rounded-xl px-3 py-2 text-xs" />
                        <button onClick={handleAddCategory} className="bg-white text-black p-2 rounded-xl"><Save size={16} /></button>
                      </div>
                      <div className="space-y-2">
                        {categories.map(c => (
                          <div key={c.id} className="flex justify-between items-center bg-black/40 border border-zinc-900 px-3 py-2 rounded-xl">
                            <span className="text-xs font-black uppercase">{c.name}</span>
                            <button onClick={() => deleteCategory(c.id)} className="text-zinc-800 hover:text-red-500"><Trash2 size={12} /></button>
                          </div>
                        ))}
                      </div>
                    </section>
                    <button onClick={() => setShowInventory(true)} className="w-full py-3 bg-orange-600 rounded-2xl font-black uppercase text-xs">Manage Inventory</button>
                  </div>
                  <div className="lg:col-span-2">
                    <section className="bg-zinc-950 border border-zinc-900 rounded-2xl overflow-hidden">
                      <div className="p-6 border-b border-zinc-900 bg-zinc-900/20 font-black uppercase text-xs">Recent Sales</div>
                      <div className="divide-y divide-zinc-900">
                        {filteredOrders.map(order => (
                          <div key={order.id} className="p-5">
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <p className="text-xs font-black italic uppercase">{order.customer_name} (#{order.id})</p>
                                <p className="text-[10px] text-zinc-500">{formatOrderDateTime(order.created_at)}</p>
                              </div>
                              <select value={order.status} onChange={(e) => updateStatus(order.id, e.target.value)} className="bg-zinc-900 text-xs font-black uppercase p-2 rounded-lg outline-none">
                                <option value="PENDING">PENDING</option>
                                <option value="PREPARING">PREPARING</option>
                                <option value="READY">READY</option>
                                <option value="DONE">DONE</option>
                              </select>
                            </div>
                            <div className="bg-black/40 p-4 rounded-xl text-xs">
                              <p>{order.items}</p>
                              <p className="mt-2 text-orange-500 font-black">₦{order.total_price?.toLocaleString()}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  </div>
                </div>
              </>
            )}
          </header>
        </div>
      </div>

      {showInventory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
          <div className="bg-zinc-950 border border-zinc-800 w-full max-w-5xl h-[85vh] flex flex-col rounded-2xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-black uppercase">Inventory</h2>
              <button onClick={() => setShowInventory(false)}><X size={24} /></button>
            </div>
            <div className="flex-1 overflow-y-auto grid grid-cols-2 md:grid-cols-4 gap-4">
              {products.map(p => (
                <div key={p.id} className="bg-black/40 p-3 rounded-xl border border-zinc-900">
                  <img src={p.image || p.image_url} className="w-full aspect-square object-cover rounded-lg mb-2" />
                  <p className="text-[10px] font-black uppercase truncate">{p.name}</p>
                  <p className="text-orange-500 font-black">₦{p.price?.toLocaleString()}</p>
                  <div className="flex gap-2 mt-2">
                    <button onClick={() => openEditModal(p)} className="flex-1 bg-blue-600 py-1 rounded text-[8px] font-black">EDIT</button>
                    <button onClick={() => deleteProduct(p.id)} className="text-zinc-600"><Trash2 size={12} /></button>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-6 border-t border-zinc-800">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <input placeholder="NAME" value={newName} onChange={e => setNewName(e.target.value)} className="bg-black border border-zinc-800 p-2 text-xs rounded-lg" />
                <input placeholder="PRICE" type="number" value={newPrice} onChange={e => setNewPrice(e.target.value)} className="bg-black border border-zinc-800 p-2 text-xs rounded-lg" />
                <select value={newCategory} onChange={e => setNewCategory(e.target.value)} className="bg-black border border-zinc-800 p-2 text-xs rounded-lg">
                  <option value="">CATEGORY</option>
                  {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
                <button onClick={handleAddProduct} className="bg-orange-600 text-white font-black uppercase text-xs rounded-lg">Add Product</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showEditModal && editingProduct && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/95 backdrop-blur-sm">
          <div className="bg-zinc-950 border border-zinc-800 w-full max-w-md rounded-2xl p-6">
            <h3 className="font-black uppercase mb-6">Edit Product</h3>
            <div className="space-y-4">
              <input value={editingProduct.name} onChange={(e) => handleEditChange('name', e.target.value)} className="w-full bg-black border border-zinc-800 p-3 rounded-xl" />
              <input type="number" value={editingProduct.price} onChange={(e) => handleEditChange('price', e.target.value)} className="w-full bg-black border border-zinc-800 p-3 rounded-xl" />
              <button onClick={handleSaveEdit} className="w-full bg-orange-600 py-4 rounded-xl font-black uppercase">Save Changes</button>
              <button onClick={() => setShowEditModal(false)} className="w-full text-zinc-500 uppercase text-xs font-black">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}