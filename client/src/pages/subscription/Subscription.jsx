import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { stripeAPI } from '../../services/api'
import toast from 'react-hot-toast'
import { CheckIcon, SparklesIcon, BoltIcon } from '@heroicons/react/24/solid'
import { Spinner } from '../../components/common'

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    period: 'forever',
    description: 'Perfect for freelancers just getting started',
    features: ['5 invoices per month', 'Basic PDF export', 'Client management', 'Payment tracking'],
    cta: 'Current Plan',
    color: 'slate',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 19,
    period: 'per month',
    description: 'For growing businesses and professionals',
    features: ['100 invoices per month', 'Advanced PDF templates', 'Email invoices to clients', 'Priority support', 'Multi-currency', 'Payment reminders'],
    cta: 'Upgrade to Pro',
    color: 'brand',
    popular: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 49,
    period: 'per month',
    description: 'Unlimited power for large businesses',
    features: ['Unlimited invoices', 'All Pro features', 'Team members', 'API access', 'Custom branding', 'Dedicated support', 'Analytics export'],
    cta: 'Upgrade to Enterprise',
    color: 'amber',
  },
]

export default function Subscription() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(null)

  const handleUpgrade = async (planId) => {
    if (planId === 'free' || planId === user?.subscriptionPlan) return
    setLoading(planId)
    try {
      const res = await stripeAPI.createCheckout(planId)
      window.location.href = res.data.url
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to start checkout')
    } finally {
      setLoading(null)
    }
  }

  const handleManage = async () => {
    setLoading('portal')
    try {
      const res = await stripeAPI.createPortal()
      window.location.href = res.data.url
    } catch {
      toast.error('Failed to open billing portal')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="animate-fade-in space-y-8">
      <div className="text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-50 dark:bg-brand-950/50 text-brand-600 text-sm font-semibold mb-4">
          <SparklesIcon className="w-4 h-4" /> Subscription Plans
        </div>
        <h1 className="text-3xl font-display font-bold text-slate-900 dark:text-white mb-2">
          Choose the right plan
        </h1>
        <p className="text-slate-500">
          Start free, upgrade when you need more. Cancel anytime.
        </p>
      </div>

      {/* Current plan banner */}
      <div className="card p-4 flex items-center justify-between bg-brand-50 dark:bg-brand-950/30 border-brand-200 dark:border-brand-900">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
            <BoltIcon className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              Current plan: <span className="capitalize text-brand-600">{user?.subscriptionPlan}</span>
            </p>
            <p className="text-xs text-slate-500">
              {user?.subscriptionPlan === 'free' ? '5 invoices limit' :
               user?.subscriptionPlan === 'pro' ? '100 invoices/month' : 'Unlimited invoices'}
            </p>
          </div>
        </div>
        {user?.subscriptionPlan !== 'free' && (
          <button onClick={handleManage} disabled={loading === 'portal'} className="btn-secondary btn-sm">
            {loading === 'portal' ? <Spinner size="sm" /> : 'Manage Billing'}
          </button>
        )}
      </div>

      {/* Plans */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {PLANS.map((plan) => {
          const isCurrent = user?.subscriptionPlan === plan.id
          const isLoading = loading === plan.id

          return (
            <div key={plan.id} className={`card p-6 flex flex-col relative ${plan.popular ? 'ring-2 ring-brand-500' : ''}`}>
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-brand-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className="font-display text-xl font-bold text-slate-900 dark:text-white">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="text-3xl font-display font-bold text-slate-900 dark:text-white">
                    {plan.price === 0 ? 'Free' : `$${plan.price}`}
                  </span>
                  {plan.price > 0 && <span className="text-slate-400 text-sm">/{plan.period}</span>}
                </div>
                <p className="text-sm text-slate-500 mt-1">{plan.description}</p>
              </div>

              <ul className="space-y-2.5 flex-1 mb-6">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm">
                    <CheckIcon className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span className="text-slate-600 dark:text-slate-400">{f}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleUpgrade(plan.id)}
                disabled={isCurrent || isLoading || plan.id === 'free'}
                className={`w-full justify-center ${
                  isCurrent
                    ? 'btn-secondary cursor-default opacity-70'
                    : plan.popular
                    ? 'btn-primary'
                    : 'btn-secondary hover:border-brand-400'
                }`}
              >
                {isLoading ? <Spinner size="sm" /> : isCurrent ? '✓ Current Plan' : plan.cta}
              </button>
            </div>
          )
        })}
      </div>

      <p className="text-center text-xs text-slate-400">
        Payments securely processed by Stripe. SSL encrypted. Cancel anytime from billing portal.
      </p>
    </div>
  )
}
