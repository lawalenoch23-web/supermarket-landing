import ExpiryBadge from '../components/ExpiryBadge';
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import {
  Trash2, LayoutDashboard, PlusCircle,
  Save, Clock, MapPin, Calendar, PackagePlus, Edit3, DollarSign, ShoppingBag, AlertTriangle, Download, Upload, ChevronUp, X, Filter, Package, Settings, Tag, Percent, CheckCircle, TrendingUp, ChevronDown, BarChart2
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
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
};

export default function Manager() {
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
  const [orderTypeFilter, setOrderTypeFilter] = useState<'PICKUP' | 'DELIVERY' | 'ALL'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('DEFAULT');
  const [showInventory, setShowInventory] = useState(false);
  const [showCategoryBreakdown, setShowCategoryBreakdown] = useState(false);
  const [showRevenueBreakdown, setShowRevenueBreakdown] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', price: '', image_url: '', category: '', stock: '10' });
  const [deliveryFeePerKm, setDeliveryFeePerKm] = useState('150');
  const [isSavingFee, setIsSavingFee] = useState(false);
  const [instagramUrl, setInstagramUrl] = useState('');
  const [whatsappUrl, setWhatsappUrl] = useState('');
  const [twitterUrl, setTwitterUrl] = useState('');
  const [isSavingSocials, setIsSavingSocials] = useState(false);
  const [discounts, setDiscounts] = useState<any[]>([]);
  const [newDiscountCode, setNewDiscountCode] = useState('');
  const [newDiscountPercent, setNewDiscountPercent] = useState('');
  const [showAddDiscount, setShowAddDiscount] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [expiringProducts, setExpiringProducts] = useState<any[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);

  // ── ORDER FILTERS ──
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

  // ── REVENUE CALCULATIONS ──
  const totalDiscountDeductions = filteredOrders.reduce((sum, o) => sum + (o.discount_amount || 0), 0);
  const netRevenue = filteredOrders.reduce((sum, o) => sum + (o.total_price || 0), 0);
  const grossRevenue = netRevenue + totalDiscountDeductions;
  const totalRevenue = netRevenue;
  const deliveredUnpaidOrders = orders.filter(o => (o.status === 'DONE' || o.status === 'COMPLETED') && o.payment_status === 'unpaid' && o.address !== null);
  const cashInField = deliveredUnpaidOrders.reduce((sum, order) => sum + (order.total_price || 0), 0);
  const paidRevenue = orders.filter(o => o.payment_status === 'paid').reduce((sum, order) => sum + (order.total_price || 0), 0);

  // ── STOCK CALCULATIONS ──
  const totalStockValue = products.reduce((sum, p) => sum + ((p.stock || 0) * (p.price || 0)), 0);
  const totalStockItems = products.reduce((sum, p) => sum + (p.stock || 0), 0);
  const stockByCategory = categories.map(category => {
    const categoryProducts = products.filter(p => p.category === category.name);
    const totalValue = categoryProducts.reduce((sum, p) => sum + ((p.stock || 0) * (p.price || 0)), 0);
    const totalItems = categoryProducts.reduce((sum, p) => sum + (p.stock || 0), 0);
    return { name: category.name, totalValue, totalItems, productCount: categoryProducts.length };
  }).sort((a, b) => b.totalValue - a.totalValue);

  const discountRankedProducts = [...products]
    .filter(p => (p.manual_discount || 0) > 0)
    .sort((a, b) => (b.manual_discount || 0) - (a.manual_discount || 0))
    .slice(0, 10);

  const ordersWithDiscount = filteredOrders.filter(o => o.discount_code && o.discount_amount > 0);
  const promoCodeUsage = ordersWithDiscount.reduce((acc: any, o) => {
    const code = o.discount_code;
    if (!acc[code]) acc[code] = { code, uses: 0, totalSaved: 0 };
    acc[code].uses += 1;
    acc[code].totalSaved += (o.discount_amount || 0);
    return acc;
  }, {});
  const promoCodeRank = Object.values(promoCodeUsage).sort((a: any, b: any) => b.totalSaved - a.totalSaved) as any[];

  const confirmPaymentReceived = async (orderId: number) => {
    if (!confirm('Confirm that payment has been received from the driver?')) return;
    try {
      const { error } = await supabase.from('orders').update({ payment_status: 'paid' }).eq('id', orderId);
      if (error) throw error;
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, payment_status: 'paid' } : o));
      alert('✅ Payment confirmed and recorded!');
    } catch (err: any) {
      alert('Failed to confirm payment: ' + err.message);
    }
  };

  const fetchManagerData = async () => {
    setLoading(true);
    try {
      const { data: oData } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
      if (oData) {
        setOrders(oData);
        // Auto-cancel expired unconfirmed delivery orders
        const now = Date.now();
        const expired = oData.filter((o: any) =>
          o.status === 'AWAITING_CONFIRMATION' &&
          (now - new Date(o.created_at).getTime()) > 900_000
        );
        for (const o of expired) {
          await supabase.from('orders').update({ status: 'CANCELLED' }).eq('id', o.id);
        }
        if (expired.length > 0) {
          const { data: fresh } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
          if (fresh) setOrders(fresh);
        }
      }
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
        setWhatsappUrl(sData.whatsapp_url || '');
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
    const fetchExpiringProducts = async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 14);
      const future = futureDate.toISOString().split('T')[0];
      const { data } = await supabase.from('products').select('*').not('expiry_date', 'is', null).lte('expiry_date', future).order('expiry_date', { ascending: true });
      setExpiringProducts(data || []);
    };
    fetchExpiringProducts();
  }, []);

  useEffect(() => {
    fetchManagerData();
    const channel = supabase.channel('manager-stable-view')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchManagerData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, fetchManagerData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, fetchManagerData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'discounts' }, fetchManagerData)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleLogout = () => {
    if (confirm('Are you sure you want to logout?')) {
      localStorage.removeItem('manager_session');
      localStorage.removeItem('manager_session_time');
      window.location.href = '/login';
    }
  };

  const handleSaveSocials = async () => {
    setIsSavingSocials(true);
    try {
      const { error } = await supabase.from('store_settings').update({
        instagram_url: instagramUrl.trim() || null,
        whatsapp_url: whatsappUrl.trim() || null,
        twitter_url: twitterUrl.trim() || null,
      }).eq('id', 1);
      if (error) throw new Error(error.message || JSON.stringify(error));
      alert('✅ Social media links saved!');
      fetchManagerData();
    } catch (err: any) {
      alert('❌ Failed to save social links: ' + (err?.message || JSON.stringify(err)));
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
      setNewDiscountCode(''); setNewDiscountPercent(''); setShowAddDiscount(false);
      alert('✅ Discount code added!'); fetchManagerData();
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
      if (error) throw new Error(error.message);
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
      name: newName.toUpperCase(), price: parseFloat(newPrice), category: newCategory,
      image: newProduct.image_url, stock: parseInt(newStock) || 10
    }]);
    if (error) { alert("Upload failed: " + error.message); }
    else {
      setNewName(''); setNewPrice(''); setNewCategory(''); setNewStock('10');
      setNewProduct({ name: '', price: '', image_url: '', category: '', stock: '10' });
      alert("Product added successfully!"); fetchManagerData();
    }
  };

  const openEditModal = (product: any) => {
    setEditingProduct({
      id: product.id, name: product.name, price: String(product.price),
      stock: String(product.stock || 0), category: product.category,
      image_url: product.image || product.image_url || '',
      expiry_date: product.expiry_date || '',
      manual_discount: String(product.manual_discount || 0),
    });
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
    if (isNaN(priceValue) || priceValue < 0) { alert("Please enter a valid price"); return; }
    if (isNaN(stockValue) || stockValue < 0) { alert("Please enter a valid stock quantity"); return; }
    try {
      const { error } = await supabase.from('products')
        .update({
          name: editingProduct.name.toUpperCase(),
          price: priceValue,
          stock: stockValue,
          category: editingProduct.category,
          image: editingProduct.image_url,
          expiry_date: editingProduct.expiry_date || null,
          manual_discount: parseInt(editingProduct.manual_discount) || 0,
          on_sale: (parseInt(editingProduct.manual_discount) || 0) > 0
        })
        .eq('id', editingProduct.id);
      if (error) { alert("Update failed: " + error.message); return; }
      alert("✅ Product updated successfully!");
      setShowEditModal(false);
      setEditingProduct(null);
      await fetchManagerData();
    } catch (err) {
      alert("An unexpected error occurred.");
    }
  };

  const deleteProduct = async (id: number) => {
    if (!id) { alert("Error: This product has no ID."); return; }
    if (!confirm("Delete product?")) return;
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) alert("Delete failed: " + error.message);
    else { alert("Product deleted successfully!"); fetchManagerData(); }
  };

  const inventoryFilteredProducts = products
    .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
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
      fetchManagerData();
      alert(`✅ ${selectedProducts.length} product(s) deleted!`);
    } catch (err: any) {
      alert('Bulk delete failed: ' + err.message);
    }
  };

  const updateStatus = async (orderId: number, newStatus: string) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
    if (error) {
      fetchManagerData();
      alert('Failed to update status');
    }
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

  // ────────────────────────────────────────────────
  //  MAIN DASHBOARD
  // ────────────────────────────────────────────────
  return (
    <>
      <style>{`
        .mgr-scroll::-webkit-scrollbar { width: 4px; height: 4px; }
        .mgr-scroll::-webkit-scrollbar-track { background: transparent; }
        .mgr-scroll::-webkit-scrollbar-thumb { background: #3f3f46; border-radius: 99px; }
        .mgr-scroll::-webkit-scrollbar-thumb:hover { background: #f97316; }
      `}</style>

      <div className="min-h-screen bg-[#080808] text-white font-sans">

        {/* ── TOP HEADER ── */}
        <header className="sticky top-0 z-40 bg-[#080808]/95 backdrop-blur-xl border-b border-zinc-900">
          <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-orange-500/15 border border-orange-500/25 flex items-center justify-center">
                  <LayoutDashboard size={16} className="text-orange-500" />
                </div>
                <div>
                  <h1 className="text-sm font-black uppercase tracking-tight text-white leading-none">Manager OS</h1>
                  <p className="text-[9px] text-zinc-600 font-semibold uppercase tracking-wider">Dashboard</p>
                </div>
              </div>

              {/* Tabs */}
              <div className="hidden md:flex items-center gap-1 bg-zinc-950 border border-zinc-800 rounded-xl p-1">
                {[
                  { id: 'dashboard', label: '📊 Dashboard' },
                  { id: 'payments', label: '💰 Payments' },
                  { id: 'settings', label: '⚙️ Settings' },
                ].map(tab => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
                    className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wide transition-all ${activeTab === tab.id ? 'bg-orange-600 text-white shadow-lg shadow-orange-500/20' : 'text-zinc-500 hover:text-white'}`}>
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button onClick={exportCSV} title="Export CSV"
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-500 hover:text-white transition-all">
                  <Download size={14} />
                </button>
                <button onClick={handleLogout}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-red-600/20 border border-zinc-800 hover:border-red-500/30 text-zinc-400 hover:text-red-400 rounded-lg text-xs font-black uppercase transition-all">
                  <X size={12} /> Logout
                </button>
              </div>
            </div>

            {/* Mobile tabs */}
            <div className="md:hidden flex gap-1 pb-3 overflow-x-auto no-scrollbar">
              {[
                { id: 'dashboard', label: '📊 Dashboard' },
                { id: 'payments', label: '💰 Payments' },
                { id: 'settings', label: '⚙️ Settings' },
              ].map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-shrink-0 px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-wide transition-all ${activeTab === tab.id ? 'bg-orange-600 text-white' : 'bg-zinc-900 text-zinc-500'}`}>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-6">

          {/* ── EXPIRY ALERT ── */}
          {expiringProducts.length > 0 && (
            <div className="bg-red-500/8 border border-red-500/20 rounded-2xl p-4 mb-6">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle size={16} className="text-red-500 flex-shrink-0" />
                <h3 className="text-sm font-black uppercase text-red-400">
                  {expiringProducts.length} Product{expiringProducts.length > 1 ? 's' : ''} Expiring Soon
                </h3>
              </div>
              <div className="space-y-2 max-h-40 overflow-y-auto mgr-scroll">
                {expiringProducts.map(product => (
                  <div key={product.id} className="flex items-center justify-between bg-black/30 rounded-xl px-3 py-2">
                    <div>
                      <p className="text-sm font-bold text-white">{product.name}</p>
                      <p className="text-xs text-zinc-500">Stock: {product.stock} · Expires {new Date(product.expiry_date).toLocaleDateString()}</p>
                    </div>
                    <ExpiryBadge expiryDate={product.expiry_date} />
                  </div>
                ))}
              </div>
              <p className="text-xs text-zinc-600 mt-3 italic">💡 Discount expiring items to reduce waste</p>
            </div>
          )}

          {/* ══════════════════════════════════════ */}
          {/*  PAYMENTS TAB                          */}
          {/* ══════════════════════════════════════ */}
          {activeTab === 'payments' && (
            <div className="space-y-5">
              <div className="bg-orange-500/8 border border-orange-500/20 rounded-2xl p-6">
                <p className="text-xs font-black uppercase text-orange-400 mb-1">Cash in Field</p>
                <p className="text-4xl font-black text-orange-500">₦{cashInField.toLocaleString()}</p>
                <p className="text-xs text-zinc-500 mt-1">{deliveredUnpaidOrders.length} delivered order{deliveredUnpaidOrders.length !== 1 ? 's' : ''} awaiting collection</p>
              </div>

              <div className="bg-zinc-950 border border-zinc-900 rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-zinc-900">
                  <h2 className="text-sm font-black uppercase text-white flex items-center gap-2">
                    <AlertTriangle size={14} className="text-orange-500" /> Awaiting Payment Confirmation
                  </h2>
                </div>
                {deliveredUnpaidOrders.length === 0 ? (
                  <div className="p-16 text-center">
                    <CheckCircle size={40} className="text-green-500 mx-auto mb-3" />
                    <p className="text-sm font-black uppercase text-zinc-600">All Payments Collected!</p>
                  </div>
                ) : (
                  <div className="divide-y divide-zinc-900">
                    {deliveredUnpaidOrders.map(order => (
                      <div key={order.id} className="p-5 hover:bg-white/[0.02] transition-colors">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-base font-black text-orange-500">Order #{order.id}</span>
                              <span className="px-2 py-0.5 bg-orange-500/15 text-orange-400 text-[9px] font-black uppercase rounded-full">Unpaid</span>
                            </div>
                            <p className="text-sm font-bold text-white">{order.customer_name}</p>
                            <p className="text-xs text-zinc-500 mt-0.5">{order.phone_number} · {formatOrderDateTime(order.created_at)}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-2xl font-black text-orange-500">₦{(order.total_price || 0).toLocaleString()}</span>
                            <button onClick={() => confirmPaymentReceived(order.id)}
                              className="px-4 py-2.5 bg-green-600 hover:bg-green-500 text-white rounded-xl font-black uppercase text-xs tracking-wide transition-all active:scale-95 flex items-center gap-1.5">
                              <CheckCircle size={13} /> Confirm
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

          {/* ══════════════════════════════════════ */}
          {/*  SETTINGS TAB                          */}
          {/* ══════════════════════════════════════ */}
          {activeTab === 'settings' && (
            <div className="space-y-5">
              <SettingsTab onSettingsSaved={fetchManagerData} />

              {/* Delivery Fee */}
              <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-5">
                <h3 className="text-xs font-black uppercase text-orange-500 mb-4 flex items-center gap-2"><DollarSign size={12} /> Delivery Fee</h3>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="text-[10px] font-black text-zinc-500 uppercase mb-2 block">Fee Per Kilometer (₦)</label>
                    <input type="number" value={deliveryFeePerKm} onChange={(e) => setDeliveryFeePerKm(e.target.value)}
                      className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-sm font-black outline-none focus:border-orange-500 transition-all" />
                  </div>
                  <button onClick={handleUpdateDeliveryFee} disabled={isSavingFee}
                    className="bg-orange-600 hover:bg-orange-500 disabled:bg-zinc-800 text-white px-5 rounded-xl text-xs font-black uppercase transition-all self-end py-3">
                    {isSavingFee ? 'Saving...' : 'Save'}
                  </button>
                </div>
                <p className="text-xs text-zinc-600 mt-2 italic">Shown to customers at checkout. Actual fee calculated on delivery.</p>
              </div>

              {/* Socials */}
              <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-5">
                <h3 className="text-xs font-black uppercase text-orange-500 mb-1 flex items-center gap-2"><Settings size={12} /> Social Media</h3>
                <p className="text-xs text-zinc-500 mb-4">Icons shown in the customer store header.</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                  {[
                    { label: 'Instagram', icon: <InstagramIcon size={11} className="text-pink-500" />, value: instagramUrl, setter: setInstagramUrl, placeholder: 'https://instagram.com/yourstore', focus: 'focus:border-pink-500' },
                    { label: 'WhatsApp', icon: <WhatsAppIcon size={11} className="text-green-500" />, value: whatsappUrl, setter: setWhatsappUrl, placeholder: 'https://wa.me/234XXXXXXXXXX', focus: 'focus:border-green-500' },
                    { label: 'Twitter / X', icon: <TwitterXIcon size={11} className="text-sky-400" />, value: twitterUrl, setter: setTwitterUrl, placeholder: 'https://twitter.com/yourstore', focus: 'focus:border-sky-500' },
                  ].map(s => (
                    <div key={s.label}>
                      <label className="text-[10px] font-black text-zinc-500 uppercase mb-2 flex items-center gap-1.5">{s.icon} {s.label}</label>
                      <input type="url" value={s.value} onChange={(e) => s.setter(e.target.value)} placeholder={s.placeholder}
                        className={`w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-sm font-medium outline-none ${s.focus} transition-all`} />
                    </div>
                  ))}
                </div>
                <button onClick={handleSaveSocials} disabled={isSavingSocials}
                  className="w-full bg-orange-600 hover:bg-orange-500 disabled:bg-zinc-800 text-white py-3 rounded-xl text-xs font-black uppercase transition-all flex items-center justify-center gap-2">
                  {isSavingSocials ? <><div className="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full" /> Saving...</> : '💾 Save Social Links'}
                </button>
              </div>

              {/* Discount Codes */}
              <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xs font-black uppercase text-orange-500 flex items-center gap-2"><Tag size={12} /> Discount Codes</h3>
                    <p className="text-xs text-zinc-600 mt-0.5">Promo codes for customers at checkout</p>
                  </div>
                  <button onClick={() => setShowAddDiscount(!showAddDiscount)}
                    className="bg-orange-600 hover:bg-orange-500 text-white px-4 py-2 rounded-xl text-xs font-black uppercase transition-all flex items-center gap-1.5">
                    <PlusCircle size={11} /> {showAddDiscount ? 'Cancel' : 'Add Code'}
                  </button>
                </div>

                {showAddDiscount && (
                  <div className="bg-purple-500/8 border border-purple-500/20 p-4 rounded-xl mb-4">
                    <p className="text-xs font-black text-purple-400 uppercase mb-3">New Discount Code</p>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <label className="text-[10px] font-black text-zinc-500 uppercase mb-2 block">Code</label>
                        <input type="text" value={newDiscountCode} onChange={(e) => setNewDiscountCode(e.target.value.toUpperCase())}
                          placeholder="e.g. SAVE20"
                          className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-sm font-black uppercase outline-none focus:border-purple-500 tracking-widest transition-all" />
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-zinc-500 uppercase mb-2 block">% Off</label>
                        <input type="number" value={newDiscountPercent} onChange={(e) => setNewDiscountPercent(e.target.value)}
                          placeholder="e.g. 20" min="0" max="100"
                          className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-sm font-black outline-none focus:border-purple-500 transition-all" />
                      </div>
                    </div>
                    <button onClick={handleAddDiscount}
                      className="w-full bg-purple-600 hover:bg-purple-500 text-white py-3 rounded-xl text-xs font-black uppercase transition-all">
                      ✨ Create Code
                    </button>
                  </div>
                )}

                <div className="space-y-2">
                  {discounts.length === 0 ? (
                    <div className="text-center py-8 border border-dashed border-zinc-800 rounded-xl">
                      <Tag size={28} className="text-zinc-800 mx-auto mb-2" />
                      <p className="text-zinc-600 text-xs font-bold uppercase">No discount codes yet</p>
                    </div>
                  ) : (
                    discounts.map(discount => (
                      <div key={discount.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-black/40 border border-zinc-900 hover:border-purple-500/20 p-4 rounded-xl transition-all group">
                        <div className="flex items-center gap-4">
                          <div className={`px-3 py-2 rounded-lg min-w-[80px] text-center border ${discount.is_active ? 'bg-green-600/15 border-green-600/25 text-green-500' : 'bg-zinc-900 border-zinc-800 text-zinc-600'}`}>
                            <p className="text-sm font-black uppercase tracking-wider">{discount.code_name}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <p className="text-2xl font-black text-purple-500">{discount.percentage_off}</p>
                            <div>
                              <p className="text-[9px] font-black text-purple-400 uppercase">% OFF</p>
                              <span className={`text-[9px] font-black uppercase ${discount.is_active ? 'text-green-500' : 'text-zinc-600'}`}>
                                {discount.is_active ? '● Active' : '○ Inactive'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => handleToggleDiscount(discount.id, discount.is_active)}
                            className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all active:scale-95 ${discount.is_active ? 'bg-yellow-600/15 text-yellow-500 hover:bg-yellow-600 hover:text-white border border-yellow-600/25' : 'bg-green-600/15 text-green-500 hover:bg-green-600 hover:text-white border border-green-600/25'}`}>
                            {discount.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                          <button onClick={() => handleDeleteDiscount(discount.id)}
                            className="p-2 text-zinc-700 hover:text-red-500 transition-colors rounded-lg hover:bg-red-500/8">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Danger Zone */}
              <div className="bg-red-500/5 border border-red-500/15 rounded-2xl p-5">
                <h3 className="text-xs font-black uppercase text-red-500 mb-3 flex items-center gap-2"><AlertTriangle size={12} /> Danger Zone</h3>
                <div className="flex flex-wrap gap-2">
                  <button onClick={handleDeleteAllOrders}
                    className="px-4 py-2 bg-red-600/15 hover:bg-red-600 text-red-500 hover:text-white border border-red-500/25 rounded-xl text-xs font-black uppercase transition-all">
                    Clear All Orders
                  </button>
                  <button onClick={handleClearMessages}
                    className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-500 hover:text-white border border-zinc-800 rounded-xl text-xs font-black uppercase transition-all">
                    Clear Messages
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════ */}
          {/*  DASHBOARD TAB                         */}
          {/* ══════════════════════════════════════ */}
          {activeTab === 'dashboard' && (
            <div className="space-y-5">

              {/* ── FILTER BAR ── */}
              <div className="bg-zinc-950/80 border border-zinc-900 rounded-2xl p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-[10px] font-black text-zinc-600 uppercase tracking-wider mb-2">Order Type</p>
                    <div className="flex gap-1">
                      {['ALL', 'PICKUP', 'DELIVERY'].map(type => (
                        <button key={type} onClick={() => setOrderTypeFilter(type as any)}
                          className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${orderTypeFilter === type ? 'bg-orange-500 text-black' : 'bg-zinc-900 text-zinc-500 hover:bg-zinc-800'}`}>
                          {type === 'PICKUP' ? '📦' : type === 'DELIVERY' ? '🚚' : '🔍'} <span className="hidden sm:inline">{type}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-zinc-600 uppercase tracking-wider mb-2">Status</p>
                    <div className="flex flex-wrap gap-1">
                      {['ALL', 'PENDING', 'PREPARING', 'READY', 'DONE'].map(s => (
                        <button key={s} onClick={() => setFilterStatus(s)}
                          className={`px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${filterStatus === s ? 'bg-white text-black' : 'bg-zinc-900 text-zinc-600 hover:bg-zinc-800'}`}>
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-zinc-600 uppercase tracking-wider mb-2">Period</p>
                    <div className="flex flex-wrap gap-1">
                      {[{ id: '24H', label: '24H' }, { id: 'WEEK', label: 'Week' }, { id: 'MONTH', label: 'Month' }, { id: 'YEAR', label: 'Year' }, { id: 'ALL_TIME', label: 'All' }].map(r => (
                        <button key={r.id} onClick={() => setDateFilter(r.id)}
                          className={`px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${dateFilter === r.id ? 'bg-white text-black' : 'bg-zinc-900 text-zinc-600 hover:bg-zinc-800'}`}>
                          {r.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex justify-between items-center mt-3 pt-3 border-t border-zinc-900">
                  <p className="text-[10px] text-zinc-600 font-bold">{filteredOrders.length} order{filteredOrders.length !== 1 ? 's' : ''} matching filters</p>
                  <div className="flex gap-2">
                    <button onClick={() => setShowAddresses(!showAddresses)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${showAddresses ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : 'bg-zinc-900 text-zinc-500'}`}>
                      {showAddresses ? 'Hide' : 'Show'} Addresses
                    </button>
                    <button onClick={exportCSV}
                      className="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase bg-zinc-900 text-zinc-500 hover:text-white transition-all flex items-center gap-1">
                      <Download size={10} /> CSV
                    </button>
                  </div>
                </div>
              </div>

              {/* ── STAT CARDS ── */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div onClick={() => setShowRevenueBreakdown(!showRevenueBreakdown)}
                  className="bg-zinc-950 border border-zinc-900 hover:border-orange-500/30 p-4 md:p-5 rounded-2xl cursor-pointer group transition-all active:scale-[0.98]">
                  <div className="flex justify-between items-start mb-3">
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-wider group-hover:text-orange-400 transition-colors">Revenue</p>
                    <div className={`p-1 rounded-full transition-colors ${showRevenueBreakdown ? 'bg-orange-500 text-black' : 'bg-zinc-800 text-zinc-500'}`}>
                      {showRevenueBreakdown ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    </div>
                  </div>
                  <p className="text-2xl md:text-3xl font-black text-orange-500 italic">₦{(totalRevenue / 1000).toFixed(0)}K</p>
                  <p className="text-[9px] text-zinc-600 font-bold mt-1 uppercase">Tap for breakdown</p>
                </div>

                <div className="bg-zinc-950 border border-zinc-900 p-4 md:p-5 rounded-2xl">
                  <div className="flex justify-between items-start mb-3">
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">Orders</p>
                    <ShoppingBag size={16} className="text-zinc-800" />
                  </div>
                  <p className="text-2xl md:text-3xl font-black text-white italic">{filteredOrders.length}</p>
                  <p className="text-[9px] text-zinc-600 font-bold mt-1 uppercase">In selected period</p>
                </div>

                <div onClick={() => setShowCategoryBreakdown(!showCategoryBreakdown)}
                  className="bg-zinc-950 border border-zinc-900 hover:border-green-500/30 p-4 md:p-5 rounded-2xl cursor-pointer group transition-all active:scale-[0.98]">
                  <div className="flex justify-between items-start mb-3">
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-wider group-hover:text-green-400 transition-colors">Stock</p>
                    <div className={`p-1 rounded-full transition-colors ${showCategoryBreakdown ? 'bg-green-500 text-black' : 'bg-zinc-800 text-zinc-500'}`}>
                      {showCategoryBreakdown ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    </div>
                  </div>
                  <p className="text-2xl md:text-3xl font-black text-green-500 italic">₦{(totalStockValue / 1000).toFixed(0)}K</p>
                  <p className="text-[9px] text-zinc-600 font-bold mt-1 uppercase">Tap for breakdown</p>
                </div>

                <div className="bg-zinc-950 border border-zinc-900 p-4 md:p-5 rounded-2xl">
                  <div className="flex justify-between items-start mb-3">
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">Items</p>
                    <Package size={16} className="text-zinc-800" />
                  </div>
                  <p className="text-2xl md:text-3xl font-black text-blue-500 italic">{totalStockItems}</p>
                  <p className="text-[9px] text-zinc-600 font-bold mt-1 uppercase">Units in stock</p>
                </div>
              </div>

              {/* ── REVENUE BREAKDOWN ── */}
              {showRevenueBreakdown && (
                <div className="bg-zinc-950 border border-orange-500/20 rounded-2xl p-5 animate-in slide-in-from-top-2 fade-in duration-200">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-sm font-black uppercase text-orange-500 flex items-center gap-2">
                      <BarChart2 size={14} /> Revenue Breakdown
                    </h3>
                    <button onClick={() => setShowRevenueBreakdown(false)} className="text-zinc-600 hover:text-white transition-colors p-1">
                      <X size={16} />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                    <div className="bg-black/50 border border-zinc-900 rounded-xl p-4">
                      <p className="text-[10px] font-black text-zinc-500 uppercase mb-1">Gross Revenue</p>
                      <p className="text-2xl font-black text-white">₦{grossRevenue.toLocaleString()}</p>
                      <p className="text-[9px] text-zinc-600 font-bold mt-0.5">Before discounts</p>
                    </div>
                    <div className="bg-red-500/8 border border-red-500/20 rounded-xl p-4">
                      <p className="text-[10px] font-black text-red-400 uppercase mb-1">Discount Deductions</p>
                      <p className="text-2xl font-black text-red-500">−₦{totalDiscountDeductions.toLocaleString()}</p>
                      <p className="text-[9px] text-zinc-600 font-bold mt-0.5">{ordersWithDiscount.length} discounted order{ordersWithDiscount.length !== 1 ? 's' : ''}</p>
                    </div>
                    <div className="bg-orange-500/8 border border-orange-500/20 rounded-xl p-4">
                      <p className="text-[10px] font-black text-orange-400 uppercase mb-1">Net Revenue</p>
                      <p className="text-2xl font-black text-orange-500">₦{netRevenue.toLocaleString()}</p>
                      <p className="text-[9px] text-zinc-600 font-bold mt-0.5">After all discounts</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <p className="text-[10px] font-black text-zinc-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                        <TrendingUp size={11} className="text-orange-500" /> Products Currently On Discount
                      </p>
                      {discountRankedProducts.length === 0 ? (
                        <div className="text-center py-6 border border-dashed border-zinc-800 rounded-xl">
                          <p className="text-xs text-zinc-600 font-bold uppercase">No products on discount</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {discountRankedProducts.map((p, idx) => (
                            <div key={p.id} className="flex items-center gap-3 bg-black/40 border border-zinc-900 rounded-xl px-3 py-2.5">
                              <div className="w-6 h-6 rounded-lg bg-orange-500/15 flex items-center justify-center flex-shrink-0">
                                <p className="text-[9px] font-black text-orange-500">#{idx + 1}</p>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold truncate text-white">{p.name}</p>
                                <p className="text-[9px] text-zinc-500 font-bold">{p.category} · Stock: {p.stock}</p>
                              </div>
                              <div className="flex-shrink-0 text-right">
                                <p className="text-sm font-black text-orange-500">{p.manual_discount}% OFF</p>
                                <p className="text-[9px] text-zinc-500">₦{Math.round(p.price * (1 - p.manual_discount / 100)).toLocaleString()}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-zinc-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                        <Tag size={11} className="text-purple-500" /> Promo Code Usage
                      </p>
                      {promoCodeRank.length === 0 ? (
                        <div className="text-center py-6 border border-dashed border-zinc-800 rounded-xl">
                          <p className="text-xs text-zinc-600 font-bold uppercase">No promo codes used yet</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {promoCodeRank.map((entry: any, idx) => (
                            <div key={entry.code} className="flex items-center gap-3 bg-black/40 border border-zinc-900 rounded-xl px-3 py-2.5">
                              <div className="w-6 h-6 rounded-lg bg-purple-500/15 flex items-center justify-center flex-shrink-0">
                                <p className="text-[9px] font-black text-purple-400">#{idx + 1}</p>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-black tracking-widest text-white">{entry.code}</p>
                                <p className="text-[9px] text-zinc-500 font-bold">{entry.uses} use{entry.uses !== 1 ? 's' : ''}</p>
                              </div>
                              <div className="flex-shrink-0 text-right">
                                <p className="text-sm font-black text-red-400">−₦{entry.totalSaved.toLocaleString()}</p>
                                <p className="text-[9px] text-zinc-500">saved by customers</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ── STOCK CATEGORY BREAKDOWN ── */}
              {showCategoryBreakdown && (
                <div className="bg-zinc-950 border border-green-500/20 rounded-2xl p-5 animate-in slide-in-from-top-2 fade-in duration-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-black uppercase text-green-500 flex items-center gap-2"><PackagePlus size={14} /> Stock by Category</h3>
                    <button onClick={() => setShowCategoryBreakdown(false)} className="text-zinc-600 hover:text-white transition-colors p-1"><X size={16} /></button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {stockByCategory.map((cat, idx) => (
                      <div key={cat.name} className="bg-black/40 border border-zinc-900 hover:border-green-500/25 p-4 rounded-xl transition-all">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-black uppercase text-white truncate">{cat.name}</p>
                            <p className="text-[9px] text-zinc-600 font-bold uppercase mt-0.5">{cat.productCount} product{cat.productCount !== 1 ? 's' : ''}</p>
                          </div>
                          <div className="bg-green-500/10 px-2 py-1 rounded-lg ml-2">
                            <p className="text-[9px] font-black text-green-500">#{idx + 1}</p>
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <div className="flex justify-between">
                            <span className="text-[9px] text-zinc-500 font-bold uppercase">Value</span>
                            <span className="text-base font-black text-green-500">₦{cat.totalValue.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between pt-1.5 border-t border-zinc-900">
                            <span className="text-[9px] text-zinc-500 font-bold uppercase">Stock</span>
                            <span className="text-sm font-black text-blue-500">{cat.totalItems} units</span>
                          </div>
                        </div>
                        <div className="mt-3 h-1 bg-zinc-900 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-green-500 to-emerald-400 transition-all duration-500"
                            style={{ width: `${totalStockValue > 0 ? (cat.totalValue / totalStockValue) * 100 : 0}%` }} />
                        </div>
                        <p className="text-[8px] text-zinc-600 font-bold mt-1 text-right">
                          {totalStockValue > 0 ? ((cat.totalValue / totalStockValue) * 100).toFixed(1) : 0}% of total
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── MAIN CONTENT GRID ── */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <div className="space-y-4">
                  <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-5">
                    <h2 className="text-xs font-black uppercase text-orange-500 mb-4 flex items-center gap-2"><PlusCircle size={12} /> Categories</h2>
                    <div className="flex gap-2 mb-3">
                      <input value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)}
                        placeholder="New category..."
                        onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                        className="flex-1 bg-black border border-zinc-800 rounded-xl px-3 py-2.5 text-xs font-black uppercase outline-none focus:border-orange-500 transition-all" />
                      <button onClick={handleAddCategory} className="bg-white text-black p-2.5 rounded-xl hover:bg-zinc-200 transition-all">
                        <Save size={14} />
                      </button>
                    </div>
                    <div className="space-y-1.5 max-h-36 overflow-y-auto mgr-scroll">
                      {categories.map(c => (
                        <div key={c.id} className="flex justify-between items-center bg-black/40 border border-zinc-900 px-3 py-2 rounded-xl hover:border-zinc-800 transition-all">
                          <span className="text-xs font-black uppercase text-white">{c.name}</span>
                          <button onClick={() => deleteCategory(c.id)} className="text-zinc-700 hover:text-red-500 transition-colors">
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}
                      {categories.length === 0 && <p className="text-xs text-zinc-700 font-bold uppercase text-center py-3">No categories yet</p>}
                    </div>
                  </div>

                  {msgs.map((m: any) => (
                    <div key={m.id} className="bg-zinc-950 border border-zinc-900 rounded-2xl p-4 relative group hover:border-zinc-700 transition-all">
                      <button onClick={async () => { if (confirm("Delete this message?")) { await supabase.from('messages').delete().eq('id', m.id); fetchManagerData(); } }}
                        className="absolute top-3 right-3 text-zinc-700 hover:text-red-500 transition-colors">
                        <Trash2 size={12} />
                      </button>
                      <div className="flex justify-between items-center mb-2 pr-5">
                        <span className="text-xs font-black text-white bg-zinc-900 px-2.5 py-1 rounded-full uppercase">{m.name}</span>
                        <span className="text-zinc-600 text-[10px] font-bold">{new Date(m.created_at).toLocaleDateString()}</span>
                      </div>
                      <p className="text-[10px] text-zinc-500 font-bold mb-2">{m.email}</p>
                      <div className="bg-black/40 border border-zinc-900 group-hover:border-orange-500/20 p-3 rounded-xl transition-all">
                        <p className="text-xs text-zinc-400 leading-relaxed italic">"{m.message}"</p>
                      </div>
                      <a href={`mailto:${m.email}?subject=Support`}
                        className="mt-2 inline-block text-xs font-black uppercase text-orange-500 hover:text-orange-400 transition-colors">
                        Reply to {m.name} →
                      </a>
                    </div>
                  ))}

                  <button onClick={() => setShowInventory(!showInventory)}
                    className="w-full py-3 bg-zinc-950 border border-zinc-900 hover:border-orange-500/30 rounded-2xl flex items-center justify-center gap-2.5 transition-all group">
                    <div className={`p-1 rounded-lg transition-colors ${showInventory ? 'bg-orange-500 text-black' : 'bg-zinc-800 text-zinc-500'}`}>
                      {showInventory ? <ChevronUp size={13} /> : <PackagePlus size={13} />}
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 group-hover:text-white transition-colors">
                      {showInventory ? 'Hide Inventory' : 'Manage Inventory'}
                    </span>
                  </button>
                </div>

                {/* Orders */}
                <div className="lg:col-span-2">
                  <div className="bg-zinc-950 border border-zinc-900 rounded-2xl overflow-hidden">
                    <div className="p-4 border-b border-zinc-900 flex items-center justify-between">
                      <h2 className="text-xs font-black uppercase text-white flex items-center gap-2">
                        <Clock size={12} className="text-orange-500" /> Sales — {orderTypeFilter}
                      </h2>
                      <span className="text-[9px] font-black text-zinc-600 bg-zinc-900 px-2 py-1 rounded-lg">{filteredOrders.length} orders</span>
                    </div>

                    {orders.filter(o => o.status === 'COMPLETED').length > 0 && (
                      <div className="px-4 py-2.5 bg-green-500/5 border-b border-green-500/10 flex items-center gap-2 flex-wrap">
                        <CheckCircle size={11} className="text-green-500 flex-shrink-0" />
                        <span className="text-[10px] font-black text-green-400 uppercase">Customer Confirmed:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {orders.filter(o => o.status === 'COMPLETED').map(order => (
                            <span key={order.id} className="bg-green-500/10 border border-green-500/15 text-green-400 text-[9px] font-black px-2 py-0.5 rounded-lg">
                              #{order.id} · ₦{(order.total_price || 0).toLocaleString()}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="divide-y divide-zinc-900 max-h-[600px] overflow-y-auto mgr-scroll">
                      {filteredOrders.length === 0 ? (
                        <div className="p-20 text-center">
                          <ShoppingBag size={32} className="text-zinc-800 mx-auto mb-3" />
                          <p className="text-xs font-black uppercase text-zinc-600">No orders found</p>
                        </div>
                      ) : (
                        filteredOrders.map(order => {
                          const isPickup = !order.address;
                          return (
                            <div key={order.id} className="p-4 hover:bg-white/[0.02] transition-colors">
                              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                                <div className="flex items-start gap-3">
                                  <div className="bg-black border border-zinc-800 px-2.5 py-1.5 rounded-lg flex-shrink-0">
                                    <p className="text-xs font-black">#{order.id}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm font-black italic uppercase text-white">{order.customer_name}</p>
                                    <p className="text-[10px] font-bold text-orange-400 mt-0.5 flex items-center gap-1">
                                      <Clock size={9} /> {formatOrderDateTime(order.created_at)}
                                    </p>
                                    {order.phone_number && <p className="text-[10px] text-green-500 font-bold mt-0.5">📞 {order.phone_number}</p>}
                                    <span className={`inline-block mt-1.5 px-2 py-0.5 rounded-md text-[9px] font-black uppercase ${isPickup ? 'bg-blue-600/15 text-blue-400' : 'bg-green-600/15 text-green-400'}`}>
                                      {isPickup ? '📦 Pickup' : '🚚 Delivery'}
                                    </span>
                                  </div>
                                </div>
                                <select value={order.status} onChange={(e) => updateStatus(order.id, e.target.value)}
                                  className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase border-none outline-none flex-shrink-0 $order.status === 'AWAITING_CONFIRMATION' ? 'bg-yellow-600/20 text-yellow-400' :
                                                                                                                                               order.status === 'CANCELLED' ? 'bg-red-600/20 text-red-500' : 'bg-green-600/20 text-green-500' : order.status === 'READY' ? 'bg-blue-600/20 text-blue-500' : order.status === 'PENDING' ? 'bg-orange-600/20 text-orange-500' : 'bg-zinc-800 text-zinc-400'}`}>
                                  {['AWAITING_CONFIRMATION','PENDING','PREPARING','READY','DONE','COMPLETED','CANCELLED'].map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                              </div>

                              <div className="bg-black/40 border border-zinc-900 p-3.5 rounded-xl">
                                <p className="text-[9px] font-black uppercase text-zinc-600 mb-1.5 tracking-wider">Items</p>
                                <p className="text-xs font-medium leading-relaxed text-zinc-300">{order.items}</p>
                                {order.discount_code && (
                                  <div className="flex items-center gap-2 mt-2 pt-2 border-t border-zinc-900">
                                    <Tag size={10} className="text-purple-500" />
                                    <span className="text-[9px] font-black text-purple-400 uppercase">{order.discount_code}</span>
                                    <span className="text-[9px] font-bold text-red-400">−₦{(order.discount_amount || 0).toFixed(0)} off</span>
                                  </div>
                                )}
                                <div className="flex justify-between items-center mt-2 pt-2 border-t border-zinc-900/50">
                                  <p className="text-xs font-black uppercase text-zinc-500">Total</p>
                                  <p className="text-base font-black italic text-orange-500">₦{order.total_price?.toLocaleString()}</p>
                                </div>
                              </div>

                              {showAddresses && !isPickup && (
                                <div className="flex items-start gap-2 mt-2.5 p-3 bg-orange-500/5 border border-orange-500/10 rounded-xl">
                                  <MapPin size={11} className="text-orange-500 flex-shrink-0 mt-0.5" />
                                  <div>
                                    <p className="text-[9px] font-black text-orange-400 uppercase tracking-wider mb-0.5">Delivery Address</p>
                                    <p className="text-xs font-bold text-white">{order.address}</p>
                                    {order.payment_method && <p className="text-[9px] text-zinc-500 mt-0.5">Via: {order.payment_method}</p>}
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
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ══ INVENTORY MODAL ══ */}
      {showInventory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
          <div className="bg-[#0a0a0a] border border-zinc-800 w-full max-w-5xl h-[88vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex-shrink-0 p-4 border-b border-zinc-800">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-black uppercase text-white flex items-center gap-2"><PackagePlus size={15} className="text-orange-500" /> Inventory</h2>
                <button onClick={() => setShowInventory(false)} className="text-zinc-500 hover:text-white transition-colors"><X size={18} /></button>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 flex-wrap">
                <input type="text" placeholder="Search products..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 bg-black border border-zinc-800 rounded-lg px-3 py-2 text-xs font-black uppercase outline-none focus:border-orange-500 transition-all" />
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
                  className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-black uppercase outline-none text-zinc-400">
                  <option value="DEFAULT">Sort By</option>
                  <option value="PRICE_LOW">Price: Low → High</option>
                  <option value="PRICE_HIGH">Price: High → Low</option>
                  <option value="STOCK_LOW">Stock: Low → High</option>
                  <option value="CATEGORY">Category A-Z</option>
                </select>
                <button onClick={handleSelectAll}
                  className="bg-zinc-800 hover:bg-zinc-700 text-white px-3 py-2 rounded-lg text-xs font-black uppercase transition-all whitespace-nowrap">
                  {selectedProducts.length === inventoryFilteredProducts.length && inventoryFilteredProducts.length > 0 ? 'Deselect All' : 'Select All'}
                </button>
                {selectedProducts.length > 0 && (
                  <button onClick={handleBulkDelete}
                    className="bg-red-600 hover:bg-red-500 text-white px-3 py-2 rounded-lg text-xs font-black uppercase transition-all whitespace-nowrap flex items-center gap-1.5">
                    <Trash2 size={11} /> Delete ({selectedProducts.length})
                  </button>
                )}
              </div>
              {selectedProducts.length > 0 && (
                <p className="text-[10px] font-bold text-red-400 mt-2">{selectedProducts.length} selected</p>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-4 mgr-scroll">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5">
                {inventoryFilteredProducts.map(p => {
                  const stock = p.stock || 0;
                  const isSoldOut = stock <= 0;
                  const isLowStock = stock > 0 && stock < 5;
                  const isSelected = selectedProducts.includes(p.id);
                  return (
                    <div key={p.id} className={`bg-black/50 p-2 rounded-xl border flex flex-col gap-1.5 hover:border-orange-500/40 transition-all ${isSelected ? 'border-red-500 bg-red-500/5' : isSoldOut ? 'border-red-900/40' : isLowStock ? 'border-yellow-900/40' : 'border-zinc-900'}`}>
                      <div className="flex items-center justify-between">
                        <input type="checkbox" checked={isSelected} onChange={() => toggleSelectProduct(p.id)} className="w-3.5 h-3.5 accent-red-500 cursor-pointer" />
                      </div>
                      <div className="relative aspect-square overflow-hidden rounded-lg group/img">
                        <img src={p.image || p.image_url || 'https://via.placeholder.com/400'} className="w-full h-full object-cover bg-zinc-900"
                          onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400?text=Error'; }} />
                        <div className={`absolute top-1 left-1 px-1.5 py-0.5 rounded text-[7px] font-black ${isSoldOut ? 'bg-red-600 text-white' : isLowStock ? 'bg-yellow-500 text-black' : 'bg-green-600 text-white'}`}>
                          {stock}
                        </div>
                        <input type="file" accept="image/*" id={`rep-${p.id}`} className="hidden" onChange={(e) => handleReplaceImageUrl(p.id, e)} />
                        <label htmlFor={`rep-${p.id}`} className="absolute inset-0 bg-black/80 opacity-0 group-hover/img:opacity-100 transition-all flex items-center justify-center cursor-pointer text-[8px] font-black gap-1">
                          <Upload size={10} /> Update
                        </label>
                      </div>
                      <div className="px-0.5">
                        <p className="text-[9px] font-black uppercase truncate text-white">{p.name}</p>
                        <p className="text-[9px] text-orange-500 font-bold">₦{(p.price || 0).toLocaleString()}</p>
                        {p.expiry_date && <ExpiryBadge expiryDate={p.expiry_date} />}
                        <div className="flex gap-1 mt-1.5">
                          <button onClick={() => openEditModal(p)} className="flex-1 bg-blue-600/80 hover:bg-blue-500 text-white px-1.5 py-1 rounded text-[8px] font-black uppercase transition-all">Edit</button>
                          <button onClick={() => deleteProduct(p.id)} className="p-1 text-zinc-600 hover:text-red-500 transition-colors">
                            <Trash2 size={10} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex-shrink-0 p-4 border-t border-zinc-800">
              <p className="text-[9px] font-black text-zinc-600 uppercase mb-2 text-center">Add New Product</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <input placeholder="Name" value={newName} onChange={e => setNewName(e.target.value)} className="bg-black border border-zinc-800 rounded-lg px-3 py-2 text-[10px] font-black uppercase outline-none focus:border-orange-500 transition-all" />
                <input placeholder="Price" type="number" value={newPrice} onChange={e => setNewPrice(e.target.value)} className="bg-black border border-zinc-800 rounded-lg px-3 py-2 text-[10px] font-black uppercase outline-none focus:border-orange-500 transition-all" />
                <input placeholder="Stock" type="number" value={newStock} onChange={e => setNewStock(e.target.value)} className="bg-black border border-zinc-800 rounded-lg px-3 py-2 text-[10px] font-black uppercase outline-none focus:border-orange-500 transition-all" />
                <select value={newCategory} onChange={e => setNewCategory(e.target.value)} className="bg-black border border-zinc-800 rounded-lg px-3 py-2 text-[10px] font-black uppercase outline-none focus:border-orange-500 transition-all">
                  <option value="">Category</option>
                  {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
                <div className="relative sm:col-span-2">
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" id="new-product-inv" />
                  <label htmlFor="new-product-inv" className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-[10px] font-black uppercase flex items-center justify-center gap-2 cursor-pointer hover:bg-zinc-800 transition-all">
                    <Upload size={10} /> {newProduct.image_url ? 'Uploaded ✓' : 'Upload Image'}
                  </label>
                </div>
              </div>
              <button onClick={handleAddProduct} className="w-full bg-orange-600 hover:bg-orange-500 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 mt-2">
                + Add to Inventory
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ EDIT MODAL ══ */}
      {showEditModal && editingProduct && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/95 backdrop-blur-sm">
          <div className="bg-[#0a0a0a] border border-zinc-800 w-full max-w-md max-h-[90vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex-shrink-0 p-5 border-b border-zinc-800 flex items-center justify-between">
              <h3 className="text-sm font-black uppercase text-white flex items-center gap-2"><Edit3 size={13} className="text-orange-500" /> Edit Product</h3>
              <button onClick={() => { setShowEditModal(false); setEditingProduct(null); }} className="text-zinc-500 hover:text-white transition-colors"><X size={18} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-3.5 mgr-scroll">
              <div>
                <label className="text-[10px] font-black text-zinc-500 uppercase mb-1.5 block">Product Name</label>
                <input type="text" value={editingProduct.name} onChange={(e) => handleEditChange('name', e.target.value)}
                  placeholder="PRODUCT NAME"
                  className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:border-orange-500 transition-all text-white" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Price (₦)', field: 'price' },
                  { label: 'Stock Qty', field: 'stock' },
                ].map(f => (
                  <div key={f.field}>
                    <label className="text-[10px] font-black text-zinc-500 uppercase mb-1.5 block">{f.label}</label>
                    <input type="number" value={editingProduct[f.field]} onChange={(e) => handleEditChange(f.field, e.target.value)}
                      className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:border-orange-500 transition-all text-white" />
                  </div>
                ))}
              </div>
              <div>
                <label className="text-[10px] font-black text-zinc-500 uppercase mb-1.5 block">Manual Discount (%)</label>
                <input type="number" min="0" max="100" value={editingProduct.manual_discount || 0}
                  onChange={(e) => handleEditChange('manual_discount', e.target.value)}
                  className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:border-orange-500 transition-all text-white" />
                <p className="text-[9px] text-zinc-600 mt-1">Set to 0 to remove. Auto-discount still applies if enabled.</p>
              </div>
              <div>
                <label className="text-[10px] font-black text-zinc-500 uppercase mb-1.5 block">Category</label>
                <select value={editingProduct.category} onChange={(e) => handleEditChange('category', e.target.value)}
                  className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:border-orange-500 transition-all text-white appearance-none">
                  <option value="">Select Category</option>
                  {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black text-zinc-500 uppercase mb-1.5 block">Expiry Date</label>
                <input type="date" value={editingProduct.expiry_date || ''} onChange={(e) => handleEditChange('expiry_date', e.target.value)}
                  className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:border-orange-500 transition-all text-white" />
                {editingProduct.expiry_date && <div className="mt-1"><ExpiryBadge expiryDate={editingProduct.expiry_date} /></div>}
              </div>
              {editingProduct.image_url && (
                <div>
                  <label className="text-[10px] font-black text-zinc-500 uppercase mb-1.5 block">Current Image</label>
                  <img src={editingProduct.image_url} alt="Product" className="w-full h-40 object-cover rounded-xl border border-zinc-800"
                    onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400?text=No+Image'; }} />
                </div>
              )}
            </div>
            <div className="flex-shrink-0 p-5 border-t border-zinc-800 flex gap-3">
              <button onClick={() => { setShowEditModal(false); setEditingProduct(null); }}
                className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white py-3 rounded-xl text-xs font-black uppercase transition-all">
                Cancel
              </button>
              <button onClick={handleSaveEdit}
                className="flex-1 bg-orange-600 hover:bg-orange-500 text-white py-3 rounded-xl text-xs font-black uppercase transition-all shadow-lg shadow-orange-500/20">
                💾 Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}