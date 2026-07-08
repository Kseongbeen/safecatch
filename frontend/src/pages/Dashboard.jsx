import React, { useState, useEffect, useRef } from 'react';

const formatDepartureTimeKorean = (timeStr) => {
  if (!timeStr) return '';
  const parts = timeStr.split(':');
  if (parts.length >= 2) {
    const h = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    return `${h}시 ${m}분`;
  }
  return timeStr;
};

const formatDuration = (seconds) => {
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins}분`;
  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  return rem > 0 ? `${hrs}시간 ${rem}분` : `${hrs}시간`;
};

export default function Dashboard({ token, profile, fetchProfile, showToast }) {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedLegs, setExpandedLegs] = useState({});
  const [selectedRouteIdx, setSelectedRouteIdx] = useState(0);
  
  // Track if we already triggered alert for the current departure time
  const lastAlertedTimeRef = useRef('');
  const lastSpeedAlertedTimeRef = useRef('');

  useEffect(() => {
    // Fetch initial profile
    fetchProfile();
    
    // Set up polling for real-time transit status (every 1 second)
    const interval = setInterval(fetchTransitStatus, 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchTransitStatus = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/transit/status', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
        setError('');
        
        // Auto-select matched route index if available
        if (data.routes && data.routes.length > 0) {
          const matchedIdx = data.routes.findIndex(
            r => r.transit_line === data.transit_line && r.transit_type === data.transit_type
          );
          if (matchedIdx !== -1) {
            setSelectedRouteIdx(matchedIdx);
          }
        }
        
        // Trigger alert check
        checkAlertCondition(data);
      } else {
        setError('교통 정보를 불러올 수 없습니다.');
      }
    } catch (err) {
      console.error(err);
      setError('서버 연결 실패');
    } finally {
      setLoading(false);
    }
  };

  const checkAlertCondition = (data) => {
    // Night silent check (if enabled, don't trigger alerts during night hours)
    if (profile?.night_silent) {
      const now = new Date();
      const hour = now.getHours();
      if (hour >= 21 || hour < 8) {
        return; // Night silent mode active
      }
    }

    if (!profile?.notification_agreed) {
      return; // Notification not agreed
    }

    // Trigger alert if alert countdown is exactly 0 or just passed (within 5 seconds)
    // and we haven't alerted for this specific departure time yet
    const alertCountdown = data.alert_countdown_seconds;
    const departureTime = data.departure_time;

    if (alertCountdown <= 0 && alertCountdown > -5 && lastAlertedTimeRef.current !== departureTime) {
      lastAlertedTimeRef.current = departureTime;
      showToast(
        "출발 알림! SafeCatch",
        `[${data.transit_line}] 대중교통 탑승을 위해 ${profile.buffer_time}분 뒤인 ${formatDepartureTimeKorean(data.departure_time)}에 출발하세요!`,
        data.status_code === 'impossible' ? 'alert' : 'info'
      );
    }

    // Speed warning alert: if walk speed is too slow and they won't catch it (warning or impossible)
    if ((data.status_code === 'warning' || data.status_code === 'impossible') && 
        lastSpeedAlertedTimeRef.current !== departureTime) {
      lastSpeedAlertedTimeRef.current = departureTime;
      
      const message = data.status_code === 'warning'
        ? `[${data.transit_line}] 현재 보행 속도가 느립니다! 대중교통을 놓칠 수 있으니 서둘러 빠른 걸음으로 이동하세요. 🏃‍♂️`
        : `[${data.transit_line}] 현재 속도로는 탑승이 불가능합니다! 지금 즉시 가볍게 뛰거나 빨리 걸어주세요! 혹시 지각할 수 있으니 힘내세요! 🏃‍♂️💨`;

      showToast(
        "속도 조절 경고! SafeCatch",
        message,
        "alert"
      );
    }
  };

  const handleLate = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/transit/late', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        showToast("다음 배차 요청", "다음 버스/지하철 도착 정보로 갱신되었습니다.", "info");
        fetchTransitStatus();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleReset = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/transit/reset', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        showToast("배차 초기화", "실시간 최신 도착 정보로 초기화되었습니다.", "info");
        fetchTransitStatus();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Convert seconds to readable MM:SS format
  const formatTime = (secs) => {
    if (secs <= 0) return "00:00";
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (loading && !status) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <p style={{ color: 'var(--text-secondary)' }}>실시간 교통 정보 계산 중...</p>
      </div>
    );
  }

  // Determine colors based on status code
  const getFeasibilityStyles = (code) => {
    switch (code) {
      case 'stable':
        return {
          class: 'signal-stable',
          text: '탑승 가능 (안정)',
          desc: '여유롭게 걸어가셔도 대중교통을 탈 수 있습니다.',
          color: 'var(--color-stable)'
        };
      case 'warning':
        return {
          class: 'signal-warning',
          text: '신속 이동 필요',
          desc: '서둘러 빠른 걸음 혹은 가벼운 조깅이 필요합니다!',
          color: 'var(--color-warning)'
        };
      case 'impossible':
        return {
          class: 'signal-impossible',
          text: '탑승 불가 (다음 차)',
          desc: '현재 도보 속도로는 탈 수 없습니다. 다음 배차를 권장합니다.',
          color: 'var(--color-impossible)'
        };
      default:
        return {
          class: 'signal-stable',
          text: '계산 중',
          desc: '로딩 중...',
          color: 'var(--color-primary)'
        };
    }
  };

  // Route selection and relative calculation for countdown/departure
  const routes = status?.routes || [];
  const hasMultipleRoutes = routes.length > 1;
  const currentRoute = routes[selectedRouteIdx] || routes[0] || null;
  
  let totalTravelTime = status?.total_travel_time_seconds || 0;
  let departureTimeStr = status?.departure_time || '';
  let departureCountdown = status?.departure_countdown_seconds || 0;
  let alertTimeStr = status?.alert_time || '';
  let alertCountdown = status?.alert_countdown_seconds || 0;
  let selectedStatusCode = status?.status_code;
  
  if (currentRoute && status?.is_trip_alarm) {
    const backendMatchedRoute = routes.find(
      r => r.transit_line === status.transit_line && r.transit_type === status.transit_type
    ) || routes[0];
    
    if (backendMatchedRoute) {
      const diff = currentRoute.total_time - backendMatchedRoute.total_time;
      totalTravelTime = currentRoute.total_time;
      departureCountdown = Math.max(0, status.departure_countdown_seconds - diff);
      alertCountdown = status.alert_countdown_seconds - diff;
      
      if (status.target_arrival_time) {
        const [targetH, targetM] = status.target_arrival_time.split(':').map(Number);
        const now = new Date();
        const targetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), targetH, targetM, 0, 0);
        const targetEpoch = Math.floor(targetDate.getTime() / 1000);
        const departureEpoch = targetEpoch - totalTravelTime;
        
        // Handle tomorrow rollover
        const currentEpoch = Math.floor(Date.now() / 1000);
        let adjustedDepartureEpoch = departureEpoch;
        if (adjustedDepartureEpoch - currentEpoch < -1800) {
          adjustedDepartureEpoch += 24 * 3600;
        }
        
        const depDate = new Date(adjustedDepartureEpoch * 1000);
        departureTimeStr = depDate.toTimeString().split(' ')[0];
        
        const alertEpoch = adjustedDepartureEpoch - (status.buffer_time || profile?.buffer_time || 5) * 60;
        const alertDate = new Date(alertEpoch * 1000);
        alertTimeStr = alertDate.toTimeString().split(' ')[0];
      }
    }
    
    // Recalculate status code for selected route
    if (departureCountdown > 60) {
      selectedStatusCode = 'stable';
    } else if (departureCountdown > 0) {
      selectedStatusCode = 'warning';
    } else {
      selectedStatusCode = 'impossible';
    }
  }

  const feat = getFeasibilityStyles(selectedStatusCode);

  // Map Animation Calculations using selected route values
  const walkTimeTotal = currentRoute?.total_walk_time || status?.user_walk_time_seconds || 400;
  const transitTimeTotal = status?.transit_remaining_seconds || 900;
  
  // Calculate Bus progress (100% is far right, 0% is at stop)
  const busProgress = Math.max(0, Math.min(1, transitTimeTotal / 900)); // normalized to 15 min max
  const busX = 85 + (busProgress * 12); // from 85% (arrived) to 97% (far right)
  
  // Calculate User progress:
  const depCountdown = departureCountdown;
  let userProgress = 0; // 0 = at home, 1 = at stop
  if (depCountdown <= 0) {
    // User is walking or should have arrived.
    const secondsWalked = Math.abs(depCountdown);
    userProgress = Math.min(1, secondsWalked / walkTimeTotal);
  }
  const userX = 15 + (userProgress * 70); // from 15% (home) to 85% (stop)
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>
            {status?.is_trip_alarm ? `출발 도우미: ${status.alarm_name}` : 'SafeCatch Live'}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
            {status?.is_trip_alarm ? (
              `${status.start_point} → ${status.end_point}`
            ) : (
              '실시간 도착 알람 도우미'
            )}
          </p>
        </div>
      </div>

      {error && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          color: 'var(--color-impossible)',
          borderRadius: '10px',
          padding: '10px',
          fontSize: '0.8rem',
          textAlign: 'center'
        }}>
          {error}
        </div>
      )}

      {status?.api_limit_exceeded && (
        <div style={{
          background: 'rgba(245, 158, 11, 0.12)',
          border: '1px solid rgba(245, 158, 11, 0.25)',
          color: '#f59e0b',
          borderRadius: '12px',
          padding: '12px 16px',
          fontSize: '0.82rem',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          lineHeight: 1.4,
          textAlign: 'left'
        }}>
          <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>⚠️</span>
          <div>
            <strong>대중교통 API 요청 제한 초과 또는 API 키 오류 (API 없음)</strong>
            <div style={{ opacity: 0.8, fontSize: '0.75rem', marginTop: '2px' }}>
              실시간 교통 정보 수신이 불가능하여 계산된 대체 경로가 표시됩니다.
            </div>
          </div>
        </div>
      )}

      {!status?.is_trip_alarm ? (
        <div className="glass-card" style={{ padding: '40px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <div style={{ fontSize: '3.5rem', filter: 'drop-shadow(0 0 15px rgba(99,102,241,0.3))' }}>⏰</div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', marginTop: '8px' }}>활성화된 도착 알람이 없습니다</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', maxWidth: '320px', margin: '0 auto', lineHeight: 1.6 }}>
            목표 도착 시각을 기준으로 실시간 역산 알람을 받으려면 <strong>도착 알람</strong> 메뉴에서 알람을 등록하고 활성화해 주세요.
          </p>
        </div>
      ) : (
        <>
          {/* Main Signal Display */}
          <div className="glass-card" style={{ padding: '24px 20px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
            {/* Glow behind card matching feasibility */}
            <div style={{
              position: 'absolute',
              top: '-20px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              background: feat.color,
              filter: 'blur(60px)',
              opacity: 0.25,
              zIndex: 0,
              pointerEvents: 'none'
            }} />

            <div style={{ position: 'relative', zIndex: 1 }}>
              <div className={`signal-badge ${feat.class}`} style={{ marginBottom: '16px' }}>
                <span className="signal-dot" />
                <span>{departureCountdown > 0 ? "출발 대기" : "지금 즉시 출발!"}</span>
              </div>

              <div style={{ fontSize: '3rem', fontWeight: 800, letterSpacing: '-1px', margin: '8px 0', lineHeight: 1 }}>
                {departureCountdown > 0 ? (
                  formatTime(departureCountdown)
                ) : (
                  <span style={{ color: 'var(--color-impossible)' }}>00:00</span>
                )}
              </div>
              
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '24px' }}>
                ⏰ 목표 도착 시각: {status.target_arrival_time} ({currentRoute?.transit_line || status.transit_line})
              </p>

              <p style={{ fontSize: '0.9rem', color: '#fff', fontWeight: '500', marginBottom: '8px' }}>
                {departureCountdown > 0 ? (
                  `목표 도착 시간을 위해 ${formatDepartureTimeKorean(departureTimeStr)}에 출발해야 합니다. (출발까지 ${Math.floor(departureCountdown / 60)}분 남음)`
                ) : (
                  "🚨 출발 시각이 지났습니다! 지각 위험이 있으니 지금 즉시 출발하십시오."
                )}
              </p>

              {(selectedStatusCode === 'warning' || selectedStatusCode === 'impossible') && (
                <div style={{
                  background: selectedStatusCode === 'warning' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                  border: selectedStatusCode === 'warning' ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  marginTop: '16px',
                  color: selectedStatusCode === 'warning' ? '#fde047' : '#fca5a5',
                  fontSize: '0.82rem',
                  lineHeight: 1.5,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  textAlign: 'left'
                }}>
                  <span style={{ fontSize: '1.4rem', flexShrink: 0 }}>🏃‍♂️💨</span>
                  <div>
                    <strong>보행 속도 경고:</strong>{' '}
                    {selectedStatusCode === 'warning' 
                      ? `현재 설정된 보행 속도(${profile?.average_walk_speed || 1.2} m/s) 기준 시간이 촉박합니다. 대중교통을 놓치지 않으려면 조금 더 빨리 걸어주세요!` 
                      : `현재 보행 속도로는 대중교통 탑승이 불가능합니다. 지금 즉시 속도를 높여 가볍게 뛰거나 빠르게 이동해야 합니다!`}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Route Selector Tabs */}
          {hasMultipleRoutes && (
            <div className="glass-card" style={{ padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <h2 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                🛤️ 대중교통 경로 선택 (계단/터널 우회 및 최소 도보 비교)
              </h2>
              <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                {routes.map((r, idx) => {
                  const isSelected = selectedRouteIdx === idx;
                  const walkDistance = r.total_walk_distance || r.legs.filter(l => l.mode === 'WALK').reduce((sum, l) => sum + l.distance, 0);
                  
                  let highlightTag = '';
                  if (idx === 0) highlightTag = '추천';
                  else if (walkDistance < 400) highlightTag = '최소 도보 (계단 회피)';
                  
                  return (
                    <div 
                      key={idx}
                      onClick={() => setSelectedRouteIdx(idx)}
                      style={{
                        flex: '0 0 180px',
                        padding: '12px',
                        borderRadius: '12px',
                        border: isSelected ? '1.5px solid var(--color-primary)' : '1.5px solid rgba(255, 255, 255, 0.05)',
                        background: isSelected ? 'rgba(99, 102, 241, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        position: 'relative'
                      }}
                    >
                      {highlightTag && (
                        <span style={{
                          position: 'absolute',
                          top: '-8px',
                          left: '8px',
                          background: idx === 0 ? 'var(--color-primary)' : 'var(--color-stable)',
                          color: '#fff',
                          fontSize: '0.55rem',
                          fontWeight: 800,
                          padding: '1px 5px',
                          borderRadius: '6px'
                        }}>
                          {highlightTag}
                        </span>
                      )}
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px' }}>
                        <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>경로 {idx + 1}</span>
                        <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#fff' }}>
                          {formatDuration(r.total_time)}
                        </span>
                      </div>

                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: '6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {r.transit_line || '대중교통 노선'}
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-secondary)' }}>
                        <span>도보 {Math.round(walkDistance)}m</span>
                        <span>{r.fare?.toLocaleString()}원</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Animated Route Map Simulator */}
          <div className="glass-card" style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h2 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-secondary)' }}>실시간 위치 시뮬레이터</h2>
            
            {/* Simulated Map Canvas/SVG */}
            <div style={{
              background: 'rgba(0,0,0,0.25)',
              borderRadius: '12px',
              height: '96px',
              position: 'relative',
              border: '1px solid rgba(255,255,255,0.03)',
              overflow: 'hidden'
            }}>
              {/* Road/Path */}
              <div style={{
                position: 'absolute',
                top: '56%',
                left: '10%',
                right: '10%',
                height: '6px',
                background: 'rgba(255,255,255,0.1)',
                borderRadius: '3px'
              }} />
              
              {/* Dashed segment for walking */}
              <div style={{
                position: 'absolute',
                top: '56%',
                left: '15%',
                width: '70%',
                height: '6px',
                borderBottom: '2px dashed rgba(255, 255, 255, 0.25)',
                zIndex: 0
              }} />

              {/* Home Icon at 15% */}
              <div style={{
                position: 'absolute',
                left: '15%',
                top: '52%',
                transform: 'translate(-50%, -100%)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
              }}>
                <svg style={{ width: '22px', height: '22px', color: 'var(--color-accent)' }} fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                </svg>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '2px' }}>Home</span>
              </div>

              {/* Station Icon at 85% */}
              <div style={{
                position: 'absolute',
                left: '85%',
                top: '52%',
                transform: 'translate(-50%, -100%)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
              }}>
                {status?.transit_type === 'bus' ? (
                  <svg style={{ width: '22px', height: '22px', color: 'var(--color-primary)' }} fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM8 14v3a1 1 0 11-2 0v-3h2zm6 0v3a1 1 0 11-2 0v-3h2z" />
                  </svg>
                ) : (
                  <svg style={{ width: '22px', height: '22px', color: 'var(--color-primary)' }} fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 2a8 8 0 100 16 8 8 0 000-16zM8 9a1 1 0 100-2 1 1 0 000 2zm5-1a1 1 0 11-2 0 1 1 0 012 0zm-5 4a1 1 0 100 2 1 1 0 000-2zm5 1a1 1 0 11-2 0 1 1 0 012 0z" />
                  </svg>
                )}
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '2px' }}>Stop</span>
              </div>

              {/* User Avatar (walking) */}
              <div style={{
                position: 'absolute',
                left: `${userX}%`,
                top: '55%',
                transform: 'translate(-50%, -50%)',
                transition: 'left 1s linear',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                zIndex: 2
              }}>
                <div style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  background: '#fff',
                  border: '2px solid var(--color-accent)',
                  boxShadow: '0 0 8px var(--color-accent)'
                }} />
                <span style={{ fontSize: '0.6rem', color: '#fff', marginTop: '2px', fontWeight: 'bold' }}>ME</span>
              </div>

              {/* Bus/Subway Icon */}
              <div style={{
                position: 'absolute',
                left: `${busX}%`,
                top: '55%',
                transform: 'translate(-50%, -50%)',
                transition: 'left 1s linear',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                zIndex: 1
              }}>
                <div style={{
                  width: '16px',
                  height: '16px',
                  borderRadius: '4px',
                  background: 'var(--color-primary)',
                  border: '2px solid #fff',
                  boxShadow: '0 0 8px var(--color-primary)'
                }} />
                <span style={{ fontSize: '0.6rem', color: 'var(--color-primary)', marginTop: '2px', fontWeight: 'bold' }}>
                  {currentRoute?.transit_line || status.transit_line}
                </span>
              </div>
            </div>

            {/* Simulation Status Legend */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              padding: '12px 10px',
              background: 'rgba(255,255,255,0.02)',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.04)',
              marginTop: '4px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>나의 위치 (🚶‍♂️)</span>
                <span style={{ fontWeight: '600', color: userProgress >= 1 ? 'var(--color-stable)' : '#fff', fontSize: '0.85rem' }}>
                  {userProgress >= 1 ? (
                    "정류장 도착 완료"
                  ) : (
                    depCountdown <= 0 ? (
                      `정류장 이동 중 (${Math.round(userProgress * 100)}%)`
                    ) : (
                      `출발 대기 중 (${formatTime(depCountdown)})`
                    )
                  )}
                </span>
              </div>

              <div style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  {currentRoute?.transit_type === 'bus' || status.transit_type === 'bus' ? '버스' : '지하철'} 위치 (🚌)
                </span>
                <span style={{ fontWeight: '600', color: busProgress <= 0.05 ? 'var(--color-impossible)' : '#fff', fontSize: '0.85rem' }}>
                  {busProgress <= 0.05 ? (
                    "정류장 진입 / 이미 통과"
                  ) : (
                    `도착 예정지 약 ${formatDuration(transitTimeTotal)} 전`
                  )}
                </span>
              </div>

              <div style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>사전 알람 설정</span>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  출발 {alertCountdown > 0 ? Math.round(alertCountdown / 60) : 0}분 전 알림
                </span>
              </div>
            </div>
          </div>

          {/* Recommended Route Details for the alarm */}
          {currentRoute && (
            <div className="glass-card" style={{ padding: '20px 16px' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '16px' }}>
                🚇 상세 이동 경로 정보
              </h3>

              {/* Legs timeline rendering */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0px', position: 'relative' }}>
                {currentRoute.legs.map((leg, li) => {
                  const isLast = li === currentRoute.legs.length - 1;
                  const isExpanded = !!expandedLegs[li];
                  
                  if (leg.mode === 'WALK') {
                    const walkRouteText = leg.start_name && leg.end_name
                      ? `${leg.start_name} → ${leg.end_name}`
                      : (leg.start_name ? `${leg.start_name}에서 출발` : (leg.end_name ? `${leg.end_name}까지 이동` : '도보 이동'));
                    return (
                      <div key={li} style={{ display: 'flex', gap: '12px', alignItems: 'stretch', minHeight: '44px' }}>
                        {/* Dot & vertical line */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '20px', flexShrink: 0 }}>
                          <div style={{
                            width: '10px', height: '10px', borderRadius: '50%',
                            background: 'var(--text-muted)', border: '2px solid rgba(255,255,255,0.15)',
                            flexShrink: 0, marginTop: '4px'
                          }} />
                          {!isLast && <div style={{ width: '2px', flex: 1, background: 'rgba(255,255,255,0.08)', marginTop: '2px' }} />}
                        </div>

                        {/* Content block */}
                        <div style={{ paddingBottom: isLast ? '0' : '10px', flex: 1 }}>
                          <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                            🚶 {walkRouteText}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                            거리 {Math.round(leg.distance)}m · 소요시간 {formatDuration(leg.duration)}
                          </div>
                        </div>
                      </div>
                    );
                  } else {
                    // Transit leg (BUS or SUBWAY)
                    const color = leg.route_color ? `#${leg.route_color}` : (leg.mode === 'SUBWAY' ? '#6366f1' : '#10b981');
                    const icon = leg.mode === 'SUBWAY' ? '🚇' : '🚌';
                    
                    return (
                      <div key={li} style={{ display: 'flex', gap: '12px', alignItems: 'stretch', minHeight: '70px' }}>
                        {/* Dot & vertical line */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '20px', flexShrink: 0 }}>
                          <div style={{
                            width: '12px', height: '12px', borderRadius: '50%',
                            background: color, boxShadow: `0 0 8px ${color}60`,
                            flexShrink: 0, marginTop: '4px'
                          }} />
                          {!isLast && <div style={{ width: '3px', flex: 1, background: color, opacity: 0.4, marginTop: '2px' }} />}
                        </div>

                        {/* Content block */}
                        <div style={{ paddingBottom: isLast ? '0' : '12px', flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', flexWrap: 'wrap' }}>
                            <span style={{
                              display: 'inline-block', padding: '2px 8px', borderRadius: '6px',
                              background: color + '22', color: color,
                              fontSize: '0.78rem', fontWeight: 700
                            }}>
                              {icon} {leg.route}
                            </span>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                              {leg.station_count}개 정거장 · {formatDuration(leg.duration)}
                            </span>
                            
                            {leg.stations && leg.stations.length > 2 && (
                              <button
                                onClick={() => setExpandedLegs(prev => ({ ...prev, [li]: !prev[li] }))}
                                style={{
                                  background: 'rgba(255,255,255,0.05)',
                                  border: 'none',
                                  color: 'var(--text-secondary)',
                                  fontSize: '0.65rem',
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '2px'
                                }}
                              >
                                <span>{isExpanded ? '경로 접기 ▲' : '경유지 보기 ▼'}</span>
                              </button>
                            )}
                          </div>

                          <div style={{ fontSize: '0.78rem', color: 'var(--text-primary)', marginBottom: '4px' }}>
                            <span style={{ fontWeight: 600 }}>{leg.board_station}</span> 승차 
                            <span style={{ color: 'var(--text-muted)', margin: '0 6px' }}>→</span> 
                            <span style={{ fontWeight: 600 }}>{leg.alight_station}</span> 하차
                          </div>

                          {/* Stations list */}
                          {isExpanded && leg.stations && (
                            <div style={{
                              margin: '8px 0',
                              padding: '8px 12px',
                              background: 'rgba(0,0,0,0.15)',
                              borderRadius: '8px',
                              borderLeft: `2.5px solid ${color}`,
                              fontSize: '0.72rem',
                              color: 'var(--text-secondary)',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '6px'
                            }}>
                              {leg.stations.map((st, sidx) => (
                                <div key={sidx} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <span style={{
                                    width: '6px', height: '6px', borderRadius: '50%',
                                    background: (sidx === 0 || sidx === leg.stations.length - 1) ? color : 'var(--text-muted)'
                                  }} />
                                  <span style={{
                                    fontWeight: (sidx === 0 || sidx === leg.stations.length - 1) ? 'bold' : 'normal',
                                    color: (sidx === 0 || sidx === leg.stations.length - 1) ? '#fff' : 'var(--text-secondary)'
                                  }}>
                                    {st} {sidx === 0 ? '(기점)' : (sidx === leg.stations.length - 1 ? '(종점)' : '')}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  }
                })}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <div className="glass-card" style={{
              padding: '14px 16px',
              background: 'rgba(99, 102, 241, 0.08)',
              border: '1px solid rgba(99, 102, 241, 0.2)',
              borderRadius: '12px',
              width: '100%',
              fontSize: '0.82rem',
              lineHeight: 1.5,
              color: 'var(--text-secondary)',
              textAlign: 'center'
            }}>
              ℹ️ 현재 <strong>도착 알람 모드</strong>가 활성화되어 있습니다.<br />
              목표 시간인 <strong>{status.target_arrival_time}</strong>에 늦지 않도록 출발 시간을 엄수해 주세요.
            </div>
          </div>
        </>
      )}
    </div>
  );
}
