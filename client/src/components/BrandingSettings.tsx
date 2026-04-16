// ============================================
// BRANDING SETTINGS COMPONENT - UPDATED
// Import this into SettingsTab.tsx
// ============================================

import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Upload, Palette, Save, CreditCard, MessageSquare } from 'lucide-react';

interface BrandingSettingsProps {
  onSaved?: () => void;
}

export default function BrandingSettings({ onSaved }: BrandingSettingsProps) {
  const [settings, setSettings] = useState({
    primary_color: '#f97316',      // Buttons, main accents
    secondary_color: '#ea580c',    // Orange elements (banner, badges, etc.)
    background_color: '#000000',   // Main background (black/white/grey)
    logo_url: '',
    bank_name: '',
    account_number: '',
    account_name: '',
    auto_discount_enabled: false,
    discount_6_days: 20,
    discount_4_days: 30,
    discount_2_days: 50,
    discount_0_days: 70,
    announcement_message: '',
    show_announcement: false
  });

  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data } = await supabase
        .from('store_settings')
        .select('*')
        .eq('id', 1)
        .single();

      if (data) {
        setSettings({
          primary_color: data.primary_color || '#f97316',
          secondary_color: data.secondary_color || '#ea580c',
          background_color: data.background_color || '#000000',
          logo_url: data.logo_url || '',
          bank_name: data.bank_name || '',
          account_number: data.account_number || '',
          account_name: data.account_name || '',
          auto_discount_enabled: data.auto_discount_enabled || false,
          discount_6_days: data.discount_6_days || 20,
          discount_4_days: data.discount_4_days || 30,
          discount_2_days: data.discount_2_days || 50,
          discount_0_days: data.discount_0_days || 70,
          announcement_message: data.announcement_message || '',
          show_announcement: data.show_announcement || false
        });
      }
    } catch (err) {
      console.error('Error fetching branding settings:', err);
    }
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('File too large. Please use an image under 2MB.');
      return;
    }

    setUploadingLogo(true);

    try {
      const fileExt = file.name.split('.').pop()?.toLowerCase();
      const fileName = `logos/logo-${Date.now()}.${fileExt}`;

      // Upload file
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('stock-images')
        .upload(fileName, file, { 
          upsert: true,
          contentType: file.type 
        });

      if (uploadError) {
        console.error('Upload error details:', uploadError);
        alert(`Upload failed: ${uploadError.message}\n\nMake sure the "stock-images" bucket exists and is PUBLIC in Supabase Storage.`);
        setUploadingLogo(false);
        return;
      }

      console.log('Upload successful:', uploadData);

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('stock-images')
        .getPublicUrl(fileName);

      const publicUrl = urlData.publicUrl;
      console.log('Public URL:', publicUrl);

      // Save to settings state AND immediately save to DB
      const updatedSettings = { ...settings, logo_url: publicUrl };
      setSettings(updatedSettings);

      // Auto-save logo URL to database right away
      const { error: saveError } = await supabase
        .from('store_settings')
        .update({ logo_url: publicUrl })
        .eq('id', 1);

      if (saveError) {
        console.error('Save error:', saveError);
        alert('Logo uploaded but failed to save URL. Click Save button manually.');
      } else {
        alert('✅ Logo uploaded and saved!');
      }

    } catch (err) {
      console.error('Unexpected error:', err);
      alert('Unexpected error during upload. Check browser console.');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);

    try {
      const { error } = await supabase
        .from('store_settings')
        .update(settings)
        .eq('id', 1);

      if (error) throw error;

      setSaved(true);
      if (onSaved) onSaved();

      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Error saving branding settings:', err);
      alert('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Preset color schemes
  const presets = [
    { name: 'Default Orange', bg: '#000000', primary: '#f97316', secondary: '#ea580c' },
    { name: 'Blue Ocean', bg: '#000000', primary: '#3b82f6', secondary: '#2563eb' },
    { name: 'Green Fresh', bg: '#ffffff', primary: '#10b981', secondary: '#059669' },
    { name: 'Purple Night', bg: '#0a0a0a', primary: '#a855f7', secondary: '#9333ea' },
    { name: 'Red Bold', bg: '#000000', primary: '#ef4444', secondary: '#dc2626' },
  ];

  return (
    <div className="space-y-6">

      {/* STORE BRANDING */}
      <div className="bg-zinc-950 border border-zinc-900 p-6 md:p-8 rounded-2xl">
        <h3 className="text-lg font-black uppercase text-orange-500 mb-4 flex items-center gap-2">
          <Palette size={18} /> Store Branding
        </h3>

        <div className="space-y-6">
          {/* Logo Upload */}
          <div>
            <label className="text-xs font-black text-zinc-500 uppercase tracking-wider mb-2 block">
              Store Logo
            </label>
            {settings.logo_url && (
              <div className="mb-3">
                <img 
                  src={settings.logo_url} 
                  alt="Logo preview" 
                  className="w-32 h-32 object-contain bg-white rounded-lg p-3 border border-zinc-800"
                />
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              disabled={uploadingLogo}
              className="hidden"
              id="logo-upload"
            />
            <label
              htmlFor="logo-upload"
              className={`w-full py-3 rounded-xl text-xs font-black uppercase transition-all cursor-pointer flex items-center justify-center gap-2 ${
                uploadingLogo 
                  ? 'bg-zinc-800 cursor-not-allowed' 
                  : 'bg-orange-600 hover:bg-orange-500'
              } text-white`}
            >
              <Upload size={14} />
              {uploadingLogo ? 'Uploading...' : settings.logo_url ? 'Change Logo' : 'Upload Logo'}
            </label>
            <p className="text-xs text-zinc-600 mt-2">PNG with transparent background recommended (max 2MB)</p>
          </div>

          {/* Color Preset Buttons */}
          <div>
            <label className="text-xs font-black text-zinc-500 uppercase tracking-wider mb-3 block">
              Quick Color Presets
            </label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {presets.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => setSettings({
                    ...settings,
                    background_color: preset.bg,
                    primary_color: preset.primary,
                    secondary_color: preset.secondary
                  })}
                  className="p-3 rounded-lg border border-zinc-800 hover:border-orange-500 transition-all group"
                >
                  <div className="flex gap-1 mb-2">
                    <div className="w-6 h-6 rounded" style={{ backgroundColor: preset.bg, border: '1px solid #3f3f46' }} />
                    <div className="w-6 h-6 rounded" style={{ backgroundColor: preset.primary }} />
                    <div className="w-6 h-6 rounded" style={{ backgroundColor: preset.secondary }} />
                  </div>
                  <p className="text-[9px] font-bold text-zinc-500 group-hover:text-orange-500 uppercase">
                    {preset.name}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Color Pickers */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-black text-zinc-500 uppercase tracking-wider mb-2 block">
                Background Color
              </label>
              <div className="flex gap-2 items-center mb-2">
                <input
                  type="color"
                  value={settings.background_color}
                  onChange={(e) => setSettings({...settings, background_color: e.target.value})}
                  className="w-16 h-12 rounded-xl cursor-pointer border-2 border-zinc-800"
                />
                <input
                  type="text"
                  value={settings.background_color}
                  onChange={(e) => setSettings({...settings, background_color: e.target.value})}
                  className="flex-1 bg-black border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono uppercase outline-none focus:border-orange-500"
                  placeholder="#000000"
                />
              </div>
              <p className="text-[9px] text-zinc-600">Main website background</p>
            </div>

            <div>
              <label className="text-xs font-black text-zinc-500 uppercase tracking-wider mb-2 block">
                Primary Color
              </label>
              <div className="flex gap-2 items-center mb-2">
                <input
                  type="color"
                  value={settings.primary_color}
                  onChange={(e) => setSettings({...settings, primary_color: e.target.value})}
                  className="w-16 h-12 rounded-xl cursor-pointer border-2 border-zinc-800"
                />
                <input
                  type="text"
                  value={settings.primary_color}
                  onChange={(e) => setSettings({...settings, primary_color: e.target.value})}
                  className="flex-1 bg-black border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono uppercase outline-none focus:border-orange-500"
                  placeholder="#f97316"
                />
              </div>
              <p className="text-[9px] text-zinc-600">Main buttons & prices</p>
            </div>

            <div>
              <label className="text-xs font-black text-zinc-500 uppercase tracking-wider mb-2 block">
                Secondary Color
              </label>
              <div className="flex gap-2 items-center mb-2">
                <input
                  type="color"
                  value={settings.secondary_color}
                  onChange={(e) => setSettings({...settings, secondary_color: e.target.value})}
                  className="w-16 h-12 rounded-xl cursor-pointer border-2 border-zinc-800"
                />
                <input
                  type="text"
                  value={settings.secondary_color}
                  onChange={(e) => setSettings({...settings, secondary_color: e.target.value})}
                  className="flex-1 bg-black border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono uppercase outline-none focus:border-orange-500"
                  placeholder="#ea580c"
                />
              </div>
              <p className="text-[9px] text-zinc-600">Banners, badges & accents</p>
            </div>
          </div>

          <div className="bg-orange-500/10 border border-orange-500/20 p-4 rounded-lg">
            <p className="text-xs text-orange-400 font-bold mb-2">
              💡 <strong>Color Guide:</strong>
            </p>
            <ul className="text-xs text-orange-400/80 space-y-1 ml-4">
              <li>• <strong>Background:</strong> Black (#000000), White (#ffffff), or Grey (#18181b)</li>
              <li>• <strong>Primary:</strong> Used for prices, main buttons, and call-to-actions</li>
              <li>• <strong>Secondary:</strong> Banners, sale badges, promotional elements</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Rest of the sections remain the same... */}
      {/* BANK ACCOUNT DETAILS */}
      <div className="bg-gradient-to-br from-blue-500/5 to-cyan-500/5 border border-blue-500/20 p-6 rounded-2xl">
        <h3 className="text-lg font-black uppercase text-blue-400 mb-4 flex items-center gap-2">
          <CreditCard size={18} /> Transfer Payment Details
        </h3>
        <p className="text-xs text-zinc-400 mb-4">Shown to customers who select "Transfer on Delivery"</p>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-black text-zinc-500 uppercase tracking-wider mb-2 block">
              Bank Name
            </label>
            <input
              type="text"
              value={settings.bank_name}
              onChange={(e) => setSettings({...settings, bank_name: e.target.value})}
              className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-sm font-bold uppercase outline-none focus:border-blue-500 transition-all"
              placeholder="e.g. ACCESS BANK"
            />
          </div>

          <div>
            <label className="text-xs font-black text-zinc-500 uppercase tracking-wider mb-2 block">
              Account Number
            </label>
            <input
              type="text"
              value={settings.account_number}
              onChange={(e) => setSettings({...settings, account_number: e.target.value})}
              className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-blue-500 transition-all"
              placeholder="0123456789"
            />
          </div>

          <div>
            <label className="text-xs font-black text-zinc-500 uppercase tracking-wider mb-2 block">
              Account Name
            </label>
            <input
              type="text"
              value={settings.account_name}
              onChange={(e) => setSettings({...settings, account_name: e.target.value})}
              className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-sm font-bold uppercase outline-none focus:border-blue-500 transition-all"
              placeholder="JOHN DOE"
            />
          </div>
        </div>
      </div>

      {/* AUTO-DISCOUNT EXPIRING PRODUCTS */}
      <div className="bg-gradient-to-br from-green-500/5 to-emerald-500/5 border border-green-500/20 p-6 rounded-2xl">
        <h3 className="text-lg font-black uppercase text-green-400 mb-4">
          Auto-Discount Expiring Products
        </h3>

        <div className="flex items-center justify-between mb-4 p-4 bg-black/40 rounded-xl">
          <div>
            <span className="text-sm font-black text-white uppercase block mb-1">Enable Auto-Discount</span>
            <span className="text-xs text-zinc-500">Automatically discount products nearing expiry</span>
          </div>
          <button
            onClick={() => setSettings({...settings, auto_discount_enabled: !settings.auto_discount_enabled})}
            className={`w-14 h-7 rounded-full transition-all relative ${settings.auto_discount_enabled ? 'bg-green-500' : 'bg-zinc-700'}`}
          >
            <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${settings.auto_discount_enabled ? 'left-8' : 'left-1'}`} />
          </button>
        </div>

        {settings.auto_discount_enabled && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-zinc-400 mb-2 block">6-7 Days Until Expiry</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={settings.discount_6_days}
                    onChange={(e) => setSettings({...settings, discount_6_days: parseInt(e.target.value) || 0})}
                    className="flex-1 bg-black border border-zinc-800 rounded-lg px-4 py-3 text-sm font-bold outline-none focus:border-green-500"
                  />
                  <span className="text-sm font-black text-zinc-500">%</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-400 mb-2 block">4-5 Days Until Expiry</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={settings.discount_4_days}
                    onChange={(e) => setSettings({...settings, discount_4_days: parseInt(e.target.value) || 0})}
                    className="flex-1 bg-black border border-zinc-800 rounded-lg px-4 py-3 text-sm font-bold outline-none focus:border-green-500"
                  />
                  <span className="text-sm font-black text-zinc-500">%</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-400 mb-2 block">2-3 Days Until Expiry</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={settings.discount_2_days}
                    onChange={(e) => setSettings({...settings, discount_2_days: parseInt(e.target.value) || 0})}
                    className="flex-1 bg-black border border-zinc-800 rounded-lg px-4 py-3 text-sm font-bold outline-none focus:border-green-500"
                  />
                  <span className="text-sm font-black text-zinc-500">%</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-400 mb-2 block">0-1 Days Until Expiry</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={settings.discount_0_days}
                    onChange={(e) => setSettings({...settings, discount_0_days: parseInt(e.target.value) || 0})}
                    className="flex-1 bg-black border border-zinc-800 rounded-lg px-4 py-3 text-sm font-bold outline-none focus:border-green-500"
                  />
                  <span className="text-sm font-black text-zinc-500">%</span>
                </div>
              </div>
            </div>

            <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-lg">
              <p className="text-xs text-green-400 font-bold mb-2">
                💡 <strong>How it works:</strong>
              </p>
              <ul className="text-xs text-green-400/80 space-y-1 ml-4">
                <li>• Discounts apply automatically based on days until expiry</li>
                <li>• Products show sale price to customers</li>
                <li>• Helps sell products before they expire</li>
                <li>• Save ₦40,000+ monthly by reducing waste!</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* STORE ANNOUNCEMENTS */}
      <div className="bg-gradient-to-br from-orange-500/5 to-red-500/5 border border-orange-500/20 p-6 rounded-2xl">
        <h3 className="text-lg font-black uppercase text-orange-400 mb-4 flex items-center gap-2">
          <MessageSquare size={18} /> Store Announcements
        </h3>

        <div className="flex items-center justify-between mb-4 p-4 bg-black/40 rounded-xl">
          <div>
            <span className="text-sm font-black text-white uppercase block mb-1">Show Announcement</span>
            <span className="text-xs text-zinc-500">Display banner on customer homepage</span>
          </div>
          <button
            onClick={() => setSettings({...settings, show_announcement: !settings.show_announcement})}
            className={`w-14 h-7 rounded-full transition-all relative ${settings.show_announcement ? 'bg-orange-500' : 'bg-zinc-700'}`}
          >
            <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${settings.show_announcement ? 'left-8' : 'left-1'}`} />
          </button>
        </div>

        <div>
          <label className="text-xs font-black text-zinc-500 uppercase tracking-wider mb-2 block">
            Message
          </label>
          <textarea
            value={settings.announcement_message}
            onChange={(e) => setSettings({...settings, announcement_message: e.target.value})}
            rows={3}
            className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-orange-500 transition-all resize-none"
            placeholder="e.g. Free delivery on orders over ₦5,000! Limited time offer."
          />
          <p className="text-xs text-zinc-600 mt-2">This will appear as a banner at the top of your store</p>
        </div>
      </div>

      {/* SAVE BUTTON */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full bg-orange-600 hover:bg-orange-500 disabled:bg-zinc-800 disabled:cursor-not-allowed text-white py-4 rounded-xl font-black uppercase text-sm tracking-widest transition-all active:scale-95 shadow-lg shadow-orange-500/20 disabled:shadow-none flex items-center justify-center gap-2"
      >
        <Save size={18} />
        {saving ? 'Saving...' : saved ? '✓ Saved Successfully!' : 'Save All Branding Settings'}
      </button>

      {saved && (
        <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-xl text-center">
          <p className="text-sm font-black text-green-400">
            ✅ Settings saved! Refresh your customer store to see changes.
          </p>
        </div>
      )}
    </div>
  );
}