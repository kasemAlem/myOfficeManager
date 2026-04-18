'use client';

import { useEffect, useState } from 'react';
import { 
  PiggyBank, TrendingUp, Clock, 
  Target, Plus, ArrowUpRight, ArrowDownRight, 
  Wallet, X, BarChart3
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, 
  CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend
} from 'recharts';

export default function FinancialsPage() {
  const [view, setView] = useState('monthly');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showTargetModal, setShowTargetModal] = useState(false);
  const [activeTab, setActiveTab] = useState('audit'); // audit, trends
  const [filterType, setFilterType] = useState<string | null>(null);

  // Date selection state
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  
  // Forms
  const [newExpense, setNewExpense] = useState({ category: 'Software', amount: '', vendor: '', notes: '', date: now.toISOString().split('T')[0] });
  const [newTarget, setNewTarget] = useState({ year: now.getFullYear(), amount: '' });

  const fetchStats = async () => {
    setLoading(true);
    const params = new URLSearchParams({
      view,
      month: selectedMonth.toString(),
      year: selectedYear.toString()
    });
    const res = await fetch(`/api/financials?${params.toString()}`);
    if (res.ok) setData(await res.json());
    setLoading(false);
  };

  useEffect(() => {
    fetchStats();
  }, [view, selectedMonth, selectedYear]);

  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/financials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'EXPENSE', ...newExpense })
    });
    if (res.ok) {
      setShowExpenseModal(false);
      setNewExpense({ category: 'Software', amount: '', vendor: '', notes: '', date: new Date().toISOString().split('T')[0] });
      fetchStats();
    }
  };

  const handleSaveTarget = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/financials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'TARGET', ...newTarget })
    });
    if (res.ok) {
      setShowTargetModal(false);
      fetchStats();
    }
  };

  if (loading && !data) return <div style={{ padding: '2rem', color: 'var(--text-secondary)' }}>Loading business financials...</div>;

  const { summary, transactions, targetValue } = data || { summary: { income: 0, expenses: 0, netProfit: 0, target: 0, progress: 0 }, transactions: [], targetValue: 0 };

  return (
    <div style={{ padding: '2.5rem', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      {/* Header & View Switcher */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="architect-heading text-gradient" style={{ fontSize: '2.5rem', margin: 0, letterSpacing: '-0.04em' }}>Business Financials</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', fontSize: '1rem' }}>High-fidelity revenue oversight and profit optimization.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(255,255,255,0.05)', padding: '0.4rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
            {view === 'monthly' && (
              <select 
                value={selectedMonth} 
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                style={{ background: 'transparent', color: 'var(--text-primary)', border: 'none', padding: '0.4rem 0.6rem', outline: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}
              >
                {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m, i) => (
                  <option key={m} value={i+1} style={{ background: 'var(--bg-surface)' }}>{m}</option>
                ))}
              </select>
            )}
            <select 
              value={selectedYear} 
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              style={{ background: 'transparent', color: 'var(--text-primary)', border: 'none', padding: '0.4rem 0.6rem', outline: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, borderLeft: view === 'monthly' ? '1px solid var(--border-color)' : 'none' }}
            >
              {[2024, 2025, 2026, 2027, 2028, 2029, 2030].map(y => (
                <option key={y} value={y} style={{ background: 'var(--bg-surface)' }}>{y}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', background: 'rgba(255,255,255,0.05)', padding: '0.4rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
            {['monthly', 'quarterly', 'yearly'].map(v => (
              <button 
                key={v}
                onClick={() => setView(v)}
                style={{ 
                  padding: '0.6rem 1.25rem', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600,
                  background: view === v ? 'var(--accent-primary)' : 'transparent',
                  color: view === v ? 'white' : 'var(--text-secondary)',
                  transition: 'all 0.2s ease'
                }}
              >
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Target Progress Bar */}
      {summary.target > 0 && (
        <div className="glass-panel" style={{ padding: '2rem', background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ background: 'var(--accent-primary)', padding: '0.75rem', borderRadius: '12px', color: 'white', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)' }}>
                <Target size={20} />
              </div>
              <div>
                <span style={{ fontWeight: 800, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', display: 'block' }}>Revenue Performance</span>
                <span style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)' }}>{view.charAt(0).toUpperCase() + view.slice(1)} Firm Goal</span>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                ₪{summary.income.toLocaleString()} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 400 }}>/ ₪{summary.target.toLocaleString()}</span>
              </span>
              <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-primary)', marginTop: '0.2rem' }}>
                {Math.round(summary.progress)}% ACHIEVED
              </span>
            </div>
          </div>
          <div style={{ width: '100%', height: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', overflow: 'hidden' }}>
            <div style={{ 
              width: `${Math.min(summary.progress, 100)}%`, 
              height: '100%', 
              background: 'linear-gradient(90deg, var(--accent-primary) 0%, #34d399 100%)', 
              boxShadow: '0 0 20px rgba(16, 185, 129, 0.4)',
              transition: 'width 1.5s cubic-bezier(0.16, 1, 0.3, 1)' 
            }} />
          </div>
        </div>
      )}

      {/* Tab Switcher */}
      <div style={{ display: 'flex', gap: '2rem', borderBottom: '1px solid var(--border-color)', marginBottom: '2.5rem', paddingBottom: '0.5rem' }}>
        <button 
          onClick={() => setActiveTab('audit')}
          style={{ 
            display: 'flex', alignItems: 'center', gap: '0.6rem',
            background: 'none', border: 'none', color: activeTab === 'audit' ? 'var(--accent-primary)' : 'var(--text-secondary)',
            fontSize: '1rem', fontWeight: 600, cursor: 'pointer', paddingBottom: '0.75rem', position: 'relative',
            transition: 'all 0.2s ease'
          }}
        >
          <Clock size={18} />
          Financial Audit
          {activeTab === 'audit' && <div style={{ position: 'absolute', bottom: -1, left: 0, right: 0, height: '2px', background: 'var(--accent-primary)' }} />}
        </button>
        <button 
          onClick={() => setActiveTab('trends')}
          style={{ 
            display: 'flex', alignItems: 'center', gap: '0.6rem',
            background: 'none', border: 'none', color: activeTab === 'trends' ? 'var(--accent-primary)' : 'var(--text-secondary)',
            fontSize: '1rem', fontWeight: 600, cursor: 'pointer', paddingBottom: '0.75rem', position: 'relative',
            transition: 'all 0.2s ease'
          }}
        >
          <TrendingUp size={18} />
          Performance Trends
          {activeTab === 'trends' && <div style={{ position: 'absolute', bottom: -1, left: 0, right: 0, height: '2px', background: 'var(--accent-primary)' }} />}
        </button>
      </div>

      {activeTab === 'audit' ? (
        <>
          {/* Metrics Grid */}
          <div className="bento-grid">
            <div className="glass-panel transition-standard" onClick={() => setFilterType(filterType === 'INCOME' ? null : 'INCOME')} style={{ 
              padding: '2rem', 
              background: filterType === 'INCOME' ? 'rgba(52, 211, 153, 0.1)' : 'rgba(52, 211, 153, 0.03)', 
              borderTopColor: filterType === 'INCOME' ? 'var(--accent-success)' : 'var(--border-color)',
              borderRightColor: filterType === 'INCOME' ? 'var(--accent-success)' : 'var(--border-color)',
              borderBottomColor: filterType === 'INCOME' ? 'var(--accent-success)' : 'var(--border-color)',
              borderLeft: '4px solid var(--accent-success)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              cursor: 'pointer'
            }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                 <span style={{ color: filterType === 'INCOME' ? 'var(--text-primary)' : 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Gross Revenue</span>
                 <div style={{ background: 'rgba(52, 211, 153, 0.1)', padding: '0.5rem', borderRadius: '8px' }}>
                  <ArrowUpRight size={18} color="var(--accent-success)" />
                 </div>
               </div>
               <p className="architect-heading" style={{ fontSize: '2.5rem', margin: 0, letterSpacing: '-0.02em' }}>₪{summary.income?.toLocaleString()}</p>
            </div>

            <div className="glass-panel transition-standard" onClick={() => setFilterType(filterType === 'EXPENSE' ? null : 'EXPENSE')} style={{ 
              padding: '2rem', 
              background: filterType === 'EXPENSE' ? 'rgba(248, 113, 113, 0.1)' : 'rgba(248, 113, 113, 0.03)', 
              borderTopColor: filterType === 'EXPENSE' ? 'var(--accent-danger)' : 'var(--border-color)',
              borderRightColor: filterType === 'EXPENSE' ? 'var(--accent-danger)' : 'var(--border-color)',
              borderBottomColor: filterType === 'EXPENSE' ? 'var(--accent-danger)' : 'var(--border-color)',
              borderLeft: '4px solid var(--accent-danger)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              cursor: 'pointer'
            }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                 <span style={{ color: filterType === 'EXPENSE' ? 'var(--text-primary)' : 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Operational Spend</span>
                 <div style={{ background: 'rgba(248, 113, 113, 0.1)', padding: '0.5rem', borderRadius: '8px' }}>
                  <ArrowDownRight size={18} color="var(--accent-danger)" />
                 </div>
               </div>
               <p className="architect-heading" style={{ fontSize: '2.5rem', margin: 0, letterSpacing: '-0.02em' }}>₪{summary.expenses?.toLocaleString()}</p>
            </div>

            <div className="glass-panel transition-standard" style={{ 
              padding: '2rem', 
              background: 'rgba(16, 185, 129, 0.05)', 
              borderLeft: '4px solid var(--accent-primary)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                 <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Net Yield</span>
                 <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '0.5rem', borderRadius: '8px' }}>
                  <Wallet size={18} color="var(--accent-primary)" />
                 </div>
               </div>
               <p className="architect-heading" style={{ 
                 fontSize: '2.5rem', 
                 margin: 0, 
                 letterSpacing: '-0.02em',
                 color: summary.netProfit >= 0 ? 'var(--text-primary)' : 'var(--accent-danger)' 
               }}>
                 ₪{summary.netProfit?.toLocaleString()}
               </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '2.5rem' }}>
            <button onClick={() => setShowExpenseModal(true)} style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.25rem',
              background: 'var(--accent-primary)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600
            }}>
              <Plus size={18} /> Log Business Expense
            </button>
            <button onClick={() => { setNewTarget({ ...newTarget, amount: targetValue.toString() }); setShowTargetModal(true); }} style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.25rem',
              background: 'transparent', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer', fontWeight: 600
            }}>
              <Target size={18} /> Set Annual Target
            </button>
          </div>

          {/* Transaction Ledger */}
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h2 className="architect-heading" style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Clock size={24} color="var(--text-muted)" /> Financial Activity Ledger
              </h2>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 500 }}>
                {transactions.length} entries recorded
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {(filterType ? transactions.filter((t: any) => t.type === filterType) : transactions).length === 0 ? (
                <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px dashed var(--border-color)' }}>
                  No historical {filterType ? filterType.toLowerCase() + ' ' : ''}entries detected for selected parameters.
                </div>
              ) : (
                (filterType ? transactions.filter((t: any) => t.type === filterType) : transactions).map((t: any, idx: number) => (
                  <div key={idx} className="transition-standard" style={{ 
                    display: 'grid', 
                    gridTemplateColumns: '100px 120px 1fr 120px 160px', 
                    alignItems: 'center', 
                    padding: '1.25rem 1.5rem', 
                    background: 'rgba(255, 255, 255, 0.02)', 
                    borderRadius: '14px',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                  }}>
                    <div>
                      <span style={{ 
                        padding: '0.35rem 0.75rem', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 800,
                        letterSpacing: '0.05em',
                        background: t.type === 'INCOME' ? 'rgba(52, 211, 153, 0.1)' : 'rgba(248, 113, 113, 0.1)',
                        color: t.type === 'INCOME' ? 'var(--accent-success)' : 'var(--accent-danger)',
                        border: `1px solid ${t.type === 'INCOME' ? 'rgba(52, 211, 153, 0.2)' : 'rgba(248, 113, 113, 0.2)'}`
                      }}>
                        {t.type}
                      </span>
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 500 }}>
                      {new Date(t.date).toLocaleDateString()}
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>
                      {t.reference || t.category}
                      <span style={{ display: 'block', fontWeight: 400, fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                        {t.notes || 'Structural transaction'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', fontWeight: 700 }}>
                        {t.createdBy?.[0] || 'S'}
                      </div>
                      {t.createdBy || 'System'}
                    </div>
                    <div style={{ fontWeight: 800, textAlign: 'right', fontSize: '1.1rem', color: t.type === 'INCOME' ? 'var(--accent-success)' : 'var(--accent-danger)' }}>
                      {t.type === 'INCOME' ? '+' : '-'} ₪{t.amount.toLocaleString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      ) : (
        /* Trend Chart Tab */
        <div className="glass-panel" style={{ background: 'var(--bg-surface)', padding: '1.5rem', minHeight: '500px' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '2.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <BarChart3 size={20} color="var(--accent-primary)" /> Revenue Growth Trends
          </h2>
          <div style={{ height: '400px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.chartData || []}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent-success)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--accent-success)" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent-danger)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--accent-danger)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis 
                  stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} 
                  tickFormatter={(v) => `₪${v >= 1000 ? (v/1000) + 'k' : v}`}
                />
                <Tooltip 
                  contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '8px' }}
                  itemStyle={{ fontSize: '0.85rem' }}
                  formatter={(v: any) => [`₪${v.toLocaleString()}`, '']}
                />
                <Area type="monotone" dataKey="income" name="Income" stroke="var(--accent-success)" fillOpacity={1} fill="url(#colorIncome)" strokeWidth={2} />
                <Area type="monotone" dataKey="expense" name="Expense" stroke="var(--accent-danger)" fillOpacity={1} fill="url(#colorExpense)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div style={{ marginTop: '2rem', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            💡 This chart visualizes your firm's volume of transactions. Use the filters at the top to toggle between daily, quarterly, or yearly performance.
          </div>
        </div>
      )}

      {/* Expense Modal */}
      {showExpenseModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass-panel transition-standard" style={{ width: '480px', padding: '2.5rem', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h2 className="architect-heading" style={{ margin: 0, fontSize: '1.75rem' }}>Log Expense</h2>
              <X cursor="pointer" onClick={() => setShowExpenseModal(false)} color="var(--text-muted)" />
            </div>
            <form onSubmit={handleSaveExpense} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>Categorization</label>
                <select 
                  value={newExpense.category} 
                  onChange={e => setNewExpense({...newExpense, category: e.target.value})}
                  className="transition-standard"
                  style={inputStyle}
                >
                  {['Software', 'Rent', 'Payroll', 'Marketing', 'Supplies', 'Consultants', 'Travel'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>Amount (₪)</label>
                  <input type="number" required placeholder="0.00" value={newExpense.amount} onChange={e => setNewExpense({...newExpense, amount: e.target.value})} style={inputStyle} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                   <label style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>Service Date</label>
                  <input type="date" required value={newExpense.date} onChange={e => setNewExpense({...newExpense, date: e.target.value})} style={inputStyle} />
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>Vendor / Provider</label>
                <input placeholder="Search or type vendor name..." value={newExpense.vendor} onChange={e => setNewExpense({...newExpense, vendor: e.target.value})} style={inputStyle} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>Expenditure Notes</label>
                <textarea placeholder="Line item details..." value={newExpense.notes} onChange={e => setNewExpense({...newExpense, notes: e.target.value})} style={{ ...inputStyle, minHeight: '100px', paddingTop: '0.75rem' }} />
              </div>
              <button style={{ 
                padding: '1.15rem', 
                background: 'var(--accent-primary)', 
                color: 'white', 
                border: 'none', 
                borderRadius: '14px', 
                cursor: 'pointer', 
                fontWeight: 700, 
                fontSize: '1rem',
                marginTop: '1.5rem',
                boxShadow: '0 4px 14px 0 rgba(16, 185, 129, 0.3)'
              }}>Finalize Expenditure</button>
            </form>
          </div>
        </div>
      )}

      {/* Target Modal */}
      {showTargetModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass-panel transition-standard" style={{ width: '480px', padding: '2.5rem', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 className="architect-heading" style={{ margin: 0, fontSize: '1.75rem' }}>Revenue Target</h2>
              <X cursor="pointer" onClick={() => setShowTargetModal(false)} color="var(--text-muted)" />
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '2.5rem', lineHeight: 1.6 }}>Set your firm's annual high-water mark for fiscal year {newTarget.year}. Optimization targets will be distributed across all business quarters.</p>
            <form onSubmit={handleSaveTarget} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', background: 'rgba(255,255,255,0.03)', padding: '1.25rem', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <span className="architect-heading" style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-primary)' }}>₪</span>
                <input 
                  type="number" required placeholder="0.00" 
                  value={newTarget.amount} 
                  onChange={e => setNewTarget({...newTarget, amount: e.target.value})} 
                  className="architect-heading"
                  style={{ background: 'transparent', border: 'none', color: 'var(--custom-input-color, white)', fontSize: '2rem', width: '100%', outline: 'none', letterSpacing: '-0.02em' }}
                />
              </div>
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.25rem', borderRadius: '12px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Quarterly Benchmark</span>
                  <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>₪{(Number(newTarget.amount) / 4).toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Monthly Threshold</span>
                  <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>₪{(Number(newTarget.amount) / 12).toLocaleString()}</span>
                </div>
              </div>
              <button style={{ 
                padding: '1.15rem', 
                background: 'var(--accent-primary)', 
                color: 'white', 
                border: 'none', 
                borderRadius: '14px', 
                cursor: 'pointer', 
                fontWeight: 700, 
                fontSize: '1rem',
                boxShadow: '0 4px 14px 0 rgba(16, 185, 129, 0.3)'
              }}>Authorize Annual Strategy</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const inputStyle = {
  padding: '1rem 1.25rem',
  borderRadius: '12px',
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.1)',
  color: 'var(--custom-input-color, white)',
  width: '100%',
  boxSizing: 'border-box' as const,
  outline: 'none',
  fontSize: '0.95rem'
};
