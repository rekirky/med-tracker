import { useState, useEffect } from 'react'
import UserSelector from './components/UserSelector'
import TodayChart from './components/TodayChart'
import History from './components/History'
import './App.css'

export default function App() {
  const [users, setUsers] = useState([])
  const [selectedUser, setSelectedUser] = useState(null)
  const [activeTab, setActiveTab] = useState('today')

  const fetchUsers = async () => {
    const res = await fetch('/api/users/')
    const data = await res.json()
    setUsers(data)
    if (data.length > 0 && !selectedUser) {
      setSelectedUser(data[0])
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const today = new Date()
  const dateStr = today.toLocaleDateString('en-AU', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  })

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-left">
          <img src="/icon.svg" alt="" className="header-icon" />
          <h1>Med Tracker</h1>
          <span className="date">{dateStr}</span>
        </div>
        <UserSelector
          users={users}
          selectedUser={selectedUser}
          onSelect={setSelectedUser}
          onUsersChanged={fetchUsers}
        />
      </header>

      {selectedUser ? (
        <>
          <nav className="tabs">
            <button
              className={activeTab === 'today' ? 'tab active' : 'tab'}
              onClick={() => setActiveTab('today')}
            >
              Today
            </button>
            <button
              className={activeTab === 'history' ? 'tab active' : 'tab'}
              onClick={() => setActiveTab('history')}
            >
              History
            </button>
          </nav>
          <main className="content">
            {activeTab === 'today' && <TodayChart user={selectedUser} />}
            {activeTab === 'history' && <History user={selectedUser} />}
          </main>
        </>
      ) : (
        <div className="empty-state">
          <p>No users yet.</p>
          <p>Add a user above to get started.</p>
        </div>
      )}
    </div>
  )
}
