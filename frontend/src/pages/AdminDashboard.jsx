import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { 
  Shield, ArrowLeft, Users, FileText, Activity, 
  Search, RefreshCw, Loader2, AlertTriangle, Cpu, Clock, HardDrive
} from 'lucide-react';
import { Link } from 'react-router-dom';

const AdminDashboard = () => {
  const { logout, user } = useAuth();
  const [users, setUsers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [metrics, setMetrics] = useState(null);
  
  const [activeTab, setActiveTab] = useState('users'); // 'users' or 'logs'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Search state
  const [userSearch, setUserSearch] = useState('');
  const [logSearch, setLogSearch] = useState('');

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch user directory
      const usersResponse = await api.get('/admin/users');
      setUsers(usersResponse.data.data.users);

      // Fetch security audit logs
      const logsResponse = await api.get('/admin/audit-logs');
      setAuditLogs(logsResponse.data.data.auditLogs);

      // Fetch platform metrics (bonus)
      const metricsResponse = await api.get('/admin/metrics');
      setMetrics(metricsResponse.data.data.metrics);
      
    } catch (err) {
      setError(err.response?.data?.message || 'Access Denied. Internal database rejected Admin credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Filters
  const filteredUsers = users.filter(usr => 
    usr.name.toLowerCase().includes(userSearch.toLowerCase()) ||
    usr.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  const filteredLogs = auditLogs.filter(log => 
    log.action.toLowerCase().includes(logSearch.toLowerCase()) ||
    log.entity.toLowerCase().includes(logSearch.toLowerCase()) ||
    log.user?.email.toLowerCase().includes(logSearch.toLowerCase())
  );

  const formatUptime = (seconds) => {
    if (!seconds) return '0s';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hrs}h ${mins}m ${secs}s`;
  };

  const formatMemory = (bytes) => {
    if (!bytes) return '0 MB';
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };

  return (
    <div className="terminal-layout">
      {/* 1. Admin Header */}
      <header className="terminal-header" style={{ borderColor: 'rgba(239, 68, 68, 0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            background: 'linear-gradient(135deg, #ef4444 0%, var(--accent-purple) 100%)',
            color: '#fff',
            borderRadius: '8px',
            width: '38px',
            height: '38px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
          }}>
            <Shield size={20} />
          </div>
          <span style={{ fontSize: '1.25rem', fontWeight: '700', fontFamily: 'var(--font-title)', letterSpacing: '0.03em' }}>
            PrimeTrade <span style={{ color: '#ef4444', fontWeight: '700' }}>Admin Node</span>
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <Link to="/dashboard" className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
            <ArrowLeft size={16} />
            Terminal Dashboard
          </Link>

          <button onClick={logout} className="btn btn-danger" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
            Logout
          </button>
        </div>
      </header>

      <main className="terminal-content">
        {/* Error notification */}
        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            color: '#f87171',
            borderRadius: '12px',
            padding: '1rem',
            marginBottom: '2rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
          }}>
            <AlertTriangle size={20} />
            <span>{error}</span>
          </div>
        )}

        {/* 2. Numerical Metrics Widgets */}
        {metrics && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1.5rem',
            marginBottom: '2.5rem',
          }}>
            <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <div style={{ padding: '0.75rem', borderRadius: '10px', background: 'rgba(56, 189, 248, 0.1)', color: 'var(--primary)' }}>
                <Users size={24} />
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '600', letterSpacing: '0.05em' }}>PLATFORM USERS</div>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', fontFamily: 'var(--font-title)', marginTop: '0.15rem' }}>
                  {metrics.totalUsers}
                </div>
              </div>
            </div>

            <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <div style={{ padding: '0.75rem', borderRadius: '10px', background: 'rgba(34, 197, 94, 0.1)', color: 'var(--buy-green)' }}>
                <Activity size={24} />
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '600', letterSpacing: '0.05em' }}>TRADING SIGNALS</div>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', fontFamily: 'var(--font-title)', marginTop: '0.15rem' }}>
                  {metrics.totalSignals} <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '400' }}>({metrics.openSignals} Active)</span>
                </div>
              </div>
            </div>

            <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <div style={{ padding: '0.75rem', borderRadius: '10px', background: 'rgba(139, 92, 246, 0.1)', color: 'var(--accent-purple)' }}>
                <FileText size={24} />
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '600', letterSpacing: '0.05em' }}>SYSTEM AUDIT LOGS</div>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', fontFamily: 'var(--font-title)', marginTop: '0.15rem' }}>
                  {metrics.totalLogs}
                </div>
              </div>
            </div>

            <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <div style={{ padding: '0.75rem', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.1)', color: '#f87171' }}>
                <Cpu size={24} />
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '600', letterSpacing: '0.05em' }}>SERVER HEALTH</div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: '600', marginTop: '0.15rem', display: 'flex', flexDirection: 'column' }}>
                  <span><Clock size={12} style={{ display: 'inline', marginRight: '4px' }} /> Uptime: {formatUptime(metrics.uptime)}</span>
                  <span><HardDrive size={12} style={{ display: 'inline', marginRight: '4px' }} /> Heap: {formatMemory(metrics.memoryUsage)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. Panel Container */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          
          {/* Tabs navigation */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '2rem',
            borderBottom: '1px solid var(--border-color)',
            paddingBottom: '1rem',
          }}>
            <div style={{ display: 'flex', gap: '1.5rem' }}>
              <button 
                onClick={() => setActiveTab('users')} 
                style={{
                  fontFamily: 'var(--font-title)',
                  fontSize: '1.1rem',
                  fontWeight: '700',
                  background: 'transparent',
                  border: 'none',
                  color: activeTab === 'users' ? 'var(--primary)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  paddingBottom: '1.1rem',
                  marginBottom: '-1.1rem',
                  borderBottom: activeTab === 'users' ? '2px solid var(--primary)' : 'none',
                  transition: 'var(--transition-smooth)',
                }}
              >
                Platform Users ({filteredUsers.length})
              </button>
              
              <button 
                onClick={() => setActiveTab('logs')} 
                style={{
                  fontFamily: 'var(--font-title)',
                  fontSize: '1.1rem',
                  fontWeight: '700',
                  background: 'transparent',
                  border: 'none',
                  color: activeTab === 'logs' ? '#ef4444' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  paddingBottom: '1.1rem',
                  marginBottom: '-1.1rem',
                  borderBottom: activeTab === 'logs' ? '2px solid #ef4444' : 'none',
                  transition: 'var(--transition-smooth)',
                }}
              >
                Security Audit Log Feed ({filteredLogs.length})
              </button>
            </div>

            <button onClick={fetchAdminData} className="btn btn-secondary" style={{ padding: '0.5rem', height: '36px', width: '36px' }} title="Sync Database">
              <RefreshCw size={16} />
            </button>
          </div>

          {/* Tab 1: Platform User Directory */}
          {activeTab === 'users' && (
            <div>
              {/* Search bar */}
              <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
                <Search size={18} style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                }} />
                <input
                  type="text"
                  className="form-input"
                  style={{ width: '100%', paddingLeft: '40px', height: '40px' }}
                  placeholder="Filter users by name or email address..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                />
              </div>

              {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 0', gap: '1rem' }}>
                  <Loader2 size={36} className="spinner" style={{ color: 'var(--primary)' }} />
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Retrieving terminal database...</p>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem 2rem', border: '1px dashed var(--border-color)', borderRadius: '12px' }}>
                  <Users size={32} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
                  <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>No registered users found</h3>
                </div>
              ) : (
                <div className="data-table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>USER ID (UUID)</th>
                        <th>NAME</th>
                        <th>EMAIL ADDRESS</th>
                        <th>ROLE STATUS</th>
                        <th>TERMINAL JOIN DATE</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map(usr => (
                        <tr key={usr.id}>
                          <td style={{ color: 'var(--text-muted)', fontFamily: 'monospace', fontSize: '0.8rem' }}>
                            {usr.id}
                          </td>
                          <td style={{ fontWeight: '600' }}>
                            {usr.name}
                          </td>
                          <td style={{ fontWeight: '500' }}>
                            {usr.email}
                          </td>
                          <td>
                            <span className={`badge ${usr.role === 'ADMIN' ? 'badge-buy' : 'badge-closed'}`} style={{
                              borderColor: usr.role === 'ADMIN' ? 'rgba(34, 197, 94, 0.4)' : 'var(--border-color)'
                            }}>
                              {usr.role}
                            </span>
                          </td>
                          <td style={{ color: 'var(--text-secondary)' }}>
                            {new Date(usr.createdAt).toLocaleDateString()} {new Date(usr.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Platform Audit Logs Feed */}
          {activeTab === 'logs' && (
            <div>
              {/* Search bar */}
              <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
                <Search size={18} style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                }} />
                <input
                  type="text"
                  className="form-input"
                  style={{ width: '100%', paddingLeft: '40px', height: '40px' }}
                  placeholder="Filter logs by action type, target entity, or user email (e.g. USER_LOGIN, Signal)..."
                  value={logSearch}
                  onChange={(e) => setLogSearch(e.target.value)}
                />
              </div>

              {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 0', gap: '1rem' }}>
                  <Loader2 size={36} className="spinner" style={{ color: 'var(--primary)' }} />
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Retrieving terminal database...</p>
                </div>
              ) : filteredLogs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem 2rem', border: '1px dashed var(--border-color)', borderRadius: '12px' }}>
                  <FileText size={32} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
                  <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>No audit events found</h3>
                </div>
              ) : (
                <div className="data-table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>TIMESTAMP</th>
                        <th>OPERATOR USER</th>
                        <th>ACTION TRIGGER</th>
                        <th>TARGET ENTITY</th>
                        <th>ENTITY UUID (ID)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLogs.map(log => {
                        let actionColor = 'var(--text-primary)';
                        if (log.action.includes('CREATED') || log.action.includes('REGISTERED')) actionColor = 'var(--buy-green)';
                        else if (log.action.includes('DELETED')) actionColor = 'var(--sell-red)';
                        else if (log.action.includes('LOGIN')) actionColor = 'var(--primary)';

                        return (
                          <tr key={log.id}>
                            <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                              {new Date(log.timestamp).toLocaleDateString()} {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </td>
                            <td>
                              <div>
                                <span style={{ fontWeight: '600' }}>{log.user?.name}</span>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>{log.user?.email}</span>
                              </div>
                            </td>
                            <td style={{ fontFamily: 'monospace', fontWeight: '700', color: actionColor, fontSize: '0.85rem' }}>
                              {log.action}
                            </td>
                            <td style={{ fontSize: '0.85rem', fontWeight: '500' }}>
                              {log.entity}
                            </td>
                            <td style={{ color: 'var(--text-muted)', fontFamily: 'monospace', fontSize: '0.8rem' }}>
                              {log.entityId}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
