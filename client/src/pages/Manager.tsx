import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { 
  Trash2, LayoutDashboard, PlusCircle, 
  Save, Clock, MapPin, Calendar, PackagePlus, Edit3, DollarSign, ShoppingBag, AlertTriangle, Download, Upload, ChevronDown, ChevronUp, X
} from 'lucide-react';

export default function Manager() {
  // --- 1. STATE ---
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
  const [showAddresses, setShowAddresses] = useState(false);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('ALL_TIME');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('DEFAULT');
  const [showInventory, setShowInventory] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: '',
    image_url: '',
    category: ''
  });

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

    return matchesStatus && matchesDate;
  });

  const totalRevenue = filteredOrders.reduce((sum, order) => sum + (order.total_price || 0), 0);

  // --- 3. DATA FETCH ---
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
    } catch (err) {
      console.error("Sync Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchManagerData();
    const channel = supabase.channel('manager-stable-view')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchManagerData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, fetchManagerData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, fetchManagerData)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

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
      image: newProduct.image_url
    }]);

    if (error) {
      console.error("Supabase Error:", error);
      alert("Upload failed: " + error.message);
    } else {
      setNewName(''); 
      setNewPrice(''); 
      setNewCategory('');
      setNewProduct({ name: '', price: '', image_url: '', category: '' });
      alert("Product added successfully!");
      fetchManagerData();
    }
  };

  const updatePrice = async (id: number) => {
    const p = prompt("Enter new price:");
    if (p && !isNaN(parseFloat(p))) {
      const { error } = await supabase.from('products').update({ price: parseFloat(p) }).eq('id', id);
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
    const headers = "Date,Customer,Items,Total,Address\n";
    const rows = orders.map(o => `${o.created_at},${o.customer_name},"${o.items}",${o.total_price},"${o.address}"`).join("\n");
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
              </div>
            </div>

            {/* FILTERS */}
            <div className="space-y-3 mb-6">
              <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
                {['ALL', 'PENDING', 'PREPARING', 'READY', 'DONE'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={`px-4 py-2 rounded-full text-xs font-black transition-all whitespace-nowrap ${
                      filterStatus === status 
                        ? 'bg-orange-500 text-black' 
                        : 'bg-zinc-900 text-zinc-500 hover:bg-zinc-800'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>

              <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar border-t border-zinc-800/30 pt-3">
                {[
                  { id: '24H', label: 'LAST 24 HOURS' },
                  { id: 'WEEK', label: 'LAST WEEK' },
                  { id: 'MONTH', label: 'LAST MONTH' },
                  { id: 'YEAR', label: 'LAST YEAR' },
                  { id: 'ALL_TIME', label: 'ALL TIME' }
                ].map((range) => (
                  <button
                    key={range.id}
                    onClick={() => setDateFilter(range.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                      dateFilter === range.id 
                        ? 'bg-white text-black' 
                        : 'bg-zinc-900/50 text-zinc-600 hover:text-zinc-400'
                    }`}
                  >
                    {range.label}
                  </button>
                ))}
              </div>
            </div>

            {/* STATS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-zinc-950 border border-zinc-900 p-5 rounded-2xl flex items-center justify-between">
                <div>
                  <p className="text-xs font-black text-zinc-500 uppercase mb-1">Filtered Revenue</p>
                  <p className="text-2xl md:text-3xl font-black text-orange-500 italic">₦{totalRevenue.toLocaleString()}</p>
                </div>
                <DollarSign className="text-zinc-800" size={36} />
              </div>
              <div className="bg-zinc-950 border border-zinc-900 p-5 rounded-2xl flex items-center justify-between">
                <div>
                  <p className="text-xs font-black text-zinc-500 uppercase mb-1">Orders Count</p>
                  <p className="text-2xl md:text-3xl font-black text-white italic">{filteredOrders.length}</p>
                </div>
                <ShoppingBag className="text-zinc-800" size={36} />
              </div>
            </div>
          </header>

          {/* MAIN CONTENT GRID */}
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
                    <Clock size={12} className="text-orange-500"/> Recent Sales
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
                          {showAddresses && order.address && (
                            <div className="flex items-start gap-2 p-3 bg-orange-500/5 border border-orange-500/10 rounded-xl">
                              <MapPin size={12} className="text-orange-500 shrink-0 mt-0.5" />
                              <div>
                                <p className="text-xs font-black text-orange-500 uppercase tracking-widest mb-1">Destination</p>
                                <p className="text-xs font-bold italic leading-tight">{order.address}</p>
                              </div>
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
                    if (sortBy === 'CATEGORY') return (a.category || '').localeCompare(b.category || '');
                    return 0;
                  })
                  .map(p => (
                    <div key={p.id} className="bg-black/40 p-2 rounded-lg border border-zinc-900 flex flex-col gap-1.5 group hover:border-orange-500/50 transition-all">
                      <div className="relative group/img aspect-square overflow-hidden rounded-md">
                        <img 
                          src={p.image || p.image_url || 'https://via.placeholder.com/400'} 
                          className="w-full h-full object-cover bg-zinc-900"
                          onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400?text=Error'; }}
                        />
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
                        <div className="flex justify-between items-center">
                          <p className="text-[9px] text-orange-500 font-bold">₦{p.price.toLocaleString()}</p>
                          <div className="flex gap-1.5">
                            <button onClick={() => updatePrice(p.id)} className="text-zinc-600 hover:text-white transition-colors">
                              <Edit3 size={10}/>
                            </button>
                            <button onClick={() => deleteProduct(p.id)} className="text-zinc-600 hover:text-red-500 transition-colors">
                              <Trash2 size={10} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
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
                <select 
                  value={newCategory} 
                  onChange={e => setNewCategory(e.target.value)} 
                  className="bg-black border border-zinc-800 rounded-lg px-3 py-2 text-[10px] font-black uppercase"
                >
                  <option value="">CATEGORY</option>
                  {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>

                <div className="relative">
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
    </>
  );
}