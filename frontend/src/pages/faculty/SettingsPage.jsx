import React, { useState, useEffect } from 'react';
import { Settings2, User, MessageSquare, Send, Shield, Eye, EyeOff, Check, UploadCloud, Save, Bell, Loader2, Phone, Briefcase, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useFaculty } from '@/hooks/useFaculty';
import { useFeedback } from '@/hooks/useFeedback';

const SettingsPage = () => {
  const { faculty, updateFaculty } = useFaculty();
  const [currentUser, setCurrentUser] = useState(null);
  
  const avatars = [
    '/avatars/fac_1.png',
    '/avatars/fac_2.png',
    '/avatars/fac_3.png',
    '/avatars/fac_4.png',
  ];
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    bio: '',
    office: '',
    skills: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [passwords, setPasswords] = useState({ current: '', new: '' });
  const [showPasswords, setShowPasswords] = useState({ current: false, new: false });
  const [customAvatarUrl, setCustomAvatarUrl] = useState('');
  const [avatarPreview, setAvatarPreview] = useState(null);

  const [notificationPrefs, setNotificationPrefs] = useState(() => {
    return JSON.parse(localStorage.getItem('svcet_faculty_notif_prefs')) || {
      email: true,
      push: true,
      gradingReminders: true,
      systemAlerts: false
    };
  });

  const toggleNotificationPref = (key) => {
    setNotificationPrefs(prev => {
      const updated = { ...prev, [key]: !prev[key] };
      localStorage.setItem('svcet_faculty_notif_prefs', JSON.stringify(updated));
      return updated;
    });
  };

  const { addFeedback } = useFeedback();
  const [feedbackType, setFeedbackType] = useState('Feature Request (Facility)');
  const [feedbackMessage, setFeedbackMessage] = useState('');

  const handleFeedbackSubmit = () => {
    if (!feedbackMessage.trim()) {
      alert('Please enter a message');
      return;
    }
    addFeedback({
      type: feedbackType,
      message: feedbackMessage,
      authorName: currentUser?.name || 'Faculty',
      authorRole: 'Faculty',
      authorId: currentUser?.facultyId || 'Unknown'
    });
    setFeedbackMessage('');
    alert('Feedback submitted successfully!');
  };

  useEffect(() => {
    const sessionUser = JSON.parse(localStorage.getItem('svcet_session_faculty'));
    if (sessionUser && sessionUser.role === 'Faculty') {
      const fac = faculty.find(f => f.name === sessionUser.name) || {
        name: sessionUser.name,
        facultyId: 'FAC100',
        email: sessionUser.name.toLowerCase().replace(' ', '.') + '@svcet.edu',
        designation: 'Assistant Professor'
      };
      setCurrentUser(fac);
      setFormData({ 
        name: fac.name, 
        email: fac.email, 
        designation: fac.designation,
        phone: fac.phone || '',
        bio: fac.bio || '',
        office: fac.office || '',
        skills: fac.skills || ''
      });
    }
  }, [faculty]);

  const handleUpdatePassword = () => {
    if (!passwords.current || !passwords.new) {
      alert('Please fill out both password fields.');
      return;
    }
    if (currentUser?.id) {
      updateFaculty(currentUser.id, { password: passwords.new });
    }
    alert('Password successfully updated!');
    setPasswords({ current: '', new: '' });
  };

  const handleAvatarSelect = (avatarPath) => {
    if (!avatarPath || avatarPath.trim() === '') return;
    
    if (currentUser?.id) {
      updateFaculty(currentUser.id, { avatar: avatarPath });
    }
    
    const sessionUser = JSON.parse(localStorage.getItem('svcet_session_faculty')) || {};
    localStorage.setItem('svcet_session_faculty', JSON.stringify({ ...sessionUser, avatar: avatarPath }));
    setCurrentUser(prev => prev ? { ...prev, avatar: avatarPath } : null);
    window.dispatchEvent(new Event('storage'));
    
    setCustomAvatarUrl(''); // clear input on success
    alert('Avatar successfully updated!');
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

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = () => {
    if (currentUser) {
      setIsSaving(true);
      setTimeout(() => {
        updateFaculty(currentUser.id, formData);
        const sessionUser = JSON.parse(localStorage.getItem('svcet_session_faculty'));
        localStorage.setItem('svcet_session_faculty', JSON.stringify({ ...sessionUser, ...formData }));
        setCurrentUser(prev => prev ? { ...prev, ...formData } : null);
        
        setIsSaving(false);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }, 800);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-neutral-500 dark:text-neutral-400">Manage your faculty profile and workspace preferences.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-neutral-200 dark:border-neutral-800 bg-white/50 dark:bg-neutral-900/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <User className="w-5 h-5 mr-2 text-indigo-500" />
              Profile Information
            </CardTitle>
            <CardDescription>Update your personal details.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Profile Strength Meter */}
            <div className="space-y-2 p-4 bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-800/50 rounded-xl">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-indigo-900 dark:text-indigo-100">Profile Strength</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400">
                  {(() => {
                    let s = 30;
                    if (formData.phone) s += 20;
                    if (formData.bio) s += 20;
                    if (formData.office) s += 15;
                    if (formData.skills) s += 15;
                    return s;
                  })()}%
                </span>
              </div>
              <div className="w-full h-2 bg-indigo-100 dark:bg-indigo-900/40 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full transition-all duration-1000"
                  style={{ width: `${(() => {
                    let s = 30;
                    if (formData.phone) s += 20;
                    if (formData.bio) s += 20;
                    if (formData.office) s += 15;
                    if (formData.skills) s += 15;
                    return s;
                  })()}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input name="name" value={formData.name} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label>Faculty ID</Label>
                <Input value={currentUser?.facultyId || ''} disabled className="bg-neutral-100 dark:bg-neutral-900" />
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input name="email" value={formData.email} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label>Designation</Label>
                <Input name="designation" value={formData.designation} onChange={handleChange} />
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Phone</Label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-3 text-neutral-400" />
                  <Input name="phone" value={formData.phone} onChange={handleChange} className="pl-9" placeholder="+91 98765 43210" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Office / Cabin</Label>
                <div className="relative">
                  <MapPin className="w-4 h-4 absolute left-3 top-3 text-neutral-400" />
                  <Input name="office" value={formData.office} onChange={handleChange} className="pl-9" placeholder="Block A, Room 102" />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Bio / About Me</Label>
              <textarea 
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                className="w-full min-h-[80px] p-3 text-sm bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-md focus:ring-2 focus:ring-blue-500 outline-none transition-shadow resize-none"
                placeholder="Senior Professor focusing on Data Science..."
              />
            </div>
            
            <div className="space-y-2">
              <Label>Key Expertise / Skills</Label>
              <Input 
                name="skills"
                value={formData.skills} 
                onChange={handleChange} 
                placeholder="AI, Machine Learning, Data Structures (comma separated)" 
                className="bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 text-sm" 
              />
            </div>

            <Button 
              onClick={handleSave} 
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

        <Card className="border-neutral-200 dark:border-neutral-800 bg-white/50 dark:bg-neutral-900/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <User className="w-5 h-5 mr-2 text-indigo-500" />
              Profile Picture
            </CardTitle>
            <CardDescription>Select an avatar to personalize your account.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
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
                  {currentUser?.avatar === avatar && (
                    <div className="absolute inset-0 bg-indigo-500/10 flex flex-col items-center justify-end pb-1">
                      <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 bg-white/80 dark:bg-black/50 px-2 rounded-full backdrop-blur-sm">Equipped</span>
                    </div>
                  )}
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
                      <p className="text-xs text-neutral-500 text-center">JPG, PNG, GIF up to 2MB</p>
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

        <div className="space-y-6">
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
              <CardDescription>Manage your faculty alerts and reminders.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">Email Notifications</Label>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">Receive updates via email</p>
                </div>
                <button 
                  onClick={() => toggleNotificationPref('email')}
                  className={`w-11 h-6 rounded-full transition-colors relative ${notificationPrefs.email ? 'bg-indigo-600' : 'bg-neutral-300 dark:bg-neutral-700'}`}
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
                  className={`w-11 h-6 rounded-full transition-colors relative ${notificationPrefs.push ? 'bg-indigo-600' : 'bg-neutral-300 dark:bg-neutral-700'}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${notificationPrefs.push ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">Grading Reminders</Label>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">Alerts for pending assessment grading</p>
                </div>
                <button 
                  onClick={() => toggleNotificationPref('gradingReminders')}
                  className={`w-11 h-6 rounded-full transition-colors relative ${notificationPrefs.gradingReminders ? 'bg-indigo-600' : 'bg-neutral-300 dark:bg-neutral-700'}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${notificationPrefs.gradingReminders ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">System Alerts</Label>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">Critical system maintenance alerts</p>
                </div>
                <button 
                  onClick={() => toggleNotificationPref('systemAlerts')}
                  className={`w-11 h-6 rounded-full transition-colors relative ${notificationPrefs.systemAlerts ? 'bg-indigo-600' : 'bg-neutral-300 dark:bg-neutral-700'}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${notificationPrefs.systemAlerts ? 'translate-x-5' : 'translate-x-0.5'}`} />
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
    </div>
  );
};

export default SettingsPage;
