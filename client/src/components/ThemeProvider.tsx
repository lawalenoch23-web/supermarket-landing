// ============================================
// THEME PROVIDER - APPLIES BRANDING COLORS
// Wrap your Home.tsx with this component
// ============================================

import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

interface ThemeProviderProps {
  children: React.ReactNode;
}

export default function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setTheme] = useState({
    background_color: '#000000',
    primary_color: '#f97316',
    secondary_color: '#ea580c',
    logo_url: '',
    store_name: 'LOCAL MARKET'
  });

  useEffect(() => {
    fetchTheme();

    // Subscribe to changes
    const channel = supabase
      .channel('theme-changes')
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'store_settings' 
      }, () => {
        fetchTheme();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchTheme = async () => {
    try {
      const { data } = await supabase
        .from('store_settings')
        .select('background_color, primary_color, secondary_color, logo_url, store_name')
        .eq('id', 1)
        .single();

      if (data) {
        setTheme({
          background_color: data.background_color || '#000000',
          primary_color: data.primary_color || '#f97316',
          secondary_color: data.secondary_color || '#ea580c',
          logo_url: data.logo_url || '',
          store_name: data.store_name || 'LOCAL MARKET'
        });

        // Apply CSS variables
        const bg = data.background_color || '#000000';
        const r = parseInt(bg.slice(1,3), 16);
        const g = parseInt(bg.slice(3,5), 16);
        const b = parseInt(bg.slice(5,7), 16);
        const isLight = (r * 299 + g * 587 + b * 114) / 1000 > 128;

        document.documentElement.style.setProperty('--bg-color', bg);
        document.documentElement.style.setProperty('--primary-color', data.primary_color || '#f97316');
        document.documentElement.style.setProperty('--secondary-color', data.secondary_color || '#ea580c');
        document.documentElement.style.setProperty('--text-color', isLight ? '#0a0a0a' : '#ffffff');
        document.documentElement.style.setProperty('--text-muted', isLight ? '#52525b' : '#a1a1aa');
        document.documentElement.style.setProperty('--card-bg', isLight ? '#f4f4f5' : '#09090b');
        document.documentElement.style.setProperty('--card-border', isLight ? '#e4e4e7' : '#18181b');
        document.documentElement.style.setProperty('--input-bg', isLight ? '#ffffff' : '#000000');
        document.documentElement.style.setProperty('--input-border', isLight ? '#d4d4d8' : '#18181b');
        document.documentElement.style.setProperty('--nav-bg', isLight ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.9)');
      }
    } catch (err) {
      console.error('Error fetching theme:', err);
    }
  };

  return <>{children}</>;
}

// Export hook to use theme in components
export function useTheme() {
  const [theme, setTheme] = useState({
    background_color: '#000000',
    primary_color: '#f97316',
    secondary_color: '#ea580c',
    logo_url: '',
    store_name: 'LOCAL MARKET'
  });

  useEffect(() => {
    const fetchTheme = async () => {
      const { data } = await supabase
        .from('store_settings')
        .select('*')
        .eq('id', 1)
        .single();

      if (data) {
        setTheme({
          background_color: data.background_color || '#000000',
          primary_color: data.primary_color || '#f97316',
          secondary_color: data.secondary_color || '#ea580c',
          logo_url: data.logo_url || '',
          store_name: data.store_name || 'LOCAL MARKET'
        });
      }
    };

    fetchTheme();
  }, []);

  return theme;
}