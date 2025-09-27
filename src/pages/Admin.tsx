import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Save, Trash2, Shield, Users } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface UserProfile {
  id: string;
  user_id: string;
  display_name: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  email?: string;
  role?: 'admin' | 'user';
}

const Admin = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  // Redirect if not admin
  useEffect(() => {
    if (!user || !isAdmin()) {
      navigate('/');
      return;
    }
  }, [user, isAdmin, navigate]);

  // Fetch all users
  useEffect(() => {
    if (!user || !isAdmin()) return;
    
    const fetchUsers = async () => {
      try {
        // Get profiles with auth data
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });

        if (profilesError) throw profilesError;

        // Get auth users to get emails (admin only)
        const { data: { users: authUsers }, error: authError } = await supabase.auth.admin.listUsers();
        if (authError) throw authError;

        // Get user roles
        const { data: roles, error: rolesError } = await supabase
          .from('user_roles')
          .select('user_id, role');

        if (rolesError) throw rolesError;

        // Combine data
        const usersWithDetails: UserProfile[] = profiles?.map(profile => {
          const authUser = authUsers?.find((u: any) => u.id === profile.user_id);
          const userRole = roles?.find(r => r.user_id === profile.user_id);
          
          return {
            ...profile,
            email: authUser?.email || '',
            role: userRole?.role || 'user'
          };
        }) || [];

        setUsers(usersWithDetails);
      } catch (error) {
        console.error('Error fetching users:', error);
        toast({
          title: "Error",
          description: "Failed to load users",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [user, isAdmin, toast]);

  const updateUser = async (userId: string, updates: Partial<UserProfile>) => {
    setSaving(userId);
    try {
      // Update profile
      if (updates.display_name !== undefined || updates.is_active !== undefined) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            display_name: updates.display_name,
            is_active: updates.is_active,
          })
          .eq('user_id', userId);

        if (profileError) throw profileError;
      }

      // Update role if changed
      if (updates.role !== undefined) {
        // Delete existing role
        await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userId);

        // Insert new role
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: userId,
            role: updates.role
          });

        if (roleError) throw roleError;
      }

      // Update local state
      setUsers(users.map(user => 
        user.user_id === userId 
          ? { ...user, ...updates }
          : user
      ));

      toast({
        title: "Success",
        description: "User updated successfully",
      });
    } catch (error) {
      console.error('Error updating user:', error);
      toast({
        title: "Error",
        description: "Failed to update user",
        variant: "destructive",
      });
    } finally {
      setSaving(null);
    }
  };

  const deleteUser = async (userId: string) => {
    setSaving(userId);
    try {
      // Delete from auth (this will cascade to profiles and user_roles)
      const { error } = await supabase.auth.admin.deleteUser(userId);
      if (error) throw error;

      // Update local state
      setUsers(users.filter(user => user.user_id !== userId));

      toast({
        title: "Success",
        description: "User deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive",
      });
    } finally {
      setSaving(null);
    }
  };

  if (!user || !isAdmin()) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/')}
              className="rounded-full"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold text-foreground">Admin Panel</h1>
            </div>
          </div>
          <Badge variant="secondary" className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {users.length} Users
          </Badge>
        </div>

        {/* Users List */}
        {loading ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">Loading users...</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {users.map((userProfile) => (
              <Card key={userProfile.user_id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{userProfile.display_name || 'No name'}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant={userProfile.role === 'admin' ? 'default' : 'secondary'}>
                        {userProfile.role}
                      </Badge>
                      <Badge variant={userProfile.is_active ? 'default' : 'destructive'}>
                        {userProfile.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{userProfile.email}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Display Name */}
                    <div className="space-y-2">
                      <Label>Display Name</Label>
                      <Input
                        value={userProfile.display_name || ''}
                        onChange={(e) => {
                          setUsers(users.map(u => 
                            u.user_id === userProfile.user_id 
                              ? { ...u, display_name: e.target.value }
                              : u
                          ));
                        }}
                        placeholder="Enter display name"
                      />
                    </div>

                    {/* Role */}
                    <div className="space-y-2">
                      <Label>Role</Label>
                      <Select
                        value={userProfile.role}
                        onValueChange={(value) => {
                          setUsers(users.map(u => 
                            u.user_id === userProfile.user_id 
                              ? { ...u, role: value as 'admin' | 'user' }
                              : u
                          ));
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">User</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Status */}
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <div className="flex items-center space-x-2 pt-2">
                        <Switch
                          checked={userProfile.is_active}
                          onCheckedChange={(checked) => {
                            setUsers(users.map(u => 
                              u.user_id === userProfile.user_id 
                                ? { ...u, is_active: checked }
                                : u
                            ));
                          }}
                        />
                        <Label className="text-sm">
                          {userProfile.is_active ? 'Active' : 'Inactive'}
                        </Label>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="space-y-2">
                      <Label>Actions</Label>
                      <div className="flex gap-2 pt-1">
                        <Button
                          onClick={() => updateUser(userProfile.user_id, {
                            display_name: userProfile.display_name,
                            role: userProfile.role,
                            is_active: userProfile.is_active
                          })}
                          disabled={saving === userProfile.user_id}
                          size="sm"
                        >
                          <Save className="h-3 w-3 mr-1" />
                          Save
                        </Button>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="destructive" 
                              size="sm"
                              disabled={saving === userProfile.user_id}
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete User</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete {userProfile.display_name || userProfile.email}? 
                                This action cannot be undone and will permanently delete the user's account and all associated data.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteUser(userProfile.user_id)}
                                className="bg-destructive hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-xs text-muted-foreground">
                    Created: {new Date(userProfile.created_at).toLocaleDateString()} • 
                    ID: {userProfile.user_id.slice(0, 8)}...
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && users.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">No users found.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Admin;