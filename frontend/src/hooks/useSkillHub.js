import { useState, useCallback } from 'react';

const XP_KEY = 'svcet_skillhub_xp';
const CHALLENGES_KEY = 'svcet_skillhub_challenges';
const TEAMS_KEY = 'svcet_skillhub_teams';
const TEAM_REQUESTS_KEY = 'svcet_skillhub_team_requests';

const DEFAULT_CHALLENGES = [
  {
    id: 1,
    title: '30-Day React Challenge',
    description: 'Build 30 mini React projects in 30 days. Improve your component design and state management skills.',
    difficulty: 'Intermediate',
    xpReward: 300,
    tags: ['React', 'JavaScript', 'Frontend'],
    deadline: '2026-08-15T00:00:00.000Z',
    participants: [],
    submissions: [],
    isActive: true,
    icon: '⚛️',
  },
  {
    id: 2,
    title: 'LeetCode Weekly Sprint',
    description: 'Solve 10 LeetCode problems this week ranging from Easy to Hard. Post your solutions and approaches.',
    difficulty: 'Hard',
    xpReward: 200,
    tags: ['DSA', 'Algorithms', 'Competitive'],
    deadline: '2026-07-25T00:00:00.000Z',
    participants: [],
    submissions: [],
    isActive: true,
    icon: '⚡',
  },
  {
    id: 3,
    title: 'Build Your Portfolio Site',
    description: 'Create a professional personal portfolio website and deploy it. Share the live link with the community.',
    difficulty: 'Beginner',
    xpReward: 150,
    tags: ['HTML', 'CSS', 'Portfolio', 'Deployment'],
    deadline: '2026-08-01T00:00:00.000Z',
    participants: [],
    submissions: [],
    isActive: true,
    icon: '🌐',
  },
  {
    id: 4,
    title: 'Open Source Contribution',
    description: 'Make at least one meaningful pull request to any open source project on GitHub.',
    difficulty: 'Intermediate',
    xpReward: 250,
    tags: ['GitHub', 'Open Source', 'Git'],
    deadline: '2026-08-30T00:00:00.000Z',
    participants: [],
    submissions: [],
    isActive: true,
    icon: '🔓',
  },
  {
    id: 5,
    title: 'ML Model Challenge',
    description: 'Train a machine learning model on a public dataset and achieve above-baseline accuracy. Share your notebook.',
    difficulty: 'Hard',
    xpReward: 350,
    tags: ['Python', 'ML', 'Kaggle', 'Data Science'],
    deadline: '2026-09-01T00:00:00.000Z',
    participants: [],
    submissions: [],
    isActive: true,
    icon: '🤖',
  },
];

const SKILLHUB_BADGES = [
  { id: 'sh_first_post', name: 'First Post', description: 'Posted for the first time in SkillHub', icon: '📝', xpThreshold: 0 },
  { id: 'sh_community_builder', name: 'Community Builder', description: 'Created a SkillHub community', icon: '🏗️', xpThreshold: 0 },
  { id: 'sh_connector', name: 'Connector', description: 'Joined 3+ communities', icon: '🔗', xpThreshold: 0 },
  { id: 'sh_challenger', name: 'Challenger', description: 'Completed your first challenge', icon: '🎯', xpThreshold: 0 },
  { id: 'sh_rising_star', name: 'Rising Star', description: 'Earned 100 XP in SkillHub', icon: '⭐', xpThreshold: 100 },
  { id: 'sh_expert', name: 'SkillHub Expert', description: 'Earned 500 XP in SkillHub', icon: '🏆', xpThreshold: 500 },
  { id: 'sh_legend', name: 'Community Legend', description: 'Earned 1000 XP in SkillHub', icon: '👑', xpThreshold: 1000 },
];

const getXPData = () => {
  try {
    return JSON.parse(localStorage.getItem(XP_KEY)) || {};
  } catch {
    return {};
  }
};

const getChallenges = () => {
  try {
    const stored = localStorage.getItem(CHALLENGES_KEY);
    if (!stored) {
      localStorage.setItem(CHALLENGES_KEY, JSON.stringify(DEFAULT_CHALLENGES));
      return DEFAULT_CHALLENGES;
    }
    return JSON.parse(stored);
  } catch {
    return DEFAULT_CHALLENGES;
  }
};

const getTeams = () => {
  try {
    return JSON.parse(localStorage.getItem(TEAMS_KEY)) || [];
  } catch {
    return [];
  }
};

const getTeamRequests = () => {
  try {
    return JSON.parse(localStorage.getItem(TEAM_REQUESTS_KEY)) || [];
  } catch {
    return [];
  }
};

export const useSkillHub = () => {
  const sessionUser = JSON.parse(localStorage.getItem('svcet_session_student')) || {};
  const currentUser = sessionUser.name || '';

  const [challenges, setChallenges] = useState(() => getChallenges());
  const [teams, setTeams] = useState(() => getTeams());
  const [teamRequests, setTeamRequests] = useState(() => getTeamRequests());

  // XP Management
  const getUserXP = useCallback((username) => {
    const data = getXPData();
    return data[username] || { total: 0, history: [], badges: [] };
  }, []);

  const awardXP = useCallback((amount, reason) => {
    const data = getXPData();
    const user = data[currentUser] || { total: 0, history: [], badges: [] };
    const newTotal = user.total + amount;
    const updated = {
      ...user,
      total: newTotal,
      history: [{ amount, reason, timestamp: new Date().toISOString() }, ...user.history],
    };

    // Auto-award XP badges
    const earnedBadges = SKILLHUB_BADGES
      .filter(b => b.xpThreshold > 0 && newTotal >= b.xpThreshold && !updated.badges.includes(b.id))
      .map(b => b.id);

    updated.badges = [...new Set([...updated.badges, ...earnedBadges])];
    data[currentUser] = updated;
    localStorage.setItem(XP_KEY, JSON.stringify(data));
    return updated;
  }, [currentUser]);

  const awardBadge = useCallback((badgeId) => {
    const data = getXPData();
    const user = data[currentUser] || { total: 0, history: [], badges: [] };
    if (!user.badges.includes(badgeId)) {
      user.badges = [...user.badges, badgeId];
      data[currentUser] = user;
      localStorage.setItem(XP_KEY, JSON.stringify(data));
    }
  }, [currentUser]);

  const myXP = getUserXP(currentUser);
  const myBadges = SKILLHUB_BADGES.filter(b => myXP.badges.includes(b.id));

  // Leaderboard (XP-based)
  const getXPLeaderboard = useCallback(() => {
    const data = getXPData();
    return Object.entries(data)
      .map(([name, info]) => ({ name, xp: info.total, badges: info.badges }))
      .sort((a, b) => b.xp - a.xp);
  }, []);

  // Challenges
  const joinChallenge = useCallback((challengeId) => {
    const all = getChallenges();
    const updated = all.map(c => {
      if (c.id === challengeId && !c.participants.includes(currentUser)) {
        return { ...c, participants: [...c.participants, currentUser] };
      }
      return c;
    });
    localStorage.setItem(CHALLENGES_KEY, JSON.stringify(updated));
    setChallenges(updated);
    awardXP(10, 'Joined a challenge');
  }, [currentUser, awardXP]);

  const submitChallenge = useCallback((challengeId, submission) => {
    const all = getChallenges();
    const updated = all.map(c => {
      if (c.id === challengeId) {
        const existingIndex = c.submissions.findIndex(s => s.author === currentUser);
        const newSubmission = {
          id: Date.now(),
          author: currentUser,
          timestamp: new Date().toISOString(),
          ...submission,
        };
        const submissions = existingIndex >= 0
          ? c.submissions.map((s, i) => i === existingIndex ? newSubmission : s)
          : [...c.submissions, newSubmission];
        return { ...c, submissions };
      }
      return c;
    });
    localStorage.setItem(CHALLENGES_KEY, JSON.stringify(updated));
    setChallenges(updated);

    // Award XP for submission
    const challenge = all.find(c => c.id === challengeId);
    if (challenge) {
      awardXP(challenge.xpReward, `Completed challenge: ${challenge.title}`);
      awardBadge('sh_challenger');
    }
  }, [currentUser, awardXP, awardBadge]);

  const hasSubmitted = useCallback((challengeId) => {
    const c = challenges.find(ch => ch.id === challengeId);
    return c ? c.submissions.some(s => s.author === currentUser) : false;
  }, [challenges, currentUser]);

  const hasJoined = useCallback((challengeId) => {
    const c = challenges.find(ch => ch.id === challengeId);
    return c ? c.participants.includes(currentUser) : false;
  }, [challenges, currentUser]);

  // Team Finder
  const createTeam = useCallback((teamData) => {
    const all = getTeams();
    const newTeam = {
      id: Date.now(),
      leader: currentUser,
      members: [currentUser],
      pendingRequests: [],
      createdAt: new Date().toISOString(),
      ...teamData,
    };
    const updated = [newTeam, ...all];
    localStorage.setItem(TEAMS_KEY, JSON.stringify(updated));
    setTeams(updated);
    return newTeam;
  }, [currentUser]);

  const requestToJoinTeam = useCallback((teamId) => {
    const all = getTeams();
    const updated = all.map(t => {
      if (t.id === teamId && !t.members.includes(currentUser) && !t.pendingRequests.includes(currentUser)) {
        return { ...t, pendingRequests: [...t.pendingRequests, currentUser] };
      }
      return t;
    });
    localStorage.setItem(TEAMS_KEY, JSON.stringify(updated));
    setTeams(updated);
  }, [currentUser]);

  const acceptTeamRequest = useCallback((teamId, requesterName) => {
    const all = getTeams();
    const updated = all.map(t => {
      if (t.id === teamId && t.leader === currentUser) {
        return {
          ...t,
          members: [...t.members, requesterName],
          pendingRequests: t.pendingRequests.filter(r => r !== requesterName),
        };
      }
      return t;
    });
    localStorage.setItem(TEAMS_KEY, JSON.stringify(updated));
    setTeams(updated);
  }, [currentUser]);

  const declineTeamRequest = useCallback((teamId, requesterName) => {
    const all = getTeams();
    const updated = all.map(t => {
      if (t.id === teamId && t.leader === currentUser) {
        return { ...t, pendingRequests: t.pendingRequests.filter(r => r !== requesterName) };
      }
      return t;
    });
    localStorage.setItem(TEAMS_KEY, JSON.stringify(updated));
    setTeams(updated);
  }, [currentUser]);

  const myTeams = teams.filter(t => t.members.includes(currentUser));
  const openTeams = teams.filter(t => !t.members.includes(currentUser) && t.isOpen);

  return {
    challenges,
    teams,
    myTeams,
    openTeams,
    teamRequests,
    myXP,
    myBadges,
    SKILLHUB_BADGES,
    currentUser,
    getUserXP,
    awardXP,
    awardBadge,
    getXPLeaderboard,
    joinChallenge,
    submitChallenge,
    hasSubmitted,
    hasJoined,
    createTeam,
    requestToJoinTeam,
    acceptTeamRequest,
    declineTeamRequest,
  };
};
