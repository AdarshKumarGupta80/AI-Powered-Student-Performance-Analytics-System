export default function MetricCard({ label, value, sub, color, onClick }) {
  return (
    <div onClick={onClick} style={{
      background: 'var(--color-background-secondary)',
      borderRadius: 'var(--border-radius-md)',
      padding: '14px 16px',
      cursor: onClick ? 'pointer' : 'default',
    }}>
      <div style={{
        fontSize: 11, color: 'var(--color-text-secondary)',
        textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 6,
      }}>{label}</div>
      <div style={{
        fontSize: 22, fontWeight: 500, lineHeight: 1,
        color: color || 'var(--color-text-primary)',
      }}>{value}</div>
      {sub && (
        <div style={{ fontSize: 11, color: 'var(--color-text-secondary)',
                      marginTop: 4 }}>{sub}</div>
      )}
    </div>
  );
}