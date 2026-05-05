import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/sidebar/Sidebar';
import { authFetch } from '../../utils/authFetch';
import '../../styles/personinformation/AccountHub.css';

export default function AccountHub() {
  const navigate = useNavigate();
  const [activeNav, setActiveNav]       = useState('account-settings');
  const [activeSubNav, setActiveSubNav] = useState('');
  const [dbUser, setDbUser] = useState(null);

  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }); }, []);

  // ── Desktop redirect: keep old behaviour ──────────────────────────────
  // On desktop (>768px) go straight to /account/profile just like before.
  // On mobile stay here and show the centered hub menu.
  useEffect(() => {
    if (window.innerWidth > 768) {
      navigate('/account/profile', { replace: true });
    }
  }, [navigate]);
  // ─────────────────────────────────────────────────────────────────────

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('clientToken');
      const userJson = localStorage.getItem('clientUser');

      if (!token || !userJson) {
        navigate('/login');
        return;
      }

      try {
        const user = JSON.parse(userJson);
        const identifier = user.customerId || user._id || user.uid;
        const res = await authFetch(`/api/client-auth/profile/${identifier}`);
        const data = await res.json();
        if (data.success) {
          setDbUser(data.user);
        } else {
          localStorage.removeItem('clientToken');
          localStorage.removeItem('clientUser');
          navigate('/login');
        }
      } catch (err) {
        console.error('AccountHub: failed to load user', err);
        navigate('/login');
      }
    };

    fetchUser();
  }, [navigate]);

  return (
    <div className="hub-page">
      <div className="hub-container">
        <Sidebar
          activeNav={activeNav}
          setActiveNav={setActiveNav}
          activeSubNav={activeSubNav}
          setActiveSubNav={setActiveSubNav}
          user={dbUser}
        />
      </div>
    </div>
  );
}

