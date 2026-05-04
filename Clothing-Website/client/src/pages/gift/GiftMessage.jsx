import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import '../../styles/globals.css';

export default function GiftMessage() {
  const { hash } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchGift() {
      try {
        const res = await fetch(`/api/payment/gift/${hash}`);
        const json = await res.json();
        if (json.success) {
          setData(json.data);
        } else {
          setError(json.error || 'Gift not found');
        }
      } catch (err) {
        setError('Failed to load message');
      } finally {
        setLoading(false);
      }
    }
    fetchGift();
  }, [hash]);

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', justifyContent: 'center', alignItems: 'center', 
        height: '100vh', background: '#fdfcf0', color: '#b8860b' 
      }}>
        <div className="animate-pulse" style={{ fontSize: '1.2rem', fontWeight: 600 }}>
          Opening your special surprise...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        display: 'flex', justifyContent: 'center', alignItems: 'center', 
        height: '100vh', background: '#fff', color: '#ef4444' 
      }}>
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <h2 style={{ marginBottom: '10px' }}>Oops!</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #fdfcf0 0%, #fff 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '40px 20px',
      fontFamily: "'Inter', sans-serif"
    }}>
      <div style={{ 
        maxWidth: '500px', 
        width: '100%', 
        background: '#fff', 
        borderRadius: '24px', 
        padding: '30px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.05)',
        textAlign: 'center',
        border: '1px solid #f1f5f9'
      }}>
        <div style={{ fontSize: '40px', marginBottom: '10px' }}>🎁</div>
        <h1 style={{ 
          fontSize: '24px', 
          fontWeight: 800, 
          color: '#1e293b',
          marginBottom: '5px' 
        }}>A Special Message for You!</h1>
        <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '30px' }}>
          From {data.userName}
        </p>

        <div style={{ 
          width: '100%', 
          borderRadius: '16px', 
          overflow: 'hidden', 
          background: '#000',
          aspectRatio: '9/16', // Typical portrait video
          boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
          marginBottom: '30px'
        }}>
          {data.giftVideoUrl ? (
            <video 
              src={data.giftVideoUrl} 
              controls 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              autoPlay
            />
          ) : (
            <div style={{ 
              height: '100%', display: 'flex', alignItems: 'center', 
              justifyContent: 'center', color: '#fff' 
            }}>
              No video message attached
            </div>
          )}
        </div>

        <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '20px' }}>
          <p style={{ color: '#94a3b8', fontSize: '12px' }}>
            Sent on {new Date(data.createdAt).toLocaleDateString('en-IN', {
              day: 'numeric', month: 'long', year: 'numeric'
            })}
          </p>
          <img 
            src="/logo.png" 
            alt="Sumathi Trends" 
            style={{ height: '24px', marginTop: '15px', opacity: 0.6 }} 
          />
        </div>
      </div>

      <footer style={{ marginTop: '40px', textAlign: 'center' }}>
        <a 
          href="/" 
          style={{ 
            color: '#b8860b', 
            textDecoration: 'none', 
            fontSize: '14px', 
            fontWeight: 600,
            borderBottom: '1.5px solid #b8860b'
          }}
        >
          Visit Sumathi Trends
        </a>
      </footer>
    </div>
  );
}
