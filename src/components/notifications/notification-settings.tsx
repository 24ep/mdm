'use client';

import React, { useState, useEffect } from 'react';
import { Settings, Bell, BellOff, Mail, MailOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { NotificationType } from '@/types/notifications';

interface NotificationPreference {
  type: NotificationType;
  enabled: boolean;
  email_enabled: boolean;
  push_enabled: boolean;
}

const notificationTypes: { type: NotificationType; label: string; description: string }[] = [
  { type: 'INFO', label: 'General Information', description: 'General system information and updates' },
  { type: 'SUCCESS', label: 'Success Messages', description: 'Successful operations and confirmations' },
  { type: 'WARNING', label: 'Warnings', description: 'Important warnings and alerts' },
  { type: 'ERROR', label: 'Errors', description: 'Error messages and system issues' },
  { type: 'ASSIGNMENT_CREATED', label: 'New Assignments', description: 'When new assignments are created' },
  { type: 'ASSIGNMENT_UPDATED', label: 'Assignment Updates', description: 'When assignments are updated' },
  { type: 'ASSIGNMENT_COMPLETED', label: 'Assignment Completion', description: 'When assignments are completed' },
  { type: 'CUSTOMER_CREATED', label: 'New Customers', description: 'When new customers are added' },
  { type: 'CUSTOMER_UPDATED', label: 'Customer Updates', description: 'When customer information is updated' },
  { type: 'USER_INVITED', label: 'User Invitations', description: 'When users are invited to the system' },
  { type: 'USER_ROLE_CHANGED', label: 'Role Changes', description: 'When user roles are modified' },
  { type: 'SYSTEM_MAINTENANCE', label: 'System Maintenance', description: 'System maintenance notifications' },
  { type: 'DATA_IMPORT_COMPLETED', label: 'Data Import', description: 'When data imports are completed' },
  { type: 'DATA_EXPORT_COMPLETED', label: 'Data Export', description: 'When data exports are completed' },
  { type: 'AUDIT_LOG_CREATED', label: 'Audit Logs', description: 'When audit log entries are created' },
];

export function NotificationSettings() {
  const [preferences, setPreferences] = useState<NotificationPreference[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Load preferences
  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      setIsLoading(true);
      // Initialize with default preferences
      const defaultPreferences: NotificationPreference[] = notificationTypes.map(type => ({
        type: type.type,
        enabled: true,
        email_enabled: false,
        push_enabled: true,
      }));
      
      setPreferences(defaultPreferences);
    } catch (error) {
      console.error('Error loading preferences:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updatePreference = (type: NotificationType, field: keyof NotificationPreference, value: boolean) => {
    setPreferences(prev => 
      prev.map(pref => 
        pref.type === type ? { ...pref, [field]: value } : pref
      )
    );
  };

  const savePreferences = async () => {
    try {
      setIsSaving(true);
      // Here you would typically save to your API
      console.log('Saving preferences:', preferences);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error('Error saving preferences:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const resetToDefaults = () => {
    const defaultPreferences: NotificationPreference[] = notificationTypes.map(type => ({
      type: type.type,
      enabled: true,
      email_enabled: false,
      push_enabled: true,
    }));
    setPreferences(defaultPreferences);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
        <span className="ml-2">Loading notification settings...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Notification Settings</h2>
          <p className="text-gray-600">Manage your notification preferences</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={resetToDefaults}>
            Reset to Defaults
          </Button>
          <Button onClick={savePreferences} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Notification Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {notificationTypes.map((notificationType, index) => {
            const preference = preferences.find(p => p.type === notificationType.type);
            if (!preference) return null;

            return (
              <div key={notificationType.type}>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium">{notificationType.label}</h3>
                      {preference.enabled ? (
                        <Bell className="h-4 w-4 text-green-500" />
                      ) : (
                        <BellOff className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{notificationType.description}</p>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Switch
                        id={`enabled-${notificationType.type}`}
                        checked={preference.enabled}
                        onCheckedChange={(checked) => 
                          updatePreference(notificationType.type, 'enabled', checked)
                        }
                      />
                      <Label htmlFor={`enabled-${notificationType.type}`}>
                        Enable
                      </Label>
                    </div>
                  </div>
                </div>

                {preference.enabled && (
                  <div className="ml-4 mt-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        <Label htmlFor={`email-${notificationType.type}`}>
                          Email notifications
                        </Label>
                      </div>
                      <Switch
                        id={`email-${notificationType.type}`}
                        checked={preference.email_enabled}
                        onCheckedChange={(checked) => 
                          updatePreference(notificationType.type, 'email_enabled', checked)
                        }
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Bell className="h-4 w-4" />
                        <Label htmlFor={`push-${notificationType.type}`}>
                          Push notifications
                        </Label>
                      </div>
                      <Switch
                        id={`push-${notificationType.type}`}
                        checked={preference.push_enabled}
                        onCheckedChange={(checked) => 
                          updatePreference(notificationType.type, 'push_enabled', checked)
                        }
                      />
                    </div>
                  </div>
                )}

                {index < notificationTypes.length - 1 && <Separator className="my-4" />}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
