import { CartProvider } from "@/lib/cart-context";
import { ProductCard } from "@/components/product/ProductCard";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { Search, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

import popcornImg from "@/assets/popcorn.png";
import chipsImg from "@/assets/chips.png";
import chocolateImg from "@/assets/chocolate.png";

const PRODUCTS = [
  {
    id: "1",
    name: "Truffle Noir Popcorn",
    description: "Air-popped corn dusted with black truffle and gold flakes.",
    price: 12.99,
    image: popcornImg,
    category: "Gourmet",
    span: "col-span-2 row-span-2"
  },
  {
    id: "2",
    name: "Volcanic Chili Chips",
    description: "Artisanal potato chips with a fiery kick of ghost pepper.",
    price: 8.50,
    image: chipsImg,
    category: "Spicy",
    span: "col-span-1 row-span-1"
  },
  {
    id: "3",
    name: "Midnight Silk Chocolate",
    description: "85% dark cacao from Ecuador with sea salt crystals.",
    price: 15.00,
    image: chocolateImg,
    category: "Sweet",
    span: "col-span-1 row-span-2"
  },
  {
    id: "4",
    name: "Wasabi Snap Peas",
    description: "Crunchy roasted peas coated in spicy wasabi dust.",
    price: 7.99,
    image: popcornImg, // Reusing for layout demo
    category: "Savory",
    span: "col-span-1 row-span-1"
  },
  {
    id: "5",
    name: "Golden Mango Strips",
    description: "Sun-dried organic mango slices without added sugar.",
    price: 10.50,
    image: chipsImg, // Reusing for layout demo
    category: "Dried Fruit",
    span: "col-span-2 row-span-1"
  },
  {
    id: "6",
    name: "Smoked Almonds",
    description: "Hickory smoked almonds with rosemary.",
    price: 9.99,
    image: chocolateImg, // Reusing
    category: "Nuts",
    span: "col-span-1 row-span-1"
  }
];

function HomeContent() {
  return (
    <div className="min-h-screen pb-32 bg-[url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop')] bg-fixed bg-cover">
      <div className="min-h-screen bg-black/80 backdrop-blur-sm">
        {/* Header */}
        <header className="fixed top-0 left-0 right-0 z-40 glass-panel">
          <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center font-display font-bold text-black text-xl">
                M
              </div>
              <h1 className="font-display text-2xl font-bold tracking-tighter">Midnight<span className="text-primary">Snacks</span></h1>
            </div>
            
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/10">
                <Search className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/10 md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
              <nav className="hidden md:flex gap-8 text-sm font-medium text-zinc-400">
                <a href="#" className="text-white">Shop</a>
                <a href="#" className="hover:text-white transition-colors">Best Sellers</a>
                <a href="#" className="hover:text-white transition-colors">About</a>
              </nav>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 md:px-6 pt-28">
          <div className="mb-10 mt-6">
            <h2 className="font-display text-5xl md:text-7xl font-bold text-white mb-4 leading-[0.9]">
              Cravings,<br />
              <span className="text-zinc-600">Elevated.</span>
            </h2>
            <p className="text-zinc-400 max-w-md text-lg">
              Curated premium snacks for the discerning palate. Delivered in under 30 minutes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 auto-rows-[300px]">
            {PRODUCTS.map((product) => (
              <ProductCard 
                key={product.id} 
                product={product} 
                className={product.span}
              />
            ))}
          </div>
        </main>

        <CartDrawer />
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <CartProvider>
      <HomeContent />
    </CartProvider>
  );
}