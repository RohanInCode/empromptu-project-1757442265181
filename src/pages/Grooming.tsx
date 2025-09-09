import React, { useState, useEffect } from 'react'
import { Plus, Scissors, Calendar, DollarSign } from 'lucide-react'
import { useDatabase } from '../contexts/DatabaseContext'
import { useAuth } from '../contexts/AuthContext'
import { useNotifications } from '../contexts/NotificationContext'
import { format, parseISO, isBefore, addDays } from 'date-fns'

interface GroomingRecord {
  id: number
  pet_id: number
  pet_name: string
  service_type: string
  date_completed: string
  next_scheduled_date: string
  groomer: string
  cost: number
  notes: string
}

export default function Grooming() {
  const { query } = useDatabase()
  const { user } = useAuth()
  const { addNotification } = useNotifications()
  const [groomingRecords, setGroomingRecords] = useState<GroomingRecord[]>([])
  const [pets, setPets] = useState([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    pet_id: '',
    service_type: '',
    date_completed: '',
    next_scheduled_date: '',
    groomer: '',
    cost: '',
    notes: ''
  })

  const serviceTypes = [
    'Full Grooming',
    'Bath Only',
    'Nail Trim',
    'Ear Cleaning',
    'Teeth Cleaning',
    'Flea Treatment',
    'De-shedding',
    'Haircut/Trim'
  ]

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      // Load pets
      const petsResult = await query(
        'SELECT id, name FROM newschema_dc467bff0dd042a6ad91584c00d8b304.pets WHERE user_id = $1',
        [user?.id]
      )
      setPets(petsResult.data || [])

      // Load grooming records with pet names
      const groomingResult = await query(
        `SELECT g.*, p.name as pet_name 
         FROM newschema_dc467bff0dd042a6ad91584c00d8b304.grooming g
         JOIN newschema_dc467bff0dd042a6ad91584c00d8b304.pets p ON g.pet_id = p.id
         WHERE p.user_id = $1
         ORDER BY g.date_completed DESC`,
        [user?.id]
      )
      setGroomingRecords(groomingResult.data || [])
    } catch (error) {
      console.error('Error loading data:', error)
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to load grooming data'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      await query(
        `INSERT INTO newschema_dc467bff0dd042a6ad91584c00d8b304.grooming 
         (pet_id, service_type, date_completed, next_scheduled_date, groomer, cost, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          parseInt(formData.pet_id),
          formData.service_type,
          formData.date_completed,
          formData.next_scheduled_date || null,
          formData.groomer,
          formData.cost ? parseFloat(formData.cost) : null,
          formData.notes
        ]
      )
      
      addNotification({
        type: 'success',
        title: 'Success',
        message: 'Grooming record added successfully'
      })
      
      resetForm()
      loadData()
    } catch (error) {
      console.error('Error saving grooming record:', error)
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to save grooming record'
      })
    }
  }

  const resetForm = () => {
    setFormData({
      pet_id: '',
      service_type: '',
      date_completed: '',
      next_scheduled_date: '',
      groomer: '',
      cost: '',
      notes: ''
    })
    setShowAddForm(false)
  }

  const isDueSoon = (scheduledDate: string) => {
    if (!scheduledDate) return false
    const due = parseISO(scheduledDate)
    const soon = addDays(new Date(), 7)
    return isBefore(due, soon) && !isBefore(due, new Date())
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Grooming</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Track grooming appointments and schedules
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="h-5 w-5" />
          <span>Add Grooming</span>
        </button>
      </div>

      {/* Add Grooming Form */}
      {showAddForm && (
        <div className="card p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Add Grooming Record
          </h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Pet
              </label>
              <select
                required
                value={formData.pet_id}
                onChange={(e) => setFormData({ ...formData, pet_id: e.target.value })}
                className="input-field"
              >
                <option value="">Select a pet</option>
                {pets.map((pet: any) => (
                  <option key={pet.id} value={pet.id}>{pet.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Service Type
              </label>
              <select
                required
                value={formData.service_type}
                onChange={(e) => setFormData({ ...formData, service_type: e.target.value })}
                className="input-field"
              >
                <option value="">Select service</option>
                {serviceTypes.map((service) => (
                  <option key={service} value={service}>{service}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Date Completed
              </label>
              <input
                type="date"
                required
                value={formData.date_completed}
                onChange={(e) => setFormData({ ...formData, date_completed: e.target.value })}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Next Scheduled Date
              </label>
              <input
                type="date"
                value={formData.next_scheduled_date}
                onChange={(e) => setFormData({ ...formData, next_scheduled_date: e.target.value })}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Groomer
              </label>
              <input
                type="text"
                value={formData.groomer}
                onChange={(e) => setFormData({ ...formData, groomer: e.target.value })}
                className="input-field"
                placeholder="Enter groomer name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Cost ($)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.cost}
                onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                className="input-field"
                placeholder="Enter cost"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Notes
              </label>
              <textarea
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="input-field"
                placeholder="Enter any additional notes"
              />
            </div>

            <div className="md:col-span-2 flex space-x-4">
              <button type="submit" className="btn-primary">
                Add Grooming Record
              </button>
              <button type="button" onClick={resetForm} className="btn-secondary">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Grooming Records List */}
      {groomingRecords.length === 0 ? (
        <div className="card p-12 text-center">
          <Scissors className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No grooming records</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Start tracking your pets' grooming appointments and schedules.
          </p>
          <button
            onClick={() => setShowAddForm(true)}
            className="btn-primary"
          >
            Add First Grooming Record
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {groomingRecords.map((record) => (
            <div
              key={record.id}
              className={`card p-6 border-l-4 ${
                isDueSoon(record.next_scheduled_date)
                  ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
                  : 'border-blue-500'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {record.service_type}
                    </h3>
                    {isDueSoon(record.next_scheduled_date) && (
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 text-xs font-medium rounded">
                        Due Soon
                      </span>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Pet:</span>
                      <p className="font-medium text-gray-900 dark:text-white">{record.pet_name}</p>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Date Completed:</span>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {format(parseISO(record.date_completed), 'MMM dd, yyyy')}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Next Scheduled:</span>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {record.next_scheduled_date 
                          ? format(parseISO(record.next_scheduled_date), 'MMM dd, yyyy')
                          : 'Not scheduled'
                        }
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Groomer:</span>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {record.groomer || 'Not specified'}
                      </p>
                    </div>
                  </div>

                  {record.notes && (
                    <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        <strong>Notes:</strong> {record.notes}
                      </p>
                    </div>
                  )}
                </div>

                {record.cost && (
                  <div className="flex items-center space-x-1 text-green-600 dark:text-green-400">
                    <DollarSign className="h-4 w-4" />
                    <span className="font-semibold">{record.cost}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
