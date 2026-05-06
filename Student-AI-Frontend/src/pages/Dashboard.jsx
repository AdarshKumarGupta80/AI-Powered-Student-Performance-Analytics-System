import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { dashboardAPI, academicAPI } from '../api/api';
import { useAuth } from '../context/AuthContext';
import {
  BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts';

const PRIORITY = {
  CRITICAL: { bg: '#FEE2E2', border: '#FCA5A5', color: '#991B1B', dot: '#EF4444' },
  HIGH:     { bg: '#FEF3C7', border: '#FCD34D', color: '#92400E', dot: '#F59E0B' },
  MEDIUM:   { bg: '#EDE9FE', border: '#C4B5FD', color: '#4C1D95', dot: '#8B5CF6' },
  LOW:      { bg: '#D1FAE5', border: '#6EE7B7', color: '#064E3B', dot: '#10B981' },
};

function MetricCard({ label, value, sub, cardBg = '#F0FDF4', valueColor = '#1D9E75' }) {
  return (
    <div style={{
      background: cardBg,
      borderRadius: 14,
      padding: '18px 20px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    }}>
      <div style={{
        fontSize: 12, fontWeight: 600, color: '#6B7280',
        textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8,
      }}>{label}</div>
      <div style={{
        fontSize: 26, fontWeight: 700, lineHeight: 1, color: valueColor,
      }}>{value}</div>
      {sub && <div style={{
        fontSize: 13, color: '#6B7280', marginTop: 6,
      }}>{sub}</div>}
    </div>
  );
}

function SectionHeader({ children, color = '#374151' }) {
  return (
    <div style={{
      fontSize: 15, fontWeight: 700, color,
      margin: '28px 0 12px',
      paddingBottom: 8,
      borderBottom: '2px solid #E5E7EB',
    }}>{children}</div>
  );
}

function Btn({ label, color = '#1D9E75', onClick, loading, small }) {
  return (
    <button onClick={onClick} disabled={loading} style={{
      padding: small ? '7px 14px' : '10px 20px',
      fontSize: small ? 13 : 14, fontWeight: 600,
      background: loading ? '#D1D5DB' : color,
      color: '#fff', border: 'none',
      borderRadius: 10, cursor: loading ? 'not-allowed' : 'pointer',
      transition: 'all .15s',
    }}>
      {loading ? 'Loading...' : label}
    </button>
  );
}

const BAR_COLORS = ['#1D9E75','#EF9F27','#6366F1','#8B5CF6','#F59E0B','#3B82F6'];

export default function Dashboard() {
  const { id } = useParams();
  const { isTeacher, isStudent } = useAuth();
  const navigate = useNavigate();

  const [data,         setData]         = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState('');
  const [refreshing,   setRefreshing]   = useState(false);

  const [studyHours,   setStudyHours]   = useState('');
  const [studyDate,    setStudyDate]    = useState(new Date().toISOString().split('T')[0]);
  const [studySubject, setStudySubject] = useState('');
  const [studyRev,     setStudyRev]     = useState(false);
  const [savingStudy,  setSavingStudy]  = useState(false);
  const [studyMsg,     setStudyMsg]     = useState('');

  const load = async () => {
    try {
      const r = await dashboardAPI.get(id);
      setData(r.data);
      setError('');
    } catch {
      setError('Could not load dashboard. Make sure marks/attendance data exists.');
    } finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { load(); }, [id]);

  const handleRefresh = () => { setRefreshing(true); load(); };

  const handleLogStudy = async () => {
    if (!studyHours || parseFloat(studyHours) <= 0) {
      setStudyMsg('Enter valid study hours.'); return;
    }
    setSavingStudy(true); setStudyMsg('');
    try {
      await academicAPI.addStudySession(id, {
        subject: studySubject || 'General',
        date: studyDate,
        hoursStudied: parseFloat(studyHours),
        revisionSession: studyRev,
      });
      setStudyMsg('✓ Saved! Refreshing your predictions...');
      setStudyHours(''); setStudySubject(''); setStudyRev(false);
      setTimeout(() => { handleRefresh(); setStudyMsg(''); }, 1500);
    } catch {
      setStudyMsg('Failed to save. Try again.');
    } finally { setSavingStudy(false); }
  };

  if (loading) return (
    <div style={{ padding: '60px 0', textAlign: 'center',
                  fontSize: 16, color: '#6B7280' }}>
      Loading dashboard...
    </div>
  );

  if (error) return (
    <div style={{
      padding: '20px 24px', background: '#FEE2E2',
      borderRadius: 12, color: '#991B1B', fontSize: 15,
    }}>
      {error}
      {isTeacher && (
        <button onClick={() => navigate(`/students/${id}`)} style={{
          display: 'block', marginTop: 12, fontSize: 14,
          color: '#1D9E75', background: 'none', border: 'none',
          cursor: 'pointer', padding: 0, fontWeight: 600,
        }}>→ Add data for this student first</button>
      )}
    </div>
  );

  if (!data) return null;

  const a = data.analytics || {};
  const allRecs = [
    ...(data.criticalRecommendations || []),
    ...(data.highRecommendations     || []),
    ...(data.mediumRecommendations   || []),
    ...(data.lowRecommendations      || []),
  ];

  const riskStyle = {
    HIGH:    { bg: '#FEE2E2', color: '#991B1B', border: '#FCA5A5' },
    MEDIUM:  { bg: '#FEF3C7', color: '#92400E', border: '#FCD34D' },
    LOW:     { bg: '#D1FAE5', color: '#064E3B', border: '#6EE7B7' },
    UNKNOWN: { bg: '#F3F4F6', color: '#374151', border: '#D1D5DB' },
  }[data.riskLevel] || { bg: '#F3F4F6', color: '#374151', border: '#D1D5DB' };


const rawLecture = a.avgLectureCompletionRate || 0;
const lecturePercent = rawLecture > 1 ? rawLecture : rawLecture * 100;
  const barData = [
    { name: 'Avg score',   value: +(a.avgScore || 0).toFixed(1) },
    { name: 'Attendance',  value: +(a.attendancePercentage || 0).toFixed(1) },
    { name: 'Assignment',  value: +(a.assignmentCompletionRate || 0).toFixed(1) },
    { name: 'Consistency', value: +(a.consistencyIndex || 0).toFixed(1) },
    { name: 'Study hrs×4', value: +Math.min(100,(a.weeklyStudyHours||0)*4).toFixed(1) },
{ name: 'Lecture %', value: +lecturePercent.toFixed(1) },  ];

  return (
    <div style={{ maxWidth: 1100, fontSize: 15 }}>

      <div style={{ display: 'flex', justifyContent: 'space-between',
                    alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#111827' }}>
            {isStudent ? 'My Dashboard' : data.studentName}
          </div>
          <div style={{ fontSize: 14, color: '#6B7280', marginTop: 4 }}>
            {data.department} · Semester {data.semester}
            {isStudent && (
              <span style={{
                marginLeft: 10, fontSize: 12, padding: '2px 10px',
                borderRadius: 99, background: '#EDE9FE', color: '#4C1D95',
                fontWeight: 600,
              }}>Student view — read only</span>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Btn label={refreshing ? 'Refreshing...' : 'Refresh Analysis'}
               loading={refreshing} onClick={handleRefresh} />
          {isTeacher && (
            <Btn label="Edit Student Data" color="#7F77DD"
                 onClick={() => navigate(`/students/${id}`)} />
          )}
        </div>
      </div>

      <div style={{
        background: riskStyle.bg,
        border: `1.5px solid ${riskStyle.border}`,
        borderRadius: 14, padding: '16px 20px', marginBottom: 24,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: riskStyle.color }}>
            Risk Level: {data.riskLevel} · {data.willPass ? '✓ Predicted to Pass' : '⚠ Pass Not Guaranteed'}
          </div>
          <div style={{ fontSize: 13, color: riskStyle.color, opacity: .8, marginTop: 4 }}>
            {allRecs.length} personalised recommendations generated
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <span style={{
            fontSize: 13, fontWeight: 700, padding: '6px 14px',
            borderRadius: 99, background: riskStyle.color, color: '#fff',
          }}>{data.riskLevel}</span>
          <span style={{
            fontSize: 13, fontWeight: 600, padding: '6px 14px',
            borderRadius: 99, background: 'white',
            color: riskStyle.color, border: `1px solid ${riskStyle.border}`,
          }}>Pass: {data.passProbability?.toFixed(1) || 0}%</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)',
                    gap: 14, marginBottom: 24 }}>
        <MetricCard label="Avg Score"
          value={`${a.avgScore?.toFixed(1) || 0}%`}
          sub="Overall"
          cardBg={a.avgScore >= 60 ? '#D1FAE5' : '#FEE2E2'}
          valueColor={a.avgScore >= 60 ? '#065F46' : '#991B1B'} />
        <MetricCard label="Attendance"
          value={`${a.attendancePercentage?.toFixed(1) || 0}%`}
          sub={a.lowAttendanceFlag ? '⚠ Below 75%' : '✓ Good'}
          cardBg={a.attendancePercentage >= 75 ? '#D1FAE5' : '#FEF3C7'}
          valueColor={a.attendancePercentage >= 75 ? '#065F46' : '#92400E'} />
        <MetricCard label="Predicted Score"
          value={`${data.predictedScore?.toFixed(1) || 0}%`}
          sub="AI Forecast"
          cardBg="#EFF6FF"
          valueColor="#1D4ED8" />
        <MetricCard label="Risk Score"
          value={a.riskScore?.toFixed(1) || 0}
          sub={`${data.riskLevel} Risk`}
          cardBg={riskStyle.bg}
          valueColor={riskStyle.color} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr',
                    gap: 16, marginBottom: 8 }}>

        <div style={{
          background: '#FAFAFA', border: '1.5px solid #E5E7EB',
          borderRadius: 14, padding: '20px 18px',
        }}>
          <div style={{ fontSize: 15, fontWeight: 700,
                        color: '#111827', marginBottom: 16 }}>
            Feature Breakdown
          </div>
          <ResponsiveContainer width="100%" height={190}>
            <BarChart data={barData} margin={{ left: -20, bottom: 5 }}>
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6B7280' }} />
              <YAxis domain={[0,100]} tick={{ fontSize: 11, fill: '#6B7280' }} />
              <Tooltip formatter={v => `${v.toFixed(1)}%`}
                contentStyle={{ fontSize: 13, borderRadius: 8 }} />
              <Bar dataKey="value" radius={[4,4,0,0]}>
                {barData.map((_,i) => <Cell key={i} fill={BAR_COLORS[i]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{
          background: '#F0F9FF', border: '1.5px solid #BAE6FD',
          borderRadius: 14, padding: '20px 18px',
        }}>
          <div style={{ fontSize: 15, fontWeight: 700,
                        color: '#111827', marginBottom: 16 }}>
            AI Prediction Summary
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline',
                        gap: 8, marginBottom: 14 }}>
            <span style={{ fontSize: 40, fontWeight: 800, color: '#1D4ED8' }}>
              {data.predictedScore?.toFixed(1) || '—'}
            </span>
            <span style={{ fontSize: 14, color: '#6B7280' }}>
              predicted final score
            </span>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
            <span style={{
              fontSize: 13, fontWeight: 700, padding: '5px 12px',
              borderRadius: 99, background: riskStyle.color, color: '#fff',
            }}>{data.riskLevel}</span>
            <span style={{
              fontSize: 13, fontWeight: 600, padding: '5px 12px',
              borderRadius: 99,
              background: data.willPass ? '#D1FAE5' : '#FEE2E2',
              color: data.willPass ? '#065F46' : '#991B1B',
            }}>{data.willPass ? '✓ Likely to Pass' : '⚠ At Risk of Failing'}</span>
          </div>
          <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 8 }}>
            Top risk factors:
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {(data.topRiskFactors || []).map(f => (
              <span key={f} style={{
                fontSize: 12, padding: '3px 10px',
                background: '#FEF3C7', borderRadius: 6,
                color: '#92400E', fontWeight: 500,
              }}>{f.replace(/_/g,' ')}</span>
            ))}
          </div>
          <div style={{ marginTop: 16, fontSize: 13, color: '#6B7280' }}>
            Best subject:{' '}
            <strong style={{ color: '#065F46' }}>{data.bestSubject || '—'}</strong>
            {'  ·  '}
            Weakest:{' '}
            <strong style={{ color: '#991B1B' }}>{data.weakestSubject || '—'}</strong>
          </div>
        </div>
      </div>

      {isStudent && (
        <>
          <SectionHeader color="#4C1D95">Log a Study Session</SectionHeader>
          <div style={{
            background: '#F5F3FF', border: '1.5px solid #C4B5FD',
            borderRadius: 14, padding: '20px 22px', marginBottom: 8,
          }}>
            <div style={{ fontSize: 14, color: '#6B7280', marginBottom: 16 }}>
              Logging study hours improves the accuracy of your AI prediction.
            </div>
            <div style={{ display: 'grid',
                          gridTemplateColumns: 'repeat(4,1fr)', gap: 14,
                          marginBottom: 16 }}>
              <div>
                <label style={{ fontSize: 13, color: '#374151',
                                fontWeight: 600, display: 'block', marginBottom: 6 }}>
                  Subject
                </label>
                <input value={studySubject}
                  onChange={e => setStudySubject(e.target.value)}
                  placeholder="e.g. DSA"
                  style={{ width: '100%', fontSize: 14, padding: '8px 12px',
                           borderRadius: 8, border: '1px solid #D1D5DB' }} />
              </div>
              <div>
                <label style={{ fontSize: 13, color: '#374151',
                                fontWeight: 600, display: 'block', marginBottom: 6 }}>
                  Date
                </label>
                <input type="date" value={studyDate}
                  onChange={e => setStudyDate(e.target.value)}
                  style={{ width: '100%', fontSize: 14, padding: '8px 12px',
                           borderRadius: 8, border: '1px solid #D1D5DB' }} />
              </div>
              <div>
                <label style={{ fontSize: 13, color: '#374151',
                                fontWeight: 600, display: 'block', marginBottom: 6 }}>
                  Hours Studied
                </label>
                <input type="number" step="0.5" min="0.5" max="16"
                  value={studyHours}
                  onChange={e => setStudyHours(e.target.value)}
                  placeholder="e.g. 1.5"
                  style={{ width: '100%', fontSize: 14, padding: '8px 12px',
                           borderRadius: 8, border: '1px solid #D1D5DB' }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 2 }}>
                <label style={{ display: 'flex', alignItems: 'center',
                                gap: 8, fontSize: 14, cursor: 'pointer',
                                color: '#374151', fontWeight: 500 }}>
                  <input type="checkbox" checked={studyRev}
                    onChange={e => setStudyRev(e.target.checked)} />
                  Revision session
                </label>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <Btn label="Save Study Session" color="#7C3AED"
                   loading={savingStudy} onClick={handleLogStudy} />
              {studyMsg && (
                <span style={{
                  fontSize: 13, fontWeight: 500,
                  color: studyMsg.includes('Failed') ? '#991B1B' : '#065F46',
                }}>{studyMsg}</span>
              )}
            </div>
          </div>
        </>
      )}

      <SectionHeader>Academic Details</SectionHeader>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)',
                    gap: 14, marginBottom: 8 }}>
        <MetricCard label="Recent Avg (Last 3)"
          value={`${a.recentAvgScore?.toFixed(1) || 0}%`}
          cardBg="#EFF6FF" valueColor="#1D4ED8" />
        <MetricCard label="Score Trend"
          value={a.scoreTrend >= 0
            ? `+${a.scoreTrend?.toFixed(1)}` : `${a.scoreTrend?.toFixed(1)}`}
          sub={a.scoreTrend >= 0 ? '↑ Improving' : '↓ Declining'}
          cardBg={a.scoreTrend >= 0 ? '#D1FAE5' : '#FEE2E2'}
          valueColor={a.scoreTrend >= 0 ? '#065F46' : '#991B1B'} />
        <MetricCard label="Weekly Study Hours"
          value={`${a.weeklyStudyHours?.toFixed(1) || 0}h`}
          sub="Avg per week"
          cardBg="#FEF3C7" valueColor="#92400E" />
        <MetricCard label="Assignment Rate"
          value={`${a.assignmentCompletionRate?.toFixed(0) || 0}%`}
          sub="Submitted"
          cardBg={a.assignmentCompletionRate >= 80 ? '#D1FAE5' : '#FEE2E2'}
          valueColor={a.assignmentCompletionRate >= 80 ? '#065F46' : '#991B1B'} />
        <MetricCard label="Study Consistency"
          value={`${a.studyConsistencyScore?.toFixed(0) || 0}/100`}
          cardBg="#F5F3FF" valueColor="#4C1D95" />
        <MetricCard label="Consistency Index"
          value={`${a.consistencyIndex?.toFixed(0) || 0}/100`}
          sub="Overall stability"
          cardBg="#FDF4FF" valueColor="#7E22CE" />
      </div>

      <SectionHeader>Recommendations ({allRecs.length})</SectionHeader>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {allRecs.length === 0 ? (
          <div style={{ padding: '20px', fontSize: 14, color: '#6B7280',
                        background: '#F9FAFB', borderRadius: 12 }}>
            No recommendations yet. Click "Refresh Analysis" to generate them.
          </div>
        ) : allRecs.map((r, i) => {
          const ps = PRIORITY[r.priority] || PRIORITY.LOW;
          return (
            <div key={r.id || i} style={{
              background: ps.bg,
              border: `1.5px solid ${ps.border}`,
              borderRadius: 12, padding: '16px 18px',
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start',
                            justifyContent: 'space-between', gap: 12,
                            marginBottom: 8 }}>
                <div style={{ fontSize: 15, color: '#111827',
                              lineHeight: 1.6, flex: 1, fontWeight: 500 }}>
                  {r.message}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column',
                              alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                  <span style={{
                    fontSize: 12, fontWeight: 700, padding: '4px 12px',
                    borderRadius: 99, background: ps.color, color: '#fff',
                  }}>{r.priority}</span>
                  <span style={{
                    fontSize: 11, padding: '2px 8px',
                    background: 'rgba(255,255,255,0.7)',
                    borderRadius: 6, color: ps.color, fontWeight: 600,
                  }}>{r.category?.replace(/_/g,' ')}</span>
                </div>
              </div>
              <div style={{
                fontSize: 14, color: ps.color, fontWeight: 600,
                lineHeight: 1.5, paddingLeft: 12,
                borderLeft: `3px solid ${ps.dot}`,
              }}>→ {r.actionItem}</div>
            </div>
          );
        })}
      </div>

      {isTeacher && (
        <div style={{
          marginTop: 24, padding: '14px 18px',
          background: '#F9FAFB', borderRadius: 12,
          fontSize: 13, color: '#6B7280',
          border: '1px solid #E5E7EB',
        }}>
          Teacher view: click <strong>Edit Student Data</strong> to add marks, attendance,
          assignments and engagement logs. Changes automatically refresh predictions.
        </div>
      )}
    </div>
  );
}