import React, { useState, useEffect } from 'react';
import { Settings2, User, MessageSquare, Send, Shield, Eye, EyeOff, Lock, Star, Unlock, Bell, UploadCloud, Save, Loader2, Link, Phone, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useStudents } from '@/hooks/useStudents';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { useFeedback } from '@/hooks/useFeedback';
import { ActivityHeatmap } from '@/components/ui/ActivityHeatmap';

const SettingsPage = () => {
  const { students: adminStudents, updateStudent } = useStudents();
  const { students: leaderboardStudents, unlockAvatar } = useLeaderboard();

  const avatarTiers = [
    {
      name: 'Basic (Free)',
      cost: 0,
      avatars: [
        { id: 'basic_1', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex&backgroundColor=b6e3f4' },
        { id: 'basic_2', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah&backgroundColor=ffdfbf' },
        { id: 'basic_3', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ryan&backgroundColor=c0aede' },
        { id: 'basic_4', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mia&backgroundColor=d1d4f9' },
      ]
    },
    {
      name: 'Rare (50 Stars)',
      cost: 50,
      avatars: [
        { id: 'rare_1', url: 'https://api.dicebear.com/7.x/notionists/svg?seed=Sam&backgroundColor=ffdfbf' },
        { id: 'rare_2', url: 'https://api.dicebear.com/7.x/notionists/svg?seed=Zoey&backgroundColor=b6e3f4' },
        { id: 'rare_3', url: 'https://api.dicebear.com/7.x/notionists/svg?seed=Oliver&backgroundColor=c0aede' },
        { id: 'rare_4', url: 'https://api.dicebear.com/7.x/notionists/svg?seed=Emma&backgroundColor=d1d4f9' },
      ]
    },
    {
      name: 'Epic (200 Stars)',
      cost: 200,
      avatars: [
        { id: 'epic_1', url: 'https://api.dicebear.com/7.x/micah/svg?seed=Liam&backgroundColor=c0aede' },
        { id: 'epic_2', url: 'https://api.dicebear.com/7.x/micah/svg?seed=Ava&backgroundColor=ffdfbf' },
        { id: 'epic_3', url: 'https://api.dicebear.com/7.x/micah/svg?seed=Noah&backgroundColor=b6e3f4' },
        { id: 'epic_4', url: 'https://api.dicebear.com/7.x/micah/svg?seed=Sophia&backgroundColor=d1d4f9' },
      ]
    }
  ];
  
  const [currentUser, setCurrentUser] = useState(null);
  const [userStats, setUserStats] = useState(null);

  const [profileForm, setProfileForm] = useState({
    phone: '',
    bio: '',
    github: '',
    linkedin: '',
    skills: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setProfileForm({
        phone: currentUser.phone || '',
        bio: currentUser.bio || '',
        github: currentUser.github || '',
        linkedin: currentUser.linkedin || '',
        skills: currentUser.skills || ''
      });
    }
  }, [currentUser]);

  const handleProfileSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      if (currentUser?.id) {
        updateStudent(currentUser.id, { ...currentUser, ...profileForm });
      }
      const sessionUser = JSON.parse(localStorage.getItem('svcet_session_student')) || {};
      const updatedUser = { ...sessionUser, ...profileForm };
      localStorage.setItem('svcet_session_student', JSON.stringify(updatedUser));
      setCurrentUser(prev => prev ? { ...prev, ...profileForm } : null);
      
      setIsSaving(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }, 800);
  };

  
  const [passwords, setPasswords] = useState({ current: '', new: '' });
  const [showPasswords, setShowPasswords] = useState({ current: false, new: false });
  const { addFeedback } = useFeedback();
  const [feedbackType, setFeedbackType] = useState('Feature Request (Facility)');
  const [feedbackMessage, setFeedbackMessage] = useState('');

  const [notificationPrefs, setNotificationPrefs] = useState(() => {
    return JSON.parse(localStorage.getItem('svcet_student_notif_prefs')) || {
      email: true,
      push: true,
      dailyReminders: true,
      assessmentAlerts: true
    };
  });

  const toggleNotificationPref = (key) => {
    setNotificationPrefs(prev => {
      const updated = { ...prev, [key]: !prev[key] };
      localStorage.setItem('svcet_student_notif_prefs', JSON.stringify(updated));
      return updated;
    });
  };

  const handleFeedbackSubmit = () => {
    if (!feedbackMessage.trim()) {
      alert('Please enter a message');
      return;
    }
    addFeedback({
      type: feedbackType,
      message: feedbackMessage,
      authorName: currentUser?.name || 'Student',
      authorRole: 'Student',
      authorId: currentUser?.registerNumber || 'Unknown'
    });
    setFeedbackMessage('');
    alert('Feedback submitted successfully!');
  };

  useEffect(() => {
    const sessionUser = JSON.parse(localStorage.getItem('svcet_session_student'));
    if (sessionUser && sessionUser.role === 'Student') {
      const student = adminStudents.find(s => s.name === sessionUser.name) || {
        name: sessionUser.name,
        registerNumber: 'STU1234',
        email: sessionUser.name.toLowerCase().replace(' ', '.') + '@svcet.edu',
        department: 'Computer Science',
        year: '3rd Year',
        section: 'A'
      };
      setCurrentUser(student);
      
      const stats = leaderboardStudents.find(s => s.name === sessionUser.name);
      if (stats) {
        setUserStats(stats);
      }
    }
  }, [adminStudents, leaderboardStudents]);

  const handleUpdatePassword = () => {
    if (!passwords.current || !passwords.new) {
      alert('Please fill out both password fields.');
      return;
    }
    if (currentUser?.id) {
      updateStudent(currentUser.id, { password: passwords.new });
    }
    alert('Password successfully updated!');
    setPasswords({ current: '', new: '' });
  };

  const handleAvatarSelect = (avatarId, avatarUrl, cost) => {
    const equipAvatar = () => {
      if (currentUser?.id) {
        updateStudent(currentUser.id, { avatar: avatarUrl });
      }
      const sessionUser = JSON.parse(localStorage.getItem('svcet_session_student')) || {};
      localStorage.setItem('svcet_session_student', JSON.stringify({ ...sessionUser, avatar: avatarUrl }));
      setCurrentUser(prev => prev ? { ...prev, avatar: avatarUrl } : null);
      window.dispatchEvent(new Event('storage'));
      alert('Avatar successfully equipped!');
    };

    // Auto-unlock logic based on star count (XP level)
    if (cost === 0 || (userStats?.stars || 0) >= cost) {
      equipAvatar();
    } else {
      alert(`You need ${cost} stars to unlock this avatar! Keep learning to level up. You currently have ${userStats?.stars || 0} stars.`);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-neutral-500 dark:text-neutral-400">View your student profile and manage workspace preferences.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-6">
          <Card className="border-neutral-200 dark:border-neutral-800 bg-white/50 dark:bg-neutral-900/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Shield className="w-5 h-5 mr-2 text-blue-500" />
                Academic Information
              </CardTitle>
              <CardDescription>Core academic details are managed by administrators.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input value={currentUser?.name || ''} disabled className="bg-neutral-100 dark:bg-neutral-900" />
                </div>
                <div className="space-y-2">
                  <Label>Register Number</Label>
                  <Input value={currentUser?.registerNumber || ''} disabled className="bg-neutral-100 dark:bg-neutral-900" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Department</Label>
                <Input value={currentUser?.department || ''} disabled className="bg-neutral-100 dark:bg-neutral-900" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Year</Label>
                  <Input value={currentUser?.year || ''} disabled className="bg-neutral-100 dark:bg-neutral-900" />
                </div>
                <div className="space-y-2">
                  <Label>Section</Label>
                  <Input value={currentUser?.section || ''} disabled className="bg-neutral-100 dark:bg-neutral-900" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-neutral-200 dark:border-neutral-800 bg-white/50 dark:bg-neutral-900/50 backdrop-blur overflow-hidden flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <User className="w-5 h-5 mr-2 text-indigo-500" />
                Personal Profile
              </CardTitle>
              <CardDescription>Personalize your student profile and contact details.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 flex-1">
              {/* Profile Strength Meter */}
              <div className="space-y-2 p-4 bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-800/50 rounded-xl">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-indigo-900 dark:text-indigo-100">Profile Strength</span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">
                    {(() => {
                      let s = 25;
                      if (profileForm.phone) s += 15;
                      if (profileForm.bio) s += 20;
                      if (profileForm.github) s += 15;
                      if (profileForm.linkedin) s += 15;
                      if (profileForm.skills) s += 10;
                      return s;
                    })()}%
                  </span>
                </div>
                <div className="w-full h-2 bg-indigo-100 dark:bg-indigo-900/40 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full transition-all duration-1000"
                    style={{ width: `${(() => {
                      let s = 25;
                      if (profileForm.phone) s += 15;
                      if (profileForm.bio) s += 20;
                      if (profileForm.github) s += 15;
                      if (profileForm.linkedin) s += 15;
                      if (profileForm.skills) s += 10;
                      return s;
                    })()}%` }}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={currentUser?.email || ''} disabled className="bg-neutral-100 dark:bg-neutral-900" />
                <p className="text-[10px] text-neutral-500">Email is tied to your institution account.</p>
              </div>
              <div className="space-y-2">
                <Label>Phone Number</Label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-3 text-neutral-400" />
                  <Input 
                    value={profileForm.phone} 
                    onChange={e => setProfileForm({...profileForm, phone: e.target.value})} 
                    placeholder="+91 98765 43210" 
                    className="pl-9 bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800" 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Bio / About Me</Label>
                <textarea 
                  value={profileForm.bio}
                  onChange={e => setProfileForm({...profileForm, bio: e.target.value})}
                  className="w-full min-h-[80px] p-3 text-sm bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-md focus:ring-2 focus:ring-blue-500 outline-none transition-shadow resize-none"
                  placeholder="Passionate computer science student..."
                />
              </div>
              <div className="space-y-2">
                <Label>Key Skills</Label>
                <Input 
                  value={profileForm.skills} 
                  onChange={e => setProfileForm({...profileForm, skills: e.target.value})} 
                  placeholder="React, Python, Machine Learning (comma separated)" 
                  className="bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 text-sm" 
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>GitHub URL</Label>
                  <div className="relative">
                    <Link className="w-4 h-4 absolute left-3 top-3 text-neutral-400" />
                    <Input 
                      value={profileForm.github} 
                      onChange={e => setProfileForm({...profileForm, github: e.target.value})} 
                      placeholder="github.com/username" 
                      className="pl-9 bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 text-xs" 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>LinkedIn URL</Label>
                  <div className="relative">
                    <Link className="w-4 h-4 absolute left-3 top-3 text-neutral-400" />
                    <Input 
                      value={profileForm.linkedin} 
                      onChange={e => setProfileForm({...profileForm, linkedin: e.target.value})} 
                      placeholder="linkedin.com/in/username" 
                      className="pl-9 bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 text-xs" 
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
                  <><CheckCircle2 className="w-4 h-4 mr-2" /> Profile Saved Successfully!</>
                ) : (
                  <><Save className="w-4 h-4 mr-2" /> Save Profile Changes</>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-neutral-200 dark:border-neutral-800 bg-white/50 dark:bg-neutral-900/50 backdrop-blur">
            <CardHeader className="flex flex-row items-start justify-between pb-2">
              <div>
                <CardTitle className="text-lg">Avatar Shop</CardTitle>
                <CardDescription>Unlock exclusive avatars using your earned stars!</CardDescription>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-500 rounded-full font-bold">
                <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                {userStats?.stars || 0} Stars
              </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-4">
              {avatarTiers.map((tier, tIdx) => (
                <div key={tIdx} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-neutral-700 dark:text-neutral-300">{tier.name}</h4>
                    {tier.cost > 0 && <span className="text-xs font-semibold text-amber-600 dark:text-amber-500 flex items-center gap-1"><Lock className="w-3 h-3" /> {tier.cost} Stars</span>}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {tier.avatars.map(avatar => {
                      const isUnlocked = tier.cost === 0 || (userStats?.stars || 0) >= tier.cost;
                      const isEquipped = currentUser?.avatar === avatar.url;
                      
                      return (
                        <button
                          key={avatar.id}
                          onClick={() => handleAvatarSelect(avatar.id, avatar.url, tier.cost)}
                          className={`relative aspect-square rounded-2xl overflow-hidden border-2 transition-all ${
                            isEquipped 
                              ? 'border-blue-500 ring-4 ring-blue-500/20 shadow-lg scale-105 z-10' 
                              : isUnlocked
                                ? 'border-transparent hover:border-blue-300 dark:hover:border-blue-700 hover:scale-105'
                                : 'border-neutral-200 dark:border-neutral-800 opacity-60 hover:opacity-100 grayscale hover:grayscale-0 cursor-pointer'
                          }`}
                        >
                          <img src={avatar.url} alt="Avatar" className="w-full h-full object-cover bg-neutral-100 dark:bg-neutral-800" />
                          
                          {/* Equipped Overlay */}
                          {isEquipped && (
                            <div className="absolute inset-0 bg-blue-500/10 flex flex-col items-center justify-end pb-1">
                              <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300 bg-white/80 dark:bg-black/50 px-2 rounded-full backdrop-blur-sm">Equipped</span>
                            </div>
                          )}
                          
                          {/* Locked Overlay */}
                          {!isUnlocked && (
                            <div className="absolute inset-0 bg-neutral-900/40 flex items-center justify-center backdrop-blur-[1px]">
                              <Lock className="w-6 h-6 text-white drop-shadow-md" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
              
            </CardContent>
          </Card>

          <Card className="border-neutral-200 dark:border-neutral-800 bg-white/50 dark:bg-neutral-900/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Shield className="w-5 h-5 mr-2 text-neutral-500" />
                Security
              </CardTitle>
              <CardDescription>Manage your password and authentication.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Current Password</Label>
                <div className="relative">
                  <Input type={showPasswords.current ? "text" : "password"} placeholder="••••••••" value={passwords.current} onChange={(e) => setPasswords({...passwords, current: e.target.value})} />
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
                  <Input type={showPasswords.new ? "text" : "password"} placeholder="Enter new password" value={passwords.new} onChange={(e) => setPasswords({...passwords, new: e.target.value})} />
                  <button 
                    type="button"
                    onClick={() => setShowPasswords({...showPasswords, new: !showPasswords.new})}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
                  >
                    {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <Button className="w-full" onClick={handleUpdatePassword}>Update Password</Button>
            </CardContent>
          </Card>

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
          
          <Card className="border-neutral-200 dark:border-neutral-800 bg-white/50 dark:bg-neutral-900/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Bell className="w-5 h-5 mr-2 text-neutral-500" />
                Notifications
              </CardTitle>
              <CardDescription>Manage how you receive alerts and updates.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">Email Notifications</Label>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">Receive alerts via email</p>
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
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">Receive alerts on your device</p>
                </div>
                <button 
                  onClick={() => toggleNotificationPref('push')}
                  className={`w-11 h-6 rounded-full transition-colors relative ${notificationPrefs.push ? 'bg-blue-600' : 'bg-neutral-300 dark:bg-neutral-700'}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${notificationPrefs.push ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">Daily Reminders</Label>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">Daily task and streak reminders</p>
                </div>
                <button 
                  onClick={() => toggleNotificationPref('dailyReminders')}
                  className={`w-11 h-6 rounded-full transition-colors relative ${notificationPrefs.dailyReminders ? 'bg-blue-600' : 'bg-neutral-300 dark:bg-neutral-700'}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${notificationPrefs.dailyReminders ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">Assessment Alerts</Label>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">Alerts for new tests and approaching deadlines</p>
                </div>
                <button 
                  onClick={() => toggleNotificationPref('assessmentAlerts')}
                  className={`w-11 h-6 rounded-full transition-colors relative ${notificationPrefs.assessmentAlerts ? 'bg-blue-600' : 'bg-neutral-300 dark:bg-neutral-700'}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${notificationPrefs.assessmentAlerts ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-neutral-200 dark:border-neutral-800 bg-white/50 dark:bg-neutral-900/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <MessageSquare className="w-5 h-5 mr-2 text-indigo-500" />
                Report & Feedback
              </CardTitle>
              <CardDescription>Tell us what facilities you want or report an issue.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <select 
                  value={feedbackType}
                  onChange={(e) => setFeedbackType(e.target.value)}
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option>Feature Request (Facility)</option>
                  <option>Bug Report</option>
                  <option>General Feedback</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Message</Label>
                <textarea 
                  value={feedbackMessage}
                  onChange={(e) => setFeedbackMessage(e.target.value)}
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Describe the facility you want or the issue you are facing..."
                />
              </div>
              <Button onClick={handleFeedbackSubmit} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">
                <Send className="w-4 h-4 mr-2" /> Submit Feedback
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Heatmap Section */}
      <ActivityHeatmap activityLog={userStats?.activityLog || []} />
    </div>
  );
};

export default SettingsPage;
