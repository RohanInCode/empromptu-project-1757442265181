import React, { useState, useEffect } from 'react'
import { BookOpen, Search, Phone, AlertTriangle, Heart, Stethoscope } from 'lucide-react'

export default function Health() {
  const [articles, setArticles] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('all')

  const categories = [
    { id: 'all', name: 'All Topics' },
    { id: 'nutrition', name: 'Nutrition' },
    { id: 'exercise', name: 'Exercise' },
    { id: 'grooming', name: 'Grooming' },
    { id: 'behavior', name: 'Behavior' },
    { id: 'health', name: 'Health Issues' },
    { id: 'emergency', name: 'Emergency Care' }
  ]

  const emergencyContacts = [
    {
      name: 'Pet Poison Control',
      phone: '(888) 426-4435',
      description: '24/7 poison control hotline',
      type: 'emergency'
    },
    {
      name: 'Emergency Vet Clinic',
      phone: '(555) 123-4567',
      description: 'Local 24-hour emergency veterinary care',
      type: 'emergency'
    },
    {
      name: 'Animal Hospital',
      phone: '(555) 987-6543',
      description: 'General veterinary services',
      type: 'general'
    }
  ]

  const symptoms = [
    {
      symptom: 'Vomiting',
      severity: 'moderate',
      advice: 'Monitor for 24 hours. If persistent or accompanied by other symptoms, contact vet.',
      emergency: false
    },
    {
      symptom: 'Difficulty Breathing',
      severity: 'severe',
      advice: 'Seek immediate veterinary attention.',
      emergency: true
    },
    {
      symptom: 'Loss of Appetite',
      severity: 'mild',
      advice: 'Monitor for 24-48 hours. Ensure fresh water is available.',
      emergency: false
    },
    {
      symptom: 'Seizures',
      severity: 'severe',
      advice: 'Seek immediate emergency veterinary care.',
      emergency: true
    },
    {
      symptom: 'Lethargy',
      severity: 'moderate',
      advice: 'Monitor activity levels. Contact vet if persists more than 2 days.',
      emergency: false
    }
  ]

  const searchArticles = async () => {
    if (!searchQuery.trim()) return

    setLoading(true)
    try {
      const response = await fetch('https://builder.empromptu.ai/api_tools/rapid_research', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer f4e58b70cf1cdf144fac3601015ad581',
          'X-Generated-App-ID': 'dc467bff-0dd0-42a6-ad91-584c00d8b304',
          'X-Usage-Key': '3e10b66d5c974db5c729c66eaafdaaeb'
        },
        body: JSON.stringify({
          created_object_name: 'pet_health_articles',
          goal: `Find current information about ${searchQuery} for pet health and care, including symptoms, treatments, and prevention tips`
        })
      })

      const result = await response.json()
      if (result.value) {
        setArticles([{
          id: Date.now(),
          title: `${searchQuery} - Pet Health Information`,
          content: result.value,
          category: selectedCategory,
          timestamp: new Date().toISOString()
        }])
      }
    } catch (error) {
      console.error('Error searching articles:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    searchArticles()
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Pet Health Center</h1>
        <p className="text-gray-600 dark:text-gray-300 mt-2">
          Health information, symptom guidance, and emergency contacts
        </p>
      </div>

      {/* Emergency Contacts */}
      <div className="card p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <Phone className="h-6 w-6 text-red-600 mr-2" />
          Emergency Contacts
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {emergencyContacts.map((contact, index) => (
            <div key={index} className={`p-4 rounded-lg border-2 ${
              contact.type === 'emergency' 
                ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20' 
                : 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800'
            }`}>
              <h3 className="font-semibold text-gray-900 dark:text-white">{contact.name}</h3>
              <p className="text-lg font-bold text-primary-600 dark:text-primary-400">{contact.phone}</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">{contact.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Symptom Checker */}
      <div className="card p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <Stethoscope className="h-6 w-6 text-blue-600 mr-2" />
          Common Symptoms Guide
        </h2>
        <div className="space-y-4">
          {symptoms.map((item, index) => (
            <div key={index} className={`p-4 rounded-lg border-l-4 ${
              item.emergency 
                ? 'border-red-500 bg-red-50 dark:bg-red-900/20' 
                : item.severity === 'moderate'
                ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
                : 'border-green-500 bg-green-50 dark:bg-green-900/20'
            }`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white flex items-center">
                    {item.symptom}
                    {item.emergency && <AlertTriangle className="h-4 w-4 text-red-600 ml-2" />}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{item.advice}</p>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  item.severity === 'severe' 
                    ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    : item.severity === 'moderate'
                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                    : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                }`}>
                  {item.severity}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Article Search */}
      <div className="card p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <BookOpen className="h-6 w-6 text-green-600 mr-2" />
          Health Articles & Research
        </h2>
        
        <form onSubmit={handleSearch} className="mb-6">
          <div className="flex space-x-4">
            <div className="flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for pet health topics..."
                className="input-field"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="input-field w-48"
            >
              {categories.map(category => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
            <button
              type="submit"
              disabled={loading || !searchQuery.trim()}
              className="btn-primary flex items-center space-x-2 disabled:opacity-50"
            >
              <Search className="h-5 w-5" />
              <span>{loading ? 'Searching...' : 'Search'}</span>
            </button>
          </div>
        </form>

        {/* Search Results */}
        {articles.length > 0 && (
          <div className="space-y-4">
            {articles.map((article) => (
              <div key={article.id} className="p-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {article.title}
                </h3>
                <div className="prose dark:prose-invert max-w-none">
                  <div className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">
                    {article.content}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {articles.length === 0 && !loading && (
          <div className="text-center py-8">
            <Heart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Search for Health Information
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Enter a topic above to find current pet health articles and information.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
