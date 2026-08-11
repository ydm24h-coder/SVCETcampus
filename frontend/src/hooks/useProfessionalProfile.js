import { useState, useEffect, useCallback } from 'react';

const PROFILE_KEY = 'svcet_professional_profiles';
const CONNECTIONS_KEY = 'svcet_connections';
const ACTIVITY_KEY = 'svcet_activity_feed';

const getProfiles = () => {
  try {
    return JSON.parse(localStorage.getItem(PROFILE_KEY)) || {};
  } catch {
    return {};
  }
};

const getConnections = () => {
  try {
    return JSON.parse(localStorage.getItem(CONNECTIONS_KEY)) || {};
  } catch {
    return {};
  }
};

const getActivityFeed = () => {
  try {
    return JSON.parse(localStorage.getItem(ACTIVITY_KEY)) || [];
  } catch {
    return [];
  }
};

export const useProfessionalProfile = (targetName) => {
  const sessionUser = JSON.parse(localStorage.getItem('svcet_session_student')) || {};
  const currentUser = sessionUser.name || '';
  const name = targetName || currentUser;
  const isSelf = name === currentUser;

  const [profile, setProfile] = useState(() => {
    const profiles = getProfiles();
    return profiles[name] || {
      headline: '',
      bio: '',
      location: '',
      phone: '',
      github: '',
      linkedin: '',
      portfolio: '',
      twitter: '',
      skills: [],
      projects: [],
      certificates: [],
      endorsements: {},
    };
  });

  const [connections, setConnections] = useState(() => {
    const conn = getConnections();
    return conn[name] || { followers: [], following: [] };
  });

  const [activityFeed, setActivityFeed] = useState(() => {
    const feed = getActivityFeed();
    return feed.filter(a => a.author === name);
  });

  const [allFeed, setAllFeed] = useState(() => getActivityFeed());

  // Persist profile
  const saveProfile = useCallback((updated) => {
    const profiles = getProfiles();
    profiles[name] = { ...profiles[name], ...updated };
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profiles));
    setProfile(prev => ({ ...prev, ...updated }));
  }, [name]);

  // Update profile field(s)
  const updateProfile = useCallback((fields) => {
    saveProfile(fields);
  }, [saveProfile]);

  // Skills
  const addSkill = useCallback((skill) => {
    const profiles = getProfiles();
    const p = profiles[name] || {};
    const skills = p.skills || [];
    if (!skills.find(s => s.name === skill.name)) {
      const updated = [...skills, { ...skill, id: Date.now(), endorsedBy: [] }];
      saveProfile({ skills: updated });
    }
  }, [name, saveProfile]);

  const removeSkill = useCallback((skillId) => {
    const profiles = getProfiles();
    const p = profiles[name] || {};
    const skills = (p.skills || []).filter(s => s.id !== skillId);
    saveProfile({ skills });
  }, [name, saveProfile]);

  const endorseSkill = useCallback((targetStudentName, skillId, endorserName) => {
    const profiles = getProfiles();
    const p = profiles[targetStudentName] || {};
    const skills = (p.skills || []).map(s => {
      if (s.id === skillId && !s.endorsedBy.includes(endorserName)) {
        return { ...s, endorsedBy: [...s.endorsedBy, endorserName] };
      }
      return s;
    });
    profiles[targetStudentName] = { ...p, skills };
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profiles));
  }, []);

  // Projects
  const addProject = useCallback((project) => {
    const profiles = getProfiles();
    const p = profiles[name] || {};
    const projects = [...(p.projects || []), { ...project, id: Date.now(), createdAt: new Date().toISOString() }];
    saveProfile({ projects });
    // Post to activity feed
    postActivity({ type: 'project', text: `added a new project: ${project.title}`, meta: project });
  }, [name, saveProfile]);

  const updateProject = useCallback((projectId, fields) => {
    const profiles = getProfiles();
    const p = profiles[name] || {};
    const projects = (p.projects || []).map(proj => proj.id === projectId ? { ...proj, ...fields } : proj);
    saveProfile({ projects });
  }, [name, saveProfile]);

  const removeProject = useCallback((projectId) => {
    const profiles = getProfiles();
    const p = profiles[name] || {};
    const projects = (p.projects || []).filter(proj => proj.id !== projectId);
    saveProfile({ projects });
  }, [name, saveProfile]);

  // Certificates
  const addCertificate = useCallback((cert) => {
    const profiles = getProfiles();
    const p = profiles[name] || {};
    const certificates = [...(p.certificates || []), { ...cert, id: Date.now(), addedAt: new Date().toISOString() }];
    saveProfile({ certificates });
    postActivity({ type: 'certificate', text: `earned a certificate: ${cert.title}`, meta: cert });
  }, [name, saveProfile]);

  const updateCertificate = useCallback((certId, fields) => {
    const profiles = getProfiles();
    const p = profiles[name] || {};
    const certificates = (p.certificates || []).map(c => c.id === certId ? { ...c, ...fields } : c);
    saveProfile({ certificates });
  }, [name, saveProfile]);

  const removeCertificate = useCallback((certId) => {
    const profiles = getProfiles();
    const p = profiles[name] || {};
    const certificates = (p.certificates || []).filter(c => c.id !== certId);
    saveProfile({ certificates });
  }, [name, saveProfile]);

  // Connections (follow/unfollow)
  const followStudent = useCallback((targetName) => {
    const conn = getConnections();
    const myConn = conn[currentUser] || { followers: [], following: [] };
    const theirConn = conn[targetName] || { followers: [], following: [] };

    if (!myConn.following.includes(targetName)) {
      myConn.following = [...myConn.following, targetName];
    }
    if (!theirConn.followers.includes(currentUser)) {
      theirConn.followers = [...theirConn.followers, currentUser];
    }

    conn[currentUser] = myConn;
    conn[targetName] = theirConn;
    localStorage.setItem(CONNECTIONS_KEY, JSON.stringify(conn));
    setConnections(isSelf ? myConn : theirConn);
  }, [currentUser, isSelf]);

  const unfollowStudent = useCallback((targetName) => {
    const conn = getConnections();
    const myConn = conn[currentUser] || { followers: [], following: [] };
    const theirConn = conn[targetName] || { followers: [], following: [] };

    myConn.following = myConn.following.filter(n => n !== targetName);
    theirConn.followers = theirConn.followers.filter(n => n !== currentUser);

    conn[currentUser] = myConn;
    conn[targetName] = theirConn;
    localStorage.setItem(CONNECTIONS_KEY, JSON.stringify(conn));
    setConnections(isSelf ? myConn : theirConn);
  }, [currentUser, isSelf]);

  const isFollowing = useCallback((targetName) => {
    const conn = getConnections();
    const myConn = conn[currentUser] || { followers: [], following: [] };
    return myConn.following.includes(targetName);
  }, [currentUser]);

  // Activity Feed
  const postActivity = useCallback((activity) => {
    const feed = getActivityFeed();
    const newEntry = {
      id: Date.now(),
      author: name,
      timestamp: new Date().toISOString(),
      likes: [],
      comments: [],
      ...activity,
    };
    const updated = [newEntry, ...feed];
    localStorage.setItem(ACTIVITY_KEY, JSON.stringify(updated));
    setAllFeed(updated);
    setActivityFeed(updated.filter(a => a.author === name));
  }, [name]);

  const postStatus = useCallback((text, tags = [], type = 'general', attachments = []) => {
    postActivity({ type, text, tags, attachments });
  }, [postActivity]);

  const likeActivity = useCallback((activityId) => {
    const feed = getActivityFeed();
    const updated = feed.map(a => {
      if (a.id === activityId) {
        const already = a.likes.includes(currentUser);
        return { ...a, likes: already ? a.likes.filter(l => l !== currentUser) : [...a.likes, currentUser] };
      }
      return a;
    });
    localStorage.setItem(ACTIVITY_KEY, JSON.stringify(updated));
    setAllFeed(updated);
    setActivityFeed(updated.filter(a => a.author === name));
  }, [currentUser, name]);

  const commentOnActivity = useCallback((activityId, comment) => {
    const feed = getActivityFeed();
    const updated = feed.map(a => {
      if (a.id === activityId) {
        return {
          ...a,
          comments: [...a.comments, { id: Date.now(), author: currentUser, text: comment, timestamp: new Date().toISOString() }]
        };
      }
      return a;
    });
    localStorage.setItem(ACTIVITY_KEY, JSON.stringify(updated));
    setAllFeed(updated);
    setActivityFeed(updated.filter(a => a.author === name));
  }, [currentUser, name]);

  // Recompute profile strength
  const profileStrength = (() => {
    let score = 20;
    if (profile.headline) score += 10;
    if (profile.bio) score += 15;
    if (profile.location) score += 5;
    if (profile.github) score += 10;
    if (profile.linkedin) score += 10;
    if (profile.portfolio) score += 10;
    if ((profile.skills || []).length > 0) score += 10;
    if ((profile.projects || []).length > 0) score += 10;
    return Math.min(score, 100);
  })();

  // Get all students' profiles for browsing
  const getAllProfiles = useCallback(() => getProfiles(), []);

  // Get followers/following for any student
  const getConnectionsFor = useCallback((studentName) => {
    const conn = getConnections();
    return conn[studentName] || { followers: [], following: [] };
  }, []);

  // Get global feed (for activity feed page)
  const getGlobalFeed = useCallback(() => {
    return getActivityFeed().sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }, []);

  return {
    profile,
    connections,
    activityFeed,
    allFeed,
    profileStrength,
    isSelf,
    currentUser,
    updateProfile,
    addSkill,
    removeSkill,
    endorseSkill,
    addProject,
    updateProject,
    removeProject,
    addCertificate,
    updateCertificate,
    removeCertificate,
    followStudent,
    unfollowStudent,
    isFollowing,
    postStatus,
    likeActivity,
    commentOnActivity,
    getAllProfiles,
    getConnectionsFor,
    getGlobalFeed,
  };
};
