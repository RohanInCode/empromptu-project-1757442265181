import React, { useState, useEffect } from 'react'
import { Plus, Syringe, Calendar, AlertTriangle } from 'lucide-react'
import { useDatabase } from '../contexts/DatabaseContext'
import { useAuth } from '../contexts/AuthContext'
import { useNotifications } from '../contexts/NotificationContext'
import { format, parseISO, isBefore, addDays } from 'date-fns'

interface Vaccination {
  id: number
  pet_id: number
  pet_name: string
  vaccine_name: string
  date_given: string
  next_due_date: string
  veterinarian: string
  notes: string
}

export default function Vaccinations() {
  const { query } = useDatabase()
  const { user } = useAuth()
  const { addNotification } = useNotifications()
  const [vaccinations, setVaccinations] = useState<Vaccination[]>([])
  const [pets, setPets] = useState([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    pet_id: '',
    vaccine_name: '',
    date_given: '',
    next_due_date: '',
    veterinarian: '',
    notes: ''
  })

  const commonVaccines = [
    'Rabies',
    'DHPP (Distemper, Hepatitis, Parvovirus, Parainfluenza)',
    'Bordetella',
    'Lyme Disease',
    'FVRCP (Feline Viral Rhinotracheitis, Calicivirus, Panleukopenia)',
    'FeLV (Feline Leukemia)',
    'FIV (Feline Immunodeficiency Virus)'
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

      // Load vaccinations with pet names
      const vaccinationsResult = await query(
        `SELECT v.*, p.name as pet_name 
         FROM newschema_dc467bff0dd042a6ad91584c00d8b304.vaccinations v
         JOIN newschema_dc467bff0dd042a6ad91584c00d8b304.pets p ON v.pet_id = p.id
         WHERE p.user_id = $1
         ORDER BY v.next_due_date ASC`,
        [user?.id]
      )
      setVaccinations(vaccinationsResult.data || [])
    } catch (error) {
      console.error('Error loading data:', error)
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to load vaccination data'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      await query(
        `INSERT INTO newschema_dc467bff0dd042a6ad91584c00d8b304.vaccinations 
         (pet_id, vaccine_name, date_given, next_due_date, veterinarian, notes)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          parseInt(formData.pet_id),
          formData.vaccine_name,
          formData.date_given,
          formData.next_due_date,
          formData.veterinarian,
          formData.notes
        ]
      )
      
      addNotification({
        type: 'success',
        title: 'Success',
        message: 'Vaccination record added successfully'
      })
      
      resetForm()
      loadData()
    } catch (error) {
      console.error('Error saving vaccination:', error)
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to save vaccination record'
      })
    }
  }

  const resetForm = () => {
    setFormData({
      pet_id: '',
      vaccine_name: '',
      date_given: '',
      next_due_date: '',
      veterinarian: '',
      notes: ''
    })
    setShowAddForm(false)
  }

  const isOverdue = (dueDate: string) => {
    return isBefore(parseISO(dueDate), new Date())
  }

  const isDueSoon = (dueDate: string) => {
    const due = parseISO(dueDate)
    const soon = addDays(new Date(), 30)
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Vaccinations</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Track and manage your pets' vaccination schedules
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="h-5 w-5" />
          <span>Add Vaccination</span>
        </button>
      </div>

      {/* Add Vaccination Form */}
      {showAddForm && (
        <div className="card p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Add Vaccination Record
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
                Vaccine Name
              </label>
              <select
                required
                value={formData.vaccine_name}
                onChange={(e) => setFormData({ ...formData, vaccine_name: e.target.value })}
                className="input-field"
              >
                <option value="">Select vaccine</option>
                {commonVaccines.map((vaccine) => (
                  <option key={vaccine} value={vaccine}>{vaccine}</option>
                ))}
                <option value="Other">Other</option>
              </select>
            </div>

            {formData.vaccine_name === 'Other' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Custom Vaccine Name
                </label>
                <input
                  type="text"
                  required
                  onChange={(e) => setFormData({ ...formData, vaccine_name: e.target.value })}
                  className="input-field"
                  placeholder="Enter vaccine name"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Date Given
              </label>
              <input
                type="date"
                required
                value={formData.date_given}
                onChange={(e) => setFormData({ ...formData, date_given: e.target.value })}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Next Due Date
              </label>
              <input
                type="date"
                value={formData.next_due_date}
                onChange={(e) => setFormData({ ...formData, next_due_date: e.target.value })}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Veterinarian
              </label>
              <input
                type="text"
                value={formData.veterinarian}
                onChange={(e) => setFormData({ ...formData, veterinarian: e.target.value })}
                className="input-field"
                placeholder="Enter veterinarian name"
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
                Add Vaccination
              </button>
              <button type="button" onClick={resetForm} className="btn-secondary">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Vaccinations List */}
      {vaccinations.length === 0 ? (
        <div className="card p-12 text-center">
          <Syringe className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No vaccination records</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Start tracking your pets' vaccinations to stay on top of their health.
          </p>
          <button
            onClick={() => setShowAddForm(true)}
            className="btn-primary"
          >
            Add First Vaccination
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {vaccinations.map((vaccination) => (
            <div
              key={vaccination.id}
              className={`card p-6 border-l-4 ${
                isOverdue(vaccination.next_due_date)
                  ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                  : isDueSoon(vaccination.next_due_date)
                  ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
                  : 'border-green-500'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {vaccination.vaccine_name}
                    </h3>
                    {isOverdue(vaccination.next_due_date) && (
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Pet:</span>
                      <p className="font-medium text-gray-900 dark:text-white">{vaccination.pet_name}</p>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Date Given:</span>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {format(parseISO(vaccination.date_given), 'MMM dd, yyyy')}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Next Due:</span>
                      <p className={`font-medium ${
                        isOverdue(vaccination.next_due_date)
                          ? 'text-red-600'
                          : isDueSoon(vaccination.next_due_date)
                          ? 'text-yellow-600'
                          : 'text-green-600'
                      }`}>
                        {vaccination.next_due_date 
                          ? format(parseISO(vaccination.next_due_date), 'MMM dd, yyyy')
                          : 'Not scheduled'
                        }
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Veterinarian:</span>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {vaccination.veterinarian || 'Not specified'}
                      </p>
                    </div>
                  </div>

                  {vaccination.notes && (
                    <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        <strong>Notes:</strong> {vaccination.notes}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  {isOverdue(vaccination.next_due_date) && (
                    <span className="px-2 py-1 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 text-xs font-medium rounded">
                      Overdue
                    </span>
                  )}
                  {isDueSoon(vaccination.next_due_date) && !isOverdue(vaccination.next_due_date) && (
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 text-xs font-medium rounded">
                      Due Soon
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
