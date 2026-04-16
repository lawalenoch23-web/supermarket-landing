// ============================================
// STORE ANNOUNCEMENT BANNER
// Add this to the top of Home.tsx customer page
// ============================================

import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { X, Megaphone } from 'lucide-react';

export default function AnnouncementBanner() {
  const [announcement, setAnnouncement] = useState<string>('');
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    fetchAnnouncement();

    // Subscribe to changes
    const channel = supabase
      .channel('announcement-changes')
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'store_settings' 
      }, () => {
        fetchAnnouncement();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchAnnouncement = async () => {
    try {
      const { data } = await supabase
        .from('store_settings')
        .select('announcement_message, show_announcement')
        .eq('id', 1)
        .single();

      if (data && data.show_announcement && data.announcement_message) {
        setAnnouncement(data.announcement_message);
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    } catch (err) {
      console.error('Error fetching announcement:', err);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
  };

  if (!isVisible || isDismissed || !announcement) return null;

  return (
      <div className="w-full animate-gradient-x" style={{ background: `linear-gradient(to right, var(--secondary-color), var(--primary-color), var(--secondary-color))` }}>
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="bg-white/20 p-2 rounded-lg animate-pulse">
              <Megaphone size={18} className="text-white" />
            </div>
            <p className="text-sm md:text-base font-black text-white uppercase tracking-wide">
              {announcement}
            </p>
          </div>
          <button
            onClick={handleDismiss}
            className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition-all active:scale-95 flex-shrink-0"
            aria-label="Dismiss announcement"
          >
            <X size={16} className="text-white" />
          </button>
        </div>
      </div>

      <style>{`
        @keyframes gradient-x {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient-x {
          background-size: 200% 200%;
          animation: gradient-x 3s ease infinite;
        }
      `}</style>
    </div>
  );
}