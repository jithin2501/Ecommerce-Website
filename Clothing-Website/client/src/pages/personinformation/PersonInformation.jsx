import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/sidebar/Sidebar';
import '../../styles/personinformation/PersonInformation.css';
import { authFetch } from '../../utils/authFetch';

export default function PersonInformation() {
  const navigate = useNavigate();
  const sidebarRef = useRef(null);
  const [mainHeight, setMainHeight] = useState(null);

  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }); }, []);

  const [activeNav, setActiveNav] = useState('account-settings');
  const [activeSubNav, setActiveSubNav] = useState('profile');

  const [loadingProfile, setLoadingProfile] = useState(true);
  const [dbUser, setDbUser] = useState(null);

  // Personal Info
  const [editingPersonal, setEditingPersonal] = useState(false);
  const [gender, setGender] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [tempPersonal, setTempPersonal] = useState({});
  const [savingPersonal, setSavingPersonal] = useState(false);

  // Email
  const [editingEmail, setEditingEmail] = useState(false);
  const [email, setEmail] = useState('');
  const [tempEmail, setTempEmail] = useState('');
  const [savingEmail, setSavingEmail] = useState(false);

  // Mobile
  const [editingMobile, setEditingMobile] = useState(false);
  const [mobile, setMobile] = useState('');
  const [tempMobile, setTempMobile] = useState('');
  const [savingMobile, setSavingMobile] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem('clientToken');
      const userJson = localStorage.getItem('clientUser');
      
      if (!token || !userJson) {
        navigate('/login');
        return;
      }

      try {
        const user = JSON.parse(userJson);
        const res = await authFetch(`/api/client-auth/profile/${user.customerId}`);
        const data = await res.json();
        
        if (data.success) {
          setDbUser(data.user);
          const nameParts = (data.user.name || '').split(' ');
          setFirstName(nameParts[0] || '');
          setLastName(nameParts.slice(1).join(' ') || '');
          setGender(data.user.gender || '');
          setEmail(data.user.email || '');
          let ph = (data.user.phone || '').replace('+91', '');
          setMobile(ph);
        } else {
          // Token might be expired
          localStorage.removeItem('clientToken');
          localStorage.removeItem('clientUser');
          navigate('/login');
        }
      } catch (err) {
        console.error("Failed to fetch profile", err);
        navigate('/login');
      } finally {
        setLoadingProfile(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  const updateProfileData = async (updates) => {
    const userJson = localStorage.getItem('clientUser');
    if (!userJson) return;
    const user = JSON.parse(userJson);

    try {
      const res = await authFetch(`/api/client-auth/profile/${user.customerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      const data = await res.json();
      if (data.success) {
        setDbUser(data.user);
        localStorage.setItem('clientUser', JSON.stringify(data.user));
      }
    } catch (err) {
      console.error("Update failed", err);
    }
  };

  const handleEditPersonal = () => {
    setTempPersonal({ firstName, lastName, gender });
    setEditingPersonal(true);
  };
  const handleCancelPersonal = () => {
    setFirstName(tempPersonal.firstName);
    setLastName(tempPersonal.lastName);
    setGender(tempPersonal.gender);
    setEditingPersonal(false);
  };
  const handleSavePersonal = async () => {
    setSavingPersonal(true);
    const fullName = `${firstName} ${lastName}`.trim();
    await updateProfileData({ name: fullName, gender });
    setSavingPersonal(false);
    setEditingPersonal(false);
  };

  const handleEditEmail = () => { setTempEmail(email); setEditingEmail(true); };
  const handleCancelEmail = () => { setEmail(tempEmail); setEditingEmail(false); };
  const handleSaveEmail = async () => {
    setSavingEmail(true);
    await updateProfileData({ email });
    setSavingEmail(false);
    setEditingEmail(false);
  };

  const handleEditMobile = () => { setTempMobile(mobile); setEditingMobile(true); };
  const handleCancelMobile = () => { setMobile(tempMobile); setEditingMobile(false); };
  const handleSaveMobile = async () => {
    setSavingMobile(true);
    if (mobile.length === 10 && mobile !== tempMobile) {
      await updateProfileData({ phone: `+91${mobile}` });
    } else if (mobile.length > 0 && mobile.length < 10) {
      alert("Please enter a valid 10-digit number");
      setSavingMobile(false);
      return;
    }
    setSavingMobile(false);
    setEditingMobile(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('clientToken');
    localStorage.removeItem('clientUser');
    navigate('/login');
  };

  const handleDeleteAccount = async () => {
    if (window.confirm("Are you SURE you want to permanently delete your account? This action cannot be undone.")) {
      const userJson = localStorage.getItem('clientUser');
      if (!userJson) return;
      const user = JSON.parse(userJson);

      try {
        await authFetch(`/api/client-auth/delete/${user.customerId}`, { method: 'DELETE' });
        handleLogout();
      } catch (err) {
        console.error("Delete failed", err);
      }
    }
  };

  // Match main panel height to sidebar — desktop only
  useEffect(() => {
    const el = sidebarRef.current;
    if (!el) return;
    const update = () => {
      if (window.innerWidth > 768) setMainHeight(el.offsetHeight);
      else setMainHeight(null);
    };
    const timer = setTimeout(update, 50);
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener('resize', update);
    return () => { clearTimeout(timer); ro.disconnect(); window.removeEventListener('resize', update); };
  }, [dbUser]);

  if (loadingProfile) {
    return (
      <div className="account-loading-wrapper">
        <div className="account-loading-spinner"></div>
        <p>Loading your Profile...</p>
      </div>
    );
  }

  return (
    <div className="pi-page">
      <div className="pi-container">
        <div ref={sidebarRef}>
          <Sidebar
            activeNav={activeNav}
            setActiveNav={setActiveNav}
            activeSubNav={activeSubNav}
            setActiveSubNav={setActiveSubNav}
            user={dbUser}
          />
        </div>

        <main className="main-content" style={mainHeight ? { height: mainHeight + 'px' } : {}}>
          <div className="pi-mobile-header">
            <button className="mobile-back-btn" onClick={() => navigate('/account')}>
            </button>
            <div className="content-header">
              <h1>Personal Information</h1>
              <p>Manage your personal information and <br className="mobile-br" />security settings</p>
            </div>
          </div>

          <div className="pi-scrollable">
            {/* Personal Info Card */}
            <div className="form-card">
              <div className="form-card-header">
                <div className="card-title">Name</div>
                {!editingPersonal
                  ? <span className="edit-btn" onClick={handleEditPersonal}>Edit</span>
                  : <span className="edit-cancel" onClick={handleCancelPersonal}>Cancel</span>
                }
              </div>

              <div className="form-grid">
                <div className="input-group">
                  <label>First Name</label>
                  <input
                    type="text"
                    value={firstName}
                    placeholder="e.g. Sumathi"
                    onChange={e => setFirstName(e.target.value.replace(/[^a-zA-Z\s]/g, ''))}
                    readOnly={!editingPersonal}
                    className={!editingPersonal ? 'input-readonly' : ''}
                  />
                </div>
                <div className="input-group">
                  <label>Last Name</label>
                  <input
                    type="text"
                    value={lastName}
                    placeholder="e.g. Raj"
                    onChange={e => setLastName(e.target.value.replace(/[^a-zA-Z\s]/g, ''))}
                    readOnly={!editingPersonal}
                    className={!editingPersonal ? 'input-readonly' : ''}
                  />
                </div>
              </div>

              <div className="gender-section">
                <label>Your Gender</label>
                <div className="radio-group">
                  <label className="radio-option">
                    <input type="radio" name="gender" value="male"
                      checked={gender === 'male'}
                      onChange={() => editingPersonal && setGender('male')}
                      disabled={!editingPersonal}
                    /> Male
                  </label>
                  <label className="radio-option">
                    <input type="radio" name="gender" value="female"
                      checked={gender === 'female'}
                      onChange={() => editingPersonal && setGender('female')}
                      disabled={!editingPersonal}
                    /> Female
                  </label>
                </div>
              </div>

              {editingPersonal && (
                <div className="save-btn-container">
                  <button className="btn-save" onClick={handleSavePersonal} disabled={savingPersonal}>
                    {savingPersonal ? 'SAVING...' : 'SAVE'}
                  </button>
                </div>
              )}
            </div>

            {/* Email Card */}
            <div className="form-card">
              <div className="form-card-header">
                <div className="card-title">Email Address</div>
                {!editingEmail
                  ? <span className="edit-btn" onClick={handleEditEmail}>Edit</span>
                  : <span className="edit-cancel" onClick={handleCancelEmail}>Cancel</span>
                }
              </div>
              <div className="form-grid">
                <div className="input-group" style={{ gridColumn: 'span 2' }}>
                  <input
                    type="email"
                    value={email}
                    placeholder="email@example.com"
                    onChange={e => setEmail(e.target.value)}
                    readOnly={!editingEmail}
                    className={!editingEmail ? 'input-readonly' : ''}
                  />
                </div>
              </div>
              {editingEmail && (
                <div className="save-btn-container">
                  <button className="btn-save" onClick={handleSaveEmail} disabled={savingEmail}>
                    {savingEmail ? 'SAVING...' : 'SAVE'}
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Card */}
            <div className="form-card">
              <div className="form-card-header">
                <div className="card-title">Mobile Number</div>
                {!editingMobile
                  ? <span className="edit-btn" onClick={handleEditMobile}>Edit</span>
                  : <span className="edit-cancel" onClick={handleCancelMobile}>Cancel</span>
                }
              </div>
              <div className="form-grid">
                <div className="input-group" style={{ gridColumn: 'span 2' }}>
                  <input
                    type="tel"
                    value={mobile}
                    placeholder="Enter 10-digit mobile number"
                    maxLength={10}
                    onChange={e => setMobile(e.target.value.replace(/[^0-9]/g, '').slice(0, 10))}
                    readOnly={!editingMobile}
                    className={!editingMobile ? 'input-readonly' : ''}
                  />
                </div>
              </div>
              {editingMobile && (
                <div className="save-btn-container">
                  <button className="btn-save" onClick={handleSaveMobile} disabled={savingMobile}>
                    {savingMobile ? 'SAVING...' : 'SAVE'}
                  </button>
                </div>
              )}
            </div>

            <div className="delete-account-wrapper">
              <span className="delete-account" onClick={handleDeleteAccount} style={{ cursor: 'pointer' }}>Delete Account</span>
            </div>
            
            <div style={{ marginTop: '20px', textAlign: 'center' }}>
              <button onClick={handleLogout} className="btn-save" style={{ backgroundColor: '#ff4444' }}>LOGOUT</button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}