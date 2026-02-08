import { Drawer } from "vaul";
import { useCart } from "@/lib/cart-context";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Minus, Plus, Truck, Store, X } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export function CartDrawer() {
  const { items, updateQuantity, isDelivery, toggleDelivery, subtotal, deliveryFee, total } = useCart();
  const itemCount = items.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <Drawer.Root>
      <Drawer.Trigger asChild>
        <Button 
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 rounded-full h-14 px-8 shadow-2xl bg-white text-black hover:bg-zinc-100 font-bold text-lg border-none"
          data-testid="button-cart-trigger"
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <ShoppingBag className="h-5 w-5" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 h-2.5 w-2.5 bg-primary rounded-full ring-2 ring-white" />
              )}
            </div>
            <span>{itemCount} Items</span>
            <span className="w-1 h-1 rounded-full bg-zinc-300" />
            <span>${total.toFixed(2)}</span>
          </div>
        </Button>
      </Drawer.Trigger>
      
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
        <Drawer.Content className="bg-zinc-950 flex flex-col rounded-t-[2rem] h-[85vh] mt-24 fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 ring-1 ring-white/5 outline-none max-w-md mx-auto">
          <div className="p-4 bg-zinc-950/50 rounded-t-[2rem] flex-1 flex flex-col">
            <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-zinc-800 mb-8" />
            
            <div className="flex items-center justify-between mb-6 px-2">
              <h2 className="font-display text-2xl font-bold">Your Order</h2>
              <Drawer.Close asChild>
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/5">
                  <X className="h-5 w-5" />
                </Button>
              </Drawer.Close>
            </div>

            <ScrollArea className="flex-1 -mx-4 px-4">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-zinc-500">
                  <ShoppingBag className="h-12 w-12 mb-4 opacity-20" />
                  <p>Your cart is empty</p>
                </div>
              ) : (
                <div className="space-y-4 pb-6">
                  {items.map((item) => (
                    <div key={item.id} className="flex gap-4 items-center bg-white/5 p-3 rounded-2xl border border-white/5">
                      <div className="h-20 w-20 bg-black/40 rounded-xl p-2 flex items-center justify-center">
                        <img src={item.image} alt={item.name} className="h-full w-full object-contain" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-white mb-1">{item.name}</h3>
                        <p className="text-sm text-zinc-400 mb-2">${item.price.toFixed(2)}</p>
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={() => updateQuantity(item.id, -1)}
                            className="h-8 w-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 text-white"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-4 text-center text-sm font-medium">{item.quantity}</span>
                          <button 
                            onClick={() => updateQuantity(item.id, 1)}
                            className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 text-white"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                      <div className="text-right font-medium">
                        ${(item.price * item.quantity).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            <div className="mt-auto space-y-4 pt-6 border-t border-white/10">
              <div className="flex items-center justify-between bg-zinc-900/50 p-4 rounded-2xl border border-white/5">
                <div className="flex items-center gap-3">
                  <div className={cn("p-2 rounded-lg transition-colors", isDelivery ? "bg-primary text-white" : "bg-zinc-800 text-zinc-400")}>
                    <Truck className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Delivery</p>
                    <p className="text-xs text-zinc-400">Add $5.99 fee</p>
                  </div>
                </div>
                <Switch 
                  checked={isDelivery} 
                  onCheckedChange={toggleDelivery}
                  className="data-[state=checked]:bg-primary"
                />
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-zinc-400">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Delivery Fee</span>
                  <span>${deliveryFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold text-white pt-2 border-t border-white/10">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>

              <Button className="w-full h-14 text-lg font-bold rounded-xl bg-primary hover:bg-primary/90 text-white shadow-lg shadow-orange-500/20">
                Checkout
              </Button>
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}