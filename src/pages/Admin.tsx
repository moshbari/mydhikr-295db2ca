import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ArrowLeft, Users, Edit3, Trash2, Save, Shield } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface UserProfile {
  id: string;
  user_id: string;
  display_name: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  email?: string;
  role?: string;
}

const Admin = () => {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Redirect if not admin - but wait for auth to load and role to update
  useEffect(() => {
    console.log('Admin page - user:', user, 'user.role:', user?.role, 'isAdmin:', isAdmin(), 'authLoading:', authLoading);
    
    // Don't redirect while auth is still loading
    if (authLoading) return;
    
    if (!user) {
      console.log('No user after loading, redirecting to auth');
      navigate('/auth', { replace: true });
      return;
    }
    
    // Give extra time for role to load if user exists but role is still 'user'
    // We know from the database that this user should be admin
    if (user && user.role === 'user') {
      console.log('User exists but role is still user, waiting for role update...');
      
      // Set a timeout to check again after role has time to update
      const timeoutId = setTimeout(() => {
        console.log('Timeout reached, checking role again:', user.role);
        if (user.role !== 'admin') {
          console.log('Role still not admin after timeout, redirecting to home');
          navigate('/', { replace: true });
        }
      }, 1000); // Wait 1 second for role update
      
      return () => clearTimeout(timeoutId);
    }
    
    if (!isAdmin()) {
      console.log('User is not admin after loading, redirecting to home');
      navigate('/', { replace: true });
      return;
    }
  }, [user, isAdmin, navigate, authLoading]);

  useEffect(() => {
    if (isAdmin()) {
      fetchUsers();
    }
  }, [isAdmin]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Get all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*');

      if (profilesError) throw profilesError;

      // Get user roles separately
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      // Create a map of user roles
      const roleMap = new Map();
      userRoles?.forEach(userRole => {
        roleMap.set(userRole.user_id, userRole.role);
      });

      // Combine the data with actual emails from profiles
      const usersWithDetails = profiles?.map(profile => ({
        ...profile,
        email: profile.email || 'No email set', // Show actual email from profiles table
        role: roleMap.get(profile.user_id) || 'user'
      })) || [];

      setUsers(usersWithDetails);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error loading users",
        description: "There was an issue loading user data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveUser = async (updatedUser: UserProfile) => {
    try {
      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          display_name: updatedUser.display_name,
          is_active: updatedUser.is_active,
        })
        .eq('user_id', updatedUser.user_id);

      if (profileError) throw profileError;

      // Update role if changed
      if (updatedUser.role) {
        // First delete existing role
        await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', updatedUser.user_id);

        // Insert new role
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: updatedUser.user_id,
            role: updatedUser.role as 'admin' | 'user'
          });

        if (roleError) throw roleError;
      }

      toast({
        title: "Success",
        description: "User updated successfully",
      });

      setEditingUser(null);
      fetchUsers();
    } catch (error) {
      console.error('Error saving user:', error);
      toast({
        title: "Error",
        description: "Failed to update user",
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      // Delete from auth.users (this will cascade to profiles and user_roles)
      const { error } = await supabase.auth.admin.deleteUser(userId);
      
      if (error) {
        console.error('Delete error:', error);
        // Fallback: delete from profiles table
        const { error: profileError } = await supabase
          .from('profiles')
          .delete()
          .eq('user_id', userId);
        
        if (profileError) throw profileError;
      }

      toast({
        title: "Success",
        description: "User deleted successfully",
      });

      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive",
      });
    }
  };

  const filteredUsers = users.filter(user => 
    user.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isAdmin()) {
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
        </div>

        {/* Search */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              User Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 mb-4">
              <div className="flex-1">
                <Label htmlFor="search">Search Users</Label>
                <Input
                  id="search"
                  name="search"
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  autoComplete="off"
                />
              </div>
              <div className="flex items-end">
                <Button onClick={fetchUsers} disabled={loading}>
                  {loading ? "Loading..." : "Refresh"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Users List */}
        <div className="grid gap-4">
          {filteredUsers.map((userProfile) => (
            <Card key={userProfile.id} className="overflow-hidden">
              <CardContent className="p-6">
                {editingUser?.id === userProfile.id ? (
                  // Edit Mode
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="display_name">Display Name</Label>
                        <Input
                          id="display_name"
                          name="displayName"
                          value={editingUser.display_name || ''}
                          onChange={(e) => setEditingUser({
                            ...editingUser,
                            display_name: e.target.value
                          })}
                          autoComplete="name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="role">Role</Label>
                        <Select
                          value={editingUser.role}
                          onValueChange={(value) => setEditingUser({
                            ...editingUser,
                            role: value
                          })}
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
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="is_active"
                        checked={editingUser.is_active}
                        onCheckedChange={(checked) => setEditingUser({
                          ...editingUser,
                          is_active: checked
                        })}
                      />
                      <Label htmlFor="is_active">Active</Label>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleSaveUser(editingUser)}
                        className="flex items-center gap-2"
                      >
                        <Save className="h-4 w-4" />
                        Save
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setEditingUser(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  // View Mode
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold">
                          {userProfile.display_name || 'No Display Name'}
                        </h3>
                        <Badge variant={userProfile.role === 'admin' ? 'default' : 'secondary'}>
                          {userProfile.role}
                        </Badge>
                        <Badge variant={userProfile.is_active ? 'default' : 'destructive'}>
                          {userProfile.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {userProfile.email}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Joined: {new Date(userProfile.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingUser(userProfile)}
                        className="flex items-center gap-2"
                      >
                        <Edit3 className="h-4 w-4" />
                        Edit
                      </Button>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="flex items-center gap-2"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete {userProfile.display_name || userProfile.email}? 
                              This action cannot be undone and will permanently delete all user data.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteUser(userProfile.user_id)}
                              className="bg-destructive text-destructive-foreground"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredUsers.length === 0 && !loading && (
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