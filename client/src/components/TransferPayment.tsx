// ============================================
// TRANSFER PAYMENT COMPONENT
// Shows bank details when customer selects Transfer on Delivery
// ============================================

import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { CreditCard, Copy, CheckCircle } from 'lucide-react';

interface TransferDetailsProps {
  isVisible: boolean;
}

export default function TransferPaymentDetails({ isVisible }: TransferDetailsProps) {
  const [bankDetails, setBankDetails] = useState({
    bank_name: '',
    account_number: '',
    account_name: ''
  });
  const [copied, setCopied] = useState<'account' | 'name' | null>(null);

  useEffect(() => {
    if (isVisible) {
      fetchBankDetails();
    }
  }, [isVisible]);

  const fetchBankDetails = async () => {
    try {
      const { data } = await supabase
        .from('store_settings')
        .select('bank_name, account_number, account_name')
        .eq('id', 1)
        .single();

      if (data) {
        setBankDetails({
          bank_name: data.bank_name || '',
          account_number: data.account_number || '',
          account_name: data.account_name || ''
        });
      }
    } catch (err) {
      console.error('Error fetching bank details:', err);
    }
  };

  const copyToClipboard = (text: string, type: 'account' | 'name') => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  if (!isVisible) return null;

  return (
    <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/30 p-5 rounded-2xl animate-in slide-in-from-top-2 fade-in">
      <div className="flex items-start gap-3 mb-4">
        <div className="bg-blue-500/20 p-2.5 rounded-xl">
          <CreditCard size={20} className="text-blue-400" />
        </div>
        <div>
          <h3 className="text-sm font-black uppercase text-blue-400 mb-1">
            Transfer Payment Details
          </h3>
          <p className="text-xs text-blue-300/70">
            Transfer to this account on delivery
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {/* Bank Name */}
        <div className="bg-black/30 border border-blue-500/20 p-4 rounded-xl">
          <p className="text-[9px] font-black text-blue-400/60 uppercase tracking-widest mb-1.5">
            Bank
          </p>
          <p className="text-base font-black text-white uppercase">
            {bankDetails.bank_name || 'Not Set'}
          </p>
        </div>

        {/* Account Number */}
        <div className="bg-black/30 border border-blue-500/20 p-4 rounded-xl">
          <p className="text-[9px] font-black text-blue-400/60 uppercase tracking-widest mb-1.5">
            Account Number
          </p>
          <div className="flex items-center justify-between gap-3">
            <p className="text-xl font-black text-white tracking-wider font-mono">
              {bankDetails.account_number || 'Not Set'}
            </p>
            {bankDetails.account_number && (
              <button
                onClick={() => copyToClipboard(bankDetails.account_number, 'account')}
                className="bg-blue-500/20 hover:bg-blue-500/30 p-2 rounded-lg transition-all active:scale-95"
              >
                {copied === 'account' ? (
                  <CheckCircle size={16} className="text-green-400" />
                ) : (
                  <Copy size={16} className="text-blue-400" />
                )}
              </button>
            )}
          </div>
        </div>

        {/* Account Name */}
        <div className="bg-black/30 border border-blue-500/20 p-4 rounded-xl">
          <p className="text-[9px] font-black text-blue-400/60 uppercase tracking-widest mb-1.5">
            Account Name
          </p>
          <div className="flex items-center justify-between gap-3">
            <p className="text-base font-black text-white uppercase">
              {bankDetails.account_name || 'Not Set'}
            </p>
            {bankDetails.account_name && (
              <button
                onClick={() => copyToClipboard(bankDetails.account_name, 'name')}
                className="bg-blue-500/20 hover:bg-blue-500/30 p-2 rounded-lg transition-all active:scale-95"
              >
                {copied === 'name' ? (
                  <CheckCircle size={16} className="text-green-400" />
                ) : (
                  <Copy size={16} className="text-blue-400" />
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 bg-blue-500/10 border border-blue-500/20 p-3 rounded-lg">
        <p className="text-[10px] text-blue-300 font-bold leading-relaxed">
          <strong>📱 Payment Instructions:</strong>
        </p>
        <ol className="text-[10px] text-blue-300/80 mt-2 space-y-1 ml-4">
          <li>1. Copy account details above</li>
          <li>2. Transfer the total amount when driver arrives</li>
          <li>3. Show transfer confirmation to driver</li>
        </ol>
      </div>
    </div>
  );
}

// Compact version for order summary
export function TransferPaymentBadge({ paymentMethod }: { paymentMethod: string }) {
  if (paymentMethod !== 'transfer') return null;

  return (
    <div className="bg-blue-500/10 border border-blue-500/20 px-3 py-2 rounded-lg flex items-center gap-2">
      <CreditCard size={14} className="text-blue-400" />
      <span className="text-xs font-black text-blue-400 uppercase">
        Transfer on Delivery
      </span>
    </div>
  );
}