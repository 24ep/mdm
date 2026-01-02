import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { ThemeListItem, Theme } from '../types-theme';
import { initializeBranding } from '@/lib/branding';
import { THEME_STORAGE_KEYS } from '@/lib/theme-constants';

export function useThemes() {
    const [themes, setThemes] = useState<ThemeListItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch all themes (list)
    const fetchThemes = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/themes');
            if (!response.ok) throw new Error('Failed to fetch themes');
            const data = await response.json();
            setThemes(data.themes || []);
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Failed to fetch themes';
            setError(msg);
            toast.error(msg);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Create a new theme
    const createTheme = useCallback(async (name: string, description?: string, cloneFromId?: string) => {
        try {
            const response = await fetch('/api/themes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, description, cloneFromId })
            });
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Failed to create theme');
            }
            const data = await response.json();
            toast.success('Theme created successfully');
            await fetchThemes();
            return data.theme;
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Failed to create theme';
            toast.error(msg);
            throw err;
        }
    }, [fetchThemes]);

    // Clone an existing theme
    const cloneTheme = useCallback(async (id: string, name: string) => {
        try {
            const response = await fetch(`/api/themes/${id}/clone`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name })
            });
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Failed to clone theme');
            }
            const data = await response.json();
            toast.success(`Theme "${name}" created from clone`);
            await fetchThemes();
            return data.theme;
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Failed to clone theme';
            toast.error(msg);
            throw err;
        }
    }, [fetchThemes]);

    // Delete a theme
    const deleteTheme = useCallback(async (id: string) => {
        try {
            const response = await fetch(`/api/themes/${id}`, { method: 'DELETE' });
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Failed to delete theme');
            }
            toast.success('Theme deleted successfully');
            await fetchThemes();
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Failed to delete theme';
            toast.error(msg);
            throw err;
        }
    }, [fetchThemes]);

    // Activate a theme
    const activateTheme = useCallback(async (id: string) => {
        try {
            const response = await fetch(`/api/themes/${id}/activate`, { method: 'POST' });
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Failed to activate theme');
            }
            
            // Save the database theme ID to localStorage for persistence
            if (typeof window !== 'undefined') {
                localStorage.setItem(THEME_STORAGE_KEYS.DATABASE_THEME_ID, id);
                localStorage.setItem(THEME_STORAGE_KEYS.LAST_APPLIED, Date.now().toString());
            }
            
            toast.success('Theme activated successfully');
            await fetchThemes();
            // Apply new branding immediately - reload page to ensure all components pick up the change
            window.location.reload();
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Failed to activate theme';
            toast.error(msg);
            throw err;
        }
    }, [fetchThemes]);

    // Export a theme (download)
    const exportTheme = useCallback(async (id: string, format: 'json' = 'json') => {
        try {
            const response = await fetch(`/api/themes/${id}/export?format=${format}`);
            if (!response.ok) throw new Error('Failed to export theme');
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const disposition = response.headers.get('Content-Disposition');
            const filename = disposition?.match(/filename=\"(.+)\"/)?.[1] || `theme.${format}`;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            toast.success(`Theme exported as ${format.toUpperCase()}`);
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Failed to export theme';
            toast.error(msg);
            throw err;
        }
    }, []);

    // Import a theme file
    const importTheme = useCallback(async (file: File) => {
        try {
            const formData = new FormData();
            formData.append('file', file);
            const response = await fetch('/api/themes/import', {
                method: 'POST',
                body: formData
            });
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Failed to import theme');
            }
            const data = await response.json();
            toast.success(data.message || 'Theme imported successfully');
            await fetchThemes();
            return data.theme;
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Failed to import theme';
            toast.error(msg);
            throw err;
        }
    }, [fetchThemes]);

    // Update theme configuration (used by ThemeConfigPanel)
    const updateTheme = useCallback(async (id: string, payload: { name?: string; description?: string; config?: any; tags?: string[] }) => {
        try {
            const response = await fetch(`/api/themes/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Failed to update theme');
            }
            toast.success('Theme updated successfully');
            await fetchThemes();
            // Apply new branding immediately if active theme was updated
            await initializeBranding();
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Failed to update theme';
            toast.error(msg);
            throw err;
        }
    }, [fetchThemes]);

    // Restore a theme to its original config
    const restoreTheme = useCallback(async (id: string) => {
        try {
            const response = await fetch(`/api/themes/${id}/restore`, {
                method: 'POST'
            });
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Failed to restore theme');
            }
            const data = await response.json();
            toast.success(data.message || 'Theme restored successfully');
            await fetchThemes();
            // Apply new branding immediately
            await initializeBranding();
            return data.theme;
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Failed to restore theme';
            toast.error(msg);
            throw err;
        }
    }, [fetchThemes]);

    // Get full theme details by ID (used for configuration panel)
    const getTheme = useCallback(async (id: string) => {
        try {
            const response = await fetch(`/api/themes/${id}`);
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Failed to fetch theme');
            }
            const data = await response.json();
            return data.theme as Theme;
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Failed to fetch theme';
            toast.error(msg);
            throw err;
        }
    }, []);

    // Load list on mount
    useEffect(() => {
        fetchThemes();
    }, [fetchThemes]);

    return {
        themes,
        isLoading,
        error,
        refetch: fetchThemes,
        createTheme,
        cloneTheme,
        deleteTheme,
        activateTheme,
        exportTheme,
        importTheme,
        updateTheme,
        restoreTheme,
        getTheme,
    };
}
