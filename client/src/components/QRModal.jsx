import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Share2, QrCode, Copy, Check } from 'lucide-react';
import api from '../api/axios';

const QRModal = ({ username, onClose }) => {
  const [qrData, setQrData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchQR = async () => {
      try {
        const res = await api.get(`/public/qr/${username}`);
        setQrData(res.data.data);
      } catch (err) {
        console.error('Failed to load QR code');
      } finally {
        setLoading(false);
      }
    };
    fetchQR();
  }, [username]);

  const handleCopyLink = () => {
    if (qrData?.targetUrl) {
      navigator.clipboard.writeText(qrData.targetUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadPng = () => {
    if (!qrData?.fileUrl) return;
    const link = document.createElement('a');
    link.href = qrData.fileUrl;
    // Set target to _blank to open image directly since it's a cross-origin static file
    link.target = '_blank';
    link.download = `mavi-qr-${username}.png`;
    link.click();
  };

  const handleDownloadSvg = () => {
    if (!qrData?.svgUrl) return;
    const link = document.createElement('a');
    link.href = qrData.svgUrl;
    link.target = '_blank';
    link.download = `mavi-qr-${username}.svg`;
    link.click();
  };

  return (
    <AnimatePresence>
      <motion.div
        className="modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="modal-content"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          style={{ textAlign: 'center' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <QrCode size={20} className="text-gradient" /> Share Profile
            </h3>
            <button onClick={onClose} className="btn btn-ghost btn-sm" style={{ padding: '0.375rem' }}>
              <X size={20} />
            </button>
          </div>

          {loading ? (
            <div className="skeleton" style={{ width: '220px', height: '220px', margin: '0 auto' }} />
          ) : qrData?.dataUrl ? (
            <>
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', damping: 15 }}
                style={{ background: 'white', borderRadius: '16px', padding: '1rem', display: 'inline-block', marginBottom: '1.5rem' }}
              >
                <img src={qrData.dataUrl} alt="QR Code" style={{ width: '200px', height: '200px' }} />
              </motion.div>

              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                Scan to view <strong>@{username}</strong>'s developer identity
              </p>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', justifyContent: 'center' }}>
                <button onClick={handleDownloadPng} className="btn btn-primary btn-sm">
                  <Download size={16} /> PNG
                </button>
                {qrData.svgUrl && (
                  <button onClick={handleDownloadSvg} className="btn btn-outline btn-sm">
                    <Download size={16} /> SVG
                  </button>
                )}
                <button onClick={handleCopyLink} className="btn btn-outline btn-sm">
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                  {copied ? 'Copied!' : 'Copy Link'}
                </button>
              </div>
            </>
          ) : (
            <p style={{ color: 'var(--text-muted)' }}>Failed to generate QR code.</p>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default QRModal;
