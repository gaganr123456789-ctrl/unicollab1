import React, { useState, useEffect, useRef } from 'react';
import { apiClient } from '../services/apiClient';
import { 
  Search, 
  Users, 
  Folder, 
  Trophy, 
  GraduationCap, 
  ArrowRight, 
  Sparkles, 
  X, 
  Loader2, 
  Tag, 
  Clock, 
  MapPin, 
  Star,
  MessageSquare,
  CheckCircle2,
  Filter
} from 'lucide-react';

export default function SearchResultsPage({ 
  searchQuery, 
  setSearchQuery, 
  setCurrentPage, 
  onOpenChat, 
  userProfile 
}) {
  const [localQuery, setLocalQuery] = useState(searchQuery || '');
  const [activeTab, setActiveTab] = useState('all');
  const [results, setResults] = useState([]);
  const [grouped, setGrouped] = useState({ students: [], projects: [], hackathons: [], mentors: [] });
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const debounceTimerRef = useRef(null);

  // Sync with prop changes
  useEffect(() => {
    if (searchQuery !== undefined && searchQuery !== localQuery) {
      setLocalQuery(searchQuery);
    }
  }, [searchQuery]);

  // Fetch search results from backend
  const executeSearch = async (q) => {
    const trimmed = (q || '').trim();
    if (!trimmed) {
      setResults([]);
      setGrouped({ students: [], projects: [], hackathons: [], mentors: [] });
      setTotalCount(0);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.globalSearch(trimmed, 'all');
      if (data.success) {
        setResults(data.results || []);
        setGrouped(data.grouped || { students: [], projects: [], hackathons: [], mentors: [] });
        setTotalCount(data.total || 0);
      } else {
        setError(data.message || 'Error fetching search results.');
      }
    } catch (err) {
      console.error('Search error:', err);
      setError('Unable to reach server. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  // Debounced search on input change
  useEffect(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      executeSearch(localQuery);
      if (setSearchQuery) setSearchQuery(localQuery);
    }, 300);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [localQuery]);

  const handleClear = () => {
    setLocalQuery('');
    if (setSearchQuery) setSearchQuery('');
  };

  const handleNavigate = (targetPage) => {
    if (setCurrentPage && targetPage) {
      setCurrentPage(targetPage);
    }
  };

  const filteredItems = () => {
    if (activeTab === 'students') return grouped.students;
    if (activeTab === 'projects') return grouped.projects;
    if (activeTab === 'hackathons') return grouped.hackathons;
    if (activeTab === 'mentors') return grouped.mentors;
    return results;
  };

  const displayList = filteredItems();

  return (
    <div className="page-container animate-fade-in search-results-page-container">
      {/* Header & Search Input Box */}
      <div className="search-page-hero">
        <div className="search-page-header-content">
          <div className="search-page-badge">
            <Sparkles size={14} />
            <span>Centralized Database Search</span>
          </div>
          <h1>Explore UniCollab</h1>
          <p className="search-page-subtext">
            Search verified student teammates, collaborative projects, hackathons, and research mentors across campus.
          </p>

          <div className="search-page-input-wrapper">
            <Search size={20} className="search-page-icon" />
            <input 
              type="text"
              className="search-page-input"
              placeholder="Search by student name, skills (Python, React), project titles, hackathons..."
              value={localQuery}
              onChange={(e) => setLocalQuery(e.target.value)}
              autoFocus
            />
            {localQuery && (
              <button 
                type="button"
                className="search-page-clear-btn"
                onClick={handleClear}
                title="Clear search"
              >
                <X size={18} />
              </button>
            )}
            {loading && (
              <div className="search-page-spinner">
                <Loader2 size={18} className="spin-icon" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filter Tabs Bar */}
      <div className="search-tabs-bar mt-6">
        <div className="search-tabs-group">
          <button 
            className={`search-tab-pill ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            All Matches <span className="tab-count">({totalCount})</span>
          </button>
          <button 
            className={`search-tab-pill ${activeTab === 'students' ? 'active' : ''}`}
            onClick={() => setActiveTab('students')}
          >
            <Users size={15} /> Students & Teammates <span className="tab-count">({grouped.students.length})</span>
          </button>
          <button 
            className={`search-tab-pill ${activeTab === 'projects' ? 'active' : ''}`}
            onClick={() => setActiveTab('projects')}
          >
            <Folder size={15} /> Projects <span className="tab-count">({grouped.projects.length})</span>
          </button>
          <button 
            className={`search-tab-pill ${activeTab === 'hackathons' ? 'active' : ''}`}
            onClick={() => setActiveTab('hackathons')}
          >
            <Trophy size={15} /> Hackathons <span className="tab-count">({grouped.hackathons.length})</span>
          </button>
          <button 
            className={`search-tab-pill ${activeTab === 'mentors' ? 'active' : ''}`}
            onClick={() => setActiveTab('mentors')}
          >
            <GraduationCap size={15} /> Mentors <span className="tab-count">({grouped.mentors.length})</span>
          </button>
        </div>
      </div>

      {/* Query Status Bar */}
      <div className="search-status-bar mt-4">
        {localQuery.trim() ? (
          <span className="search-summary-text">
            Showing <strong>{displayList.length}</strong> {activeTab === 'all' ? 'results' : activeTab} for "<strong>{localQuery}</strong>"
          </span>
        ) : (
          <span className="search-summary-text text-muted">
            Type a query above to search students, skills, projects, and hackathons.
          </span>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="search-loading-state py-12 text-center">
          <Loader2 size={36} className="spin-icon mx-auto text-blue" />
          <p className="mt-3 text-sm text-muted">Searching centralized UniCollab records...</p>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="search-empty-card py-8 text-center mt-4">
          <p className="text-red font-semibold">{error}</p>
        </div>
      )}

      {/* Empty State when no query is typed */}
      {!loading && !error && !localQuery.trim() && (
        <div className="search-empty-card py-12 text-center mt-6">
          <div className="search-empty-icon mx-auto mb-3">🔍</div>
          <h3>What are you looking for?</h3>
          <p className="text-muted text-sm max-w-md mx-auto mt-1">
            Search for student teammates by branch (ECE, CSE, AIML), technical skills (React, Python, ROS 2), project names, or upcoming hackathons.
          </p>
          <div className="search-quick-tags mt-4 flex justify-center gap-2 flex-wrap">
            {['React', 'Python', 'Machine Learning', 'ROS 2', 'ECE', 'CSE', 'Hackathon', 'Drone'].map(tag => (
              <button 
                key={tag}
                className="pill-btn search-suggestion-chip"
                onClick={() => setLocalQuery(tag)}
              >
                + {tag}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* No Results Found State */}
      {!loading && !error && localQuery.trim() && displayList.length === 0 && (
        <div className="search-empty-card py-12 text-center mt-6">
          <div className="search-empty-icon mx-auto mb-3">🔎</div>
          <h3>No results found for "{localQuery}"</h3>
          <p className="text-muted text-sm max-w-md mx-auto mt-1">
            We couldn't find any matching profiles, skills, projects, or hackathons. Try checking your spelling or using broader search terms.
          </p>
          <div className="search-quick-tags mt-4 flex justify-center gap-2 flex-wrap">
            <button className="pill-btn" onClick={() => setLocalQuery('')}>Clear Search</button>
            {['Python', 'React', 'CSE', 'Gagan', 'Charanya', 'Renukesh'].map(tag => (
              <button 
                key={tag}
                className="pill-btn search-suggestion-chip"
                onClick={() => setLocalQuery(tag)}
              >
                Try "{tag}"
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Results Grid */}
      {!loading && displayList.length > 0 && (
        <div className="search-results-grid mt-6">
          {displayList.map((item, idx) => {
            const isStudent = item.entityType === 'student';
            const isProject = item.entityType === 'project';
            const isHackathon = item.entityType === 'hackathon';
            const isMentor = item.entityType === 'mentor';

            return (
              <div 
                key={`${item.entityType}_${item.id}_${idx}`} 
                className={`search-result-card ${item.entityType}-card`}
                onClick={() => handleNavigate(item.targetPage)}
              >
                <div className="search-card-top flex justify-between align-center">
                  <div className="search-card-type-badge">
                    {isStudent && <Users size={13} />}
                    {isProject && <Folder size={13} />}
                    {isHackathon && <Trophy size={13} />}
                    {isMentor && <GraduationCap size={13} />}
                    <span>{item.typeLabel}</span>
                  </div>

                  {isStudent && item.university && (
                    <span className="search-card-meta-text">{item.university}</span>
                  )}
                  {isProject && (
                    <span className="search-card-status-badge">
                      {item.status === 'Completed' ? '✓ Completed' : '● Active'}
                    </span>
                  )}
                  {isHackathon && item.dateDisplay && (
                    <span className="search-card-meta-text"><Clock size={12} /> {item.dateDisplay}</span>
                  )}
                  {isMentor && item.rating && (
                    <span className="search-card-rating"><Star size={12} className="text-amber" /> {item.rating}</span>
                  )}
                </div>

                <div className="search-card-body mt-3">
                  <div className="search-card-header-row flex gap-3 align-center">
                    {isStudent && (
                      <div 
                        className="search-avatar-circle"
                        style={{ background: item.avatarBg || '#2563EB', color: item.avatarColor || '#FFF' }}
                      >
                        {(item.title || 'ST').split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                    )}
                    <div>
                      <h3 className="search-card-title">{item.title}</h3>
                      <p className="search-card-subtitle">{item.subtitle}</p>
                    </div>
                  </div>

                  <p className="search-card-desc mt-2">
                    {item.description}
                  </p>

                  {/* Skills Tags */}
                  {Array.isArray(item.skills) && item.skills.length > 0 && (
                    <div className="search-card-tags mt-3 flex flex-wrap gap-1">
                      {item.skills.slice(0, 5).map((sk, sIdx) => (
                        <span key={sIdx} className="search-tag-chip">
                          {sk}
                        </span>
                      ))}
                      {item.skills.length > 5 && (
                        <span className="search-tag-chip extra">+{item.skills.length - 5}</span>
                      )}
                    </div>
                  )}
                </div>

                <div className="search-card-footer mt-4 flex justify-between align-center pt-3 border-top">
                  <span className="search-card-action-hint">
                    Click to view details
                  </span>

                  <div className="flex gap-2">
                    {isStudent && onOpenChat && (
                      <button 
                        className="btn-secondary-sm flex align-center gap-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenChat(item.raw);
                        }}
                      >
                        <MessageSquare size={13} />
                        <span>Chat</span>
                      </button>
                    )}
                    <button 
                      className="btn-primary-sm flex align-center gap-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleNavigate(item.targetPage);
                      }}
                    >
                      <span>View</span>
                      <ArrowRight size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
