import React, { useState, useEffect } from 'react';
import { apiClient } from '../services/apiClient';
import { X, Trophy, Sparkles, CheckCircle2, Mail, Phone, Building2, IdCard, Users, FileText } from 'lucide-react';

export default function HackathonRegisterModal({ 
  isOpen, 
  onClose, 
  hackathonTitle = "Global Innovation Hackathon 2024",
  userProfile,
  onSuccess
}) {
  const [formData, setFormData] = useState({
    teamName: '',
    teamDetails: '',
    mobileNumber: '',
    email: '',
    collegeName: '',
    usn: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [registrationId, setRegistrationId] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Pre-fill user details if available
      setFormData(prev => ({
        ...prev,
        email: userProfile?.email || prev.email || 'alex.rivera@stanford.edu',
        mobileNumber: userProfile?.phone || prev.mobileNumber || '+91 98765 43210',
        collegeName: userProfile?.university || prev.collegeName || 'Stanford University',
        usn: prev.usn || '1SU21CS042'
      }));
      setIsSubmitted(false);
      setErrors({});
    }
  }, [isOpen, userProfile]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.teamName.trim()) newErrors.teamName = 'Team name is required';
    if (!formData.teamDetails.trim()) newErrors.teamDetails = 'Team details are required';
    if (!formData.mobileNumber.trim()) newErrors.mobileNumber = 'Mobile number is required';
    if (!formData.email.trim()) newErrors.email = 'Email address is required';
    if (!formData.collegeName.trim()) newErrors.collegeName = 'College name is required';
    if (!formData.usn.trim()) newErrors.usn = 'USN / Student ID is required';
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    const res = await apiClient.register({
      hackathonId: 301,
      teamName: formData.teamName,
      membersCount: 4
    });
    setLoading(false);

    const regId = res.registrationId || ('HACK-' + Math.floor(100000 + Math.random() * 900000));
    setRegistrationId(regId);
    setIsSubmitted(true);

    if (onSuccess) {
      onSuccess({
        ...formData,
        registrationId: regId,
        hackathonTitle,
        timestamp: new Date().toISOString()
      });
    }
  };

  return (
    <div className="modal-backdrop animate-fade-in" onClick={onClose}>
      <div className="modal-content modal-lg" onClick={(e) => e.stopPropagation()}>
        
        {/* Modal Header */}
        <div className="modal-header-banner">
          <div className="modal-header-info">
            <div className="h-badge blue inline-flex align-center gap-1">
              <Trophy size={14} /> HACKATHON REGISTRATION
            </div>
            <h2 className="modal-title mt-1">{hackathonTitle}</h2>
            <p className="modal-sub">Complete your team credentials below to lock in your slot.</p>
          </div>
          <button className="btn-close-modal" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          {!isSubmitted ? (
            <form onSubmit={handleSubmit} className="registration-form">

              {/* Grid 2 Columns */}
              <div className="form-grid">
                
                {/* 1. Team Name */}
                <div className="form-group full-width">
                  <label className="form-label">
                    <Users size={15} className="text-blue" />
                    <span>Team Name <span className="text-danger">*</span></span>
                  </label>
                  <input
                    type="text"
                    name="teamName"
                    className={`form-input ${errors.teamName ? 'input-error' : ''}`}
                    placeholder="e.g. Code Morphicx"
                    value={formData.teamName}
                    onChange={handleChange}
                  />
                  {errors.teamName && <span className="error-msg">{errors.teamName}</span>}
                </div>

                {/* 2. Team Details */}
                <div className="form-group full-width">
                  <label className="form-label">
                    <FileText size={15} className="text-purple" />
                    <span>Team Details & Members <span className="text-danger">*</span></span>
                  </label>
                  <textarea
                    name="teamDetails"
                    rows={3}
                    className={`form-input textarea ${errors.teamDetails ? 'input-error' : ''}`}
                    placeholder="List member names, roles (e.g. Frontend, Backend, UI/UX), or project summary..."
                    value={formData.teamDetails}
                    onChange={handleChange}
                  />
                  {errors.teamDetails && <span className="error-msg">{errors.teamDetails}</span>}
                </div>

                {/* 3. Mobile Number */}
                <div className="form-group">
                  <label className="form-label">
                    <Phone size={15} className="text-green" />
                    <span>Mobile Number <span className="text-danger">*</span></span>
                  </label>
                  <input
                    type="tel"
                    name="mobileNumber"
                    className={`form-input ${errors.mobileNumber ? 'input-error' : ''}`}
                    placeholder="e.g. +91 98765 43210"
                    value={formData.mobileNumber}
                    onChange={handleChange}
                  />
                  {errors.mobileNumber && <span className="error-msg">{errors.mobileNumber}</span>}
                </div>

                {/* 4. Email */}
                <div className="form-group">
                  <label className="form-label">
                    <Mail size={15} className="text-orange" />
                    <span>Email Address <span className="text-danger">*</span></span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    className={`form-input ${errors.email ? 'input-error' : ''}`}
                    placeholder="e.g. lead@university.edu"
                    value={formData.email}
                    onChange={handleChange}
                  />
                  {errors.email && <span className="error-msg">{errors.email}</span>}
                </div>

                {/* 5. College Name */}
                <div className="form-group">
                  <label className="form-label">
                    <Building2 size={15} className="text-cyan" />
                    <span>College Name <span className="text-danger">*</span></span>
                  </label>
                  <input
                    type="text"
                    name="collegeName"
                    className={`form-input ${errors.collegeName ? 'input-error' : ''}`}
                    placeholder="e.g. Stanford University / RVCE"
                    value={formData.collegeName}
                    onChange={handleChange}
                  />
                  {errors.collegeName && <span className="error-msg">{errors.collegeName}</span>}
                </div>

                {/* 6. USN */}
                <div className="form-group">
                  <label className="form-label">
                    <IdCard size={15} className="text-indigo" />
                    <span>USN (University Seat Number) <span className="text-danger">*</span></span>
                  </label>
                  <input
                    type="text"
                    name="usn"
                    className={`form-input ${errors.usn ? 'input-error' : ''}`}
                    placeholder="e.g. 1RV21CS042"
                    value={formData.usn}
                    onChange={handleChange}
                  />
                  {errors.usn && <span className="error-msg">{errors.usn}</span>}
                </div>

              </div>

              {/* Form Actions */}
              <div className="modal-footer mt-6">
                <button type="button" className="btn-secondary" onClick={onClose}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary flex align-center gap-2">
                  <Sparkles size={16} /> Submit Registration
                </button>
              </div>

            </form>
          ) : (
            /* Success State */
            <div className="registration-success-card animate-scale-up text-center py-6">
              <div className="success-icon-box">
                <CheckCircle2 size={54} className="text-emerald" />
              </div>
              <h3 className="text-2xl bold text-dark mt-3">Registration Successful! 🎉</h3>
              <p className="text-slate mt-1">
                Your team <strong>{formData.teamName}</strong> has been successfully registered for <strong>{hackathonTitle}</strong>.
              </p>

              <div className="ticket-summary-box mt-6">
                <div className="ticket-header-row">
                  <span className="ticket-label">REGISTRATION ID</span>
                  <span className="ticket-code">{registrationId}</span>
                </div>
                <div className="ticket-grid">
                  <div>
                    <span className="t-meta">Team Name:</span>
                    <strong className="t-val">{formData.teamName}</strong>
                  </div>
                  <div>
                    <span className="t-meta">College:</span>
                    <strong className="t-val">{formData.collegeName}</strong>
                  </div>
                  <div>
                    <span className="t-meta">USN:</span>
                    <strong className="t-val">{formData.usn}</strong>
                  </div>
                  <div>
                    <span className="t-meta">Mobile:</span>
                    <strong className="t-val">{formData.mobileNumber}</strong>
                  </div>
                  <div className="full">
                    <span className="t-meta">Registered Email:</span>
                    <strong className="t-val">{formData.email}</strong>
                  </div>
                  <div className="full">
                    <span className="t-meta">Team Details:</span>
                    <p className="t-val-desc">{formData.teamDetails}</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-center gap-3">
                <button className="btn-primary" onClick={onClose}>
                  Done & Return to Event
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
