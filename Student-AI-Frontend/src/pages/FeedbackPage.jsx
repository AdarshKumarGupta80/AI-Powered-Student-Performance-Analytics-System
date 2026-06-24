import { useState, useEffect } from "react";
import axios from "axios";

const API = process.env.REACT_APP_API_URL;
const token = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });

const SENTIMENT_COLORS = {
  POSITIVE: "bg-green-100 text-green-800",
  NEGATIVE: "bg-red-100 text-red-800",
  NEUTRAL:  "bg-gray-100 text-gray-700",
  MIXED:    "bg-yellow-100 text-yellow-800",
};

export default function FeedbackPage({ studentId }) {
  const [form, setForm] = useState({ feedbackText: "", category: "platform", rating: 5 });
  const [feedbacks, setFeedbacks] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => { fetchFeedback(); fetchDashboard(); }, []);

  const fetchFeedback = async () => {
    const { data } = await axios.get(`${API}/api/feedback/student/${studentId}`, token());
    setFeedbacks(data);
  };
  const fetchDashboard = async () => {
    const { data } = await axios.get(`${API}/api/feedback/dashboard`, token());
    setDashboard(data);
  };

  const handleSubmit = async () => {
    if (!form.feedbackText.trim()) return;
    setSubmitting(true);
    try {
      await axios.post(`${API}/api/feedback`,
        { ...form, studentId, submittedBy: "student" }, token());
      setSubmitted(true);
      setForm({ feedbackText: "", category: "platform", rating: 5 });
      fetchFeedback(); fetchDashboard();
      setTimeout(() => setSubmitted(false), 3000);
    } finally { setSubmitting(false); }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-8">
      <h1 className="text-2xl font-semibold text-gray-800">Feedback</h1>

      {/* Sentiment Dashboard */}
      {dashboard && (
        <div className="bg-white border rounded-xl p-5 shadow-sm">
          <h2 className="font-medium text-gray-700 mb-3">Platform Sentiment Overview</h2>
          <div className="flex gap-3 flex-wrap">
            {Object.entries(dashboard.distribution || {}).map(([label, count]) => (
              <div key={label} className={`px-3 py-1.5 rounded-full text-sm font-medium ${SENTIMENT_COLORS[label] || "bg-gray-100"}`}>
                {label}: {count}
              </div>
            ))}
            <div className="px-3 py-1.5 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
              Total: {dashboard.total}
            </div>
          </div>
        </div>
      )}

      {/* Submit Form */}
      <div className="bg-white border rounded-xl p-5 shadow-sm">
        <h2 className="font-medium text-gray-700 mb-4">Submit Feedback</h2>
        <div className="space-y-3">
          <div className="flex gap-3">
            <select value={form.category} onChange={e => setForm({...form, category: e.target.value})}
              className="border rounded-lg px-3 py-2 text-sm flex-1">
              <option value="platform">Platform</option>
              <option value="content">Course Content</option>
              <option value="support">Support</option>
              <option value="analytics">Analytics</option>
            </select>
            <div className="flex items-center gap-1">
              {[1,2,3,4,5].map(n => (
                <button key={n} onClick={() => setForm({...form, rating: n})}
                  className={`text-xl ${n <= form.rating ? "text-yellow-400" : "text-gray-300"}`}>★</button>
              ))}
            </div>
          </div>
          <textarea value={form.feedbackText}
            onChange={e => setForm({...form, feedbackText: e.target.value})}
            placeholder="Share your thoughts about the platform, course content, or analytics..."
            rows={4}
            className="w-full border rounded-lg px-3 py-2 text-sm resize-none focus:ring-2 focus:ring-indigo-300 focus:outline-none" />
          <div className="flex items-center gap-3">
            <button onClick={handleSubmit} disabled={submitting || !form.feedbackText.trim()}
              className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50">
              {submitting ? "Analyzing..." : "Submit & Analyze"}
            </button>
            {submitted && <span className="text-green-600 text-sm">✓ Submitted! AI sentiment analyzed.</span>}
            <span className="text-xs text-gray-400 ml-auto">AI will analyze sentiment automatically</span>
          </div>
        </div>
      </div>

      {/* Feedback History */}
      {feedbacks.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-medium text-gray-700">Your Feedback History</h2>
          {feedbacks.map(f => (
            <div key={f.id} className="bg-white border rounded-xl p-4 shadow-sm">
              <div className="flex items-start justify-between mb-2">
                <div className="flex gap-2 items-center">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${SENTIMENT_COLORS[f.sentimentLabel] || "bg-gray-100"}`}>
                    {f.sentimentLabel}
                  </span>
                  <span className="text-xs text-gray-400">{f.category}</span>
                  <span className="text-yellow-400 text-sm">{"★".repeat(f.rating)}</span>
                </div>
                <span className="text-xs text-gray-400">
                  {new Date(f.submittedAt).toLocaleDateString()}
                </span>
              </div>
              <p className="text-sm text-gray-700 mb-2">{f.feedbackText}</p>
              {f.aiSummary && (
                <div className="bg-gray-50 rounded-lg p-2 text-xs text-gray-600 border-l-2 border-indigo-300">
                  <span className="font-medium">AI Summary:</span> {f.aiSummary}
                </div>
              )}
              {f.keyThemes && (
                <div className="mt-1 flex gap-1 flex-wrap">
                  {f.keyThemes.split(",").map(t => t.trim()).filter(Boolean).map(t => (
                    <span key={t} className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">{t}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}