'use client'

import { useState, useEffect } from 'react';
import { ThemeConfigPanel } from './ThemeConfigPanel';
import { useThemes } from '../../hooks/useThemes';
import { ThemeLibrary } from './ThemeLibrary';
import { CreateThemeDialog, CloneThemeDialog, DeleteThemeDialog } from './ThemeDialogs';
import { Loader2, Palette, Lock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { Theme } from '../../types-theme';
import { applyBrandingColors, applyGlobalStyling, applyComponentStyling, applyDrawerOverlay } from '@/lib/branding';
import { useSystemSettingsSafe } from '@/contexts/system-settings-context';

export function ThemeManager() {
    const { settings, isLoading: settingsLoading } = useSystemSettingsSafe();

    const {
        themes,
        isLoading,
        error,
        createTheme,
        cloneTheme,
        deleteTheme,
        activateTheme,
        exportTheme,
        importTheme,
        restoreTheme,
        getTheme,
    } = useThemes();

    const [selectedThemeId, setSelectedThemeId] = useState<string | null>(null);
    const [selectedThemeDetails, setSelectedThemeDetails] = useState<Theme | null>(null);
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [cloneDialogOpen, setCloneDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [themeToClone, setThemeToClone] = useState<{ id: string; name: string } | null>(null);
    const [themeToDelete, setThemeToDelete] = useState<{ id: string; name: string } | null>(null);
    const [cloneName, setCloneName] = useState('');

    // Load full theme when a theme is selected
    useEffect(() => {
        if (selectedThemeId) {
            getTheme(selectedThemeId)
                .then(setSelectedThemeDetails)
                .catch(() => setSelectedThemeDetails(null));
        } else {
            setSelectedThemeDetails(null);
        }
    }, [selectedThemeId, getTheme]);

    // Apply active theme branding on load and when themes change
    useEffect(() => {
        if (isLoading || themes.length === 0) return;

        const activeTheme = themes.find(t => t.isActive);
        if (activeTheme) {
            getTheme(activeTheme.id)
                .then((theme) => {
                    // Config is now flattened - no conversion needed
                    const brandingConfig = theme.config;

                    console.log('Applying active theme branding:', {
                        themeId: theme.id,
                        themeName: theme.name,
                        themeMode: theme.themeMode,
                        hasConfig: !!theme.config,
                        configKeys: Object.keys(theme.config || {})
                    });

                    // Apply all branding functions (no isDarkMode parameter needed)
                    // applyBrandingColors already calls all other functions
                    applyBrandingColors(brandingConfig);

                    // Also update system_settings to ensure BrandingInitializer picks it up
                    fetch('/api/admin/branding', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ branding: brandingConfig })
                    }).catch(err => {
                        console.error('Failed to sync branding to system_settings:', err);
                    });
                })
                .catch((error) => {
                    console.error('Error applying active theme branding:', error);
                });
        } else {
            console.warn('No active theme found');
        }
    }, [themes, isLoading, getTheme]);

    // Get selected theme list item for preview
    const selectedTheme = themes.find((t) => t.id === selectedThemeId);

    const handleCreateTheme = async (name: string, description: string) => {
        const newTheme = await createTheme(name, description);
        if (newTheme) {
            setSelectedThemeId(newTheme.id);
        }
    };

    const handleCloneTheme = (id: string) => {
        const theme = themes.find((t) => t.id === id);
        if (theme) {
            setThemeToClone({ id, name: theme.name });
            setCloneName(`${theme.name} (Copy)`);
            setCloneDialogOpen(true);
        }
    };

    const handleConfirmClone = async (name: string) => {
        if (themeToClone) {
            const newTheme = await cloneTheme(themeToClone.id, name);
            if (newTheme) {
                setSelectedThemeId(newTheme.id);
            }
            setThemeToClone(null);
        }
    };

    const handleDeleteTheme = (id: string) => {
        const theme = themes.find((t) => t.id === id);
        if (theme) {
            setThemeToDelete({ id, name: theme.name });
            setDeleteDialogOpen(true);
        }
    };

    const handleConfirmDelete = async () => {
        if (themeToDelete) {
            await deleteTheme(themeToDelete.id);
            if (selectedThemeId === themeToDelete.id) {
                setSelectedThemeId(null);
            }
            setThemeToDelete(null);
        }
    };

    const handleEditTheme = (id: string) => {
        // Navigation handled by ThemeConfigPanel now
        setSelectedThemeId(id);
    };

    const handleRestoreTheme = async (id: string) => {
        await restoreTheme(id);
        // Refresh details if the restored theme is currently selected
        if (selectedThemeId === id) {
            const updated = await getTheme(id);
            setSelectedThemeDetails(updated);
        }
    };

    // Auto-select active theme on load
    useEffect(() => {
        if (themes.length > 0 && !selectedThemeId) {
            const activeTheme = themes.find(t => t.isActive);
            if (activeTheme) {
                setSelectedThemeId(activeTheme.id);
            } else {
                // Select first theme if no active theme
                setSelectedThemeId(themes[0].id);
            }
        }
    }, [themes, selectedThemeId]);

    if (isLoading || settingsLoading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Loading themes...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <p className="text-destructive mb-2">Error loading themes</p>
                    <p className="text-sm text-muted-foreground">{error}</p>
                </div>
            </div>
        );
    }

    // Check if theme configuration is disabled
    if (!settings.enableThemeConfig) {
        return (
            <div className="flex flex-col h-full">
                <div className="flex items-center justify-between p-6 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-muted">
                            <Palette className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">Theme Manager</h1>
                            <p className="text-sm text-muted-foreground">
                                Create, customize, and manage your application themes
                            </p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center justify-center flex-1">
                    <Card className="max-w-md">
                        <CardHeader className="text-center">
                            <div className="mx-auto p-3 rounded-full bg-muted mb-2">
                                <Lock className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <CardTitle>Theme Configuration Disabled</CardTitle>
                            <CardDescription>
                                Theme configuration has been disabled by a system administrator.
                                Contact your administrator to enable this feature.
                            </CardDescription>
                        </CardHeader>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                        <Palette className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Theme Manager</h1>
                        <p className="text-sm text-muted-foreground">
                            Create, customize, and manage your application themes
                        </p>
                    </div>
                </div>
            </div>

            {/* Error Alert */}
            {error && (
                <div className="p-6 pb-0">
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                </div>
            )}

            {/* Main Content */}
            <div className="flex flex-1 overflow-hidden">
                {/* Left Sidebar - Theme Library */}
                <div className="w-80 flex-shrink-0">
                    <ThemeLibrary
                        themes={themes}
                        selectedThemeId={selectedThemeId}
                        onSelectTheme={setSelectedThemeId}
                        onEditTheme={handleEditTheme}
                        onCloneTheme={handleCloneTheme}
                        onDeleteTheme={handleDeleteTheme}
                        onActivateTheme={activateTheme}
                        onRestoreTheme={handleRestoreTheme}
                        onExportTheme={exportTheme}
                        onCreateTheme={() => setCreateDialogOpen(true)}
                        onImportTheme={importTheme}
                    />
                </div>

                {/* Right Panel - Theme Details/Configuration */}
                <div className="flex-1 overflow-hidden flex flex-col">
                    {selectedTheme && selectedThemeDetails ? (
                        <div className="h-full overflow-auto">
                            <ThemeConfigPanel theme={selectedThemeDetails} />
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full">
                            <div className="text-center">
                                <Palette className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold mb-2">No Theme Selected</h3>
                                <p className="text-sm text-muted-foreground max-w-sm">
                                    Select a theme from the library to view details and customize it
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Dialogs */}
            <CreateThemeDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} onCreate={handleCreateTheme} />

            {themeToClone && (
                <CloneThemeDialog
                    open={cloneDialogOpen}
                    onOpenChange={setCloneDialogOpen}
                    themeName={themeToClone.name}
                    onClone={handleConfirmClone}
                />
            )}

            {themeToDelete && (
                <DeleteThemeDialog
                    open={deleteDialogOpen}
                    onOpenChange={setDeleteDialogOpen}
                    themeName={themeToDelete.name}
                    onDelete={handleConfirmDelete}
                />
            )}
        </div>
    );
}
