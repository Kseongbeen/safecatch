import React, { useState, useEffect, useRef } from 'react';

const DAYS = ['월요일', '화요일', '수요일', '목요일', '금요일', '토요일', '일요일'];

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

export default function TripAlarms({ token, profile, fetchProfile, showToast }) {
  const [alarms, setAlarms] = useState([]);
  const [selectedAlarmId, setSelectedAlarmId] = useState(null);
  const [alarmStatus, setAlarmStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusLoading, setStatusLoading] = useState(false);
  const [error, setError] = useState('');
  const [expandedLegs, setExpandedLegs] = useState({});

  // Form states for creating/editing alarms
  const [showFormModal, setShowFormModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [alarmName, setAlarmName] = useState('');
  const [startPoint, setStartPoint] = useState('');
  const [startLat, setStartLat] = useState(37.382);
  const [startLon, setStartLon] = useState(127.118);
  const [endPoint, setEndPoint] = useState('');
  const [endLat, setEndLat] = useState(37.497);
  const [endLon, setEndLon] = useState(127.027);
  const [targetArrivalTime, setTargetArrivalTime] = useState('09:00');
  const [transitType, setTransitType] = useState('bus');
  const [transitLine, setTransitLine] = useState('');
  const [bufferTime, setBufferTime] = useState(5);
  const [active, setActive] = useState(true);

  // Tmap POI Search states inside form
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchTarget, setSearchTarget] = useState('start'); // 'start' or 'end'
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  // Recommendation routes for path selection in modal
  const [recommendedRoutes, setRecommendedRoutes] = useState(null);
  const [recommending, setRecommending] = useState(false);
  const [selectedRouteIdx, setSelectedRouteIdx] = useState(0);
  const [selectedDetailRouteIdx, setSelectedDetailRouteIdx] = useState(0);

  // Track if we already triggered alert for departure times
  const lastAlertedTimesRef = useRef({});

  useEffect(() => {
    fetchAlarms();
  }, []);

  // Polling for selected alarm status (every 1 second)
  useEffect(() => {
    if (!selectedAlarmId) {
      setAlarmStatus(null);
      return;
    }
    
    fetchAlarmStatus(selectedAlarmId);
    const interval = setInterval(() => {
      fetchAlarmStatus(selectedAlarmId);
    }, 1000);

    return () => clearInterval(interval);
  }, [selectedAlarmId]);

  // General background check for ALL active alarms (every 10 seconds) to trigger push notifications
  useEffect(() => {
    const checkAllAlarms = async () => {
      if (alarms.length === 0) return;
      
      for (const alarm of alarms) {
        if (!alarm.active) continue;
        
        try {
          const res = await fetch(`http://localhost:8000/api/trip-alarms/${alarm.id}/status`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const statusData = await res.json();
            checkPushCondition(alarm, statusData);
          }
        } catch (err) {
          console.error("Failed background status check", err);
        }
      }
    };

    const interval = setInterval(checkAllAlarms, 10000);
    return () => clearInterval(interval);
  }, [alarms]);

  const fetchAlarms = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/trip-alarms', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAlarms(data);
        if (data.length > 0 && !selectedAlarmId) {
          setSelectedAlarmId(data[0].id);
        }
      } else {
        setError('알람 목록을 불러오지 못했습니다.');
      }
    } catch (err) {
      console.error(err);
      setError('서버 연결 실패');
    } finally {
      setLoading(false);
    }
  };

  const fetchAlarmStatus = async (id) => {
    try {
      const res = await fetch(`http://localhost:8000/api/trip-alarms/${id}/status`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAlarmStatus(data);
        
        // Auto-select matched route index if available
        if (data.routes && data.routes.length > 0) {
          const matchedIdx = data.routes.findIndex(
            r => r.transit_line === data.transit_line && r.transit_type === data.transit_type
          );
          if (matchedIdx !== -1) {
            setSelectedDetailRouteIdx(matchedIdx);
          }
        }
        
        // Also perform alert check on current active alarm instantly
        const alarm = alarms.find(a => a.id === id);
        if (alarm) {
          checkPushCondition(alarm, data);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const checkPushCondition = (alarm, statusData) => {
    if (!profile?.notification_agreed) return;

    if (profile?.night_silent) {
      const now = new Date();
      const hour = now.getHours();
      if (hour >= 21 || hour < 8) return;
    }

    const alertCountdown = statusData.alert_countdown_seconds;
    const departureTime = statusData.departure_time;
    const alarmKey = `${alarm.id}_${departureTime}`;

    // If countdown reaches trigger buffer window (0 to -10s) and not alerted yet
    if (alertCountdown <= 0 && alertCountdown > -10 && !lastAlertedTimesRef.current[alarmKey]) {
      lastAlertedTimesRef.current[alarmKey] = true;
      showToast(
        `출발 알림: [${alarm.name}]`,
        `${statusData.target_arrival_time} 도착을 위해 지금 출발해야 합니다! (${alarm.buffer_time}분 버퍼 적용)`,
        'alert'
      );
    }
  };

  const handleCreateOrUpdate = async (e) => {
    e.preventDefault();
    if (!startPoint || !endPoint) {
      showToast('위치 오류', '출발지와 목적지를 입력해야 합니다.', 'alert');
      return;
    }

    const payload = {
      name: alarmName,
      start_point: startPoint,
      start_lat: parseFloat(startLat),
      start_lon: parseFloat(startLon),
      end_point: endPoint,
      end_lat: parseFloat(endLat),
      end_lon: parseFloat(endLon),
      target_arrival_time: targetArrivalTime,
      transit_type: transitType,
      transit_line: transitLine,
      buffer_time: parseInt(bufferTime),
      active: active
    };

    try {
      let url = 'http://localhost:8000/api/trip-alarms';
      let method = 'POST';
      
      if (editMode && editingId) {
        url = `http://localhost:8000/api/trip-alarms/${editingId}`;
        method = 'PUT';
      }

      const res = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const saved = await res.json();
        showToast(
          editMode ? '알람 수정 완료' : '알람 추가 완료',
          `[${saved.name}] 알람이 저장되었습니다.`,
          'info'
        );
        setShowFormModal(false);
        fetchAlarms();
        if (!editMode) {
          setSelectedAlarmId(saved.id);
        }
      } else {
        showToast('저장 실패', '알람 정보를 저장하지 못했습니다.', 'alert');
      }
    } catch (err) {
      console.error(err);
      showToast('오류', '서버 통신 실패', 'alert');
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`[${name}] 알람을 정말 삭제하시겠습니까?`)) return;

    try {
      const res = await fetch(`http://localhost:8000/api/trip-alarms/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        showToast('알람 삭제 완료', `[${name}] 알람이 삭제되었습니다.`, 'info');
        setAlarms(prev => prev.filter(a => a.id !== id));
        if (selectedAlarmId === id) {
          setSelectedAlarmId(null);
          setAlarmStatus(null);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleActive = async (alarm) => {
    try {
      const res = await fetch(`http://localhost:8000/api/trip-alarms/${alarm.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ active: !alarm.active })
      });
      if (res.ok) {
        showToast(
          alarm.active ? '알람 비활성화' : '알람 활성화',
          `[${alarm.name}] 알람이 ${alarm.active ? '꺼졌습니다' : '켜졌습니다'}.`,
          'info'
        );
        fetchAlarms();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const openAddModal = () => {
    setEditMode(false);
    setEditingId(null);
    setAlarmName('');
    setStartPoint('');
    setStartLat(37.382);
    setStartLon(127.118);
    setEndPoint('');
    setEndLat(37.497);
    setEndLon(127.027);
    setTargetArrivalTime('09:00');
    setTransitType('bus');
    setTransitLine('');
    setBufferTime(5);
    setActive(true);
    setRecommendedRoutes(null);
    setShowFormModal(true);
  };

  const openEditModal = (alarm) => {
    setEditMode(true);
    setEditingId(alarm.id);
    setAlarmName(alarm.name);
    setStartPoint(alarm.start_point);
    setStartLat(alarm.start_lat);
    setStartLon(alarm.start_lon);
    setEndPoint(alarm.end_point);
    setEndLat(alarm.end_lat);
    setEndLon(alarm.end_lon);
    setTargetArrivalTime(alarm.target_arrival_time);
    setTransitType(alarm.transit_type);
    setTransitLine(alarm.transit_line);
    setBufferTime(alarm.buffer_time);
    setActive(alarm.active);
    setRecommendedRoutes(null);
    setShowFormModal(true);
  };

  // Tmap Search Handler inside Modal
  const handleSearchPOI = async (e) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(`http://localhost:8000/api/transit/search-poi?keyword=${encodeURIComponent(searchQuery)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data);
      } else {
        showToast("검색 실패", "위치를 찾을 수 없습니다.", "alert");
      }
    } catch (err) {
      console.error(err);
      showToast("오류", "서버 연결에 실패했습니다.", "alert");
    } finally {
      setSearching(false);
    }
  };

  const selectPOI = (poi) => {
    if (searchTarget === 'start') {
      setStartPoint(poi.name);
      setStartLat(poi.latitude);
      setStartLon(poi.longitude);
    } else {
      setEndPoint(poi.name);
      setEndLat(poi.latitude);
      setEndLon(poi.longitude);
    }
    setShowSearchModal(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleRecommendRoute = async () => {
    if (!startLat || !startLon || !endLat || !endLon) {
      showToast('좌표 미설정', '출발지와 목적지를 먼저 검색해 주세요.', 'alert');
      return;
    }
    setRecommending(true);
    setRecommendedRoutes(null);
    setSelectedRouteIdx(0);
    try {
      const params = new URLSearchParams({
        start_lat: startLat, start_lon: startLon,
        end_lat: endLat, end_lon: endLon,
        start_name: startPoint || '출발지',
        end_name: endPoint || '목적지'
      });
      const res = await fetch(`http://localhost:8000/api/transit/recommend-route?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTransitType(data.transit_type || 'bus');
        setTransitLine(data.transit_line || '');
        if (data.routes && data.routes.length > 0) {
          setRecommendedRoutes(data.routes);
        }
        showToast('경로 추천 완료', `${data.routes?.length || 0}개의 대중교통 경로 탐색 성공!`, 'info');
      } else {
        showToast('추천 실패', '대중교통 경로를 찾을 수 없습니다.', 'alert');
      }
    } catch (err) {
      console.error(err);
      showToast('오류', '서버 연결에 실패했습니다.', 'alert');
    } finally {
      setRecommending(false);
    }
  };

  const selectRoute = (idx) => {
    setSelectedRouteIdx(idx);
    const route = recommendedRoutes[idx];
    if (route) {
      setTransitType(route.transit_type || 'bus');
      setTransitLine(route.transit_line || '');
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    if (mins < 60) return `${mins}분`;
    const hrs = Math.floor(mins / 60);
    const rem = mins % 60;
    return rem > 0 ? `${hrs}시간 ${rem}분` : `${hrs}시간`;
  };

  const formatCountdown = (secs) => {
    if (secs <= 0) return "지금 즉시 출발!";
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    
    if (h > 0) {
      return `${h}시간 ${m.toString().padStart(2, '0')}분 ${s.toString().padStart(2, '0')}초`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const activeAlarmObj = alarms.find(a => a.id === selectedAlarmId);
  const [targetHour, targetMin] = (targetArrivalTime || '09:00').split(':');
  
  // Selected detail route and relative calculation for countdown/departure
  const detailRoutes = alarmStatus?.routes || [];
  const hasMultipleDetailRoutes = detailRoutes.length > 1;
  const currentDetailRoute = detailRoutes[selectedDetailRouteIdx] || detailRoutes[0] || null;
  
  let detailTotalTravelTime = alarmStatus?.total_travel_time_seconds || 0;
  let detailDepartureTimeStr = alarmStatus?.departure_time || '';
  let detailDepartureCountdown = alarmStatus?.departure_countdown_seconds || 0;
  let detailAlertTimeStr = alarmStatus?.alert_time || '';
  let detailAlertCountdown = alarmStatus?.alert_countdown_seconds || 0;
  
  if (currentDetailRoute && alarmStatus) {
    const backendMatchedRoute = detailRoutes.find(
      r => r.transit_line === alarmStatus.transit_line && r.transit_type === alarmStatus.transit_type
    ) || detailRoutes[0];
    
    if (backendMatchedRoute) {
      const diff = currentDetailRoute.total_time - backendMatchedRoute.total_time;
      detailTotalTravelTime = currentDetailRoute.total_time;
      detailDepartureCountdown = Math.max(0, alarmStatus.departure_countdown_seconds - diff);
      detailAlertCountdown = alarmStatus.alert_countdown_seconds - diff;
      
      if (alarmStatus.target_arrival_time) {
        const [targetH, targetM] = alarmStatus.target_arrival_time.split(':').map(Number);
        const now = new Date();
        const targetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), targetH, targetM, 0, 0);
        const targetEpoch = Math.floor(targetDate.getTime() / 1000);
        const departureEpoch = targetEpoch - detailTotalTravelTime;
        
        // Handle tomorrow rollover
        const currentEpoch = Math.floor(Date.now() / 1000);
        let adjustedDepartureEpoch = departureEpoch;
        if (adjustedDepartureEpoch - currentEpoch < -1800) {
          adjustedDepartureEpoch += 24 * 3600;
        }
        
        const depDate = new Date(adjustedDepartureEpoch * 1000);
        detailDepartureTimeStr = depDate.toTimeString().split(' ')[0];
        
        const alertEpoch = adjustedDepartureEpoch - (alarmStatus.buffer_time || activeAlarmObj?.buffer_time || 5) * 60;
        const alertDate = new Date(alertEpoch * 1000);
        detailAlertTimeStr = alertDate.toTimeString().split(' ')[0];
      }
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>출발 역산 알림 도우미</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
            목적지에 도착해야 하는 시간에 맞춰 실시간 최적 출발 시각을 계산합니다.
          </p>
        </div>
        <button 
          onClick={openAddModal}
          className="btn btn-primary"
          style={{ width: 'auto', padding: '10px 16px', fontSize: '0.85rem', fontWeight: 700, borderRadius: '20px' }}
        >
          + 알람 등록
        </button>
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

      {alarmStatus?.api_limit_exceeded && (
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

      {/* Alarms Carousel/List */}
      {loading ? (
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '20px' }}>알람 로딩 중...</p>
      ) : alarms.length === 0 ? (
        <div className="glass-card" style={{ padding: '40px 20px', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '16px' }}>
            등록된 도착 시간 알람이 없습니다. 첫 알람을 등록해 보세요!
          </p>
          <button onClick={openAddModal} className="btn btn-primary" style={{ width: 'auto', display: 'inline-block' }}>
            출발 알람 만들기
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '8px' }}>
          {alarms.map(alarm => (
            <div 
              key={alarm.id} 
              onClick={() => { setSelectedAlarmId(alarm.id); setSelectedDetailRouteIdx(0); }}
              className="glass-card" 
              style={{
                flex: '0 0 220px',
                padding: '14px',
                border: selectedAlarmId === alarm.id ? '2px solid var(--color-primary)' : '1px solid rgba(255, 255, 255, 0.08)',
                background: selectedAlarmId === alarm.id ? 'rgba(99, 102, 241, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                position: 'relative'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{
                  fontWeight: 800,
                  fontSize: '0.9rem',
                  color: alarm.active ? '#fff' : 'var(--text-muted)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: '130px'
                }}>
                  {alarm.name}
                </span>
                
                {/* Active Toggle Switch */}
                <input 
                  type="checkbox"
                  checked={alarm.active}
                  onChange={() => handleToggleActive(alarm)}
                  onClick={(e) => e.stopPropagation()}
                  style={{ width: '14px', height: '14px', cursor: 'pointer' }}
                />
              </div>

              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                {alarm.start_point} → {alarm.end_point}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>목표 도착</span>
                <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--color-accent)' }}>
                  {alarm.target_arrival_time}
                </span>
              </div>

              {/* Edit/Delete mini buttons */}
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '12px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '8px' }}>
                <button 
                  onClick={(e) => { e.stopPropagation(); openEditModal(alarm); }}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.7rem' }}
                >
                  수정
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); handleDelete(alarm.id, alarm.name); }}
                  style={{ background: 'none', border: 'none', color: 'var(--color-impossible)', cursor: 'pointer', fontSize: '0.7rem' }}
                >
                  삭제
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Selected Alarm Status Detail */}
      {selectedAlarmId && activeAlarmObj && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Countdown & Departure Status Card */}
          <div className="glass-card" style={{ padding: '24px 20px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
            <div style={{
              position: 'absolute',
              top: '-20px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '150px',
              height: '150px',
              borderRadius: '50%',
              background: activeAlarmObj.active ? 'var(--color-primary)' : 'var(--text-muted)',
              filter: 'blur(70px)',
              opacity: 0.2,
              zIndex: 0
            }} />

            <div style={{ position: 'relative', zIndex: 1 }}>
              <div className="signal-badge signal-stable" style={{ background: activeAlarmObj.active ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255,255,255,0.05)', color: activeAlarmObj.active ? 'var(--color-primary)' : 'var(--text-muted)', marginBottom: '14px' }}>
                <span className="signal-dot" style={{ background: activeAlarmObj.active ? 'var(--color-primary)' : 'var(--text-muted)' }} />
                <span>{activeAlarmObj.active ? '알람 작동 중' : '비활성화됨'}</span>
              </div>

              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '6px' }}>{activeAlarmObj.name}</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '20px' }}>
                {activeAlarmObj.start_point} → {activeAlarmObj.end_point}
              </p>

              {alarmStatus ? (
                <>
                  {/* Countdown display */}
                  <div style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-1px', margin: '12px 0', color: '#fff', lineHeight: 1.2 }}>
                    {detailDepartureCountdown > 0 ? (
                      formatCountdown(detailDepartureCountdown)
                    ) : (
                      <span style={{ color: 'var(--color-impossible)' }}>출발 시간 초과!</span>
                    )}
                  </div>
                  
                  {detailDepartureCountdown > 0 ? (
                    <p style={{ color: '#fff', fontSize: '1rem', fontWeight: '700', margin: '12px 0 20px 0' }}>
                      {formatDepartureTimeKorean(detailDepartureTimeStr)}에 출발해야 합니다. (출발까지 {Math.floor(detailDepartureCountdown / 60)}분 남음)
                    </p>
                  ) : (
                    <p style={{ color: 'var(--color-impossible)', fontSize: '0.95rem', fontWeight: '700', margin: '12px 0 20px 0' }}>
                      도착 시간을 지킬 수 없습니다. 서둘러 이동해야 합니다.
                    </p>
                  )}

                  {/* Details grid */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '12px',
                    textAlign: 'left',
                    background: 'rgba(0,0,0,0.15)',
                    padding: '16px',
                    borderRadius: '12px',
                    border: '1px solid rgba(255,255,255,0.03)'
                  }}>
                    <div>
                      <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '4px' }}>목표 도착 시각</span>
                      <strong style={{ fontSize: '0.95rem', color: 'var(--color-accent)' }}>{activeAlarmObj.target_arrival_time}</strong>
                    </div>
                    <div>
                      <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '4px' }}>소요 시간 (최적 대중교통)</span>
                      <strong style={{ fontSize: '0.95rem', color: '#fff' }}>{formatDuration(detailTotalTravelTime)}</strong>
                    </div>
                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px', marginTop: '4px' }}>
                      <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '4px' }}>역산 출발 권장 시각</span>
                      <strong style={{ fontSize: '0.95rem', color: '#fff' }}>{formatDepartureTimeKorean(detailDepartureTimeStr)} ({detailDepartureTimeStr})</strong>
                    </div>
                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px', marginTop: '4px' }}>
                      <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '4px' }}>출발 전 알림 시각</span>
                      <strong style={{ fontSize: '0.95rem', color: 'var(--color-primary)' }}>{detailAlertTimeStr} ({alarmStatus.buffer_time ?? activeAlarmObj.buffer_time}분 전)</strong>
                    </div>
                  </div>
                </>
              ) : (
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>실시간 역산 경로 상태를 계산하고 있습니다...</p>
              )}
            </div>
          </div>

          {/* Route Selector Tabs */}
          {alarmStatus && hasMultipleDetailRoutes && (
            <div className="glass-card" style={{ padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                🛤️ 대중교통 경로 선택 (계단/터널 우회 및 최소 도보 비교)
              </h4>
              <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                {detailRoutes.map((r, idx) => {
                  const isSelected = selectedDetailRouteIdx === idx;
                  const walkDistance = r.total_walk_distance || r.legs.filter(l => l.mode === 'WALK').reduce((sum, l) => sum + l.distance, 0);
                  
                  let highlightTag = '';
                  if (idx === 0) highlightTag = '추천';
                  else if (walkDistance < 400) highlightTag = '최소 도보 (계단 회피)';
                  
                  return (
                    <div 
                      key={idx}
                      onClick={() => setSelectedDetailRouteIdx(idx)}
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

          {/* Recommended Route Details for the alarm */}
          {alarmStatus && currentDetailRoute && (
            <div className="glass-card" style={{ padding: '20px 16px' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '16px' }}>
                🚇 추천 대중교통 경로 타임라인
              </h3>

              {/* Legs timeline rendering */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0px', position: 'relative' }}>
                {currentDetailRoute.legs.map((leg, li) => {
                  const isLast = li === currentDetailRoute.legs.length - 1;
                  const isExpanded = !!expandedLegs[li];
                  
                  if (leg.mode === 'WALK') {
                    const walkRouteText = leg.start_name && leg.end_name
                      ? `${leg.start_name} → ${leg.end_name}`
                      : (leg.start_name ? `${leg.start_name}에서 출발` : (leg.end_name ? `${leg.end_name}까지 이동` : '도보 이동'));

                    return (
                      <div key={li} style={{ display: 'flex', gap: '12px', alignItems: 'stretch', minHeight: '44px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '20px', flexShrink: 0 }}>
                          <div style={{
                            width: '10px', height: '10px', borderRadius: '50%',
                            background: 'var(--text-muted)', border: '2px solid rgba(255,255,255,0.15)',
                            flexShrink: 0, marginTop: '4px'
                          }} />
                          {!isLast && <div style={{ width: '2px', flex: 1, background: 'rgba(255,255,255,0.08)', marginTop: '2px' }} />}
                        </div>
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
                    const color = leg.route_color ? `#${leg.route_color}` : (leg.mode === 'SUBWAY' ? '#6366f1' : '#10b981');
                    const icon = leg.mode === 'SUBWAY' ? '🚇' : '🚌';
                    return (
                      <div key={li} style={{ display: 'flex', gap: '12px', alignItems: 'stretch', minHeight: '70px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '20px', flexShrink: 0 }}>
                          <div style={{
                            width: '12px', height: '12px', borderRadius: '50%',
                            background: color, boxShadow: `0 0 8px ${color}60`,
                            flexShrink: 0, marginTop: '4px'
                          }} />
                          {!isLast && <div style={{ width: '3px', flex: 1, background: color, opacity: 0.4, marginTop: '2px' }} />}
                        </div>
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

                          {/* Station list dropdown */}
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
        </div>
      )}

      {/* Add / Edit Alarm Modal */}
      {showFormModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 900,
          padding: '16px'
        }}>
          <div className="glass-card" style={{
            width: '100%',
            maxWidth: '480px',
            padding: '24px',
            maxHeight: '90vh',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#fff' }}>
                {editMode ? '알람 설정 변경' : '출발 시간 역산 알람 등록'}
              </h3>
              <button 
                type="button"
                onClick={() => setShowFormModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem' }}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateOrUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">알람 이름</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={alarmName} 
                  onChange={e => setAlarmName(e.target.value)} 
                  placeholder="예: 월요일 출근, 소웨공 수업" 
                  required
                />
              </div>

              {/* Start point POI Search */}
              <div className="form-group">
                <label className="form-label">출발지 위치</label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'stretch' }}>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={startPoint} 
                    onChange={e => setStartPoint(e.target.value)} 
                    placeholder="출발지를 입력하거나 검색해 주세요" 
                    style={{ flex: 1, margin: 0 }}
                    required
                  />
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={() => { setSearchTarget('start'); setShowSearchModal(true); }}
                    style={{ flex: '0 0 auto', width: 'auto', padding: '0 16px', fontSize: '0.85rem', whiteSpace: 'nowrap', borderRadius: '10px', margin: 0 }}
                  >
                    검색
                  </button>
                </div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '4px', display: 'block' }}>
                  좌표: {startLat.toFixed(4)}, {startLon.toFixed(4)}
                </span>
              </div>

              {/* End point POI Search */}
              <div className="form-group">
                <label className="form-label">목적지 위치</label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'stretch' }}>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={endPoint} 
                    onChange={e => setEndPoint(e.target.value)} 
                    placeholder="목적지를 입력하거나 검색해 주세요" 
                    style={{ flex: 1, margin: 0 }}
                    required
                  />
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={() => { setSearchTarget('end'); setShowSearchModal(true); }}
                    style={{ flex: '0 0 auto', width: 'auto', padding: '0 16px', fontSize: '0.85rem', whiteSpace: 'nowrap', borderRadius: '10px', margin: 0 }}
                  >
                    검색
                  </button>
                </div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '4px', display: 'block' }}>
                  좌표: {endLat.toFixed(4)}, {endLon.toFixed(4)}
                </span>
              </div>

              {/* Time select */}
              <div className="form-group">
                <label className="form-label">도착해야 하는 시각 (목표 도착 시간)</label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <select
                    className="form-input"
                    value={targetHour}
                    onChange={e => setTargetArrivalTime(`${e.target.value}:${targetMin}`)}
                    style={{ flex: 1, background: '#111827', margin: 0 }}
                  >
                    {Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0')).map(h => (
                      <option key={h} value={h}>{h}시</option>
                    ))}
                  </select>
                  <span style={{ color: 'var(--text-secondary)' }}>:</span>
                  <select
                    className="form-input"
                    value={targetMin}
                    onChange={e => setTargetArrivalTime(`${targetHour}:${e.target.value}`)}
                    style={{ flex: 1, background: '#111827', margin: 0 }}
                  >
                    {Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0')).map(m => (
                      <option key={m} value={m}>{m}분</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Path recommendation trigger */}
              <div className="form-group">
                <label className="form-label">대중교통 경로 추천 및 노선 설정</label>
                <button
                  type="button"
                  onClick={handleRecommendRoute}
                  disabled={recommending}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1.5px dashed rgba(99, 102, 241, 0.5)',
                    background: 'rgba(99, 102, 241, 0.08)',
                    color: 'var(--color-primary)',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: recommending ? 'wait' : 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  🔍 {recommending ? '최적 대중교통 경로 탐색 중...' : '출발지 → 목적지 추천 경로 탐색'}
                </button>
              </div>

              {/* Recommended Route in Modal */}
              {recommendedRoutes && recommendedRoutes.length > 0 && (
                <div style={{
                  background: 'rgba(0,0,0,0.2)',
                  border: '1px solid rgba(255,255,255,0.05)',
                  borderRadius: '10px',
                  padding: '12px'
                }}>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 600 }}>
                    🚌 추천 경로 목록 (경로 선택 시 노선 정보가 반영됩니다)
                  </p>
                  
                  <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '6px', marginBottom: '8px' }}>
                    {recommendedRoutes.map((r, idx) => {
                      const isSelected = selectedRouteIdx === idx;
                      const walkDistance = r.total_walk_distance || r.legs.filter(l => l.mode === 'WALK').reduce((sum, l) => sum + l.distance, 0);
                      
                      let badgeText = '';
                      if (idx === 0) badgeText = '최단시간';
                      else if (walkDistance < 400) badgeText = '최소도보';
                      
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => selectRoute(idx)}
                          style={{
                            flex: '0 0 auto',
                            padding: '10px 14px',
                            borderRadius: '12px',
                            border: isSelected ? '1.5px solid var(--color-primary)' : '1px solid rgba(255,255,255,0.08)',
                            background: isSelected ? 'rgba(99,102,241,0.12)' : 'rgba(255,255,255,0.03)',
                            color: isSelected ? '#fff' : 'var(--text-secondary)',
                            textAlign: 'left',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '4px',
                            transition: 'all 0.2s ease',
                            minWidth: '130px'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                            <span style={{ fontSize: '0.82rem', fontWeight: 800 }}>{formatDuration(r.total_time)}</span>
                            {badgeText && (
                              <span style={{
                                fontSize: '0.58rem',
                                padding: '1px 4px',
                                borderRadius: '4px',
                                background: idx === 0 ? 'var(--color-primary)' : 'var(--color-stable)',
                                color: '#fff',
                                fontWeight: 700
                              }}>
                                {badgeText}
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '0.68rem', opacity: 0.8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '110px' }}>
                            {r.transit_line}
                          </div>
                          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                            도보 {Math.round(walkDistance)}m
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {recommendedRoutes[selectedRouteIdx] && (
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                      대표 노선: <span style={{ color: 'var(--color-accent)', fontWeight: 600 }}>{recommendedRoutes[selectedRouteIdx].transit_line}</span> ({recommendedRoutes[selectedRouteIdx].transit_type === 'subway' ? '지하철' : '버스'})
                    </div>
                  )}
                </div>
              )}

              {/* Transit configuration */}
              <div style={{ display: 'flex', gap: '12px' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">대표 대중교통 종류</label>
                  <select 
                    className="form-input" 
                    value={transitType} 
                    onChange={e => setTransitType(e.target.value)}
                    style={{ background: '#111827' }}
                  >
                    <option value="bus">버스</option>
                    <option value="subway">지하철</option>
                  </select>
                </div>

                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">노선 번호/이름</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={transitLine} 
                    onChange={e => setTransitLine(e.target.value)} 
                    placeholder="예: 8100, 신분당선" 
                    required
                  />
                </div>
              </div>

              {/* Buffer and active toggles */}
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">사전 출발 알람 시간 (분)</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    value={bufferTime} 
                    onChange={e => setBufferTime(e.target.value)} 
                    min="0"
                    max="60"
                    required
                  />
                </div>

                <div className="form-group" style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px' }}>
                  <input 
                    type="checkbox" 
                    id="modalActive"
                    checked={active} 
                    onChange={e => setActive(e.target.checked)}
                    style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                  />
                  <label htmlFor="modalActive" style={{ fontSize: '0.85rem', color: 'var(--text-primary)', cursor: 'pointer' }}>
                    알람 작동 활성화
                  </label>
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ marginTop: '10px' }}>
                {editMode ? '알람 수정 저장' : '새로운 알람 등록'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* POI Search Sub-modal inside Form */}
      {showSearchModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: '16px'
        }}>
          <div className="glass-card" style={{
            width: '100%',
            maxWidth: '440px',
            padding: '20px',
            maxHeight: '75vh',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ fontSize: '1rem', fontWeight: '700', color: '#fff' }}>
                {searchTarget === 'start' ? '출발지' : '목적지'} 위치 검색
              </h4>
              <button 
                type="button"
                onClick={() => { setShowSearchModal(false); setSearchResults([]); setSearchQuery(''); }}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem' }}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSearchPOI} style={{ display: 'flex', gap: '8px', alignItems: 'stretch' }}>
              <input 
                type="text" 
                className="form-input" 
                value={searchQuery} 
                onChange={e => setSearchQuery(e.target.value)} 
                placeholder="검색어 입력 (예: 정자역, 판교 테크노밸리)"
                style={{ flex: 1, margin: 0 }}
                autoFocus
                required
              />
              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ flex: '0 0 auto', width: 'auto', padding: '0 16px', fontSize: '0.82rem', margin: 0 }} 
                disabled={searching}
              >
                {searching ? '검색 중' : '검색'}
              </button>
            </form>

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {searching ? (
                <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem', padding: '15px 0' }}>검색 중...</p>
              ) : searchResults.length === 0 ? (
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', padding: '15px 0' }}>
                  검색 결과가 없습니다.
                </p>
              ) : (
                searchResults.map((poi, idx) => (
                  <button 
                    key={idx}
                    type="button"
                    onClick={() => selectPOI(poi)}
                    style={{
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.05)',
                      borderRadius: '8px',
                      padding: '10px 12px',
                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                  >
                    <div style={{ color: '#fff', fontWeight: '600', fontSize: '0.85rem' }}>{poi.name}</div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.72rem' }}>{poi.address}</div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
