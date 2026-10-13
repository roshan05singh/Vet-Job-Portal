import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const API_URL = String(import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

const emptyBusinessDetails = {
  businessName: '',
  contactName: '',
  contactEmail: '',
  phone: '',
  website: '',
  address: '',
  registrationNumber: '',
  description: '',
  specializations: '',
  facilities: '',
  teamInformation: '',
  logoData: '',
};

const listInput = (value) => Array.isArray(value) ? value.join(', ') : String(value || '');
const createBusinessForm = (details = {}) => ({
  ...emptyBusinessDetails,
  ...details,
  specializations: listInput(details.specializations),
  facilities: listInput(details.facilities),
});
const createCandidateForm = (user = {}) => ({
  phone: user.phone || '', location: user.location || '', qualifications: user.qualifications || '',
  professionalSummary: user.professionalSummary || '', specializations: listInput(user.specializations),
  experienceYears: user.experienceYears ?? '', skills: listInput(user.skills), certifications: listInput(user.certifications),
  employmentHistory: listInput(user.employmentHistory), preferredLocations: listInput(user.preferredLocations),
  preferredEmploymentTypes: listInput(user.preferredEmploymentTypes),
  salaryExpectationMin: user.salaryExpectationMin ?? '', salaryExpectationMax: user.salaryExpectationMax ?? '',
  salaryExpectationCurrency: user.salaryExpectationCurrency || 'INR', availability: user.availability || '',
  profileVisibility: user.profileVisibility || 'employers', resumeName: user.resumeName || '', resumeData: user.resumeData || '',
});

const readUser = () => {
  try {
    return JSON.parse(localStorage.getItem('vetreliefUser') || 'null');
  } catch {
    return null;
  }
};

function ProfilePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(readUser);
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [businessDetails, setBusinessDetails] = useState(() => createBusinessForm(user?.businessDetails));
  const [avatarData, setAvatarData] = useState(user?.avatarData || '');
  const [candidateProfile, setCandidateProfile] = useState(() => createCandidateForm(user));
  const [currentPassword, setCurrentPassword] = useState('');
  const [resetEmail, setResetEmail] = useState(user?.email || '');
  const [resetToken, setResetToken] = useState('');
  const [resetRequested, setResetRequested] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteConfirmed, setDeleteConfirmed] = useState(false);
  const [notice, setNotice] = useState({ type: '', text: '' });

  useEffect(() => {
    if (!notice.text || notice.type === 'error') return undefined;
    const dismissTimer = window.setTimeout(() => setNotice({ type: '', text: '' }), 5000);
    return () => window.clearTimeout(dismissTimer);
  }, [notice]);

  useEffect(() => {
    const token = localStorage.getItem('vetreliefToken');
    if (!token || !user) return;
    fetch(`${API_URL}/api/profile`, { headers: { Authorization: `Bearer ${token}` } })
      .then((response) => response.ok ? response.json() : null)
      .then((data) => {
        if (!data?.user) return;
        setUser(data.user);
        setFullName(data.user.fullName || '');
        setBusinessDetails(createBusinessForm(data.user.businessDetails));
        setAvatarData(data.user.avatarData || '');
        setCandidateProfile(createCandidateForm(data.user));
        localStorage.setItem('vetreliefUser', JSON.stringify(data.user));
      })
      .catch(() => showNotice('error', 'Unable to load your profile from the server.'));
  }, []);

  const showNotice = (type, text) => setNotice({ type, text });

  const handleBusinessChange = (event) => {
    const { name, value } = event.target;
    setBusinessDetails((previous) => ({ ...previous, [name]: value }));
  };

  const handleAvatarSelect = (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 1024 * 1024) {
      showNotice('error', 'Choose a PNG, JPEG, or WebP image under 1 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => setAvatarData(String(reader.result || ''));
    reader.onerror = () => showNotice('error', 'Unable to read that image file.');
    reader.readAsDataURL(file);
  };

  const handleClinicLogoSelect = (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 1024 * 1024) {
      showNotice('error', 'Choose a PNG, JPEG, or WebP clinic logo under 1 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setBusinessDetails((previous) => ({ ...previous, logoData: String(reader.result || '') }));
    reader.onerror = () => showNotice('error', 'Unable to read that clinic logo.');
    reader.readAsDataURL(file);
  };

  const handleResumeSelect = (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (file.type !== 'application/pdf' || file.size > 2 * 1024 * 1024) {
      showNotice('error', 'Choose a PDF resume under 2 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => setCandidateProfile((previous) => ({
      ...previous,
      resumeName: file.name,
      resumeData: String(reader.result || ''),
    }));
    reader.onerror = () => showNotice('error', 'Unable to read that resume file.');
    reader.readAsDataURL(file);
  };

  const handleCandidateProfileChange = (event) => {
    const { name, value } = event.target;
    setCandidateProfile((previous) => ({ ...previous, [name]: value }));
  };

  const handleProfileSave = async (event) => {
    event.preventDefault();
    try {
      const response = await fetch(`${API_URL}/api/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('vetreliefToken') || ''}` },
        body: JSON.stringify({ currentPassword, fullName, businessDetails, avatarData, ...candidateProfile }),
      });
      const data = await response.json();
      if (!response.ok) {
        showNotice('error', data.message || 'Unable to update the profile.');
        return;
      }
      setUser(data.user);
      setFullName(data.user.fullName);
      setBusinessDetails(createBusinessForm(data.user.businessDetails));
      setAvatarData(data.user.avatarData || '');
      setCandidateProfile(createCandidateForm(data.user));
      localStorage.setItem('vetreliefUser', JSON.stringify(data.user));
      setCurrentPassword('');
      showNotice('success', data.message);
    } catch {
      showNotice('error', 'Unable to connect to the server.');
    }
  };

  const handleResetRequest = async (event) => {
    event.preventDefault();
    try {
      const response = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail || user?.email }),
      });
      const data = await response.json();
      if (!response.ok) {
        showNotice('error', data.message || 'Unable to request a password reset.');
        return;
      }
      setResetRequested(true);
      showNotice('success', data.message || 'If the account exists, a reset code has been sent.');
    } catch {
      showNotice('error', 'Unable to connect to the server.');
    }
  };

  const handlePasswordReset = async (event) => {
    event.preventDefault();
    try {
      const response = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail || user?.email, resetToken, newPassword }),
      });
      const data = await response.json();
      if (!response.ok) {
        showNotice('error', data.message || 'Unable to reset the password.');
        return;
      }
      setResetToken('');
      setNewPassword('');
      showNotice('success', data.message);
    } catch {
      showNotice('error', 'Unable to connect to the server.');
    }
  };

  const handleAccountDelete = async (event) => {
    event.preventDefault();
    if (!deleteConfirmed) {
      showNotice('error', 'Confirm account deletion before continuing.');
      return;
    }
    try {
      const response = await fetch(`${API_URL}/api/profile`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('vetreliefToken') || ''}` },
        body: JSON.stringify({ email: user.email, currentPassword: deletePassword }),
      });
      const data = await response.json();
      if (!response.ok) {
        showNotice('error', data.message || 'Unable to delete the account.');
        return;
      }
      localStorage.removeItem('vetreliefUser');
      localStorage.removeItem('vetreliefToken');
      setUser(null);
      navigate('/', { replace: true });
    } catch {
      showNotice('error', 'Unable to connect to the server.');
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem('vetreliefUser');
    localStorage.removeItem('vetreliefToken');
    setUser(null);
    navigate('/', { replace: true });
  };

  return (
    <div className="account-page">
      <header className="account-topbar">
        <Link className="brand-wrap account-brand" to="/">
          <span className="brand-mark">V</span>
          <span>
            <strong className="brand-name">VetRelief</strong>
            <small className="brand-subtitle">Account center</small>
          </span>
        </Link>
        <div className="account-top-actions">
          <Link className="btn btn-secondary" to="/">Back to jobs</Link>
          {user && <button className="btn btn-secondary" type="button" onClick={handleSignOut}>Sign out</button>}
        </div>
      </header>

      {!user ? (
        <main className="account-locked">
          <p className="eyebrow">Account center</p>
          <h1>Reset your password.</h1>
          <p>Request a one-time reset code to regain access to your account.</p>
          <form className="account-form recovery-form" id="recovery" onSubmit={handleResetRequest}>
            <label>Account email
              <input type="email" value={resetEmail} onChange={(event) => setResetEmail(event.target.value)} required />
            </label>
            <button className="btn btn-secondary" type="submit">Request reset code</button>
          </form>
          {resetRequested && (
            <form className="account-form recovery-form" onSubmit={handlePasswordReset}>
              <label>One-time reset code
                <input value={resetToken} onChange={(event) => setResetToken(event.target.value)} required autoComplete="one-time-code" />
              </label>
              <label>New password
                <input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} required minLength={8} autoComplete="new-password" />
              </label>
              <button className="btn btn-primary" type="submit">Set new password</button>
            </form>
          )}
          <Link className="text-link" to="/#about">Back to login</Link>
        </main>
      ) : (
        <main className="account-main">
          <div className="account-heading">
            <div>
              <p className="eyebrow">Your account</p>
              <h1>Profile &amp; security</h1>
              <p>Manage your public name, recruiter details, and account access.</p>
            </div>
            <div className="account-identity">
              {avatarData ? (
                <img className="avatar avatar-image" src={avatarData} alt={`${user.fullName} profile`} />
              ) : (
                <span className="avatar">
                  {(user.fullName || user.email).split(/[\s@.]+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase()}
                </span>
              )}
              <span><strong>{user.fullName}</strong><small>{user.role}</small></span>
            </div>
          </div>

          <div className="account-grid">
            <section className="account-panel">
              <div className="account-panel-heading">
                <span className="panel-index">01</span>
                <div><h2>Personal details</h2><p>Your display name is visible to other members.</p></div>
              </div>
              <form className="account-form" onSubmit={handleProfileSave}>
                <div className="avatar-settings">
                  {avatarData ? (
                    <img className="avatar avatar-image avatar-preview" src={avatarData} alt="Profile photo preview" />
                  ) : (
                    <span className="avatar avatar-preview" aria-hidden="true">
                      {(user.fullName || user.email).split(/[\s@.]+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase()}
                    </span>
                  )}
                  <div className="avatar-controls">
                    <label className="photo-upload">Choose profile photo
                      <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleAvatarSelect} />
                    </label>
                    {avatarData && (
                      <button className="btn btn-secondary small" type="button" onClick={() => setAvatarData('')}>Remove photo</button>
                    )}
                    <small>PNG, JPEG, or WebP. Maximum 1 MB.</small>
                  </div>
                </div>
                <label>Username / full name
                  <input value={fullName} onChange={(event) => setFullName(event.target.value)} required maxLength={100} />
                </label>
                <label>Email address
                  <input value={user.email} readOnly />
                </label>
                <label>Phone number
                  <input name="phone" type="tel" value={candidateProfile.phone} onChange={handleCandidateProfileChange} />
                </label>
                <label>Location
                  <input name="location" value={candidateProfile.location} onChange={handleCandidateProfileChange} />
                </label>
                <label>Qualifications / specialties
                  <textarea name="qualifications" value={candidateProfile.qualifications} onChange={handleCandidateProfileChange} rows="3" />
                </label>
                {user.role !== 'Clinic Owner' && <>
                  <label>Professional summary
                    <textarea name="professionalSummary" value={candidateProfile.professionalSummary} onChange={handleCandidateProfileChange} rows="4" maxLength={3000} />
                  </label>
                  <label>Specializations (comma separated)
                    <input name="specializations" value={candidateProfile.specializations} onChange={handleCandidateProfileChange} />
                  </label>
                  <label>Years of experience
                    <input name="experienceYears" type="number" min="0" max="70" step="1" value={candidateProfile.experienceYears} onChange={handleCandidateProfileChange} />
                  </label>
                  <label>Skills (comma separated)
                    <input name="skills" value={candidateProfile.skills} onChange={handleCandidateProfileChange} />
                  </label>
                  <label>Certifications (comma separated)
                    <input name="certifications" value={candidateProfile.certifications} onChange={handleCandidateProfileChange} />
                  </label>
                  <label>Employment history (one role per line)
                    <textarea name="employmentHistory" value={candidateProfile.employmentHistory} onChange={handleCandidateProfileChange} rows="4" />
                  </label>
                  <label>Preferred locations (comma separated)
                    <input name="preferredLocations" value={candidateProfile.preferredLocations} onChange={handleCandidateProfileChange} />
                  </label>
                  <label>Preferred employment types (comma separated)
                    <input name="preferredEmploymentTypes" value={candidateProfile.preferredEmploymentTypes} onChange={handleCandidateProfileChange} placeholder="Full Time, Locum" />
                  </label>
                  <label>Minimum salary expectation
                    <input name="salaryExpectationMin" type="number" min="0" value={candidateProfile.salaryExpectationMin} onChange={handleCandidateProfileChange} />
                  </label>
                  <label>Maximum salary expectation
                    <input name="salaryExpectationMax" type="number" min="0" value={candidateProfile.salaryExpectationMax} onChange={handleCandidateProfileChange} />
                  </label>
                  <label>Salary currency
                    <select name="salaryExpectationCurrency" value={candidateProfile.salaryExpectationCurrency} onChange={handleCandidateProfileChange}><option>INR</option><option>USD</option><option>GBP</option><option>EUR</option></select>
                  </label>
                  <label>Availability
                    <input name="availability" value={candidateProfile.availability} onChange={handleCandidateProfileChange} placeholder="For example, available from June" />
                  </label>
                  <label>Profile visibility
                    <select name="profileVisibility" value={candidateProfile.profileVisibility} onChange={handleCandidateProfileChange}><option value="employers">Share with clinics you apply to</option><option value="private">Hide extended profile details</option></select>
                    <small>Submitting an application still shares the contact details and qualifications on that application.</small>
                  </label>
                </>}
                <div className="resume-settings">
                  <div>
                    <strong>Resume</strong>
                    <p>{candidateProfile.resumeName || 'No resume uploaded yet.'}</p>
                  </div>
                  <label className="photo-upload">{candidateProfile.resumeData ? 'Replace resume' : 'Upload PDF resume'}
                    <input type="file" accept="application/pdf,.pdf" onChange={handleResumeSelect} />
                  </label>
                  {candidateProfile.resumeData && (
                    <button className="btn btn-secondary small" type="button" onClick={() => setCandidateProfile((previous) => ({ ...previous, resumeName: '', resumeData: '' }))}>Remove resume</button>
                  )}
                  <small>PDF only. Maximum 2 MB.</small>
                </div>
                <label>Current password to confirm changes
                  <input type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} required autoComplete="current-password" />
                </label>

                {user.role === 'Clinic Owner' && (
                  <fieldset className="account-business-fields">
                    <legend>Recruiter business details</legend>
                    <label>Registered business name
                      <input name="businessName" value={businessDetails.businessName} onChange={handleBusinessChange} />
                    </label>
                    <label>Business contact name
                      <input name="contactName" value={businessDetails.contactName} onChange={handleBusinessChange} />
                    </label>
                    <label>Business email
                      <input name="contactEmail" type="email" value={businessDetails.contactEmail} onChange={handleBusinessChange} />
                    </label>
                    <label>Business phone
                      <input name="phone" type="tel" value={businessDetails.phone} onChange={handleBusinessChange} />
                    </label>
                    <label>Website
                      <input name="website" type="url" value={businessDetails.website} onChange={handleBusinessChange} />
                    </label>
                    <label>Registration / license number
                      <input name="registrationNumber" value={businessDetails.registrationNumber} onChange={handleBusinessChange} />
                    </label>
                    <label>Clinic description
                      <textarea name="description" value={businessDetails.description} onChange={handleBusinessChange} rows="3" maxLength={2000} />
                    </label>
                    <label>Clinic specializations (comma separated)
                      <input name="specializations" value={businessDetails.specializations} onChange={handleBusinessChange} />
                    </label>
                    <label>Facilities (comma separated)
                      <input name="facilities" value={businessDetails.facilities} onChange={handleBusinessChange} />
                    </label>
                    <label>Team information
                      <textarea name="teamInformation" value={businessDetails.teamInformation} onChange={handleBusinessChange} rows="3" maxLength={2000} />
                    </label>
                    <label className="clinic-logo-control">Clinic logo
                      <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleClinicLogoSelect} />
                    </label>
                    {businessDetails.logoData && <button className="btn btn-secondary small" type="button" onClick={() => setBusinessDetails((previous) => ({ ...previous, logoData: '' }))}>Remove clinic logo</button>}
                    <label className="wide-field">Business address
                      <textarea name="address" value={businessDetails.address} onChange={handleBusinessChange} rows="3" />
                    </label>
                  </fieldset>
                )}

                <button className="btn btn-primary" type="submit">Save profile</button>
              </form>
            </section>

            <div className="account-side-stack">
              <section className="account-panel">
                <div className="account-panel-heading">
                  <span className="panel-index">02</span>
                  <div><h2>Forgot password?</h2><p>Request a one-time code by email to set a new password.</p></div>
                </div>
                <form className="account-form" onSubmit={handleResetRequest}>
                  <label>Account email
                    <input value={resetEmail} onChange={(event) => setResetEmail(event.target.value)} readOnly />
                  </label>
                  <button className="btn btn-secondary" type="submit">Request reset code</button>
                </form>
                <form className="account-form reset-form" onSubmit={handlePasswordReset}>
                  <label>One-time reset code
                    <input value={resetToken} onChange={(event) => setResetToken(event.target.value)} required autoComplete="one-time-code" />
                  </label>
                  <label>New password
                    <input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} required minLength={8} autoComplete="new-password" />
                  </label>
                  <button className="btn btn-primary" type="submit">Set new password</button>
                </form>
                <p className="account-hint">The code is sent to your account email and expires after 15 minutes. Email delivery must be configured by the platform administrator.</p>
              </section>

              <section className="account-panel danger-panel">
                <div className="account-panel-heading">
                  <span className="panel-index">03</span>
                  <div><h2>Delete account</h2><p>This permanently removes your account and associated records.</p></div>
                </div>
                <form className="account-form" onSubmit={handleAccountDelete}>
                  <label>Confirm with your password
                    <input type="password" value={deletePassword} onChange={(event) => setDeletePassword(event.target.value)} required autoComplete="current-password" />
                  </label>
                  <label className="confirm-delete">
                    <input type="checkbox" checked={deleteConfirmed} onChange={(event) => setDeleteConfirmed(event.target.checked)} />
                    I understand this cannot be undone.
                  </label>
                  <button className="btn btn-danger" type="submit">Delete my account</button>
                </form>
              </section>
            </div>
          </div>
        </main>
      )}

      {notice.text && (
        <div className={`toast ${notice.type === 'error' ? 'toast-error' : 'toast-success'}`} role={notice.type === 'error' ? 'alert' : 'status'} aria-live={notice.type === 'error' ? 'assertive' : 'polite'}>
          <span className="toast-icon" aria-hidden="true">{notice.type === 'error' ? '!' : '\u2713'}</span>
          <div className="toast-copy"><strong>{notice.type === 'error' ? 'Action needed' : 'You\u2019re all set'}</strong><p>{notice.text}</p></div>
          <button className="toast-close" type="button" aria-label="Dismiss notification" onClick={() => setNotice({ type: '', text: '' })}>&times;</button>
        </div>
      )}
    </div>
  );
}

export default ProfilePage;
