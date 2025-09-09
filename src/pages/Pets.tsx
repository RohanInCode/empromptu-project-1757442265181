import React, { useState, useEffect } from 'react'
import { Plus, Heart, Edit, Trash2, Camera } from 'lucide-react'
import { useDatabase } from '../contexts/DatabaseContext'
import { useAuth } from '../contexts/AuthContext'
import { useNotifications } from '../contexts/NotificationContext'

interface Pet {
  id: number
  name: string
  species: string
  breed: string
  age: number
  weight: number
  photo: string
  medical_notes: string
}

export default function Pets() {
  const { query } = useDatabase()
  const { user } = useAuth()
  const { addNotification } = useNotifications()
  const [pets, setPets] = useState<Pet[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingPet, setEditingPet] = useState<Pet | null>(null)
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    name: '',
    species: 'dog',
    breed: '',
    age: '',
    weight: '',
    photo: '',
    medical_notes: ''
  })

  useEffect(() => {
    ensureUserExists().then(() => {
      loadPets()
    })
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

  const loadPets = async () => {
    try {
      const result = await query(
        'SELECT * FROM newschema_dc467bff0dd042a6ad91584c00d8b304.pets WHERE user_id = $1 ORDER BY created_at DESC',
        [parseInt(user?.id || '1')]
      )
      setPets(result.data || [])
    } catch (error) {
      console.error('Error loading pets:', error)
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to load pets'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (editingPet) {
        await query(
          `UPDATE newschema_dc467bff0dd042a6ad91584c00d8b304.pets 
           SET name = $1, species = $2, breed = $3, age = $4, weight = $5, photo = $6, medical_notes = $7
           WHERE id = $8`,
          [
            formData.name, 
            formData.species, 
            formData.breed, 
            formData.age ? parseInt(formData.age) : null, 
            formData.weight ? parseFloat(formData.weight) : null, 
            formData.photo, 
            formData.medical_notes, 
            editingPet.id
          ]
        )
        addNotification({
          type: 'success',
          title: 'Success',
          message: 'Pet updated successfully'
        })
      } else {
        await query(
          `INSERT INTO newschema_dc467bff0dd042a6ad91584c00d8b304.pets 
           (user_id, name, species, breed, age, weight, photo, medical_notes)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            parseInt(user?.id || '1'), 
            formData.name, 
            formData.species, 
            formData.breed, 
            formData.age ? parseInt(formData.age) : null, 
            formData.weight ? parseFloat(formData.weight) : null, 
            formData.photo, 
            formData.medical_notes
          ]
        )
        addNotification({
          type: 'success',
          title: 'Success',
          message: 'Pet added successfully'
        })
      }
      
      resetForm()
      loadPets()
    } catch (error) {
      console.error('Error saving pet:', error)
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to save pet'
      })
    }
  }

  const handleEdit = (pet: Pet) => {
    setEditingPet(pet)
    setFormData({
      name: pet.name,
      species: pet.species,
      breed: pet.breed || '',
      age: pet.age ? pet.age.toString() : '',
      weight: pet.weight ? pet.weight.toString() : '',
      photo: pet.photo || '',
      medical_notes: pet.medical_notes || ''
    })
    setShowAddForm(true)
  }

  const handleDelete = async (petId: number) => {
    if (!confirm('Are you sure you want to delete this pet?')) return
    
    try {
      await query(
        'DELETE FROM newschema_dc467bff0dd042a6ad91584c00d8b304.pets WHERE id = $1',
        [petId]
      )
      addNotification({
        type: 'success',
        title: 'Success',
        message: 'Pet deleted successfully'
      })
      loadPets()
    } catch (error) {
      console.error('Error deleting pet:', error)
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to delete pet'
      })
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      species: 'dog',
      breed: '',
      age: '',
      weight: '',
      photo: '',
      medical_notes: ''
    })
    setShowAddForm(false)
    setEditingPet(null)
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Pets</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Manage your beloved companions
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="h-5 w-5" />
          <span>Add Pet</span>
        </button>
      </div>

      {/* Add/Edit Pet Form */}
      {showAddForm && (
        <div className="card p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            {editingPet ? 'Edit Pet' : 'Add New Pet'}
          </h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Pet Name
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input-field"
                placeholder="Enter pet name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Species
              </label>
              <select
                value={formData.species}
                onChange={(e) => setFormData({ ...formData, species: e.target.value })}
                className="input-field"
              >
                <option value="dog">Dog</option>
                <option value="cat">Cat</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Breed
              </label>
              <input
                type="text"
                value={formData.breed}
                onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
                className="input-field"
                placeholder="Enter breed"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Age (years)
              </label>
              <input
                type="number"
                min="0"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                className="input-field"
                placeholder="Enter age"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Weight (lbs)
              </label>
              <input
                type="number"
                min="0"
                step="0.1"
                value={formData.weight}
                onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                className="input-field"
                placeholder="Enter weight"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Photo URL
              </label>
              <input
                type="url"
                value={formData.photo}
                onChange={(e) => setFormData({ ...formData, photo: e.target.value })}
                className="input-field"
                placeholder="Enter photo URL"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Medical Notes
              </label>
              <textarea
                rows={3}
                value={formData.medical_notes}
                onChange={(e) => setFormData({ ...formData, medical_notes: e.target.value })}
                className="input-field"
                placeholder="Enter any medical notes or special conditions"
              />
            </div>

            <div className="md:col-span-2 flex space-x-4">
              <button type="submit" className="btn-primary">
                {editingPet ? 'Update Pet' : 'Add Pet'}
              </button>
              <button type="button" onClick={resetForm} className="btn-secondary">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Pets Grid */}
      {pets.length === 0 ? (
        <div className="card p-12 text-center">
          <Heart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No pets yet</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Add your first pet to start tracking their care and health.
          </p>
          <button
            onClick={() => setShowAddForm(true)}
            className="btn-primary"
          >
            Add Your First Pet
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pets.map((pet) => (
            <div key={pet.id} className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{pet.name}</h3>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(pet)}
                    className="p-2 text-gray-600 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(pet.id)}
                    className="p-2 text-gray-600 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {pet.photo ? (
                <img
                  src={pet.photo}
                  alt={pet.name}
                  className="w-full h-48 object-cover rounded-lg mb-4"
                />
              ) : (
                <div className="w-full h-48 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center mb-4">
                  <Camera className="h-12 w-12 text-gray-400" />
                </div>
              )}

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Species:</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">{pet.species}</span>
                </div>
                {pet.breed && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Breed:</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{pet.breed}</span>
                  </div>
                )}
                {pet.age && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Age:</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{pet.age} years</span>
                  </div>
                )}
                {pet.weight && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Weight:</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{pet.weight} lbs</span>
                  </div>
                )}
              </div>

              {pet.medical_notes && (
                <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    <strong>Medical Notes:</strong> {pet.medical_notes}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
