import React, { useState, useEffect, useContext } from 'react';
import { CreditCard, Shield, CheckCircle, AlertTriangle, ArrowUpRight, FileText, Lock, Users, GraduationCap, Building, Zap, Download, RefreshCw, XCircle } from 'lucide-react';
import api from '../../api/axios';
import { AuthContext } from '../../context/AuthContext';
import { loadRazorpayCheckout } from '../../utils/razorpay';

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

        if (!orderId || !keyId || String(keyId).includes('placeholder')) {
          throw new Error('Checkout is unavailable because the backend did not return a valid Razorpay order or public key.');
        }

        setStatusMessage(`Razorpay Order Initiated for ${planCode} v${planVersion} (${orderId}). Opening Razorpay Checkout...`);

        try {
          const Razorpay = await loadRazorpayCheckout();

          const options = {
            key: keyId,
            amount,
            currency: currency || 'INR',
            name: 'EduTalentX B2B SaaS',
            description: `${planCode} v${planVersion} Institutional Subscription for ${institutionName || 'College'}`,
            order_id: orderId,
            handler: async function (response) {
              setStatusMessage('Payment received! Verifying cryptographic signature on backend...');
              try {
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
            modal: {
              ondismiss: () => {
                setStatusMessage('Razorpay checkout was closed before payment completion.');
              },
            },
          };

          const rzp = new Razorpay(options);
          rzp.on('payment.failed', function (resp) {
            setStatusMessage(`Payment Failed: ${resp.error?.description || 'Transaction declined'}`);
          });
          rzp.open();
        } catch (sdkErr) {
          console.error('Razorpay Checkout load failed:', sdkErr);
          setStatusMessage('Razorpay Checkout could not be loaded. Please check the merchant configuration and try again.');
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
      <div style={{ padding: '4rem', textAlign: 'center', color: '#6B7280' }}>
        <div className="animate-spin" style={{ width: '32px', height: '32px', borderRadius: '50%', border: '3px solid #E5E7EB', borderTopColor: '#2563EB', margin: '0 auto 1rem' }} />
        <p style={{ margin: 0, fontSize: '0.875rem' }}>Loading Institutional Billing & Subscription Catalog...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: '#DC2626' }}>
        <AlertTriangle size={36} style={{ margin: '0 auto 1rem' }} />
        <h3 style={{ margin: '0 0 0.5rem 0', color: '#111111' }}>Access Restricted</h3>
        <p style={{ color: '#4B5563', fontSize: '0.875rem' }}>{error}</p>
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
      <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#4B5563', fontSize: '0.875rem' }}>
            {icon}
            <span>{label}</span>
          </div>
          <span style={{ fontWeight: 600, fontSize: '0.875rem', color: isWarning ? '#D97706' : '#111111' }}>
            {current} / {isUnlimited ? 'Unlimited' : limit}
          </span>
        </div>
        <div style={{ width: '100%', height: '6px', background: '#F3F4F6', borderRadius: '3px', overflow: 'hidden' }}>
          <div
            style={{
              width: `${percentage}%`,
              height: '100%',
              background: isWarning ? '#D97706' : '#2563EB',
              borderRadius: '3px',
              transition: 'width 0.3s ease',
            }}
          />
        </div>
      </div>
    );
  };

  return (
    <div style={{ padding: '1.5rem', color: '#111111', maxWidth: '1280px', margin: '0 auto' }}>
      {/* Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid #E5E7EB', paddingBottom: '1.25rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <CreditCard style={{ color: '#2563EB' }} size={26} />
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0, color: '#111111' }}>Institution Billing & Subscriptions</h1>
          </div>
          <p style={{ color: '#4B5563', marginTop: '0.35rem', fontSize: '0.875rem' }}>
            B2B Institutional SaaS Subscriptions for <strong>{institution?.name}</strong> (Tenant ID: <code style={{ background: '#F3F4F6', padding: '0.15rem 0.35rem', borderRadius: '4px' }}>{institution?.tenantId}</code>)
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexWrap: 'wrap' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', padding: '0.35rem 0.75rem', fontSize: '0.8125rem', fontWeight: 600, borderRadius: '4px', background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #DBEAFE' }}>
            Current Plan: {currentPlan} v{currentPlanVersion} (₹{currentPriceSnapshot.amount?.toLocaleString()}/yr)
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', padding: '0.35rem 0.75rem', fontSize: '0.8125rem', fontWeight: 600, borderRadius: '4px', background: '#ECFDF5', color: '#065F46', border: '1px solid #A7F3D0' }}>
            Status: {subscription?.status || 'ACTIVE'}
          </span>
          {subscription?.cancelAtPeriodEnd && (
            <span style={{ display: 'inline-flex', alignItems: 'center', padding: '0.35rem 0.75rem', fontSize: '0.8125rem', fontWeight: 600, borderRadius: '4px', background: '#FFFBEB', color: '#92400E', border: '1px solid #FDE68A' }}>
              Cancels at Period End
            </span>
          )}
        </div>
      </div>

      {statusMessage && (
        <div style={{ padding: '0.875rem 1rem', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '6px', marginBottom: '1.5rem', fontSize: '0.875rem', color: '#1E40AF' }}>
          {statusMessage}
        </div>
      )}

      {/* Plan Resource Usage Gauges */}
      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1.0625rem', fontWeight: 600, marginBottom: '0.875rem', color: '#111111' }}>
          Resource Utilization vs Plan Entitlements
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
          {renderUsageBar('Enrolled Students', <GraduationCap size={16} />, usage?.students?.current || 0, usage?.students?.limit || 0)}
          {renderUsageBar('Faculty / Teachers', <Users size={16} />, usage?.teachers?.current || 0, usage?.teachers?.limit || 0)}
          {renderUsageBar('Recruiters / Partners', <Zap size={16} />, usage?.recruiters?.current || 0, usage?.recruiters?.limit || 0)}
          {renderUsageBar('Academic Departments', <Building size={16} />, usage?.departments?.current || 0, usage?.departments?.limit || 0)}
        </div>
      </div>

      {/* Dynamic Backend-Driven Catalog Plans */}
      <div style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.875rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <h3 style={{ fontSize: '1.0625rem', fontWeight: 600, margin: 0, color: '#111111' }}>
            Available SaaS Commercial Plans (Backend Catalog Controlled)
          </h3>
          <span style={{ fontSize: '0.8125rem', color: '#6B7280' }}>
            Official pricing published by Platform Owner
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
          {catalogPlans.map((plan) => {
            const isCurrent = plan.code === currentPlan;
            const priceVal = plan.price?.amount || 0;

            return (
              <div
                key={plan._id || plan.code}
                style={{
                  padding: '1.5rem',
                  borderRadius: '8px',
                  border: isCurrent ? '2px solid #2563EB' : '1px solid #E5E7EB',
                  background: '#FFFFFF',
                  boxShadow: isCurrent ? '0 4px 6px -1px rgba(37, 99, 235, 0.08)' : 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                    <div style={{ fontSize: '1.125rem', fontWeight: 700, color: '#111111' }}>{plan.code}</div>
                    <span style={{ fontSize: '0.75rem', color: '#6B7280', background: '#F3F4F6', padding: '0.15rem 0.4rem', borderRadius: '4px' }}>v{plan.version || 1}</span>
                  </div>
                  <div style={{ color: '#4B5563', fontSize: '0.8125rem', marginBottom: '1rem', minHeight: '36px' }}>{plan.description || plan.name}</div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#111111', marginBottom: '1.25rem' }}>
                    ₹{priceVal.toLocaleString()}<span style={{ fontSize: '0.8125rem', color: '#6B7280', fontWeight: 400 }}>/year</span>
                  </div>
                  <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1.5rem', fontSize: '0.8125rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', color: '#4B5563' }}>
                    <li>✓ Up to {plan.limits?.maxStudents?.toLocaleString() || 500} Students</li>
                    <li>✓ Up to {plan.limits?.maxTeachers || 50} Faculty Members</li>
                    <li>✓ Up to {plan.limits?.maxDepartments || 5} Academic Departments</li>
                    {plan.features?.developerDNA && <li>✓ AI Developer DNA Analysis</li>}
                    {plan.features?.placementEngine && <li>✓ AI Placement Engine</li>}
                    {plan.features?.customDomain && <li>✓ Priority SLA & Custom Branding</li>}
                  </ul>
                </div>
                <button
                  onClick={() => handleCheckout(plan.code)}
                  disabled={isCurrent || upgradingPlan === plan.code}
                  className={isCurrent ? 'btn btn-secondary' : 'btn btn-primary'}
                  style={{
                    width: '100%',
                    fontSize: '0.875rem',
                    background: isCurrent ? '#F3F4F6' : undefined,
                    color: isCurrent ? '#6B7280' : undefined,
                    borderColor: isCurrent ? '#E5E7EB' : undefined,
                  }}
                >
                  {isCurrent ? 'Current Plan' : upgradingPlan === plan.code ? 'Opening Razorpay...' : `Pay ₹${priceVal.toLocaleString()} & Select`}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Payment Ledger & Invoices Table */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '1.25rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <h3 style={{ fontSize: '1.0625rem', fontWeight: 600, margin: 0, color: '#111111', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText size={18} style={{ color: '#2563EB' }} /> Official Payment Ledger & Invoices
          </h3>
          <button onClick={fetchBillingInfo} className="btn btn-outline" style={{ padding: '0.3rem 0.65rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#FFFFFF', borderColor: '#E5E7EB' }}>
            <RefreshCw size={12} /> Refresh Status
          </button>
        </div>

        {billingData?.paymentHistory?.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: '#F8F9FA', borderBottom: '1px solid #E5E7EB', color: '#4B5563', fontSize: '0.8125rem' }}>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Payment ID</th>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Order ID</th>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Date</th>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Version</th>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Amount</th>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {billingData.paymentHistory.map((item, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #E5E7EB', color: '#111111' }}>
                    <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', fontWeight: 600, color: '#111111' }}>{item.paymentId}</td>
                    <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', color: '#6B7280', fontSize: '0.8125rem' }}>{item.orderId || '-'}</td>
                    <td style={{ padding: '0.75rem 1rem', color: '#4B5563' }}>{new Date(item.createdAt).toLocaleDateString()}</td>
                    <td style={{ padding: '0.75rem 1rem' }}><span style={{ fontSize: '0.75rem', color: '#6B7280' }}>v{item.planVersion || 1}</span></td>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#111111' }}>₹{item.amount?.toLocaleString()} {item.currency}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span style={{ display: 'inline-block', padding: '0.15rem 0.45rem', fontSize: '0.7rem', fontWeight: 600, borderRadius: '4px', background: item.status === 'FAILED' ? '#FEF2F2' : '#ECFDF5', color: item.status === 'FAILED' ? '#991B1B' : '#065F46', border: `1px solid ${item.status === 'FAILED' ? '#FCA5A5' : '#A7F3D0'}` }}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={{ color: '#6B7280', fontSize: '0.875rem', margin: 0 }}>
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
          style={{ color: '#DC2626', borderColor: '#FCA5A5', background: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem' }}
        >
          <XCircle size={15} />
          {subscription?.cancelAtPeriodEnd ? 'Cancellation Scheduled' : 'Cancel Subscription at Period End'}
        </button>
      </div>
    </div>
  );
};

export default AdminBilling;
