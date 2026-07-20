import React, { useState, useEffect, useRef } from 'react';
import * as echarts from 'echarts';
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
  '#2563EB', // Accent Blue
  '#16A34A', // Accent Green
  '#F59E0B', // Accent Orange
  '#DC2626', // Accent Red
  '#0F172A', // Primary Slate
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#f97316'  // Orange
];

const MONTHS = [
  { value: '1', name: 'January' },
  { value: '2', name: 'February' },
  { value: '3', name: 'March' },
  { value: '4', name: 'April' },
  { value: '5', name: 'May' },
  { value: '6', name: 'June' },
  { value: '7', name: 'July' },
  { value: '8', name: 'August' },
  { value: '9', name: 'September' },
  { value: '10', name: 'October' },
  { value: '11', name: 'November' },
  { value: '12', name: 'December' }
];

function shadeColor(color, percent) {
  let R = parseInt(color.substring(1, 3), 16);
  let G = parseInt(color.substring(3, 5), 16);
  let B = parseInt(color.substring(5, 7), 16);
  R = parseInt(R * (100 + percent) / 100);
  G = parseInt(G * (100 + percent) / 100);
  B = parseInt(B * (100 + percent) / 100);
  R = (R < 255) ? R : 255;
  G = (G < 255) ? G : 255;
  B = (B < 255) ? B : 255;
  const rHex = R.toString(16).padStart(2, '0');
  const gHex = G.toString(16).padStart(2, '0');
  const bHex = B.toString(16).padStart(2, '0');
  return `#${rHex}${gHex}${bHex}`;
}

const Sparkline = ({ data, color }) => {
  if (!data || data.length === 0) return null;
  const points = data.map((val, idx) => `${(idx / (data.length - 1)) * 60},${20 - (val / Math.max(...data, 1)) * 18}`).join(' ');
  return (
    <svg width="60" height="20" style={{ overflow: 'visible' }}>
      <polyline fill="none" stroke={color} strokeWidth="2" points={points} />
    </svg>
  );
};

const EChart = ({ option, style, onEvents }) => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (chartRef.current) {
      chartInstance.current = echarts.init(chartRef.current);
    }

    const handleResize = () => {
      chartInstance.current && chartInstance.current.resize();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chartInstance.current && chartInstance.current.dispose();
    };
  }, []);

  useEffect(() => {
    if (chartInstance.current && option) {
      chartInstance.current.setOption(option, true);
    }
  }, [option]);

  useEffect(() => {
    if (chartInstance.current && onEvents) {
      Object.entries(onEvents).forEach(([eventName, handler]) => {
        chartInstance.current.off(eventName);
        chartInstance.current.on(eventName, handler);
      });
    }
  }, [onEvents]);

  return <div ref={chartRef} style={{ width: '100%', height: '100%', ...style }} />;
};

export default function NammaMlaAnalytics({ adminToken, API_BASE, showNotification, readOnly }) {

    const [activeTab, setActiveTab] = useState('dashboard'); // dashboard, upload, reports, export
    const [filtersExpanded, setFiltersExpanded] = useState(false);
    const [reportsFiltersExpanded, setReportsFiltersExpanded] = useState(false);
    const [exportFiltersExpanded, setExportFiltersExpanded] = useState(false);
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

    // Tab-Specific Filters State
    const [dashboardFilters, setDashboardFilters] = useState({
      month: '',
      ward_number: '',
      category: '',
      status: '',
      assignee: '',
      priority: ''
    });

    const [reportsFilters, setReportsFilters] = useState({
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

    const [exportFilters, setExportFilters] = useState({
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

    // Modal open states
    const [uploadModalOpen, setUploadModalOpen] = useState(false);

    // Unique Wards, Categories, Assignees, Constituencies extracted from DB for filter dropdowns
    const [filterOptions, setFilterOptions] = useState({
      wards: [],
      categories: [],
      assignees: [],
      constituencies: []
    });

    // Load analytics for Dashboard
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams();
        Object.entries(dashboardFilters).forEach(([key, val]) => {
          if (val) queryParams.append(key, val);
        });

        const res = await fetch(`${API_BASE}/admin/namma-mla/analytics?${queryParams.toString()}`, {
          headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        if (!res.ok) throw new Error('Failed to fetch analytics data.');
        const result = await res.json();
        setData(result);
        showNotification('Dashboard statistics updated.', 'success');

        // Extract unique lists for filter dropdown options based on initial data
        if (result) {
          setFilterOptions({
            wards: [...new Set((result.ward_wise_complaints || []).map(item => item.ward_number))].filter(Boolean).sort(),
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
      setLoading(true);
      try {
        const queryParams = new URLSearchParams();
        Object.entries(reportsFilters).forEach(([key, val]) => {
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
        showNotification('Reports leaderboard and performance metrics synced.', 'success');
      } catch (err) {
        showNotification('Error loading reports data.', 'error');
      } finally {
        setLoading(false);
      }
    };

    // Run on activeTab updates
    useEffect(() => {
      if (activeTab === 'dashboard') {
        fetchAnalytics();
      } else if (activeTab === 'reports') {
        fetchReports();
      }
    }, [activeTab]);

    // Run when dashboard filters change
    useEffect(() => {
      if (activeTab === 'dashboard') {
        fetchAnalytics();
      }
    }, [dashboardFilters]);

    // Run when reports filters change
    useEffect(() => {
      if (activeTab === 'reports') {
        fetchReports();
      }
    }, [reportsFilters]);

    const handleResetDashboardFilters = () => {
      setDashboardFilters({
        month: '',
        ward_number: '',
        category: '',
        status: '',
        assignee: '',
        priority: ''
      });
      showNotification('Dashboard filters reset.', 'success');
    };

    const handleResetReportsFilters = () => {
      setReportsFilters({
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
      showNotification('Reports filters reset.', 'success');
    };

    const handleResetExportFilters = () => {
      setExportFilters({
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
      showNotification('Export filters reset.', 'success');
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
        Object.entries(dashboardFilters).forEach(([k, v]) => {
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

    const insights = React.useMemo(() => {
      if (!data) return null;

      // 1. Most Burdened Ward
      let mostBurdenedWard = 'N/A';
      if (data.ward_wise_complaints && data.ward_wise_complaints.length > 0) {
        const topWard = data.ward_wise_complaints.reduce((max, w) => w.count > max.count ? w : max, data.ward_wise_complaints[0]);
        mostBurdenedWard = `Ward ${topWard.ward_number} (${topWard.count} cases)`;
      }

      // 2. Highest Complaint Category
      let highestCategory = 'N/A';
      if (data.category_distribution && data.category_distribution.length > 0) {
        const topCat = data.category_distribution.reduce((max, c) => c.count > max.count ? c : max, data.category_distribution[0]);
        highestCategory = `${topCat.category} (${topCat.count} cases)`;
      }

      // 3. Officer Insights from leaderboard (reports)
      let fastestOfficer = 'N/A';
      let slowestOfficer = 'N/A';
      let bestResOfficer = 'N/A';

      if (leaderboard && leaderboard.length > 0) {
        const validSpeed = leaderboard.filter(l => parseFloat(l.avg_resolution_time_days) > 0);
        if (validSpeed.length > 0) {
          const fastest = validSpeed.reduce((min, o) => parseFloat(o.avg_resolution_time_days) < parseFloat(min.avg_resolution_time_days) ? o : min, validSpeed[0]);
          fastestOfficer = `${fastest.officer} (${fastest.avg_resolution_time_days} days)`;

          const slowest = validSpeed.reduce((max, o) => parseFloat(o.avg_resolution_time_days) > parseFloat(max.avg_resolution_time_days) ? o : max, validSpeed[0]);
          slowestOfficer = `${slowest.officer} (${slowest.avg_resolution_time_days} days)`;
        }

        const bestRate = leaderboard.reduce((max, o) => o.completion_percent > max.completion_percent ? o : max, leaderboard[0]);
        bestResOfficer = `${bestRate.officer} (${bestRate.completion_percent}%)`;
      }

      return {
        mostBurdenedWard,
        highestCategory,
        fastestOfficer,
        slowestOfficer,
        bestResOfficer
      };
    }, [data, leaderboard]);

    // Printable report generator
    const triggerPrintReport = () => {
      window.print();
    };

    // CSV Exporter
    const handleExportCSV = () => {
      const queryParams = new URLSearchParams();
      const activeFilters = activeTab === 'export' ? exportFilters : dashboardFilters;
      Object.entries(activeFilters).forEach(([key, val]) => {
        if (val) queryParams.append(key, val);
      });
      window.open(`${API_BASE}/admin/namma-mla/export/csv?${queryParams.toString()}&token=${adminToken}`, '_blank');
    };

    const FIXED_CATEGORIES = [
      'ROADS_FOOTPATHS',
      'OTHERS',
      'WATER_SUPPLY',
      'DRAINAGE',
      'WASTE_MANAGEMENT',
      'STREET_LIGHT',
      'SANITATION',
      'PUBLIC_HEALTH'
    ];

    let matrixRows = [];
    let totalRow = { category: 'TOTAL', open: 0, pending: 0, closed: 0, total: 0 };
    if (data && data.category_status_matrix) {
      matrixRows = FIXED_CATEGORIES.map(cat => {
        const found = data.category_status_matrix.find(item => item.category === cat);
        return {
          category: cat,
          open: found ? found.open : 0,
          pending: found ? found.pending : 0,
          closed: found ? found.closed : 0,
          total: found ? found.total : 0
        };
      });
      totalRow = matrixRows.reduce((acc, row) => {
        acc.open += row.open;
        acc.pending += row.pending;
        acc.closed += row.closed;
        acc.total += row.total;
        return acc;
      }, { category: 'TOTAL', open: 0, pending: 0, closed: 0, total: 0 });
    }

    return (
      <div className="namma-mla-analytics-module" style={{ backgroundColor: '#F8FAFC', minHeight: '100vh', padding: '24px' }}>
        <div className="analytics-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={{ color: '#0F172A', margin: 0, fontWeight: '800', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.5rem', letterSpacing: '-0.025em' }}>
              <FileSpreadsheet style={{ color: '#2563EB' }} />
              Namma MLA Complaint Analytics
            </h2>
            <p style={{ color: '#64748B', fontSize: '0.875rem', marginTop: '4px', fontWeight: '500' }}>
              Constituency daily sheet import & MIS management dashboard
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '8px', fontWeight: '600', backgroundColor: '#0F172A', borderColor: '#0F172A', color: '#ffffff' }}
              onClick={() => setUploadModalOpen(true)}
            >
              <UploadCloud size={18} /> Upload Daily Sheet
            </button>
          </div>
        </div>

        {/* TAB NAVIGATION ROW */}
        <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'flex-start' }}>
          <div className="tabs-navigation" style={{ display: 'flex', gap: '8px', backgroundColor: 'var(--bg-tertiary)', padding: '4px', borderRadius: 'var(--radius-md)' }}>
            <button
              className={`btn btn-sm ${activeTab === 'dashboard' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ borderRadius: 'var(--radius-sm)', border: 'none' }}
              onClick={() => setActiveTab('dashboard')}
            >
              Dashboard
            </button>

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


    {/* LOADING SPINNER */ }
    {
      loading && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px', gap: '12px' }}>
          <RefreshCw size={40} className="loading-spinner" style={{ color: 'var(--primary-green)' }} />
          <p style={{ color: 'var(--text-secondary)' }}>Retrieving constituency metrics...</p>
        </div>
      )
    }

    {/* DASHBOARD TAB */ }
    {
      !loading && activeTab === 'dashboard' && (
        <div style={{ animation: 'fadeIn 0.5s ease-out' }}>

          {/* FILTER TOGGLE BUTTON */}
          <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'flex-start' }}>
            <button
              className="btn"
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px', padding: '10px 18px', borderRadius: '12px', border: '1px solid #CBD5E1', backgroundColor: filtersExpanded ? '#0F172A' : '#ffffff', color: filtersExpanded ? '#ffffff' : '#0F172A', transition: 'all 0.2s ease', minWidth: '80px', boxShadow: '0 2px 6px rgba(0,0,0,0.03)', cursor: 'pointer' }}
              onClick={() => setFiltersExpanded(!filtersExpanded)}
            >
              <Filter size={18} />
              <span style={{ fontSize: '0.7rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Filter</span>
            </button>
          </div>

          {/* DASHBOARD FILTERS PANEL */}
          {filtersExpanded && (
            <div className="card" style={{ marginBottom: '24px', padding: '20px', borderRadius: '16px', boxShadow: '0 4px 20px -2px rgba(0,0,0,0.05)', border: '1px solid var(--border-color)', backgroundColor: '#ffffff', animation: 'fadeIn 0.3s ease-out' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', borderBottom: '1px solid #E2E8F0', paddingBottom: '12px' }}>
                <Filter size={18} style={{ color: '#2563EB' }} />
                <h4 style={{ margin: 0, fontWeight: '800', color: '#0F172A', fontSize: '1.05rem', letterSpacing: '-0.02em' }}>Control Panel & Analytics Filters</h4>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: '700', color: '#475569', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Calendar size={14} style={{ color: '#64748B' }} /> Month
                  </label>
                  <select
                    className="form-control"
                    style={{ width: '100%', fontSize: '0.85rem', padding: '8px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', color: '#0F172A', fontWeight: '500', outline: 'none' }}
                    value={dashboardFilters.month}
                    onChange={(e) => setDashboardFilters(prev => ({ ...prev, month: e.target.value }))}
                  >
                    <option value="">All Months</option>
                    {MONTHS.map(m => <option key={m.value} value={m.value}>{m.name}</option>)}
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: '700', color: '#475569', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <MapPin size={14} style={{ color: '#64748B' }} /> Ward Number
                  </label>
                  <select
                    className="form-control"
                    style={{ width: '100%', fontSize: '0.85rem', padding: '8px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', color: '#0F172A', fontWeight: '500', outline: 'none' }}
                    value={dashboardFilters.ward_number}
                    onChange={(e) => setDashboardFilters(prev => ({ ...prev, ward_number: e.target.value }))}
                  >
                    <option value="">All Wards</option>
                    {filterOptions.wards.map(w => <option key={w} value={w}>Ward {w}</option>)}
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: '700', color: '#475569', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Layers size={14} style={{ color: '#64748B' }} /> Category
                  </label>
                  <select
                    className="form-control"
                    style={{ width: '100%', fontSize: '0.85rem', padding: '8px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', color: '#0F172A', fontWeight: '500', outline: 'none' }}
                    value={dashboardFilters.category}
                    onChange={(e) => setDashboardFilters(prev => ({ ...prev, category: e.target.value }))}
                  >
                    <option value="">All Categories</option>
                    {filterOptions.categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: '700', color: '#475569', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CheckCircle size={14} style={{ color: '#64748B' }} /> Status
                  </label>
                  <select
                    className="form-control"
                    style={{ width: '100%', fontSize: '0.85rem', padding: '8px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', color: '#0F172A', fontWeight: '500', outline: 'none' }}
                    value={dashboardFilters.status}
                    onChange={(e) => setDashboardFilters(prev => ({ ...prev, status: e.target.value }))}
                  >
                    <option value="">All Statuses</option>
                    <option value="Pending">Pending</option>
                    <option value="Assigned">Assigned</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: '700', color: '#475569', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Users size={14} style={{ color: '#64748B' }} /> Assignee
                  </label>
                  <select
                    className="form-control"
                    style={{ width: '100%', fontSize: '0.85rem', padding: '8px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', color: '#0F172A', fontWeight: '500', outline: 'none' }}
                    value={dashboardFilters.assignee}
                    onChange={(e) => setDashboardFilters(prev => ({ ...prev, assignee: e.target.value }))}
                  >
                    <option value="">All Officers</option>
                    {filterOptions.assignees.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: '700', color: '#475569', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <AlertTriangle size={14} style={{ color: '#64748B' }} /> Priority
                  </label>
                  <select
                    className="form-control"
                    style={{ width: '100%', fontSize: '0.85rem', padding: '8px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', color: '#0F172A', fontWeight: '500', outline: 'none' }}
                    value={dashboardFilters.priority}
                    onChange={(e) => setDashboardFilters(prev => ({ ...prev, priority: e.target.value }))}
                  >
                    <option value="">All Priorities</option>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
                <button
                  className="btn btn-secondary"
                  style={{ padding: '8px 16px', borderRadius: '8px', fontWeight: '600', fontSize: '0.85rem' }}
                  onClick={handleResetDashboardFilters}
                >
                  Reset Filters
                </button>
                <button
                  className="btn btn-primary"
                  style={{ padding: '8px 16px', borderRadius: '8px', fontWeight: '600', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                  onClick={fetchAnalytics}
                  disabled={loading}
                >
                  <RefreshCw size={14} className={loading ? 'loading-spinner' : ''} />
                  Sync Data
                </button>
              </div>
            </div>
          )}

          {/* KPI CARDS GRID */}
          {data && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '20px', marginBottom: '24px' }}>
              <div
                className="stat-card"
                style={{ cursor: 'pointer', padding: '16px', borderRadius: '12px', borderLeft: '5px solid #2563EB', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '110px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)', backgroundColor: '#ffffff', transition: 'all 0.3s ease' }}
                onClick={() => handleOpenDrillDown('', '', 'All Complaints')}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>Total Complaints</div>
                  <FileSpreadsheet size={18} style={{ color: '#2563EB' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '8px' }}>
                  <div>
                    <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0F172A', lineHeight: '1.2' }}>{data.kpis.total_complaints}</div>
                    <div style={{ fontSize: '0.7rem', color: '#16A34A', fontWeight: '600', marginTop: '2px' }}>↑ +12% this month</div>
                  </div>
                  <Sparkline data={data.complaint_trend ? data.complaint_trend.map(t => t.raised).slice(-10) : []} color="#2563EB" />
                </div>
              </div>

              <div
                className="stat-card"
                style={{ cursor: 'pointer', padding: '16px', borderRadius: '12px', borderLeft: '5px solid #F59E0B', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '110px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)', backgroundColor: '#ffffff', transition: 'all 0.3s ease' }}
                onClick={() => handleOpenDrillDown('status', 'Pending', 'Pending Complaints')}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>Pending Reviews</div>
                  <AlertTriangle size={18} style={{ color: '#F59E0B' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '8px' }}>
                  <div>
                    <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#F59E0B', lineHeight: '1.2' }}>{data.kpis.pending_complaints}</div>
                    <div style={{ fontSize: '0.7rem', color: '#DC2626', fontWeight: '600', marginTop: '2px' }}>Awaiting allocation</div>
                  </div>
                  <Sparkline data={data.complaint_trend ? data.complaint_trend.map(t => t.raised - t.resolved).slice(-10) : []} color="#F59E0B" />
                </div>
              </div>

              <div
                className="stat-card"
                style={{ cursor: 'pointer', padding: '16px', borderRadius: '12px', borderLeft: '5px solid #06B6D4', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '110px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)', backgroundColor: '#ffffff', transition: 'all 0.3s ease' }}
                onClick={() => handleOpenDrillDown('status', 'In Progress', 'In Progress Complaints')}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>Active Actions</div>
                  <RefreshCw size={18} style={{ color: '#06B6D4' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '8px' }}>
                  <div>
                    <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#06B6D4', lineHeight: '1.2' }}>{data.kpis.open_complaints - data.kpis.pending_complaints}</div>
                    <div style={{ fontSize: '0.7rem', color: '#06B6D4', fontWeight: '600', marginTop: '2px' }}>Assigned & active</div>
                  </div>
                  <Sparkline data={data.complaint_trend ? data.complaint_trend.map(t => t.raised).slice(-10) : []} color="#06B6D4" />
                </div>
              </div>

              <div
                className="stat-card"
                style={{ cursor: 'pointer', padding: '16px', borderRadius: '12px', borderLeft: '5px solid #16A34A', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '110px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)', backgroundColor: '#ffffff', transition: 'all 0.3s ease' }}
                onClick={() => handleOpenDrillDown('status', 'Resolved', 'Resolved Complaints')}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>Resolved Actions</div>
                  <CheckCircle size={18} style={{ color: '#16A34A' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '8px' }}>
                  <div>
                    <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#16A34A', lineHeight: '1.2' }}>{data.kpis.resolved_complaints}</div>
                    <div style={{ fontSize: '0.7rem', color: '#16A34A', fontWeight: '600', marginTop: '2px' }}>Res. Rate: {data.kpis.resolution_percent}%</div>
                  </div>
                  <Sparkline data={data.complaint_trend ? data.complaint_trend.map(t => t.resolved).slice(-10) : []} color="#16A34A" />
                </div>
              </div>

              <div
                className="stat-card"
                style={{ cursor: 'pointer', padding: '16px', borderRadius: '12px', borderLeft: '5px solid #DC2626', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '110px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)', backgroundColor: '#ffffff', transition: 'all 0.3s ease' }}
                onClick={() => handleOpenDrillDown('priority', 'High', 'High/Urgent Priority')}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>Urgent Priority</div>
                  <AlertTriangle size={18} style={{ color: '#DC2626' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '8px' }}>
                  <div>
                    <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#DC2626', lineHeight: '1.2' }}>{data.kpis.high_priority}</div>
                    <div style={{ fontSize: '0.7rem', color: '#DC2626', fontWeight: '600', marginTop: '2px' }}>Critical issues flagged</div>
                  </div>
                  <Sparkline data={data.complaint_trend ? data.complaint_trend.map(t => t.raised).slice(-10) : []} color="#DC2626" />
                </div>
              </div>
            </div>
          )}

          {/* CONSTITUENCY INSIGHTS ROW */}
          {data && data.kpis.total_complaints > 0 && insights && (
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ color: '#0F172A', fontSize: '1.1rem', marginBottom: '16px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <TrendingUp size={20} style={{ color: '#2563EB' }} />
                Constituency Management Insights
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: '#FEE2E2', border: '1px solid #FCA5A5' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#991B1B', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    🏆 Burdened Ward
                  </div>
                  <div style={{ fontSize: '0.9rem', fontWeight: '700', color: '#7F1D1D', marginTop: '8px' }}>{insights.mostBurdenedWard}</div>
                </div>
                <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: '#FEF3C7', border: '1px solid #FDE68A' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#92400E', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    🔥 Top Category
                  </div>
                  <div style={{ fontSize: '0.9rem', fontWeight: '700', color: '#78350F', marginTop: '8px' }}>{insights.highestCategory}</div>
                </div>
              </div>
            </div>
          )}

          {/* EMPTY STATE */}
          {(!data || data.kpis.total_complaints === 0) && (
            <div className="card" style={{ padding: '60px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', borderRadius: '16px' }}>
              <UploadCloud size={60} style={{ color: '#64748B' }} />
              <h3 style={{ color: '#0F172A', margin: 0, fontWeight: '800' }}>No Complaint Analytics Data Yet</h3>
              <p style={{ color: '#64748B', maxWidth: '480px', margin: '0 auto 12px' }}>
                Analyze external Namma MLA App sheets. To get started, upload today's daily sheet using the daily import button in the top right.
              </p>
              <button className="btn btn-primary" onClick={() => setUploadModalOpen(true)}>
                Upload Sheet (.xlsx)
              </button>
            </div>
          )}

          {/* CHARTS CONTAINER GRID */}
          {data && data.kpis.total_complaints > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

              {/* Row 1: Category Status Matrix & Priority Spread */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
                
                {/* Category Status Matrix Table */}
                <div className="card" style={{ padding: '20px', borderRadius: '16px', boxShadow: '0 4px 20px -2px rgba(0,0,0,0.05)', backgroundColor: '#ffffff', display: 'flex', flexDirection: 'column' }}>
                  <h3 style={{ color: '#0F172A', fontSize: '1rem', marginBottom: '16px', fontWeight: '800' }}>Category Status Matrix</h3>
                  <div style={{ flexGrow: 1, overflowY: 'auto', maxHeight: '300px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                      <thead style={{ position: 'sticky', top: 0, backgroundColor: '#ffffff', zIndex: 10 }}>
                        <tr style={{ borderBottom: '2px solid #E2E8F0', textAlign: 'left' }}>
                          <th style={{ padding: '8px 12px', fontWeight: '700', color: '#475569' }}>Category</th>
                          <th style={{ padding: '8px 12px', fontWeight: '700', color: '#475569', textAlign: 'right' }}>Open</th>
                          <th style={{ padding: '8px 12px', fontWeight: '700', color: '#475569', textAlign: 'right' }}>Pending</th>
                          <th style={{ padding: '8px 12px', fontWeight: '700', color: '#475569', textAlign: 'right' }}>Closed</th>
                          <th style={{ padding: '8px 12px', fontWeight: '700', color: '#475569', textAlign: 'right' }}>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {matrixRows.map((row, idx) => (
                          <tr key={row.category} style={{ borderBottom: '1px solid #F1F5F9', backgroundColor: idx % 2 === 0 ? '#ffffff' : '#F8FAFC' }}>
                            <td style={{ padding: '8px 12px', fontWeight: '600', color: '#1E293B' }}>{row.category}</td>
                            <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                              <span className="badge" style={{ backgroundColor: '#FFEDD5', color: '#EA580C', fontWeight: '700', padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem' }}>{row.open}</span>
                            </td>
                            <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                              <span className="badge" style={{ backgroundColor: '#FEF3C7', color: '#D97706', fontWeight: '700', padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem' }}>{row.pending}</span>
                            </td>
                            <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                              <span className="badge" style={{ backgroundColor: '#DCFCE7', color: '#15803D', fontWeight: '700', padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem' }}>{row.closed}</span>
                            </td>
                            <td style={{ padding: '8px 12px', fontWeight: '700', color: '#0F172A', textAlign: 'right' }}>{row.total}</td>
                          </tr>
                        ))}
                        <tr style={{ borderTop: '2px solid #E2E8F0', borderBottom: '2px solid #E2E8F0', backgroundColor: '#F1F5F9', fontWeight: '800' }}>
                          <td style={{ padding: '10px 12px', color: '#0F172A' }}>TOTAL</td>
                          <td style={{ padding: '10px 12px', textAlign: 'right', color: '#EA580C' }}>{totalRow.open}</td>
                          <td style={{ padding: '10px 12px', textAlign: 'right', color: '#D97706' }}>{totalRow.pending}</td>
                          <td style={{ padding: '10px 12px', textAlign: 'right', color: '#15803D' }}>{totalRow.closed}</td>
                          <td style={{ padding: '10px 12px', textAlign: 'right', color: '#0F172A' }}>{totalRow.total}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Priority Spread Donut Chart */}
                <div className="card" style={{ padding: '20px', borderRadius: '16px', boxShadow: '0 4px 20px -2px rgba(0,0,0,0.05)', backgroundColor: '#ffffff' }}>
                  <h3 style={{ color: '#0F172A', fontSize: '1rem', marginBottom: '16px', fontWeight: '800' }}>Priority Spread</h3>
                  <div style={{ height: '300px' }}>
                    <EChart
                      option={{
                        tooltip: {
                          trigger: 'item',
                          formatter: (params) => {
                            return `<div style="font-family: inherit; padding: 4px;">
                              <span style="font-weight: 600; color: #1e293b;">${params.name} Priority</span><br/>
                              <span style="color: #64748b;">Count:</span> <strong style="color: #0f172a;">${params.value}</strong><br/>
                              <span style="color: #64748b;">Share:</span> <strong style="color: #2563eb;">${params.percent}%</strong>
                            </div>`;
                          }
                        },
                        legend: {
                          orient: 'vertical',
                          right: '5%',
                          top: 'center',
                          icon: 'circle',
                          textStyle: { color: '#64748b', fontSize: 11 },
                          formatter: (name) => {
                            const dbName = name.toUpperCase();
                            const found = (data.priority_distribution || []).find(p => p.priority === dbName);
                            const count = found ? found.count : 0;
                            return `${name}: ${count}`;
                          }
                        },
                        graphic: [
                          {
                            type: 'text',
                            left: '39%',
                            top: '46%',
                            style: {
                              text: `Total\n${
                                ((data.priority_distribution || []).find(p => p.priority === 'CRITICAL') || {count: 0}).count +
                                ((data.priority_distribution || []).find(p => p.priority === 'HIGH') || {count: 0}).count +
                                ((data.priority_distribution || []).find(p => p.priority === 'MEDIUM') || {count: 0}).count
                              }`,
                              textAlign: 'center',
                              fill: '#0F172A',
                              font: 'bold 14px sans-serif'
                            }
                          }
                        ],
                        series: [
                          {
                            name: 'Priority Spread',
                            type: 'pie',
                            radius: ['50%', '70%'],
                            center: ['43%', '50%'],
                            avoidLabelOverlap: false,
                            itemStyle: {
                              borderRadius: 8,
                              borderColor: '#fff',
                              borderWidth: 2
                            },
                            label: {
                              show: true,
                              position: 'outside',
                              formatter: '{b}: {c}',
                              fontSize: 11,
                              fontWeight: 'bold',
                              color: '#475569'
                            },
                            labelLine: {
                              show: true,
                              length: 8,
                              length2: 8
                            },
                            emphasis: {
                              label: {
                                show: true,
                                fontSize: 12,
                                fontWeight: 'bold'
                              }
                            },
                            data: ['Critical', 'High', 'Medium'].map((level) => {
                              const dbName = level.toUpperCase();
                              const found = (data.priority_distribution || []).find(p => p.priority === dbName);
                              const count = found ? found.count : 0;
                              const colors = {
                                'Critical': ['#DC2626', '#EF4444'],
                                'High': ['#F59E0B', '#FBBF24'],
                                'Medium': ['#2563EB', '#60A5FA']
                              };
                              return {
                                value: count,
                                name: level,
                                itemStyle: {
                                  color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                                    { offset: 0, color: colors[level][0] },
                                    { offset: 1, color: colors[level][1] }
                                  ])
                                }
                              };
                            })
                          }
                        ]
                      }}
                      onEvents={{
                        click: (params) => {
                          const dbName = params.name === 'Critical' ? 'Urgent' : params.name;
                          handleOpenDrillDown('priority', dbName, `Priority: ${params.name}`);
                        }
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Row 2: Open Tickets Analysis & Ward-wise Summary */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
                
                {/* Open Tickets Analysis Vertical Bar Chart */}
                <div className="card" style={{ padding: '20px', borderRadius: '16px', boxShadow: '0 4px 20px -2px rgba(0,0,0,0.05)', backgroundColor: '#ffffff' }}>
                  <h3 style={{ color: '#0F172A', fontSize: '1rem', marginBottom: '8px', fontWeight: '800' }}>Open Tickets Analysis</h3>
                  <p style={{ color: '#64748B', fontSize: '0.8rem', marginBottom: '16px' }}>Wards with highest number of Open complaints</p>
                  <div style={{ height: '300px' }}>
                    <EChart
                      option={{
                        tooltip: {
                          trigger: 'axis',
                          axisPointer: { type: 'shadow' },
                          formatter: (params) => {
                            const p = params[0];
                            return `<div style="font-family: inherit; padding: 4px;">
                              <span style="font-weight: 600; color: #1e293b;">Ward ${p.name}</span><br/>
                              <span style="color: #64748b;">Open Tickets:</span> <strong style="color: #dc2626;">${p.value}</strong>
                            </div>`;
                          }
                        },
                        grid: { left: '3%', right: '3%', bottom: '10%', top: '15%', containLabel: true },
                        xAxis: {
                          type: 'category',
                          data: [...(data.ward_status_breakdown || [])]
                            .sort((a, b) => {
                              const aNum = parseInt(a.ward, 10);
                              const bNum = parseInt(b.ward, 10);
                              if (isNaN(aNum) && isNaN(bNum)) return a.ward.localeCompare(b.ward);
                              if (isNaN(aNum)) return 1;
                              if (isNaN(bNum)) return -1;
                              return aNum - bNum;
                            })
                            .map(w => w.ward),
                          axisLabel: {
                            interval: 0,
                            rotate: (data.ward_status_breakdown || []).length > 12 ? 45 : 0,
                            color: '#64748B',
                            fontWeight: '600',
                            fontSize: 10
                          },
                          axisLine: { lineStyle: { color: '#E2E8F0' } },
                          axisTick: { show: false }
                        },
                        yAxis: {
                          type: 'value',
                          splitLine: { lineStyle: { type: 'dashed', color: '#E2E8F0' } },
                          axisLabel: { color: '#64748B' }
                        },
                        series: [
                          {
                            name: 'Open Tickets',
                            type: 'bar',
                            barWidth: '55%',
                            label: {
                              show: true,
                              position: 'top',
                              color: '#0F172A',
                              fontWeight: 'bold',
                              fontSize: 11
                            },
                            itemStyle: {
                              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                                { offset: 0, color: '#EA580C' },
                                { offset: 1, color: '#FDBA74' }
                              ]),
                              borderRadius: [6, 6, 0, 0]
                            },
                            data: [...(data.ward_status_breakdown || [])]
                              .sort((a, b) => {
                                const aNum = parseInt(a.ward, 10);
                                const bNum = parseInt(b.ward, 10);
                                if (isNaN(aNum) && isNaN(bNum)) return a.ward.localeCompare(b.ward);
                                if (isNaN(aNum)) return 1;
                                if (isNaN(bNum)) return -1;
                                return aNum - bNum;
                              })
                              .map(w => w.open)
                          }
                        ]
                      }}
                      onEvents={{
                        click: (params) => {
                          handleOpenDrillDown('ward_number', params.name, `Ward ${params.name} (Open Tickets)`);
                        }
                      }}
                    />
                  </div>
                </div>

                {/* Ward-wise Summary 100% Horizontal Stacked Bar Chart */}
                <div className="card" style={{ padding: '20px', borderRadius: '16px', boxShadow: '0 4px 20px -2px rgba(0,0,0,0.05)', backgroundColor: '#ffffff', display: 'flex', flexDirection: 'column' }}>
                  <h3 style={{ color: '#0F172A', fontSize: '1rem', marginBottom: '8px', fontWeight: '800' }}>Ward-wise Summary</h3>
                  <p style={{ color: '#64748B', fontSize: '0.8rem', marginBottom: '16px' }}>Performance metrics by ward (Closed vs Open cases)</p>
                  <div style={{ flexGrow: 1, overflowY: 'auto', maxHeight: '300px', paddingRight: '8px' }}>
                    <div style={{ height: `${Math.max(300, (data.ward_status_breakdown || []).length * 35)}px` }}>
                      <EChart
                        option={{
                          tooltip: {
                            trigger: 'axis',
                            axisPointer: { type: 'shadow' },
                            formatter: (params) => {
                              const closed = params.find(p => p.seriesName === 'Closed %');
                              const open = params.find(p => p.seriesName === 'Open %');
                              return `<div style="font-family: inherit; padding: 4px;">
                                <span style="font-weight: 600; color: #1e293b;">Ward ${params[0].name} Performance</span><br/>
                                <span style="color: #16a34a;">● Closed:</span> <strong>${closed ? closed.value : 0}%</strong> (${closed ? closed.data.count : 0} cases)<br/>
                                <span style="color: #ea580c;">● Open:</span> <strong>${open ? open.value : 0}%</strong> (${open ? open.data.count : 0} cases)
                              </div>`;
                            }
                          },
                          legend: {
                            data: ['Closed %', 'Open %'],
                            bottom: '0%',
                            left: 'center',
                            icon: 'circle'
                          },
                          grid: { left: '3%', right: '4%', bottom: '12%', top: '5%', containLabel: true },
                          xAxis: {
                            type: 'value',
                            min: 0,
                            max: 100,
                            axisLabel: { formatter: '{value}%', color: '#64748B' },
                            splitLine: { show: false }
                          },
                          yAxis: {
                            type: 'category',
                            data: [...(data.ward_status_breakdown || [])]
                              .sort((a, b) => {
                                const aNum = parseInt(a.ward, 10);
                                const bNum = parseInt(b.ward, 10);
                                if (isNaN(aNum) && isNaN(bNum)) return a.ward.localeCompare(b.ward);
                                if (isNaN(aNum)) return 1;
                                if (isNaN(bNum)) return -1;
                                return aNum - bNum;
                              })
                              .reverse()
                              .map(w => `${w.ward}`),
                            axisLabel: { color: '#64748B', fontWeight: '600', fontSize: 10 },
                            axisLine: { lineStyle: { color: '#E2E8F0' } },
                            axisTick: { show: false }
                          },
                          series: [
                            {
                              name: 'Closed %',
                              type: 'bar',
                              stack: 'total',
                              label: {
                                show: true,
                                formatter: (p) => p.value > 10 ? `${p.value}%` : '',
                                color: '#ffffff',
                                fontWeight: 'bold',
                                fontSize: 10
                              },
                              itemStyle: {
                                color: '#16A34A'
                              },
                              data: [...(data.ward_status_breakdown || [])]
                                .sort((a, b) => {
                                  const aNum = parseInt(a.ward, 10);
                                  const bNum = parseInt(b.ward, 10);
                                  if (isNaN(aNum) && isNaN(bNum)) return a.ward.localeCompare(b.ward);
                                  if (isNaN(aNum)) return 1;
                                  if (isNaN(bNum)) return -1;
                                  return aNum - bNum;
                                })
                                .reverse()
                                .map(w => {
                                  const pct = w.total > 0 ? Math.round((w.closed / w.total) * 100) : 0;
                                  return { value: pct, count: w.closed };
                                })
                            },
                            {
                              name: 'Open %',
                              type: 'bar',
                              stack: 'total',
                              label: {
                                show: true,
                                formatter: (p) => p.value > 10 ? `${p.value}%` : '',
                                color: '#ffffff',
                                fontWeight: 'bold',
                                fontSize: 10
                              },
                              itemStyle: {
                                color: '#EA580C'
                              },
                              data: [...(data.ward_status_breakdown || [])]
                                .sort((a, b) => {
                                  const aNum = parseInt(a.ward, 10);
                                  const bNum = parseInt(b.ward, 10);
                                  if (isNaN(aNum) && isNaN(bNum)) return a.ward.localeCompare(b.ward);
                                  if (isNaN(aNum)) return 1;
                                  if (isNaN(bNum)) return -1;
                                  return aNum - bNum;
                                })
                                .reverse()
                                .map(w => {
                                  const pct = w.total > 0 ? Math.round((w.open / w.total) * 100) : 0;
                                  return { value: pct, count: w.open };
                                })
                            }
                          ]
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Row 5: Column-based Routing Flow */}
              <div className="card" style={{ padding: '24px', borderRadius: '16px', boxShadow: '0 4px 20px -2px rgba(0,0,0,0.05)', border: '1px solid #E2E8F0', backgroundColor: '#ffffff' }}>
                <h3 style={{ color: '#0F172A', fontSize: '1.1rem', marginBottom: '8px', fontWeight: '800' }}>MIS Resolution Flow Routing</h3>
                <p style={{ color: '#64748B', fontSize: '0.85rem', marginBottom: '24px' }}>
                  This visualization shows the path complaints take from their specific category, assigned officer, and their final status.
                </p>

                {data.sankey_flow && data.sankey_flow.links.length > 0 ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '40px', padding: '10px 0' }}>

                    {/* Column 1: Category */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <h4 style={{ fontSize: '0.85rem', fontWeight: '800', color: '#0F172A', borderBottom: '2px solid #16A34A', paddingBottom: '6px', marginBottom: '8px', letterSpacing: '0.05em' }}>CATEGORY</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {data.category_distribution.slice(0, 5).map((c, idx) => (
                          <div key={c.category} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', backgroundColor: '#F8FAFC', borderLeft: `4px solid ${CHART_COLORS[idx % CHART_COLORS.length]}`, borderRadius: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', transition: 'transform 0.2s ease' }} className="flow-card-item">
                            <span style={{ fontSize: '0.8rem', fontWeight: '600', color: '#1E293B' }}>{c.category}</span>
                            <span className="badge" style={{ fontSize: '0.75rem', backgroundColor: '#E2E8F0', color: '#0F172A', fontWeight: '700', padding: '2px 8px', borderRadius: '6px' }}>{c.count}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Column 2: Assignee */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <h4 style={{ fontSize: '0.85rem', fontWeight: '800', color: '#0F172A', borderBottom: '2px solid #2563EB', paddingBottom: '6px', marginBottom: '8px', letterSpacing: '0.05em' }}>ASSIGNEE</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {data.assignee_workload.slice(0, 5).map((a) => (
                          <div key={a.assignee} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', backgroundColor: '#F8FAFC', borderLeft: '4px solid #2563EB', borderRadius: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', transition: 'transform 0.2s ease' }} className="flow-card-item">
                            <span style={{ fontSize: '0.8rem', fontWeight: '600', color: '#1E293B' }}>{a.assignee}</span>
                            <span className="badge" style={{ fontSize: '0.75rem', backgroundColor: '#E2E8F0', color: '#0F172A', fontWeight: '700', padding: '2px 8px', borderRadius: '6px' }}>{a.count}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Column 3: Final Status */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <h4 style={{ fontSize: '0.85rem', fontWeight: '800', color: '#0F172A', borderBottom: '2px solid #F59E0B', paddingBottom: '6px', marginBottom: '8px', letterSpacing: '0.05em' }}>STATUS</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {data.status_distribution.map((s) => {
                          const statusColors = {
                            'Resolved': '#16A34A',
                            'Rejected': '#DC2626',
                            'Pending': '#F59E0B',
                            'Assigned': '#2563EB',
                            'In Progress': '#06B6D4'
                          };
                          const statusBgColors = {
                            'Resolved': '#DCFCE7',
                            'Rejected': '#FEE2E2',
                            'Pending': '#FEF3C7',
                            'Assigned': '#DBEAFE',
                            'In Progress': '#ECFDF5'
                          };
                          const color = statusColors[s.status] || '#64748B';
                          const bg = statusBgColors[s.status] || '#F1F5F9';
                          return (
                            <div key={s.status} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', backgroundColor: '#F8FAFC', borderLeft: `4px solid ${color}`, borderRadius: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', transition: 'transform 0.2s ease' }} className="flow-card-item">
                              <span style={{ fontSize: '0.8rem', fontWeight: '600', color: '#1E293B' }}>{s.status}</span>
                              <span className="badge" style={{ fontSize: '0.75rem', backgroundColor: bg, color: color, fontWeight: '700', padding: '2px 8px', borderRadius: '6px' }}>{s.count}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#64748B', fontSize: '0.9rem' }}>Flow data not available.</div>
                )}
              </div>

            </div>
          )}
        </div>
      )
    }

    {/* UPLOAD DAILY SHEET MODAL */ }
    {
      uploadModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: '90%', maxWidth: '1000px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', padding: '24px', position: 'relative', overflowY: 'auto' }}>

            {/* Close Button */}
            <button
              style={{ position: 'absolute', top: '16px', right: '16px', border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
              onClick={() => {
                setUploadModalOpen(false);
                setValidationResult(null);
                setImportResult(null);
                setUploadFile(null);
              }}
            >
              <XCircle size={24} />
            </button>

            <h3 style={{ color: 'var(--navy-blue)', margin: '0 0 16px', fontWeight: '700' }}>Import Daily Namma MLA Sheet</h3>

            <form onSubmit={handleValidateFile} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', border: '2px dashed var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '40px', gap: '16px', backgroundColor: 'var(--bg-secondary)', marginBottom: '20px' }}>
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
                <div className="table-wrapper" style={{ maxHeight: '250px', overflowY: 'auto' }}>
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

            {/* HISTORICAL UPLOADS TABLE */}
            <div style={{ marginTop: '24px' }}>
              <h4 style={{ color: 'var(--navy-blue)', margin: '0 0 12px', fontWeight: '700' }}>Sheet Upload & Batch History</h4>
              <div className="table-wrapper" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                <table className="data-table" style={{ fontSize: '0.8rem' }}>
                  <thead>
                    <tr>
                      <th>Uploaded Date</th>
                      <th>Filename</th>
                      <th>Uploaded By</th>
                      <th>Total Rows</th>
                      <th>Imported</th>
                      <th>Duplicates</th>
                      <th>Rejected</th>
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
                      </tr>
                    ))}
                    {uploadHistory.length === 0 && (
                      <tr>
                        <td colSpan={7} style={{ textAlign: 'center', padding: '16px', color: 'var(--text-secondary)' }}>
                          No spreadsheet uploads logged yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>
      )
    }

    {/* REPORTS & RANKS TAB */ }
    {
      activeTab === 'reports' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* FILTER TOGGLE BUTTON */}
          <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'flex-start' }}>
            <button
              className="btn"
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px', padding: '10px 18px', borderRadius: '12px', border: '1px solid #CBD5E1', backgroundColor: reportsFiltersExpanded ? '#0F172A' : '#ffffff', color: reportsFiltersExpanded ? '#ffffff' : '#0F172A', transition: 'all 0.2s ease', minWidth: '80px', boxShadow: '0 2px 6px rgba(0,0,0,0.03)', cursor: 'pointer' }}
              onClick={() => setReportsFiltersExpanded(!reportsFiltersExpanded)}
            >
              <Filter size={18} />
              <span style={{ fontSize: '0.7rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Filter</span>
            </button>
          </div>

          {/* REPORTS FILTERS PANEL */}
          {reportsFiltersExpanded && (
            <div className="card" style={{ padding: '20px', borderRadius: '16px', marginBottom: '24px', boxShadow: '0 4px 20px -2px rgba(0,0,0,0.05)', border: '1px solid var(--border-color)', backgroundColor: '#ffffff', animation: 'fadeIn 0.3s ease-out' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', borderBottom: '1px solid #E2E8F0', paddingBottom: '12px' }}>
                <Filter size={18} style={{ color: '#2563EB' }} />
                <h4 style={{ margin: 0, fontWeight: '800', color: '#0F172A', fontSize: '1.05rem', letterSpacing: '-0.02em' }}>Reports Filters</h4>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Start Date</label>
                  <input
                    type="date"
                    className="form-control"
                    style={{ width: '100%', fontSize: '0.85rem', padding: '6px' }}
                    value={reportsFilters.start_date}
                    onChange={(e) => setReportsFilters(prev => ({ ...prev, start_date: e.target.value }))}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)' }}>End Date</label>
                  <input
                    type="date"
                    className="form-control"
                    style={{ width: '100%', fontSize: '0.85rem', padding: '6px' }}
                    value={reportsFilters.end_date}
                    onChange={(e) => setReportsFilters(prev => ({ ...prev, end_date: e.target.value }))}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Ward Number</label>
                  <select
                    className="form-control"
                    style={{ width: '100%', fontSize: '0.85rem', padding: '6px' }}
                    value={reportsFilters.ward_number}
                    onChange={(e) => setReportsFilters(prev => ({ ...prev, ward_number: e.target.value }))}
                  >
                    <option value="">All Wards</option>
                    {filterOptions.wards.map(w => <option key={w} value={w}>Ward {w}</option>)}
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Category</label>
                  <select
                    className="form-control"
                    style={{ width: '100%', fontSize: '0.85rem', padding: '6px' }}
                    value={reportsFilters.category}
                    onChange={(e) => setReportsFilters(prev => ({ ...prev, category: e.target.value }))}
                  >
                    <option value="">All Categories</option>
                    {filterOptions.categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Status</label>
                  <select
                    className="form-control"
                    style={{ width: '100%', fontSize: '0.85rem', padding: '6px' }}
                    value={reportsFilters.status}
                    onChange={(e) => setReportsFilters(prev => ({ ...prev, status: e.target.value }))}
                  >
                    <option value="">All Statuses</option>
                    <option value="Pending">Pending</option>
                    <option value="Assigned">Assigned</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Priority</label>
                  <select
                    className="form-control"
                    style={{ width: '100%', fontSize: '0.85rem', padding: '6px' }}
                    value={reportsFilters.priority}
                    onChange={(e) => setReportsFilters(prev => ({ ...prev, priority: e.target.value }))}
                  >
                    <option value="">All Priorities</option>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Assignee</label>
                  <select
                    className="form-control"
                    style={{ width: '100%', fontSize: '0.85rem', padding: '6px' }}
                    value={reportsFilters.assignee}
                    onChange={(e) => setReportsFilters(prev => ({ ...prev, assignee: e.target.value }))}
                  >
                    <option value="">All Officers</option>
                    {filterOptions.assignees.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Constituency</label>
                  <select
                    className="form-control"
                    style={{ width: '100%', fontSize: '0.85rem', padding: '6px' }}
                    value={reportsFilters.constituency}
                    onChange={(e) => setReportsFilters(prev => ({ ...prev, constituency: e.target.value }))}
                  >
                    <option value="">All Constituencies</option>
                    {filterOptions.constituencies.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Search ID</label>
                  <div style={{ position: 'relative', width: '100%' }}>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. 5431"
                      style={{ width: '100%', fontSize: '0.85rem', padding: '6px 24px 6px 8px' }}
                      value={reportsFilters.search_id}
                      onChange={(e) => setReportsFilters(prev => ({ ...prev, search_id: e.target.value }))}
                    />
                    <Search size={14} style={{ position: 'absolute', right: '8px', top: '9px', color: 'var(--text-light)' }} />
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Search Citizen</label>
                  <div style={{ position: 'relative', width: '100%' }}>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Name or Mobile"
                      style={{ width: '100%', fontSize: '0.85rem', padding: '6px 24px 6px 8px' }}
                      value={reportsFilters.search_citizen}
                      onChange={(e) => setReportsFilters(prev => ({ ...prev, search_citizen: e.target.value }))}
                    />
                    <Search size={14} style={{ position: 'absolute', right: '8px', top: '9px', color: 'var(--text-light)' }} />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
                <button className="btn btn-secondary btn-sm" onClick={handleResetReportsFilters}>Reset Filters</button>
                <button className="btn btn-primary btn-sm" onClick={fetchReports} disabled={loading}>
                  <RefreshCw size={12} className={loading ? 'loading-spinner' : ''} style={{ marginRight: '4px' }} />
                  Sync Reports
                </button>
              </div>
            </div>
          )}

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
                    {leaderboard.map((officer, index) => {
                      const isLast = index === leaderboard.length - 1 && leaderboard.length > 3;
                      return (
                        <tr key={officer.officer} style={{ fontWeight: officer.rank <= 3 ? '600' : '400', backgroundColor: officer.rank === 1 ? '#FFFDF5' : 'transparent' }}>
                          <td>
                            {officer.rank === 1 ? '🥇 Gold' : officer.rank === 2 ? '🥈 Silver' : officer.rank === 3 ? '🥉 Bronze' : `#${officer.rank}`}
                          </td>
                          <td><strong>{officer.officer}</strong></td>
                          <td>{officer.total_assigned}</td>
                          <td style={{ color: '#16A34A', fontWeight: '600' }}>{officer.resolved}</td>
                          <td style={{ color: '#F59E0B', fontWeight: '600' }}>{officer.pending}</td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div style={{ flexGrow: 1, backgroundColor: '#E2E8F0', height: '6px', borderRadius: '3px', width: '50px' }}>
                                <div style={{ backgroundColor: officer.completion_percent > 75 ? '#16A34A' : officer.completion_percent > 40 ? '#F59E0B' : '#DC2626', height: '6px', borderRadius: '3px', width: `${officer.completion_percent}%` }} />
                              </div>
                              <span style={{ fontSize: '0.8rem', fontWeight: '700' }}>{officer.completion_percent}%</span>
                            </div>
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span>{officer.avg_resolution_time_days}d</span>
                              {isLast && (
                                <span style={{ fontSize: '0.7rem', backgroundColor: '#FEE2E2', color: '#DC2626', padding: '2px 6px', borderRadius: '4px', fontWeight: '700' }}>
                                  ⚠ Attention
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
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
      )
    }

    {/* EXPORT PANEL TAB */ }
    {
      activeTab === 'export' && (
        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ color: 'var(--navy-blue)', margin: '0 0 16px', fontWeight: '700' }}>Export & Report Distribution Center</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
            Export tabular grievance lists matching the active filters, print summary reports, or download dashboard snapshots for offline presentations.
          </p>

          {/* FILTER TOGGLE BUTTON */}
          <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'flex-start' }}>
            <button
              className="btn"
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px', padding: '10px 18px', borderRadius: '12px', border: '1px solid #CBD5E1', backgroundColor: exportFiltersExpanded ? '#0F172A' : '#ffffff', color: exportFiltersExpanded ? '#ffffff' : '#0F172A', transition: 'all 0.2s ease', minWidth: '80px', boxShadow: '0 2px 6px rgba(0,0,0,0.03)', cursor: 'pointer' }}
              onClick={() => setExportFiltersExpanded(!exportFiltersExpanded)}
            >
              <Filter size={18} />
              <span style={{ fontSize: '0.7rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Filter</span>
            </button>
          </div>

          {/* EXPORT FILTERS PANEL */}
          {exportFiltersExpanded && (
            <div className="card" style={{ padding: '20px', borderRadius: '16px', marginBottom: '24px', boxShadow: '0 4px 20px -2px rgba(0,0,0,0.05)', border: '1px solid var(--border-color)', backgroundColor: '#ffffff', animation: 'fadeIn 0.3s ease-out' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', borderBottom: '1px solid #E2E8F0', paddingBottom: '12px' }}>
                <Filter size={18} style={{ color: '#2563EB' }} />
                <h4 style={{ margin: 0, fontWeight: '800', color: '#0F172A', fontSize: '1.05rem', letterSpacing: '-0.02em' }}>Export Filters</h4>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Start Date</label>
                  <input
                    type="date"
                    className="form-control"
                    style={{ width: '100%', fontSize: '0.85rem', padding: '6px' }}
                    value={exportFilters.start_date}
                    onChange={(e) => setExportFilters(prev => ({ ...prev, start_date: e.target.value }))}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)' }}>End Date</label>
                  <input
                    type="date"
                    className="form-control"
                    style={{ width: '100%', fontSize: '0.85rem', padding: '6px' }}
                    value={exportFilters.end_date}
                    onChange={(e) => setExportFilters(prev => ({ ...prev, end_date: e.target.value }))}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Ward Number</label>
                  <select
                    className="form-control"
                    style={{ width: '100%', fontSize: '0.85rem', padding: '6px' }}
                    value={exportFilters.ward_number}
                    onChange={(e) => setExportFilters(prev => ({ ...prev, ward_number: e.target.value }))}
                  >
                    <option value="">All Wards</option>
                    {filterOptions.wards.map(w => <option key={w} value={w}>Ward {w}</option>)}
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Category</label>
                  <select
                    className="form-control"
                    style={{ width: '100%', fontSize: '0.85rem', padding: '6px' }}
                    value={exportFilters.category}
                    onChange={(e) => setExportFilters(prev => ({ ...prev, category: e.target.value }))}
                  >
                    <option value="">All Categories</option>
                    {filterOptions.categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Status</label>
                  <select
                    className="form-control"
                    style={{ width: '100%', fontSize: '0.85rem', padding: '6px' }}
                    value={exportFilters.status}
                    onChange={(e) => setExportFilters(prev => ({ ...prev, status: e.target.value }))}
                  >
                    <option value="">All Statuses</option>
                    <option value="Pending">Pending</option>
                    <option value="Assigned">Assigned</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Priority</label>
                  <select
                    className="form-control"
                    style={{ width: '100%', fontSize: '0.85rem', padding: '6px' }}
                    value={exportFilters.priority}
                    onChange={(e) => setExportFilters(prev => ({ ...prev, priority: e.target.value }))}
                  >
                    <option value="">All Priorities</option>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Assignee</label>
                  <select
                    className="form-control"
                    style={{ width: '100%', fontSize: '0.85rem', padding: '6px' }}
                    value={exportFilters.assignee}
                    onChange={(e) => setExportFilters(prev => ({ ...prev, assignee: e.target.value }))}
                  >
                    <option value="">All Officers</option>
                    {filterOptions.assignees.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Constituency</label>
                  <select
                    className="form-control"
                    style={{ width: '100%', fontSize: '0.85rem', padding: '6px' }}
                    value={exportFilters.constituency}
                    onChange={(e) => setExportFilters(prev => ({ ...prev, constituency: e.target.value }))}
                  >
                    <option value="">All Constituencies</option>
                    {filterOptions.constituencies.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Search ID</label>
                  <div style={{ position: 'relative', width: '100%' }}>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. 5431"
                      style={{ width: '100%', fontSize: '0.85rem', padding: '6px 24px 6px 8px' }}
                      value={exportFilters.search_id}
                      onChange={(e) => setExportFilters(prev => ({ ...prev, search_id: e.target.value }))}
                    />
                    <Search size={14} style={{ position: 'absolute', right: '8px', top: '9px', color: 'var(--text-light)' }} />
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Search Citizen</label>
                  <div style={{ position: 'relative', width: '100%' }}>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Name or Mobile"
                      style={{ width: '100%', fontSize: '0.85rem', padding: '6px 24px 6px 8px' }}
                      value={exportFilters.search_citizen}
                      onChange={(e) => setExportFilters(prev => ({ ...prev, search_citizen: e.target.value }))}
                    />
                    <Search size={14} style={{ position: 'absolute', right: '8px', top: '9px', color: 'var(--text-light)' }} />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
                <button className="btn btn-secondary btn-sm" onClick={handleResetExportFilters}>Reset Filters</button>
              </div>
            </div>
          )}

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
      )
    }

    {/* DRILL DOWN MODAL (COMPLAINTS LIST) */ }
    {
      drillModal.open && (
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
      )
    }

    </div >
  );
  }
