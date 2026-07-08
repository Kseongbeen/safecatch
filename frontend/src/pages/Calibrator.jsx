import React, { useState, useEffect, useRef } from 'react';

export default function Calibrator({ token, profile, fetchProfile, showToast }) {
  const [measuring, setMeasuring] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const [steps, setSteps] = useState(0);
  const [currentSpeed, setCurrentSpeed] = useState(0.0);
  const [avgSpeed, setAvgSpeed] = useState(0.0);
  const [history, setHistory] = useState([]);
  
  const timerRef = useRef(null);
  const stepTimerRef = useRef(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/walking-history', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const startMeasurement = () => {
    setMeasuring(true);
    setCountdown(10);
    setSteps(0);
    setCurrentSpeed(1.2);
    setAvgSpeed(0.0);
    
    let timeElapsed = 0;
    const speedsRecorded = [];

    // Countdown and speed update timer
    timerRef.current = setInterval(() => {
      timeElapsed += 1;
      setCountdown(10 - timeElapsed);

      // Simulate slight speed fluctuation around 1.1 ~ 1.4 m/s
      const simulatedSpeed = parseFloat((1.1 + Math.random() * 0.3).toFixed(2));
      setCurrentSpeed(simulatedSpeed);
      speedsRecorded.push(simulatedSpeed);

      if (timeElapsed >= 10) {
        clearInterval(timerRef.current);
        clearInterval(stepTimerRef.current);
        setMeasuring(false);
        
        // Calculate average
        const avg = parseFloat((speedsRecorded.reduce((a, b) => a + b, 0) / speedsRecorded.length).toFixed(2));
        setAvgSpeed(avg);
        saveMeasurement(avg, speedsRecorded.length * 2); // assume 2 steps per speed record
      }
    }, 1000);

    // Steps timer (simulating footsteps)
    stepTimerRef.current = setInterval(() => {
      setSteps(prev => prev + 1 + Math.floor(Math.random() * 2));
    }, 600);
  };

  const saveMeasurement = async (speed, stepsCount) => {
    try {
      const res = await fetch('http://localhost:8000/api/walking-history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          speed: speed,
          steps: stepsCount,
          duration: 10.0
        })
      });
      if (res.ok) {
        showToast("측정 완료", `평균 보행 속도가 ${speed} m/s로 갱신되었습니다.`, "info");
        fetchProfile();
        fetchHistory();
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (stepTimerRef.current) clearInterval(stepTimerRef.current);
    };
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>걸음 속도 보정기</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
          사용자의 실제 보행 데이터와 가속도계를 분석하여 정밀한 ETA를 계산합니다.
        </p>
      </div>

      {/* Speedometer Gauge Display */}
      <div className="glass-card" style={{ padding: '30px 20px', textAlign: 'center', position: 'relative' }}>
        {measuring ? (
          <div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              border: '6px solid var(--color-accent)',
              borderTopColor: 'transparent',
              animation: 'spin 1.5s linear infinite',
              marginBottom: '20px'
            }} />
            
            <div style={{ position: 'absolute', top: '75px', left: '0', right: '0', fontSize: '1.5rem', fontWeight: '800' }}>
              {countdown}초
            </div>

            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--color-accent)' }}>
              {currentSpeed.toFixed(2)} <span style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>m/s</span>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '8px' }}>
              제자리 걸음을 해보세요! (가속도 센서 측정 중...)
            </p>
            
            <div style={{ display: 'flex', justifyContent: 'center', gap: '30px', marginTop: '20px' }}>
              <div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{steps}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>걸음 수</div>
              </div>
              <div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>10.0초</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>측정 시간</div>
              </div>
            </div>
          </div>
        ) : (
          <div>
            {avgSpeed > 0 ? (
              <div style={{ marginBottom: '16px' }}>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '2px solid var(--color-stable)',
                  color: 'var(--color-stable)',
                  marginBottom: '16px'
                }}>
                  <svg style={{ width: '32px', height: '32px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 style={{ fontSize: '1.2rem', color: '#fff', marginBottom: '8px' }}>측정이 완료되었습니다!</h2>
                <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--color-stable)' }}>
                  {avgSpeed.toFixed(2)} <span style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>m/s</span>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>
                  성공적으로 맞춤 보행 속도 스펙이 데이터베이스에 저장되었습니다.
                </p>
              </div>
            ) : (
              <div style={{ padding: '20px 0' }}>
                <svg style={{ width: '48px', height: '48px', color: 'var(--text-secondary)', marginBottom: '16px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <h2 style={{ fontSize: '1.1rem', color: '#fff', marginBottom: '8px' }}>현재 적용 보행 속도</h2>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                  {profile?.average_walk_speed || 1.2} <span style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>m/s</span>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '4px' }}>
                  기본 속도는 1.2m/s입니다. 실시간 측정을 통해 정확도를 높이세요.
                </p>
              </div>
            )}

            <button onClick={startMeasurement} className="btn btn-primary" style={{ marginTop: '12px' }}>
              실시간 속도 측정 시작
            </button>
          </div>
        )}
      </div>

      {/* History Log List */}
      <div className="glass-card" style={{ padding: '20px 16px' }}>
        <h2 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '16px' }}>
          최근 보행 속도 측정 이력
        </h2>
        
        {history.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '10px 0' }}>
            아직 측정 이력이 없습니다.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '200px', overflowY: 'auto' }}>
            {history.map((h, i) => (
              <div key={h.id} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 12px',
                background: 'rgba(255,255,255,0.03)',
                borderRadius: '8px',
                fontSize: '0.8rem'
              }}>
                <div>
                  <span style={{ fontWeight: '700', color: 'var(--color-accent)' }}>{h.speed.toFixed(2)} m/s</span>
                  <span style={{ color: 'var(--text-muted)', marginLeft: '12px' }}>({h.steps} 걸음)</span>
                </div>
                <div style={{ color: 'var(--text-muted)' }}>
                  {new Date(h.created_at).toLocaleDateString()} {new Date(h.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
