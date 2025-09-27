import { supabase } from "@/integrations/supabase/client";

export const createAdminAccounts = async () => {
  // Skip admin creation to avoid signup conflicts
  // Admin accounts should be created manually if needed
  return;
};

export const changePassword = async (newPassword: string) => {
  const { error } = await supabase.auth.updateUser({
    password: newPassword
  });
  
  return { error };
};