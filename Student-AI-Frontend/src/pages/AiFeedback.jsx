import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Brain,
  CalendarCheck,
  BarChart3,
  Loader2,
  RefreshCcw,
  ShieldAlert,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { aiFeedbackAPI } from '../api/api';
import { useAuth } from '../context/AuthContext';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  PageHeader,
  SectionTitle,
} from '../components/ui/DashboardPrimitives';

const SENTIMENT_TONE = {
  POSITIVE: 'emerald',
  NEGATIVE: 'red',
  NEUTRAL:  'slate',
  MIXED:    'amber',
};

const SENTIMENT_DESC = {
  POSITIVE: 'Academic situation is strong — student is performing well.',
  NEGATIVE: 'Academic situation needs attention — risk factors are elevated.',
  NEUTRAL:  'Academic situation is stable — moderate performance levels.',
  MIXED:    'Mixed signals — some areas strong, others need improvement.',
};

function fmt(v, d = 1) {
  return Number.isFinite(Number(v)) ? Number(v).toFixed(d) : '—';
}

function SentimentBadge({ label }) {
  const tone = SENTIMENT_TONE[label] || 'slate';
  return <Badge tone={tone}>{label || 'UNKNOWN'}</Badge>;
}

function FeedbackCard({ feedback }) {
  const [expanded, setExpanded] = useState(false);
  const tone = SENTIMENT_TONE[feedback.sentimentLabel] || 'slate';
  const date = feedback.generatedAt
    ? new Date(feedback.generatedAt).toLocaleDateString('en-IN', {
        weekday: 'short',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '—';

  const themes = feedback.keyThemes
    ? feedback.keyThemes.split(',').map(t => t.trim()).filter(Boolean)
    : [];

  const isLong = feedback.feedbackText && feedback.feedbackText.length > 400;
  const displayText = expanded || !isLong
    ? feedback.feedbackText
    : feedback.feedbackText.slice(0, 400) + '…';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
    >
      <Card className="p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <SentimentBadge label={feedback.sentimentLabel} />
            <span className="text-xs text-slate-400">{date}</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-slate-500">
            <span className="flex items-center gap-1">
              <BarChart3 className="h-3.5 w-3.5" />
              {fmt(feedback.avgScoreSnapshot)}%
            </span>
            <span className="flex items-center gap-1">
              <CalendarCheck className="h-3.5 w-3.5" />
              {fmt(feedback.attendanceSnapshot)}%
            </span>
          </div>
        </div>

        {feedback.aiSummary && (
          <div className="mb-3 rounded-xl bg-indigo-50 px-4 py-3 dark:bg-indigo-500/10">
            <p className="text-xs font-semibold uppercase tracking-widest text-indigo-500 mb-1">
              AI Summary
            </p>
            <p className="text-sm text-indigo-900 dark:text-indigo-200 leading-6">
              {feedback.aiSummary}
            </p>
          </div>
        )}

        <div className="border-l-4 border-indigo-200 pl-4 text-sm leading-7 text-slate-700 dark:border-indigo-500/30 dark:text-slate-300 whitespace-pre-line">
          {displayText}
        </div>
        {isLong && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-2 text-xs font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
          >
            {expanded ? 'Show less ↑' : 'Read full feedback ↓'}
          </button>
        )}

        {themes.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {themes.map(t => (
              <span
                key={t}
                className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300"
              >
                {t}
              </span>
            ))}
          </div>
        )}

        {feedback.sentimentScore != null && (
          <div className="mt-3">
            <div className="mb-1 flex justify-between text-xs text-slate-400">
              <span>Sentiment confidence</span>
              <span>{(feedback.sentimentScore * 100).toFixed(0)}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div
                className={`h-full rounded-full ${
                  tone === 'emerald' ? 'bg-emerald-500' :
                  tone === 'red'    ? 'bg-red-500'     :
                  tone === 'amber'  ? 'bg-amber-500'   : 'bg-slate-400'
                }`}
                style={{ width: `${(feedback.sentimentScore * 100).toFixed(0)}%` }}
              />
            </div>
          </div>
        )}
      </Card>
    </motion.div>
  );
}

export default function AiFeedbackPage() {
  const { id: paramId } = useParams();
  const { studentId: authStudentId } = useAuth();
  const studentId = paramId || authStudentId;

  const [feedbacks,  setFeedbacks]  = useState([]);
  const [dashboard,  setDashboard]  = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error,      setError]      = useState('');
  const [msg,        setMsg]        = useState('');

  const showMsg = (text, ms = 3500) => {
    setMsg(text);
    setTimeout(() => setMsg(''), ms);
  };

  const loadAll = async () => {
    if (!studentId) return;
    setLoading(true);
    try {
      const [fbRes, dbRes] = await Promise.all([
        aiFeedbackAPI.getHistory(studentId),
        aiFeedbackAPI.getDashboard(),
      ]);
      setFeedbacks(fbRes.data);
      setDashboard(dbRes.data);
      setError('');
    } catch {
      setError('Could not load feedback. Ensure analytics are computed for this student.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, [studentId]);

  const handleGenerate = async () => {
    if (!studentId) return;
    setGenerating(true);
    try {
      await aiFeedbackAPI.generate(studentId);
      showMsg('✓ AI feedback generated successfully!');
      await loadAll();
    } catch (e) {
      const errMsg = e.response?.data?.message || e.message;
      showMsg(`Failed: ${errMsg}`);
    } finally {
      setGenerating(false);
    }
  };

  if (!studentId) {
    return (
      <Card className="p-6 max-w-lg">
        <p className="text-sm text-slate-500">
          Student ID not available. Log in as a student or navigate from a student record.
        </p>
      </Card>
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow="AI sentiment analysis"
        title="AI Feedback"
        description="The AI analyses your academic performance data and generates personalised feedback with sentiment classification — no manual input required."
        actions={
          <Button onClick={handleGenerate} disabled={generating}>
            {generating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {generating ? 'Analysing…' : 'Generate AI Feedback'}
          </Button>
        }
      />

      {msg && (
        <div className={`mb-4 rounded-xl px-4 py-3 text-sm font-medium ${
          msg.startsWith('✓')
            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'
            : 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300'
        }`}>
          {msg}
        </div>
      )}

      {error && (
        <Card className="mb-4 p-4">
          <div className="flex items-center gap-3 text-sm text-red-600 dark:text-red-400">
            <ShieldAlert className="h-4 w-4 shrink-0" />
            {error}
          </div>
        </Card>
      )}

      {dashboard && dashboard.total > 0 && (
        <Card className="mb-6 p-5">
          <SectionTitle
            title="Sentiment Overview"
            description={`AI-classified sentiment across ${dashboard.total} feedback entries`}
          />
          <div className="flex flex-wrap gap-3">
            {Object.entries(dashboard.distribution || {}).map(([label, count]) => {
              const tone = SENTIMENT_TONE[label] || 'slate';
              return (
                <div key={label} className="rounded-xl bg-slate-50 p-3 dark:bg-slate-900 min-w-[120px]">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge tone={tone}>{label}</Badge>
                  </div>
                  <p className="text-2xl font-bold text-slate-950 dark:text-white">{count}</p>
                  <p className="text-xs text-slate-400 mt-0.5 leading-4">
                    {SENTIMENT_DESC[label] || ''}
                  </p>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {loading ? (
        <div className="space-y-4">
          {[0, 1].map(i => <div key={i} className="h-48 skeleton" />)}
        </div>
      ) : feedbacks.length === 0 ? (
        <EmptyState
          title="No AI feedback yet"
          description="Click 'Generate AI Feedback' to have the AI analyse your performance and produce personalised, sentiment-classified feedback."
        />
      ) : (
        <div className="space-y-4">
          <SectionTitle
            title={`${feedbacks.length} feedback entr${feedbacks.length !== 1 ? 'ies' : 'y'}`}
            description="Most recent first — generated by AI from your academic data"
          />
          {feedbacks.map(f => (
            <FeedbackCard key={f.id} feedback={f} />
          ))}
        </div>
      )}
    </div>
  );
}
