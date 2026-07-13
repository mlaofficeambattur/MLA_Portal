import React, { useState, useEffect, useRef } from 'react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  PieChart, 
  Pie 
} from 'recharts';
import { 
  FileSpreadsheet, 
  UploadCloud, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Filter, 
  RefreshCw, 
  Download, 
  Printer, 
  Users, 
  Layers, 
  MapPin, 
  Calendar,
  Search,
  ChevronLeft,
  ChevronRight,
  TrendingUp
} from 'lucide-react';

const CHART_COLORS = [
  '#b8860b', // Gold / Primary Green
  '#d7263d', // Red / Saffron
  '#132b4f', // Navy Blue
  '#10b981', // Emerald
  '#3b82f6', // Info Blue
  '#f59e0b', // Warning Amber
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#f97316'  // Orange
];

export default function NammaMlaAnalytics({ adminToken, API_BASE, showNotification, readOnly }) {
  const [activeTab, setActiveTab] = useState('dashboard'); // dashboard, upload, reports, export
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  
  // Drill down detailed complaint modal state
  const [drillModal, setDrillModal] = useState({ open: false, filterName: '', filterValue: '', complaints: [], page: 1, total: 0 });

  // Upload state
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [validationResult, setValidationResult] = useState(null);
  const [uploadHistory, setUploadHistory] = useState([]);
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [validationActiveTab, setValidationActiveTab] = useState('valid'); // valid, duplicate, invalid

  // Reports state
  const [leaderboard, setLeaderboard] = useState([]);
  const [wardPerf, setWardPerf] = useState(null);

  // Global Filters State
  const [filters, setFilters] = useState({
    start_date: '',
    end_date: '',
    ward_number: '',
    category: '',
    status: '',
    priority: '',
    assignee: '',
    constituency: '',
    search_id: '',
    search_citizen: ''
  });

  // Unique Wards, Categories, Assignees, Constituencies extracted from DB for filter dropdowns
  const [filterOptions, setFilterOptions] = useState({
    wards: [],
    categories: [],
    assignees: [],
    constituencies: []
  });

  // Load analytics and option filters
  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, val]) => {
        if (val) queryParams.append(key, val);
      });

      const res = await fetch(`${API_BASE}/admin/namma-mla/analytics?${queryParams.toString()}`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      if (!res.ok) throw new Error('Failed to fetch analytics data.');
      const result = await res.json();
      setData(result);

      // Extract unique list for filter dropdown options based on initial data
      if (result) {
        setFilterOptions({
          wards: [...new Set((result.heatmap || []).map(item => item.ward_number))].filter(Boolean).sort(),
          categories: [...new Set((result.category_distribution || []).map(item => item.category))].filter(Boolean).sort(),
          assignees: [...new Set((result.assignee_workload || []).map(item => item.assignee))].filter(item => item && item !== 'Unassigned').sort(),
          constituencies: [...new Set((result.constituency_breakdown || []).map(item => item.constituency))].filter(Boolean).sort()
        });
      }
    } catch (err) {
      showNotification(err.message || 'Error loading dashboard data.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Fetch upload history
  const fetchUploadHistory = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/namma-mla/uploads`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      if (res.ok) {
        const history = await res.json();
        setUploadHistory(history);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch reports data
  const fetchReports = async () => {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, val]) => {
        if (val) queryParams.append(key, val);
      });

      const [resLeaderboard, resWards] = await Promise.all([
        fetch(`${API_BASE}/admin/namma-mla/leaderboard?${queryParams.toString()}`, {
          headers: { 'Authorization': `Bearer ${adminToken}` }
        }),
        fetch(`${API_BASE}/admin/namma-mla/wards?${queryParams.toString()}`, {
          headers: { 'Authorization': `Bearer ${adminToken}` }
        })
      ]);

      if (resLeaderboard.ok) setLeaderboard(await resLeaderboard.json());
      if (resWards.ok) setWardPerf(await resWards.json());
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    if (activeTab === 'upload') {
      fetchUploadHistory();
    } else if (activeTab === 'reports') {
      fetchReports();
    }
  }, [filters, activeTab]);

  const handleResetFilters = () => {
    setFilters({
      start_date: '',
      end_date: '',
      ward_number: '',
      category: '',
      status: '',
      priority: '',
      assignee: '',
      constituency: '',
      search_id: '',
      search_citizen: ''
    });
  };

  // Handle Drag & Drop Excel file validation
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setUploadFile(e.target.files[0]);
      setValidationResult(null);
      setImportResult(null);
    }
  };

  const handleValidateFile = async (e) => {
    e.preventDefault();
    if (!uploadFile) return;

    setUploadLoading(true);
    setValidationResult(null);
    setImportResult(null);

    const formData = new FormData();
    formData.append('file', uploadFile);

    try {
      const res = await fetch(`${API_BASE}/admin/namma-mla/validate`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${adminToken}` },
        body: formData
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.detail || 'Validation failed.');
      
      setValidationResult(result);
      showNotification('Spreadsheet validation complete.', 'success');
      
      // Auto switch preview tab to invalid if there are errors, else valid
      if (result.summary.invalid_rows_count > 0) {
        setValidationActiveTab('invalid');
      } else if (result.summary.duplicate_rows_count > 0) {
        setValidationActiveTab('duplicate');
      } else {
        setValidationActiveTab('valid');
      }
    } catch (err) {
      showNotification(err.message || 'Error validating file.', 'error');
    } finally {
      setUploadLoading(false);
    }
  };

  const handleImportData = async () => {
    if (!validationResult) return;
    setImportLoading(true);

    try {
      const res = await fetch(`${API_BASE}/admin/namma-mla/import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          filename: validationResult.filename,
          rows: validationResult.rows
        })
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.detail || 'Import failed.');

      setImportResult(result);
      setValidationResult(null);
      setUploadFile(null);
      showNotification('Grievance data successfully imported.', 'success');
      fetchUploadHistory();
      fetchAnalytics();
    } catch (err) {
      showNotification(err.message || 'Error importing data.', 'error');
    } finally {
      setImportLoading(false);
    }
  };

  // Drill down detailed modal fetch
  const handleOpenDrillDown = async (field, val, labelName) => {
    setDrillModal({ open: true, filterName: labelName, filterValue: String(val), complaints: [], page: 1, total: 0 });
    fetchDrillComplaints(field, val, 1);
  };

  const fetchDrillComplaints = async (field, val, pageNo) => {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => {
        if (v) queryParams.append(k, v);
      });
      
      // Override or append target field filter
      if (field) {
        queryParams.set(field, val);
      }
      queryParams.set('page', pageNo);
      queryParams.set('limit', 10);

      const res = await fetch(`${API_BASE}/admin/namma-mla/complaints?${queryParams.toString()}`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      if (res.ok) {
        const result = await res.json();
        setDrillModal(prev => ({
          ...prev,
          complaints: result.complaints,
          total: result.total,
          page: pageNo,
          drillField: field,
          drillVal: val
        }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Printable report generator
  const triggerPrintReport = () => {
    window.print();
  };

  // CSV Exporter
  const handleExportCSV = () => {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, val]) => {
      if (val) queryParams.append(key, val);
    });
    window.open(`${API_BASE}/admin/namma-mla/export/csv?${queryParams.toString()}&token=${adminToken}`, '_blank');
  };

  return (
    <div className="namma-mla-analytics-module">
      <div className="analytics-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ color: 'var(--navy-blue)', margin: 0, fontWeight: '800', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FileSpreadsheet style={{ color: 'var(--primary-green)' }} />
            Namma MLA Complaint Analytics
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '4px' }}>
             constituency daily sheet import & MIS management dashboard
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="tabs-navigation" style={{ display: 'flex', gap: '8px', backgroundColor: 'var(--bg-tertiary)', padding: '4px', borderRadius: 'var(--radius-md)' }}>
          <button 
            className={`btn btn-sm ${activeTab === 'dashboard' ? 'btn-primary' : 'btn-secondary'}`} 
            style={{ borderRadius: 'var(--radius-sm)', border: 'none' }}
            onClick={() => setActiveTab('dashboard')}
          >
            Dashboard
          </button>
          {!readOnly && (
          <button 
            className={`btn btn-sm ${activeTab === 'upload' ? 'btn-primary' : 'btn-secondary'}`} 
            style={{ borderRadius: 'var(--radius-sm)', border: 'none' }}
            onClick={() => setActiveTab('upload')}
          >
            Upload Daily Sheet
          </button>
          )}
          <button 
            className={`btn btn-sm ${activeTab === 'reports' ? 'btn-primary' : 'btn-secondary'}`} 
            style={{ borderRadius: 'var(--radius-sm)', border: 'none' }}
            onClick={() => setActiveTab('reports')}
          >
            Reports & Ranks
          </button>
          <button 
            className={`btn btn-sm ${activeTab === 'export' ? 'btn-primary' : 'btn-secondary'}`} 
            style={{ borderRadius: 'var(--radius-sm)', border: 'none' }}
            onClick={() => setActiveTab('export')}
          >
            Export Panel
          </button>
        </div>
      </div>

      {/* GLOBAL FILTERS PANEL */}
      {activeTab !== 'upload' && (
        <div className="card" style={{ marginBottom: '24px', padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
            <Filter size={16} style={{ color: 'var(--primary-green)' }} />
            <h4 style={{ margin: 0, fontWeight: '700', color: 'var(--navy-blue)' }}>Global Analytics Filters</h4>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Start Date</label>
              <input 
                type="date" 
                className="form-control" 
                style={{ fontSize: '0.85rem', padding: '6px' }}
                value={filters.start_date}
                disabled={readOnly}
                onChange={(e) => setFilters(prev => ({ ...prev, start_date: e.target.value }))}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)' }}>End Date</label>
              <input 
                type="date" 
                className="form-control" 
                style={{ fontSize: '0.85rem', padding: '6px' }}
                value={filters.end_date}
                disabled={readOnly}
                onChange={(e) => setFilters(prev => ({ ...prev, end_date: e.target.value }))}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Ward Number</label>
              <select 
                className="form-control" 
                style={{ fontSize: '0.85rem', padding: '6px' }}
                value={filters.ward_number}
                disabled={readOnly}
                onChange={(e) => setFilters(prev => ({ ...prev, ward_number: e.target.value }))}
              >
                <option value="">All Wards</option>
                {filterOptions.wards.map(w => <option key={w} value={w}>Ward {w}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Category</label>
              <select 
                className="form-control" 
                style={{ fontSize: '0.85rem', padding: '6px' }}
                value={filters.category}
                disabled={readOnly}
                onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
              >
                <option value="">All Categories</option>
                {filterOptions.categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Status</label>
              <select 
                className="form-control" 
                style={{ fontSize: '0.85rem', padding: '6px' }}
                value={filters.status}
                disabled={readOnly}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              >
                <option value="">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="Assigned">Assigned</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Priority</label>
              <select 
                className="form-control" 
                style={{ fontSize: '0.85rem', padding: '6px' }}
                value={filters.priority}
                disabled={readOnly}
                onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
              >
                <option value="">All Priorities</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Assignee</label>
              <select 
                className="form-control" 
                style={{ fontSize: '0.85rem', padding: '6px' }}
                value={filters.assignee}
                disabled={readOnly}
                onChange={(e) => setFilters(prev => ({ ...prev, assignee: e.target.value }))}
              >
                <option value="">All Officers</option>
                {filterOptions.assignees.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Search ID</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="e.g. 5431" 
                  style={{ fontSize: '0.85rem', padding: '6px 24px 6px 8px' }}
                  value={filters.search_id}
                  disabled={readOnly}
                  onChange={(e) => setFilters(prev => ({ ...prev, search_id: e.target.value }))}
                />
                <Search size={14} style={{ position: 'absolute', right: '8px', top: '9px', color: 'var(--text-light)' }} />
              </div>
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Search Citizen</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Name or Mobile" 
                  style={{ fontSize: '0.85rem', padding: '6px 24px 6px 8px' }}
                  value={filters.search_citizen}
                  disabled={readOnly}
                  onChange={(e) => setFilters(prev => ({ ...prev, search_citizen: e.target.value }))}
                />
                <Search size={14} style={{ position: 'absolute', right: '8px', top: '9px', color: 'var(--text-light)' }} />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
            <button className="btn btn-secondary btn-sm" onClick={handleResetFilters}>Reset Filters</button>
            <button className="btn btn-primary btn-sm" onClick={fetchAnalytics} disabled={loading}>
              <RefreshCw size={12} className={loading ? 'spin-animation' : ''} style={{ marginRight: '4px' }} />
              Sync Data
            </button>
          </div>
        </div>
      )}

      {/* LOADING SPINNER */}
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px', gap: '12px' }}>
          <RefreshCw size={40} className="spin-animation" style={{ color: 'var(--primary-green)' }} />
          <p style={{ color: 'var(--text-secondary)' }}>Retrieving constituency metrics...</p>
        </div>
      )}

      {/* DASHBOARD TAB */}
      {!loading && activeTab === 'dashboard' && (
        <div>
          {/* KPI CARDS GRID */}
          {data && (
            <div className="stats-grid" style={{ marginBottom: '24px' }}>
              <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => handleOpenDrillDown('', '', 'All Complaints')}>
                <div className="stat-label">Total Complaints</div>
                <div className="stat-val">{data.kpis.total_complaints}</div>
                <div className="stat-desc">Imported from external app</div>
              </div>
              <div className="stat-card" style={{ cursor: 'pointer', borderLeft: '4px solid var(--color-warning)' }} onClick={() => handleOpenDrillDown('status', 'Pending', 'Pending Complaints')}>
                <div className="stat-label">Pending Reviews</div>
                <div className="stat-val" style={{ color: 'var(--color-warning)' }}>{data.kpis.pending_complaints}</div>
                <div className="stat-desc">Awaiting allocation</div>
              </div>
              <div className="stat-card" style={{ cursor: 'pointer', borderLeft: '4px solid var(--color-info)' }} onClick={() => handleOpenDrillDown('status', 'In Progress', 'In Progress Complaints')}>
                <div className="stat-label">Active / In Progress</div>
                <div className="stat-val" style={{ color: 'var(--color-info)' }}>{data.kpis.open_complaints - data.kpis.pending_complaints}</div>
                <div className="stat-desc">Assigned & active</div>
              </div>
              <div className="stat-card" style={{ cursor: 'pointer', borderLeft: '4px solid var(--color-success)' }} onClick={() => handleOpenDrillDown('status', 'Resolved', 'Resolved Complaints')}>
                <div className="stat-label">Resolved Actions</div>
                <div className="stat-val" style={{ color: 'var(--color-success)' }}>{data.kpis.resolved_complaints}</div>
                <div className="stat-desc">Completion Rate: {data.kpis.resolution_percent}%</div>
              </div>
              <div className="stat-card" style={{ cursor: 'pointer', borderLeft: '4px solid var(--color-danger)' }} onClick={() => handleOpenDrillDown('priority', 'High', 'High Priority Complaints')}>
                <div className="stat-label">High / Urgent Priority</div>
                <div className="stat-val" style={{ color: 'var(--color-danger)' }}>{data.kpis.high_priority}</div>
                <div className="stat-desc">Critical issues flagged</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Avg. Resolution Speed</div>
                <div className="stat-val" style={{ color: 'var(--navy-blue)' }}>{data.kpis.avg_resolution_time_days} <span style={{ fontSize: '1rem', fontWeight: '500' }}>days</span></div>
                <div className="stat-desc">Target: &lt; 5.0 days</div>
              </div>
            </div>
          )}

          {/* EMPTY STATE */}
          {(!data || data.kpis.total_complaints === 0) && (
            <div className="card" style={{ padding: '60px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
              <UploadCloud size={60} style={{ color: 'var(--text-light)' }} />
              <h3 style={{ color: 'var(--navy-blue)', margin: 0 }}>No Complaint Analytics Data Yet</h3>
              <p style={{ color: 'var(--text-secondary)', maxWidth: '480px', margin: '0 auto 12px' }}>
                Analyze external Namma MLA App sheets. To get started, upload today's daily sheet using the daily import module.
              </p>
              <button className="btn btn-primary" onClick={() => setActiveTab('upload')}>
                Upload Sheet (.xlsx)
              </button>
            </div>
          )}

          {/* CHARTS CONTAINER GRID */}
          {data && data.kpis.total_complaints > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* Row 1: Trend line & Category Donut */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px' }}>
                <div className="card" style={{ padding: '20px' }}>
                  <h3 style={{ color: 'var(--navy-blue)', fontSize: '1.125rem', marginBottom: '16px', fontWeight: '700' }}>Daily Complaint Trend</h3>
                  <div style={{ height: '280px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={data.complaint_trend}>
                        <defs>
                          <linearGradient id="colorRaised" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#b8860b" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#b8860b" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="day" style={{ fontSize: '0.75rem' }} />
                        <YAxis style={{ fontSize: '0.75rem' }} />
                        <Tooltip />
                        <Legend style={{ fontSize: '0.85rem' }} />
                        <Area type="monotone" name="Complaints Raised" dataKey="raised" stroke="#b8860b" strokeWidth={2} fillOpacity={1} fill="url(#colorRaised)" />
                        <Area type="monotone" name="Complaints Resolved" dataKey="resolved" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorResolved)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="card" style={{ padding: '20px' }}>
                  <h3 style={{ color: 'var(--navy-blue)', fontSize: '1.125rem', marginBottom: '16px', fontWeight: '700' }}>Category Distribution</h3>
                  <div style={{ height: '280px', display: 'flex', alignItems: 'center' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={data.category_distribution}
                          dataKey="count"
                          nameKey="category"
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={85}
                          fill="#8884d8"
                          paddingAngle={3}
                          label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                          style={{ fontSize: '0.7rem' }}
                          onClick={(entry) => handleOpenDrillDown('category', entry.category, `Category: ${entry.category}`)}
                        >
                          {data.category_distribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} style={{ cursor: 'pointer' }} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value, name) => [value, 'Complaints']} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Row 2: Status & Priority Distribution */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px' }}>
                <div className="card" style={{ padding: '20px' }}>
                  <h3 style={{ color: 'var(--navy-blue)', fontSize: '1.125rem', marginBottom: '16px', fontWeight: '700' }}>Assignee Workload</h3>
                  <div style={{ height: '280px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.assignee_workload} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" style={{ fontSize: '0.75rem' }} />
                        <YAxis dataKey="assignee" type="category" style={{ fontSize: '0.75rem' }} width={100} />
                        <Tooltip />
                        <Bar 
                          dataKey="count" 
                          fill="#132b4f" 
                          radius={[0, 4, 4, 0]}
                          onClick={(entry) => handleOpenDrillDown('assignee', entry.assignee, `Assignee: ${entry.assignee}`)}
                        >
                          {data.assignee_workload.map((entry, index) => (
                            <Cell key={`cell-${index}`} style={{ cursor: 'pointer' }} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="card" style={{ padding: '20px' }}>
                  <h3 style={{ color: 'var(--navy-blue)', fontSize: '1.125rem', marginBottom: '16px', fontWeight: '700' }}>Priority Spread</h3>
                  <div style={{ height: '280px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={data.priority_distribution}
                          dataKey="count"
                          nameKey="priority"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                          style={{ fontSize: '0.75rem' }}
                          onClick={(entry) => handleOpenDrillDown('priority', entry.priority, `Priority: ${entry.priority}`)}
                        >
                          {data.priority_distribution.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={entry.priority === 'Urgent' ? '#ef4444' : entry.priority === 'High' ? '#f59e0b' : entry.priority === 'Medium' ? '#3b82f6' : '#10b981'} 
                              style={{ cursor: 'pointer' }} 
                            />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Row 3: Top 10 Wards & Monthly Comparison */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px' }}>
                <div className="card" style={{ padding: '20px' }}>
                  <h3 style={{ color: 'var(--navy-blue)', fontSize: '1.125rem', marginBottom: '16px', fontWeight: '700' }}>Top 10 Wards by Complaints</h3>
                  <div style={{ height: '280px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.ward_wise_complaints}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="ward_number" tickFormatter={(v) => `W-${v}`} style={{ fontSize: '0.75rem' }} />
                        <YAxis style={{ fontSize: '0.75rem' }} />
                        <Tooltip />
                        <Bar 
                          dataKey="count" 
                          fill="#d7263d" 
                          radius={[4, 4, 0, 0]}
                          onClick={(entry) => handleOpenDrillDown('ward_number', entry.ward_number, `Ward: ${entry.ward_number}`)}
                        >
                          {data.ward_wise_complaints.map((entry, index) => (
                            <Cell key={`cell-${index}`} style={{ cursor: 'pointer' }} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="card" style={{ padding: '20px' }}>
                  <h3 style={{ color: 'var(--navy-blue)', fontSize: '1.125rem', marginBottom: '16px', fontWeight: '700' }}>Monthly Intake vs Resolutions</h3>
                  <div style={{ height: '280px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.monthly_comparison}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="month" style={{ fontSize: '0.75rem' }} />
                        <YAxis style={{ fontSize: '0.75rem' }} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="created" name="Created Complaints" fill="#b8860b" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="resolved" name="Resolved Complaints" fill="#10b981" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Row 4: Resolution speed by category & Heat Map */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px' }}>
                <div className="card" style={{ padding: '20px' }}>
                  <h3 style={{ color: 'var(--navy-blue)', fontSize: '1.125rem', marginBottom: '16px', fontWeight: '700' }}>Resolution Time by Category (Days)</h3>
                  <div style={{ height: '280px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.resolution_time} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" style={{ fontSize: '0.75rem' }} />
                        <YAxis dataKey="category" type="category" style={{ fontSize: '0.75rem' }} width={100} />
                        <Tooltip formatter={(v) => [`${v} days`, 'Avg. Resolution Time']} />
                        <Bar dataKey="avg_days" fill="#10b981" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="card" style={{ padding: '20px' }}>
                  <h3 style={{ color: 'var(--navy-blue)', fontSize: '1.125rem', marginBottom: '16px', fontWeight: '700' }}>Complaint Density (Ward vs Category)</h3>
                  
                  {/* Heatmap density matrix */}
                  <div style={{ overflowX: 'auto', maxHeight: '280px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem', textAlign: 'center' }}>
                      <thead>
                        <tr style={{ backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
                          <th style={{ padding: '8px', textAlign: 'left', fontWeight: '700' }}>Ward</th>
                          {[...new Set(data.heatmap.map(h => h.category))].slice(0, 5).map(cat => (
                            <th key={cat} style={{ padding: '8px', fontWeight: '700' }}>{cat}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {[...new Set(data.heatmap.map(h => h.ward_number))].slice(0, 8).map(ward => (
                          <tr key={ward} style={{ borderBottom: '1px solid var(--border-color)' }}>
                            <td style={{ padding: '8px', textAlign: 'left', fontWeight: '600', backgroundColor: 'var(--bg-secondary)' }}>W-{ward}</td>
                            {[...new Set(data.heatmap.map(h => h.category))].slice(0, 5).map(cat => {
                              const match = data.heatmap.find(h => h.ward_number === ward && h.category === cat);
                              const count = match ? match.count : 0;
                              
                              // Heat color weight calculation
                              const maxVal = Math.max(...data.heatmap.map(h => h.count)) || 1;
                              const weight = count / maxVal;
                              const backgroundColor = `rgba(215, 38, 61, ${Math.max(weight * 0.9, count > 0 ? 0.15 : 0)})`; // Red opacity
                              const color = weight > 0.5 ? '#ffffff' : 'var(--text-primary)';

                              return (
                                <td 
                                  key={cat} 
                                  style={{ padding: '8px', backgroundColor, color, fontWeight: count > 0 ? '700' : '400', cursor: count > 0 ? 'pointer' : 'default' }}
                                  onClick={() => count > 0 && handleOpenDrillDown('ward_number', ward, `Ward ${ward} - ${cat}`)}
                                >
                                  {count}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Row 5: SANKEY FLOW (Complaint -> Category -> Assignee -> Final Status) */}
              <div className="card" style={{ padding: '20px' }}>
                <h3 style={{ color: 'var(--navy-blue)', fontSize: '1.125rem', marginBottom: '16px', fontWeight: '700' }}>MIS Resolution Flow Routing (Sankey Flow representation)</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '20px' }}>
                  This visualization shows the path complaints take from their specific category, assigned officer, and their final status.
                </p>

                {data.sankey_flow && data.sankey_flow.links.length > 0 ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '40px', padding: '10px 0' }}>
                    
                    {/* Column 1: Category */}
                    <div>
                      <h4 style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--navy-blue)', borderBottom: '2px solid var(--primary-green)', paddingBottom: '4px', marginBottom: '12px' }}>CATEGORY</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {data.category_distribution.slice(0, 5).map((c, idx) => (
                          <div key={c.category} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', backgroundColor: 'var(--bg-secondary)', borderLeft: `4px solid ${CHART_COLORS[idx % CHART_COLORS.length]}`, borderRadius: 'var(--radius-sm)' }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: '600' }}>{c.category}</span>
                            <span className="badge badge-success" style={{ fontSize: '0.75rem', backgroundColor: 'var(--border-color)', color: 'var(--text-primary)' }}>{c.count}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Column 2: Assignee */}
                    <div>
                      <h4 style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--navy-blue)', borderBottom: '2px solid var(--navy-blue)', paddingBottom: '4px', marginBottom: '12px' }}>ASSIGNEE</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {data.assignee_workload.slice(0, 5).map((a) => (
                          <div key={a.assignee} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', backgroundColor: 'var(--bg-secondary)', borderLeft: '4px solid var(--navy-blue)', borderRadius: 'var(--radius-sm)' }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: '600' }}>{a.assignee}</span>
                            <span className="badge" style={{ fontSize: '0.75rem', backgroundColor: 'var(--border-color)', color: 'var(--text-primary)' }}>{a.count}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Column 3: Final Status */}
                    <div>
                      <h4 style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--navy-blue)', borderBottom: '2px solid var(--saffron-orange)', paddingBottom: '4px', marginBottom: '12px' }}>STATUS</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {data.status_distribution.map((s) => (
                          <div key={s.status} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', backgroundColor: 'var(--bg-secondary)', borderLeft: `4px solid ${s.status === 'Resolved' ? 'var(--color-success)' : s.status === 'Rejected' ? 'var(--color-danger)' : 'var(--color-warning)'}`, borderRadius: 'var(--radius-sm)' }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: '600' }}>{s.status}</span>
                            <span className="badge" style={{ fontSize: '0.75rem', backgroundColor: s.status === 'Resolved' ? 'var(--color-success-bg)' : s.status === 'Rejected' ? 'var(--color-danger-bg)' : 'var(--color-warning-bg)', color: s.status === 'Resolved' ? 'var(--color-success)' : s.status === 'Rejected' ? 'var(--color-danger)' : 'var(--color-warning)' }}>{s.count}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>Flow data not available.</div>
                )}
              </div>

            </div>
          )}
        </div>
      )}

      {/* UPLOAD DAILY SHEET TAB */}
      {activeTab === 'upload' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div className="card" style={{ padding: '24px' }}>
            <h3 style={{ color: 'var(--navy-blue)', margin: '0 0 16px', fontWeight: '700' }}>Import Daily Namma MLA Sheet</h3>
            
            <form onSubmit={handleValidateFile} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', border: '2px dashed var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '40px', gap: '16px', backgroundColor: 'var(--bg-secondary)' }}>
              <UploadCloud size={48} style={{ color: 'var(--primary-green)' }} />
              
              <div style={{ textAlign: 'center' }}>
                <p style={{ margin: 0, fontWeight: '600' }}>
                  {uploadFile ? uploadFile.name : 'Select or drop your daily complaints spreadsheet'}
                </p>
                <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Supports Microsoft Excel formats (.xlsx, .xls)
                </p>
              </div>

              <input 
                type="file" 
                id="excel-file-upload" 
                accept=".xlsx, .xls"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
              
              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary btn-sm"
                  onClick={() => document.getElementById('excel-file-upload').click()}
                >
                  Choose File
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary btn-sm"
                  disabled={!uploadFile || uploadLoading}
                >
                  {uploadLoading ? 'Validating...' : 'Validate Sheet'}
                </button>
              </div>
            </form>

            {/* VALIDATION PREVIEW */}
            {validationResult && (
              <div style={{ marginTop: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <h4 style={{ margin: 0, color: 'var(--navy-blue)', fontWeight: '700' }}>Sheet Preview & Integrity Report</h4>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: 0 }}>
                      Filename: {validationResult.filename}
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <div style={{ fontSize: '0.8rem', backgroundColor: 'var(--bg-secondary)', padding: '6px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                      Total rows: <strong>{validationResult.summary.total_rows}</strong>
                    </div>
                    <div style={{ fontSize: '0.8rem', backgroundColor: 'var(--color-success-bg)', color: 'var(--color-success)', padding: '6px 10px', borderRadius: 'var(--radius-sm)' }}>
                      Valid: <strong>{validationResult.summary.valid_rows_count}</strong>
                    </div>
                    <div style={{ fontSize: '0.8rem', backgroundColor: 'var(--color-warning-bg)', color: 'var(--color-warning)', padding: '6px 10px', borderRadius: 'var(--radius-sm)' }}>
                      Duplicates: <strong>{validationResult.summary.duplicate_rows_count}</strong>
                    </div>
                    <div style={{ fontSize: '0.8rem', backgroundColor: 'var(--color-danger-bg)', color: 'var(--color-danger)', padding: '6px 10px', borderRadius: 'var(--radius-sm)' }}>
                      Invalid: <strong>{validationResult.summary.invalid_rows_count}</strong>
                    </div>
                  </div>
                </div>

                {/* Validation Preview Category Tabs */}
                <div className="tab-menu" style={{ borderBottom: '1px solid var(--border-color)', display: 'flex', gap: '16px', marginBottom: '16px' }}>
                  <button 
                    className={`tab-link ${validationActiveTab === 'valid' ? 'active' : ''}`}
                    style={{ background: 'none', border: 'none', paddingBottom: '8px', cursor: 'pointer', fontWeight: '600' }}
                    onClick={() => setValidationActiveTab('valid')}
                  >
                    Valid Rows ({validationResult.summary.valid_rows_count})
                  </button>
                  <button 
                    className={`tab-link ${validationActiveTab === 'duplicate' ? 'active' : ''}`}
                    style={{ background: 'none', border: 'none', paddingBottom: '8px', cursor: 'pointer', fontWeight: '600' }}
                    onClick={() => setValidationActiveTab('duplicate')}
                  >
                    Duplicate Complaint IDs ({validationResult.summary.duplicate_rows_count})
                  </button>
                  <button 
                    className={`tab-link ${validationActiveTab === 'invalid' ? 'active' : ''}`}
                    style={{ background: 'none', border: 'none', paddingBottom: '8px', cursor: 'pointer', fontWeight: '600' }}
                    onClick={() => setValidationActiveTab('invalid')}
                  >
                    Missing Fields / Format Errors ({validationResult.summary.invalid_rows_count})
                  </button>
                </div>

                {/* Preview Table */}
                <div className="table-wrapper" style={{ maxHeight: '350px', overflowY: 'auto' }}>
                  <table className="data-table" style={{ fontSize: '0.85rem' }}>
                    <thead>
                      <tr>
                        <th>Excel Row</th>
                        <th>Complaint ID</th>
                        <th>Title</th>
                        <th>Category</th>
                        <th>Priority</th>
                        <th>Citizen Mobile</th>
                        <th>Ward</th>
                        <th>Assignee</th>
                        {validationActiveTab !== 'valid' && <th>Integrity Flag / Error</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {validationResult.rows
                        .filter(row => row.status === validationActiveTab)
                        .map(row => (
                          <tr 
                            key={row.row_index} 
                            style={{ 
                              backgroundColor: 
                                row.status === 'invalid' ? 'var(--color-danger-bg)' : 
                                row.status === 'duplicate' ? 'var(--color-warning-bg)' : 'inherit'
                            }}
                          >
                            <td><strong>#{row.row_index}</strong></td>
                            <td>{row.data.complaint_id}</td>
                            <td>{row.data.title}</td>
                            <td>{row.data.category}</td>
                            <td>
                              <span style={{ 
                                color: row.data.priority === 'Urgent' ? 'var(--color-danger)' : row.data.priority === 'High' ? 'var(--color-warning)' : 'inherit',
                                fontWeight: '600'
                              }}>{row.data.priority}</span>
                            </td>
                            <td>{row.data.mobile}</td>
                            <td>{row.data.ward_number}</td>
                            <td>{row.data.assignee || <span style={{ color: 'var(--text-light)' }}>Unassigned</span>}</td>
                            {validationActiveTab !== 'valid' && (
                              <td style={{ color: row.status === 'invalid' ? 'var(--color-danger)' : 'var(--color-warning)', fontWeight: '600' }}>
                                {row.errors.join(', ')}
                              </td>
                            )}
                          </tr>
                        ))}
                      {validationResult.rows.filter(row => row.status === validationActiveTab).length === 0 && (
                        <tr>
                          <td colSpan={validationActiveTab === 'valid' ? 8 : 9} style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>
                            No rows fit this status filter.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px', gap: '8px' }}>
                  <button className="btn btn-secondary" onClick={() => setValidationResult(null)}>Cancel</button>
                  <button 
                    className="btn btn-primary" 
                    onClick={handleImportData}
                    disabled={validationResult.summary.valid_rows_count === 0 || importLoading}
                  >
                    {importLoading ? 'Importing complaints...' : `Import ${validationResult.summary.valid_rows_count} Valid Rows`}
                  </button>
                </div>
              </div>
            )}

            {/* IMPORT SUCCESS RESULT */}
            {importResult && (
              <div className="alert alert-success" style={{ marginTop: '20px', padding: '20px', display: 'flex', alignItems: 'flex-start', gap: '16px', backgroundColor: 'var(--color-success-bg)', border: '1px solid var(--color-success)', borderRadius: 'var(--radius-md)' }}>
                <CheckCircle style={{ color: 'var(--color-success)', flexShrink: 0 }} size={24} />
                <div>
                  <h4 style={{ margin: 0, color: 'var(--color-success)', fontWeight: '700' }}>Import Batch Completed Successfully!</h4>
                  <p style={{ margin: '8px 0 0', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                    All valid complaint records have been successfully added to the database.
                  </p>
                  
                  <div style={{ display: 'flex', gap: '20px', marginTop: '16px' }}>
                    <div>Total Evaluated: <strong>{importResult.summary.total}</strong></div>
                    <div>Newly Imported: <strong style={{ color: 'var(--color-success)' }}>{importResult.summary.imported}</strong></div>
                    <div>Duplicates Filtered: <strong style={{ color: 'var(--color-warning)' }}>{importResult.summary.duplicates}</strong></div>
                    <div>Errors Rejected: <strong style={{ color: 'var(--color-danger)' }}>{importResult.summary.invalid}</strong></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* HISTORICAL UPLOADS TABLE */}
          <div className="card" style={{ padding: '24px' }}>
            <h3 style={{ color: 'var(--navy-blue)', margin: '0 0 16px', fontWeight: '700' }}>Sheet Upload & Batch History</h3>
            
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Uploaded Date</th>
                    <th>Filename</th>
                    <th>Uploaded By</th>
                    <th>Total Rows</th>
                    <th>Imported</th>
                    <th>Duplicates</th>
                    <th>Rejected</th>
                    <th>Batch ID</th>
                  </tr>
                </thead>
                <tbody>
                  {uploadHistory.map(h => (
                    <tr key={h.upload_batch_id}>
                      <td>{new Date(h.uploaded_at).toLocaleString()}</td>
                      <td><strong>{h.filename}</strong></td>
                      <td>{h.uploaded_by_email}</td>
                      <td>{h.total_rows}</td>
                      <td style={{ color: 'var(--color-success)', fontWeight: '600' }}>{h.imported_rows}</td>
                      <td style={{ color: 'var(--color-warning)', fontWeight: '600' }}>{h.duplicate_rows}</td>
                      <td style={{ color: 'var(--color-danger)', fontWeight: '600' }}>{h.invalid_rows}</td>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{h.upload_batch_id.slice(0, 8)}...</td>
                    </tr>
                  ))}
                  {uploadHistory.length === 0 && (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)' }}>
                        No spreadsheet uploads logged yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* REPORTS & RANKS TAB */}
      {activeTab === 'reports' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
            
            {/* Officer Leaderboard Card */}
            <div className="card" style={{ padding: '20px' }}>
              <h3 style={{ color: 'var(--navy-blue)', fontSize: '1.125rem', marginBottom: '16px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={20} style={{ color: 'var(--primary-green)' }} />
                Officer Performance Leaderboard
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '16px' }}>
                Ranked by completion rate & total complaints resolved.
              </p>

              <div className="table-wrapper">
                <table className="data-table" style={{ fontSize: '0.85rem' }}>
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>Officer</th>
                      <th>Assigned</th>
                      <th>Resolved</th>
                      <th>Pending</th>
                      <th>Completion %</th>
                      <th>Avg days</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.map(officer => (
                      <tr key={officer.officer} style={{ fontWeight: officer.rank <= 3 ? '600' : '400' }}>
                        <td>
                          {officer.rank === 1 ? '🥇' : officer.rank === 2 ? '🥈' : officer.rank === 3 ? '🥉' : `#${officer.rank}`}
                        </td>
                        <td><strong>{officer.officer}</strong></td>
                        <td>{officer.total_assigned}</td>
                        <td style={{ color: 'var(--color-success)' }}>{officer.resolved}</td>
                        <td style={{ color: 'var(--color-warning)' }}>{officer.pending}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <div style={{ flexGrow: 1, backgroundColor: 'var(--border-color)', height: '6px', borderRadius: '3px', width: '50px' }}>
                              <div style={{ backgroundColor: 'var(--color-success)', height: '6px', borderRadius: '3px', width: `${officer.completion_percent}%` }} />
                            </div>
                            <span>{officer.completion_percent}%</span>
                          </div>
                        </td>
                        <td>{officer.avg_resolution_time_days}d</td>
                      </tr>
                    ))}
                    {leaderboard.length === 0 && (
                      <tr>
                        <td colSpan={7} style={{ textAlign: 'center', padding: '16px', color: 'var(--text-secondary)' }}>No performance stats available.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Ward Performance Card */}
            <div className="card" style={{ padding: '20px' }}>
              <h3 style={{ color: 'var(--navy-blue)', fontSize: '1.125rem', marginBottom: '16px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MapPin size={20} style={{ color: 'var(--saffron-orange)' }} />
                Constituency Ward Performance
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '20px' }}>
                Key performance metrics comparing municipal wards.
              </p>

              {wardPerf ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', borderLeft: '4px solid var(--saffron-orange)' }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Most Burdened Ward</h4>
                      <strong style={{ fontSize: '1.1rem', color: 'var(--navy-blue)' }}>Ward {wardPerf.most_complaints.ward}</strong>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--saffron-orange)' }}>{wardPerf.most_complaints.count}</span>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-light)', margin: 0 }}>Complaints</p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', borderLeft: '4px solid var(--color-success)' }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Least Burdened Ward</h4>
                      <strong style={{ fontSize: '1.1rem', color: 'var(--navy-blue)' }}>Ward {wardPerf.least_complaints.ward}</strong>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--color-success)' }}>{wardPerf.least_complaints.count}</span>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-light)', margin: 0 }}>Complaints</p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', borderLeft: '4px solid var(--color-info)' }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Fastest Resolution Ward</h4>
                      <strong style={{ fontSize: '1.1rem', color: 'var(--navy-blue)' }}>Ward {wardPerf.fastest_resolved.ward}</strong>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--color-info)' }}>{wardPerf.fastest_resolved.avg_days}</span>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-light)', margin: 0 }}>Avg. Days</p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', borderLeft: '4px solid var(--color-warning)' }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Slowest Resolution Ward</h4>
                      <strong style={{ fontSize: '1.1rem', color: 'var(--navy-blue)' }}>Ward {wardPerf.slowest_resolved.ward}</strong>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--color-warning)' }}>{wardPerf.slowest_resolved.avg_days}</span>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-light)', margin: 0 }}>Avg. Days</p>
                    </div>
                  </div>

                </div>
              ) : (
                <p>Loading performance details...</p>
              )}
            </div>

          </div>

        </div>
      )}

      {/* EXPORT PANEL TAB */}
      {activeTab === 'export' && (
        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ color: 'var(--navy-blue)', margin: '0 0 16px', fontWeight: '700' }}>Export & Report Distribution Center</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
            Export tabular grievance lists matching the active filters, print summary reports, or download dashboard snapshots for offline presentations.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
            
            <div style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <FileSpreadsheet size={40} style={{ color: 'var(--primary-green)' }} />
              <h4 style={{ margin: 0, fontWeight: '700' }}>Export Filtered CSV</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: 0 }}>
                Get raw tabular data matching your currently set global filters.
              </p>
              <button className="btn btn-secondary btn-sm" style={{ width: '100%' }} onClick={handleExportCSV}>
                <Download size={14} style={{ marginRight: '6px' }} /> Download CSV
              </button>
            </div>

            <div style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <Printer size={40} style={{ color: 'var(--navy-blue)' }} />
              <h4 style={{ margin: 0, fontWeight: '700' }}>Print Report Summary</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: 0 }}>
                Print out a beautifully formatted, physical copy of the analytics summary.
              </p>
              <button className="btn btn-secondary btn-sm" style={{ width: '100%' }} onClick={triggerPrintReport}>
                <Printer size={14} style={{ marginRight: '6px' }} /> Print Report
              </button>
            </div>

            <div style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <TrendingUp size={40} style={{ color: 'var(--saffron-orange)' }} />
              <h4 style={{ margin: 0, fontWeight: '700' }}>Dashboard Printout</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: 0 }}>
                Generates a clean, print-friendly rendering of the full dashboard charts.
              </p>
              <button className="btn btn-secondary btn-sm" style={{ width: '100%' }} onClick={() => window.print()}>
                <Printer size={14} style={{ marginRight: '6px' }} /> Print Dashboard
              </button>
            </div>

          </div>
        </div>
      )}

      {/* DRILL DOWN MODAL (COMPLAINTS LIST) */}
      {drillModal.open && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: '90%', maxWidth: '1000px', maxHeight: '85vh', display: 'flex', flexDirection: 'column', padding: '24px', position: 'relative', overflow: 'hidden' }}>
            
            {/* Close Button */}
            <button 
              style={{ position: 'absolute', top: '16px', right: '16px', border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
              onClick={() => setDrillModal(prev => ({ ...prev, open: false }))}
            >
              <XCircle size={24} />
            </button>

            <h3 style={{ color: 'var(--navy-blue)', margin: '0 0 4px', fontWeight: '700' }}>
              Drill Down: {drillModal.filterName}
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0 0 20px' }}>
              Showing {drillModal.total} complaints matching the selected filter
            </p>

            <div style={{ flexGrow: 1, overflowY: 'auto', marginBottom: '16px' }}>
              <table className="data-table" style={{ fontSize: '0.85rem' }}>
                <thead>
                  <tr>
                    <th>Complaint ID</th>
                    <th>Title</th>
                    <th>User</th>
                    <th>Mobile</th>
                    <th>Ward</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Assignee</th>
                    <th>Created At</th>
                  </tr>
                </thead>
                <tbody>
                  {drillModal.complaints.map(c => (
                    <tr key={c.id}>
                      <td><strong>{c.complaint_id}</strong></td>
                      <td>
                        <div style={{ fontWeight: '600' }}>{c.title}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', maxWidth: '280px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{c.description}</div>
                      </td>
                      <td>{c.citizen_name || <span style={{ color: 'var(--text-light)' }}>N/A</span>}</td>
                      <td>{c.mobile || <span style={{ color: 'var(--text-light)' }}>N/A</span>}</td>
                      <td>W-{c.ward_number}</td>
                      <td>
                        <span style={{ 
                          color: c.priority === 'Urgent' ? 'var(--color-danger)' : c.priority === 'High' ? 'var(--color-warning)' : 'inherit',
                          fontWeight: '600'
                        }}>{c.priority}</span>
                      </td>
                      <td>
                        <span className="badge" style={{
                          backgroundColor: c.status === 'Resolved' ? 'var(--color-success-bg)' : c.status === 'Rejected' ? 'var(--color-danger-bg)' : 'var(--color-warning-bg)',
                          color: c.status === 'Resolved' ? 'var(--color-success)' : c.status === 'Rejected' ? 'var(--color-danger)' : 'var(--color-warning)',
                          fontSize: '0.75rem'
                        }}>{c.status}</span>
                      </td>
                      <td>{c.assignee || <span style={{ color: 'var(--text-light)' }}>Unassigned</span>}</td>
                      <td>{c.created_at ? new Date(c.created_at).toLocaleDateString() : 'N/A'}</td>
                    </tr>
                  ))}
                  {drillModal.complaints.length === 0 && (
                    <tr>
                      <td colSpan={9} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)' }}>No matching complaints found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {drillModal.total > 10 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Showing <strong>{(drillModal.page - 1) * 10 + 1}</strong> - <strong>{Math.min(drillModal.page * 10, drillModal.total)}</strong> of <strong>{drillModal.total}</strong>
                </span>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    className="btn btn-secondary btn-sm"
                    disabled={drillModal.page === 1}
                    onClick={() => {
                      const prevPage = drillModal.page - 1;
                      fetchDrillComplaints(drillModal.drillField, drillModal.drillVal, prevPage);
                    }}
                  >
                    <ChevronLeft size={14} /> Prev
                  </button>
                  <button 
                    className="btn btn-secondary btn-sm"
                    disabled={drillModal.page * 10 >= drillModal.total}
                    onClick={() => {
                      const nextPage = drillModal.page + 1;
                      fetchDrillComplaints(drillModal.drillField, drillModal.drillVal, nextPage);
                    }}
                  >
                    Next <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
