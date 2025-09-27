import { supabase } from "@/integrations/supabase/client";

export const createAdminAccounts = async () => {
  const adminCredentials = [
    { email: 'engr.mbari@gmail.com', password: 'ScrtPsswrd98**' },
    { email: 'engrmoshbari@gmail.com', password: 'ScrtPsswrd98**' }
  ];

  for (const admin of adminCredentials) {
    try {
      // Try to create the admin account
      const { data, error } = await supabase.auth.signUp({
        email: admin.email,
        password: admin.password,
        options: {
          data: {
            display_name: admin.email.split('@')[0]
          }
        }
      });

      if (error && error.message !== 'User already registered') {
        console.error(`Error creating admin account for ${admin.email}:`, error);
      } else {
        console.log(`Admin account created/exists for ${admin.email}`);
      }
    } catch (error) {
      console.error(`Failed to create admin account for ${admin.email}:`, error);
    }
  }
};

export const changePassword = async (newPassword: string) => {
  const { error } = await supabase.auth.updateUser({
    password: newPassword
  });
  
  return { error };
};