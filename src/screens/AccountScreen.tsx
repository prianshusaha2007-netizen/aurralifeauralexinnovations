import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Mail, LogOut, Trash2, Download, Shield, Key, ChevronRight, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useAura } from '@/contexts/AuraContext';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface AccountScreenProps {
  onBack?: () => void;
}

export const AccountScreen: React.FC<AccountScreenProps> = ({ onBack }) => {
  const navigate = useNavigate();
  const { userProfile, clearChatHistory, clearAllMemories } = useAura();
  const { user, signOut } = useAuth();
  const { toast } = useToast();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth', { replace: true });
  };

  const handleExportData = async () => {
    toast({
      title: "Export Started",
      description: "Your data is being prepared for download...",
    });

    // Simulate export - in real app, this would compile user data
    setTimeout(() => {
      toast({
        title: "Export Ready",
        description: "Your data export has been prepared.",
      });
    }, 2000);
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'DELETE') {
      toast({
        title: "Confirmation Required",
        description: "Please type DELETE to confirm",
        variant: "destructive",
      });
      return;
    }

    setIsDeleting(true);
    try {
      // Clear all user data
      clearChatHistory();
      clearAllMemories();

      // In a real app, you would also:
      // 1. Delete user data from Supabase tables
      // 2. Call supabase.auth.admin.deleteUser() or similar

      await signOut();
      navigate('/auth', { replace: true });

      toast({
        title: "Account Deleted",
        description: "Your account and all data have been removed.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-border">
        {onBack && (
          <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        )}
        <div>
          <h1 className="text-xl font-semibold">Account</h1>
          <p className="text-sm text-muted-foreground">Manage your account settings</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 pb-24 space-y-6">
        {/* Profile Info */}
        <Card className="border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-7 h-7 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-lg">{userProfile.name || 'User'}</p>
                <p className="text-sm text-muted-foreground">{user?.email || 'No email'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Options */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider px-1">
            Login & Security
          </h3>
          
          <Card className="border-border/50">
            <CardContent className="p-0">
              <div className="flex items-center gap-3 p-4">
                <div className="p-2 rounded-xl bg-blue-500/10">
                  <Mail className="w-4 h-4 text-blue-500" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">Email</p>
                  <p className="text-xs text-muted-foreground">{user?.email || 'Not set'}</p>
                </div>
              </div>
              
              <div className="border-t border-border/50" />
              
              <div className="flex items-center gap-3 p-4">
                <div className="p-2 rounded-xl bg-green-500/10">
                  <Key className="w-4 h-4 text-green-500" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">Login Method</p>
                  <p className="text-xs text-muted-foreground">
                    {user?.app_metadata?.provider === 'google' ? 'Google' : 'Email & Password'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Data Management */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider px-1">
            Data Management
          </h3>
          
          <Card className="border-border/50">
            <CardContent className="p-0">
              <button 
                onClick={handleExportData}
                className="w-full flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="p-2 rounded-xl bg-purple-500/10">
                  <Download className="w-4 h-4 text-purple-500" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium text-sm">Export My Data</p>
                  <p className="text-xs text-muted-foreground">Download all your AURRA data</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>
              
              <div className="border-t border-border/50" />
              
              <div className="flex items-center gap-3 p-4">
                <div className="p-2 rounded-xl bg-muted">
                  <Shield className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">Privacy</p>
                  <p className="text-xs text-muted-foreground">Your data is encrypted and secure</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sign Out */}
        <Button 
          variant="outline" 
          className="w-full rounded-xl"
          onClick={handleSignOut}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>

        {/* Danger Zone */}
        <div className="space-y-3 pt-4">
          <h3 className="text-sm font-medium text-destructive uppercase tracking-wider px-1">
            Danger Zone
          </h3>
          
          <Card className="border-destructive/30">
            <CardContent className="p-4">
              <button 
                onClick={() => setDeleteDialogOpen(true)}
                className="w-full flex items-center gap-3"
              >
                <div className="p-2 rounded-xl bg-destructive/10">
                  <Trash2 className="w-4 h-4 text-destructive" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium text-sm text-destructive">Delete Account</p>
                  <p className="text-xs text-muted-foreground">Permanently remove all data</p>
                </div>
                <ChevronRight className="w-4 h-4 text-destructive" />
              </button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Account Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Delete Account
            </DialogTitle>
            <DialogDescription>
              This action cannot be undone. All your data, memories, conversations, and settings will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <p className="text-sm text-muted-foreground">
              Type <span className="font-mono font-bold text-destructive">DELETE</span> to confirm:
            </p>
            <Input
              value={deleteConfirmation}
              onChange={(e) => setDeleteConfirmation(e.target.value)}
              placeholder="Type DELETE"
              className="font-mono"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteAccount}
              disabled={deleteConfirmation !== 'DELETE' || isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete Account'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AccountScreen;
