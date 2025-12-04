'use client';

import { useState, useEffect } from 'react';

type ViewMode = 'list' | 'grid';

type ViewPreferences = {
  buckets: ViewMode;
  files: ViewMode;
};

const STORAGE_KEY = 'ark_view_preferences';

const DEFAULT_PREFERENCES: ViewPreferences = {
  buckets: 'grid',
  files: 'list',
};

function getStoredPreferences(): ViewPreferences {
  if (typeof window === 'undefined') return DEFAULT_PREFERENCES;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { ...DEFAULT_PREFERENCES, ...JSON.parse(stored) };
    }
  } catch {
    // Ignore parse errors
  }
  return DEFAULT_PREFERENCES;
}

function setStoredPreferences(prefs: ViewPreferences): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // Ignore storage errors
  }
}

export function useBucketsViewMode() {
  const [viewMode, setViewModeState] = useState<ViewMode>('grid');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const prefs = getStoredPreferences();
    setViewModeState(prefs.buckets);
    setIsLoaded(true);
  }, []);

  const setViewMode = (mode: ViewMode) => {
    setViewModeState(mode);
    const prefs = getStoredPreferences();
    setStoredPreferences({ ...prefs, buckets: mode });
  };

  return { viewMode, setViewMode, isLoaded };
}

export function useFilesViewMode() {
  const [viewMode, setViewModeState] = useState<ViewMode>('list');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const prefs = getStoredPreferences();
    setViewModeState(prefs.files);
    setIsLoaded(true);
  }, []);

  const setViewMode = (mode: ViewMode) => {
    setViewModeState(mode);
    const prefs = getStoredPreferences();
    setStoredPreferences({ ...prefs, files: mode });
  };

  return { viewMode, setViewMode, isLoaded };
}
