// Centralized UniCollab Data Store (In-Memory + Persistent API State)

export const usersDB = [];

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
