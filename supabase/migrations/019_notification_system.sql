-- Notification System Migration
-- This migration adds comprehensive notification support to the application

BEGIN;

-- Create notification types enum
DO $$ BEGIN
  CREATE TYPE notification_type AS ENUM (
    'INFO', 
    'SUCCESS', 
    'WARNING', 
    'ERROR', 
    'ASSIGNMENT_CREATED',
    'ASSIGNMENT_UPDATED',
    'ASSIGNMENT_COMPLETED',
    'CUSTOMER_CREATED',
    'CUSTOMER_UPDATED',
    'USER_INVITED',
    'USER_ROLE_CHANGED',
    'SYSTEM_MAINTENANCE',
    'DATA_IMPORT_COMPLETED',
    'DATA_EXPORT_COMPLETED',
    'AUDIT_LOG_CREATED'
  );
EXCEPTION WHEN duplicate_object THEN NULL; 
END $$;

-- Create notification priority enum
DO $$ BEGIN
  CREATE TYPE notification_priority AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');
EXCEPTION WHEN duplicate_object THEN NULL; 
END $$;

-- Create notification status enum
DO $$ BEGIN
  CREATE TYPE notification_status AS ENUM ('UNREAD', 'READ', 'ARCHIVED');
EXCEPTION WHEN duplicate_object THEN NULL; 
END $$;

-- Notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  type notification_type NOT NULL,
  priority notification_priority DEFAULT 'MEDIUM',
  status notification_status DEFAULT 'UNREAD',
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB, -- Additional data for the notification
  action_url TEXT, -- URL to navigate to when clicked
  action_label TEXT, -- Label for the action button
  expires_at TIMESTAMPTZ, -- Optional expiration date
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notification preferences table
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  type notification_type NOT NULL,
  enabled BOOLEAN DEFAULT true,
  email_enabled BOOLEAN DEFAULT false,
  push_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, type)
);

-- Notification templates table
CREATE TABLE IF NOT EXISTS public.notification_templates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  type notification_type NOT NULL,
  title_template TEXT NOT NULL,
  message_template TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON public.notifications(status);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user_status ON public.notifications(user_id, status);

CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON public.notification_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_preferences_type ON public.notification_preferences(type);

CREATE INDEX IF NOT EXISTS idx_notification_templates_type ON public.notification_templates(type);
CREATE INDEX IF NOT EXISTS idx_notification_templates_active ON public.notification_templates(is_active);

-- Add updated_at trigger for notifications
DO $$ BEGIN 
  IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_notifications_updated_at') THEN 
    DROP TRIGGER update_notifications_updated_at ON public.notifications; 
  END IF; 
END $$;
CREATE TRIGGER update_notifications_updated_at 
  BEFORE UPDATE ON public.notifications 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add updated_at trigger for notification_preferences
DO $$ BEGIN 
  IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_notification_preferences_updated_at') THEN 
    DROP TRIGGER update_notification_preferences_updated_at ON public.notification_preferences; 
  END IF; 
END $$;
CREATE TRIGGER update_notification_preferences_updated_at 
  BEFORE UPDATE ON public.notification_preferences 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add updated_at trigger for notification_templates
DO $$ BEGIN 
  IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_notification_templates_updated_at') THEN 
    DROP TRIGGER update_notification_templates_updated_at ON public.notification_templates; 
  END IF; 
END $$;
CREATE TRIGGER update_notification_templates_updated_at 
  BEFORE UPDATE ON public.notification_templates 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default notification templates
INSERT INTO public.notification_templates (type, title_template, message_template) VALUES
  ('ASSIGNMENT_CREATED', 'New Assignment: {{title}}', 'You have been assigned a new task: {{title}}. Due: {{due_date}}'),
  ('ASSIGNMENT_UPDATED', 'Assignment Updated: {{title}}', 'The assignment "{{title}}" has been updated. Status: {{status}}'),
  ('ASSIGNMENT_COMPLETED', 'Assignment Completed: {{title}}', 'The assignment "{{title}}" has been completed by {{user_name}}'),
  ('CUSTOMER_CREATED', 'New Customer Added', 'A new customer "{{customer_name}}" has been added to the system'),
  ('CUSTOMER_UPDATED', 'Customer Updated', 'Customer "{{customer_name}}" information has been updated'),
  ('USER_INVITED', 'User Invitation', '{{inviter_name}} has invited {{invited_email}} to join the team'),
  ('USER_ROLE_CHANGED', 'Role Updated', 'Your role has been changed to {{new_role}} by {{admin_name}}'),
  ('SYSTEM_MAINTENANCE', 'System Maintenance', 'Scheduled maintenance: {{message}}'),
  ('DATA_IMPORT_COMPLETED', 'Data Import Completed', 'Your data import has completed. {{processed_rows}} rows processed successfully'),
  ('DATA_EXPORT_COMPLETED', 'Data Export Completed', 'Your data export has completed. Download: {{download_url}}'),
  ('AUDIT_LOG_CREATED', 'Audit Log Entry', '{{action}} performed on {{entity_type}} by {{user_name}}')
ON CONFLICT DO NOTHING;

-- Create function to create notification
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_type notification_type,
  p_title TEXT,
  p_message TEXT,
  p_priority notification_priority DEFAULT 'MEDIUM',
  p_data JSONB DEFAULT NULL,
  p_action_url TEXT DEFAULT NULL,
  p_action_label TEXT DEFAULT NULL,
  p_expires_at TIMESTAMPTZ DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  notification_id UUID;
BEGIN
  -- Check if user has notifications enabled for this type
  IF NOT EXISTS (
    SELECT 1 FROM public.notification_preferences 
    WHERE user_id = p_user_id 
    AND type = p_type 
    AND enabled = true
  ) THEN
    -- Create default preference if it doesn't exist
    INSERT INTO public.notification_preferences (user_id, type, enabled)
    VALUES (p_user_id, p_type, true)
    ON CONFLICT (user_id, type) DO NOTHING;
  END IF;

  -- Create the notification
  INSERT INTO public.notifications (
    user_id, type, priority, title, message, data, action_url, action_label, expires_at
  ) VALUES (
    p_user_id, p_type, p_priority, p_title, p_message, p_data, p_action_url, p_action_label, p_expires_at
  ) RETURNING id INTO notification_id;

  RETURN notification_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to mark notification as read
CREATE OR REPLACE FUNCTION mark_notification_read(p_notification_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.notifications 
  SET status = 'READ', read_at = NOW()
  WHERE id = p_notification_id AND user_id = p_user_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Create function to mark all notifications as read for a user
CREATE OR REPLACE FUNCTION mark_all_notifications_read(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE public.notifications 
  SET status = 'READ', read_at = NOW()
  WHERE user_id = p_user_id AND status = 'UNREAD';
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- Create function to get unread notification count
CREATE OR REPLACE FUNCTION get_unread_notification_count(p_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER 
    FROM public.notifications 
    WHERE user_id = p_user_id 
    AND status = 'UNREAD'
    AND (expires_at IS NULL OR expires_at > NOW())
  );
END;
$$ LANGUAGE plpgsql;

-- Create function to clean up expired notifications
CREATE OR REPLACE FUNCTION cleanup_expired_notifications()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.notifications 
  WHERE expires_at IS NOT NULL AND expires_at < NOW();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

COMMIT;
