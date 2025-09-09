import React, { useState } from 'react'
import { User, Mail, MapPin, Camera, Save } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useNotifications } from '../contexts/NotificationContext'

export default function Profile() {
  const { user } = useAuth()
  const { addNotification } = useNotifications()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    location: '',
    bio: '',
    avatar: user?.avatar || ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // In a real app, this would update the user profile in the database
    addNotification({
      type: 'success',
      title: 'Success',
      message: 'Profile updated successfully'
    })
    
    setIsEditing(false)
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Profile</h1>
        <p className="text-gray-600 dark:text-gray-300 mt-2">
          Manage your account settings and preferences
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <div className="card p-6 text-center">
            <div className="relative inline-block mb-4">
              {formData.avatar ? (
                <img
                  src={formData.avatar}
                  alt={formData.name}
                  className="w-24 h-24 rounded-full mx-auto"
                />
              ) : (
                <div className="w-24 h-24 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center mx-auto">
                  <User className="h-12 w-12 text-primary-600 dark:text-primary-400" />
                </div>
              )}
              {isEditing && (
                <button className="absolute bottom-0 right-0 p-2 bg-primary-600 text-white rounded-full hover:bg-primary-700">
                  <Camera className="h-4 w-4" />
                </button>
              )}
            </div>
            
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {formData.name}
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">{formData.email}</p>
            
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="btn-primary w-full"
              >
                Edit Profile
              </button>
            ) : (
              <div className="space-y-2">
                <button
                  onClick={handleSubmit}
                  className="btn-primary w-full flex items-center justify-center space-x-2"
                >
                  <Save className="h-4 w-4" />
                  <span>Save Changes</span>
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="btn-secondary w-full"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Profile Form */}
        <div className="lg:col-span-2">
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
              Personal Information
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    disabled={!isEditing}
                    className="input-field disabled:bg-gray-100 disabled:cursor-not-allowed dark:disabled:bg-gray-800"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    disabled={!isEditing}
                    className="input-field disabled:bg-gray-100 disabled:cursor-not-allowed dark:disabled:bg-gray-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  disabled={!isEditing}
                  placeholder="Enter your city and state"
                  className="input-field disabled:bg-gray-100 disabled:cursor-not-allowed dark:disabled:bg-gray-800"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Avatar URL
                </label>
                <input
                  type="url"
                  value={formData.avatar}
                  onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                  disabled={!isEditing}
                  placeholder="Enter avatar image URL"
                  className="input-field disabled:bg-gray-100 disabled:cursor-not-allowed dark:disabled:bg-gray-800"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Bio
                </label>
                <textarea
                  rows={4}
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  disabled={!isEditing}
                  placeholder="Tell us about yourself and your pets..."
                  className="input-field disabled:bg-gray-100 disabled:cursor-not-allowed dark:disabled:bg-gray-800"
                />
              </div>
            </form>
          </div>

          {/* Account Settings */}
          <div className="card p-6 mt-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
              Notification Preferences
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">Email Notifications</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Receive email reminders for appointments and vaccinations
                  </p>
                </div>
                <input
                  type="checkbox"
                  defaultChecked
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">Push Notifications</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Get push notifications for urgent reminders
                  </p>
                </div>
                <input
                  type="checkbox"
                  defaultChecked
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">Community Updates</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Stay updated on community posts and events
                  </p>
                </div>
                <input
                  type="checkbox"
                  defaultChecked
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">Marketplace Alerts</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Get notified about new products and messages
                  </p>
                </div>
                <input
                  type="checkbox"
                  defaultChecked
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
