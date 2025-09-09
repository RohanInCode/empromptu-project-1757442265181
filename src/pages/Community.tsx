import React, { useState, useEffect } from 'react'
import { Plus, Users, Calendar, MessageCircle, MapPin, Heart } from 'lucide-react'
import { useDatabase } from '../contexts/DatabaseContext'
import { useAuth } from '../contexts/AuthContext'
import { useNotifications } from '../contexts/NotificationContext'
import { format, parseISO } from 'date-fns'

interface CommunityPost {
  id: number
  user_id: number
  user_name: string
  title: string
  content: string
  category: string
  location: string
  likes: number
  created_at: string
}

interface Event {
  id: number
  user_id: number
  user_name: string
  title: string
  description: string
  event_date: string
  location: string
  max_attendees: number
  current_attendees: number
  created_at: string
}

export default function Community() {
  const { query } = useDatabase()
  const { user } = useAuth()
  const { addNotification } = useNotifications()
  const [activeTab, setActiveTab] = useState<'posts' | 'events' | 'messages'>('posts')
  const [posts, setPosts] = useState<CommunityPost[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [showPostForm, setShowPostForm] = useState(false)
  const [showEventForm, setShowEventForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [postFormData, setPostFormData] = useState({
    title: '',
    content: '',
    category: 'general',
    location: ''
  })
  const [eventFormData, setEventFormData] = useState({
    title: '',
    description: '',
    event_date: '',
    event_time: '',
    location: '',
    max_attendees: ''
  })

  const categories = [
    { id: 'general', name: 'General Discussion' },
    { id: 'health', name: 'Health & Wellness' },
    { id: 'training', name: 'Training Tips' },
    { id: 'lost-found', name: 'Lost & Found' },
    { id: 'recommendations', name: 'Recommendations' },
    { id: 'playdates', name: 'Playdates' }
  ]

  useEffect(() => {
    loadCommunityData()
  }, [activeTab])

  const loadCommunityData = async () => {
    try {
      if (activeTab === 'posts') {
        const postsResult = await query(
          `SELECT p.*, u.name as user_name 
           FROM newschema_dc467bff0dd042a6ad91584c00d8b304.community_posts p
           JOIN newschema_dc467bff0dd042a6ad91584c00d8b304.users u ON p.user_id = u.id
           ORDER BY p.created_at DESC
           LIMIT 20`
        )
        setPosts(postsResult.data || [])
      } else if (activeTab === 'events') {
        const eventsResult = await query(
          `SELECT e.*, u.name as user_name 
           FROM newschema_dc467bff0dd042a6ad91584c00d8b304.events e
           JOIN newschema_dc467bff0dd042a6ad91584c00d8b304.users u ON e.user_id = u.id
           WHERE e.event_date >= NOW()
           ORDER BY e.event_date ASC
           LIMIT 20`
        )
        setEvents(eventsResult.data || [])
      }
    } catch (error) {
      console.error('Error loading community data:', error)
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to load community data'
      })
    } finally {
      setLoading(false)
    }
  }

  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      // First ensure user exists in database
      await query(
        `INSERT INTO newschema_dc467bff0dd042a6ad91584c00d8b304.users (id, email, name, avatar)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (email) DO UPDATE SET name = $3, avatar = $4`,
        [parseInt(user?.id || '1'), user?.email, user?.name, user?.avatar]
      )

      await query(
        `INSERT INTO newschema_dc467bff0dd042a6ad91584c00d8b304.community_posts 
         (user_id, title, content, category, location)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          parseInt(user?.id || '1'),
          postFormData.title,
          postFormData.content,
          postFormData.category,
          postFormData.location
        ]
      )
      
      addNotification({
        type: 'success',
        title: 'Success',
        message: 'Post created successfully'
      })
      
      resetPostForm()
      loadCommunityData()
    } catch (error) {
      console.error('Error creating post:', error)
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to create post'
      })
    }
  }

  const handleEventSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const eventDateTime = `${eventFormData.event_date}T${eventFormData.event_time}:00`
      
      // First ensure user exists in database
      await query(
        `INSERT INTO newschema_dc467bff0dd042a6ad91584c00d8b304.users (id, email, name, avatar)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (email) DO UPDATE SET name = $3, avatar = $4`,
        [parseInt(user?.id || '1'), user?.email, user?.name, user?.avatar]
      )

      await query(
        `INSERT INTO newschema_dc467bff0dd042a6ad91584c00d8b304.events 
         (user_id, title, description, event_date, location, max_attendees)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          parseInt(user?.id || '1'),
          eventFormData.title,
          eventFormData.description,
          eventDateTime,
          eventFormData.location,
          parseInt(eventFormData.max_attendees) || null
        ]
      )
      
      addNotification({
        type: 'success',
        title: 'Success',
        message: 'Event created successfully'
      })
      
      resetEventForm()
      loadCommunityData()
    } catch (error) {
      console.error('Error creating event:', error)
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to create event'
      })
    }
  }

  const likePost = async (postId: number) => {
    try {
      await query(
        'UPDATE newschema_dc467bff0dd042a6ad91584c00d8b304.community_posts SET likes = likes + 1 WHERE id = $1',
        [postId]
      )
      loadCommunityData()
    } catch (error) {
      console.error('Error liking post:', error)
    }
  }

  const resetPostForm = () => {
    setPostFormData({
      title: '',
      content: '',
      category: 'general',
      location: ''
    })
    setShowPostForm(false)
  }

  const resetEventForm = () => {
    setEventFormData({
      title: '',
      description: '',
      event_date: '',
      event_time: '',
      location: '',
      max_attendees: ''
    })
    setShowEventForm(false)
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Community</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Connect with local pet owners and share experiences
          </p>
        </div>
        <div className="flex space-x-2">
          {activeTab === 'posts' && (
            <button
              onClick={() => setShowPostForm(true)}
              className="btn-primary flex items-center space-x-2"
            >
              <Plus className="h-5 w-5" />
              <span>New Post</span>
            </button>
          )}
          {activeTab === 'events' && (
            <button
              onClick={() => setShowEventForm(true)}
              className="btn-primary flex items-center space-x-2"
            >
              <Plus className="h-5 w-5" />
              <span>Create Event</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'posts', name: 'Posts', icon: MessageCircle },
            { id: 'events', name: 'Events', icon: Calendar },
            { id: 'messages', name: 'Messages', icon: Users }
          ].map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{tab.name}</span>
              </button>
            )
          })}
        </nav>
      </div>

      {/* Post Form */}
      {showPostForm && (
        <div className="card p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Create New Post
          </h2>
          <form onSubmit={handlePostSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Title
              </label>
              <input
                type="text"
                required
                value={postFormData.title}
                onChange={(e) => setPostFormData({ ...postFormData, title: e.target.value })}
                className="input-field"
                placeholder="Enter post title"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Category
                </label>
                <select
                  value={postFormData.category}
                  onChange={(e) => setPostFormData({ ...postFormData, category: e.target.value })}
                  className="input-field"
                >
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  value={postFormData.location}
                  onChange={(e) => setPostFormData({ ...postFormData, location: e.target.value })}
                  className="input-field"
                  placeholder="Enter location"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Content
              </label>
              <textarea
                rows={4}
                required
                value={postFormData.content}
                onChange={(e) => setPostFormData({ ...postFormData, content: e.target.value })}
                className="input-field"
                placeholder="Share your thoughts..."
              />
            </div>

            <div className="flex space-x-4">
              <button type="submit" className="btn-primary">
                Create Post
              </button>
              <button type="button" onClick={resetPostForm} className="btn-secondary">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Event Form */}
      {showEventForm && (
        <div className="card p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Create New Event
          </h2>
          <form onSubmit={handleEventSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Event Title
              </label>
              <input
                type="text"
                required
                value={eventFormData.title}
                onChange={(e) => setEventFormData({ ...eventFormData, title: e.target.value })}
                className="input-field"
                placeholder="Enter event title"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Date
                </label>
                <input
                  type="date"
                  required
                  value={eventFormData.event_date}
                  onChange={(e) => setEventFormData({ ...eventFormData, event_date: e.target.value })}
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
                  value={eventFormData.event_time}
                  onChange={(e) => setEventFormData({ ...eventFormData, event_time: e.target.value })}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Max Attendees
                </label>
                <input
                  type="number"
                  min="1"
                  value={eventFormData.max_attendees}
                  onChange={(e) => setEventFormData({ ...eventFormData, max_attendees: e.target.value })}
                  className="input-field"
                  placeholder="Optional"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Location
              </label>
              <input
                type="text"
                required
                value={eventFormData.location}
                onChange={(e) => setEventFormData({ ...eventFormData, location: e.target.value })}
                className="input-field"
                placeholder="Enter event location"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <textarea
                rows={4}
                value={eventFormData.description}
                onChange={(e) => setEventFormData({ ...eventFormData, description: e.target.value })}
                className="input-field"
                placeholder="Describe your event..."
              />
            </div>

            <div className="flex space-x-4">
              <button type="submit" className="btn-primary">
                Create Event
              </button>
              <button type="button" onClick={resetEventForm} className="btn-secondary">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <>
          {/* Posts Tab */}
          {activeTab === 'posts' && (
            <div className="space-y-6">
              {posts.length === 0 ? (
                <div className="card p-12 text-center">
                  <MessageCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No posts yet</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-6">
                    Be the first to share something with the community!
                  </p>
                  <button
                    onClick={() => setShowPostForm(true)}
                    className="btn-primary"
                  >
                    Create First Post
                  </button>
                </div>
              ) : (
                posts.map((post) => (
                  <div key={post.id} className="card p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                          <Users className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">{post.user_name}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {format(parseISO(post.created_at), 'MMM dd, yyyy')}
                          </p>
                        </div>
                      </div>
                      <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-medium rounded">
                        {categories.find(c => c.id === post.category)?.name || post.category}
                      </span>
                    </div>

                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{post.title}</h2>
                    <p className="text-gray-700 dark:text-gray-300 mb-4">{post.content}</p>

                    {post.location && (
                      <div className="flex items-center space-x-1 text-sm text-gray-600 dark:text-gray-400 mb-4">
                        <MapPin className="h-4 w-4" />
                        <span>{post.location}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => likePost(post.id)}
                        className="flex items-center space-x-2 text-gray-600 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
                      >
                        <Heart className="h-5 w-5" />
                        <span>{post.likes} likes</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Events Tab */}
          {activeTab === 'events' && (
            <div className="space-y-6">
              {events.length === 0 ? (
                <div className="card p-12 text-center">
                  <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No upcoming events</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-6">
                    Create an event to bring pet owners together!
                  </p>
                  <button
                    onClick={() => setShowEventForm(true)}
                    className="btn-primary"
                  >
                    Create First Event
                  </button>
                </div>
              ) : (
                events.map((event) => (
                  <div key={event.id} className="card p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                          <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">{event.user_name}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Event organizer</p>
                        </div>
                      </div>
                      <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs font-medium rounded">
                        {format(parseISO(event.event_date), 'MMM dd, h:mm a')}
                      </span>
                    </div>

                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{event.title}</h2>
                    {event.description && (
                      <p className="text-gray-700 dark:text-gray-300 mb-4">{event.description}</p>
                    )}

                    <div className="flex items-center space-x-1 text-sm text-gray-600 dark:text-gray-400 mb-4">
                      <MapPin className="h-4 w-4" />
                      <span>{event.location}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {event.max_attendees ? (
                          <span>{event.current_attendees}/{event.max_attendees} attendees</span>
                        ) : (
                          <span>{event.current_attendees} attendees</span>
                        )}
                      </div>
                      <button className="btn-primary text-sm">
                        Join Event
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Messages Tab */}
          {activeTab === 'messages' && (
            <div className="card p-12 text-center">
              <MessageCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Messages Coming Soon</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Direct messaging between community members will be available soon.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
