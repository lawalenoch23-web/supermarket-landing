import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCart, type Product } from "@/lib/cart-context";
import { Button } from "@/components/ui/button";

interface ProductCardProps {
  product: Product;
  className?: string;
}

export function ProductCard({ product, className }: ProductCardProps) {
  const { addToCart } = useCart();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      viewport={{ once: true }}
      className={cn(
        "group relative overflow-hidden rounded-3xl glass-card p-4 flex flex-col justify-between h-full",
        className
      )}
      data-testid={`card-product-${product.id}`}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/80 z-10 pointer-events-none" />
      
      <div className="relative z-0 h-48 w-full mb-4 flex items-center justify-center">
        <img 
          src={product.image} 
          alt={product.name}
          className="h-full w-full object-contain drop-shadow-2xl transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-3"
        />
      </div>

      <div className="relative z-20 mt-auto">
        <div className="flex justify-between items-start mb-2">
          <div>
            <span className="text-xs font-medium text-orange-400 uppercase tracking-wider mb-1 block">
              {product.category}
            </span>
            <h3 className="font-display text-xl font-bold text-white leading-tight mb-1">
              {product.name}
            </h3>
            <p className="text-sm text-zinc-400 line-clamp-2 mb-3">
              {product.description}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-white">
            ${product.price.toFixed(2)}
          </span>
          <Button
            size="icon"
            className="rounded-full h-10 w-10 bg-primary hover:bg-primary/90 text-primary-foreground border-none shadow-lg shadow-orange-500/20"
            onClick={() => addToCart(product)}
            data-testid={`button-add-${product.id}`}
          >
            <Plus className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}