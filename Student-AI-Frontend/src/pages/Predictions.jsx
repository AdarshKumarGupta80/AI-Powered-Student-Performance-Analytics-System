import { useEffect, useState } from 'react';
import { studentAPI, dashboardAPI } from '../api/api';
import { useNavigate } from 'react-router-dom';

const RISK_STYLE = {
  HIGH:   { bg: '#FAECE7', color: '#993C1D', border: '#F0997B' },
  MEDIUM: { bg: '#FAEEDA', color: '#854F0B', border: '#FAC775' },
  LOW:    { bg: '#E1F5EE', color: '#085041', border: '#5DCAA5' },
};

function RiskBadge({ level }) {
  const s = RISK_STYLE[level] || RISK_STYLE.LOW;
  return (
    <span style={{
      fontSize: 11, fontWeight: 500, padding: '3px 10px',
      borderRadius: 99, background: s.bg, color: s.color,
    }}>{level}</span>
  );
}

function ScoreBar({ value, max = 100, color = '#1D9E75' }) {
  return (
    <div style={{ flex: 1, height: 6,
                  background: 'var(--color-background-secondary)',
                  borderRadius: 3, overflow: 'hidden' }}>
      <div style={{
        height: '100%', borderRadius: 3,
        width: `${Math.min(100, (value / max) * 100)}%`,
        background: color, transition: 'width .4s',
      }}/>
    </div>
  );
}

export default function Predictions() {
  const [students,    setStudents]    = useState([]);
  const [predictions, setPredictions] = useState({});
  const [loading,     setLoading]     = useState(true);
  const [fetching,    setFetching]    = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    studentAPI.getAll()
      .then(r => { setStudents(r.data); setLoading(false); });
  }, []);

  const fetchPrediction = async (studentId) => {
    setFetching(p => ({ ...p, [studentId]: true }));
    try {
      const r = await dashboardAPI.get(studentId);
      setPredictions(p => ({ ...p, [studentId]: r.data }));
    } catch {
      setPredictions(p => ({
        ...p, [studentId]: { error: 'No analytics data yet.' }
      }));
    } finally {
      setFetching(p => ({ ...p, [studentId]: false }));
    }
  };

  const fetchAll = async () => {
    setLoading(true);
    await Promise.all(students.map(s => fetchPrediction(s.id)));
    setLoading(false);
  };

  if (loading) return (
    <div style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>
      Loading students...
    </div>
  );

  const withPreds = students.filter(s => predictions[s.id] && !predictions[s.id].error);
  const highRisk  = withPreds.filter(s => predictions[s.id]?.riskLevel === 'HIGH');

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between',
                    alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 500,
                        color: 'var(--color-text-primary)' }}>AI Predictions</div>
          <div style={{ fontSize: 13, color: 'var(--color-text-secondary)',
                        marginTop: 2 }}>
            Predicted scores and risk levels for all students
          </div>
        </div>
        <button onClick={fetchAll} style={{
          padding: '9px 18px', fontSize: 13, fontWeight: 500,
          background: '#1D9E75', color: '#fff', border: 'none',
          borderRadius: 'var(--border-radius-md)', cursor: 'pointer',
        }}>Refresh all predictions</button>
      </div>

      {withPreds.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)',
                      gap: 12, marginBottom: 20 }}>
          <div style={{ background: 'var(--color-background-secondary)',
                        borderRadius: 'var(--border-radius-md)',
                        padding: '14px 16px' }}>
            <div style={{ fontSize: 11, color: 'var(--color-text-secondary)',
                          textTransform: 'uppercase',
                          letterSpacing: '.04em', marginBottom: 6 }}>
              Students analysed
            </div>
            <div style={{ fontSize: 22, fontWeight: 500,
                          color: 'var(--color-text-primary)' }}>
              {withPreds.length}
            </div>
          </div>
          <div style={{ background: '#FAECE7', borderRadius: 'var(--border-radius-md)',
                        padding: '14px 16px' }}>
            <div style={{ fontSize: 11, color: '#854F0B', textTransform: 'uppercase',
                          letterSpacing: '.04em', marginBottom: 6 }}>
              High risk
            </div>
            <div style={{ fontSize: 22, fontWeight: 500, color: '#993C1D' }}>
              {highRisk.length}
            </div>
          </div>
          <div style={{ background: '#E1F5EE', borderRadius: 'var(--border-radius-md)',
                        padding: '14px 16px' }}>
            <div style={{ fontSize: 11, color: '#085041', textTransform: 'uppercase',
                          letterSpacing: '.04em', marginBottom: 6 }}>
              Class avg predicted
            </div>
            <div style={{ fontSize: 22, fontWeight: 500, color: '#0F6E56' }}>
              {withPreds.length > 0
                ? (withPreds.reduce((acc, s) =>
                    acc + (predictions[s.id]?.predictedScore || 0), 0
                  ) / withPreds.length).toFixed(1) + '%'
                : '—'}
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {students.map(s => {
          const pred = predictions[s.id];
          const busy = fetching[s.id];
          const rs   = pred?.riskLevel ? (RISK_STYLE[pred.riskLevel] || RISK_STYLE.LOW) : null;

          return (
            <div key={s.id} style={{
              background: 'var(--color-background-primary)',
              border: `0.5px solid ${rs ? rs.border : 'var(--color-border-tertiary)'}`,
              borderRadius: 'var(--border-radius-lg)',
              padding: '16px 20px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>

                <div style={{
                  width: 38, height: 38, borderRadius: '50%',
                  background: '#E1F5EE', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 500, color: '#085041', flexShrink: 0,
                }}>
                  {s.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2)}
                </div>

                {/* Name + dept */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 500,
                                color: 'var(--color-text-primary)' }}>{s.name}</div>
                  <div style={{ fontSize: 12,
                                color: 'var(--color-text-secondary)' }}>
                    {s.department} · Sem {s.semester}
                  </div>
                </div>

                {pred && !pred.error ? (
                  <div style={{ display: 'flex', alignItems: 'center',
                                gap: 20, flexShrink: 0 }}>

                    <div style={{ width: 140 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between',
                                    marginBottom: 4 }}>
                        <span style={{ fontSize: 11,
                                       color: 'var(--color-text-secondary)' }}>
                          Predicted
                        </span>
                        <span style={{ fontSize: 12, fontWeight: 500,
                                       color: 'var(--color-text-primary)' }}>
                          {pred.predictedScore?.toFixed(1)}%
                        </span>
                      </div>
                      <ScoreBar value={pred.predictedScore}
                        color={pred.predictedScore >= 60 ? '#1D9E75' :
                               pred.predictedScore >= 40 ? '#EF9F27' : '#D85A30'} />
                    </div>

                    <div style={{ width: 110 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between',
                                    marginBottom: 4 }}>
                        <span style={{ fontSize: 11,
                                       color: 'var(--color-text-secondary)' }}>
                          Pass prob
                        </span>
                        <span style={{ fontSize: 12, fontWeight: 500,
                                       color: 'var(--color-text-primary)' }}>
                          {pred.passProbability?.toFixed(1)}%
                        </span>
                      </div>
                      <ScoreBar value={pred.passProbability}
                        color={pred.willPass ? '#1D9E75' : '#D85A30'} />
                    </div>

                    <RiskBadge level={pred.riskLevel} />

                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap',
                                  maxWidth: 180 }}>
                      {(pred.topRiskFactors || []).slice(0, 2).map(f => (
                        <span key={f} style={{
                          fontSize: 10, padding: '2px 6px',
                          background: 'var(--color-background-secondary)',
                          borderRadius: 4, color: 'var(--color-text-secondary)',
                        }}>{f.replace(/_/g,' ')}</span>
                      ))}
                    </div>
                  </div>
                ) : pred?.error ? (
                  <span style={{ fontSize: 12,
                                 color: 'var(--color-text-secondary)' }}>
                    {pred.error}
                  </span>
                ) : null}

                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  {!pred && (
                    <button onClick={() => fetchPrediction(s.id)}
                      disabled={busy} style={{
                        padding: '7px 14px', fontSize: 12, fontWeight: 500,
                        background: 'var(--color-background-secondary)',
                        color: 'var(--color-text-primary)',
                        border: '0.5px solid var(--color-border-tertiary)',
                        borderRadius: 'var(--border-radius-md)', cursor: 'pointer',
                      }}>
                      {busy ? 'Loading...' : 'Analyse'}
                    </button>
                  )}
                  <button onClick={() => navigate(`/dashboard/${s.id}`)} style={{
                    padding: '7px 14px', fontSize: 12, fontWeight: 500,
                    background: '#1D9E75', color: '#fff',
                    border: 'none', borderRadius: 'var(--border-radius-md)',
                    cursor: 'pointer',
                  }}>Dashboard</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}