// Centralized UniCollab Data Store (In-Memory + Persistent Disk & API State)
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PERSISTENT_USERS_FILE = path.join(__dirname, 'persistentUsers.json');

// Verified Base Seed Users (Lively Registered Accounts)
export const initialSeedUsers = [
  {
    id: 'usr_gagan',
    name: 'Gagan R',
    email: 'gagan.r123456789@gmail.com',
    password: '$2b$10$16pp/eFGtem.ToIYosdu4O0Hgv2.LaKUOAeDPTcch6SuTNtbuI3Q.', // hashed 'gagan123'
    role: 'STUDENT',
    university: 'Global Academy of Technology',
    major: 'Electronics & Communication Engineering (ECE)',
    degree: 'B.Tech Electronics & Communication Engineering (ECE)',
    projectFocus: 'Full-Stack Web Dev & AI',
    roleTitle: 'Student Lead',
    skills: ['React', 'Node.js', 'PostgreSQL', 'Socket.IO', 'TypeScript', 'Python'],
    avatarBg: '#2563EB',
    bio: 'Full Stack Engineer & AI Systems builder at Global Academy of Technology. Passionate about real-time collaborative architectures.',
    age: 21,
    phone: '+91 98765 43210',
    gender: 'Male',
    createdAt: '2026-08-01T10:00:00.000Z',
    created: '2026-08-01T10:00:00.000Z'
  },
  {
    id: 'usr_renukesh78',
    name: 'Renukesh',
    email: 'renukesh78@gmail.com',
    password: '$2b$10$9PrgrYlaIkxY5LfTtKUKLe421h32m3DBp8utjaHBVdLUyRQsx0YOy', // hashed 'renu123'
    role: 'STUDENT',
    university: 'Global Academy of Technology',
    major: 'Computer Science & Engineering (CSE)',
    degree: 'B.Tech Computer Science & Engineering (CSE)',
    projectFocus: 'Cloud Infrastructure & Security',
    roleTitle: 'Student Developer',
    skills: ['Python', 'Docker', 'Kubernetes', 'AWS', 'PostgreSQL', 'FastAPI'],
    avatarBg: '#059669',
    bio: 'Cloud architecture enthusiast focusing on microservices, serverless deployments, and secure distributed backend systems.',
    age: 21,
    phone: '+91 98451 23456',
    gender: 'Male',
    createdAt: '2026-08-05T11:30:00.000Z',
    created: '2026-08-05T11:30:00.000Z'
  },
  {
    id: 'usr_charanya',
    name: 'Charanya Jaganath',
    email: 'charanyajagannath0982@gmail.com',
    password: '$2b$10$gcX6sFuwR0v0UG0XxabuQeXYTDX16TTFIvudQ.pv/d7nVtSGYD9F2', // hashed 'charanya0982'
    role: 'STUDENT',
    university: 'Stanford University',
    major: 'Artificial Intelligence & Machine Learning (AIML)',
    degree: 'B.Tech Artificial Intelligence & Machine Learning (AIML)',
    projectFocus: 'Generative AI & LLMs',
    roleTitle: 'AI Researcher',
    skills: ['PyTorch', 'TensorFlow', 'Python', 'NLP', 'Computer Vision', 'LangChain'],
    avatarBg: '#7C3AED',
    bio: 'AI researcher working on multimodal LLMs, agentic reasoning loops, and prompt engineering algorithms.',
    age: 21,
    phone: '+91 97312 34567',
    gender: 'Female',
    createdAt: '2026-08-10T14:15:00.000Z',
    created: '2026-08-10T14:15:00.000Z'
  },
  {
    id: 'usr_saash',
    name: 'saash',
    email: 'saash@gmail.com',
    password: '$2b$10$Kp5ih3/GBPomwltl1aiTvukzukJ7X1ekTp2SzU1QrsIAL5emEoC72',
    role: 'STUDENT',
    university: 'BNM Institute of Technology (BNMIT)',
    major: 'Information Science & Engineering (ISE)',
    degree: 'B.Tech Information Science & Engineering (ISE)',
    projectFocus: 'Mobile Apps & UI/UX',
    roleTitle: 'Frontend Specialist',
    skills: ['React Native', 'Flutter', 'Figma', 'TypeScript', 'Tailwind CSS', 'Next.js'],
    avatarBg: '#DB2777',
    bio: 'Creative frontend engineer and mobile app developer designing fluid interactive user interfaces and design systems.',
    age: 20,
    phone: '+91 96111 87654',
    gender: 'Male',
    createdAt: '2026-08-12T09:00:00.000Z',
    created: '2026-08-12T09:00:00.000Z'
  },
  {
    id: 'usr_pranav',
    name: 'Pranav',
    email: 'pranav@gmail.com',
    password: '$2b$10$Kp5ih3/GBPomwltl1aiTvukzukJ7X1ekTp2SzU1QrsIAL5emEoC72',
    role: 'STUDENT',
    university: 'Global Academy of Technology',
    major: 'Computer Science & Engineering (CSE)',
    degree: 'B.Tech Computer Science & Engineering (CSE)',
    projectFocus: 'Cybersecurity & Blockchain',
    roleTitle: 'Security Analyst',
    skills: ['Solidity', 'Smart Contracts', 'Cryptography', 'Go', 'Linux', 'Node.js'],
    avatarBg: '#EA580C',
    bio: 'Cybersecurity student focusing on smart contract security audits, zero-knowledge proofs, and decentralized identity.',
    age: 21,
    phone: '+91 99001 23456',
    gender: 'Male',
    createdAt: '2026-08-14T16:45:00.000Z',
    created: '2026-08-14T16:45:00.000Z'
  },
  {
    id: 'usr_bhuvan',
    name: 'Bhuvan',
    email: 'bhuvan@gmail.com',
    password: '$2b$10$Kp5ih3/GBPomwltl1aiTvukzukJ7X1ekTp2SzU1QrsIAL5emEoC72',
    role: 'STUDENT',
    university: 'Global Academy of Technology',
    major: 'Mechanical Engineering (ME)',
    degree: 'B.Tech Mechanical Engineering (ME)',
    projectFocus: 'Robotics & Embedded IoT',
    roleTitle: 'Hardware Engineer',
    skills: ['ROS 2', 'Embedded C', 'Arduino', 'SolidWorks', 'Python', 'MATLAB'],
    avatarBg: '#0D9488',
    bio: 'Robotics and Mechatronics builder working on autonomous unmanned aerial vehicles and sensor telemetry arrays.',
    age: 21,
    phone: '+91 98860 98765',
    gender: 'Male',
    createdAt: '2026-08-16T12:20:00.000Z',
    created: '2026-08-16T12:20:00.000Z'
  }
];

// Load disk-persisted users and merge with seed users
const loadPersistentUsers = () => {
  let diskUsers = [];
  try {
    if (fs.existsSync(PERSISTENT_USERS_FILE)) {
      const data = fs.readFileSync(PERSISTENT_USERS_FILE, 'utf8');
      diskUsers = JSON.parse(data);
    }
  } catch (err) {
    console.warn('Could not read persistentUsers.json:', err.message);
  }

  const map = new Map();
  // Add seed users first
  for (const u of initialSeedUsers) {
    if (u && u.email) {
      map.set(u.email.toLowerCase().trim(), u);
    }
  }
  // Overlay disk users (latest registered accounts take precedence)
  for (const u of diskUsers) {
    if (u && u.email) {
      map.set(u.email.toLowerCase().trim(), u);
    }
  }
  return Array.from(map.values());
};

export const savePersistentUsersToDisk = (users) => {
  try {
    fs.writeFileSync(PERSISTENT_USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
  } catch (err) {
    console.warn('Could not write persistentUsers.json:', err.message);
  }
};

export const usersDB = loadPersistentUsers();

export const saveUserRecord = (user) => {
  if (!user || !user.email) return;
  const normalizedEmail = user.email.toLowerCase().trim();
  const existingIdx = usersDB.findIndex(u => u.email.toLowerCase().trim() === normalizedEmail);
  if (existingIdx >= 0) {
    usersDB[existingIdx] = { ...usersDB[existingIdx], ...user };
  } else {
    usersDB.unshift(user);
  }
  savePersistentUsersToDisk(usersDB);
};

const PERSISTENT_CONNECTIONS_FILE = path.join(__dirname, 'persistentConnections.json');
const PERSISTENT_INVITES_FILE = path.join(__dirname, 'persistentInvites.json');

const loadPersistentConnections = () => {
  try {
    if (fs.existsSync(PERSISTENT_CONNECTIONS_FILE)) {
      const data = fs.readFileSync(PERSISTENT_CONNECTIONS_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.warn('Could not read persistentConnections.json:', err.message);
  }
  return [];
};

export const savePersistentConnectionsToDisk = (connections) => {
  try {
    fs.writeFileSync(PERSISTENT_CONNECTIONS_FILE, JSON.stringify(connections, null, 2), 'utf8');
  } catch (err) {
    console.warn('Could not write persistentConnections.json:', err.message);
  }
};

export const connectionsDB = loadPersistentConnections();

export const saveConnectionRecord = (conn) => {
  if (!conn) return;
  const sEmail = (conn.senderEmail || '').toLowerCase().trim();
  const rEmail = (conn.receiverEmail || '').toLowerCase().trim();
  const sId = conn.senderId;
  const rId = conn.receiverId;

  const existingIdx = connectionsDB.findIndex(c => 
    (c.id && conn.id && c.id === conn.id) ||
    (sEmail && rEmail && (
      (c.senderEmail?.toLowerCase().trim() === sEmail && c.receiverEmail?.toLowerCase().trim() === rEmail) ||
      (c.senderEmail?.toLowerCase().trim() === rEmail && c.receiverEmail?.toLowerCase().trim() === sEmail)
    )) ||
    (sId && rId && (
      (c.senderId === sId && c.receiverId === rId) ||
      (c.senderId === rId && c.receiverId === sId)
    ))
  );

  if (existingIdx >= 0) {
    connectionsDB[existingIdx] = {
      ...connectionsDB[existingIdx],
      ...conn,
      updatedAt: new Date().toISOString()
    };
  } else {
    connectionsDB.unshift({
      ...conn,
      createdAt: conn.createdAt || new Date().toISOString(),
      updatedAt: conn.updatedAt || new Date().toISOString()
    });
  }
  savePersistentConnectionsToDisk(connectionsDB);
};

export const removeConnectionRecord = (connId, userAEmail, userBEmail) => {
  const normA = (userAEmail || '').toLowerCase().trim();
  const normB = (userBEmail || '').toLowerCase().trim();

  const filtered = connectionsDB.filter(c => {
    if (connId && c.id === connId) return false;
    if (normA && normB) {
      const s = (c.senderEmail || '').toLowerCase().trim();
      const r = (c.receiverEmail || '').toLowerCase().trim();
      if ((s === normA && r === normB) || (s === normB && r === normA)) return false;
    }
    return true;
  });

  connectionsDB.length = 0;
  connectionsDB.push(...filtered);
  savePersistentConnectionsToDisk(connectionsDB);
};

export const teammatesDB = [];

export const conversationsDB = [];

export const messagesDB = [];

const initialInvitesSeed = [
  {
    id: 'inv_seed_drone',
    senderId: 'usr_ananya',
    senderName: 'Dr. Ananya Sharma',
    senderEmail: 'ananya.sharma@stanford.edu',
    recipientId: 'all',
    recipientEmail: '',
    type: 'TEAM_INVITE',
    teamId: 'team_drone_1',
    teamName: 'Autonomous Drone Navigation',
    teamDesc: 'Autonomous multi-rotor drone navigation with ROS 2 and OpenCV for campus micro-deliveries.',
    teamLeader: 'Dr. Ananya Sharma',
    projectCategory: 'Engineering & Robotics',
    requiredSkills: ['ROS 2', 'Python', 'C++', 'Computer Vision', 'Robotics'],
    message: 'Dr. Ananya Sharma invited you to join the Autonomous Drone Navigation team.',
    status: 'pending',
    createdAt: new Date().toISOString()
  }
];

const loadPersistentInvites = () => {
  try {
    if (fs.existsSync(PERSISTENT_INVITES_FILE)) {
      const data = fs.readFileSync(PERSISTENT_INVITES_FILE, 'utf8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (err) {
    console.warn('Could not read persistentInvites.json:', err.message);
  }
  return [...initialInvitesSeed];
};

export const savePersistentInvitesToDisk = (invites) => {
  try {
    fs.writeFileSync(PERSISTENT_INVITES_FILE, JSON.stringify(invites, null, 2), 'utf8');
  } catch (err) {
    console.warn('Could not write persistentInvites.json:', err.message);
  }
};

export const invitesDB = loadPersistentInvites();

export const saveInviteRecord = (invite) => {
  if (!invite) return;
  const existingIdx = invitesDB.findIndex(i => i.id === invite.id);
  if (existingIdx >= 0) {
    invitesDB[existingIdx] = { ...invitesDB[existingIdx], ...invite };
  } else {
    invitesDB.unshift(invite);
  }
  savePersistentInvitesToDisk(invitesDB);
};

export const teamsDB = [
  {
    id: 'team_drone_1',
    name: 'Autonomous Drone Navigation',
    description: 'Autonomous multi-rotor drone navigation with ROS 2 and OpenCV for campus micro-deliveries.',
    category: 'Engineering & Robotics',
    leadId: 'usr_ananya',
    leadName: 'Dr. Ananya Sharma',
    leadEmail: 'ananya.sharma@stanford.edu',
    requiredSkills: ['ROS 2', 'Python', 'C++', 'Computer Vision', 'Robotics'],
    createdAt: '2026-08-15T10:00:00Z'
  },
  {
    id: 'team_fintrack_2',
    name: 'FinTrack Mobile',
    description: 'Cross-platform financial collaboration and budget management app for university students and capstone evaluation.',
    category: 'Software & FinTech',
    leadId: 'usr_alex',
    leadName: 'Alex Thompson',
    leadEmail: 'alex.thompson@stanford.edu',
    requiredSkills: ['React Native', 'TypeScript', 'Node.js', 'PostgreSQL'],
    createdAt: '2026-08-10T10:00:00Z'
  },
  {
    id: 'team_ecotrack_3',
    name: 'EcoTrack Sustainability',
    description: 'Campus sustainability tracker reducing carbon footprint through IoT sensors and automated metric reporting.',
    category: 'CleanTech & IoT',
    leadId: 'usr_sarah',
    leadName: 'Sarah Chen',
    leadEmail: 'sarah.chen@stanford.edu',
    requiredSkills: ['React', 'Node.js', 'IoT', 'Hardware'],
    createdAt: '2026-08-12T10:00:00Z'
  }
];

export const teamMembersDB = [
  {
    id: 'tm_1',
    teamId: 'team_drone_1',
    userId: 'usr_ananya',
    name: 'Dr. Ananya Sharma',
    email: 'ananya.sharma@stanford.edu',
    role: 'Project Leader',
    joinedAt: '2026-08-15T10:00:00Z'
  },
  {
    id: 'tm_2',
    teamId: 'team_drone_1',
    userId: 'usr_sarah',
    name: 'Sarah Chen',
    email: 'sarah.chen@stanford.edu',
    role: 'Software Architect',
    joinedAt: '2026-08-16T11:00:00Z'
  },
  {
    id: 'tm_3',
    teamId: 'team_fintrack_2',
    userId: 'usr_alex',
    name: 'Alex Thompson',
    email: 'alex.thompson@stanford.edu',
    role: 'Project Lead',
    joinedAt: '2026-08-10T10:00:00Z'
  },
  {
    id: 'tm_4',
    teamId: 'team_fintrack_2',
    userId: 'usr_sarah',
    name: 'Sarah Chen',
    email: 'sarah.chen@stanford.edu',
    role: 'Backend Engineer',
    joinedAt: '2026-08-11T12:00:00Z'
  },
  {
    id: 'tm_5',
    teamId: 'team_fintrack_2',
    userId: 'usr_marcus',
    name: 'Marcus Johnson',
    email: 'marcus.johnson@stanford.edu',
    role: 'UI/UX Lead',
    joinedAt: '2026-08-12T14:00:00Z'
  }
];

export const hackathonRegistrationsDB = [
  {
    id: 'HACK-984210',
    registrationId: 'HACK-984210',
    hackathonId: '301',
    hackathonTitle: 'Global Student AI Hackathon 2026',
    teamName: 'Team Code Morphicx',
    teamDetails: '4 Members • AI/ML & Full-Stack Platform',
    membersCount: 4,
    studentName: 'Alex Rivera',
    email: 'alex.rivera@stanford.edu',
    mobileNumber: '+1 650 555 0192',
    collegeName: 'Stanford University',
    usn: 'STAN21CS042',
    status: 'CONFIRMED',
    registeredAt: new Date().toISOString(),
    createdAt: new Date().toISOString()
  }
];

export const tasksDB = [
  {
    id: 1,
    title: 'Finalize System Architecture & Data Schema',
    category: 'Backend',
    column: 'Completed',
    priority: 'High',
    assignee: 'Alex Rivera',
    dueDate: 'Aug 20'
  },
  {
    id: 2,
    title: 'Implement REST API Endpoints for Authentication',
    category: 'Security',
    column: 'In Progress',
    priority: 'Urgent',
    assignee: 'Arjun Mehta',
    dueDate: 'Aug 22'
  },
  {
    id: 3,
    title: 'Design Dark & Light Glassmorphic Theme Components',
    category: 'Design',
    column: 'Peer Review',
    priority: 'Medium',
    assignee: 'Kathryn Murphy',
    dueDate: 'Aug 25'
  },
  {
    id: 4,
    title: 'Conduct Automated E2E & Load Testing',
    category: 'QA & Testing',
    column: 'Backlog',
    priority: 'Low',
    assignee: 'Devon Lane',
    dueDate: 'Aug 28'
  }
];

export const mentorsDB = [
  {
    id: 1,
    name: 'Dr. Ananya Sharma',
    role: 'Distinguished Professor & AI Research Lead',
    title: 'Distinguished Professor & AI Research Lead',
    company: 'Stanford University • AI Research Lab',
    university: 'Stanford University',
    rating: 4.9,
    reviews: 128,
    category: 'Computer Science',
    skills: ['AI/ML', 'Multimodal LLMs', 'Computer Vision', 'PyTorch'],
    nextAvailable: 'Tomorrow, 2:00 PM',
    bio: 'Leading research in multimodal reasoning systems and generative foundation models. Advises undergraduate & graduate capstone teams on deep learning architectures.',
    avatarBg: '#EFF6FF',
    avatarColor: '#2563EB',
    initials: 'AS'
  },
  {
    id: 2,
    name: 'Dr. Marcus Sterling',
    role: 'Principal Cloud Architect & Distributed Systems Advisor',
    title: 'Principal Cloud Architect & Distributed Systems Advisor',
    company: 'MIT CSAIL & AWS Architecture Lab',
    university: 'MIT CSAIL',
    rating: 5.0,
    reviews: 94,
    category: 'Engineering',
    skills: ['Kubernetes', 'Cloud Systems', 'Microservices', 'Distributed Systems'],
    nextAvailable: 'Wednesday, 4:30 PM',
    bio: '20+ years building hyperscale cloud platforms and resilient backend infrastructure. Helps student teams scale full-stack architectures and microservices.',
    avatarBg: '#FAF5FF',
    avatarColor: '#7C3AED',
    initials: 'MS'
  },
  {
    id: 3,
    name: 'Elena Rostova',
    role: 'Head of Product Design & HCI Researcher',
    title: 'Head of Product Design & HCI Researcher',
    company: 'Harvard Innovation Labs',
    university: 'Harvard University',
    rating: 4.8,
    reviews: 112,
    category: 'Design',
    skills: ['UI/UX Design', 'Design Systems', 'Figma Prototyping', 'User Research'],
    nextAvailable: 'Thursday, 11:00 AM',
    bio: 'Passionate about human-centered interaction design and accessible web experiences. Mentors students on product prototyping and design polish.',
    avatarBg: '#ECFDF5',
    avatarColor: '#059669',
    initials: 'ER'
  },
  {
    id: 4,
    name: 'Prof. Rajesh Deshmukh',
    role: 'Senior Faculty & Embedded Systems Director',
    title: 'Senior Faculty & Embedded Systems Director',
    company: 'The National Institute of Engineering (NIE)',
    university: 'The National Institute of Engineering (NIE)',
    rating: 4.9,
    reviews: 86,
    category: 'Engineering',
    skills: ['VLSI Design', 'Embedded Systems', 'IoT Microgrid', 'FPGA', 'Robotics'],
    nextAvailable: 'Friday, 3:00 PM',
    bio: 'Specializes in VLSI chip design, edge computing hardware, and IoT systems. Guides capstone students in circuit synthesis and smart robotics.',
    avatarBg: '#FFFBEB',
    avatarColor: '#D97706',
    initials: 'RD'
  },
  {
    id: 5,
    name: 'David Chen, MBA',
    role: 'Venture Partner & Startup Strategy Lead',
    title: 'Venture Partner & Startup Strategy Lead',
    company: 'Berkeley Haas Entrepreneurship Hub',
    university: 'UC Berkeley Haas',
    rating: 4.9,
    reviews: 75,
    category: 'Business',
    skills: ['Venture Capital', 'Product-Market Fit', 'Pitch Decks', 'FinTech'],
    nextAvailable: 'Friday, 1:30 PM',
    bio: 'Helps student founders validate product ideas, formulate go-to-market strategies, and prepare compelling pitches for angel & seed stage venture funding.',
    avatarBg: '#FEF2F2',
    avatarColor: '#DC2626',
    initials: 'DC'
  },
  {
    id: 6,
    name: 'Dr. Sophia Vance',
    role: 'Professor of Applied Mathematics & Cryptography',
    title: 'Professor of Applied Mathematics & Cryptography',
    company: 'Cambridge Mathematical Sciences',
    university: 'University of Cambridge',
    rating: 5.0,
    reviews: 62,
    category: 'Mathematics',
    skills: ['Applied Statistics', 'Optimization Algorithms', 'Cryptography', 'Quantum'],
    nextAvailable: 'Next Monday, 10:00 AM',
    bio: 'Advisor on mathematical modeling, stochastic optimization algorithms, and cryptographic protocol analysis.',
    avatarBg: '#F0FDF4',
    avatarColor: '#16A34A',
    initials: 'SV'
  }
];

export const hackathonsDB = [
  {
    id: '301',
    title: 'Global Student AI Hackathon 2026',
    organizer: 'Stanford AI Lab & TechCorp',
    description: 'Join 500+ developers, designers, and student innovators to build next-generation multimodal AI applications, transformer pipelines, and intelligent agents solving pressing global challenges.',
    dateDisplay: 'Nov 15 - 17, 2026',
    deadlineDisplay: 'Nov 10, 2026',
    startDate: new Date('2026-11-15T09:00:00Z').toISOString(),
    endDate: new Date('2026-11-17T18:00:00Z').toISOString(),
    location: 'Hybrid • Online & Stanford Campus Hub',
    registrationLink: '',
    eligibility: 'All currently enrolled undergraduate & graduate university students worldwide.',
    teamSize: '2 - 4 Members',
    prizePool: '$25,000 USD',
    technologies: ['AI/ML', 'PyTorch', 'Next.js', 'LLMs', 'Python'],
    bannerUrl: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=80',
    additionalInfo: 'Free API credits provided for OpenAI & Anthropic models. Mentorship office hours from Stanford AI Lab researchers. 24/7 Discord support.',
    status: 'published',
    participantsCount: 450,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '302',
    title: 'Inter-College Web & Cloud Innovation Sprint',
    organizer: 'UniCollab Developer Network & AWS',
    description: 'A 48-hour rapid development sprint challenging university teams to architect highly scalable, cloud-native web and mobile applications with real-time collaboration engines.',
    dateDisplay: 'Dec 05 - 07, 2026',
    deadlineDisplay: 'Dec 01, 2026',
    startDate: new Date('2026-12-05T09:00:00Z').toISOString(),
    endDate: new Date('2026-12-07T18:00:00Z').toISOString(),
    location: '100% Online (Virtual Submission & Live Stream Pitches)',
    registrationLink: '',
    eligibility: 'Open to all engineering & polytechnic students.',
    teamSize: '1 - 4 Members',
    prizePool: '$15,000 USD',
    technologies: ['React', 'Node.js', 'PostgreSQL', 'Docker', 'AWS'],
    bannerUrl: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80',
    additionalInfo: '$500 AWS Cloud Credits per team + 1-year UniCollab Pro subscription for finalists. Industry judging panel from AWS & GitHub.',
    status: 'published',
    participantsCount: 310,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '303',
    title: 'CleanTech & Smart Campus IoT Challenge',
    organizer: 'GreenEnergy Foundation & IEEE Student Branch',
    description: 'Create innovative hardware-software IoT prototypes addressing microgrid power management, smart waste analytics, and campus carbon neutrality.',
    dateDisplay: 'Jan 20 - 22, 2027',
    deadlineDisplay: 'Jan 15, 2027',
    startDate: new Date('2027-01-20T09:00:00Z').toISOString(),
    endDate: new Date('2027-01-22T18:00:00Z').toISOString(),
    location: 'In-Person • NIE Campus Auditorium & Makerspace',
    registrationLink: '',
    eligibility: 'ECE, EEE, Robotics & CS students with hardware prototype aspirations.',
    teamSize: '2 - 5 Members',
    prizePool: '₹2,50,000 INR',
    technologies: ['IoT', 'Embedded Systems', 'Arduino / ESP32', 'Python', 'MQTT'],
    bannerUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
    additionalInfo: 'Hardware lab components, 3D printing access, and sensors provided on-site during Day 1.',
    status: 'published',
    participantsCount: 180,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];


export const projectsDB = [
  {
    id: 1,
    title: 'AI Autonomous Code Analysis Agent',
    description: 'Developing multi-agent autonomous reasoning models for capstone research.',
    category: 'AI & Machine Learning',
    status: 'Active',
    author: 'Alex Rivera'
  },
  {
    id: 2,
    title: 'Smart Campus IoT Microgrid Manager',
    description: 'Real-time energy distribution monitoring for university campuses.',
    category: 'Internet of Things (IoT)',
    status: 'Active',
    author: 'Priya Sundaram'
  }
];
