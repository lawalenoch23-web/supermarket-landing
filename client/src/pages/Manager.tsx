                    import React, { useState, useEffect } from 'react';
                    import { supabase } from '../supabaseClient';
                    import { 
                      Trash2, LayoutDashboard, PlusCircle, 
                      Save, Clock, MapPin, Calendar, PackagePlus, Edit3, DollarSign, ShoppingBag, AlertTriangle, Download 
                    } from 'lucide-react';

                    export default function Manager() {
                      // --- 1. STATE ---
                      const [orders, setOrders] = useState<any[]>([]);
                      const [categories, setCategories] = useState<any[]>([]);
                      const [products, setProducts] = useState<any[]>([]);
                      const [loading, setLoading] = useState(true);

                      const [newCategoryName, setNewCategoryName] = useState('');
                      const [newName, setNewName] = useState('');
                      const [newPrice, setNewPrice] = useState('');
                      const [newCategory, setNewCategory] = useState('');
                      const [newImage, setNewImage] = useState('');

                      // --- 2. ANALYTICS ---
                      const totalRevenue = orders.reduce((sum, order) => sum + (order.total_price || 0), 0);

                      // --- 3. DATA FETCH ---
                      const fetchManagerData = async () => {
                        setLoading(true);
                        try {
                          const { data: oData } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
                          if (oData) setOrders(oData);

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
                        if (!newName || !newPrice || !newCategory) return;
                        const { error } = await supabase.from('products').insert([{
                          name: newName.toUpperCase(),
                          price: parseFloat(newPrice),
                          category: newCategory,
                          image: newImage || 'https://via.placeholder.com/400'
                        }]);
                        if (!error) {
                          setNewName(''); setNewPrice(''); setNewImage('');
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
                        if (!confirm("Delete product?")) return;
                        const { error } = await supabase.from('products').delete().eq('id', id);
                        if (!error) fetchManagerData();
                      };

                      const handleDeleteAllOrders = async () => {
                        if (confirm("DANGER: Wipe all history?")) {
                          const { error } = await supabase.from('orders').delete().neq('id', 0);
                          if (!error) fetchManagerData();
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

                      const formatTime = (ts: string) => {
                        const d = new Date(ts);
                        return {
                          t: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                          day: d.toLocaleDateString([], { month: 'short', day: 'numeric' })
                        };
                      };

                      return (
                        <div className="min-h-screen bg-black text-white p-8 font-sans">
                          <div className="max-w-7xl mx-auto">

                            <header className="mb-12 border-b border-zinc-900 pb-8">
                              <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-4">
                                  <LayoutDashboard className="text-orange-500" size={32} />
                                  <h1 className="text-3xl font-black italic uppercase tracking-tighter">Inventory & Sales</h1>
                                </div>
                                <div className="flex gap-3">
                                  <button onClick={exportCSV} className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 px-4 py-2 rounded-xl text-[9px] font-black uppercase hover:bg-white hover:text-black transition-all">
                                    <Download size={14} /> Export CSV
                                  </button>
                                  <button onClick={handleDeleteAllOrders} className="flex items-center gap-2 bg-red-900/20 text-red-500 px-4 py-2 rounded-xl text-[9px] font-black uppercase hover:bg-red-600 hover:text-white transition-all">
                                    <AlertTriangle size={14} /> Clear History
                                  </button>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-zinc-950 border border-zinc-900 p-6 rounded-3xl flex items-center justify-between">
                                  <div>
                                    <p className="text-[10px] font-black text-zinc-500 uppercase mb-1">Total Revenue</p>
                                    <p className="text-3xl font-black text-orange-500 italic">${totalRevenue.toFixed(2)}</p>
                                  </div>
                                  <DollarSign className="text-zinc-800" size={40} />
                                </div>
                                <div className="bg-zinc-950 border border-zinc-900 p-6 rounded-3xl flex items-center justify-between">
                                  <div>
                                    <p className="text-[10px] font-black text-zinc-500 uppercase mb-1">Total Orders</p>
                                    <p className="text-3xl font-black text-white italic">{orders.length}</p>
                                  </div>
                                  <ShoppingBag className="text-zinc-800" size={40} />
                                </div>
                              </div>
                            </header>

                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

                              <div className="lg:col-span-4 space-y-8">
                                {/* CATEGORIES */}
                                <section className="bg-zinc-950 border border-zinc-900 p-8 rounded-[2.5rem]">
                                  <h2 className="text-xs font-black uppercase text-orange-500 mb-6 flex items-center gap-2">
                                    <PlusCircle size={14}/> Categories
                                  </h2>
                                  <div className="flex gap-2 mb-6">
                                    <input value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="NAME..." className="flex-1 bg-black border border-zinc-800 rounded-xl px-4 py-3 text-[10px] font-black uppercase outline-none focus:border-orange-500" />
                                    <button onClick={handleAddCategory} className="bg-white text-black p-3 rounded-xl"><Save size={18} /></button>
                                  </div>
                                  <div className="space-y-2 max-h-40 overflow-y-auto no-scrollbar">
                                    {categories.map(c => (
                                      <div key={c.id} className="flex justify-between items-center bg-black/40 border border-zinc-900 px-4 py-3 rounded-xl">
                                        <span className="text-[9px] font-black uppercase">{c.name}</span>
                                        <button onClick={() => deleteCategory(c.id)} className="text-zinc-800 hover:text-red-500"><Trash2 size={14} /></button>
                                      </div>
                                    ))}
                                  </div>
                                </section>

                                {/* PRODUCT ADD */}
                                <section className="bg-zinc-950 border border-zinc-900 p-8 rounded-[2.5rem]">
                                  <h2 className="text-xs font-black uppercase text-zinc-500 mb-6 flex items-center gap-2">
                                    <PackagePlus size={14}/> Add Product
                                  </h2>
                                  <div className="space-y-3 mb-8">
                                    <input placeholder="NAME" value={newName} onChange={e => setNewName(e.target.value)} className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-[10px] font-black uppercase outline-none focus:border-orange-500" />
                                    <input placeholder="PRICE" type="number" value={newPrice} onChange={e => setNewPrice(e.target.value)} className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-[10px] font-black uppercase outline-none focus:border-orange-500" />
                                    <input placeholder="IMAGE URL" value={newImage} onChange={e => setNewImage(e.target.value)} className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-[10px] font-black uppercase outline-none focus:border-orange-500" />
                                    <select value={newCategory} onChange={e => setNewCategory(e.target.value)} className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-[10px] font-black uppercase">
                                      <option value="">CATEGORY</option>
                                      {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                    </select>
                                    <button onClick={handleAddProduct} className="w-full bg-orange-600 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-orange-500">Update Inventory</button>
                                  </div>

                                  <div className="space-y-2 max-h-64 overflow-y-auto no-scrollbar">
                                    {products.map(p => (
                                      <div key={p.id} className="flex justify-between items-center bg-black/40 p-4 rounded-2xl border border-zinc-900">
                                        <div className="flex items-center gap-3">
                                          <img src={p.image} className="w-8 h-8 rounded-lg object-cover bg-zinc-800" alt="" />
                                          <div>
                                            <p className="text-[10px] font-black uppercase">{p.name}</p>
                                            <p className="text-[9px] text-orange-500 font-bold">${p.price}</p>
                                          </div>
                                        </div>
                                        <div className="flex gap-2">
                                          <button onClick={() => updatePrice(p.id)} className="text-zinc-800 hover:text-white"><Edit3 size={14}/></button>
                                          <button onClick={() => deleteProduct(p.id)} className="text-zinc-800 hover:text-red-500"><Trash2 size={14} /></button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </section>
                              </div>

                              <div className="lg:col-span-8 space-y-6">
                                <h2 className="text-xs font-black uppercase text-zinc-500 mb-6 flex items-center gap-2">
                                  <Clock size={14}/> Recent Sales
                                </h2>
                                <div className="grid gap-6">
                                  {orders.map((order) => {
                                    const { t, day } = formatTime(order.created_at);
                                    return (
                                      <div key={order.id} className="bg-zinc-950 border border-zinc-900 p-8 rounded-[3.5rem]">
                                        <div className="flex justify-between items-start mb-6">
                                          <div>
                                            <h3 className="text-xl font-black uppercase italic mb-1">{order.customer_name || "Guest"}</h3>
                                            <div className="flex flex-wrap items-center gap-3 text-[9px] font-bold text-zinc-500 uppercase tracking-widest">
                                              <span className="flex items-center gap-1 text-orange-500"><Calendar size={12}/> {day}</span>
                                              <span className="flex items-center gap-1 text-orange-500"><Clock size={12}/> {t}</span>
                                              <span className="flex items-center gap-1 text-zinc-600"><MapPin size={12}/> {order.address || "No Address"}</span>
                                            </div>
                                          </div>
                                          <div className="text-2xl font-black text-white italic">${(order.total_price || 0).toFixed(2)}</div>
                                        </div>
                                        <div className="bg-black/50 border border-zinc-900 rounded-3xl p-6">
                                          <p className="text-[11px] text-zinc-400 font-medium tracking-wide uppercase mb-1">Items:</p>
                                          <p className="text-[13px] text-zinc-200 italic">{order.items || "N/A"}</p>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>

                            </div>
                          </div>
                        </div>
                      );
                    }