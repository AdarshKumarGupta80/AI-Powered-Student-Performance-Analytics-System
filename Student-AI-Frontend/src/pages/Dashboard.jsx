import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  BookOpenCheck,
  Brain,
  CalendarCheck,
  CheckCircle2,
  Clock3,
  RefreshCcw,
  Target,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { dashboardAPI, academicAPI } from '../api/api';
import { useAuth } from '../context/AuthContext';
import { Badge, Button, Card, EmptyState, MetricCard, PageHeader, SectionTitle } from '../components/ui/DashboardPrimitives';

const RISK = {
  HIGH: { tone: 'red', label: 'High risk', accent: '#ef4444', soft: 'bg-red-50 dark:bg-red-500/10', text: 'text-red-700 dark:text-red-300' },
  MEDIUM: { tone: 'amber', label: 'Medium risk', accent: '#f59e0b', soft: 'bg-amber-50 dark:bg-amber-500/10', text: 'text-amber-800 dark:text-amber-300' },
  LOW: { tone: 'emerald', label: 'Low risk', accent: '#10b981', soft: 'bg-emerald-50 dark:bg-emerald-500/10', text: 'text-emerald-700 dark:text-emerald-300' },
  UNKNOWN: { tone: 'slate', label: 'Not enough data', accent: '#64748b', soft: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-700 dark:text-slate-300' },
};

const PRIORITY = {
  CRITICAL: { tone: 'red', accent: 'bg-red-500', label: 'Critical' },
  HIGH: { tone: 'amber', accent: 'bg-amber-500', label: 'High' },
  MEDIUM: { tone: 'indigo', accent: 'bg-indigo-500', label: 'Medium' },
  LOW: { tone: 'emerald', accent: 'bg-emerald-500', label: 'Low' },
};

function number(value, fallback = 0) {
  return Number.isFinite(Number(value)) ? Number(value) : fallback;
}

function pct(value) {
  return `${number(value).toFixed(1)}%`;
}

function buildPredictionInsight(data, analytics, lecturePercent) {
  const studentName = data?.studentName || 'This student';
  const avgScore = number(analytics.avgScore);
  const recentAvg = number(analytics.recentAvgScore, avgScore);
  const scoreTrend = number(analytics.scoreTrend);
  const attendance = number(analytics.attendancePercentage);
  const assignmentRate = number(analytics.assignmentCompletionRate);
  const weeklyHours = number(analytics.weeklyStudyHours);
  const consistency = number(analytics.consistencyIndex);
  const predictedScore = number(data?.predictedScore);
  const passProbability = number(data?.passProbability);
  const riskLevel = data?.riskLevel || analytics.riskLevel || 'UNKNOWN';
  const weakestSubject = data?.weakestSubject && data.weakestSubject !== 'N/A' ? data.weakestSubject : '';
  const riskFactors = (data?.topRiskFactors || []).map((factor) => factor.replace(/_/g, ' ').toLowerCase());

  const momentum = scoreTrend > 2
    ? `recent scores are improving by ${scoreTrend.toFixed(1)} points`
    : scoreTrend < -2
    ? `recent scores are declining by ${Math.abs(scoreTrend).toFixed(1)} points`
    : 'recent scores are mostly stable';

  const summary = `${studentName} is at ${riskLevel.toLowerCase()} academic risk with a predicted score of ${predictedScore.toFixed(1)}% and ${passProbability.toFixed(1)}% pass confidence. ${momentum.charAt(0).toUpperCase() + momentum.slice(1)}.`;

  let reason = `The prediction is supported by ${avgScore.toFixed(1)}% average score, ${attendance.toFixed(1)}% attendance, ${assignmentRate.toFixed(1)}% assignment completion, and ${consistency.toFixed(1)}/100 consistency.`;
  if (attendance < 75) {
    reason = `Attendance is the strongest risk signal at ${attendance.toFixed(1)}%, which can reduce learning continuity.`;
  } else if (scoreTrend < -2) {
    reason = `The main concern is a downward score trend, even though the recent average is ${recentAvg.toFixed(1)}%.`;
  } else if (assignmentRate < 80) {
    reason = `Incomplete coursework is limiting confidence, with assignment completion at ${assignmentRate.toFixed(1)}%.`;
  } else if (weeklyHours < 5 || consistency < 55) {
    reason = `Study discipline needs attention: weekly study is ${weeklyHours.toFixed(1)} hours and consistency is ${consistency.toFixed(1)}/100.`;
  } else if (riskFactors.length > 0) {
    reason = `Key influencing factors are ${riskFactors.slice(0, 3).join(', ')}.`;
  } else if (lecturePercent < 60) {
    reason = `Lecture completion is low at ${lecturePercent.toFixed(1)}%, which may affect concept coverage.`;
  }

  let nextAction = 'Maintain the current learning rhythm and keep monitoring attendance, assignments, and recent scores.';
  if (attendance < 75) {
    nextAction = 'Prioritize attendance recovery and review missed topics before the next assessment.';
  } else if (assignmentRate < 80) {
    nextAction = 'Complete pending assignments and review submission status every week.';
  } else if (scoreTrend < -2) {
    nextAction = 'Schedule focused revision for recent low-scoring topics and monitor the next test closely.';
  } else if (weeklyHours < 5 || consistency < 55) {
    nextAction = 'Set a consistent weekly study plan with short revision sessions across the week.';
  } else if (weakestSubject) {
    nextAction = `Keep progress steady and spend extra practice time on ${weakestSubject}.`;
  }

  return {
    summary: data?.predictionSummary || summary,
    reason: data?.predictionReason || reason,
    nextAction: data?.predictionNextAction || nextAction,
  };
}

function LoadingDashboard() {
  return (
    <div className="space-y-6">
      <div className="h-24 skeleton" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((item) => <div key={item} className="h-32 skeleton" />)}
      </div>
      <div className="grid gap-4 xl:grid-cols-3">
        <div className="h-80 skeleton xl:col-span-2" />
        <div className="h-80 skeleton" />
      </div>
    </div>
  );
}

function SubjectPill({ label, type }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">{type}</p>
      <p className="mt-2 text-sm font-semibold text-slate-950 dark:text-white">{label || 'Not available'}</p>
    </div>
  );
}

export default function Dashboard() {
  const { id } = useParams();
  const { isTeacher, isStudent } = useAuth();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const [studyHours, setStudyHours] = useState('');
  const [studyDate, setStudyDate] = useState(new Date().toISOString().split('T')[0]);
  const [studySubject, setStudySubject] = useState('');
  const [studyRev, setStudyRev] = useState(false);
  const [savingStudy, setSavingStudy] = useState(false);
  const [studyMsg, setStudyMsg] = useState('');

  const load = async () => {
    try {
      const response = await dashboardAPI.get(id);
      setData(response.data);
      setError('');
    } catch {
      setError('Could not load this dashboard. Add marks, attendance, and engagement data before running AI analysis.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    load();
  }, [id]);

  const analytics = data?.analytics || {};
  const risk = RISK[data?.riskLevel] || RISK.UNKNOWN;

  const recommendations = useMemo(() => [
    ...(data?.criticalRecommendations || []),
    ...(data?.highRecommendations || []),
    ...(data?.mediumRecommendations || []),
    ...(data?.lowRecommendations || []),
  ], [data]);

  const lecturePercent = useMemo(() => {
    const raw = number(analytics.avgLectureCompletionRate);
    return raw > 1 ? raw : raw * 100;
  }, [analytics.avgLectureCompletionRate]);

  const barData = useMemo(() => [
    { name: 'Score', value: number(analytics.avgScore), color: '#4f46e5' },
    { name: 'Attendance', value: number(analytics.attendancePercentage), color: '#10b981' },
    { name: 'Assignments', value: number(analytics.assignmentCompletionRate), color: '#f59e0b' },
    { name: 'Consistency', value: number(analytics.consistencyIndex), color: '#0ea5e9' },
    { name: 'Study', value: Math.min(100, number(analytics.weeklyStudyHours) * 4), color: '#8b5cf6' },
    { name: 'Lecture', value: lecturePercent, color: '#14b8a6' },
  ], [analytics, lecturePercent]);

  const trendData = useMemo(() => {
    const avg = number(analytics.avgScore);
    const recent = number(analytics.recentAvgScore, avg);
    const predicted = number(data?.predictedScore, recent);
    return [
      { name: 'Baseline', value: Math.max(0, avg - 6) },
      { name: 'Current', value: avg },
      { name: 'Recent', value: recent },
      { name: 'AI forecast', value: predicted },
    ];
  }, [analytics, data?.predictedScore]);

  const predictionInsight = useMemo(
    () => buildPredictionInsight(data, analytics, lecturePercent),
    [data, analytics, lecturePercent],
  );

  const handleRefresh = () => {
    setRefreshing(true);
    load();
  };

  const handleLogStudy = async () => {
    if (!studyHours || parseFloat(studyHours) <= 0) {
      setStudyMsg('Enter valid study hours.');
      return;
    }

    setSavingStudy(true);
    setStudyMsg('');
    try {
      await academicAPI.addStudySession(id, {
        subject: studySubject || 'General',
        date: studyDate,
        hoursStudied: parseFloat(studyHours),
        revisionSession: studyRev,
      });
      setStudyMsg('Saved. Refreshing predictions...');
      setStudyHours('');
      setStudySubject('');
      setStudyRev(false);
      setTimeout(() => {
        handleRefresh();
        setStudyMsg('');
      }, 900);
    } catch {
      setStudyMsg('Failed to save. Try again.');
    } finally {
      setSavingStudy(false);
    }
  };

  if (loading) return <LoadingDashboard />;

  if (error) {
    return (
      <Card className="max-w-3xl p-6">
        <div className="flex gap-4">
          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-300">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-950 dark:text-white">Dashboard unavailable</h1>
            <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">{error}</p>
            {isTeacher && (
              <Button className="mt-5" onClick={() => navigate(`/students/${id}`)}>
                Add academic data
                <ArrowUpRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </Card>
    );
  }

  if (!data) return null;

  const scoreTrend = number(analytics.scoreTrend);

  return (
    <div>
      <PageHeader
        eyebrow={isStudent ? 'Student dashboard' : 'Teacher insight view'}
        title={isStudent ? 'My academic intelligence' : data.studentName}
        description={`${data.department || 'Department'} / Semester ${data.semester || '-'} / AI-assisted performance, risk, attendance, and recommendation tracking.`}
        actions={
          <>
            <Button variant="secondary" onClick={handleRefresh} disabled={refreshing}>
              <RefreshCcw className={refreshing ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
              {refreshing ? 'Refreshing' : 'Refresh analysis'}
            </Button>
            {isTeacher && (
              <Button onClick={() => navigate(`/students/${id}`)}>
                Edit data
                <ArrowUpRight className="h-4 w-4" />
              </Button>
            )}
          </>
        }
      />

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className={`p-5 xl:col-span-2 ${risk.soft}`}>
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <Badge tone={risk.tone}>
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: risk.accent }} />
                  {risk.label}
                </Badge>
                <Badge tone={data.willPass ? 'emerald' : 'red'}>
                  {data.willPass ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
                  {data.willPass ? 'Likely to pass' : 'Intervention needed'}
                </Badge>
              </div>
              <h2 className="text-xl font-semibold tracking-tight text-slate-950 dark:text-white">AI prediction summary</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-400">
                {predictionInsight.summary}
              </p>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl bg-white/70 p-3 text-sm leading-6 text-slate-600 dark:bg-slate-950/60 dark:text-slate-300">
                  <span className="font-semibold text-slate-900 dark:text-white">Reason: </span>
                  {predictionInsight.reason}
                </div>
                <div className="rounded-2xl bg-white/70 p-3 text-sm leading-6 text-slate-600 dark:bg-slate-950/60 dark:text-slate-300">
                  <span className="font-semibold text-slate-900 dark:text-white">Next action: </span>
                  {predictionInsight.nextAction}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:min-w-72">
              <div className="rounded-2xl bg-white/70 p-4 dark:bg-slate-950/60">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Predicted score</p>
                <p className="mt-1 text-3xl font-semibold text-slate-950 dark:text-white">{pct(data.predictedScore)}</p>
              </div>
              <div className="rounded-2xl bg-white/70 p-4 dark:bg-slate-950/60">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Pass confidence</p>
                <p className={`mt-1 text-3xl font-semibold ${risk.text}`}>{pct(data.passProbability)}</p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <SectionTitle title="Recommendation mix" description={`${recommendations.length} generated actions`} />
          <div className="space-y-3">
            {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((priority) => {
              const count = recommendations.filter((item) => item.priority === priority).length;
              const meta = PRIORITY[priority];
              return (
                <div key={priority}>
                  <div className="mb-1 flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
                    <span>{meta.label}</span>
                    <span>{count}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div className={`h-full rounded-full ${meta.accent}`} style={{ width: `${recommendations.length ? (count / recommendations.length) * 100 : 0}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Average performance" value={pct(analytics.avgScore)} sub="Overall score health" trend={scoreTrend >= 0 ? `+${scoreTrend.toFixed(1)}` : scoreTrend.toFixed(1)} icon={BarChart3} tone={number(analytics.avgScore) >= 60 ? 'emerald' : 'red'} />
        <MetricCard label="Attendance" value={pct(analytics.attendancePercentage)} sub={analytics.lowAttendanceFlag ? 'Below 75 percent threshold' : 'Healthy attendance'} icon={CalendarCheck} tone={number(analytics.attendancePercentage) >= 75 ? 'emerald' : 'amber'} />
        <MetricCard label="Weekly study" value={`${number(analytics.weeklyStudyHours).toFixed(1)}h`} sub="Average learning effort" icon={Clock3} tone="indigo" />
        <MetricCard label="Risk score" value={number(analytics.riskScore).toFixed(1)} sub={`${data.riskLevel || 'Unknown'} risk level`} icon={AlertTriangle} tone={risk.tone} />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-3">
        <Card className="p-5 xl:col-span-2">
          <SectionTitle title="Performance analytics" description="Limited palette, clean grid lines, and comparable scoring signals." />
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: 'var(--chart-text)', fontSize: 12 }} />
                <YAxis domain={[0, 100]} tickLine={false} axisLine={false} tick={{ fill: 'var(--chart-text)', fontSize: 12 }} />
                <Tooltip
                  formatter={(value) => `${number(value).toFixed(1)}%`}
                  contentStyle={{ borderRadius: 14, border: '1px solid #e2e8f0', boxShadow: '0 16px 40px -24px rgba(15,23,42,.5)' }}
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]} maxBarSize={44}>
                  {barData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <SectionTitle title="Trend forecast" description="Current movement into AI score forecast." />
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: 'var(--chart-text)', fontSize: 11 }} />
                <YAxis domain={[0, 100]} tickLine={false} axisLine={false} tick={{ fill: 'var(--chart-text)', fontSize: 11 }} />
                <Tooltip formatter={(value) => `${number(value).toFixed(1)}%`} />
                <Line type="monotone" dataKey="value" stroke="#4f46e5" strokeWidth={3} dot={{ r: 4, fill: '#4f46e5' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <SubjectPill type="Best subject" label={data.bestSubject} />
            <SubjectPill type="Weak subject" label={data.weakestSubject} />
          </div>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-3">
        <Card className="p-5 xl:col-span-2">
          <SectionTitle title="AI recommendations" description="Prioritized, action-oriented guidance for the next academic cycle." />
          {recommendations.length === 0 ? (
            <EmptyState title="No recommendations yet" description="Refresh analysis after adding academic data to generate personalized suggestions." />
          ) : (
            <div className="space-y-3">
              {recommendations.map((item, index) => {
                const meta = PRIORITY[item.priority] || PRIORITY.LOW;
                return (
                  <motion.article
                    key={item.id || `${item.priority}-${index}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.18, delay: Math.min(index * 0.03, 0.18) }}
                    className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <Badge tone={meta.tone}>{meta.label}</Badge>
                        <p className="mt-3 text-sm font-medium leading-6 text-slate-800 dark:text-slate-200">{item.message}</p>
                      </div>
                      <Badge tone="slate" className="w-fit">{item.category?.replace(/_/g, ' ') || 'General'}</Badge>
                    </div>
                    {item.actionItem && (
                      <div className="mt-4 flex gap-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-600 dark:bg-slate-900 dark:text-slate-300">
                        <Target className="mt-0.5 h-4 w-4 flex-shrink-0 text-indigo-500" />
                        <span>{item.actionItem}</span>
                      </div>
                    )}
                  </motion.article>
                );
              })}
            </div>
          )}
        </Card>

        <div className="space-y-4">
          <Card className="p-5">
            <SectionTitle title="Risk factors" description="Signals currently influencing the prediction." />
            <div className="flex flex-wrap gap-2">
              {(data.topRiskFactors || []).length === 0 ? (
                <Badge tone="emerald">No major risk factors</Badge>
              ) : (
                data.topRiskFactors.map((factor) => <Badge key={factor} tone="amber">{factor.replace(/_/g, ' ')}</Badge>)
              )}
            </div>
          </Card>

          <Card className="p-5">
            <SectionTitle title="Academic details" description="Stability and work completion signals." />
            <div className="space-y-4">
              {[
                { label: 'Recent average', value: pct(analytics.recentAvgScore), icon: Activity },
                { label: 'Assignment rate', value: pct(analytics.assignmentCompletionRate), icon: BookOpenCheck },
                { label: 'Study consistency', value: `${number(analytics.studyConsistencyScore).toFixed(0)}/100`, icon: TrendingUp },
                { label: 'Score trend', value: scoreTrend >= 0 ? `+${scoreTrend.toFixed(1)}` : scoreTrend.toFixed(1), icon: scoreTrend >= 0 ? TrendingUp : TrendingDown },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="text-sm text-slate-500 dark:text-slate-400">{label}</span>
                  </div>
                  <span className="text-sm font-semibold text-slate-950 dark:text-white">{value}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {isStudent && (
        <Card className="mt-6 p-5">
          <SectionTitle title="Log a study session" description="Study activity helps the model keep recommendations personal and current." />
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <label htmlFor="study-subject">Subject</label>
              <input id="study-subject" value={studySubject} onChange={(event) => setStudySubject(event.target.value)} placeholder="e.g. Data Structures" />
            </div>
            <div>
              <label htmlFor="study-date">Date</label>
              <input id="study-date" type="date" value={studyDate} onChange={(event) => setStudyDate(event.target.value)} />
            </div>
            <div>
              <label htmlFor="study-hours">Hours</label>
              <input id="study-hours" type="number" step="0.5" min="0.5" max="16" value={studyHours} onChange={(event) => setStudyHours(event.target.value)} placeholder="1.5" />
            </div>
            <label className="flex items-end gap-3 rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-950">
              <input className="h-4 w-4 rounded border-slate-300 p-0 text-indigo-600 focus:ring-indigo-500" type="checkbox" checked={studyRev} onChange={(event) => setStudyRev(event.target.checked)} />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Revision session</span>
            </label>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button onClick={handleLogStudy} disabled={savingStudy}>
              {savingStudy ? 'Saving...' : 'Save session'}
            </Button>
            {studyMsg && <p className={`text-sm font-medium ${studyMsg.includes('Failed') || studyMsg.includes('Enter') ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>{studyMsg}</p>}
          </div>
        </Card>
      )}
    </div>
  );
}
  
