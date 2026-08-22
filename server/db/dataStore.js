// Centralized UniCollab Data Store (In-Memory + Persistent API State)

export const usersDB = [
  {
    id: 'usr_gagan',
    name: 'Gagan R',
    email: 'gagan.r123456789@gmail.com',
    password: 'password123',
    role: 'ADMIN',
    university: 'GAT',
    major: 'Electronics & Communication Engineering (ECE)',
    initials: 'GR',
    skills: ['React', 'Node.js', 'Engineering']
  },
  {
    id: 'usr_charanya',
    name: 'Charanya Jagannath',
    email: 'charanyajagannath0982@gmail.com',
    password: 'password123',
    role: 'STUDENT',
    university: 'Stanford University',
    major: 'Computer Science & Engineering (CSE)',
    initials: 'CJ',
    skills: ['React', 'Python', 'AI/ML']
  },
  {
    id: 1,
    name: 'Alex Rivera',
    email: 'alex.rivera@stanford.edu',
    password: 'password123',
    role: 'STUDENT',
    age: 21,
    phone: '+91 98765 43210',
    gender: 'Male',
    major: 'Computer Science & Engineering (CSE)',
    university: 'Stanford University',
    initials: 'AR',
    bio: 'Passionate Full Stack Developer specializing in React, Node.js, and AI systems.',
    skills: ['React', 'Node.js', 'Python', 'UI/UX Design', 'PostgreSQL'],
    rating: 4.9,
    projectsCompleted: 14
  },
  {
    id: 2,
    name: 'Sophia Chen',
    email: 'sophia.chen@mit.edu',
    age: 22,
    major: 'Artificial Intelligence & Data Science (AI & DS)',
    university: 'MIT',
    initials: 'SC',
    bio: 'ML Engineer specializing in LLM fine-tuning & Predictive Analytics.',
    skills: ['Python', 'TensorFlow', 'PyTorch', 'Data Viz', 'SQL'],
    rating: 5.0,
    projectsCompleted: 18
  },
  {
    id: 3,
    name: 'Marcus Vance',
    email: 'marcus.v@berkeley.edu',
    age: 23,
    major: 'Information Technology (IT)',
    university: 'UC Berkeley',
    initials: 'MV',
    bio: 'Security researcher passionate about Zero-Trust architectures & penetration testing.',
    skills: ['Ethical Hacking', 'Linux', 'Go', 'Docker', 'Network Security'],
    rating: 4.8,
    projectsCompleted: 9
  }
];

export const teammatesDB = [
  {
    id: 101,
    name: 'Devon Lane',
    role: 'Frontend Developer',
    major: 'Computer Science & Engineering (CSE)',
    university: 'Stanford',
    skills: ['React', 'TypeScript', 'Tailwind', 'Next.js'],
    rating: 4.9,
    avatarBg: '#EFF6FF',
    avatarColor: '#2563EB',
    initials: 'DL',
    matchScore: 98,
    availability: 'Available Now'
  },
  {
    id: 102,
    name: 'Kathryn Murphy',
    role: 'UI/UX Designer',
    major: 'Digital Media & UI/UX Design',
    university: 'MIT',
    skills: ['Figma', 'User Research', 'Prototyping', 'Design Systems'],
    rating: 5.0,
    avatarBg: '#F3E8FF',
    avatarColor: '#7C3AED',
    initials: 'KM',
    matchScore: 95,
    availability: 'Part-Time'
  },
  {
    id: 103,
    name: 'Arjun Mehta',
    role: 'Backend & Cloud Engineer',
    major: 'Information Technology (IT)',
    university: 'IIT Bombay',
    skills: ['Node.js', 'Express', 'PostgreSQL', 'AWS', 'Docker'],
    rating: 4.8,
    avatarBg: '#ECFDF5',
    avatarColor: '#059669',
    initials: 'AM',
    matchScore: 92,
    availability: 'Available Now'
  },
  {
    id: 104,
    name: 'Rohan Sharma',
    role: 'Embedded Systems & Robotics Engineer',
    major: 'Electronics & Communication (ECE)',
    university: 'IIT Delhi',
    skills: ['C++', 'Arduino', 'IoT', 'PCB Design', 'MATLAB'],
    rating: 4.9,
    avatarBg: '#FEF3C7',
    avatarColor: '#D97706',
    initials: 'RS',
    matchScore: 90,
    availability: 'Available Now'
  },
  {
    id: 105,
    name: 'Priya Sundaram',
    role: 'Power Systems & EV Engineer',
    major: 'Electrical & Electronics (EEE)',
    university: 'BITS Pilani',
    skills: ['Circuit Design', 'Simulink', 'Power Electronics', 'Python'],
    rating: 4.7,
    avatarBg: '#FCE7F3',
    avatarColor: '#DB2777',
    initials: 'PS',
    matchScore: 88,
    availability: 'Part-Time'
  },
  {
    id: 106,
    name: 'David Kim',
    role: 'CAD & Thermal Analyst',
    major: 'Mechanical Engineering (ME)',
    university: 'Stanford University',
    skills: ['SolidWorks', 'ANSYS', 'Python', 'Robotics', '3D Printing'],
    rating: 4.9,
    avatarBg: '#E0F2FE',
    avatarColor: '#0284C7',
    initials: 'DK',
    matchScore: 94,
    availability: 'Available Now'
  },
  {
    id: 107,
    name: 'Aarav Patel',
    role: 'Structural & Smart City Engineer',
    major: 'Civil Engineering (CE)',
    university: 'IIT Madras',
    skills: ['AutoCAD', 'Revit', 'GIS', 'Structural Analysis', 'Project Management'],
    rating: 4.8,
    avatarBg: '#F1F5F9',
    avatarColor: '#475569',
    initials: 'AP',
    matchScore: 86,
    availability: 'Available Now'
  },
  {
    id: 108,
    name: 'Emily Watson',
    role: 'Aerodynamics & Propulsion Developer',
    major: 'Aerospace & Aeronautical Engineering',
    university: 'Georgia Tech',
    skills: ['CFD', 'Flight Simulation', 'C++', 'Python', 'ROS'],
    rating: 4.95,
    avatarBg: '#EDE9FE',
    avatarColor: '#6D28D9',
    initials: 'EW',
    matchScore: 96,
    availability: 'Available Now'
  },
  {
    id: 109,
    name: 'Dr. Vikram Malhotra',
    role: 'Biomedical Devices & AI Researcher',
    major: 'Biotechnology & Biomedical',
    university: 'Johns Hopkins',
    skills: ['Bioinformatics', 'Python', 'Signal Processing', 'LabVIEW'],
    rating: 5.0,
    avatarBg: '#CCFBF1',
    avatarColor: '#0D9488',
    initials: 'VM',
    matchScore: 97,
    availability: 'Part-Time'
  },
  {
    id: 110,
    name: 'Ananya Gupta',
    role: 'Process & Chemical Simulation Lead',
    major: 'Chemical & Materials Engineering',
    university: 'IIT Kanpur',
    skills: ['Aspen Plus', 'Materials Science', 'Data Analysis', 'Python'],
    rating: 4.75,
    avatarBg: '#FEF2F2',
    avatarColor: '#DC2626',
    initials: 'AG',
    matchScore: 89,
    availability: 'Available Now'
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
    id: 201,
    name: 'Dr. Ananya Sharma',
    title: 'Senior AI Researcher @ Google DeepMind',
    domain: 'Artificial Intelligence & ML',
    rating: 5.0,
    reviews: 42,
    hourlyRate: 'Free (University Sponsored)',
    availability: 'Mon, Wed, Fri (4 PM - 7 PM)',
    initials: 'AS',
    avatarBg: '#EFF6FF',
    avatarColor: '#2563EB'
  },
  {
    id: 202,
    name: 'Prof. David Sterling',
    title: 'Head of Software Systems @ MIT',
    domain: 'Distributed Systems & Cloud',
    rating: 4.9,
    reviews: 38,
    hourlyRate: 'Free (University Sponsored)',
    availability: 'Tue, Thu (2 PM - 5 PM)',
    initials: 'DS',
    avatarBg: '#F3E8FF',
    avatarColor: '#7C3AED'
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
