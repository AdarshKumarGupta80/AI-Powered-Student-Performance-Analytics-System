import {
  BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts';

const DEFAULT_COLORS = [
  '#1D9E75','#EF9F27','#1D9E75',
  '#7F77DD','#D85A30','#378ADD',
];

export default function FeatureBarChart({ analytics }) {
  if (!analytics) return null;

  const a = analytics;
const rawLecture = a.avgLectureCompletionRate || 0;
const lecturePercent = rawLecture > 1 ? rawLecture : rawLecture * 100;
  const data = [
    { name: 'Avg score',   value: +(a.avgScore         || 0).toFixed(1) },
    { name: 'Attendance',  value: +(a.attendancePercentage || 0).toFixed(1) },
    { name: 'Assignment',  value: +(a.assignmentCompletionRate || 0).toFixed(1) },
    { name: 'Consistency', value: +(a.consistencyIndex  || 0).toFixed(1) },
    { name: 'Study ×4',    value: +Math.min(100, (a.weeklyStudyHours || 0) * 4).toFixed(1) },
{ name: 'Lecture %', value: +lecturePercent.toFixed(1) },  ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{
        background: 'var(--color-background-primary)',
        border: '0.5px solid var(--color-border-tertiary)',
        borderRadius: 'var(--border-radius-md)',
        padding: '8px 12px', fontSize: 12,
      }}>
        <div style={{ fontWeight: 500,
                      color: 'var(--color-text-primary)',
                      marginBottom: 2 }}>{label}</div>
        <div style={{ color: 'var(--color-text-secondary)' }}>
          {payload[0].value}%
        </div>
      </div>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ left: -20, bottom: 5 }}>
        <XAxis dataKey="name" tick={{ fontSize: 10,
                                      fill: 'var(--color-text-secondary)' }} />
        <YAxis domain={[0, 100]} tick={{ fontSize: 10,
                                         fill: 'var(--color-text-secondary)' }} />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="value" radius={[3,3,0,0]}>
          {data.map((_, i) => (
            <Cell key={i} fill={DEFAULT_COLORS[i % DEFAULT_COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}