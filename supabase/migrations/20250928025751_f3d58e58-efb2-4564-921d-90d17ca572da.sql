-- Fix RLS policies for user_roles table to prevent the chicken-and-egg problem
-- during role updates

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can manage all roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON user_roles;

-- Create separate policies for each operation
-- Users can view their own roles
CREATE POLICY "Users can view their own roles" ON user_roles
FOR SELECT
USING (auth.uid() = user_id);

-- Admins can view all roles
CREATE POLICY "Admins can view all roles" ON user_roles
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can delete any role
CREATE POLICY "Admins can delete all roles" ON user_roles
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can update any role
CREATE POLICY "Admins can update all roles" ON user_roles
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- More permissive INSERT policy: Allow if user has admin role OR 
-- if inserting a 'user' role (for new user registration)
CREATE POLICY "Admins can insert roles" ON user_roles
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  (role = 'user'::app_role AND auth.uid() = user_id)
);