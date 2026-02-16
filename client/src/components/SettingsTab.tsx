// ============================================
// SETTINGS COMPONENT FOR MANAGER.TSX
// Add this as a separate component or integrate into Manager
// ============================================

import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Save, Key, AlertCircle } from 'lucide-react';

interface SettingsProps {
  onSettingsSaved?: () => void;
}

export function SettingsTab({ onSettingsSaved }: SettingsProps) {
  const [settingsForm, setSettingsForm] = useState({
    store_name: '',
    manager_password: '',
    delivery_password: '',
    staff_password: '',
    store_email: '',
    store_phone: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Fetch current settings
  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('store_settings')
        .select('*')
        .eq('id', 1)
        .single();

      if (error) throw error;

      if (data) {
        setSettingsForm({
          store_name: data.store_name || '',
          manager_password: data.manager_password || '',
          delivery_password: data.delivery_password || '',
          staff_password: data.staff_password || '',
          store_email: data.store_email || '',
          store_phone: data.store_phone || ''
        });
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);

    try {
      const { error } = await supabase
        .from('store_settings')
        .update({
          store_name: settingsForm.store_name,
          manager_password: settingsForm.manager_password,
          delivery_password: settingsForm.delivery_password,
          staff_password: settingsForm.staff_password,
          store_email: settingsForm.store_email,
          store_phone: settingsForm.store_phone
        })
        .eq('id', 1);

      if (error) throw error;

      setSaved(true);
      if (onSettingsSaved) onSettingsSaved();

      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Error saving settings:', err);
      alert('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin h-12 w-12 border-4 border-orange-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="bg-zinc-950 border border-zinc-900 p-6 md:p-8 rounded-2xl max-w-3xl mx-auto">
      <h2 className="text-2xl md:text-3xl font-black italic uppercase mb-6">Store Settings</h2>

      {/* Master Key Notice */}
      <div className="bg-blue-500/10 border border-blue-500/30 p-4 rounded-xl mb-6">
        <div className="flex items-start gap-3">
          <Key className="text-blue-500 flex-shrink-0 mt-0.5" size={20} />
          <div>
            <p className="text-xs text-blue-400 font-bold uppercase mb-1">Master Recovery Key Active</p>
            <p className="text-xs text-zinc-400 leading-relaxed">
              If you forget your passwords, you can always login using the Master Recovery Key stored in Replit Secrets (VITE_MASTER_RECOVERY_KEY).
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {/* Store Name */}
        <div>
          <label className="text-xs font-black text-zinc-500 uppercase tracking-wider mb-2 block">
            Store Name
          </label>
          <input
            type="text"
            value={settingsForm.store_name}
            onChange={(e) => setSettingsForm({...settingsForm, store_name: e.target.value})}
            className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-sm font-bold uppercase outline-none focus:border-orange-500 transition-all"
            placeholder="MY STORE NAME"
          />
          <p className="text-xs text-zinc-600 mt-1">This appears on your storefront and receipts</p>
        </div>

        {/* Manager Password */}
        <div>
          <label className="text-xs font-black text-zinc-500 uppercase tracking-wider mb-2 block">
            Manager Password
          </label>
          <input
            type="text"
            value={settingsForm.manager_password}
            onChange={(e) => setSettingsForm({...settingsForm, manager_password: e.target.value})}
            className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-orange-500 transition-all"
            placeholder="Enter manager password"
          />
          <p className="text-xs text-zinc-600 mt-1">Password for accessing this Manager dashboard</p>
        </div>

        {/* Delivery Password */}
        <div>
          <label className="text-xs font-black text-zinc-500 uppercase tracking-wider mb-2 block">
            Delivery Password
          </label>
          <input
            type="text"
            value={settingsForm.delivery_password}
            onChange={(e) => setSettingsForm({...settingsForm, delivery_password: e.target.value})}
            className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-orange-500 transition-all"
            placeholder="Enter delivery password"
          />
          <p className="text-xs text-zinc-600 mt-1">Password for delivery personnel portal</p>
        </div>

        {/* Staff Password */}
        <div>
          <label className="text-xs font-black text-zinc-500 uppercase tracking-wider mb-2 block">
            Staff Password
          </label>
          <input
            type="text"
            value={settingsForm.staff_password}
            onChange={(e) => setSettingsForm({...settingsForm, staff_password: e.target.value})}
            className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-orange-500 transition-all"
            placeholder="Enter staff password"
          />
          <p className="text-xs text-zinc-600 mt-1">Password for staff portal (product/category management only)</p>
        </div>

        {/* Store Email */}
        <div>
          <label className="text-xs font-black text-zinc-500 uppercase tracking-wider mb-2 block">
            Store Email (Optional)
          </label>
          <input
            type="email"
            value={settingsForm.store_email}
            onChange={(e) => setSettingsForm({...settingsForm, store_email: e.target.value})}
            className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-sm outline-none focus:border-orange-500 transition-all"
            placeholder="store@example.com"
          />
        </div>

        {/* Store Phone */}
        <div>
          <label className="text-xs font-black text-zinc-500 uppercase tracking-wider mb-2 block">
            Store Phone (Optional)
          </label>
          <input
            type="tel"
            value={settingsForm.store_phone}
            onChange={(e) => setSettingsForm({...settingsForm, store_phone: e.target.value})}
            className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-sm outline-none focus:border-orange-500 transition-all"
            placeholder="+234 800 000 0000"
          />
        </div>

        {/* Warning */}
        <div className="bg-orange-500/10 border border-orange-500/30 p-4 rounded-xl">
          <div className="flex items-start gap-3">
            <AlertCircle className="text-orange-500 flex-shrink-0 mt-0.5" size={18} />
            <p className="text-xs text-orange-400 leading-relaxed">
              <strong>Important:</strong> After changing passwords, you'll need to use the new passwords on your next login. Write them down in a secure place.
            </p>
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-orange-600 hover:bg-orange-500 disabled:bg-zinc-800 disabled:cursor-not-allowed text-white py-4 rounded-xl font-black uppercase text-sm tracking-widest transition-all active:scale-95 shadow-lg shadow-orange-500/20 disabled:shadow-none flex items-center justify-center gap-2"
        >
          <Save size={18} />
          {saving ? 'Saving...' : saved ? '✓ Settings Saved!' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}

export default SettingsTab;