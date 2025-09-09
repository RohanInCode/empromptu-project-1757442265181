import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { 
  Home, 
  Heart, 
  Syringe, 
  Scissors, 
  Calendar, 
  BookOpen, 
  Users, 
  ShoppingBag, 
  User,
  Moon,
  Sun,
  LogOut
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

interface NavbarProps {
  darkMode: boolean
  toggleDarkMode: () => void
}

export default function Navbar({ darkMode, toggleDarkMode }: NavbarProps) {
  const location = useLocation()
  const { user, logout } = useAuth()

  const navigation = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'My Pets', href: '/pets', icon: Heart },
    { name: 'Vaccinations', href: '/vaccinations', icon: Syringe },
    { name: 'Grooming', href: '/grooming', icon: Scissors },
    { name: 'Appointments', href: '/appointments', icon: Calendar },
    { name: 'Health', href: '/health', icon: BookOpen },
    { name: 'Community', href: '/community', icon: Users },
    { name: 'Marketplace', href: '/marketplace', icon: ShoppingBag },
  ]

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-lg border-b border-gray-200 dark:border-gray-700">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <Link to="/" className="flex items-center space-x-2">
              <Heart className="h-8 w-8 text-primary-600" />
              <span className="text-xl font-bold text-gray-900 dark:text-white">PawCare</span>
            </Link>
            
            <div className="hidden md:flex space-x-4">
              {navigation.map((item) => {
                const Icon = item.icon
                const isActive = location.pathname === item.href
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center space-x-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                        : 'text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </Link>
                )
              })}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
              aria-label="Toggle dark mode"
            >
              {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            
            <Link
              to="/profile"
              className="flex items-center space-x-2 p-2 rounded-lg text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <User className="h-5 w-5" />
              <span className="hidden md:inline">{user?.name}</span>
            </Link>
            
            <button
              onClick={logout}
              className="p-2 rounded-lg text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
              aria-label="Logout"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}
