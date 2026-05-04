import { useState, useRef } from 'react';
import { Video, X, CheckCircle, UploadCloud, Play, Pause } from 'lucide-react';

export default function GiftVideoManager({ onVideoUpload, onRemove }) {
  const [isGift, setIsGift] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const [preview, setPreview] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check size/duration (simplified)
    if (file.size > 20 * 1024 * 1024) {
      alert('Video too large. Please keep it under 20MB.');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'ml_default'); // Try 'ml_default' or your own unsigned preset

    try {
      // Direct upload to Cloudinary (for simplicity in this demo)
      // Note: In production, you'd usually use a secure signed upload or a backend proxy
      const res = await fetch(`https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/video/upload`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.secure_url) {
        setVideoUrl(data.secure_url);
        onVideoUpload(data.secure_url);
        setPreview(data.secure_url);
      } else {
        alert('Cloudinary Error: ' + (data.error?.message || 'Unknown error. Check console.'));
      }
    } catch (err) {
      console.error('Upload failed', err);
      const errorMsg = err.message || 'Check your Cloudinary Cloud Name and Upload Preset.';
      alert('Upload failed: ' + errorMsg);
    } finally {
      setUploading(false);
    }
  };

  const handleToggle = () => {
    const next = !isGift;
    setIsGift(next);
    if (!next) {
      setVideoUrl('');
      setPreview(null);
      onRemove();
    }
  };

  return (
    <div style={{ 
      marginTop: '20px', 
      padding: '16px', 
      background: '#fff', 
      borderRadius: '12px', 
      border: isGift ? '2px solid #b8860b' : '1px solid #e2e8f0',
      transition: 'all 0.3s ease'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ 
            width: '36px', height: '36px', borderRadius: '50%', 
            background: isGift ? '#fdfcf0' : '#f1f5f9',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: isGift ? '#b8860b' : '#64748b'
          }}>
            <Video size={18} />
          </div>
          <div>
            <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#1e293b' }}>Add a Video Message</h4>
            <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>Make it a special gift for free</p>
          </div>
        </div>
        
        <div 
          onClick={handleToggle}
          style={{ 
            width: '40px', height: '22px', borderRadius: '20px', 
            background: isGift ? '#16a34a' : '#cbd5e1',
            position: 'relative', cursor: 'pointer', transition: '0.3s'
          }}
        >
          <div style={{ 
            width: '16px', height: '16px', borderRadius: '50%', background: '#fff',
            position: 'absolute', top: '3px', left: isGift ? '21px' : '3px',
            transition: '0.3s', boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }} />
        </div>
      </div>

      {isGift && (
        <div style={{ marginTop: '15px', borderTop: '1px dashed #e2e8f0', paddingTop: '15px' }}>
          {videoUrl ? (
            <div style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', background: '#000' }}>
              <video src={videoUrl} style={{ width: '100%', display: 'block' }} controls />
              <button 
                onClick={() => { setVideoUrl(''); setPreview(null); onRemove(); }}
                style={{ 
                  position: 'absolute', top: '10px', right: '10px', 
                  background: 'rgba(255,255,255,0.9)', border: 'none', 
                  borderRadius: '50%', width: '28px', height: '28px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: '#ef4444'
                }}
              >
                <X size={16} />
              </button>
              <div style={{ 
                position: 'absolute', bottom: '10px', left: '10px', 
                background: 'rgba(22,163,74,0.9)', color: '#fff', 
                padding: '4px 10px', borderRadius: '20px', fontSize: '10px', 
                fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' 
              }}>
                <CheckCircle size={12} /> Video Attached
              </div>
            </div>
          ) : (
            <div 
              onClick={() => !uploading && fileInputRef.current?.click()}
              style={{ 
                border: '2px dashed #cbd5e1', borderRadius: '12px', 
                padding: '24px', textAlign: 'center', cursor: uploading ? 'default' : 'pointer',
                background: '#f8fafc', transition: 'all 0.2s'
              }}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                accept="video/*" 
                style={{ display: 'none' }} 
                onChange={handleFileChange}
              />
              {uploading ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                  <div className="os-spinner-container" style={{ width: '30px', height: '30px' }}>
                    <div className="os-main-spinner" style={{ borderWidth: '3px' }}></div>
                  </div>
                  <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>Uploading your message...</p>
                </div>
              ) : (
                <>
                  <UploadCloud size={32} style={{ color: '#b8860b', marginBottom: '10px' }} />
                  <p style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: 700, color: '#1e293b' }}>Record or Upload Video</p>
                  <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>Max 30 seconds · MP4, MOV</p>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
