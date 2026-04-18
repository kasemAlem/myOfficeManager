'use client';
import { Wallet } from 'lucide-react';
import { useProjectDetail } from '../project-context';
import { Card } from '@/components/Card';
import { formatCurrency } from '@/lib/formatCurrency';

export function ProjectFinancials() {
  const {
    project, user, canEdit,
    totalPaid, balanceDue, currency, locale,
    isEditingOverallFee, tempFeeInput, setIsEditingOverallFee, setTempFeeInput, handleUpdateTotalFee,
    newPayment, setNewPayment, handleRecordPayment,
  } = useProjectDetail();

  const inputStyle: React.CSSProperties = {
    padding: '0.75rem', borderRadius: '8px',
    background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)',
    color: 'var(--custom-input-color, var(--text-primary))', width: '100%', boxSizing: 'border-box',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {user?.role !== 'EMPLOYEE' && (
        <>
          <Card variant="surface" padding="md">
            <h2 style={{ margin: '0 0 1.25rem 0', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Wallet size={20} color="var(--accent-primary)" /> Summary
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[
                {
                  label: 'Original Contract',
                  value: formatCurrency(project.totalFees),
                  color: 'var(--text-secondary)',
                  isFee: true,
                },
                { label: 'Total Paid', value: formatCurrency(totalPaid), color: 'var(--accent-success)' },
                { label: 'Remaining Balance', value: formatCurrency(balanceDue), color: balanceDue > 0 ? 'var(--accent-warning)' : 'var(--accent-success)' },
              ].map((row, i, arr) => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 0', borderBottom: i < arr.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{row.label}</span>
                  {row.isFee && isEditingOverallFee ? (
                    <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                      <input
                        type="number"
                        aria-label="Edit total fee amount"
                        value={tempFeeInput}
                        onChange={e => setTempFeeInput(e.target.value)}
                        autoFocus
                        style={{ ...inputStyle, padding: '0.3rem 0.6rem', width: '110px', fontSize: '0.9rem', height: '32px' }}
                      />
                      <button onClick={handleUpdateTotalFee} style={{ padding: '0.3rem 0.65rem', background: 'var(--accent-success)', color: 'black', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, height: '32px' }}>Save</button>
                      <button onClick={() => setIsEditingOverallFee(false)} style={{ padding: '0.3rem 0.6rem', background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', height: '32px' }}>Cancel</button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{ fontWeight: 700, fontSize: '1.05rem', color: row.color }}>{row.value}</span>
                      {row.isFee && canEdit && (
                        <button
                          aria-label="Edit total fee"
                          onClick={() => {
                            setTempFeeInput(project.totalFees.toString());
                            setIsEditingOverallFee(true);
                          }}
                          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', cursor: 'pointer', borderRadius: '4px', padding: '0.2rem 0.5rem', fontSize: '0.7rem' }}
                        >
                          Edit
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>

          <Card variant="surface" padding="md">
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem' }}>Payment History</h3>
            {project.payments?.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', margin: 0 }}>No payments recorded yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {project.payments?.map((pay: any) => (
                  <div key={pay.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.75rem', background: 'rgba(0,0,0,0.15)', borderRadius: '7px' }}>
                    <div>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-primary)' }}>{new Date(pay.datePaid).toLocaleDateString(locale)}</p>
                      {pay.notes && <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>{pay.notes}</p>}
                    </div>
                    <span style={{ fontWeight: 600, color: 'var(--accent-success)' }}>{formatCurrency(pay.amount)}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </>
      )}

      <Card variant="surface" padding="md">
        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem' }}>Record Payment</h3>
        <form onSubmit={handleRecordPayment} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <input type="number" required placeholder={`Amount (${currency})`} aria-label="Payment amount" value={newPayment.amount}
            onChange={e => setNewPayment({ ...newPayment, amount: e.target.value })} style={inputStyle} />
          <input placeholder="Notes (e.g. Check #123)" aria-label="Payment notes" value={newPayment.notes}
            onChange={e => setNewPayment({ ...newPayment, notes: e.target.value })} style={inputStyle} />
          <button style={{ padding: '0.75rem', background: 'var(--accent-success)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>Log Payment</button>
        </form>
      </Card>
    </div>
  );
}
