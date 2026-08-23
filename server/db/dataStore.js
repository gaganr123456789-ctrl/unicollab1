// Centralized UniCollab Data Store (In-Memory + Persistent API State)

export const usersDB = [
  {
    id: 'usr_sarah_chen',
    name: 'Sarah Chen',
    email: 'sarah.chen@stanford.edu',
    role: 'STUDENT',
    degree: 'B.Tech Computer Science & Engineering (CSE)',
    major: 'Computer Science & Engineering (CSE)',
    university: 'Stanford University',
    skills: ['React', 'TypeScript', 'Node.js', 'TailwindCSS', 'GraphQL'],
    bio: 'Full-stack developer building real-time collaboration platforms and open-source dev tools. Looking for AI and backend teammates.',
    avatarBg: '#EFF6FF',
    avatarColor: '#2563EB',
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString()
  },
  {
    id: 'usr_rohan_deshmukh',
    name: 'Rohan Deshmukh',
    email: 'rohan.d@nie.ac.in',
    role: 'STUDENT',
    degree: 'B.Tech Electronics & Communication (ECE)',
    major: 'Electronics & Communication (ECE)',
    university: 'The National Institute of Engineering (NIE)',
    skills: ['Embedded Systems', 'VLSI Design', 'IoT', 'C++', 'MATLAB', 'FPGA'],
    bio: 'ECE final year student passionate about robotics, hardware-software co-design, and smart edge computing systems.',
    avatarBg: '#ECFDF5',
    avatarColor: '#059669',
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString()
  },
  {
    id: 'usr_ananya_sharma',
    name: 'Ananya Sharma',
    email: 'ananya.ai@mit.edu',
    role: 'STUDENT',
    degree: 'B.Tech Artificial Intelligence & Data Science (AI & DS)',
    major: 'Artificial Intelligence & Data Science (AI & DS)',
    university: 'MIT AI Lab',
    skills: ['Python', 'PyTorch', 'TensorFlow', 'Computer Vision', 'LLMs', 'FastAPI'],
    bio: 'AI researcher focused on multimodal foundation models, NLP pipelines, and autonomous agent orchestration.',
    avatarBg: '#FAF5FF',
    avatarColor: '#7C3AED',
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString()
  },
  {
    id: 'usr_marcus_vance',
    name: 'Marcus Vance',
    email: 'marcus.v@berkeley.edu',
    role: 'STUDENT',
    degree: 'B.Tech Information Technology (IT)',
    major: 'Information Technology (IT)',
    university: 'UC Berkeley',
    skills: ['Cloud Architecture', 'AWS', 'Docker', 'Kubernetes', 'Go', 'Cybersecurity'],
    bio: 'Cloud and DevOps enthusiast specializing in scalable distributed microservices, CI/CD automation, and zero-trust security.',
    avatarBg: '#FFFBEB',
    avatarColor: '#D97706',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
  },
  {
    id: 'usr_priya_nair',
    name: 'Priya Nair',
    email: 'priya.nair@iitd.ac.in',
    role: 'STUDENT',
    degree: 'B.Tech Mechanical Engineering (ME)',
    major: 'Mechanical Engineering (ME)',
    university: 'IIT Delhi',
    skills: ['CAD/CAM', 'SolidWorks', 'Robotics Automation', 'ANSYS', 'Mechatronics'],
    bio: 'Mechanical engineering student creating autonomous drone swarms and sustainable mechatronics systems for smart mobility.',
    avatarBg: '#FEF2F2',
    avatarColor: '#DC2626',
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString()
  }
];

export const teammatesDB = [];

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

export const mentorsDB = [];

export const hackathonsDB = [
  {
    id: 301,
    title: 'Global Student AI Hackathon 2026',
    organizer: 'Stanford AI Lab & TechCorp',
    prizePool: '$25,000 USD',
    deadline: 'Sep 15, 2026',
    tags: ['AI/ML', 'Generative AI', 'Web3'],
    participantsCount: 420,
    status: 'Registration Open'
  },
  {
    id: 302,
    title: 'Inter-College Web & Mobile Innovation Challenge',
    organizer: 'UniCollab Developer Network',
    prizePool: '$10,000 USD',
    deadline: 'Oct 01, 2026',
    tags: ['React', 'Node.js', 'Mobile UI'],
    participantsCount: 280,
    status: 'Registration Open'
  }
];

export const messagesDB = [
  {
    id: 1,
    senderId: 2,
    senderName: 'Dr. Ananya Sharma',
    receiverId: 1,
    text: 'The project proposal looks great! Should we finalize the tech stack tonight?',
    timestamp: '10:23 AM',
    unread: false
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
