import { useState } from 'react'
import AddUserModal from './AddUserModal'

export default function UserSelector({ users, selectedUser, onSelect, onUsersChanged }) {
  const [showAddUser, setShowAddUser] = useState(false)

  return (
    <div className="user-selector">
      {users.length > 0 && (
        <select
          value={selectedUser?.id ?? ''}
          onChange={(e) => {
            const user = users.find((u) => u.id === parseInt(e.target.value))
            onSelect(user)
          }}
        >
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </select>
      )}
      <button className="btn-outline" onClick={() => setShowAddUser(true)}>
        + Add User
      </button>

      {showAddUser && (
        <AddUserModal
          onClose={() => setShowAddUser(false)}
          onSave={(newUser) => {
            setShowAddUser(false)
            onUsersChanged()
            if (newUser) onSelect(newUser)
          }}
        />
      )}
    </div>
  )
}
