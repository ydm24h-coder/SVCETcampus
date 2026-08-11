import React, { useState } from 'react';
import { Settings2, User, Users, Bell, Shield, ShieldCheck, Database, UploadCloud, Save, BellRing, Loader2, Eye, EyeOff, Plus, Trash2, Activity, Clock, Edit, Check, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { useAdmins } from '@/hooks/useAdmins';
import { useAdminLogs } from '@/hooks/useAdminLogs';

const SettingsPage = () => {
  const [passwords, setPasswords] = useState({ current: '', new: '' });
  const [showPasswords, setShowPasswords] = useState({ current: false, new: false });
  const [customAvatarUrl, setCustomAvatarUrl] = useState('');
  const [avatarPreview, setAvatarPreview] = useState(null);

  const adminSession = JSON.parse(localStorage.getItem('svcet_session_admin')) || {};
  const [currentUser, setCurrentUser] = useState(adminSession);

  // New Hooks for Admin Management & Logs
  const { admins, addAdmin, updateAdmin, deleteAdmin } = useAdmins();
  const { logs, logAction } = useAdminLogs();
  
  const [newAdminForm, setNewAdminForm] = useState({ name: '', email: '', password: '', role: 'Admin' });
  const [isAdminDialogOpen, setIsAdminDialogOpen] = useState(false);

  const [editAdminForm, setEditAdminForm] = useState(null);
  const [isEditAdminDialogOpen, setIsEditAdminDialogOpen] = useState(false);

  const [profileForm, setProfileForm] = useState({
    name: adminSession.name || '',
    email: adminSession.email || '',
    phone: adminSession.phone || ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleProfileSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      const sessionUser = JSON.parse(localStorage.getItem('svcet_session_admin')) || {};
      const updatedUser = { ...sessionUser, ...profileForm };
      localStorage.setItem('svcet_session_admin', JSON.stringify(updatedUser));
      setCurrentUser(updatedUser);
      logAction(currentUser?.name || 'Super Admin', `Updated personal profile details`);
      
      setIsSaving(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      window.dispatchEvent(new Event('storage'));
    }, 800);
  };

  const handleEditAdmin = (e) => {
    e.preventDefault();
    updateAdmin(editAdminForm.id, editAdminForm);
    logAction(currentUser?.name || 'Super Admin', `Updated admin account: ${editAdminForm.name}`);
    setIsEditAdminDialogOpen(false);
    setEditAdminForm(null);
  };

  const handleCreateAdmin = (e) => {
    e.preventDefault();
    addAdmin(newAdminForm);
    logAction(currentUser?.name || 'Super Admin', `Created a new admin account for ${newAdminForm.name} (${newAdminForm.email})`);
    setNewAdminForm({ name: '', email: '', password: '', role: 'Admin' });
    setIsAdminDialogOpen(false);
  };

  const handleDeleteAdmin = (adminId, adminName) => {
    if (window.confirm(`Are you sure you want to revoke access for ${adminName}?`)) {
      if (deleteAdmin(adminId)) {
        logAction(currentUser?.name || 'Super Admin', `Deleted admin account: ${adminName}`);
      } else {
        alert("Cannot delete the Super Admin account.");
      }
    }
  };

  const avatars = [
    'https://www.clipartmax.com/png/full/319-3191274_male-avatar-admin-profile.png',
    '/avatars/male_1.png',
    '/avatars/female_1.png',
    '/avatars/male_2.png',
  ];

  const handleAvatarSelect = (avatarPath) => {
    if (!avatarPath || avatarPath.trim() === '') return;
    
    const sessionUser = JSON.parse(localStorage.getItem('svcet_session_admin')) || {};
    const updatedUser = { ...sessionUser, avatar: avatarPath };
    localStorage.setItem('svcet_session_admin', JSON.stringify(updatedUser));
    setCurrentUser(updatedUser);
    window.dispatchEvent(new Event('storage'));
    
    setCustomAvatarUrl(''); // clear input on success
    alert('Admin Avatar successfully updated!');
    logAction(currentUser?.name || 'Super Admin', `Updated their profile picture`);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("File size exceeds 2MB limit. Please choose a smaller image.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleConfirmPreview = () => {
    if (avatarPreview) {
      handleAvatarSelect(avatarPreview);
      setAvatarPreview(null);
    }
  };

  const [notificationPrefs, setNotificationPrefs] = useState(() => {
    return JSON.parse(localStorage.getItem('svcet_admin_notif_prefs')) || {
      email: true,
      push: true,
      securityAlerts: true,
      weeklyReports: false
    };
  });

  const toggleNotificationPref = (key) => {
    setNotificationPrefs(prev => {
      const updated = { ...prev, [key]: !prev[key] };
      localStorage.setItem('svcet_admin_notif_prefs', JSON.stringify(updated));
      return updated;
    });
  };

  const formatTime = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-6 pb-20">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings & Administration</h1>
        <p className="text-neutral-500 dark:text-neutral-400">Manage your portal preferences, admin accounts, and system configurations.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="col-span-full border-indigo-200 dark:border-indigo-900 bg-white/50 dark:bg-neutral-900/50 backdrop-blur overflow-hidden flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <User className="w-5 h-5 mr-2 text-indigo-500" />
              My Admin Profile
            </CardTitle>
            <CardDescription>Manage your personal administrator details.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Admin Profile Strength Meter */}
            <div className="space-y-2 p-4 bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-800/50 rounded-xl">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-indigo-900 dark:text-indigo-100">Profile Strength</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400">
                  {(() => {
                    let s = 40;
                    if (profileForm.name) s += 20;
                    if (profileForm.email) s += 20;
                    if (profileForm.phone) s += 20;
                    return s;
                  })()}%
                </span>
              </div>
              <div className="w-full h-2 bg-indigo-100 dark:bg-indigo-900/40 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full transition-all duration-1000"
                  style={{ width: `${(() => {
                    let s = 40;
                    if (profileForm.name) s += 20;
                    if (profileForm.email) s += 20;
                    if (profileForm.phone) s += 20;
                    return s;
                  })()}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-3 text-neutral-400" />
                  <Input 
                    value={profileForm.name} 
                    onChange={e => setProfileForm({...profileForm, name: e.target.value})} 
                    className="pl-9 bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800" 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <div className="relative">
                  <Shield className="w-4 h-4 absolute left-3 top-3 text-neutral-400" />
                  <Input 
                    value={currentUser?.role || 'Admin'} 
                    disabled 
                    className="pl-9 bg-neutral-100 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800" 
                  />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input 
                  type="email" 
                  value={profileForm.email} 
                  onChange={e => setProfileForm({...profileForm, email: e.target.value})} 
                  className="bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800" 
                />
              </div>
              <div className="space-y-2">
                <Label>Phone Number</Label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-3 text-neutral-400" />
                  <Input 
                    value={profileForm.phone} 
                    onChange={e => setProfileForm({...profileForm, phone: e.target.value})} 
                    placeholder="+91 98765 43210" 
                    className="pl-9 bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800" 
                  />
                </div>
              </div>
            </div>
            
            <Button 
              onClick={handleProfileSave} 
              disabled={isSaving}
              className={`w-full mt-4 transition-all duration-300 ${saveSuccess ? 'bg-emerald-500 hover:bg-emerald-600 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:shadow-lg'}`}
            >
              {isSaving ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving</>
              ) : saveSuccess ? (
                <><Check className="w-4 h-4 mr-2" /> Profile Saved Successfully!</>
              ) : (
                <><Save className="w-4 h-4 mr-2" /> Save Profile Changes</>
              )}
            </Button>
          </CardContent>
        </Card>


        {/* Admin Accounts Management */}
        <Card className="col-span-full border-indigo-200 dark:border-indigo-900 bg-indigo-50/30 dark:bg-indigo-950/10 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="flex items-center text-xl text-indigo-700 dark:text-indigo-400">
                <ShieldCheck className="w-6 h-6 mr-2" />
                Admin Accounts Management
              </CardTitle>
              <CardDescription className="mt-1">Add, remove, and manage administrator access.</CardDescription>
            </div>
            <Dialog open={isAdminDialogOpen} onOpenChange={setIsAdminDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md">
                  <Plus className="w-4 h-4 mr-2" /> Add Admin
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md bg-white dark:bg-neutral-900">
                <DialogHeader>
                  <DialogTitle>Create Admin Account</DialogTitle>
                </DialogHeader>
                <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 p-3 rounded-md text-sm mt-2 border border-blue-200 dark:border-blue-800">
                  <strong>Role Guide:</strong>
                  <ul className="list-disc ml-5 mt-1">
                    <li><strong>Super Admin:</strong> Full system access, can manage other admins.</li>
                    <li><strong>Admin:</strong> Standard management access (Students, Faculty).</li>
                    <li><strong>Moderator:</strong> Limited access (Feedback and Notices only).</li>
                  </ul>
                </div>
                <form onSubmit={handleCreateAdmin} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    <Input value={newAdminForm.name} onChange={e => setNewAdminForm({...newAdminForm, name: e.target.value})} required placeholder="e.g. John Doe" />
                  </div>
                  <div className="space-y-2">
                    <Label>Email Address (Login ID)</Label>
                    <Input type="email" value={newAdminForm.email} onChange={e => setNewAdminForm({...newAdminForm, email: e.target.value})} required placeholder="admin@svcet.edu" />
                  </div>
                  <div className="space-y-2">
                    <Label>Temporary Password</Label>
                    <Input type="text" value={newAdminForm.password} onChange={e => setNewAdminForm({...newAdminForm, password: e.target.value})} required placeholder="Enter strong password" />
                  </div>
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <select value={newAdminForm.role || 'Admin'} onChange={e => setNewAdminForm({...newAdminForm, role: e.target.value})} className="flex h-10 w-full rounded-md border border-neutral-200 bg-white text-neutral-900 px-3 py-2 text-sm dark:border-neutral-800 dark:bg-neutral-950 dark:text-white">
                      <option value="Admin">Standard Admin</option>
                      <option value="Super Admin">Super Admin</option>
                      <option value="Moderator">Moderator</option>
                    </select>
                  </div>
                  <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white mt-4">Create Account</Button>
                </form>
              </DialogContent>
            </Dialog>

            <Dialog open={isEditAdminDialogOpen} onOpenChange={setIsEditAdminDialogOpen}>
              <DialogContent className="sm:max-w-md bg-white dark:bg-neutral-900">
                <DialogHeader>
                  <DialogTitle>Edit Admin Account</DialogTitle>
                </DialogHeader>
                {editAdminForm && (
                  <form onSubmit={handleEditAdmin} className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label>Full Name</Label>
                      <Input value={editAdminForm.name} onChange={e => setEditAdminForm({...editAdminForm, name: e.target.value})} required />
                    </div>
                    <div className="space-y-2">
                      <Label>Email Address (Login ID)</Label>
                      <Input type="email" value={editAdminForm.email} onChange={e => setEditAdminForm({...editAdminForm, email: e.target.value})} required />
                    </div>
                    <div className="space-y-2">
                      <Label>Password</Label>
                      <Input type="text" value={editAdminForm.password} onChange={e => setEditAdminForm({...editAdminForm, password: e.target.value})} required />
                    </div>
                    <div className="space-y-2">
                      <Label>Role</Label>
                      <select value={editAdminForm.role || 'Admin'} onChange={e => setEditAdminForm({...editAdminForm, role: e.target.value})} className="flex h-10 w-full rounded-md border border-neutral-200 bg-white text-neutral-900 px-3 py-2 text-sm dark:border-neutral-800 dark:bg-neutral-950 dark:text-white">
                        <option value="Admin">Standard Admin</option>
                        <option value="Super Admin">Super Admin</option>
                        <option value="Moderator">Moderator</option>
                      </select>
                    </div>
                    <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white mt-4">Save Changes</Button>
                  </form>
                )}
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-neutral-200 dark:border-neutral-800">
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  {(currentUser?.role === 'Super Admin' || currentUser?.name === 'Super Admin') && <TableHead>Password</TableHead>}
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {admins.map((admin) => (
                  <TableRow key={admin.id} className="border-neutral-200 dark:border-neutral-800">
                    <TableCell className="font-semibold">{admin.name}</TableCell>
                    <TableCell className="text-neutral-500">{admin.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={
                        admin.role === 'Super Admin' ? 'border-red-200 text-red-700 bg-red-50 dark:bg-red-900/20' : 
                        'border-indigo-200 text-indigo-700 bg-indigo-50 dark:bg-indigo-900/20'
                      }>
                        {admin.role}
                      </Badge>
                    </TableCell>
                    {(currentUser?.role === 'Super Admin' || currentUser?.name === 'Super Admin') && (
                      <TableCell className="font-mono text-sm text-neutral-600 dark:text-neutral-400">
                        {admin.password}
                      </TableCell>
                    )}
                    <TableCell className="text-neutral-500 text-sm">{formatTime(admin.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      {(currentUser?.role === 'Super Admin' || currentUser?.name === 'Super Admin') && (
                        <>
                          <Button variant="ghost" size="icon" onClick={() => { setEditAdminForm(admin); setIsEditAdminDialogOpen(true); }} className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 mr-1">
                            <Edit className="w-4 h-4" />
                          </Button>
                          {admin.id !== 'admin_0' && (
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteAdmin(admin.id, admin.name)} className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Admin Activity Log */}
        <Card className="col-span-full border-neutral-200 dark:border-neutral-800 bg-white/50 dark:bg-neutral-900/50 backdrop-blur">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-lg">
              <Activity className="w-5 h-5 mr-2 text-blue-500" />
              Admin Activity Logs
            </CardTitle>
            <CardDescription>Real-time audit trail of all administrative actions and changes.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 overflow-y-auto pr-4 space-y-4 border rounded-lg p-4 bg-neutral-50/50 dark:bg-neutral-950/50 border-neutral-100 dark:border-neutral-800">
              {logs.length === 0 ? (
                <div className="text-center py-8 text-neutral-500">No recent activity.</div>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className="flex gap-4 items-start relative group">
                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 shrink-0 relative z-10" />
                    {/* Line connector */}
                    <div className="absolute top-4 bottom-[-16px] left-[3px] w-[2px] bg-neutral-200 dark:bg-neutral-800 group-last:hidden" />
                    
                    <div className="flex-1 bg-white dark:bg-neutral-900 p-3 rounded-lg border border-neutral-100 dark:border-neutral-800 shadow-sm">
                      <p className="text-sm font-medium text-neutral-900 dark:text-white">
                        <span className="text-blue-600 dark:text-blue-400">{log.adminName}</span> {log.action}
                      </p>
                      <p className="text-xs text-neutral-500 mt-1 flex items-center">
                        <Clock className="w-3 h-3 mr-1" /> {formatTime(log.timestamp)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Preferences */}
        <Card className="border-neutral-200 dark:border-neutral-800 bg-white/50 dark:bg-neutral-900/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Settings2 className="w-5 h-5 mr-2 text-neutral-500" />
              Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-medium">Appearance</Label>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">Toggle light and dark mode</p>
              </div>
              <ThemeToggle />
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="border-neutral-200 dark:border-neutral-800 bg-white/50 dark:bg-neutral-900/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Bell className="w-5 h-5 mr-2 text-neutral-500" />
              Notifications
            </CardTitle>
            <CardDescription>Manage system-wide alerts and reports.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-medium">Email Notifications</Label>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">Receive administrative updates via email</p>
              </div>
              <button 
                onClick={() => toggleNotificationPref('email')}
                className={`w-11 h-6 rounded-full transition-colors relative ${notificationPrefs.email ? 'bg-blue-600' : 'bg-neutral-300 dark:bg-neutral-700'}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${notificationPrefs.email ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-medium">Push Notifications</Label>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">Receive alerts on your dashboard</p>
              </div>
              <button 
                onClick={() => toggleNotificationPref('push')}
                className={`w-11 h-6 rounded-full transition-colors relative ${notificationPrefs.push ? 'bg-blue-600' : 'bg-neutral-300 dark:bg-neutral-700'}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${notificationPrefs.push ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Profile Picture */}
        <Card className="border-neutral-200 dark:border-neutral-800 bg-white/50 dark:bg-neutral-900/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <User className="w-5 h-5 mr-2 text-indigo-500" />
              Profile Picture
            </CardTitle>
            <CardDescription>Select an avatar to personalize your admin account.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-4 gap-4">
              {avatars.map(avatar => (
                <button
                  key={avatar}
                  onClick={() => handleAvatarSelect(avatar)}
                  className={`relative aspect-square rounded-2xl overflow-hidden border-2 transition-all hover:scale-105 ${
                    currentUser?.avatar === avatar 
                      ? 'border-indigo-500 ring-4 ring-indigo-500/20 shadow-lg scale-105' 
                      : 'border-transparent hover:border-neutral-300 dark:hover:border-neutral-700 opacity-80 hover:opacity-100'
                  }`}
                >
                  <img src={avatar} alt="Avatar" className="w-full h-full object-cover bg-neutral-100 dark:bg-neutral-800" />
                </button>
              ))}
            </div>
            
            <div className="pt-6 mt-4 border-t border-neutral-200 dark:border-neutral-800 space-y-6">
              <div>
                <h4 className="font-semibold text-neutral-900 dark:text-white mb-3">Upload Custom Avatar</h4>
                
                {avatarPreview ? (
                  <div className="flex flex-col items-center p-6 border-2 border-neutral-200 dark:border-neutral-800 rounded-2xl bg-neutral-50 dark:bg-neutral-900/50">
                    <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white dark:border-neutral-800 shadow-lg mb-6">
                      <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex gap-3">
                      <Button variant="outline" onClick={() => setAvatarPreview(null)}>Cancel</Button>
                      <Button className="bg-indigo-600 hover:bg-indigo-700 text-white" onClick={handleConfirmPreview}>Set Profile</Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="relative border-2 border-dashed border-indigo-200 dark:border-indigo-800/50 rounded-2xl p-8 flex flex-col items-center justify-center bg-indigo-50/50 dark:bg-indigo-900/10 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all group cursor-pointer overflow-hidden">
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleFileUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />
                      <div className="w-14 h-14 bg-white dark:bg-neutral-900 rounded-full shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                        <UploadCloud className="w-6 h-6 text-indigo-500" />
                      </div>
                      <h4 className="text-sm font-semibold text-neutral-900 dark:text-white mb-1">Click to upload from device</h4>
                    </div>

                    <div className="mt-6">
                      <Label className="mb-2 block text-neutral-700 dark:text-neutral-300">Or paste an Image URL</Label>
                      <div className="flex gap-3">
                        <Input 
                          placeholder="Paste any image URL here..." 
                          value={customAvatarUrl} 
                          onChange={(e) => setCustomAvatarUrl(e.target.value)} 
                        />
                        <Button 
                          onClick={() => {
                            if (customAvatarUrl) {
                              setAvatarPreview(customAvatarUrl);
                              setCustomAvatarUrl('');
                            }
                          }} 
                          disabled={!customAvatarUrl} 
                          className="bg-indigo-600 hover:bg-indigo-700 text-white shrink-0"
                        >
                          Preview URL
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card className="border-neutral-200 dark:border-neutral-800 bg-white/50 dark:bg-neutral-900/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Shield className="w-5 h-5 mr-2 text-neutral-500" />
              Security
            </CardTitle>
            <CardDescription>Manage password and authentication.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Current Password</Label>
              <div className="relative">
                <Input type={showPasswords.current ? "text" : "password"} placeholder="••••••••" />
                <button 
                  type="button"
                  onClick={() => setShowPasswords({...showPasswords, current: !showPasswords.current})}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
                >
                  {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>New Password</Label>
              <div className="relative">
                <Input type={showPasswords.new ? "text" : "password"} placeholder="Enter new password" />
                <button 
                  type="button"
                  onClick={() => setShowPasswords({...showPasswords, new: !showPasswords.new})}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
                >
                  {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <Button className="w-full">Update Password</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SettingsPage;
