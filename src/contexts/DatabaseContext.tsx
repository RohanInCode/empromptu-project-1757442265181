import React, { createContext, useContext } from 'react'

interface DatabaseContextType {
  query: (sql: string, params?: any[]) => Promise<any>
  initializeDatabase: () => Promise<void>
}

const DatabaseContext = createContext<DatabaseContextType | undefined>(undefined)

export function DatabaseProvider({ children }: { children: React.ReactNode }) {
  const query = async (sql: string, params?: any[]) => {
    try {
      const response = await fetch('https://builder.empromptu.ai/api_tools/templates/call_postgres', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer f4e58b70cf1cdf144fac3601015ad581',
          'X-Generated-App-ID': 'dc467bff-0dd0-42a6-ad91-584c00d8b304',
          'X-Usage-Key': '3e10b66d5c974db5c729c66eaafdaaeb'
        },
        body: JSON.stringify({
          query: sql,
          params: params || []
        })
      })
      
      const result = await response.json()
      return result
    } catch (error) {
      console.error('Database query error:', error)
      throw error
    }
  }

  const initializeDatabase = async () => {
    const tables = [
      // Users table
      `CREATE TABLE IF NOT EXISTS newschema_dc467bff0dd042a6ad91584c00d8b304.users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        avatar TEXT,
        location VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // Pets table
      `CREATE TABLE IF NOT EXISTS newschema_dc467bff0dd042a6ad91584c00d8b304.pets (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES newschema_dc467bff0dd042a6ad91584c00d8b304.users(id),
        name VARCHAR(255) NOT NULL,
        species VARCHAR(50) NOT NULL,
        breed VARCHAR(255),
        age INTEGER,
        weight DECIMAL(5,2),
        photo TEXT,
        medical_notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // Vaccinations table
      `CREATE TABLE IF NOT EXISTS newschema_dc467bff0dd042a6ad91584c00d8b304.vaccinations (
        id SERIAL PRIMARY KEY,
        pet_id INTEGER REFERENCES newschema_dc467bff0dd042a6ad91584c00d8b304.pets(id),
        vaccine_name VARCHAR(255) NOT NULL,
        date_given DATE NOT NULL,
        next_due_date DATE,
        veterinarian VARCHAR(255),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // Grooming table
      `CREATE TABLE IF NOT EXISTS newschema_dc467bff0dd042a6ad91584c00d8b304.grooming (
        id SERIAL PRIMARY KEY,
        pet_id INTEGER REFERENCES newschema_dc467bff0dd042a6ad91584c00d8b304.pets(id),
        service_type VARCHAR(255) NOT NULL,
        date_completed DATE NOT NULL,
        next_scheduled_date DATE,
        groomer VARCHAR(255),
        cost DECIMAL(8,2),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // Appointments table
      `CREATE TABLE IF NOT EXISTS newschema_dc467bff0dd042a6ad91584c00d8b304.appointments (
        id SERIAL PRIMARY KEY,
        pet_id INTEGER REFERENCES newschema_dc467bff0dd042a6ad91584c00d8b304.pets(id),
        appointment_type VARCHAR(255) NOT NULL,
        appointment_date TIMESTAMP NOT NULL,
        veterinarian VARCHAR(255),
        clinic_name VARCHAR(255),
        address TEXT,
        phone VARCHAR(50),
        notes TEXT,
        status VARCHAR(50) DEFAULT 'scheduled',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // Community posts table
      `CREATE TABLE IF NOT EXISTS newschema_dc467bff0dd042a6ad91584c00d8b304.community_posts (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES newschema_dc467bff0dd042a6ad91584c00d8b304.users(id),
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        category VARCHAR(100),
        location VARCHAR(255),
        likes INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // Events table
      `CREATE TABLE IF NOT EXISTS newschema_dc467bff0dd042a6ad91584c00d8b304.events (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES newschema_dc467bff0dd042a6ad91584c00d8b304.users(id),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        event_date TIMESTAMP NOT NULL,
        location VARCHAR(255),
        max_attendees INTEGER,
        current_attendees INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // Marketplace products table
      `CREATE TABLE IF NOT EXISTS newschema_dc467bff0dd042a6ad91584c00d8b304.products (
        id SERIAL PRIMARY KEY,
        seller_id INTEGER REFERENCES newschema_dc467bff0dd042a6ad91584c00d8b304.users(id),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10,2) NOT NULL,
        category VARCHAR(100),
        condition VARCHAR(50),
        images TEXT[],
        location VARCHAR(255),
        status VARCHAR(50) DEFAULT 'available',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // Messages table
      `CREATE TABLE IF NOT EXISTS newschema_dc467bff0dd042a6ad91584c00d8b304.messages (
        id SERIAL PRIMARY KEY,
        sender_id INTEGER REFERENCES newschema_dc467bff0dd042a6ad91584c00d8b304.users(id),
        recipient_id INTEGER REFERENCES newschema_dc467bff0dd042a6ad91584c00d8b304.users(id),
        subject VARCHAR(255),
        content TEXT NOT NULL,
        read_status BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`
    ]

    for (const table of tables) {
      try {
        await query(table)
      } catch (error) {
        console.error('Error creating table:', error)
      }
    }
  }

  return (
    <DatabaseContext.Provider value={{ query, initializeDatabase }}>
      {children}
    </DatabaseContext.Provider>
  )
}

export function useDatabase() {
  const context = useContext(DatabaseContext)
  if (context === undefined) {
    throw new Error('useDatabase must be used within a DatabaseProvider')
  }
  return context
}
