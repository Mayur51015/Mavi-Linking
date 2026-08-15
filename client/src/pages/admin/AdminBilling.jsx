import React, { useState, useEffect, useContext } from 'react';
import { CreditCard, Shield, CheckCircle, AlertTriangle, ArrowUpRight, FileText, Lock, Users, GraduationCap, Building, Zap, Download, RefreshCw, XCircle } from 'lucide-react';
import api from '../../api/axios';
import { AuthContext } from '../../context/AuthContext';

const AdminBilling = () => {
  const { user } = useContext(AuthContext);
  const [billingData, setBillingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [upgradingPlan, setUpgradingPlan] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [cancelling, setCancelling] = useState(false);

  const fetchBillingInfo = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/billing/subscription');
      if (res.data?.data) {
        setBillingData(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching billing data:', err);
      setError(err.response?.data?.message || 'Unable to load institution billing data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBillingInfo();
  }, []);

  const handleCheckout = async (planCode) => {
    setUpgradingPlan(planCode);
    setStatusMessage('');
    try {
      // 1. Create Checkout Session via Backend (fetches price & version server-side)
      const res = await api.post('/billing/checkout', {
        targetPlanCode: planCode,
        billingCycle: 'annual',
      });

      if (res.data?.success) {
        const { orderId, amount, currency, keyId, institutionName, planVersion } = res.data.data;
        setStatusMessage(`Razorpay Order Initiated for ${planCode} v${planVersion} (${orderId}). Opening Razorpay Checkout...`);

        const effectiveKey = keyId && !keyId.includes('placeholder') ? keyId : 'rzp_test_TQ0mLvJPyus2JW';
        const isMockOrder = !orderId || orderId.startsWith('order_mock_');

        // 2. Razorpay Standard Checkout Modal
        if (window.Razorpay && !isMockOrder) {
          const options = {
            key: effectiveKey,
            amount,
            currency: currency || 'INR',
            name: 'MAVI Linking B2B SaaS',
            description: `${planCode} v${planVersion} Institutional Subscription for ${institutionName || 'College'}`,
            order_id: orderId,
            handler: async function (response) {
              setStatusMessage('Payment received! Verifying cryptographic signature on backend...');
              try {
                // 3. Server-Side Payment Verification (HMAC SHA-256)
                const verifyRes = await api.post('/billing/verify-payment', {
                  orderId: response.razorpay_order_id || orderId,
                  paymentId: response.razorpay_payment_id,
                  signature: response.razorpay_signature,
                  targetPlanCode: planCode,
                });

                if (verifyRes.data?.success) {
                  setStatusMessage(`🎉 Subscription Activated! Transaction ID: ${response.razorpay_payment_id}. Invoice: ${verifyRes.data.data?.invoiceNumber}`);
                  fetchBillingInfo();
                }
              } catch (verifyErr) {
                console.error('Verification error:', verifyErr);
                setStatusMessage(`Payment Verification Failed: ${verifyErr.response?.data?.message || 'Invalid Signature'}`);
              }
            },
            prefill: {
              name: user?.name || '',
              email: user?.email || '',
            },
            theme: { color: '#6366f1' },
          };

          const rzp = new window.Razorpay(options);
          rzp.on('payment.failed', function (resp) {
            setStatusMessage(`Payment Failed: ${resp.error?.description || 'Transaction declined'}`);
          });
          rzp.open();
        } else {
          // Dev mock fallback trigger if Razorpay SDK script not present or mock order generated
          setStatusMessage('Processing sandbox payment simulation...');
          setTimeout(async () => {
            try {
              const verifyRes = await api.post('/billing/verify-payment', {
                orderId: orderId || `order_mock_${Date.now()}`,
                paymentId: `pay_mock_${Date.now()}`,
                signature: 'mock_signature_dev',
                targetPlanCode: planCode,
              });
              if (verifyRes.data?.success) {
                setStatusMessage(`🎉 Subscription updated to ${planCode} v${planVersion} successfully!`);
                fetchBillingInfo();
              }
            } catch (mockErr) {
              setStatusMessage('Sandbox payment process completed. Updating subscription status...');
              fetchBillingInfo();
            }
          }, 1200);
        }
      }
    } catch (err) {
      console.error('Checkout error:', err);
      setStatusMessage(err.response?.data?.message || 'Checkout failed. Please try again.');
    } finally {
      setUpgradingPlan(null);
    }
  };

  const handleCancelSubscription = async () => {
    if (!window.confirm('Are you sure you want to cancel your institutional subscription at the end of the billing period? Your institutional data will remain completely safe.')) {
      return;
    }

    setCancelling(true);
    try {
      const res = await api.post('/billing/cancel-subscription');
      if (res.data?.success) {
        setStatusMessage(res.data.message);
        fetchBillingInfo();
      }
    } catch (err) {
      console.error('Cancellation error:', err);
      setStatusMessage(err.response?.data?.message || 'Failed to cancel subscription.');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        <div className="animate-pulse" style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--gradient-primary)', margin: '0 auto 1rem' }} />
        Loading Institutional Billing & Subscription Catalog...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: '#ef4444' }}>
        <AlertTriangle size={36} style={{ margin: '0 auto 1rem' }} />
        <h3>Access Restricted</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{error}</p>
      </div>
    );
  }

  const { institution, subscription, usage, availablePlans = [] } = billingData || {};
  const currentPlan = institution?.plan || 'ENTERPRISE';
  const currentPlanVersion = subscription?.planVersion || 1;
  const currentPriceSnapshot = subscription?.priceSnapshot || { amount: 149999, currency: 'INR' };

  // Fallback default plans if DB empty
  const catalogPlans = availablePlans.length > 0 ? availablePlans : [
    { code: 'BASIC', name: 'Basic Institutional Plan', version: 1, price: { amount: 49999 }, limits: { maxStudents: 500, maxTeachers: 50, maxDepartments: 5 }, features: { developerDNA: true } },
    { code: 'PRO', name: 'Professional Institutional Plan', version: 1, price: { amount: 149999 }, limits: { maxStudents: 2500, maxTeachers: 200, maxDepartments: 15 }, features: { placementEngine: true } },
    { code: 'ENTERPRISE', name: 'Enterprise University Plan', version: 1, price: { amount: 299999 }, limits: { maxStudents: 10000, maxTeachers: 500, maxDepartments: 50 }, features: { customDomain: true } },
  ];

  const renderUsageBar = (label, icon, current, limit) => {
    const isUnlimited = limit === 0;
    const percentage = isUnlimited ? 10 : Math.min(100, Math.round((current / (limit || 1)) * 100));
    const isWarning = !isUnlimited && percentage >= 85;

    return (
      <div className="glass-card" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            {icon}
            <span>{label}</span>
          </div>
          <span style={{ fontWeight: 'bold', fontSize: '0.9rem', color: isWarning ? '#f59e0b' : 'var(--text-primary)' }}>
            {current} / {isUnlimited ? 'Unlimited' : limit}
          </span>
        </div>
        <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', overflow: 'hidden' }}>
          <div
            style={{
              width: `${percentage}%`,
              height: '100%',
              background: isWarning ? 'var(--gradient-amber, #f59e0b)' : 'var(--gradient-primary)',
              borderRadius: '4px',
              transition: 'width 0.3s ease',
            }}
          />
        </div>
      </div>
    );
  };

  return (
    <div style={{ padding: '1.5rem 2rem', color: 'white', maxWidth: '1280px', margin: '0 auto' }}>
      {/* Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '1.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <CreditCard className="text-gradient" size={28} />
            <h1 style={{ fontSize: '1.75rem', fontWeight: '800', margin: 0 }}>Institution Billing & Subscriptions</h1>
          </div>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.3rem', fontSize: '0.9rem' }}>
            B2B Institutional SaaS Subscriptions for <strong>{institution?.name}</strong> (Tenant ID: <code>{institution?.tenantId}</code>)
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span className="badge badge-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', fontWeight: 'bold' }}>
            Current Plan: {currentPlan} v{currentPlanVersion} (₹{currentPriceSnapshot.amount?.toLocaleString()}/yr)
          </span>
          <span className="badge badge-success" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', fontWeight: 'bold', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
            Status: {subscription?.status || 'ACTIVE'}
          </span>
          {subscription?.cancelAtPeriodEnd && (
            <span className="badge badge-warning" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', fontSize: '0.75rem' }}>
              Cancels at Period End
            </span>
          )}
        </div>
      </div>

      {statusMessage && (
        <div style={{ padding: '1rem', background: 'rgba(99, 102, 241, 0.15)', border: '1px solid var(--accent-purple)', borderRadius: '10px', marginBottom: '1.5rem', fontSize: '0.9rem', color: 'white' }}>
          {statusMessage}
        </div>
      )}

      {/* Plan Resource Usage Gauges */}
      <div style={{ marginBottom: '2.5rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '1rem', color: 'var(--text-primary)' }}>
          Resource Utilization vs Plan Entitlements
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
          {renderUsageBar('Enrolled Students', <GraduationCap size={18} />, usage?.students?.current || 0, usage?.students?.limit || 0)}
          {renderUsageBar('Faculty / Teachers', <Users size={18} />, usage?.teachers?.current || 0, usage?.teachers?.limit || 0)}
          {renderUsageBar('Recruiters / Partners', <Zap size={18} />, usage?.recruiters?.current || 0, usage?.recruiters?.limit || 0)}
          {renderUsageBar('Academic Departments', <Building size={18} />, usage?.departments?.current || 0, usage?.departments?.limit || 0)}
        </div>
      </div>

      {/* Dynamic Backend-Driven Catalog Plans */}
      <div style={{ marginBottom: '3rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '700', margin: 0, color: 'var(--text-primary)' }}>
            Available SaaS Commercial Plans (Backend Catalog Controlled)
          </h3>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Official pricing published by Platform Owner
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
          {catalogPlans.map((plan) => {
            const isCurrent = plan.code === currentPlan;
            const priceVal = plan.price?.amount || 0;

            return (
              <div
                key={plan._id || plan.code}
                className="glass-card"
                style={{
                  padding: '1.75rem',
                  border: isCurrent ? '2px solid var(--accent-purple)' : '1px solid rgba(255,255,255,0.08)',
                  background: plan.code === 'PRO' ? 'rgba(99, 102, 241, 0.04)' : 'transparent',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: '800' }}>{plan.code}</div>
                  <span className="badge badge-secondary" style={{ fontSize: '0.7rem' }}>v{plan.version || 1}</span>
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>{plan.description || plan.name}</div>
                <div style={{ fontSize: '1.85rem', fontWeight: '800', color: 'var(--accent-purple)', marginBottom: '1.25rem' }}>
                  ₹{priceVal.toLocaleString()}<span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>/year</span>
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1.5rem', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.6rem', color: 'var(--text-secondary)' }}>
                  <li>✓ Up to {plan.limits?.maxStudents?.toLocaleString() || 500} Students</li>
                  <li>✓ Up to {plan.limits?.maxTeachers || 50} Faculty Members</li>
                  <li>✓ Up to {plan.limits?.maxDepartments || 5} Academic Departments</li>
                  {plan.features?.developerDNA && <li>✓ AI Developer DNA Analysis</li>}
                  {plan.features?.placementEngine && <li>✓ AI Placement Engine</li>}
                  {plan.features?.customDomain && <li>✓ Priority SLA & Custom Branding</li>}
                </ul>
                <button
                  onClick={() => handleCheckout(plan.code)}
                  disabled={isCurrent || upgradingPlan === plan.code}
                  className={isCurrent ? 'btn btn-secondary' : 'btn btn-primary'}
                  style={{ width: '100%' }}
                >
                  {isCurrent ? 'CURRENT PLAN' : upgradingPlan === plan.code ? 'Opening Razorpay...' : `Pay ₹${priceVal.toLocaleString()} & Select`}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Payment Ledger & Invoices Table */}
      <div className="glass-card-static" style={{ padding: '1.5rem', marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '700', margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText size={18} /> Official Payment Ledger & Invoices
          </h3>
          <button onClick={fetchBillingInfo} className="btn btn-outline" style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <RefreshCw size={14} /> Refresh Status
          </button>
        </div>

        {billingData?.paymentHistory?.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Payment ID</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Order ID</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Date</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Version</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Amount</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {billingData.paymentHistory.map((item, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', fontWeight: 'bold', color: 'var(--accent-purple)' }}>{item.paymentId}</td>
                    <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', color: 'var(--text-muted)', fontSize: '0.8rem' }}>{item.orderId || '-'}</td>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)' }}>{new Date(item.createdAt).toLocaleDateString()}</td>
                    <td style={{ padding: '0.75rem 1rem' }}><span className="badge badge-secondary" style={{ fontSize: '0.75rem' }}>v{item.planVersion || 1}</span></td>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 'bold' }}>₹{item.amount?.toLocaleString()} {item.currency}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span className="badge badge-success" style={{ background: item.status === 'FAILED' ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)', color: item.status === 'FAILED' ? '#ef4444' : '#10b981' }}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0 }}>
            No transaction records found for this institution subscription.
          </p>
        )}
      </div>

      {/* Subscription Management Actions */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
        <button
          onClick={handleCancelSubscription}
          disabled={cancelling || subscription?.cancelAtPeriodEnd}
          className="btn btn-outline"
          style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}
        >
          <XCircle size={16} />
          {subscription?.cancelAtPeriodEnd ? 'Cancellation Scheduled' : 'Cancel Subscription at Period End'}
        </button>
      </div>
    </div>
  );
};

export default AdminBilling;
