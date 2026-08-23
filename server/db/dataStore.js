// Centralized UniCollab Data Store (In-Memory + Persistent API State)

export const usersDB = [];

export const teammatesDB = [];

export const hackathonRegistrationsDB = [
  {
    id: 'HACK-984210',
    registrationId: 'HACK-984210',
    hackathonId: '301',
    hackathonTitle: 'Global Student AI Hackathon 2026',
    teamName: 'Team Code Morphicx',
    teamDetails: '4 Members • AI/ML & Full-Stack Platform',
    membersCount: 4,
    studentName: 'Gagan R',
    email: 'gagan.r123456789@gmail.com',
    mobileNumber: '+91 98765 43210',
    collegeName: 'The National Institute of Engineering (NIE)',
    usn: '4NI21CS042',
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
