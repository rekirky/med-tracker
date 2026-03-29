import { useState } from 'react'

export default function AddUserModal({ onClose, onSave }) {
  const [name, setName] = useState('')
  const [gender, setGender] = useState('')
  const [saving, setSaving] = useState(false)

  const save = async () => {
    if (!name.trim()) return
    setSaving(true)
    const res = await fetch('/api/users/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), gender: gender || null }),
    })
    const newUser = await res.json()
    onSave(newUser)
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h2>Add User</h2>

        <label>Name *</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Sarah"
          onKeyDown={(e) => e.key === 'Enter' && save()}
          autoFocus
        />

        <label>Gender</label>
        <select
          value={gender}
          onChange={(e) => setGender(e.target.value)}
          className="modal-select"
        >
          <option value="">Prefer not to say</option>
          <option value="female">Female</option>
          <option value="male">Male</option>
        </select>

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
