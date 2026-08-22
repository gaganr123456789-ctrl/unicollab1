import React, { useState } from 'react';
import { 
  Search, 
  Upload, 
  Clock, 
  Star, 
  FileText, 
  BookOpen, 
  Video, 
  Layers, 
  Award,
  Download
} from 'lucide-react';

export default function ResourceLibraryPage() {
  const [activeTab, setActiveTab] = useState('All Files');
  const [searchQuery, setSearchQuery] = useState('');

  const resources = [
    {
      id: 1,
      title: 'Advanced Algorithms & Data',
      category: 'COMPUTER SCIENCE',
      rating: 4.8,
      author: 'Dr. Ananya Sharma',
      date: 'Oct 12, 2026',
      tags: ['#Algorithms', '#CS201', '#ExamPrep']
    },
    {
      id: 2,
      title: 'Full-Stack Web Development',
      category: 'SOFTWARE ENGINEERING',
      rating: 4.9,
      author: 'Dr. Vikramaditya Kulkarni',
      date: 'Nov 05, 2026',
      tags: ['#React', '#Node.js', '#VideoTutorial']
    },
    {
      id: 3,
      title: 'Machine Learning Research',
      category: 'ARTIFICIAL INTELLIGENCE',
      rating: 4.7,
      author: 'AI Research Group',
      date: 'Dec 01, 2026',
      tags: ['#DeepLearning', '#Research', '#Python']
    },
    {
      id: 4,
      title: 'Statistical Models for Economics',
      category: 'ECONOMICS',
      rating: 4.5,
      author: 'Prof. Robert Chen',
      date: 'Sep 28, 2026',
      tags: ['#Statistics', '#Econ203', '#Formulas']
    },
    {
      id: 5,
      title: 'UX Design Case Study',
      category: 'DESIGN',
      rating: 4.8,
      author: 'Emily Rodriguez',
      date: 'Oct 20, 2026',
      tags: ['#UIUX', '#Portfolio', '#Templates']
    },
    {
      id: 6,
      title: 'Cloud Architecture Principles',
      category: 'INFORMATION TECH',
      rating: 4.6,
      author: 'AWS Academic',
      date: 'Nov 18, 2026',
      tags: ['#Cloud', '#DevOps', '#Architecture']
    }
  ];

  return (
    <div className="page-container animate-fade-in">
      <div className="resource-header-bar">
        <div>
          <h2>Resource Library</h2>
          <p className="subtext">Access thousands of shared academic resources, research papers, and tutorials.</p>
        </div>

        <div className="resource-actions">
          <button className="btn-secondary" onClick={() => alert('Viewing Recently Downloaded Resources')}>
            <Clock size={16} /> Recently Viewed
          </button>
          <button className="btn-primary" onClick={() => alert('Opening Resource Upload Form')}>
            <Upload size={16} /> Upload Resource
          </button>
        </div>
      </div>

      <div className="resource-layout mt-6">
        {/* Main Content */}
        <main className="resource-main">
          {/* Search & Tabs */}
          <div className="resource-search-row">
            <div className="input-with-icon search-grow">
              <Search size={16} />
              <input 
                type="text" 
                placeholder="Search resources by title, tag, or author..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="tab-pill-group">
              {['All Files', 'Recent', 'Starred'].map((tab) => (
                <button 
                  key={tab} 
                  className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Recommended Section */}
          <div className="section-title-row mt-6">
            <h3>Recommended for You</h3>
            <button className="text-link-blue" onClick={() => alert('Viewing all recommendations')}>See all &gt;</button>
          </div>

          {/* 6 Grid Cards */}
          <div className="resource-grid mt-4">
            {resources.map((r) => (
              <div key={r.id} className="resource-card">
                <div className="res-card-img-placeholder">
                  <BookOpen size={28} />
                </div>

                <div className="res-card-top">
                  <span className="res-cat">{r.category}</span>
                  <span className="res-rating"><Star size={12} fill="#F59E0B" color="#F59E0B" /> {r.rating}</span>
                </div>

                <h4 className="res-title">{r.title}</h4>
                <p className="res-author">{r.author} • {r.date}</p>

                <div className="res-tags">
                  {r.tags.map((t, idx) => (
                    <span key={idx} className="res-tag">{t}</span>
                  ))}
                </div>

                <button 
                  className="btn-download-res mt-4"
                  onClick={() => alert(`Downloading ${r.title}...`)}
                >
                  <Download size={14} /> Download Resource
                </button>
              </div>
            ))}
          </div>

          {/* Premium Syllabus Banner */}
          <div className="premium-syllabus-banner mt-6">
            <div className="premium-banner-content">
              <span className="premium-badge">UniCollab Premium</span>
              <h3>Unlock Full Course Syllabi</h3>
              <p>Get exclusive access to verified university course syllabi, past exams, and AI-generated study summaries for over 500+ global courses.</p>
              <button className="btn-upgrade-now mt-4" onClick={() => alert('Redirecting to UniCollab Premium upgrade page...')}>
                Upgrade Now
              </button>
            </div>
          </div>
        </main>

        {/* Right Sidebar: Categories & Top Subjects */}
        <aside className="resource-sidebar">
          <div className="sidebar-box">
            <h4>Browse Categories</h4>
            <div className="category-list mt-3">
              <div className="cat-row active">
                <span><FileText size={15} /> Research Papers</span>
                <span className="cat-count">2.4k</span>
              </div>
              <div className="cat-row">
                <span><BookOpen size={15} /> Course Notes</span>
                <span className="cat-count">1.1k</span>
              </div>
              <div className="cat-row">
                <span><Video size={15} /> Video Lectures</span>
                <span className="cat-count">450</span>
              </div>
              <div className="cat-row">
                <span><Layers size={15} /> Project Assets</span>
                <span className="cat-count">890</span>
              </div>
              <div className="cat-row">
                <span><Award size={15} /> Past Exams</span>
                <span className="cat-count">120</span>
              </div>
            </div>
          </div>

          <div className="sidebar-box mt-6">
            <h4>Top Subjects</h4>
            <div className="subject-tags-grid mt-3">
              {['Computer Science', 'Business', 'Biology', 'Engineering', 'History', 'Math', 'Physics', 'Psychology'].map((subj, idx, arr) => (
                <button key={subj} className="subject-tag-pill" onClick={() => setSearchQuery(subj)}>
                  {subj}{idx < arr.length - 1 ? ',' : ''}
                </button>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
