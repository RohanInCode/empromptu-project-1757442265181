import React, { useEffect, useState } from 'react'
import { Calendar, Heart, Syringe, Scissors, AlertTriangle, TrendingUp } from 'lucide-react'
import { useDatabase } from '../contexts/DatabaseContext'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { format, isAfter, isBefore, addDays } from 'date-fns'

export default function Dashboard() {
  const { query, initializeDatabase } = useDatabase()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    totalPets: 0,
    upcomingAppointments: 0,
    overdueVaccinations: 0,
    upcomingGrooming: 0
  })
  const [upcomingEvents, setUpcomingEvents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initAndLoadData = async () => {
      try {
        await initializeDatabase()
        await ensureUserExists()
        await loadDashboardData()
      } catch (error) {
        console.error('Error initializing dashboard:', error)
      } finally {
        setLoading(false)
      }
    }
    
    initAndLoadData()
  }, [])

  const ensureUserExists = async () => {
    try {
      await query(
        `INSERT INTO newschema_dc467bff0dd042a6ad91584c00d8b304.users (id, email, name, avatar)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (email) DO UPDATE SET name = $3, avatar = $4`,
        [parseInt(user?.id || '1'), user?.email, user?.name, user?.avatar]
      )
    } catch (error) {
      console.error('Error ensuring user exists:', error)
    }
  }

  const loadDashboardData = async () => {
    try {
      // Get total pets
      const petsResult = await query(
        'SELECT COUNT(*) as count FROM newschema_dc467bff0dd042a6ad91584c00d8b304.pets WHERE user_id = $1',
        [parseInt(user?.id || '1')]
      )
      
      // Get upcoming appointments (next 7 days)
      const appointmentsResult = await query(
        `SELECT COUNT(*) as count FROM newschema_dc467bff0dd042a6ad91584c00d8b304.appointments a
         JOIN newschema_dc467bff0dd042a6ad91584c00d8b304.pets p ON a.pet_id = p.id
         WHERE p.user_id = $1 AND a.appointment_date BETWEEN NOW() AND NOW() + INTERVAL '7 days'`,
        [parseInt(user?.id || '1')]
      )
      
      // Get overdue vaccinations
      const vaccinationsResult = await query(
        `SELECT COUNT(*) as count FROM newschema_dc467bff0dd042a6ad91584c00d8b304.vaccinations v
         JOIN newschema_dc467bff0dd042a6ad91584c00d8b304.pets p ON v.pet_id = p.id
         WHERE p.user_id = $1 AND v.next_due_date < NOW()`,
        [parseInt(user?.id || '1')]
      )
      
      // Get upcoming grooming (next 14 days)
      const groomingResult = await query(
        `SELECT COUNT(*) as count FROM newschema_dc467bff0dd042a6ad91584c00d8b304.grooming g
         JOIN newschema_dc467bff0dd042a6ad91584c00d8b304.pets p ON g.pet_id = p.id
         WHERE p.user_id = $1 AND g.next_scheduled_date BETWEEN NOW() AND NOW() + INTERVAL '14 days'`,
        [parseInt(user?.id || '1')]
      )

      setStats({
        totalPets: petsResult.data[0]?.count || 0,
        upcomingAppointments: appointmentsResult.data[0]?.count || 0,
        overdueVaccinations: vaccinationsResult.data[0]?.count || 0,
        upcomingGrooming: groomingResult.data[0]?.count || 0
      })
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    }
  }

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'add-pet':
        navigate('/pets')
        break
      case 'schedule-appointment':
        navigate('/appointments')
        break
      case 'log-vaccination':
        navigate('/vaccinations')
        break
      default:
        break
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Welcome back, {user?.name}!
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mt-2">
          Here's what's happening with your pets today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Pets</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalPets}</p>
            </div>
            <Heart className="h-12 w-12 text-primary-600" />
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Upcoming Appointments</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.upcomingAppointments}</p>
            </div>
            <Calendar className="h-12 w-12 text-blue-600" />
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Overdue Vaccinations</p>
              <p className="text-3xl font-bold text-red-600">{stats.overdueVaccinations}</p>
            </div>
            <AlertTriangle className="h-12 w-12 text-red-600" />
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Upcoming Grooming</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.upcomingGrooming}</p>
            </div>
            <Scissors className="h-12 w-12 text-green-600" />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button 
            onClick={() => handleQuickAction('add-pet')}
            className="btn-primary flex items-center justify-center space-x-2"
          >
            <Heart className="h-5 w-5" />
            <span>Add New Pet</span>
          </button>
          <button 
            onClick={() => handleQuickAction('schedule-appointment')}
            className="btn-secondary flex items-center justify-center space-x-2"
          >
            <Calendar className="h-5 w-5" />
            <span>Schedule Appointment</span>
          </button>
          <button 
            onClick={() => handleQuickAction('log-vaccination')}
            className="btn-secondary flex items-center justify-center space-x-2"
          >
            <Syringe className="h-5 w-5" />
            <span>Log Vaccination</span>
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Recent Activity</h2>
        <div className="space-y-4">
          <div className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <TrendingUp className="h-8 w-8 text-green-600" />
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Welcome to PawCare!</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Start by adding your first pet to get personalized care reminders.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
