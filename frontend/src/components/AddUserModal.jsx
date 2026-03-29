import { useState } from 'react'

export default function AddUserModal({ onClose, onSave }) {
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)

  const save = async () => {
    if (!name.trim()) return
    setSaving(true)
    const res = await fetch('/api/users/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim() }),
    })
    const newUser = await res.json()
    onSave(newUser)
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h2>Add User</h2>
        <label>Name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Sarah"
          onKeyDown={(e) => e.key === 'Enter' && save()}
          autoFocus
        />
        <div className="modal-footer">
          <div />
          <div className="modal-footer-right">
            <button className="btn-outline" onClick={onClose}>
              Cancel
            </button>
            <button className="btn-primary" onClick={save} disabled={!name.trim() || saving}>
              Add
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
