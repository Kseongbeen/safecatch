{"step_index":0,"source":"USER_EXPLICIT","type":"USER_INPUT","status":"DONE","created_at":"2026-05-26T12:45:48Z","content":"<USER_REQUEST>\n혹시 네이버 지도 같은 거 보면 막 계단 회피라던가 터널 회피 이런 거 있잖아 경로 추천에 보면. 그런 것처럼 경로를 많이 띄울 수 있을까 물론 api가 1일 10회긴 한데..\n</USER_REQUEST>\n<ADDITIONAL_METADATA>\nThe current local time is: 2026-05-26T21:45:48+09:00.\n\nThe user's current state is as follows:\nActive Document: c:\\Users\\5174k\\OneDrive\\바탕 화면\\26_1\\소프트웨어공학\\소웨공 과제\\safecatch\\start.bat (LANGUAGE_UNSPECIFIED)\nCursor is on line: 1\nOther open documents:\n- c:\\Users\\5174k\\OneDrive\\바탕 화면\\26_1\\소프트웨어공학\\소웨공 과제\\safecatch\\start.bat (LANGUAGE_UNSPECIFIED)\n- c:\\Users\\5174k\\OneDrive\\바탕 화면\\26_1\\소프트웨어공학\\소웨공 과제\\safecatch\\backend\\.env (LANGUAGE_UNSPECIFIED)\n- c:\\Users\\5174k\\OneDrive\\바탕 화면\\26_1\\소프트웨어공학\\소웨공 과제\\safecatch\\backend\\test_tmap_transit_details.py (LANGUAGE_PYTHON)\n- c:\\Users\\5174k\\OneDrive\\바탕 화면\\26_1\\소프트웨어공학\\소웨공 과제\\safecatch\\backend\\test_tmap_transit.py (LANGUAGE_PYTHON)\n- c:\\Users\\5174k\\OneDrive\\바탕 화면\\26_1\\소프트웨어공학\\소웨공 과제\\safecatch\\backend\\app\\main.py (LANGUAGE_PYTHON)\n</ADDITIONAL_METADATA>\n<USER_SETTINGS_CHANGE>\nThe user changed setting `Model Selection` from None

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

useEffect(() => {
// Fetch initial profile
fetchProfile();

// Set up polling for real-time transit status (every 1 second)
const interval = setInterval(fetchTransitStatus, 1000);
return () => clearInterval(interval);
{"step_index":39,"source":"MODEL","type":"PLANNER_RESPONSE","status":"DONE","created_at":"2026-05-26T12:48:00Z","content":"I will view `TripAlarms.jsx` around line 365 to see how route recommendations are queried and displayed when creating or editing a trip alarm.","tool_calls":[{"name":"view_file","args":{"AbsolutePath":"\"c:\\\\Users\\\\5174k\\\\OneDrive\\\\바탕 화면\\\\26_1\\\\소프트웨어공학\\\\소웨공 과제\\\\safecatch\\\\frontend\\\\src\\\\pages\\\\TripAlarms.jsx\"","EndLine":"450","StartLine":"340","toolAction":"\"Viewing recommend-route usage in TripAlarms.jsx\"","toolSummary":"\"View TripAlarms.jsx\""}}]}
{"step_index":40,"source":"MODEL","type":"VIEW_FILE","status":"DONE","created_at":"2026-05-26T12:48:01Z","content":"Created At: 2026-05-26T12:48:01Z\nCompleted At: 2026-05-26T12:48:01Z\nFile Path: `file:///c:/Users/5174k/OneDrive/%EB%B0%94%ED%83%95%20%ED%99%94%EB%A9%B4/26_1/%EC%86%8C%ED%94%84%ED%8A%B8%EC%9B%A8%EC%96%B4%EA%B3%B5%ED%95%99/%EC%86%8C%EC%9B%A8%EA%B3%B5%20%EA%B3%BC%EC%A0%9C/safecatch/frontend/src/pages/TripAlarms.jsx`\nTotal Lines: 1135\nTotal Bytes: 48132\nShowing lines 1 to 800\nThe following code has been modified to include a line number before every line, in the format: <line_number>: <original_line>. Please note that any changes targeting the original code s

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
// MISSING LINE 61
// MISSING LINE 62
// MISSING LINE 63
// MISSING LINE 64
// MISSING LINE 65
// MISSING LINE 66
// MISSING LINE 67
// MISSING LINE 68
// MISSING LINE 69
// MISSING LINE 70
// MISSING LINE 71
// MISSING LINE 72
// MISSING LINE 73
// MISSING LINE 74
// MISSING LINE 75
// MISSING LINE 76
// MISSING LINE 77
// MISSING LINE 78
// MISSING LINE 79
// MISSING LINE 80
// MISSING LINE 81
// MISSING LINE 82
// MISSING LINE 83
// MISSING LINE 84
// MISSING LINE 85
// MISSING LINE 86
// MISSING LINE 87
// MISSING LINE 88
// MISSING LINE 89
// MISSING LINE 90
// MISSING LINE 91
// MISSING LINE 92
// MISSING LINE 93
// MISSING LINE 94
// MISSING LINE 95
// MISSING LINE 96
// MISSING LINE 97
// MISSING LINE 98
// MISSING LINE 99
// MISSING LINE 100
// MISSING LINE 101
// MISSING LINE 102
// MISSING LINE 103
// MISSING LINE 104
// MISSING LINE 105
// MISSING LINE 106
// MISSING LINE 107
// MISSING LINE 108
// MISSING LINE 109
// MISSING LINE 110
// MISSING LINE 111
// MISSING LINE 112
// MISSING LINE 113
// MISSING LINE 114
// MISSING LINE 115
// MISSING LINE 116
// MISSING LINE 117
// MISSING LINE 118
// MISSING LINE 119
// MISSING LINE 120
// MISSING LINE 121
// MISSING LINE 122
// MISSING LINE 123
// MISSING LINE 124
// MISSING LINE 125
// MISSING LINE 126
// MISSING LINE 127
// MISSING LINE 128
// MISSING LINE 129
// MISSING LINE 130
// MISSING LINE 131
// MISSING LINE 132
// MISSING LINE 133
// MISSING LINE 134
// MISSING LINE 135
// MISSING LINE 136
// MISSING LINE 137
// MISSING LINE 138
// MISSING LINE 139
// MISSING LINE 140
// MISSING LINE 141
// MISSING LINE 142
// MISSING LINE 143
// MISSING LINE 144
// MISSING LINE 145
// MISSING LINE 146
// MISSING LINE 147
// MISSING LINE 148
// MISSING LINE 149
// MISSING LINE 150
// MISSING LINE 151
// MISSING LINE 152
// MISSING LINE 153
// MISSING LINE 154
// MISSING LINE 155
// MISSING LINE 156
// MISSING LINE 157
// MISSING LINE 158
// MISSING LINE 159
};
}
};

const feat = getFeasibilityStyles(status?.status_code);

// Map Animation Calculations
// Let's draw a nice interactive pathway
// User walk progress: from 0 (home) to 1 (stop)
// Stop position: 85% of width.
// User position: based on how much time is left relative to the transit remaining.
// Actually, we can make it simpler and super interactive:
// If transit_remaining_seconds is, say, 15 minutes, we show the bus approaching the stop.
// User starts at Home (left) and should arrive at stop by the time transit arrives.
// Let's compute percentages:
// Bus position: approaching stop (from right 100% to stop 85%).
// User position: walks from 15% (Home) to 85% (Stop).
// If user leaves now, progress is based on time elapsed since departure.
const walkTimeTotal = status?.user_walk_time_seconds || 400;
const transitTimeTotal = status?.transit_remaining_seconds || 900;

// Calculate Bus progress (100% is far right, 0% is at stop)
const busProgress = Math.max(0, Math.min(1, transitTimeTotal / 900)); // normalized to 15 min max
const busX = 85 + (busProgress * 12); // from 85% (arrived) to 97% (far right)

// Calculate User progress:
// Let's make user progress animated for the visual.
// If departure_countdown is 0, user has to be at the station.
// If departure_countdown is positive, user is at home.
// If departure_countdown is negative, user is walking.
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
// MISSING LINE 203
// MISSING LINE 204
// MISSING LINE 205
// MISSING LINE 206
// MISSING LINE 207
// MISSING LINE 208
// MISSING LINE 209
// MISSING LINE 210
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
const userX = 15 + (userProgress * 70); // from 15% (ho

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
borderR
// MISSING LINE 283
// MISSING LINE 284
// MISSING LINE 285
}}
>
초기화
</button>
)}
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
</di
</div>
)}

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
<span>{status?.is_trip_alarm ? (departureCountdown > 0 ? "출발 대기" : "지금 즉시 출발!") : feat.text}</span>
</div>

<div style={{ fontSize: '3rem', fontWeight: 800, letterSpacing: '-1px', margin: '8px 0', lineHeight: 1 }}>
{status ? (
status.is_trip_alarm ? (
departureCountdown > 0 ? (
formatTime(departureCountdown)
) : (
// MISSING LINE 361
// MISSING LINE 362
// MISSING LINE 363
// MISSING LINE 364
// MISSING LINE 365
// MISSING LINE 366
// MISSING LINE 367
// MISSING LINE 368
// MISSING LINE 369
// MISSING LINE 370
// MISSING LINE 371
// MISSING LINE 372
// MISSING LINE 373
)}
</p>

<p style={{ fontSize: '0.9rem', color: '#fff', fontWeight: '500', marginBottom: '8px' }}>
{status?.is_trip_alarm ? (
departureCountdown > 0 ? (
`목표 도착 시간을 위해 ${formatDepartureTimeKorean(departureTimeStr)}에 출발해야 합니다. (출발까지 ${Math.floor(departureCountdown / 60)}분 남음)`
) : (
"🚨 출발 시각이 지났습니다! 지각 위험이 있으니 지금 즉시 출발하십시오."
)
) : (
departureCountdown > 0 ? (
`대중교통 탑승을 위해 ${formatDepartureTimeKorean(departureTimeStr)}에 출발해야 합니다. (출발까지 ${Math.floor(departureCountdown / 60)}분 남음)`
) : (
feat.desc
)
)}
</p>
</div>
</div>

{/* Route Selector Tabs */}
{status?.is_trip_alarm && hasMultipleRoutes && (
<div className="glass-card" style={{ padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
<h2 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
🛤️ 대중교통 경로 선택 (계단/터널 우회 및 최소 도보 비교)
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
color: 'var(--text-secondary)',
textAlign: 'center'
}}>
ℹ️ 현재 <strong>도착 알람 모드</strong>가 활성화되어 있습니다.<br />
목표 시간인 <strong>{status.target_arrival_time}</strong>에 늦지 않도록 출발 시간을 엄수해 주세요.
</div>
</div>
) : (
<div style={{ display: 'flex', gap: '12px' }}>
<button
onClick={handleLate}
className="btn btn-secondary"
style={{ flex: 1, padding: '14px 10px', fontSize: '0.9rem' }}
>
<svg style={{ width: '18px', height: '18px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
</svg>
늦음! 다음 배차 받기
</button>
</div>
)}
</div>
);
}

// MISSING LINE 441
// MISSING LINE 442
// MISSING LINE 443
// MISSING LINE 444
// MISSING LINE 445
// MISSING LINE 446
// MISSING LINE 447
// MISSING LINE 448
// MISSING LINE 449
// MISSING LINE 450
// MISSING LINE 451
// MISSING LINE 452
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
// MISSING LINE 501
// MISSING LINE 502
// MISSING LINE 503
// MISSING LINE 504
// MISSING LINE 505
// MISSING LINE 506
// MISSING LINE 507
// MISSING LINE 508
// MISSING LINE 509
// MISSING LINE 510
// MISSING LINE 511
// MISSING LINE 512
// MISSING LINE 513
// MISSING LINE 514
// MISSING LINE 515
// MISSING LINE 516
// MISSING LINE 517
// MISSING LINE 518
// MISSING LINE 519

{/* Recommended Route Details for the alarm */}
{status?.is_trip_alarm && status?.routes && status.routes.length > 0 && (
<div className="glass-card" style={{ padding: '20px 16px' }}>
<h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '16px' }}>
🚇 상세 이동 경로 정보
</h3>

{/* Legs timeline rendering */}
<div style={{ display: 'flex', flexDirection: 'column', gap: '0px', position: 'relative' }}>
{status.routes[0].legs.map((leg, li) => {
const isLast = li === status.routes[0].legs.length - 1;
const isExpanded = !!expandedLegs[li];

const formatDuration = (seconds) => {
const mins = Math.floor(seconds / 60);
if (mins < 60) return `${mins}분`;
const hrs = Math.floor(mins / 60);
const rem = mins % 60;
return rem > 0 ? `${hrs}시간 ${rem}분` : `${hrs}시간`;
};

if (leg.mode === 'WALK') {
const walkRouteText = leg.start_name && leg.end_name
? `${leg.start_name} → ${leg.end_name}`
: (leg.start_name ? `${leg.start_n
// MISSING LINE 546
// MISSING LINE 547
// MISSING LINE 548
// MISSING LINE 549
// MISSING LINE 550
// MISSING LINE 551
// MISSING LINE 552
// MISSING LINE 553
// MISSING LINE 554
// MISSING LINE 555
// MISSING LINE 556
// MISSING LINE 557
// MISSING LINE 558
// MISSING LINE 559
// MISSING LINE 560
// MISSING LINE 561
// MISSING LINE 562
// MISSING LINE 563
// MISSING LINE 564
// MISSING LINE 565
// MISSING LINE 566
// MISSING LINE 567
// MISSING LINE 568
// MISSING LINE 569
// MISSING LINE 570
// MISSING LINE 571
// MISSING LINE 572
// MISSING LINE 573
// MISSING LINE 574
// MISSING LINE 575
// MISSING LINE 576
// MISSING LINE 577
// MISSING LINE 578
// MISSING LINE 579
// MISSING LINE 580
// MISSING LINE 581
// MISSING LINE 582
// MISSING LINE 583
// MISSING LINE 584
// MISSING LINE 585
// MISSING LINE 586
// MISSING LINE 587
// MISSING LINE 588
// MISSING LINE 589
// MISSING LINE 590
// MISSING LINE 591
// MISSING LINE 592

const formatDuration = (seconds) => {
const mins = Math.floor(seconds / 60);
if (mins < 60) return `${mins}분`;
const hrs = Math.floor(mins / 60);
const rem = mins % 60;
return rem > 0 ? `${hrs}시간 ${rem}분` : `${hrs}시간`;
};

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
// MISSING LINE 621
// MISSING LINE 622
// MISSING LINE 623
// MISSING LINE 624
// MISSING LINE 625
// MISSING LINE 626
// MISSING LINE 627
// MISSING LINE 628
// MISSING LINE 629
)}
</span>
</div>

<div style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }} />

<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
<span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>사전 알람 설정</span>
<span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
{status?.is_trip_alarm ? (
`출발 ${alertCountdown > 0 ? Math.round(alertCountdown / 60) : 0}분 전 알림`
) : (
`출발 ${profile?.buffer_time}분 전 알림`
)}
</span>
</div>
</div>
</div>

{/* Recommended Route Details for the alarm */}
{status?.is_trip_alarm && currentRoute && (
<div className="glass-card" style={{ padding: '20px 16px' }}>
<h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '16px' }}>
🚇 상세 이동 경로 정보
</h3>

{/* Legs timeline rendering */}
<div style={{ display: 'flex', flexDirection: 'column', gap: '0px', position: 'relative' }}>
{currentRoute.legs.map((leg, li) => {
const isLast = li === currentRoute.legs.length - 1;
const isExpanded = !!expandedLegs[li];

const formatDuration = (seconds) => {
const mins = Math.floor(seconds / 60);
if (mins < 60) return `${mins}분`;
const hrs = Math.floor(mins / 60);
const rem = mins % 60;
return rem > 0 ? `${hrs}시간 ${rem}분` : `${hrs}시간`;
};

if (leg.mode === 'WALK') {
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
) : (
<div style={{ display: 'flex', gap: '12px' }}>
<button
onClick={handleLate}
className="btn btn-secondary"
style={{ flex: 1, padding: '14px 10px', fontSize: '0.9rem' }}
>
<svg style={{ width: '18px', height: '18px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
</svg>
늦음! 다음 배차 받기
</button>
</div>
)}
</div>
);
}

// MISSING LINE 699
// MISSING LINE 700
// MISSING LINE 701
// MISSING LINE 702
// MISSING LINE 703
// MISSING LINE 704
// MISSING LINE 705
// MISSING LINE 706
// MISSING LINE 707
// MISSING LINE 708
// MISSING LINE 709
// MISSING LINE 710
// MISSING LINE 711
// MISSING LINE 712
// MISSING LINE 713
// MISSING LINE 714
// MISSING LINE 715
// MISSING LINE 716
// MISSING LINE 717
// MISSING LINE 718
// MISSING LINE 719
// MISSING LINE 720
// MISSING LINE 721
// MISSING LINE 722
// MISSING LINE 723
// MISSING LINE 724
// MISSING LINE 725
// MISSING LINE 726
// MISSING LINE 727
// MISSING LINE 728
// MISSING LINE 729
// MISSING LINE 730
// MISSING LINE 731
// MISSING LINE 732
// MISSING LINE 733
// MISSING LINE 734
// MISSING LINE 735
// MISSING LINE 736
// MISSING LINE 737
// MISSING LINE 738
// MISSING LINE 739
// MISSING LINE 740
// MISSING LINE 741
// MISSING LINE 742
// MISSING LINE 743
// MISSING LINE 744
// MISSING LINE 745
// MISSING LINE 746
// MISSING LINE 747
// MISSING LINE 748
// MISSING LINE 749
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
{leg.stations.map((st, sidx) => {
const isTransfer = false; // Mock/Placeholder for future
return (
<div key={sidx} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
<span style={{
width: '6px', height: '6px', borderRadius: '50%',
background: (sidx === 0 || sidx === leg.stations.length - 1) ? color : 'var(--text-muted)'
}} />
<span style={{
fontWeight: (sidx === 0 || sidx === leg.stations.length - 1) ? 'bold' : 'normal',

// MISSING LINE 773
// MISSING LINE 774
// MISSING LINE 775
// MISSING LINE 776
// MISSING LINE 777
// MISSING LINE 778
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
{status?.is_trip_alarm ? (
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
) : (
<div style={{ display: 'flex', gap: '12px' }}>
<button
onClick={handleLate}
className="btn btn-secondary"
style={{ flex: 1, padding: '14px 10px', fontSize: '0.9rem' }}
>
<svg style={{ width: '18px', height: '18px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
</svg>
늦음! 다음 배차 받기
</button>
</div>
)}
</div>
);
}

