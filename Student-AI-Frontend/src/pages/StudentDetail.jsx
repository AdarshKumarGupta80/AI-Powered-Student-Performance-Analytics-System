import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { studentAPI, academicAPI } from '../api/api';

const INPUT = { width: '100%', marginTop: 4 };
const LABEL = { fontSize: 12, color: 'var(--color-text-secondary)',
                display: 'block', marginBottom: 4 };
const CARD = {
  background: 'var(--color-background-primary)',
  border: '0.5px solid var(--color-border-tertiary)',
  borderRadius: 'var(--border-radius-lg)',
  padding: '20px 22px', marginBottom: 16,
};
const SECTION_TITLE = {
  fontSize: 14, fontWeight: 500,
  color: 'var(--color-text-primary)', marginBottom: 16,
};
const GRID2 = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 };
const SUCCESS = { fontSize: 12, color: 'var(--color-text-success)',
                  marginTop: 8 };
const ERROR   = { fontSize: 12, color: 'var(--color-text-danger)',
                  marginTop: 8 };

function Section({ title, children }) {
  return (
    <div style={CARD}>
      <div style={SECTION_TITLE}>{title}</div>
      {children}
    </div>
  );
}

export default function StudentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  const [mark,     setMark]     = useState({ subject:'', score:'', maxScore:'100', examType:'MIDTERM', examDate:'' });
  const [attend,   setAttend]   = useState({ subject:'', month:'', year:'', classesHeld:'', classesAttended:'' });
  const [assign,   setAssign]   = useState({ subject:'', title:'', dueDate:'', submittedDate:'', score:'', maxScore:'100', status:'SUBMITTED_ON_TIME' });
  const [study,    setStudy]    = useState({ subject:'', date:'', hoursStudied:'', revisionSession: false });
  const [engage,   setEngage]   = useState({ date:'', loginCount:'', sessionDurationMinutes:'', materialsAccessed:'', doubtSessionsAttended:'', lectureCompletionRate:'' });

  const [fb, setFb] = useState({});

  useEffect(() => {
    studentAPI.getById(id)
      .then(r => setStudent(r.data))
      .finally(() => setLoading(false));
  }, [id]);

  const feedback = (key, msg, isError = false) => {
    setFb(p => ({ ...p, [key]: { msg, isError } }));
    setTimeout(() => setFb(p => ({ ...p, [key]: null })), 3000);
  };

  const submit = async (key, apiFn, data, reset) => {
    try {
      await apiFn(id, data);
      feedback(key, 'Saved successfully!');
      reset();
    } catch (e) {
      feedback(key, e.response?.data?.message || 'Error saving.', true);
    }
  };

  const Feedback = ({ k }) => fb[k]
    ? <div style={fb[k].isError ? ERROR : SUCCESS}>{fb[k].msg}</div>
    : null;

  const Btn = ({ onClick, label }) => (
    <button onClick={onClick} style={{
      marginTop: 14, padding: '9px 20px', fontSize: 13, fontWeight: 500,
      background: '#1D9E75', color: '#fff', border: 'none',
      borderRadius: 'var(--border-radius-md)', cursor: 'pointer',
    }}>{label}</button>
  );

  if (loading) return <div style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>Loading...</div>;
  if (!student) return <div style={{ fontSize: 14, color: 'var(--color-text-danger)' }}>Student not found.</div>;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center',
                    gap: 12, marginBottom: 24 }}>
        <button onClick={() => navigate(-1)} style={{
          fontSize: 13, color: 'var(--color-text-secondary)',
          background: 'none', border: 'none', cursor: 'pointer', padding: 0,
        }}>← Back</button>
        <div style={{ width: 40, height: 40, borderRadius: '50%',
                      background: '#E1F5EE', display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                      fontSize: 13, fontWeight: 500, color: '#085041' }}>
          {student.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2)}
        </div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 500,
                        color: 'var(--color-text-primary)' }}>{student.name}</div>
          <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
            {student.department} · Semester {student.semester} · {student.enrollmentNumber}
          </div>
        </div>
        <button onClick={() => navigate(`/dashboard/${id}`)} style={{
          marginLeft: 'auto', padding: '8px 16px', fontSize: 13,
          fontWeight: 500, background: '#1D9E75', color: '#fff',
          border: 'none', borderRadius: 'var(--border-radius-md)', cursor: 'pointer',
        }}>View dashboard →</button>
      </div>

      <Section title="Add exam marks">
        <div style={GRID2}>
          <div>
            <label style={LABEL}>Subject</label>
            <input style={INPUT} value={mark.subject} placeholder="e.g. DSA"
              onChange={e => setMark({...mark, subject: e.target.value})} />
          </div>
          <div>
            <label style={LABEL}>Exam type</label>
            <select style={INPUT} value={mark.examType}
              onChange={e => setMark({...mark, examType: e.target.value})}>
              <option>MIDTERM</option>
              <option>FINAL</option>
              <option>ASSIGNMENT</option>
              <option>QUIZ</option>
            </select>
          </div>
          <div>
            <label style={LABEL}>Score obtained</label>
            <input style={INPUT} type="number" value={mark.score} placeholder="72"
              onChange={e => setMark({...mark, score: e.target.value})} />
          </div>
          <div>
            <label style={LABEL}>Max score</label>
            <input style={INPUT} type="number" value={mark.maxScore} placeholder="100"
              onChange={e => setMark({...mark, maxScore: e.target.value})} />
          </div>
          <div>
            <label style={LABEL}>Exam date</label>
            <input style={INPUT} type="date" value={mark.examDate}
              onChange={e => setMark({...mark, examDate: e.target.value})} />
          </div>
        </div>
        <Btn label="Save mark" onClick={() =>
          submit('mark', academicAPI.addMark, {
            subject: mark.subject, score: parseFloat(mark.score),
            maxScore: parseFloat(mark.maxScore),
            examType: mark.examType, examDate: mark.examDate,
          }, () => setMark({ subject:'', score:'', maxScore:'100', examType:'MIDTERM', examDate:'' }))
        }/>
        <Feedback k="mark" />
      </Section>

      <Section title="Add attendance">
        <div style={GRID2}>
          <div>
            <label style={LABEL}>Subject</label>
            <input style={INPUT} value={attend.subject} placeholder="e.g. DSA"
              onChange={e => setAttend({...attend, subject: e.target.value})} />
          </div>
          <div>
            <label style={LABEL}>Month (1–12)</label>
            <input style={INPUT} type="number" min="1" max="12" value={attend.month}
              onChange={e => setAttend({...attend, month: e.target.value})} />
          </div>
          <div>
            <label style={LABEL}>Year</label>
            <input style={INPUT} type="number" value={attend.year} placeholder="2024"
              onChange={e => setAttend({...attend, year: e.target.value})} />
          </div>
          <div>
            <label style={LABEL}>Classes held</label>
            <input style={INPUT} type="number" value={attend.classesHeld}
              onChange={e => setAttend({...attend, classesHeld: e.target.value})} />
          </div>
          <div>
            <label style={LABEL}>Classes attended</label>
            <input style={INPUT} type="number" value={attend.classesAttended}
              onChange={e => setAttend({...attend, classesAttended: e.target.value})} />
          </div>
        </div>
        <Btn label="Save attendance" onClick={() =>
          submit('attend', academicAPI.addAttendance, {
            subject: attend.subject,
            month: parseInt(attend.month), year: parseInt(attend.year),
            classesHeld: parseInt(attend.classesHeld),
            classesAttended: parseInt(attend.classesAttended),
          }, () => setAttend({ subject:'', month:'', year:'', classesHeld:'', classesAttended:'' }))
        }/>
        <Feedback k="attend" />
      </Section>

      <Section title="Add assignment">
        <div style={GRID2}>
          <div>
            <label style={LABEL}>Subject</label>
            <input style={INPUT} value={assign.subject} placeholder="e.g. DBMS"
              onChange={e => setAssign({...assign, subject: e.target.value})} />
          </div>
          <div>
            <label style={LABEL}>Title</label>
            <input style={INPUT} value={assign.title} placeholder="Assignment title"
              onChange={e => setAssign({...assign, title: e.target.value})} />
          </div>
          <div>
            <label style={LABEL}>Due date</label>
            <input style={INPUT} type="date" value={assign.dueDate}
              onChange={e => setAssign({...assign, dueDate: e.target.value})} />
          </div>
          <div>
            <label style={LABEL}>Submitted date</label>
            <input style={INPUT} type="date" value={assign.submittedDate}
              onChange={e => setAssign({...assign, submittedDate: e.target.value})} />
          </div>
          <div>
            <label style={LABEL}>Score</label>
            <input style={INPUT} type="number" value={assign.score}
              onChange={e => setAssign({...assign, score: e.target.value})} />
          </div>
          <div>
            <label style={LABEL}>Max score</label>
            <input style={INPUT} type="number" value={assign.maxScore}
              onChange={e => setAssign({...assign, maxScore: e.target.value})} />
          </div>
          <div>
            <label style={LABEL}>Status</label>
            <select style={INPUT} value={assign.status}
              onChange={e => setAssign({...assign, status: e.target.value})}>
              <option value="SUBMITTED_ON_TIME">Submitted on time</option>
              <option value="SUBMITTED_LATE">Submitted late</option>
              <option value="NOT_SUBMITTED">Not submitted</option>
            </select>
          </div>
        </div>
        <Btn label="Save assignment" onClick={() =>
          submit('assign', academicAPI.addAssignment, {
            subject: assign.subject, title: assign.title,
            dueDate: assign.dueDate, submittedDate: assign.submittedDate || null,
            score: assign.score ? parseFloat(assign.score) : null,
            maxScore: parseFloat(assign.maxScore), status: assign.status,
          }, () => setAssign({ subject:'', title:'', dueDate:'', submittedDate:'', score:'', maxScore:'100', status:'SUBMITTED_ON_TIME' }))
        }/>
        <Feedback k="assign" />
      </Section>

      <Section title="Add study session">
        <div style={GRID2}>
          <div>
            <label style={LABEL}>Subject</label>
            <input style={INPUT} value={study.subject} placeholder="e.g. DSA"
              onChange={e => setStudy({...study, subject: e.target.value})} />
          </div>
          <div>
            <label style={LABEL}>Date</label>
            <input style={INPUT} type="date" value={study.date}
              onChange={e => setStudy({...study, date: e.target.value})} />
          </div>
          <div>
            <label style={LABEL}>Hours studied</label>
            <input style={INPUT} type="number" step="0.5" value={study.hoursStudied}
              placeholder="e.g. 1.5"
              onChange={e => setStudy({...study, hoursStudied: e.target.value})} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 18 }}>
            <input type="checkbox" id="rev" checked={study.revisionSession}
              onChange={e => setStudy({...study, revisionSession: e.target.checked})} />
            <label htmlFor="rev" style={{ fontSize: 13,
                                          color: 'var(--color-text-primary)' }}>
              Revision session
            </label>
          </div>
        </div>
        <Btn label="Save study session" onClick={() =>
          submit('study', academicAPI.addStudySession, {
            subject: study.subject, date: study.date,
            hoursStudied: parseFloat(study.hoursStudied),
            revisionSession: study.revisionSession,
          }, () => setStudy({ subject:'', date:'', hoursStudied:'', revisionSession: false }))
        }/>
        <Feedback k="study" />
      </Section>

      <Section title="Add engagement log">
        <div style={GRID2}>
          <div>
            <label style={LABEL}>Date</label>
            <input style={INPUT} type="date" value={engage.date}
              onChange={e => setEngage({...engage, date: e.target.value})} />
          </div>
          <div>
            <label style={LABEL}>Login count</label>
            <input style={INPUT} type="number" value={engage.loginCount}
              onChange={e => setEngage({...engage, loginCount: e.target.value})} />
          </div>
          <div>
            <label style={LABEL}>Session duration (mins)</label>
            <input style={INPUT} type="number" value={engage.sessionDurationMinutes}
              placeholder="e.g. 45"
              onChange={e => setEngage({...engage, sessionDurationMinutes: e.target.value})} />
          </div>
          <div>
            <label style={LABEL}>Materials accessed</label>
            <input style={INPUT} type="number" value={engage.materialsAccessed}
              onChange={e => setEngage({...engage, materialsAccessed: e.target.value})} />
          </div>
          <div>
            <label style={LABEL}>Doubt sessions attended</label>
            <input style={INPUT} type="number" value={engage.doubtSessionsAttended}
              onChange={e => setEngage({...engage, doubtSessionsAttended: e.target.value})} />
          </div>
          <div>
            <label style={LABEL}>Lecture completion rate (0.0–1.0)</label>
            <input style={INPUT} type="number" step="0.01" min="0" max="1"
              value={engage.lectureCompletionRate} placeholder="e.g. 0.85"
              onChange={e => setEngage({...engage, lectureCompletionRate: e.target.value})} />
          </div>
        </div>
        <Btn label="Save engagement log" onClick={() =>
          submit('engage', academicAPI.addEngagement, {
            date: engage.date,
            loginCount: parseInt(engage.loginCount),
            sessionDurationMinutes: parseFloat(engage.sessionDurationMinutes),
            materialsAccessed: parseInt(engage.materialsAccessed),
            doubtSessionsAttended: parseInt(engage.doubtSessionsAttended),
            lectureCompletionRate: parseFloat(engage.lectureCompletionRate),
          }, () => setEngage({ date:'', loginCount:'', sessionDurationMinutes:'', materialsAccessed:'', doubtSessionsAttended:'', lectureCompletionRate:'' }))
        }/>
        <Feedback k="engage" />
      </Section>
    </div>
  );
}