import { useState, useCallback } from 'react';

const COMMUNITIES_KEY = 'svcet_communities';

const DEFAULT_COMMUNITIES = [
  {
    id: 1,
    name: 'Web Dev Warriors',
    description: 'A community for web development enthusiasts. Share projects, resources, and collaborate on building amazing web apps.',
    type: 'coding',
    tags: ['React', 'Node.js', 'CSS', 'JavaScript'],
    icon: '🌐',
    banner: '',
    createdBy: 'System',
    createdAt: '2026-01-10T00:00:00.000Z',
    members: ['System'],
    posts: [
      {
        id: 101,
        author: 'System',
        text: 'Welcome to Web Dev Warriors! Share your projects and let\'s learn together.',
        type: 'announcement',
        timestamp: '2026-01-10T00:00:00.000Z',
        likes: [],
        comments: [],
      }
    ],
    events: [],
    resources: [],
    challenges: [],
    isPublic: true,
  },
  {
    id: 2,
    name: 'AI/ML Hub',
    description: 'Explore machine learning, deep learning, and AI applications. Work on real-world datasets and share research.',
    type: 'research',
    tags: ['Python', 'TensorFlow', 'PyTorch', 'Data Science'],
    icon: '🤖',
    banner: '',
    createdBy: 'System',
    createdAt: '2026-01-12T00:00:00.000Z',
    members: ['System'],
    posts: [],
    events: [],
    resources: [],
    challenges: [],
    isPublic: true,
  },
  {
    id: 3,
    name: 'Hackathon Squad',
    description: 'Find teammates, prepare for hackathons, share experiences, and build winning projects together.',
    type: 'team-building',
    tags: ['Hackathon', 'Team', 'Innovation', 'Startup'],
    icon: '🏆',
    banner: '',
    createdBy: 'System',
    createdAt: '2026-01-15T00:00:00.000Z',
    members: ['System'],
    posts: [],
    events: [],
    resources: [],
    challenges: [],
    isPublic: true,
  },
  {
    id: 4,
    name: 'Open Source Contributors',
    description: 'Contribute to open source projects, learn from the community, and build your GitHub portfolio.',
    type: 'coding',
    tags: ['GitHub', 'Open Source', 'Git', 'Collaboration'],
    icon: '🔓',
    banner: '',
    createdBy: 'System',
    createdAt: '2026-01-18T00:00:00.000Z',
    members: ['System'],
    posts: [],
    events: [],
    resources: [],
    challenges: [],
    isPublic: true,
  },
  {
    id: 5,
    name: 'UI/UX Designers',
    description: 'Design beautiful interfaces, share Figma projects, and get feedback from fellow designers.',
    type: 'design',
    tags: ['Figma', 'Design', 'UI', 'UX', 'Prototyping'],
    icon: '🎨',
    banner: '',
    createdBy: 'System',
    createdAt: '2026-01-20T00:00:00.000Z',
    members: ['System'],
    posts: [],
    events: [],
    resources: [],
    challenges: [],
    isPublic: true,
  },
  {
    id: 6,
    name: 'Competitive Coders',
    description: 'Practice DSA, discuss competitive programming problems, and track each other\'s progress on CodeChef and LeetCode.',
    type: 'coding',
    tags: ['DSA', 'LeetCode', 'CodeChef', 'Algorithms'],
    icon: '⚡',
    banner: '',
    createdBy: 'System',
    createdAt: '2026-01-22T00:00:00.000Z',
    members: ['System'],
    posts: [],
    events: [],
    resources: [],
    challenges: [],
    isPublic: true,
  },
];

const getCommunities = () => {
  try {
    const stored = localStorage.getItem(COMMUNITIES_KEY);
    if (!stored) {
      localStorage.setItem(COMMUNITIES_KEY, JSON.stringify(DEFAULT_COMMUNITIES));
      return DEFAULT_COMMUNITIES;
    }
    return JSON.parse(stored);
  } catch {
    return DEFAULT_COMMUNITIES;
  }
};

const saveCommunities = (communities) => {
  localStorage.setItem(COMMUNITIES_KEY, JSON.stringify(communities));
};

export const useCommunities = () => {
  const sessionUser = JSON.parse(localStorage.getItem('svcet_session_student')) || {};
  const currentUser = sessionUser.name || '';

  const [communities, setCommunities] = useState(() => getCommunities());

  const refresh = useCallback(() => {
    setCommunities(getCommunities());
  }, []);

  // Get communities the current user is a member of
  const myCommunities = communities.filter(c => c.members.includes(currentUser));

  // Join community
  const joinCommunity = useCallback((communityId) => {
    const updated = getCommunities().map(c => {
      if (c.id === communityId && !c.members.includes(currentUser)) {
        return { ...c, members: [...c.members, currentUser] };
      }
      return c;
    });
    saveCommunities(updated);
    setCommunities(updated);
  }, [currentUser]);

  // Leave community
  const leaveCommunity = useCallback((communityId) => {
    const updated = getCommunities().map(c => {
      if (c.id === communityId) {
        return { ...c, members: c.members.filter(m => m !== currentUser) };
      }
      return c;
    });
    saveCommunities(updated);
    setCommunities(updated);
  }, [currentUser]);

  // Create community
  const createCommunity = useCallback((data) => {
    const all = getCommunities();
    const newCommunity = {
      id: Date.now(),
      ...data,
      createdBy: currentUser,
      createdAt: new Date().toISOString(),
      members: [currentUser],
      posts: [],
      events: [],
      resources: [],
      challenges: [],
      isPublic: data.isPublic !== false,
    };
    const updated = [newCommunity, ...all];
    saveCommunities(updated);
    setCommunities(updated);
    return newCommunity;
  }, [currentUser]);

  // Post to community
  const postToCommunity = useCallback((communityId, postData) => {
    const updated = getCommunities().map(c => {
      if (c.id === communityId) {
        const newPost = {
          id: Date.now(),
          author: currentUser,
          timestamp: new Date().toISOString(),
          likes: [],
          comments: [],
          type: 'post',
          ...postData,
        };
        return { ...c, posts: [newPost, ...c.posts] };
      }
      return c;
    });
    saveCommunities(updated);
    setCommunities(updated);
  }, [currentUser]);

  // Like a post
  const likePost = useCallback((communityId, postId) => {
    const updated = getCommunities().map(c => {
      if (c.id === communityId) {
        return {
          ...c,
          posts: c.posts.map(p => {
            if (p.id === postId) {
              const already = p.likes.includes(currentUser);
              return { ...p, likes: already ? p.likes.filter(l => l !== currentUser) : [...p.likes, currentUser] };
            }
            return p;
          }),
        };
      }
      return c;
    });
    saveCommunities(updated);
    setCommunities(updated);
  }, [currentUser]);

  // Comment on post
  const commentOnPost = useCallback((communityId, postId, text) => {
    const updated = getCommunities().map(c => {
      if (c.id === communityId) {
        return {
          ...c,
          posts: c.posts.map(p => {
            if (p.id === postId) {
              return {
                ...p,
                comments: [
                  ...p.comments,
                  { id: Date.now(), author: currentUser, text, timestamp: new Date().toISOString() }
                ]
              };
            }
            return p;
          }),
        };
      }
      return c;
    });
    saveCommunities(updated);
    setCommunities(updated);
  }, [currentUser]);

  // Add event to community
  const addEvent = useCallback((communityId, event) => {
    const updated = getCommunities().map(c => {
      if (c.id === communityId) {
        return {
          ...c,
          events: [
            ...c.events,
            { id: Date.now(), createdBy: currentUser, attendees: [], ...event }
          ]
        };
      }
      return c;
    });
    saveCommunities(updated);
    setCommunities(updated);
  }, [currentUser]);

  // Add resource to community
  const addResource = useCallback((communityId, resource) => {
    const updated = getCommunities().map(c => {
      if (c.id === communityId) {
        return {
          ...c,
          resources: [
            ...c.resources,
            { id: Date.now(), addedBy: currentUser, addedAt: new Date().toISOString(), ...resource }
          ]
        };
      }
      return c;
    });
    saveCommunities(updated);
    setCommunities(updated);
  }, [currentUser]);

  // Check membership
  const isMember = useCallback((communityId) => {
    const c = communities.find(comm => comm.id === communityId);
    return c ? c.members.includes(currentUser) : false;
  }, [communities, currentUser]);

  // Get single community
  const getCommunity = useCallback((communityId) => {
    return communities.find(c => c.id === communityId) || null;
  }, [communities]);

  return {
    communities,
    myCommunities,
    currentUser,
    getCommunity,
    isMember,
    joinCommunity,
    leaveCommunity,
    createCommunity,
    postToCommunity,
    likePost,
    commentOnPost,
    addEvent,
    addResource,
    refresh,
  };
};
