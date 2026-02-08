            import React, { useState, useEffect, useRef } from 'react';

            // Explicitly defined interface to prevent TypeScript build warnings
            interface Snack {
              id: number;
              name: string;
              category: string;
              price: number;
              image: string;
              favorite?: boolean;
            }

            export default function Home() {
              const [cart, setCart] = useState<Snack[]>([]);
              const [showCheckout, setShowCheckout] = useState(false);
              const [orderStatus, setOrderStatus] = useState<'shopping' | 'success'>('shopping');
              const [filter, setFilter] = useState('All');
              const [isProcessing, setIsProcessing] = useState(false);
              const [lastTotal, setLastTotal] = useState(0);
              const lettersRef = useRef<HTMLDivElement>(null);

              useEffect(() => {
                let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
                if (!link) {
                  link = document.createElement('link');
                  link.rel = 'icon';
                  document.getElementsByTagName('head')[0].appendChild(link);
                }
                link.href = `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">${orderStatus === 'success' ? '🤝' : showCheckout ? '💳' : '🧺'}</text></svg>`;
                document.title = orderStatus === 'success' ? "Order Confirmed" : showCheckout ? "Checkout" : "Grandpa's Market";
              }, [showCheckout, orderStatus]);

              const handleCheckout = (e: React.FormEvent) => {
                e.preventDefault();
                setIsProcessing(true);
                setLastTotal(cart.reduce((sum, item) => sum + item.price, 0));
                setTimeout(() => {
                  setIsProcessing(false);
                  setOrderStatus('success');
                  setCart([]);
                }, 1500);
              };

              const mySnacks: Snack[] = [
                { id: 1, name: "Artisan Pizza", category: "Junk Food", price: 14.99, image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600", favorite: true },
                { id: 2, name: "Crispy Fries", category: "Junk Food", price: 4.50, image: "https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?w=600" },
                { id: 3, name: "Glazed Donuts", category: "Junk Food", price: 10.00, image: "https://images.unsplash.com/photo-1551024601-bec78aea704b?w=600", favorite: true },
                { id: 4, name: "Milk Chocolate", category: "Junk Food", price: 2.50, image: "https://images.unsplash.com/photo-1614088685112-0a760b71a3c8?w=600" },
                { id: 5, name: "Gold Cupcake", category: "Bakery", price: 3.99, image: "https://images.unsplash.com/photo-1576618148400-f54bed99fcfd?w=600", favorite: true },
                { id: 6, name: "Pressed Juice", category: "Drinks", price: 5.50, image: "https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=600" },
                { id: 7, name: "Organic Apple", category: "Produce", price: 2.99, image: "https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?w=600" },
                { id: 8, name: "Double Burger", category: "Junk Food", price: 12.50, image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600" }
              ];

              if (orderStatus === 'success') {
                return (
                  <div className="min-h-screen bg-black flex items-center justify-center p-6">
                    <div className="bg-zinc-900 border border-orange-500/20 p-10 rounded-[2rem] text-center max-w-sm">
                      <div className="text-4xl mb-4">🤝</div>
                      <h2 className="text-xl font-black text-white italic tracking-tighter uppercase mb-4">Honorably Received.</h2>
                      <p className="text-zinc-500 text-[10px] font-bold mb-8">Your order is being hand-selected. Total: ${lastTotal.toFixed(2)}</p>
                      <button onClick={() => setOrderStatus('shopping')} className="w-full bg-white text-black py-3 rounded-lg font-black uppercase text-[9px] tracking-widest hover:bg-orange-500 hover:text-white transition-all">Continue Shopping</button>
                    </div>
                  </div>
                );
              }

              return (
                <div className="min-h-screen bg-[#050505] text-white flex flex-col font-sans selection:bg-orange-500/30">
                  <nav className="border-b border-zinc-900/50 bg-black/80 backdrop-blur-md sticky top-0 z-50 px-6 py-4">
                    <div className="max-w-6xl mx-auto flex justify-between items-center">
                      <div onClick={() => {setShowCheckout(false); setFilter('All');}} className="cursor-pointer">
                        <h1 className="text-lg font-black italic tracking-tighter uppercase leading-none">GRANDPA'S<span className="text-orange-500">.</span></h1>
                        <p className="text-[7px] font-black tracking-[0.4em] text-zinc-700 uppercase">Est. 1954</p>
                      </div>
                      <button onClick={() => setShowCheckout(!showCheckout)} className="bg-zinc-100 text-black px-4 py-1.5 rounded-full text-[8px] font-black tracking-widest hover:bg-orange-500 hover:text-white transition-all">
                         BAG ({cart.length})
                      </button>
                    </div>
                  </nav>

                  <main className="flex-grow max-w-6xl mx-auto w-full p-6">
                    {!showCheckout ? (
                      <>
                        <div className="mb-10 mt-2">
                          <h2 className="text-3xl font-black italic tracking-tighter uppercase leading-none mb-3">Curated <br/><span className="text-zinc-800">With Love.</span></h2>
                          <p className="text-zinc-700 text-[8px] font-black uppercase tracking-[0.5em]">The Neighborhood Promise.</p>
                        </div>

                        <div className="flex gap-2 mb-8 overflow-x-auto pb-2 no-scrollbar">
                          {["All", "Junk Food", "Produce", "Bakery", "Drinks"].map(cat => (
                            <button key={cat} onClick={() => setFilter(cat)} className={`px-4 py-2 rounded-lg border text-[8px] font-black transition-all uppercase tracking-[0.2em] ${filter === cat ? 'bg-orange-600 border-orange-600 text-white' : 'bg-transparent border-zinc-900 text-zinc-600 hover:border-zinc-700'}`}>
                              {cat}
                            </button>
                          ))}
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {mySnacks.filter(s => filter === 'All' || s.category === filter).map((snack) => (
                            <div key={snack.id} className="group relative bg-zinc-950/50 rounded-2xl border border-zinc-900 overflow-hidden hover:border-orange-500/20 transition-all duration-500">
                              <div className="h-32 bg-zinc-900 overflow-hidden">
                                <img src={snack.image} className="w-full h-full object-cover grayscale-[0.3] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700" alt={snack.name} />
                              </div>
                              <div className="p-4">
                                <p className="text-[7px] font-black uppercase text-zinc-600 mb-1">{snack.category}</p>
                                <div className="mb-3">
                                  {/* Name first, Price directly under */}
                                  <p className="text-[10px] font-black uppercase italic text-white leading-tight">{snack.name}</p>
                                  <p className="text-[11px] font-black text-orange-500 italic mt-0.5">${snack.price.toFixed(2)}</p>
                                </div>
                                <button onClick={() => setCart([...cart, snack])} className="w-full bg-zinc-900 text-zinc-500 py-2 rounded-md font-black text-[8px] hover:bg-white hover:text-black transition-all uppercase tracking-widest border border-zinc-800">Add to Bag</button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <div className="max-w-xs mx-auto bg-zinc-950 p-6 rounded-[2rem] border border-zinc-900 mt-4">
                        <h2 className="text-xl font-black mb-6 italic text-white text-center uppercase">Checkout</h2>
                        <form onSubmit={handleCheckout} className="space-y-3">
                          <input required placeholder="NAME" className="w-full bg-black border border-zinc-900 p-3.5 rounded-lg text-[8px] font-black outline-none focus:border-orange-500/50 uppercase text-white" />
                          <div className="bg-black/50 p-4 rounded-xl border border-zinc-900">
                            <div className="flex justify-between font-black text-lg italic text-white">
                              <span>TOTAL</span><span className="text-orange-500">${cart.reduce((sum, item) => sum + item.price, 0).toFixed(2)}</span>
                            </div>
                          </div>
                          <button type="submit" disabled={isProcessing} className="w-full font-black py-3.5 rounded-lg text-[9px] uppercase tracking-[0.3em] bg-white text-black hover:bg-orange-600 hover:text-white transition-all">
                            {isProcessing ? "Verifying..." : "Confirm Payment"}
                          </button>
                          <button type="button" onClick={() => setShowCheckout(false)} className="w-full text-zinc-700 text-[8px] font-black uppercase text-center hover:text-white">Cancel</button>
                        </form>
                      </div>
                    )}
                  </main>

                  <footer className="bg-black border-t border-zinc-900/50 py-10 px-8 text-center">
                    <div className="text-[7px] text-zinc-900 font-black uppercase tracking-[0.8em]">GRANDPA'S LEGACY • EST 1954</div>
                  </footer>
                </div>
              );
            }