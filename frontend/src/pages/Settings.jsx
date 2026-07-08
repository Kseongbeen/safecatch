import React, { useState, useEffect } from 'react';

const DAYS = ['월요일', '화요일', '수요일', '목요일', '금요일', '토요일', '일요일'];

export default function Settings({ token, profile, fetchProfile, showToast, logout }) {
  const [startPoint, setStartPoint] = useState('');
  const [startLat, setStartLat] = useState(37.382);
  const [startLon, setStartLon] = useState(127.118);
  const [endPoint, setEndPoint] = useState('');
  const [endLat, setEndLat] = useState(37.497);
  const [endLon, setEndLon] = useState(127.027);
  const [transitType, setTransitType] = useState('bus');
  const [transitLine, setTransitLine] = useState('');
  const [bufferTime, setBufferTime] = useState(5);
  const [nightSilent, setNightSilent] = useState(true);
  const [notifAgreed, setNotifAgreed] = useState(true);
  const [saving, setSaving] = useState(false);
  const [recommending, setRecommending] = useState(false);
  const [recommendedRoutes, setRecommendedRoutes] = useState(null);
  const [selectedRouteIdx, setSelectedRouteIdx] = useState(0);

  // Tmap POI Search UI states
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchTarget, setSearchTarget] = useState('start'); // 'start' or 'end'
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  // Routine schedule states
  const [routines, setRoutines] = useState([]);
  const [newDay, setNewDay] = useState(0);
  const [newTime, setNewTime] = useState('08:30');

  useEffect(() => {
    if (profile) {
      setStartPoint(profile.start_point);
      setStartLat(profile.start_lat ?? 37.382);
      setStartLon(profile.start_lon ?? 127.118);
      setEndPoint(profile.end_point);
      setEndLat(profile.end_lat ?? 37.497);
      setEndLon(profile.end_lon ?? 127.027);
      setTransitType(profile.transit_type);
      setTransitLine(profile.transit_line);
      setBufferTime(profile.buffer_time);
      setNightSilent(profile.night_silent);
      setNotifAgreed(profile.notification_agreed);
    }
    fetchRoutines();
  }, [profile]);

  const fetchRoutines = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/routines', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setRoutines(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch('http://localhost:8000/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          start_point: startPoint,
          start_lat: parseFloat(startLat),
          start_lon: parseFloat(startLon),
          end_point: endPoint,
          end_lat: parseFloat(endLat),
          end_lon: parseFloat(endLon),
          transit_type: transitType,
          transit_line: transitLine,
          buffer_time: parseInt(bufferTime),
          night_silent: nightSilent,
          notification_agreed: notifAgreed
        })
      });

      if (res.ok) {
        showToast("설정 완료", "사용자 맞춤 설정이 성공적으로 저장되었습니다.", "info");
        fetchProfile();
      } else {
        showToast("저장 실패", "설정 저장을 실패했습니다.", "alert");
      }
    } catch (err) {
      console.error(err);
      showToast("오류", "서버 연결에 실패했습니다.", "alert");
    } finally {
      setSaving(false);
    }
  };

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
      showToast('좌표 미설정', '출발지와 목적지를 먼저 검색하여 좌표를 설정해 주세요.', 'alert');
      return;
    }
    setRecommending(true);
    setRecommendedRoutes(null);
    setSelectedRouteIdx(0);
    try {
      const params = new URLSearchParams({
        start_lat: startLat, start_lon: startLon,
        end_lat: endLat, end_lon: endLon
      });
      const res = await fetch(`http://localhost:8000/api/transit/recommend-route?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTransitType(data.transit_type);
        setTransitLine(data.transit_line);
        if (data.routes && data.routes.length > 0) {
          setRecommendedRoutes(data.routes);
        }
        showToast('경로 추천 완료', `${data.routes?.length || 0}개의 경로를 찾았습니다!`, 'info');
      } else if (res.status === 403) {
        showToast('API 권한 없음', 'Tmap 대중교통 API 권한이 없습니다.', 'alert');
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

  const handleAddRoutine = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:8000/api/routines', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          day_of_week: parseInt(newDay),
          schedule_time: newTime,
          active: true
        })
      });
      if (res.ok) {
        showToast("루틴 추가 완료", "정기 출발 알림 일정이 추가되었습니다.", "info");
        fetchRoutines();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteRoutine = async (id) => {
    try {
      const res = await fetch(`http://localhost:8000/api/routines/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        showToast("루틴 삭제 완료", "알림 일정이 삭제되었습니다.", "info");
        fetchRoutines();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const [newTimeHour, newTimeMin] = (newTime || '08:30').split(':');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>맞춤 설정 및 관리</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
          사용자의 출발지, 목적지 정보 및 사전 출발 알림 기준을 사용자 지정합니다.
        </p>
      </div>

      {/* Main Profile Form */}
      <div className="glass-card" style={{ padding: '20px 16px' }}>
        <h2 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '16px' }}>
          위치 및 알림 기본 설정
        </h2>
        
        <form onSubmit={handleSaveProfile}>
          <div className="form-group">
            <label className="form-label">출발지 이름</label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'stretch' }}>
              <input 
                type="text" 
                className="form-input" 
                value={startPoint} 
                onChange={e => setStartPoint(e.target.value)} 
                placeholder="예: 집 (분당)" 
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
            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '4px', display: 'block' }}>
              위도: {startLat.toFixed(4)} / 경도: {startLon.toFixed(4)}
            </span>
          </div>

          <div className="form-group">
            <label className="form-label">목적지 이름</label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'stretch' }}>
              <input 
                type="text" 
                className="form-input" 
                value={endPoint} 
                onChange={e => setEndPoint(e.target.value)} 
                placeholder="예: 회사 (강남)" 
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
            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '4px', display: 'block' }}>
              위도: {endLat.toFixed(4)} / 경도: {endLon.toFixed(4)}
            </span>
          </div>

          {/* 경로 자동 추천 */}
          <div className="form-group">
            <label className="form-label">대중교통 노선 설정</label>
            <button
              type="button"
              onClick={handleRecommendRoute}
              disabled={recommending}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '10px',
                border: '1px dashed rgba(99, 102, 241, 0.5)',
                background: 'rgba(99, 102, 241, 0.08)',
                color: 'var(--color-primary)',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: recommending ? 'wait' : 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <span style={{ fontSize: '1.1rem' }}>🔍</span>
              {recommending ? '경로 분석 중...' : '출발지 → 목적지 최적 경로 자동 추천'}
            </button>
          </div>

          {/* 추천 경로 결과 표시 */}
          {recommendedRoutes && recommendedRoutes.length > 0 && (
            <div style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '14px',
              padding: '16px',
              marginBottom: '4px'
            }}>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '12px', fontWeight: 600 }}>
                🚌 추천 경로 {recommendedRoutes.length}건 — 경로를 선택하면 노선이 자동 적용됩니다
              </p>

              {/* Route tabs */}
              <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '6px', marginBottom: '14px' }}>
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

              {/* Selected route detail */}
              {(() => {
                const route = recommendedRoutes[selectedRouteIdx];
                if (!route) return null;
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0px', position: 'relative' }}>
                    {/* Summary bar */}
                    <div style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      marginBottom: '12px', padding: '8px 12px',
                      background: 'rgba(99,102,241,0.06)', borderRadius: '8px'
                    }}>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                        총 {formatDuration(route.total_time)} | 도보 {formatDuration(route.total_walk_time)} | 요금 {route.fare?.toLocaleString()}원
                      </span>
                    </div>

                    {/* Legs timeline */}
                    {route.legs.map((leg, li) => {
                      const isLast = li === route.legs.length - 1;
                      if (leg.mode === 'WALK') {
                        return (
                          <div key={li} style={{ display: 'flex', gap: '12px', alignItems: 'stretch', minHeight: '44px' }}>
                            {/* Timeline dot & line */}
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '20px', flexShrink: 0 }}>
                              <div style={{
                                width: '10px', height: '10px', borderRadius: '50%',
                                background: 'var(--text-muted)', border: '2px solid rgba(255,255,255,0.15)',
                                flexShrink: 0, marginTop: '4px'
                              }} />
                              {!isLast && <div style={{ width: '2px', flex: 1, background: 'rgba(255,255,255,0.08)', marginTop: '2px' }} />}
                            </div>
                            {/* Content */}
                            <div style={{ paddingBottom: isLast ? '0' : '10px', flex: 1 }}>
                              <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                                🚶 도보 {Math.round(leg.distance)}m ({formatDuration(leg.duration)})
                              </span>
                            </div>
                          </div>
                        );
                      } else {
                        const color = leg.route_color ? `#${leg.route_color}` : (leg.mode === 'SUBWAY' ? '#6366f1' : '#10b981');
                        const icon = leg.mode === 'SUBWAY' ? '🚇' : '🚌';
                        return (
                          <div key={li} style={{ display: 'flex', gap: '12px', alignItems: 'stretch', minHeight: '60px' }}>
                            {/* Timeline dot & line */}
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '20px', flexShrink: 0 }}>
                              <div style={{
                                width: '12px', height: '12px', borderRadius: '50%',
                                background: color, boxShadow: `0 0 8px ${color}60`,
                                flexShrink: 0, marginTop: '4px'
                              }} />
                              {!isLast && <div style={{ width: '3px', flex: 1, background: color, opacity: 0.4, marginTop: '2px' }} />}
                            </div>
                            {/* Content */}
                            <div style={{ paddingBottom: isLast ? '0' : '10px', flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
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
                              </div>
                              <div style={{ fontSize: '0.78rem', color: 'var(--text-primary)' }}>
                                <span style={{ fontWeight: 600 }}>{leg.board_station}</span>
                                <span style={{ color: 'var(--text-muted)', margin: '0 6px' }}>→</span>
                                <span style={{ fontWeight: 600 }}>{leg.alight_station}</span>
                              </div>
                              {leg.station_count > 2 && (
                                <details style={{ marginTop: '4px' }}>
                                  <summary style={{ fontSize: '0.7rem', color: 'var(--text-muted)', cursor: 'pointer' }}>
                                    경유 정거장 보기
                                  </summary>
                                  <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px', lineHeight: 1.6 }}>
                                    {leg.stations.join(' → ')}
                                  </p>
                                </details>
                              )}
                            </div>
                          </div>
                        );
                      }
                    })}
                  </div>
                );
              })()}
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">대중교통 종류</label>
              <select 
                className="form-input" 
                value={transitType} 
                onChange={e => {
                  setTransitType(e.target.value);
                  setTransitLine(e.target.value === 'bus' ? '8100' : '신분당선');
                }}
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

          <div className="form-group">
            <label className="form-label">출발 전 사전 알림 시간 (분)</label>
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

          <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '12px' }}>
            <input 
              type="checkbox" 
              id="nightSilent"
              checked={nightSilent} 
              onChange={e => setNightSilent(e.target.checked)}
              style={{ width: '16px', height: '16px', cursor: 'pointer' }}
            />
            <label htmlFor="nightSilent" style={{ fontSize: '0.85rem', color: 'var(--text-primary)', cursor: 'pointer' }}>
              야간 알림 제한 활성화 (21:00 ~ 08:00 무음)
            </label>
          </div>

          <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input 
              type="checkbox" 
              id="notifAgreed"
              checked={notifAgreed} 
              onChange={e => setNotifAgreed(e.target.checked)}
              style={{ width: '16px', height: '16px', cursor: 'pointer' }}
            />
            <label htmlFor="notifAgreed" style={{ fontSize: '0.85rem', color: 'var(--text-primary)', cursor: 'pointer' }}>
              출발 정보 푸시 알림 수신에 동의합니다
            </label>
          </div>

          <button type="submit" className="btn btn-primary" disabled={saving} style={{ marginTop: '12px' }}>
            {saving ? '저장 중...' : '맞춤 설정 변경 저장'}
          </button>
        </form>
      </div>

      {/* Routine Schedules */}
      <div className="glass-card" style={{ padding: '20px 16px' }}>
        <h2 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '16px' }}>
          루틴형 반복 알림 스케줄
        </h2>

        {/* Add Routine */}
        <form onSubmit={handleAddRoutine} style={{ display: 'flex', gap: '8px', marginBottom: '20px', alignItems: 'stretch' }}>
          <select 
            className="form-input" 
            value={newDay} 
            onChange={e => setNewDay(e.target.value)}
            style={{ flex: 1.2, background: '#111827', margin: 0 }}
          >
            {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
          </select>
          <select
            className="form-input"
            value={newTimeHour}
            onChange={e => setNewTime(`${e.target.value}:${newTimeMin}`)}
            style={{ flex: 1.2, background: '#111827', margin: 0 }}
          >
            {Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0')).map(h => (
              <option key={h} value={h}>{h}시</option>
            ))}
          </select>
          <span style={{ color: 'var(--text-secondary)', alignSelf: 'center' }}>:</span>
          <select
            className="form-input"
            value={newTimeMin}
            onChange={e => setNewTime(`${newTimeHour}:${e.target.value}`)}
            style={{ flex: 1.2, background: '#111827', margin: 0 }}
          >
            {Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0')).map(m => (
              <option key={m} value={m}>{m}분</option>
            ))}
          </select>
          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ flex: 0.8, width: 'auto', padding: '0 16px', fontSize: '0.85rem', borderRadius: '10px', margin: 0 }}
          >
            추가
          </button>
        </form>

        {/* Routine List */}
        {routines.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '10px 0' }}>
            등록된 루틴 알림 일정이 없습니다.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {routines.map(r => (
              <div key={r.id} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px 14px',
                background: 'rgba(255,255,255,0.03)',
                borderRadius: '10px',
                fontSize: '0.85rem'
              }}>
                <div>
                  <span style={{ fontWeight: '700', marginRight: '8px' }}>{DAYS[r.day_of_week]}</span>
                  <span style={{ color: 'var(--color-accent)' }}>{r.schedule_time} 출발</span>
                </div>
                <button 
                  onClick={() => handleDeleteRoutine(r.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--color-impossible)',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    fontWeight: '600'
                  }}
                >
                  삭제
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Logout button */}
      <button onClick={logout} className="btn btn-secondary" style={{ color: 'var(--color-impossible)' }}>
        로그아웃 (계정 전환)
      </button>
      {/* Tmap POI Search Modal */}
      {showSearchModal && (
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
          zIndex: 1000,
          padding: '16px'
        }}>
          <div className="glass-card" style={{
            width: '100%',
            maxWidth: '480px',
            padding: '24px',
            maxHeight: '80vh',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#fff' }}>
                {searchTarget === 'start' ? '출발지' : '목적지'} 위치 검색
              </h3>
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
                placeholder="검색어 입력 (예: 강남역, 정자역)"
                style={{ flex: 1, margin: 0 }}
                autoFocus
                required
              />
              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ flex: '0 0 auto', width: 'auto', padding: '0 20px', fontSize: '0.85rem', margin: 0 }} 
                disabled={searching}
              >
                {searching ? '검색 중' : '검색'}
              </button>
            </form>

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {searching ? (
                <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem', padding: '20px 0' }}>검색 중...</p>
              ) : searchResults.length === 0 ? (
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', padding: '20px 0' }}>
                  검색 결과가 없습니다.
                </p>
              ) : (
                searchResults.map((poi, idx) => (
                  <button 
                    key={idx}
                    type="button"
                    onClick={() => selectPOI(poi)}
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.05)',
                      borderRadius: '8px',
                      padding: '12px',
                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                  >
                    <div style={{ color: '#fff', fontWeight: '600', fontSize: '0.9rem' }}>{poi.name}</div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>{poi.address}</div>
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
