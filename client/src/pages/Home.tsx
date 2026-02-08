import React, { useState, useEffect, useRef } from 'react';

export default function Home() {
  const [cart, setCart] = useState<any[]>([]);
  const [showCheckout, setShowCheckout] = useState(false);
  const [orderStatus, setOrderStatus] = useState<'shopping' | 'success'>('shopping');
  const [filter, setFilter] = useState('All');
  const [isProcessing, setIsProcessing] = useState(false);
  const lettersRef = useRef<HTMLDivElement>(null);

  // 💎 DYNAMIC FAVICON & TITLE SYSTEM
  useEffect(() => {
    const link = document.querySelector("link[rel~='icon']") as HTMLLinkElement || document.createElement('link');
    link.rel = 'icon';
    if (orderStatus === 'success') {
      link.href = 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🤝</text></svg>';
      document.title = "Order Confirmed | Grandpa's";
    } else if (showCheckout) {
      link.href = 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>💳</text></svg>';
      document.title = "Secure Checkout | Grandpa's";
    } else {
      link.href = 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🧺</text></svg>';
      document.title = "Grandpa's | Legacy Market";
    }
    document.getElementsByTagName('head')[0].appendChild(link);
  }, [showCheckout, orderStatus]);

  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setOrderStatus('success');
      setCart([]);
    }, 1800);
  };

  const scrollToLetters = () => {
    lettersRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const mySnacks = [
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
      <div className="min-h-screen bg-black flex items-center justify-center p-6 text-center">
        <div className="bg-zinc-900 border border-orange-500/20 p-12 rounded-[3rem] max-w-lg shadow-2xl">
          <div className="text-6xl mb-6">🤝</div>
          <h2 className="text-3xl font-black text-white italic tracking-tighter mb-4 uppercase">Honorably Received.</h2>
          <p className="text-zinc-500 text-xs font-bold leading-loose mb-10 max-w-xs mx-auto">Grandpa's legacy is on the way. Your order has been hand-selected with care.</p>
          <button onClick={() => setOrderStatus('shopping')} className="bg-white text-black px-10 py-4 rounded-xl font-black uppercase tracking-widest hover:bg-orange-500 hover:text-white transition-all">Back to Market</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col font-sans">
      <nav className="border-b border-zinc-900 bg-black/80 backdrop-blur-md sticky top-0 z-50 px-6 py-5">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div onClick={() => {setShowCheckout(false); setFilter('All');}} className="cursor-pointer group">
            <h1 className="text-2xl font-black italic text-white tracking-tighter uppercase leading-none">GRANDPA'S<span className="text-orange-500">.</span></h1>
            <p onClick={(e) => {e.stopPropagation(); scrollToLetters();}} className="text-[9px] font-black tracking-[0.3em] text-zinc-600 uppercase hover:text-orange-500 transition-colors">Since 1954</p>
          </div>
          <button onClick={() => setShowCheckout(!showCheckout)} className="bg-zinc-100 text-black px-6 py-2 rounded-full text-[10px] font-black tracking-widest hover:bg-orange-500 hover:text-white transition-all">
             BAG ({cart.length})
          </button>
        </div>
      </nav>

      <main className="flex-grow max-w-6xl mx-auto w-full p-6">
        {!showCheckout ? (
          <>
            <div className="mb-16 mt-4 text-left">
              <h2 className="text-5xl md:text-6xl font-black italic tracking-tighter uppercase leading-none mb-4">Curated <br/><span className="text-zinc-800">With Love.</span></h2>
              <p className="text-zinc-600 text-[10px] font-black uppercase tracking-[0.4em]">Serving the neighborhood honestly for 70 years.</p>
            </div>

            <div className="flex gap-3 mb-12 overflow-x-auto pb-2 no-scrollbar">
              {["All", "Junk Food", "Produce", "Bakery", "Drinks"].map(cat => (
                <button key={cat} onClick={() => setFilter(cat)} className={`px-8 py-3 rounded-xl border text-[10px] font-black transition-all uppercase tracking-[0.2em] ${filter === cat ? 'bg-orange-600 border-orange-600 text-white' : 'bg-transparent border-zinc-800 text-zinc-500 hover:text-white'}`}>
                  {cat}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-24">
              {(filter === 'All' ? mySnacks : mySnacks.filter(i => i.category === filter)).map((snack) => (
                <div key={snack.id} className="group relative bg-zinc-900/20 rounded-[2rem] border border-zinc-900 overflow-hidden hover:border-orange-500/30 transition-all duration-500">
                  {snack.favorite && (
                    <div className="absolute top-4 right-4 z-10 bg-orange-500 text-black text-[7px] font-black px-2 py-1 rounded-full uppercase tracking-tighter shadow-xl">Grandpa's Pick</div>
                  )}
                  <div className="h-40 overflow-hidden bg-zinc-800">
                    <img src={snack.image} className="w-full h-full object-cover grayscale-[0.3] group-hover:grayscale-0 group-hover:scale-110 transition-all duration-700" alt={snack.name} />
                  </div>
                  <div className="p-5">
                    <h3 className="text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-2">{snack.category}</h3>
                    <div className="flex justify-between items-end">
                      <p className="text-sm font-black uppercase italic text-white leading-tight w-2/3">{snack.name}</p>
                      <p className="text-lg font-black text-orange-500 italic">${snack.price.toFixed(0)}</p>
                    </div>
                    <button onClick={() => setCart([...cart, snack])} className="w-full mt-4 bg-zinc-900 text-white py-3 rounded-xl font-black text-[10px] hover:bg-white hover:text-black transition-all uppercase tracking-widest border border-zinc-800">Add to Bag</button>
                  </div>
                </div>
              ))}
            </div>

            <section ref={lettersRef} className="mb-24 border-t border-zinc-900 pt-16">
              <h3 className="text-center text-[10px] font-black uppercase tracking-[0.5em] text-orange-500 mb-10 italic">Neighborhood Letters</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-zinc-900/30 p-8 rounded-[2.5rem] border border-zinc-800">
                  <div className="text-orange-500 mb-4 text-xs">★★★★★</div>
                  <p className="text-zinc-400 text-sm font-medium leading-relaxed italic mb-6">"It's rare to find a business that balances high-end technology with such a warm, personal touch. Grandpa would be beaming."</p>
                  <p className="text-white text-[9px] font-black uppercase tracking-[0.2em]">🤍 Julian H., Neighbor</p>
                </div>
                <div className="bg-zinc-900/30 p-8 rounded-[2.5rem] border border-zinc-800">
                  <div className="text-orange-500 mb-4 text-xs">★★★★★</div>
                  <p className="text-zinc-400 text-sm font-medium leading-relaxed italic mb-6">"This isn't just a business; it's a living promise. The care they put into selecting these snacks reminds me of a handshake deal."</p>
                  <p className="text-white text-[9px] font-black uppercase tracking-[0.2em]">🤍 Sarah M., Loyal Member</p>
                </div>
              </div>
            </section>
          </>
        ) : (
          <div className="max-w-md mx-auto bg-zinc-900 p-8 rounded-[3rem] border border-zinc-800 shadow-2xl mt-4">
            <h2 className="text-3xl font-black mb-8 italic text-white text-center tracking-tighter uppercase">Checkout</h2>
            <form onSubmit={handleCheckout} className="space-y-6">
              <input required placeholder="FULL NAME" className="w-full bg-black border border-zinc-800 p-5 rounded-2xl text-[10px] font-black outline-none focus:border-orange-500 uppercase tracking-widest text-white" />
              <input required placeholder="ADDRESS" className="w-full bg-black border border-zinc-800 p-5 rounded-2xl text-[10px] font-black outline-none focus:border-orange-500 uppercase tracking-widest text-white" />
              <div className="bg-black/50 p-6 rounded-[2rem] border border-zinc-800">
                <div className="flex justify-between font-black text-2xl italic tracking-tighter text-white">
                  <span>TOTAL</span><span className="text-orange-500">${cart.reduce((sum, item) => sum + item.price, 0).toFixed(2)}</span>
                </div>
              </div>
              <button type="submit" disabled={isProcessing} className={`w-full font-black py-5 rounded-xl text-[11px] transition-all uppercase tracking-[0.3em] ${isProcessing ? 'bg-zinc-800 text-zinc-500 cursor-wait' : 'bg-white text-black hover:bg-orange-600'}`}>
                {isProcessing ? "Verifying Legacy..." : "Confirm & Pay"}
              </button>
              <button type="button" onClick={() => setShowCheckout(false)} className="w-full text-zinc-600 text-[10px] mt-4 font-black uppercase tracking-widest text-center hover:text-white">Cancel</button>
            </form>
          </div>
        )}
      </main>

      <footer className="bg-black border-t border-zinc-900 pt-20 pb-12 px-8">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 mb-16">
          <div>
            <h4 className="text-white font-black italic text-2xl mb-4 uppercase tracking-tighter leading-none">GRANDPA'S<span className="text-orange-500">.</span></h4>
            <p className="text-[10px] text-zinc-600 uppercase font-black tracking-[0.2em] leading-loose">We deliver more than just groceries; we deliver a legacy of care that spans generations.</p>
          </div>
          <div>
            <h5 className="text-white text-[11px] font-black uppercase tracking-[0.3em] mb-6">Philosophy</h5>
            <p className="text-zinc-600 text-[9px] font-black uppercase tracking-widest mb-3 hover:text-white cursor-default">Honorable Sourcing</p>
            <p className="text-zinc-600 text-[9px] font-black uppercase tracking-widest hover:text-white cursor-default">Community Focus</p>
          </div>
          <div className="text-right">
             <h5 className="text-white text-[11px] font-black uppercase tracking-[0.3em] mb-6">Legacy</h5>
             <p className="text-zinc-600 text-[9px] font-black uppercase tracking-widest italic leading-relaxed">"Always Fresh, <br/>Always Family."</p>
          </div>
        </div>
        <div className="text-center pt-8 border-t border-zinc-900 text-[9px] text-zinc-800 font-black uppercase tracking-[0.6em]">
           GRANDPA'S MARKET • EST 1954
        </div>
      </footer>
    </div>
  );
}