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
import { useToastContext } from '@/components/ToastProvider';
import { Modal } from '@/components/Modal';
import { Skeleton } from '@/components/Skeleton';
import { EmptyState } from '@/components/EmptyState';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Spinner } from '@/components/Spinner';
import { AnimatedCounter } from '@/components/AnimatedCounter';
import { formatCurrency, getCurrencySymbol } from '@/lib/formatCurrency';

const currency = getCurrencySymbol();

export default function FinancialsPage() {
  const [view, setView] = useState('monthly');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showTargetModal, setShowTargetModal] = useState(false);
  const [activeTab, setActiveTab] = useState('audit'); // audit, trends
  const [filterType, setFilterType] = useState<string | null>(null);
  const [savingExpense, setSavingExpense] = useState(false);
  const [savingTarget, setSavingTarget] = useState(false);

  const { showToast } = useToastContext();

  // Date selection state
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  // Forms
  const [newExpense, setNewExpense] = useState({ category: 'Software', amount: '', vendor: '', notes: '', date: now.toISOString().split('T')[0] });
  const [newTarget, setNewTarget] = useState({ year: now.getFullYear(), amount: '' });

  const fetchStats = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        view,
        month: selectedMonth.toString(),
        year: selectedYear.toString()
      });
      const res = await fetch(`/api/financials?${params.toString()}`);
      if (res.ok) {
        setData(await res.json());
      } else {
        showToast('Failed to load financial data. Please try again.', 'error');
      }
    } catch (error) {
      showToast('Network error while loading financial data.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [view, selectedMonth, selectedYear]);

  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingExpense(true);
    try {
      const res = await fetch('/api/financials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'EXPENSE', ...newExpense })
      });
      if (res.ok) {
        setShowExpenseModal(false);
        setNewExpense({ category: 'Software', amount: '', vendor: '', notes: '', date: new Date().toISOString().split('T')[0] });
        showToast('Expense logged successfully.', 'success');
        fetchStats();
      } else {
        showToast('Failed to save expense. Please try again.', 'error');
      }
    } catch (error) {
      showToast('Network error while saving expense.', 'error');
    } finally {
      setSavingExpense(false);
    }
  };

  const handleSaveTarget = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingTarget(true);
    try {
      const res = await fetch('/api/financials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'TARGET', ...newTarget })
      });
      if (res.ok) {
        setShowTargetModal(false);
        showToast('Annual target updated successfully.', 'success');
        fetchStats();
      } else {
        showToast('Failed to save target. Please try again.', 'error');
      }
    } catch (error) {
      showToast('Network error while saving target.', 'error');
    } finally {
      setSavingTarget(false);
    }
  };

  if (loading && !data) return (
    <section style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      <Skeleton variant="text" width="400px" height="2.5rem" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
        <Skeleton variant="card" count={3} />
      </div>
      <Skeleton variant="row" count={5} />
    </section>
  );

  const { summary, transactions, targetValue } = data || { summary: { income: 0, expenses: 0, netProfit: 0, target: 0, progress: 0 }, transactions: [], targetValue: 0 };

  const filteredTransactions = filterType ? transactions.filter((t: any) => t.type === filterType) : transactions;

  return (
    <ErrorBoundary>
      <section style={{ padding: '2.5rem', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
        {/* Header & View Switcher */}
        <div className="responsive-stack" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
          <div>
            <h1 className="app-heading text-gradient" style={{ fontSize: '2.5rem', margin: 0, letterSpacing: '-0.04em' }}>Business Financials</h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', fontSize: '1rem' }}>High-fidelity revenue oversight and profit optimization.</p>
          </div>
          <div className="responsive-stack" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(255,255,255,0.05)', padding: '0.4rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
              {view === 'monthly' && (
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                  aria-label="Select month"
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
                aria-label="Select year"
                style={{ background: 'transparent', color: 'var(--text-primary)', border: 'none', padding: '0.4rem 0.6rem', outline: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, borderLeft: view === 'monthly' ? '1px solid var(--border-color)' : 'none' }}
              >
                {Array.from({ length: 7 }, (_, i) => new Date().getFullYear() - 2 + i).map(y => (
                  <option key={y} value={y} style={{ background: 'var(--bg-surface)' }}>{y}</option>
                ))}
              </select>
            </div>

            <div
              role="tablist"
              aria-label="View period"
              style={{ display: 'flex', gap: '0.75rem', background: 'rgba(255,255,255,0.05)', padding: '0.4rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}
              onKeyDown={(e) => {
                const tabs = ['monthly', 'quarterly', 'yearly'];
                const idx = tabs.indexOf(view);
                if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); setView(tabs[(idx + 1) % tabs.length]); }
                else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); setView(tabs[(idx - 1 + tabs.length) % tabs.length]); }
              }}
            >
              {['monthly', 'quarterly', 'yearly'].map(v => (
                <button
                  key={v}
                  role="tab"
                  aria-selected={view === v}
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
                  <span style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)' }}>{view.charAt(0).toUpperCase() + view.slice(1)} Annual Target</span>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {formatCurrency(summary.income)} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 400 }}>/ {formatCurrency(summary.target)}</span>
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
        <div
          role="tablist"
          aria-label="Financial views"
          style={{ display: 'flex', gap: '2rem', borderBottom: '1px solid var(--border-color)', marginBottom: '2.5rem', paddingBottom: '0.5rem' }}
          onKeyDown={(e) => {
            const tabs = ['audit', 'trends'];
            const idx = tabs.indexOf(activeTab);
            if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); setActiveTab(tabs[(idx + 1) % tabs.length]); }
            else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); setActiveTab(tabs[(idx - 1 + tabs.length) % tabs.length]); }
          }}
        >
          <button
            role="tab"
            aria-selected={activeTab === 'audit'}
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
            role="tab"
            aria-selected={activeTab === 'trends'}
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
              <div className={`glass-panel card-lift transition-standard ${filterType === 'INCOME' ? '' : ''}`} onClick={() => setFilterType(filterType === 'INCOME' ? null : 'INCOME')} style={{
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
                 <p className="app-heading" style={{ fontSize: 'clamp(1.5rem, 4vw, 2.5rem)', margin: 0, letterSpacing: '-0.02em' }}>
                   {currency}<AnimatedCounter value={summary.income || 0} decimals={0} />
                 </p>
               </div>

               <div className={`glass-panel card-lift transition-standard ${filterType === 'EXPENSE' ? '' : ''}`} onClick={() => setFilterType(filterType === 'EXPENSE' ? null : 'EXPENSE')} style={{
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
                  <p className="app-heading" style={{ fontSize: 'clamp(1.5rem, 4vw, 2.5rem)', margin: 0, letterSpacing: '-0.02em' }}>
                    {currency}<AnimatedCounter value={summary.expenses || 0} decimals={0} />
                  </p>
               </div>

               <div className="glass-panel card-lift transition-standard" style={{
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
                  <p className="app-heading" style={{
                    fontSize: 'clamp(1.5rem, 4vw, 2.5rem)',
                    margin: 0,
                    letterSpacing: '-0.02em',
                    color: summary.netProfit >= 0 ? 'var(--text-primary)' : 'var(--accent-danger)'
                  }}>
                   {currency}<AnimatedCounter value={summary.netProfit || 0} decimals={0} />
                 </p>
               </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2.5rem' }}>
              <button
                onClick={() => setShowExpenseModal(true)}
                aria-label="Log a new business expense"
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.25rem',
                  background: 'var(--accent-primary)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600
                }}
              >
                <Plus size={18} /> Log Business Expense
              </button>
              <button
                onClick={() => { setNewTarget({ ...newTarget, amount: targetValue.toString() }); setShowTargetModal(true); }}
                aria-label="Set annual revenue target"
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.25rem',
                  background: 'transparent', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer', fontWeight: 600
                }}
              >
                <Target size={18} /> Set Annual Target
              </button>
            </div>

            {/* Transaction Ledger */}
            <div className="glass-panel scroll-shadow-x" style={{ padding: '2rem' }}>
              <div className="responsive-stack" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 className="app-heading" style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Clock size={24} color="var(--text-muted)" /> Financial Activity Ledger
                </h2>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 500 }}>
                  {transactions.length} entries recorded
                </div>
              </div>

              <div className="scroll-shadow-x" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', minWidth: '640px' }}>
                {filteredTransactions.length === 0 ? (
                  <EmptyState
                    icon={Clock}
                    title={`No ${filterType ? filterType.toLowerCase() + ' ' : ''}entries found`}
                    description="No historical entries detected for the selected parameters."
                  />
                ) : (
                  filteredTransactions.map((t: any, idx: number) => (
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
                        {t.type === 'INCOME' ? '+' : '-'} {formatCurrency(t.amount)}
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
                    tickFormatter={(v) => `${currency}${v >= 1000 ? (v/1000) + 'k' : v}`}
                  />
                  <Tooltip
                    contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '8px' }}
                    itemStyle={{ fontSize: '0.85rem' }}
                    formatter={(v: any) => [formatCurrency(v), '']}
                  />
                  <Area type="monotone" dataKey="income" name="Income" stroke="var(--accent-success)" fillOpacity={1} fill="url(#colorIncome)" strokeWidth={2} />
                  <Area type="monotone" dataKey="expense" name="Expense" stroke="var(--accent-danger)" fillOpacity={1} fill="url(#colorExpense)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div style={{ marginTop: '2rem', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              This chart visualizes volume of transactions. Use the filters at the top to toggle between monthly, quarterly, or yearly performance.
            </div>
          </div>
        )}

        {/* Expense Modal */}
        <Modal open={showExpenseModal} onClose={() => setShowExpenseModal(false)} title="Log Expense" width="480px">
          <form onSubmit={handleSaveExpense} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>Categorization</label>
              <select
                value={newExpense.category}
                onChange={e => setNewExpense({...newExpense, category: e.target.value})}
                aria-label="Expense category"
                className="transition-standard"
                style={inputStyle}
              >
                {['Software', 'Rent', 'Payroll', 'Marketing', 'Supplies', 'Consultants', 'Travel'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>Amount ({currency})</label>
                <input type="number" required placeholder="0.00" value={newExpense.amount} onChange={e => setNewExpense({...newExpense, amount: e.target.value})} aria-label="Expense amount" style={inputStyle} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                 <label style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>Service Date</label>
                <input type="date" required value={newExpense.date} onChange={e => setNewExpense({...newExpense, date: e.target.value})} aria-label="Expense date" style={inputStyle} />
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>Vendor / Provider</label>
              <input placeholder="Search or type vendor name..." value={newExpense.vendor} onChange={e => setNewExpense({...newExpense, vendor: e.target.value})} aria-label="Vendor or provider name" style={inputStyle} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>Expenditure Notes</label>
              <textarea placeholder="Line item details..." value={newExpense.notes} onChange={e => setNewExpense({...newExpense, notes: e.target.value})} aria-label="Expense notes" style={{ ...inputStyle, minHeight: '100px', paddingTop: '0.75rem' }} />
            </div>
            <button
              type="submit"
              disabled={savingExpense}
              style={{
                padding: '1.15rem',
                background: savingExpense ? 'var(--text-muted)' : 'var(--accent-primary)',
                color: 'white',
                border: 'none',
                borderRadius: '14px',
                cursor: savingExpense ? 'not-allowed' : 'pointer',
                fontWeight: 700,
                fontSize: '1rem',
                marginTop: '1.5rem',
                boxShadow: savingExpense ? 'none' : '0 4px 14px 0 rgba(16, 185, 129, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                opacity: savingExpense ? 0.7 : 1,
              }}
            >
              {savingExpense && <Spinner size={16} color="white" label="Saving expense" />}
              {savingExpense ? 'Saving...' : 'Finalize Expenditure'}
            </button>
          </form>
        </Modal>

        {/* Target Modal */}
        <Modal open={showTargetModal} onClose={() => setShowTargetModal(false)} title="Revenue Target" width="480px">
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '2.5rem', lineHeight: 1.6 }}>Set the annual revenue target for fiscal year {newTarget.year}. Optimization targets will be distributed across all business quarters.</p>
          <form onSubmit={handleSaveTarget} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', background: 'rgba(255,255,255,0.03)', padding: '1.25rem', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.1)' }}>
              <span className="app-heading" style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-primary)' }}>{currency}</span>
              <input
                type="number" required placeholder="0.00"
                value={newTarget.amount}
                onChange={e => setNewTarget({...newTarget, amount: e.target.value})}
                aria-label="Annual revenue target amount"
                className="app-heading"
                style={{ background: 'transparent', border: 'none', color: 'var(--custom-input-color, white)', fontSize: '2rem', width: '100%', outline: 'none', letterSpacing: '-0.02em' }}
              />
            </div>
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.25rem', borderRadius: '12px', border: '1px dashed rgba(255,255,255,0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Quarterly Benchmark</span>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{formatCurrency(Number(newTarget.amount) / 4)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Monthly Threshold</span>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{formatCurrency(Number(newTarget.amount) / 12)}</span>
              </div>
            </div>
            <button
              type="submit"
              disabled={savingTarget}
              style={{
                padding: '1.15rem',
                background: savingTarget ? 'var(--text-muted)' : 'var(--accent-primary)',
                color: 'white',
                border: 'none',
                borderRadius: '14px',
                cursor: savingTarget ? 'not-allowed' : 'pointer',
                fontWeight: 700,
                fontSize: '1rem',
                boxShadow: savingTarget ? 'none' : '0 4px 14px 0 rgba(16, 185, 129, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                opacity: savingTarget ? 0.7 : 1,
              }}
            >
              {savingTarget && <Spinner size={16} color="white" label="Saving target" />}
              {savingTarget ? 'Saving...' : 'Set Annual Target'}
            </button>
          </form>
        </Modal>

      </section>
    </ErrorBoundary>
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
