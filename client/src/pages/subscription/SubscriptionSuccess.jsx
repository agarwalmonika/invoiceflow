// SubscriptionSuccess.jsx
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { authAPI } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { CheckCircleIcon } from '@heroicons/react/24/solid'

export function SubscriptionSuccess() {
  const { updateUser } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    authAPI.getMe().then(r => {
      updateUser(r.data.user)
      setTimeout(() => navigate('/dashboard'), 3000)
    })
  }, [])

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-fade-in">
      <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mb-6">
        <CheckCircleIcon className="w-12 h-12 text-emerald-500" />
      </div>
      <h1 className="text-3xl font-display font-bold text-slate-900 dark:text-white mb-2">Subscription Activated!</h1>
      <p className="text-slate-500 mb-6">Your plan has been upgraded. Redirecting to dashboard...</p>
      <button onClick={() => navigate('/dashboard')} className="btn-primary">Go to Dashboard</button>
    </div>
  )
}
export default SubscriptionSuccess
