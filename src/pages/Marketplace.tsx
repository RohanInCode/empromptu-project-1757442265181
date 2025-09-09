import React, { useState, useEffect } from 'react'
import { Plus, ShoppingBag, Search, Filter, MapPin, DollarSign } from 'lucide-react'
import { useDatabase } from '../contexts/DatabaseContext'
import { useAuth } from '../contexts/AuthContext'
import { useNotifications } from '../contexts/NotificationContext'
import { format, parseISO } from 'date-fns'

interface Product {
  id: number
  seller_id: number
  seller_name: string
  name: string
  description: string
  price: number
  category: string
  condition: string
  images: string[]
  location: string
  status: string
  created_at: string
}

export default function Marketplace() {
  const { query } = useDatabase()
  const { user } = useAuth()
  const { addNotification } = useNotifications()
  const [products, setProducts] = useState<Product[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: 'food',
    condition: 'new',
    images: '',
    location: ''
  })

  const categories = [
    { id: 'all', name: 'All Categories' },
    { id: 'food', name: 'Food & Treats' },
    { id: 'toys', name: 'Toys' },
    { id: 'accessories', name: 'Accessories' },
    { id: 'grooming', name: 'Grooming Supplies' },
    { id: 'health', name: 'Health & Medicine' },
    { id: 'furniture', name: 'Pet Furniture' },
    { id: 'clothing', name: 'Pet Clothing' },
    { id: 'other', name: 'Other' }
  ]

  const conditions = [
    { id: 'new', name: 'New' },
    { id: 'like-new', name: 'Like New' },
    { id: 'good', name: 'Good' },
    { id: 'fair', name: 'Fair' }
  ]

  useEffect(() => {
    loadProducts()
  }, [selectedCategory, searchQuery])

  const loadProducts = async () => {
    try {
      let sql = `
        SELECT p.*, u.name as seller_name 
        FROM newschema_dc467bff0dd042a6ad91584c00d8b304.products p
        JOIN newschema_dc467bff0dd042a6ad91584c00d8b304.users u ON p.seller_id = u.id
        WHERE p.status = 'available'
      `
      const params: any[] = []

      if (selectedCategory !== 'all') {
        sql += ' AND p.category = $' + (params.length + 1)
        params.push(selectedCategory)
      }

      if (searchQuery.trim()) {
        sql += ' AND (p.name ILIKE $' + (params.length + 1) + ' OR p.description ILIKE $' + (params.length + 1) + ')'
        params.push(`%${searchQuery}%`)
      }

      sql += ' ORDER BY p.created_at DESC LIMIT 50'

      const result = await query(sql, params)
      setProducts(result.data || [])
    } catch (error) {
      console.error('Error loading products:', error)
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to load products'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      // First ensure user exists in database
      await query(
        `INSERT INTO newschema_dc467bff0dd042a6ad91584c00d8b304.users (id, email, name, avatar)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (email) DO UPDATE SET name = $3, avatar = $4`,
        [parseInt(user?.id || '1'), user?.email, user?.name, user?.avatar]
      )

      const images = formData.images.split(',').map(img => img.trim()).filter(img => img)
      
      await query(
        `INSERT INTO newschema_dc467bff0dd042a6ad91584c00d8b304.products 
         (seller_id, name, description, price, category, condition, images, location, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          parseInt(user?.id || '1'),
          formData.name,
          formData.description,
          parseFloat(formData.price),
          formData.category,
          formData.condition,
          images,
          formData.location,
          'available'
        ]
      )
      
      addNotification({
        type: 'success',
        title: 'Success',
        message: 'Product listed successfully'
      })
      
      resetForm()
      loadProducts()
    } catch (error) {
      console.error('Error creating product:', error)
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to list product'
      })
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      category: 'food',
      condition: 'new',
      images: '',
      location: ''
    })
    setShowAddForm(false)
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Marketplace</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Buy and sell pet products with local pet owners
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="h-5 w-5" />
          <span>List Product</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="card p-6">
        <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="input-field pl-10"
              />
            </div>
          </div>
          <div className="w-full md:w-48">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="input-field"
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Add Product Form */}
      {showAddForm && (
        <div className="card p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            List New Product
          </h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Product Name
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input-field"
                placeholder="Enter product name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Price ($)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                required
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="input-field"
                placeholder="Enter price"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="input-field"
              >
                {categories.slice(1).map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Condition
              </label>
              <select
                value={formData.condition}
                onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                className="input-field"
              >
                {conditions.map((condition) => (
                  <option key={condition.id} value={condition.id}>{condition.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Location
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="input-field"
                placeholder="Enter your location"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Image URLs (comma separated)
              </label>
              <input
                type="text"
                value={formData.images}
                onChange={(e) => setFormData({ ...formData, images: e.target.value })}
                className="input-field"
                placeholder="Enter image URLs separated by commas"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <textarea
                rows={4}
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="input-field"
                placeholder="Describe your product..."
              />
            </div>

            <div className="md:col-span-2 flex space-x-4">
              <button type="submit" className="btn-primary">
                List Product
              </button>
              <button type="button" onClick={resetForm} className="btn-secondary">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Products Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : products.length === 0 ? (
        <div className="card p-12 text-center">
          <ShoppingBag className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No products found</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            {searchQuery || selectedCategory !== 'all' 
              ? 'Try adjusting your search or filters.'
              : 'Be the first to list a product in the marketplace!'
            }
          </p>
          {!searchQuery && selectedCategory === 'all' && (
            <button
              onClick={() => setShowAddForm(true)}
              className="btn-primary"
            >
              List First Product
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <div key={product.id} className="card p-6">
              {product.images && product.images.length > 0 ? (
                <img
                  src={product.images[0]}
                  alt={product.name}
                  className="w-full h-48 object-cover rounded-lg mb-4"
                />
              ) : (
                <div className="w-full h-48 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center mb-4">
                  <ShoppingBag className="h-12 w-12 text-gray-400" />
                </div>
              )}

              <div className="flex items-start justify-between mb-2">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{product.name}</h3>
                <div className="flex items-center text-green-600 dark:text-green-400">
                  <DollarSign className="h-4 w-4" />
                  <span className="font-bold">{product.price}</span>
                </div>
              </div>

              <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-3">
                {product.description}
              </p>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Category:</span>
                  <span className="font-medium text-gray-900 dark:text-white capitalize">
                    {categories.find(c => c.id === product.category)?.name || product.category}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Condition:</span>
                  <span className="font-medium text-gray-900 dark:text-white capitalize">
                    {conditions.find(c => c.id === product.condition)?.name || product.condition}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Seller:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{product.seller_name}</span>
                </div>
              </div>

              {product.location && (
                <div className="flex items-center space-x-1 text-sm text-gray-600 dark:text-gray-400 mb-4">
                  <MapPin className="h-4 w-4" />
                  <span>{product.location}</span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Listed {format(parseISO(product.created_at), 'MMM dd')}
                </span>
                <button className="btn-primary text-sm">
                  Contact Seller
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
