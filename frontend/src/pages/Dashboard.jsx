import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { 
  TrendingUp, Plus, Edit2, Trash2, LogOut, Shield, 
  Search, SlidersHorizontal, RefreshCw, X, AlertTriangle, 
  CheckCircle, HelpCircle, Activity, Globe, DollarSign
} from 'lucide-react';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const { user, logout, isAdmin } = useAuth();
  const [signals, setSignals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Ticker State
  const [tickers, setTickers] = useState({
    BTC: { price: 68432.12, change: 'up' },
    ETH: { price: 3820.50, change: 'down' },
    SOL: { price: 165.75, change: 'up' },
    BNB: { price: 590.20, change: 'flat' }
  });

  // Filter & Search State
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');

  // Form Modal/Drawer State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentSignalId, setCurrentSignalId] = useState(null);
  const [form, setForm] = useState({
    assetSymbol: '',
    signalType: 'BUY',
    entryPrice: '',
    targetPrice: '',
    stopLoss: '',
    status: 'OPEN',
    notes: ''
  });
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  // Load signals and tickers on mount
  useEffect(() => {
    fetchSignals();
    fetchLivePrices();

    // Poll live prices every 20 seconds
    const interval = setInterval(fetchLivePrices, 20000);
    return () => clearInterval(interval);
  }, []);

  const fetchSignals = async () => {
    try {
      setLoading(true);
      const response = await api.get('/signals');
      setSignals(response.data.data.signals);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to retrieve trading signals.');
    } finally {
      setLoading(false);
    }
  };

  const fetchLivePrices = async () => {
    const symbols = ['BTC', 'ETH', 'SOL', 'BNB'];
    for (const sym of symbols) {
      try {
        const response = await api.get(`/market/price/${sym}`);
        const newPrice = response.data.data.price;
        
        setTickers(prev => {
          const oldPrice = prev[sym]?.price || newPrice;
          let change = 'flat';
          if (newPrice > oldPrice) change = 'up';
          else if (newPrice < oldPrice) change = 'down';
          
          return {
            ...prev,
            [sym]: { price: newPrice, change }
          };
        });
      } catch (err) {
        console.warn(`Price check failed for ticker ${sym}:`, err.message);
      }
    }
  };

  // Open modal for signal creation
  const handleCreateOpen = () => {
    setForm({
      assetSymbol: '',
      signalType: 'BUY',
      entryPrice: '',
      targetPrice: '',
      stopLoss: '',
      status: 'OPEN',
      notes: ''
    });
    setFormError('');
    setIsEditing(false);
    setIsModalOpen(true);
  };

  // Open modal for signal update
  const handleEditOpen = (signal) => {
    setForm({
      assetSymbol: signal.assetSymbol,
      signalType: signal.signalType,
      entryPrice: signal.entryPrice.toString(),
      targetPrice: signal.targetPrice.toString(),
      stopLoss: signal.stopLoss.toString(),
      status: signal.status,
      notes: signal.notes || ''
    });
    setFormError('');
    setCurrentSignalId(signal.id);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  // Submit Signal Form (Create or Edit)
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);

    // Client-side validations
    if (!form.assetSymbol || !form.entryPrice || !form.targetPrice || !form.stopLoss) {
      setFormError('Please fill in all required fields.');
      setFormLoading(false);
      return;
    }

    const entry = parseFloat(form.entryPrice);
    const target = parseFloat(form.targetPrice);
    const stop = parseFloat(form.stopLoss);

    if (isNaN(entry) || entry <= 0 || isNaN(target) || target <= 0 || isNaN(stop) || stop <= 0) {
      setFormError('Prices must be positive numbers.');
      setFormLoading(false);
      return;
    }

    try {
      const payload = {
        assetSymbol: form.assetSymbol.toUpperCase().trim(),
        signalType: form.signalType,
        entryPrice: entry,
        targetPrice: target,
        stopLoss: stop,
        status: form.status,
        notes: form.notes
      };

      if (isEditing) {
        await api.put(`/signals/${currentSignalId}`, payload);
        setSuccess('Signal updated successfully.');
      } else {
        await api.post('/signals', payload);
        setSuccess('Signal created successfully.');
      }

      setIsModalOpen(false);
      fetchSignals();
      
      // Auto clear success banner
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setFormError(err.response?.data?.message || err.response?.data?.errors?.[0]?.message || 'Failed to submit signal.');
    } finally {
      setFormLoading(false);
    }
  };

  // Delete Signal Action
  const handleDeleteSignal = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this trading signal?')) {
      return;
    }

    try {
      await api.delete(`/signals/${id}`);
      setSuccess('Signal deleted successfully.');
      fetchSignals();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete signal.');
    }
  };

  // Filter signals list
  const filteredSignals = signals.filter(sig => {
    const matchesSearch = sig.assetSymbol.toUpperCase().includes(search.toUpperCase());
    const matchesStatus = statusFilter === 'ALL' || sig.status === statusFilter;
    const matchesType = typeFilter === 'ALL' || sig.signalType === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  return (
    <div className="terminal-layout">
      {/* 1. Header Terminal Navigation */}
      <header className="terminal-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent-purple) 100%)',
            color: '#fff',
            borderRadius: '8px',
            width: '38px',
            height: '38px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px var(--primary-glow)',
          }}>
            <TrendingUp size={20} />
          </div>
          <span style={{ fontSize: '1.25rem', fontWeight: '700', fontFamily: 'var(--font-title)', letterSpacing: '0.03em' }}>
            PrimeTrade <span style={{ color: 'var(--primary)', fontWeight: '400' }}>SignalHub</span>
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ textAlign: 'right', display: 'none', sm: 'block' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-primary)' }}>{user?.name}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user?.email} ({user?.role})</div>
          </div>
          
          {isAdmin && (
            <Link to="/admin" className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
              <Shield size={16} style={{ color: 'var(--primary)' }} />
              Admin Portal
            </Link>
          )}

          <button onClick={logout} className="btn btn-danger" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </header>

      <main className="terminal-content">
        
        {/* 2. Resilient Real-Time Crypto Price Ticker Panel */}
        <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem', letterSpacing: '0.05em' }}>
            <Activity size={16} style={{ color: 'var(--primary)' }} />
            LIVE MARKET DATA FEED (20S UPDATE)
          </h2>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <Globe size={12} /> USD Markets
          </span>
        </div>
        
        <div className="ticker-row">
          {Object.entries(tickers).map(([sym, data]) => (
            <div key={sym} className="glass-card ticker-card" style={{
              borderLeft: `3px solid ${
                data.change === 'up' ? 'var(--buy-green)' : 
                data.change === 'down' ? 'var(--sell-red)' : 'var(--border-color)'
              }`
            }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '600', letterSpacing: '0.05em' }}>{sym}/USDT</div>
                <div style={{ fontSize: '1.25rem', fontWeight: '700', fontFamily: 'var(--font-title)', marginTop: '0.15rem' }}>
                  ${data.price.toLocaleString()}
                </div>
              </div>
              <span className={`badge ${data.change === 'up' ? 'badge-buy' : data.change === 'down' ? 'badge-sell' : 'badge-closed'}`} style={{ fontSize: '0.7rem' }}>
                {data.change === 'up' ? '▲ GAIN' : data.change === 'down' ? '▼ LOSS' : '■ LIVE'}
              </span>
            </div>
          ))}
        </div>

        {/* 3. Alerts notifications */}
        {success && (
          <div style={{
            background: 'rgba(34, 197, 94, 0.1)',
            border: '1px solid rgba(34, 197, 94, 0.25)',
            color: 'var(--buy-green)',
            borderRadius: '12px',
            padding: '1rem',
            marginBottom: '2rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
          }}>
            <CheckCircle size={20} />
            <span>{success}</span>
          </div>
        )}

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

        {/* 4. Signals management panel controls */}
        <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            md: 'row',
            justifyContent: 'space-between',
            alignItems: 'stretch',
            md: 'alignItems: center',
            gap: '1.5rem',
            marginBottom: '2rem',
          }}>
            <div>
              <h2 style={{ fontSize: '1.5rem', fontFamily: 'var(--font-title)', marginBottom: '0.25rem' }}>
                Trading Signals Node
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                Manage and execute your active cryptocurrency trading signals
              </p>
            </div>

            <button onClick={handleCreateOpen} className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>
              <Plus size={18} />
              Generate Signal
            </button>
          </div>

          {/* Filtering row */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '1rem',
            alignItems: 'center',
            marginBottom: '1.5rem',
            paddingBottom: '1.5rem',
            borderBottom: '1px solid var(--border-color)',
          }}>
            <div style={{ position: 'relative', flex: '1', minWidth: '250px' }}>
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
                placeholder="Search symbol (e.g. BTC, ETH)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>STATUS</span>
                <select
                  className="form-select"
                  style={{ height: '40px', padding: '0.25rem 2rem 0.25rem 1rem' }}
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="ALL">ALL STATUSES</option>
                  <option value="OPEN">OPEN ONLY</option>
                  <option value="CLOSED">CLOSED ONLY</option>
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>ACTION</span>
                <select
                  className="form-select"
                  style={{ height: '40px', padding: '0.25rem 2rem 0.25rem 1rem' }}
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                >
                  <option value="ALL">ALL TYPES</option>
                  <option value="BUY">BUY SIGNALS</option>
                  <option value="SELL">SELL SIGNALS</option>
                </select>
              </div>

              <button onClick={() => { setSearch(''); setStatusFilter('ALL'); setTypeFilter('ALL'); fetchSignals(); }} className="btn btn-secondary" style={{ padding: '0.5rem', height: '40px', width: '40px' }} title="Reset and Sync">
                <RefreshCw size={16} />
              </button>
            </div>
          </div>

          {/* Signals Table */}
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 0', gap: '1rem' }}>
              <Loader2 size={36} className="spinner" style={{ color: 'var(--primary)' }} />
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Retrieving terminal database...</p>
            </div>
          ) : filteredSignals.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 2rem', border: '1px dashed var(--border-color)', borderRadius: '12px', background: 'rgba(22, 31, 54, 0.1)' }}>
              <SlidersHorizontal size={40} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
              <h3 style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>No signals match filter</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                Generate your first signal to begin receiving alerts.
              </p>
              <button onClick={handleCreateOpen} className="btn btn-primary">
                <Plus size={16} /> Create Trading Signal
              </button>
            </div>
          ) : (
            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ASSET</th>
                    <th>TYPE</th>
                    <th>ENTRY PRICE</th>
                    <th>TARGET</th>
                    <th>STOP LOSS</th>
                    <th>STATUS</th>
                    <th style={{ minWidth: '200px' }}>NOTES</th>
                    <th>CREATED AT</th>
                    <th>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSignals.map(sig => (
                    <tr key={sig.id}>
                      <td style={{ fontWeight: '700', fontFamily: 'var(--font-title)' }}>
                        {sig.assetSymbol}
                      </td>
                      <td>
                        <span className={`badge ${sig.signalType === 'BUY' ? 'badge-buy' : 'badge-sell'}`}>
                          {sig.signalType}
                        </span>
                      </td>
                      <td style={{ fontFamily: 'var(--font-title)', fontWeight: '600' }}>
                        ${sig.entryPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ fontFamily: 'var(--font-title)', fontWeight: '600', color: 'var(--buy-green)' }}>
                        ${sig.targetPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ fontFamily: 'var(--font-title)', fontWeight: '600', color: 'var(--sell-red)' }}>
                        ${sig.stopLoss.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td>
                        <span className={`badge ${sig.status === 'OPEN' ? 'badge-open' : 'badge-closed'}`}>
                          {sig.status}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                        {sig.notes || <span style={{ color: 'var(--text-muted)' }}>No additional parameters provided</span>}
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                        {new Date(sig.createdAt).toLocaleDateString()} {new Date(sig.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button onClick={() => handleEditOpen(sig)} className="btn btn-secondary" style={{ padding: '0.4rem', borderRadius: '6px' }} title="Modify">
                            <Edit2 size={14} />
                          </button>
                          <button onClick={() => handleDeleteSignal(sig.id)} className="btn btn-danger" style={{ padding: '0.4rem', borderRadius: '6px', background: 'transparent' }} title="Terminate">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        {/* Mock visual analytics card using custom SVG */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-title)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Activity size={18} style={{ color: 'var(--primary)' }} />
            PLATFORM ANALYTICS ENGINE
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', md: '2fr 1fr', gap: '2rem', alignItems: 'center' }}>
            {/* SVG line chart */}
            <div style={{ height: '180px', background: 'rgba(7, 10, 19, 0.4)', borderRadius: '12px', border: '1px solid var(--border-color)', position: 'relative', overflow: 'hidden', padding: '1rem' }}>
              <div style={{ position: 'absolute', top: '10px', left: '10px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Terminal Signal Mock chart</div>
              <svg viewBox="0 0 500 100" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                <defs>
                  <linearGradient id="glowGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.2"/>
                    <stop offset="100%" stopColor="var(--primary)" stopOpacity="0"/>
                  </linearGradient>
                </defs>
                <path d="M 0 80 Q 80 20 160 60 T 320 30 T 480 70 L 500 70 L 500 100 L 0 100 Z" fill="url(#glowGrad)" />
                <path d="M 0 80 Q 80 20 160 60 T 320 30 T 480 70" fill="none" stroke="var(--primary)" strokeWidth="2" />
                <circle cx="160" cy="60" r="3" fill="var(--accent-purple)" />
                <circle cx="320" cy="30" r="3" fill="var(--buy-green)" />
              </svg>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>AVERAGE TARGET REACH RATE</div>
                <div style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--buy-green)', fontFamily: 'var(--font-title)' }}>84.3%</div>
              </div>
              <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>INTELLIGENT RISK REWARD RATIO</div>
                <div style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--primary)', fontFamily: 'var(--font-title)' }}>1 : 2.5</div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* 5. Create / Edit Signal Sliding Modal Panel overlay */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(5, 7, 13, 0.8)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 200,
          padding: '1rem',
        }}>
          <div className="glass-panel" style={{
            maxWidth: '500px',
            width: '100%',
            padding: '2rem',
            position: 'relative',
          }}>
            <button onClick={() => setIsModalOpen(false)} style={{
              position: 'absolute',
              top: '1.5rem',
              right: '1.5rem',
              background: 'transparent',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
            }}>
              <X size={20} />
            </button>

            <h2 style={{ fontSize: '1.5rem', fontFamily: 'var(--font-title)', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <TrendingUp size={22} style={{ color: 'var(--primary)' }} />
              {isEditing ? 'Modify Signal Node' : 'Generate Signal Node'}
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              Specify the trading configurations to write into the database.
            </p>

            {formError && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                color: '#f87171',
                borderRadius: '8px',
                padding: '0.75rem 1rem',
                marginBottom: '1.5rem',
                fontSize: '0.875rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}>
                <AlertTriangle size={16} />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleFormSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">ASSET SYMBOL *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="BTC"
                    value={form.assetSymbol}
                    onChange={(e) => setForm(prev => ({ ...prev, assetSymbol: e.target.value.toUpperCase() }))}
                    disabled={isEditing} // Prevent modifying symbol during edits
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">SIGNAL TYPE *</label>
                  <select
                    className="form-select"
                    value={form.signalType}
                    onChange={(e) => setForm(prev => ({ ...prev, signalType: e.target.value }))}
                  >
                    <option value="BUY">BUY (LONG)</option>
                    <option value="SELL">SELL (SHORT)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginTop: '0.5rem' }}>
                <div className="form-group">
                  <label className="form-label">ENTRY PRICE *</label>
                  <input
                    type="number"
                    step="any"
                    className="form-input"
                    placeholder="65000"
                    value={form.entryPrice}
                    onChange={(e) => setForm(prev => ({ ...prev, entryPrice: e.target.value }))}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">TARGET PRICE *</label>
                  <input
                    type="number"
                    step="any"
                    className="form-input"
                    placeholder="70000"
                    value={form.targetPrice}
                    onChange={(e) => setForm(prev => ({ ...prev, targetPrice: e.target.value }))}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">STOP LOSS *</label>
                  <input
                    type="number"
                    step="any"
                    className="form-input"
                    placeholder="63000"
                    value={form.stopLoss}
                    onChange={(e) => setForm(prev => ({ ...prev, stopLoss: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginTop: '0.5rem' }}>
                <label className="form-label">SIGNAL STATUS</label>
                <select
                  className="form-select"
                  value={form.status}
                  onChange={(e) => setForm(prev => ({ ...prev, status: e.target.value }))}
                >
                  <option value="OPEN">OPEN (ACTIVE MONITOR)</option>
                  <option value="CLOSED">CLOSED (INACTIVE)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">ADDITIONAL NOTES (OPTIONAL)</label>
                <textarea
                  className="form-input"
                  style={{ height: '80px', resize: 'none' }}
                  placeholder="Notes on key supports, EMA crossovers, risk limits..."
                  value={form.notes}
                  onChange={(e) => setForm(prev => ({ ...prev, notes: e.target.value }))}
                />
              </div>

              <div style={{ display: 'flex', justifySelf: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={formLoading}>
                  {formLoading ? (
                    <>
                      <Loader2 size={16} className="spinner" />
                      Synchronizing...
                    </>
                  ) : (
                    isEditing ? 'Save Changes' : 'Write Signal'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
