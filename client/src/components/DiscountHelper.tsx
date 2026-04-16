// ============================================
// DISCOUNT CALCULATOR HELPER
// Import this into your components
// ============================================

import { supabase } from '../supabaseClient';

// Calculate auto-discount based on expiry date
export const calculateAutoDiscount = async (expiryDate: string | null): Promise<number> => {
  if (!expiryDate) return 0;

  try {
    // Fetch discount settings
    const { data: settings } = await supabase
      .from('store_settings')
      .select('auto_discount_enabled, discount_6_days, discount_4_days, discount_2_days, discount_0_days')
      .eq('id', 1)
      .single();

    if (!settings || !settings.auto_discount_enabled) return 0;

    // Calculate days until expiry
    const today = new Date();
    const expiry = new Date(expiryDate);
    const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    // Return discount based on tier
    if (daysUntilExpiry >= 6 && daysUntilExpiry <= 7) {
      return settings.discount_6_days || 0;
    } else if (daysUntilExpiry >= 4 && daysUntilExpiry <= 5) {
      return settings.discount_4_days || 0;
    } else if (daysUntilExpiry >= 2 && daysUntilExpiry <= 3) {
      return settings.discount_2_days || 0;
    } else if (daysUntilExpiry >= 0 && daysUntilExpiry <= 1) {
      return settings.discount_0_days || 0;
    }

    return 0;
  } catch (err) {
    console.error('Error calculating auto-discount:', err);
    return 0;
  }
};

// Calculate final price with discount
export const calculateDiscountedPrice = (
  originalPrice: number,
  manualDiscount: number,
  autoDiscount: number
): { finalPrice: number; discountPercent: number; savings: number } => {
  // Use whichever discount is higher (manual or auto)
  const discountPercent = Math.max(manualDiscount || 0, autoDiscount || 0);

  const savings = (originalPrice * discountPercent) / 100;
  const finalPrice = originalPrice - savings;

  return {
    finalPrice: Math.round(finalPrice),
    discountPercent,
    savings: Math.round(savings)
  };
};

// Product card discount badge component
export const DiscountBadge = ({ discountPercent }: { discountPercent: number }) => {
  if (!discountPercent || discountPercent === 0) return null;

  return (
    <div 
      className="absolute top-3 right-3 px-3 py-1.5 rounded-lg shadow-lg z-10"
      style={{ backgroundColor: 'var(--secondary-color, #ea580c)' }}
    >
      <p className="text-white font-black text-xs uppercase tracking-wider">
        {discountPercent}% OFF
      </p>
    </div>
  );
};

// ═══ PRICE DISPLAY COMPONENT WITH SAVINGS ═══
interface PriceDisplayProps {
  originalPrice: number;
  discountedPrice: number;
  hasDiscount: boolean;
}

export const PriceDisplay: React.FC<PriceDisplayProps> = ({ 
  originalPrice, 
  discountedPrice, 
  hasDiscount 
}) => {
  if (!hasDiscount) {
    return (
      <p 
        className="font-black text-lg" 
        style={{ color: 'var(--primary-color, #f97316)' }}
      >
        ₦{originalPrice.toLocaleString()}
      </p>
    );
  }

  const savings = originalPrice - discountedPrice;

  return (
    <div className="space-y-1">
      {/* Current Price */}
      <div className="flex items-center gap-2">
        <p 
          className="font-black text-lg" 
          style={{ color: 'var(--primary-color, #f97316)' }}
        >
          ₦{Math.round(discountedPrice).toLocaleString()}
        </p>
        <p className="text-zinc-500 text-sm line-through">
          ₦{originalPrice.toLocaleString()}
        </p>
      </div>

      {/* Savings Amount */}
      <p className="text-xs font-bold text-green-400">
        💰 Save ₦{Math.round(savings).toLocaleString()}
      </p>
    </div>
  );
};
// Add manual discount to product (for Manager)
export const addManualDiscount = async (
  productId: number,
  discountPercent: number
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('products')
      .update({ 
        manual_discount: discountPercent,
        on_sale: discountPercent > 0
      })
      .eq('id', productId);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Error adding manual discount:', err);
    return false;
  }
};

// Remove manual discount from product
export const removeManualDiscount = async (productId: number): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('products')
      .update({ 
        manual_discount: 0,
        on_sale: false
      })
      .eq('id', productId);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Error removing manual discount:', err);
    return false;
  }
};