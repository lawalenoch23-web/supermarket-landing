import React, { useState } from 'react';

interface Snack {
  id: number;
  name: string;
  category: string;
  price: number;
  image: string;
}

export default function Home() {
  const [cart, setCart] = useState<Snack[]>([]);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [showCheckout, setShowCheckout] = useState(false);
  const [orderStatus, setOrderStatus] = useState<'shopping' | 'success'>('shopping');
  const [filter, setFilter] = useState('All');
  const [lastTotal, setLastTotal] = useState(0);
  const [addedId, setAddedId] = useState<number | null>(null);
  const [currentOrderId, setCurrentOrderId] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [storeName, setStoreName] = useState('Local Market');
  const [hideTools, setHideTools] = useState(false);

  // LEAD FORM STATE
  const [clientName, setClientName] = useState('');

  const mySnacks: Snack[] = [
    { id: 1, name: "Artisan Pizza", category: "Junk Food", price: 14.99, image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600" },
    { id: 2, name: "Crispy Fries", category: "Junk Food", price: 4.50, image: "https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?w=600" },
    { id: 3, name: "Glazed Donuts", category: "Junk Food", price: 10.00, image: "https://images.unsplash.com/photo-1551024601-bec78aea704b?w=600" },
    { id: 4, name: "Milk Chocolate", category: "Junk Food", price: 2.50, image: "https://images.unsplash.com/photo-1614088685112-0a760b71a3c8?w=600" },
    { id: 5, name: "Gold Cupcake", category: "Bakery", price: 3.99, image: "https://images.unsplash.com/photo-1576618148400-f54bed99fcfd?w=600" },
    { id: 6, name: "Pressed Juice", category: "Drinks", price: 5.50, image: "https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=600" },
    { id: 7, name: "Organic Apple", category: "Produce", price: 2.99, image: "https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?w=600" },
    { id: 8, name: "Double Burger", category: "Junk Food", price: 12.50, image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600" }
  ];

  const handleDemoRequest = (e: React.FormEvent) => {
    e.preventDefault();
    const subject = encodeURIComponent(`Legacy Partnership Inquiry: ${clientName}`);
    const body = encodeURIComponent(`Hi, I'm interested in a digital storefront for my market. Let's talk about Grandad's vision.`);
    window.location.href = `mailto:lawalenoch23@gmail.com?subject=${subject}&body=${body}`;
  };

  const toggleFavorite = (id: number) => {
    setFavorites(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
  };

  const addToCart = (snack: Snack) => {
    setCart([...cart, snack]);
    setAddedId(snack.id);
    setTimeout(() => setAddedId(null), 800);
  };

  const removeFromCart = (index: number) => {
    const newCart = [...cart];
    newCart.splice(index, 1);
    setCart(newCart);
  };

  const downloadReceipt = () => {
    const text = `${storeName.toUpperCase()} RECEIPT\nTOTAL: $${lastTotal.toFixed(2)}`;
    const element = document.createElement("a");
    element.href = URL.createObjectURL(new Blob([text], {type: 'text/plain'}));
    element.download = `Receipt_${currentOrderId}.txt`;
    element.click();
  };

  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;
    setCurrentOrderId(`GPA-${Math.floor(Math.random() * 9000 + 1000)}`);
    setLastTotal(cart.reduce((sum, item) => sum + item.price, 0));
    setOrderStatus('success');
    setCart([]);
  };

  if (orderStatus === 'success') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6 text-white animate-in fade-in duration-700">
        <div className="bg-zinc-900 border border-orange-500/20 p-10 rounded-[2rem] text-center max-w-sm shadow-2xl">
          <div className="text-3xl animate-bounce mb-4">✅</div>
          <h2 className="text-xl font-black italic uppercase mb-2">Success</h2>
          <p className="text-orange-500 text-[10px] font-black uppercase mb-6 tracking-widest">{storeName}</p>
          <div className="flex flex-col gap-3">
            <button onClick={() => setOrderStatus('shopping')} className="w-full bg-white text-black py-3 rounded-xl font-black uppercase text-[10px]">Back</button>
            <button onClick={downloadReceipt} className="text-zinc-600 text-[9px] font-black uppercase underline decoration-zinc-800">Save Receipt</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col font-sans">
      <nav className="border-b border-zinc-900/50 bg-black/80 backdrop-blur-md sticky top-0 z-50 px-6 py-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div onClick={() => setShowCheckout(false)} className="cursor-pointer">
            <h1 className="text-lg font-black italic tracking-tighter uppercase leading-none">{storeName}<span className="text-orange-500">.</span></h1>
            <p className="text-[7px] font-black tracking-[0.4em] text-zinc-700 uppercase">Legacy Partner</p>
          </div>
          <button onClick={() => setShowCheckout(!showCheckout)} className="bg-zinc-100 text-black px-5 py-2 rounded-full text-[9px] font-black tracking-widest">
             BAG ({cart.length})
          </button>
        </div>
      </nav>

      <main className="flex-grow max-w-6xl mx-auto w-full p-6">
        {!showCheckout ? (
          <>
            <div className="bg-orange-500/5 border border-orange-500/20 rounded-3xl p-8 mb-12 text-center mt-6 animate-in zoom-in duration-500">
              <p className="text-orange-500 text-[9px] font-black uppercase tracking-[0.4em] mb-3">Partner Selection</p>
              <h2 className="text-3xl font-black italic text-white uppercase mb-2 leading-none">{storeName}</h2>
              <p className="max-w-md mx-auto text-zinc-500 text-[10px] leading-relaxed italic">
                A digital storefront built to honor my Grandad's dream of supporting local markets.
              </p>
            </div>

            <div className="flex gap-2 mb-10 overflow-x-auto pb-4 no-scrollbar">
              {["All", "Favorites", "Junk Food", "Produce", "Bakery", "Drinks"].map(cat => (
                <button key={cat} onClick={() => setFilter(cat)} className={`px-5 py-2.5 rounded-xl border text-[9px] font-black uppercase transition-all ${filter === cat ? 'bg-orange-600 border-orange-600' : 'border-zinc-900 text-zinc-600'}`}>
                  {cat === 'Favorites' ? `❤️ Favs` : cat}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-20">
              {mySnacks.filter(s => filter === 'All' || (filter === 'Favorites' ? favorites.includes(s.id) : s.category === filter)).map((snack) => (
                <div key={snack.id} className="group relative bg-zinc-950/50 rounded-3xl border border-zinc-900 overflow-hidden hover:border-orange-500/30 transition-all duration-500">
                  <button onClick={() => toggleFavorite(snack.id)} className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/60 backdrop-blur-sm hover:scale-125 transition-all">
                    {favorites.includes(snack.id) ? '❤️' : '🤍'}
                  </button>
                  <div className="h-40 bg-zinc-900 overflow-hidden">
                    <img src={snack.image} className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 group-hover:scale-110 transition-all duration-700" alt={snack.name} />
                  </div>
                  <div className="p-5">
                    <p className="text-[11px] font-black uppercase italic leading-tight mb-1">{snack.name}</p>
                    <p className="text-sm font-black text-orange-500 italic mb-4">${snack.price.toFixed(2)}</p>
                    <button onClick={() => addToCart(snack)} className={`w-full py-3 rounded-xl font-black text-[9px] uppercase border transition-all ${addedId === snack.id ? 'bg-green-600 border-green-600 text-white' : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:bg-white hover:text-black'}`}>
                      {addedId === snack.id ? '✓ Added' : 'Add to Bag'}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* AUTOMATED PARTNER INQUIRY */}
            <div className="max-w-xl mx-auto border border-zinc-900 bg-zinc-950 p-10 rounded-[3rem] mb-20 text-center">
              <h3 className="font-black italic uppercase text-lg mb-4">Request a Demo</h3>
              <p className="text-zinc-500 text-[10px] mb-8 uppercase tracking-widest">Help us fulfill the vision for local markets.</p>
              <form onSubmit={handleDemoRequest} className="flex flex-col gap-4">
                <input required value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="STORE OWNER NAME" className="bg-black border border-zinc-900 p-4 rounded-xl text-[10px] font-black uppercase outline-none focus:border-orange-500/40 text-center" />
                <button type="submit" className="bg-white text-black py-4 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-orange-500 hover:text-white transition-all">Send Inquiry</button>
              </form>
            </div>
          </>
        ) : (
          <div className="max-w-md mx-auto bg-zinc-950 p-8 rounded-[2.5rem] border border-zinc-900 mt-4 shadow-2xl">
            <h2 className="text-2xl font-black italic uppercase text-center mb-8">Checkout</h2>
            <div className="space-y-2 mb-8 max-h-[30vh] overflow-y-auto pr-2">
              {cart.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center bg-black/40 p-4 rounded-2xl border border-zinc-900">
                  <span className="text-[10px] font-black uppercase italic">{item.name}</span>
                  <button onClick={() => removeFromCart(idx)} className="text-[8px] text-red-500 font-black tracking-widest">REMOVE</button>
                </div>
              ))}
            </div>
            <form onSubmit={handleCheckout} className="space-y-4 border-t border-zinc-900 pt-8">
              <input required placeholder="FULL NAME" className="w-full bg-black border border-zinc-900 p-4 rounded-xl text-[10px] font-black uppercase text-white outline-none focus:border-orange-500/50" />
              <input required value={shippingAddress} onChange={(e) => setShippingAddress(e.target.value)} placeholder="SHIPPING ADDRESS" className="w-full bg-black border border-zinc-900 p-4 rounded-xl text-[10px] font-black uppercase text-white outline-none focus:border-orange-500/50" />
              <div className="flex justify-between font-black text-xl italic text-white p-5 bg-black/50 rounded-2xl">
                <span>TOTAL</span><span className="text-orange-500">${cart.reduce((s, i) => s + i.price, 0).toFixed(2)}</span>
              </div>
              <button disabled={cart.length === 0} type="submit" className="w-full font-black py-4 rounded-xl text-[10px] uppercase tracking-[0.3em] bg-white text-black hover:bg-orange-600 hover:text-white transition-all disabled:opacity-20">Confirm</button>
            </form>
          </div>
        )}
      </main>

      {!hideTools && (
        <div className="bg-zinc-950 border-t border-zinc-900 p-10 mt-auto">
          <div className="max-w-md mx-auto text-center">
            <p onClick={() => setHideTools(true)} className="text-zinc-600 text-[8px] font-black uppercase tracking-widest mb-4 cursor-pointer hover:text-orange-500 transition-all underline decoration-orange-500/20 underline-offset-4">Click to hide for screenshot</p>
            <input type="text" value={storeName} onChange={(e) => setStoreName(e.target.value)} className="w-full bg-black border border-orange-500/20 p-4 rounded-xl text-[10px] font-black uppercase text-orange-500 text-center outline-none" placeholder="CLIENT NAME" />
          </div>
        </div>
      )}
      {hideTools && <button onClick={() => setHideTools(false)} className="fixed bottom-4 right-4 bg-orange-600/50 text-white text-[8px] font-black p-3 rounded-full hover:bg-orange-600 transition-all">SHOW TOOLS</button>}

      <footer className="bg-black py-12 border-t border-zinc-900/50 text-center">
        <p className="text-[8px] text-zinc-800 font-black uppercase tracking-[1.2em]">POPOP'S DREAM FULFILLED • 2026</p>
      </footer>
    </div>
  );
}