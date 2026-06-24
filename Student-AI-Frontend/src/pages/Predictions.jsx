import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowUpRight, Brain, CheckCircle2, RefreshCcw, Target, Users } from 'lucide-react';
import { dashboardAPI, studentAPI } from '../api/api';
import { Badge, Button, Card, EmptyState, MetricCard, PageHeader } from '../components/ui/DashboardPrimitives';

const RISK_TONE = {
  HIGH: 'red',
  MEDIUM: 'amber',
  LOW: 'emerald',
};

function initials(name = '') {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'ST';
}

function valueOrDash(value) {
  const number = Number(value);
  return Number.isFinite(number) ? `${number.toFixed(1)}%` : '-';
}

function Progress({ value = 0, tone = 'indigo' }) {
  const colors = {
    indigo: 'bg-indigo-600',
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-500',
    red: 'bg-red-500',
  };

  return (
    <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
      <div className={`h-full rounded-full ${colors[tone] || colors.indigo}`} style={{ width: `${Math.max(0, Math.min(100, Number(value) || 0))}%` }} />
    </div>
  );
}

export default function Predictions() {
  const [students, setStudents] = useState([]);
  const [predictions, setPredictions] = useState({});
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState({});
  const [refreshingAll, setRefreshingAll] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    studentAPI.getAll()
      .then((response) => setStudents(response.data))
      .finally(() => setLoading(false));
  }, []);

  const fetchPrediction = async (studentId) => {
    setFetching((previous) => ({ ...previous, [studentId]: true }));
    try {
      const response = await dashboardAPI.get(studentId);
      setPredictions((previous) => ({ ...previous, [studentId]: response.data }));
    } catch {
      setPredictions((previous) => ({ ...previous, [studentId]: { error: 'No analytics data yet.' } }));
    } finally {
      setFetching((previous) => ({ ...previous, [studentId]: false }));
    }
  };

  const fetchAll = async () => {
    setRefreshingAll(true);
    await Promise.all(students.map((student) => fetchPrediction(student.id)));
    setRefreshingAll(false);
  };

  const analysed = useMemo(() => students.filter((student) => predictions[student.id] && !predictions[student.id].error), [students, predictions]);
  const highRisk = analysed.filter((student) => ['HIGH', 'MEDIUM'].includes(predictions[student.id]?.riskLevel));
  const classAverage = analysed.length
    ? analysed.reduce((acc, student) => acc + (Number(predictions[student.id]?.predictedScore) || 0), 0) / analysed.length
    : 0;

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="h-24 skeleton" />
        <div className="grid gap-4 md:grid-cols-3">
          {[0, 1, 2].map((item) => <div key={item} className="h-28 skeleton" />)}
        </div>
        <div className="h-96 skeleton" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow="AI prediction queue"
        title="AI Predictions"
        description="Run class-wide forecasting, compare risk levels, and jump into dashboards for intervention planning."
        actions={
          <Button onClick={fetchAll} disabled={refreshingAll || students.length === 0}>
            <RefreshCcw className={refreshingAll ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
            {refreshingAll ? 'Analyzing...' : 'Analyze all'}
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Students analyzed" value={analysed.length} sub={`${students.length} total students`} icon={Users} tone="indigo" />
        <MetricCard label="At-risk students" value={highRisk.length} sub="Medium &amp; high-risk forecast" icon={AlertTriangle} tone={highRisk.length ? 'red' : 'emerald'} />
        <MetricCard label="Class average" value={analysed.length ? `${classAverage.toFixed(1)}%` : '-'} sub="Predicted score" icon={Brain} tone="emerald" />
      </div>

      <Card className="mt-6 overflow-hidden">
        <div className="border-b border-slate-200 p-4 dark:border-slate-800">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-semibold text-slate-950 dark:text-white">Prediction roster</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Compact rows keep the workflow fast even when the class grows.</p>
            </div>
            <Badge tone="slate">{students.length} students</Badge>
          </div>
        </div>

        {students.length === 0 ? (
          <div className="p-6">
            <EmptyState title="No students available" description="Create students first, then run predictions." />
          </div>
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {students.map((student) => {
              const prediction = predictions[student.id];
              const tone = RISK_TONE[prediction?.riskLevel] || 'slate';

              return (
                <article key={student.id} className="p-4 transition hover:bg-slate-50 dark:hover:bg-slate-900/60">
                  <div className="grid gap-4 xl:grid-cols-[minmax(220px,1fr)_minmax(380px,1.4fr)_auto] xl:items-center">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-indigo-50 text-sm font-semibold text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300">
                        {initials(student.name)}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-950 dark:text-white">{student.name}</p>
                        <p className="truncate text-sm text-slate-500 dark:text-slate-400">{student.department} / Sem {student.semester}</p>
                      </div>
                    </div>

                    {prediction && !prediction.error ? (
                      <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-center">
                        <div>
                          <div className="mb-1 flex justify-between text-xs text-slate-500 dark:text-slate-400">
                            <span>Predicted score</span>
                            <span className="font-semibold text-slate-700 dark:text-slate-300">{valueOrDash(prediction.predictedScore)}</span>
                          </div>
                          <Progress value={prediction.predictedScore} tone={Number(prediction.predictedScore) >= 60 ? 'emerald' : Number(prediction.predictedScore) >= 45 ? 'amber' : 'red'} />
                        </div>
                        <div>
                          <div className="mb-1 flex justify-between text-xs text-slate-500 dark:text-slate-400">
                            <span>Pass confidence</span>
                            <span className="font-semibold text-slate-700 dark:text-slate-300">{valueOrDash(prediction.passProbability)}</span>
                          </div>
                          <Progress value={prediction.passProbability} tone={prediction.willPass ? 'emerald' : 'red'} />
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge tone={tone}>{prediction.riskLevel || 'Unknown'}</Badge>
                          <Badge tone={prediction.willPass ? 'emerald' : 'red'}>
                            {prediction.willPass ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Target className="h-3.5 w-3.5" />}
                            {prediction.willPass ? 'Pass likely' : 'Action needed'}
                          </Badge>
                        </div>
                      </div>
                    ) : prediction?.error ? (
                      <div className="rounded-2xl bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
                        {prediction.error}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500 dark:text-slate-400">Run analysis to generate a forecast for this student.</p>
                    )}

                    <div className="flex flex-wrap gap-2 xl:justify-end">
                      <Button size="sm" onClick={() => navigate(`/dashboard/${student.id}`)}>
                        Details
                        <ArrowUpRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}