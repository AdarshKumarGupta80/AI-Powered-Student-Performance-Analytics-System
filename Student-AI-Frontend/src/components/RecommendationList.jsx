const PRIORITY_STYLE = {
  CRITICAL: { bg: '#FAECE7', color: '#993C1D' },
  HIGH:     { bg: '#FAEEDA', color: '#854F0B' },
  MEDIUM:   { bg: '#EEEDFE', color: '#3C3489' },
  LOW:      { bg: '#E1F5EE', color: '#085041' },
};

function Badge({ priority }) {
  const s = PRIORITY_STYLE[priority] || PRIORITY_STYLE.LOW;
  return (
    <span style={{
      fontSize: 11, fontWeight: 500, padding: '3px 9px',
      borderRadius: 99, background: s.bg, color: s.color, flexShrink: 0,
    }}>{priority}</span>
  );
}

export default function RecommendationList({ recommendations = [] }) {
  if (recommendations.length === 0) {
    return (
      <div style={{ padding: '20px 0', fontSize: 13,
                    color: 'var(--color-text-secondary)' }}>
        No recommendations yet. Run dashboard analysis first.
      </div>
    );
  }

  return (
    <div style={{
      background: 'var(--color-background-primary)',
      border: '0.5px solid var(--color-border-tertiary)',
      borderRadius: 'var(--border-radius-lg)',
      padding: '0 18px',
    }}>
      {recommendations.map((r, i) => (
        <div key={r.id || i} style={{
          padding: '12px 0',
          borderBottom: i < recommendations.length - 1
            ? '0.5px solid var(--color-border-tertiary)' : 'none',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start',
                        justifyContent: 'space-between', gap: 10, marginBottom: 5 }}>
            <div style={{ fontSize: 13, color: 'var(--color-text-primary)',
                          lineHeight: 1.5, flex: 1 }}>
              {r.message}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column',
                          alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
              <Badge priority={r.priority} />
              <span style={{ fontSize: 10, padding: '1px 7px',
                             background: 'var(--color-background-secondary)',
                             borderRadius: 4, color: 'var(--color-text-secondary)' }}>
                {r.category?.replace(/_/g,' ')}
              </span>
            </div>
          </div>
          <div style={{ fontSize: 12, color: 'var(--color-text-secondary)',
                        lineHeight: 1.4 }}>
            → {r.actionItem}
          </div>
          {r.triggerReason && (
            <div style={{ fontSize: 10, color: 'var(--color-text-secondary)',
                          marginTop: 4, opacity: .7 }}>
              Reason: {r.triggerReason}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}