import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import api from '../services/api';

export default function ScanAttendance() {
  const [status, setStatus] = useState('scanning'); // scanning | verifying | success | error
  const [message, setMessage] = useState('');
  const scannerRef = useRef(null);

  useEffect(() => {
    if (status !== 'scanning') return;

    const scanner = new Html5Qrcode('qr-reader');
    scannerRef.current = scanner;

    scanner
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: 250 },
        (decodedText) => handleScanSuccess(decodedText, scanner),
        () => {}
      )
      .catch(() => {
        setStatus('error');
        setMessage('Could not access camera. Check browser permissions.');
      });

    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, [status]);

  async function handleScanSuccess(qrCode, scanner) {
    qrCode = qrCode.trim();
    try {
      await scanner.stop();
    } catch {
      /* already stopped */
    }
    setStatus('verifying');

    if (!navigator.geolocation) {
      setStatus('error');
      setMessage('Geolocation is not supported by your browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await api.post('/attendance/mark', { qrCode, latitude, longitude });
          setStatus('success');
          setMessage(
            `Attendance marked for "${res.data.attendance.eventName}"! Distance: ${res.data.attendance.distance ?? '—'}m`
          );
        } catch (err) {
          setStatus('error');
          setMessage(err.response?.data?.error || 'Failed to mark attendance.');
        }
      },
      (err) => {
        setStatus('error');
        if (err.code === 1) {
          setMessage('Location permission denied. Enable location access and try again.');
        } else if (err.code === 2) {
          setMessage('Location unavailable. Your device could not determine its position (try on a phone with GPS).');
        } else {
          setMessage('Location request timed out. Try again.');
        }
      }
    );
  }

  function scanAgain() {
    setMessage('');
    setStatus('scanning');
  }

  return (
    <div className="scan-box">
      <h2 style={{ marginBottom: 20 }}>Scan Event QR Code</h2>

      {status === 'scanning' && <div id="qr-reader" style={{ width: '100%' }} />}

      {status === 'verifying' && <p className="card-meta">Verifying your location...</p>}

      {status === 'success' && (
        <div className="scan-result success">
          <p className="scan-icon">✅</p>
          <p>{message}</p>
        </div>
      )}

      {status === 'error' && (
        <div className="scan-result error">
          <p className="scan-icon">❌</p>
          <p>{message}</p>
          <button onClick={scanAgain} className="btn btn-primary" style={{ marginTop: 12 }}>
            Scan Again
          </button>
        </div>
      )}
    </div>
  );
}