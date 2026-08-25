import { useEffect } from 'react';
import type { Settings } from '@/types';

export function useTheme(settings: Settings) {
  useEffect(() => {
    const root = document.documentElement;
    if (settings.darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [settings.darkMode]);
}
