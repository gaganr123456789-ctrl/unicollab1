import React, { useState, useEffect } from 'react';
import CreateProjectModal from '../components/CreateProjectModal';
import ProjectDetailModal from '../components/ProjectDetailModal';
import { apiClient } from '../services/apiClient';
import { io } from 'socket.io-client';
import { 
  Search, 
  Plus, 
  SlidersHorizontal, 
  Clock, 
  Users, 
  Star
} from 'lucide-react';

export default function ProjectsPage({ setCurrentPage, userProfile }) {
  const [selectedFilter, setSelectedFilter] = useState('All Projects');
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(6);
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);

  const defaultProjects = [
    {
      id: 1,
      title: 'EcoTrack: Sustainability',
      category: 'SOFTWARE',
      level: 'INTERMEDIATE',
      desc: 'A platform to help university campuses track and reduce their carbon footprint through IoT smart sensors.',
      tags: ['React', 'Node.js', 'IoT'],
      commitment: '8-10 hrs/week',
      spots: '2/5 spots left',
      lead: 'Sarah Chen'
    },
    {
      id: 2,
      title: 'AI Ethics & Algorithmic Bias',
      category: 'RESEARCH',
      level: 'ADVANCED',
      desc: 'Conducting a deep dive into social media algorithms to identify and mitigate bias in automated recommendation feeds.',
      tags: ['Python', 'Ethics', 'ML'],
      commitment: '5-7 hrs/week',
      spots: '1/3 spots left',
      lead: 'Prof. Rajesh Verma'
    },
    {
      id: 3,
      title: 'UniVibe: Campus Social',
      category: 'DESIGN',
      level: 'BEGINNER',
      desc: 'Reimagining the branding and UI design for the Student Union, including a full mobile UI kit for upcoming events.',
      tags: ['Figma', 'Branding', 'UI/UX'],
      commitment: '4-6 hrs/week',
      spots: '3/4 spots left',
      lead: 'Leo Rodriguez'
    },
    {
      id: 4,
      title: 'Lunar Rover Vision System',
      category: 'ENGINEERING',
      level: 'ADVANCED',
      desc: 'Developing a computer vision module for a small-scale rover prototype to navigate rocky terrain autonomously.',
      tags: ['C++', 'OpenCV', 'Robotics'],
      commitment: '12-15 hrs/week',
      spots: '1/6 spots left',
      lead: 'Engineering Lab'
    },
    {
      id: 5,
      title: 'Student Wellness Mobile',
      category: 'SOFTWARE',
      level: 'INTERMEDIATE',
      desc: 'Creating a Flutter-based app focused on mental health tracking and peer-to-peer counseling support groups.',
      tags: ['Flutter', 'Firebase', 'Design'],
      commitment: '10 hrs/week',
      spots: '2/4 spots left',
      lead: 'Aisha Patel'
    },
    {
      id: 6,
      title: 'Blockchain for Academic',
      category: 'RESEARCH',
      level: 'ADVANCED',
      desc: 'Exploring the use of smart contracts to verify and store student credentials securely on the decentralized network.',
      tags: ['Solidity', 'Web3', 'Research'],
      commitment: '8 hrs/week',
      spots: '2/2 spots left',
      lead: 'Tech Society'
    },
    {
      id: 7,
      title: 'Autonomous Drone Delivery Platform',
      category: 'ENGINEERING',
      level: 'ADVANCED',
      desc: 'Building a multi-rotor autonomous drone with ROS 2 and OpenCV for automated micro-deliveries between campus academic buildings.',
      tags: ['ROS 2', 'Python', 'Robotics', 'Hardware'],
      commitment: '10-14 hrs/week',
      spots: '2/5 spots left',
      lead: 'Robotics Club'
    },
    {
      id: 8,
      title: 'Quantum Machine Learning Classifier',
      category: 'RESEARCH',
      level: 'ADVANCED',
      desc: 'Hybrid classical-quantum neural networks for high-dimensional medical image classification using Qiskit and PyTorch.',
      tags: ['Qiskit', 'PyTorch', 'Quantum', 'Data Science'],
      commitment: '8-12 hrs/week',
      spots: '1/3 spots left',
      lead: 'Dr. Ananya Sharma'
    },
    {
      id: 9,
      title: 'FinTrack: Roommate Budgeting App',
      category: 'SOFTWARE',
      level: 'INTERMEDIATE',
      desc: 'Cross-platform React Native app providing AI-powered personal finance management and split-billing for college roommates.',
      tags: ['React Native', 'TypeScript', 'Node.js', 'Plaid API'],
      commitment: '6-8 hrs/week',
      spots: '3/6 spots left',
      lead: 'Prof. Rajesh Verma'
    },
    {
      id: 10,
      title: 'CyberGuard: Campus Threat Intelligence',
      category: 'SOFTWARE',
      level: 'ADVANCED',
      desc: 'Real-time packet analyzer and intrusion detection dashboard leveraging machine learning anomaly detection for campus Wi-Fi security.',
      tags: ['Cybersecurity', 'Python', 'Go', 'Wireshark'],
      commitment: '8-10 hrs/week',
      spots: '2/4 spots left',
      lead: 'CyberSec Student Guild'
    },
    {
      id: 11,
      title: 'Smart Campus Micro-Grid Simulator',
      category: 'ENGINEERING',
      level: 'INTERMEDIATE',
      desc: 'Simulating solar energy storage and load balancing across university dormitories using MATLAB/Simulink and IoT power meters.',
      tags: ['MATLAB', 'IoT', 'CleanTech', 'Renewables'],
      commitment: '6-9 hrs/week',
      spots: '3/5 spots left',
      lead: 'Energy Research Lab'
    },
    {
      id: 12,
      title: 'WebXR Virtual Campus 3D Tour',
      category: 'DESIGN',
      level: 'INTERMEDIATE',
      desc: 'Creating an interactive WebXR / Unity VR experience allowing prospective international students to explore campus buildings in 3D.',
      tags: ['Unity 3D', 'WebXR', 'C#', '3D Modeling'],
      commitment: '7-10 hrs/week',
      spots: '2/4 spots left',
      lead: 'Priya Nair'
    }
  ];

  const [projectsList, setProjectsList] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('unicollab_user_projects');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return [...parsed, ...defaultProjects];
        } catch (e) {}
      }
    }
    return defaultProjects;
  });

  useEffect(() => {
    const fetchServerProjects = async () => {
      try {
        const res = await apiClient.getProjects();
        if (res.success && Array.isArray(res.projects) && res.projects.length > 0) {
          setProjectsList(prev => {
            const map = new Map();
            [...res.projects, ...prev].forEach(p => map.set(p.title || p.id, p));
            return Array.from(map.values());
          });
        }
      } catch (e) {}
    };
    fetchServerProjects();

    try {
      const socketUrl = typeof window !== 'undefined' && window.location.hostname === 'localhost'
        ? 'http://localhost:5000'
        : typeof window !== 'undefined' && window.location.hostname.includes('onrender.com')
          ? window.location.origin
          : 'https://unicollab1.onrender.com';
      const socket = io(socketUrl, { transports: ['websocket', 'polling'] });

      socket.on('project:created', (newProj) => {
        if (!newProj || !newProj.title) return;
        setProjectsList(prev => [newProj, ...prev]);
      });

      return () => socket.disconnect();
    } catch (e) {
      console.warn('Socket project listener warning:', e);
    }
  }, []);

  const handleProjectCreated = (newProj) => {
    setProjectsList(prev => {
      const updated = [newProj, ...prev];
      if (typeof window !== 'undefined') {
        const existingUser = JSON.parse(localStorage.getItem('unicollab_user_projects') || '[]');
        localStorage.setItem('unicollab_user_projects', JSON.stringify([newProj, ...existingUser]));
      }
      return updated;
    });
  };

  const categories = ['All Projects', 'Data & Research', 'Robotics'];

  const filteredProjects = (projectsList || []).filter(p => {
    const matchesSearch = searchQuery === '' || 
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (selectedFilter === 'All Projects') return true;
    if (selectedFilter === 'Data & Research') return p.category === 'RESEARCH';
    if (selectedFilter === 'Robotics') return p.tags.includes('Robotics') || p.tags.includes('IoT');
    return true;
  });

  const displayedProjects = filteredProjects.slice(0, visibleCount);

  const handleLoadMore = () => {
    if (visibleCount < filteredProjects.length) {
      setVisibleCount(prev => Math.min(prev + 6, filteredProjects.length));
    } else {
      setVisibleCount(6);
    }
  };

  return (
    <div className="page-container animate-fade-in">
      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={isCreateProjectOpen}
        onClose={() => setIsCreateProjectOpen(false)}
        userProfile={userProfile}
        onProjectCreated={handleProjectCreated}
        setCurrentPage={setCurrentPage}
      />

      {/* Banner Hero */}
      <div className="projects-hero-banner">
        <div className="banner-content">
          <h1>Find Your Next Big <span className="highlight-text">Collaborative Project</span></h1>
          <p>
            Connect with talented peers, build your portfolio, and gain real-world experience through cross-disciplinary university projects.
          </p>
          <div className="banner-actions">
            <button className="btn-primary" onClick={() => setIsCreateProjectOpen(true)}>
              <Plus size={16} />
              <span>Post a Project</span>
            </button>
            <button className="btn-banner-glass" onClick={() => alert('UniCollab projects match based on course credits and skills.')}>
              How it works
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="projects-filter-bar mt-6">
        <div className="input-with-icon search-input-box">
          <Search size={16} />
          <input 
            type="text" 
            placeholder="Search by title, skills, or tech..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="filter-pill-group">
          <button className="icon-btn-filter" onClick={() => alert('Opening Filters Panel...')}>
            <SlidersHorizontal size={15} /> Filters
          </button>
          {categories.map((f) => (
            <button 
              key={f}
              className={`pill-btn ${selectedFilter === f ? 'active' : ''}`}
              onClick={() => setSelectedFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Available Projects Section Header */}
      <div className="projects-list-header mt-6">
        <div>
          <h2>Available Projects</h2>
          <p className="subtext">Showing {displayedProjects.length} matching opportunities</p>
        </div>

        <div className="sort-dropdown">
          <span>Sort by:</span>
          <select className="select-input">
            <option>Most Recent</option>
            <option>Highest Spots Left</option>
            <option>Least Time Commitment</option>
          </select>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="projects-grid mt-4">
        {displayedProjects.map((p) => (
          <div key={p.id} className="project-card" style={{ cursor: 'pointer' }} onClick={() => setSelectedProject(p)}>
            <div className="project-card-top">
              <div className="badge-tags">
                <span className="cat-badge">{p.category}</span>
                <span className="level-badge">{p.level}</span>
              </div>
              <button className="star-btn" onClick={(e) => e.stopPropagation()}><Star size={16} /></button>
            </div>

            <div className="project-card-placeholder-img">
              <div className="media-art-icon">🏞️</div>
            </div>

            <h3 className="project-title">{p.title}</h3>
            <p className="project-desc">{p.desc}</p>

            <div className="tag-pills">
              {p.tags.map((t, idx) => (
                <span key={idx} className="tag-pill">{t}</span>
              ))}
            </div>

            <div className="project-meta-row">
              <span><Clock size={13} /> {p.commitment}</span>
              <span><Users size={13} /> {p.spots}</span>
            </div>

            <div className="project-card-footer">
              <span className="lead-name">{p.lead}</span>
              <button 
                className="btn-join-project"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedProject(p);
                }}
              >
                View Details & Join
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Load More Centered Button */}
      <div className="load-more-container mt-8 mb-6">
        <button className="btn-load-more" onClick={handleLoadMore}>
          {visibleCount >= filteredProjects.length ? 'Show Less Projects' : 'Load More Projects >'}
        </button>
      </div>

      {/* Project Detail Modal */}
      <ProjectDetailModal 
        project={selectedProject}
        isOpen={!!selectedProject}
        onClose={() => setSelectedProject(null)}
        setCurrentPage={setCurrentPage}
        userProfile={userProfile}
      />

      {/* Create Project Modal */}
      <CreateProjectModal 
        isOpen={isCreateProjectOpen}
        onClose={() => setIsCreateProjectOpen(false)}
        userProfile={userProfile}
        onProjectCreated={handleProjectCreated}
        setCurrentPage={setCurrentPage}
      />
    </div>
  );
}
