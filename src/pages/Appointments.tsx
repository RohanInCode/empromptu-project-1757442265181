import React, { useState, useEffect } from 'react'
import { Plus, Calendar, Clock, MapPin, Phone } from 'lucide-react'
import { useDatabase } from '../contexts/DatabaseContext'
import { useAuth } from '../contexts/AuthContext'
import { useNotifications } from '../contexts/NotificationContext'
import { format, parseISO, isBefore, addDays } from 'date-fns'

interface Appointment {
  id: number
  pet_id: number
  pet_name: string
  appointment_type: string
  appointment_date: string
  veterinarian: string
  clinic_name: string
  address: string
  phone: string
  notes: string
  status: string
}

export default function Appointments() {
  const { query } = useDatabase()
  const { user } = useAuth()
  const { addNotification } = useNotifications()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [pets, setPets] = useState([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    pet_id: '',
    appointment_type: '',
    appointment_date: '',
    appointment_time: '',
    veterinarian: '',
    clinic_name: '',
    address: '',
    phone: '',
    notes: ''
  })

  const appointmentTypes = [
    'Annual Checkup',
    'Vaccination',
    'Dental Cleaning',
    'Surgery',
    'Emergency Visit',
    'Follow-up',
    'Grooming',
    'Behavioral Consultation',
    'Specialist Consultation'
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

      // Load appointments with pet names
      const appointmentsResult = await query(
        `SELECT a.*, p.name as pet_name 
         FROM newschema_dc467bff0dd042a6ad91584c00d8b304.appointments a
         JOIN newschema_dc467bff0dd042a6ad91584c00d8b304.pets p ON a.pet_id = p.id
         WHERE p.user_id = $1
         ORDER BY a.appointment_date ASC`,
        [user?.id]
      )
      setAppointments(appointmentsResult.data || [])
    } catch (error) {
      console.error('Error loading data:', error)
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to load appointment data'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const appointmentDateTime = `${formData.appointment_date}T${formData.appointment_time}:00`
      
      await query(
        `INSERT INTO newschema_dc467bff0dd042a6ad91584c00d8b304.appointments 
         (pet_id, appointment_type, appointment_date, veterinarian, clinic_name, address, phone, notes, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          parseInt(formData.pet_id),
          formData.appointment_type,
          appointmentDateTime,
          formData.veterinarian,
          formData.clinic_name,
          formData.address,
          formData.phone,
          formData.notes,
          'scheduled'
        ]
      )
      
      addNotification({
        type: 'success',
        title: 'Success',
        message: 'Appointment scheduled successfully'
      })
      
      resetForm()
      loadData()
    } catch (error) {
      console.error('Error saving appointment:', error)
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to schedule appointment'
      })
    }
  }

  const updateAppointmentStatus = async (appointmentId: number, status: string) => {
    try {
      await query(
        'UPDATE newschema_dc467bff0dd042a6ad91584c00d8b304.appointments SET status = $1 WHERE id = $2',
        [status, appointmentId]
      )
      
      addNotification({
        type: 'success',
        title: 'Success',
        message: `Appointment marked as ${status}`
      })
      
      loadData()
    } catch (error) {
      console.error('Error updating appointment:', error)
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to update appointment'
      })
    }
  }

  const resetForm = () => {
    setFormData({
      pet_id: '',
      appointment_type: '',
      appointment_date: '',
      appointment_time: '',
      veterinarian: '',
      clinic_name: '',
      address: '',
      phone: '',
      notes: ''
    })
    setShowAddForm(false)
  }

  const isUpcoming = (appointmentDate: string) => {
    const appointment = parseISO(appointmentDate)
    const now = new Date()
    const soon = addDays(now, 7)
    return appointment >= now && appointment <= soon
  }

  const isPast = (appointmentDate: string) => {
    return isBefore(parseISO(appointmentDate), new Date())
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Appointments</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Manage veterinary appointments and schedules
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="h-5 w-5" />
          <span>Schedule Appointment</span>
        </button>
      </div>

      {/* Add Appointment Form */}
      {showAddForm && (
        <div className="card p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Schedule New Appointment
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
                Appointment Type
              </label>
              <select
                required
                value={formData.appointment_type}
                onChange={(e) => setFormData({ ...formData, appointment_type: e.target.value })}
                className="input-field"
              >
                <option value="">Select type</option>
                {appointmentTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Date
              </label>
              <input
                type="date"
                required
                value={formData.appointment_date}
                onChange={(e) => setFormData({ ...formData, appointment_date: e.target.value })}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Time
              </label>
              <input
                type="time"
                required
                value={formData.appointment_time}
                onChange={(e) => setFormData({ ...formData, appointment_time: e.target.value })}
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

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Clinic Name
              </label>
              <input
                type="text"
                value={formData.clinic_name}
                onChange={(e) => setFormData({ ...formData, clinic_name: e.target.value })}
                className="input-field"
                placeholder="Enter clinic name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Address
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="input-field"
                placeholder="Enter clinic address"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Phone
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="input-field"
                placeholder="Enter phone number"
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
                Schedule Appointment
              </button>
              <button type="button" onClick={resetForm} className="btn-secondary">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Appointments List */}
      {appointments.length === 0 ? (
        <div className="card p-12 text-center">
          <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No appointments scheduled</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Schedule your first veterinary appointment to keep your pets healthy.
          </p>
          <button
            onClick={() => setShowAddForm(true)}
            className="btn-primary"
          >
            Schedule First Appointment
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {appointments.map((appointment) => (
            <div
              key={appointment.id}
              className={`card p-6 border-l-4 ${
                isUpcoming(appointment.appointment_date)
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : isPast(appointment.appointment_date) && appointment.status === 'scheduled'
                  ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                  : appointment.status === 'completed'
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                  : 'border-gray-500'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {appointment.appointment_type}
                    </h3>
                    <span className={`px-2 py-1 text-xs font-medium rounded ${
                      appointment.status === 'completed'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : appointment.status === 'cancelled'
                        ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        : isUpcoming(appointment.appointment_date)
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                    }`}>
                      {appointment.status}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm mb-4">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Pet:</span>
                        <p className="font-medium text-gray-900 dark:text-white">{appointment.pet_name}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Date & Time:</span>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {format(parseISO(appointment.appointment_date), 'MMM dd, yyyy h:mm a')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Clinic:</span>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {appointment.clinic_name || 'Not specified'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {appointment.veterinarian && (
                    <div className="mb-2">
                      <span className="text-gray-600 dark:text-gray-400">Veterinarian:</span>
                      <span className="font-medium text-gray-900 dark:text-white ml-2">
                        {appointment.veterinarian}
                      </span>
                    </div>
                  )}

                  {appointment.address && (
                    <div className="mb-2 flex items-center space-x-2">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600 dark:text-gray-300">{appointment.address}</span>
                    </div>
                  )}

                  {appointment.phone && (
                    <div className="mb-2 flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600 dark:text-gray-300">{appointment.phone}</span>
                    </div>
                  )}

                  {appointment.notes && (
                    <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        <strong>Notes:</strong> {appointment.notes}
                      </p>
                    </div>
                  )}
                </div>

                {appointment.status === 'scheduled' && (
                  <div className="flex flex-col space-y-2">
                    <button
                      onClick={() => updateAppointmentStatus(appointment.id, 'completed')}
                      className="px-3 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-xs font-medium rounded hover:bg-green-200 dark:hover:bg-green-800"
                    >
                      Mark Complete
                    </button>
                    <button
                      onClick={() => updateAppointmentStatus(appointment.id, 'cancelled')}
                      className="px-3 py-1 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 text-xs font-medium rounded hover:bg-red-200 dark:hover:bg-red-800"
                    >
                      Cancel
                    </button>
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
