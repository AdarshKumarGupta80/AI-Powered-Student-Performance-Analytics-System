import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BarChart3,
  CalendarCheck,
  Download,
  FileText,
  Loader2,
  Mail,
  RefreshCcw,
  ShieldAlert,
} from 'lucide-react';
import { reportAPI } from '../api/api';
import { useAuth } from '../context/AuthContext';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  PageHeader,
  SectionTitle,
} from '../components/ui/DashboardPrimitives';

const RISK_TONE = { HIGH: 'red', MEDIUM: 'amber', LOW: 'emerald' };

function fmt(v, decimals = 1) {
  return Number.isFinite(Number(v)) ? Number(v).toFixed(decimals) : '—';
}

function ReportCard({ report, onDownload, downloading }) {
  const tone = RISK_TONE[report.riskLevelSnapshot] || 'slate';
  const date = report.generatedAt
    ? new Date(report.generatedAt).toLocaleDateString('en-IN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '—';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
    >
      <Card className="p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Badge tone={tone}>{report.riskLevelSnapshot || 'UNKNOWN'} Risk</Badge>
              {report.emailSent && (
                <Badge tone="emerald">
                  <Mail className="h-3 w-3" />
                  Emailed
                </Badge>
              )}
              <span className="text-xs text-slate-400">{date}</span>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { icon: BarChart3, label: 'Avg Score', value: `${fmt(report.avgScoreSnapshot)}%` },
                { icon: CalendarCheck, label: 'Attendance', value: `${fmt(report.attendanceSnapshot)}%` },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="rounded-xl bg-slate-50 p-3 dark:bg-slate-900">
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                    <Icon className="h-3.5 w-3.5" />
                    {label}
                  </div>
                  <p className="text-lg font-semibold text-slate-950 dark:text-white">{value}</p>
                </div>
              ))}
            </div>

            {report.aiAnalysis && (
              <div className="mt-3 border-l-4 border-indigo-200 pl-3 text-sm leading-6 text-slate-600 dark:border-indigo-500/30 dark:text-slate-400 line-clamp-3">
                {report.aiAnalysis.slice(0, 280)}…
              </div>
            )}
          </div>

          <Button
            variant="secondary"
            onClick={() => onDownload(report.id)}
            disabled={downloading === report.id}
            className="shrink-0"
          >
            {downloading === report.id ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            PDF
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}

export default function Reports() {
  // Works for both /reports (student uses own id) and /reports/:id (teacher views a student)
  const { id: paramId } = useParams();
  const { studentId: authStudentId, isTeacher } = useAuth();
  const studentId = paramId || authStudentId;

  const [reports,    setReports]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [generating, setGenerating] = useState(false);
  const [sending,    setSending]    = useState(false);
  const [downloading, setDownloading] = useState(null);
  const [error,      setError]      = useState('');
  const [msg,        setMsg]        = useState('');

  const showMsg = (text, ms = 3500) => {
    setMsg(text);
    setTimeout(() => setMsg(''), ms);
  };

  const load = async () => {
    if (!studentId) return;
    setLoading(true);
    try {
      const { data } = await reportAPI.getHistory(studentId);
      setReports(data);
      setError('');
    } catch (e) {
      setError('Could not load reports. Make sure analytics have been computed first.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [studentId]);

  const handleGenerate = async () => {
    if (!studentId) return;
    setGenerating(true);
    try {
      await reportAPI.generate(studentId);
      showMsg('✓ Report generated successfully!');
      await load();
    } catch (e) {
      const msg = e.response?.data?.message || e.message;
      showMsg(`Failed: ${msg}`);
    } finally {
      setGenerating(false);
    }
  };

  const handleSendEmail = async () => {
    if (!studentId) return;
    setSending(true);
    try {
      await reportAPI.sendEmail(studentId);
      showMsg('✓ Report emailed to student!');
      await load();
    } catch (e) {
      showMsg('Email failed. Check MAIL_USERNAME/MAIL_PASSWORD env vars.');
    } finally {
      setSending(false);
    }
  };

  const handleDownload = async (reportId) => {
    setDownloading(reportId);
    try {
      const { data } = await reportAPI.downloadPdf(reportId);
      const url = URL.createObjectURL(new Blob([data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `report-${reportId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      showMsg('PDF download failed.');
    } finally {
      setDownloading(null);
    }
  };

  if (!studentId) {
    return (
      <Card className="p-6 max-w-lg">
        <p className="text-slate-500 text-sm">Student ID not available. Please log in as a student or navigate from a student record.</p>
      </Card>
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow="AI-powered"
        title="Performance Reports"
        description="AI-generated weekly reports analysing academic performance, risk factors, and actionable recommendations."
        actions={
          <>
            {isTeacher && (
              <Button variant="secondary" onClick={handleSendEmail} disabled={sending}>
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                {sending ? 'Sending…' : 'Send Email'}
              </Button>
            )}
            <Button onClick={handleGenerate} disabled={generating}>
              {generating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileText className="h-4 w-4" />
              )}
              {generating ? 'Generating…' : 'Generate Report'}
            </Button>
          </>
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

      {loading ? (
        <div className="space-y-4">
          {[0, 1, 2].map(i => <div key={i} className="h-40 skeleton" />)}
        </div>
      ) : reports.length === 0 ? (
        <EmptyState
          title="No reports yet"
          description="Click 'Generate Report' to create your first AI-powered performance analysis. Make sure analytics have been computed first."
        />
      ) : (
        <div className="space-y-4">
          <SectionTitle
            title={`${reports.length} report${reports.length !== 1 ? 's' : ''}`}
            description="Most recent first"
          />
          {reports.map(r => (
            <ReportCard
              key={r.id}
              report={r}
              onDownload={handleDownload}
              downloading={downloading}
            />
          ))}
        </div>
      )}
    </div>
  );
}
