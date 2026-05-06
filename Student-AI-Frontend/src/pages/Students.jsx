import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, ChevronLeft, ChevronRight, Filter, Search, SlidersHorizontal, Users } from 'lucide-react';
import { studentAPI } from '../api/api';
import { Badge, Button, Card, EmptyState, MetricCard, PageHeader } from '../components/ui/DashboardPrimitives';

const PAGE_SIZE = 8;

function initials(name = '') {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'ST';
}

function deptTone(department) {
  const tones = {
    CSE: 'indigo',
    IT: 'indigo',
    ECE: 'emerald',
    ME: 'amber',
    CIVIL: 'slate',
  };
  return tones[department?.toUpperCase()] || 'slate';
}

export default function Students() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('ALL');
  const [sort, setSort] = useState('name');
  const [page, setPage] = useState(1);
  const navigate = useNavigate();

  useEffect(() => {
    studentAPI.getAll()
      .then((response) => setStudents(response.data))
      .finally(() => setLoading(false));
  }, []);

  const departments = useMemo(() => ['ALL', ...Array.from(new Set(students.map((student) => student.department).filter(Boolean))).sort()], [students]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return students
      .filter((student) => department === 'ALL' || student.department === department)
      .filter((student) => (
        student.name?.toLowerCase().includes(query)
        || student.department?.toLowerCase().includes(query)
        || student.enrollmentNumber?.toLowerCase().includes(query)
        || student.email?.toLowerCase().includes(query)
      ))
      .sort((a, b) => {
        if (sort === 'semester') return Number(a.semester || 0) - Number(b.semester || 0);
        if (sort === 'department') return String(a.department || '').localeCompare(String(b.department || ''));
        return String(a.name || '').localeCompare(String(b.name || ''));
      });
  }, [students, search, department, sort]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [search, department, sort]);

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="h-24 skeleton" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((item) => <div key={item} className="h-28 skeleton" />)}
        </div>
        <div className="h-96 skeleton" />
      </div>
    );
  }

  const semesterCount = new Set(students.map((student) => student.semester).filter(Boolean)).size;

  return (
    <div>
      <PageHeader
        eyebrow="Student operations"
        title="Students"
        description="Search, filter, sort, and open AI-powered dashboards without turning the roster into a heavy management screen."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Total students" value={students.length} sub={`${filtered.length} visible`} icon={Users} tone="indigo" />
        <MetricCard label="Departments" value={departments.length - 1} sub="Active academic groups" icon={Filter} tone="emerald" />
        <MetricCard label="Semesters" value={semesterCount} sub="Across roster" icon={SlidersHorizontal} tone="amber" />
        <MetricCard label="Role view" value="Teacher" sub="Manage and analyze" icon={ArrowUpRight} tone="slate" />
      </div>

      <Card className="mt-6 overflow-hidden">
        <div className="border-b border-slate-200 p-4 dark:border-slate-800">
          <div className="grid gap-3 lg:grid-cols-[1fr_180px_180px]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                className="pl-10"
                placeholder="Search by name, enrollment, email, or department..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            <select aria-label="Filter by department" value={department} onChange={(event) => setDepartment(event.target.value)}>
              {departments.map((dept) => <option key={dept} value={dept}>{dept === 'ALL' ? 'All departments' : dept}</option>)}
            </select>
            <select aria-label="Sort students" value={sort} onChange={(event) => setSort(event.target.value)}>
              <option value="name">Sort by name</option>
              <option value="department">Sort by department</option>
              <option value="semester">Sort by semester</option>
            </select>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="p-6">
            <EmptyState title="No students found" description="Adjust the search or filters to find a student." />
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
                <thead className="bg-slate-50 dark:bg-slate-900/70">
                  <tr>
                    {['Student', 'Department', 'Semester', 'Enrollment', 'Action'].map((heading) => (
                      <th key={heading} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {paged.map((student) => (
                    <tr key={student.id} className="transition hover:bg-slate-50 dark:hover:bg-slate-900/70">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50 text-sm font-semibold text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300">
                            {initials(student.name)}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-950 dark:text-white">{student.name}</p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">{student.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4"><Badge tone={deptTone(student.department)}>{student.department || 'Not assigned'}</Badge></td>
                      <td className="px-5 py-4 text-sm font-medium text-slate-700 dark:text-slate-300">Semester {student.semester || '-'}</td>
                      <td className="px-5 py-4 font-mono text-xs text-slate-500 dark:text-slate-400">{student.enrollmentNumber || '-'}</td>
                      <td className="px-5 py-4">
                        <Button size="sm" onClick={() => navigate(`/dashboard/${student.id}`)}>
                          View
                          <ArrowUpRight className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid gap-3 p-4 md:hidden">
              {paged.map((student) => (
                <button
                  key={student.id}
                  type="button"
                  onClick={() => navigate(`/dashboard/${student.id}`)}
                  className="rounded-2xl border border-slate-200 bg-white p-4 text-left dark:border-slate-800 dark:bg-slate-950"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-indigo-50 text-sm font-semibold text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300">
                      {initials(student.name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-950 dark:text-white">{student.name}</p>
                      <p className="truncate text-sm text-slate-500 dark:text-slate-400">{student.enrollmentNumber || student.email}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Badge tone={deptTone(student.department)}>{student.department || 'Not assigned'}</Badge>
                        <Badge tone="slate">Semester {student.semester || '-'}</Badge>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Showing {(currentPage - 1) * PAGE_SIZE + 1}-{Math.min(currentPage * PAGE_SIZE, filtered.length)} of {filtered.length}
              </p>
              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" disabled={currentPage === 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button variant="secondary" size="sm" disabled={currentPage === pageCount} onClick={() => setPage((value) => Math.min(pageCount, value + 1))}>
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
