import { useState } from 'react'

export default function AddMedicationModal({ user, medication, onClose, onSave }) {
  const [name, setName] = useState(medication?.name ?? '')
  const [dosage, setDosage] = useState(medication?.dosage ?? '')
  const [times, setTimes] = useState(medication?.scheduled_times ?? [])
  const [newTime, setNewTime] = useState('')
  const [notes, setNotes] = useState(medication?.notes ?? '')
  const [saving, setSaving] = useState(false)

  const addTime = () => {
    if (newTime && !times.includes(newTime)) {
      setTimes([...times, newTime].sort())
      setNewTime('')
    }
  }

  const removeTime = (t) => setTimes(times.filter((x) => x !== t))

  const save = async () => {
    if (!name.trim()) return
    setSaving(true)
    const payload = {
      user_id: user.id,
      name: name.trim(),
      dosage: dosage.trim() || null,
      scheduled_times: times,
      notes: notes.trim() || null,
    }
    if (medication) {
      await fetch(`/api/medications/${medication.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    } else {
      await fetch('/api/medications/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    }
    onSave()
  }

  const removeMed = async () => {
    if (!confirm(`Remove ${medication.name} from ${user.name}'s chart?\n\nThis will not delete historical logs.`))
      return
    await fetch(`/api/medications/${medication.id}`, { method: 'DELETE' })
    onSave()
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h2>{medication ? 'Edit Medication' : 'Add Medication'}</h2>

        <label>Medication Name *</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Panadol"
          autoFocus
        />

        <label>Dosage</label>
        <input
          value={dosage}
          onChange={(e) => setDosage(e.target.value)}
          placeholder="e.g. 500mg, 2 tablets"
        />

        <label>Scheduled Times</label>
        <div className="time-input-row">
          <input
            type="time"
            value={newTime}
            onChange={(e) => setNewTime(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addTime()}
          />
          <button className="btn-outline" onClick={addTime} type="button">
            Add
          </button>
        </div>
        <div className="chips-row">
          {times.map((t) => (
            <span key={t} className="chip chip-removable">
              {t}
              <button onClick={() => removeTime(t)} type="button" title="Remove time">
                ×
              </button>
            </span>
          ))}
        </div>

        <label>Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. Take with food, morning only"
        />

        <div className="modal-footer">
          {medication ? (
            <button className="btn-danger" onClick={removeMed} type="button">
              Remove
            </button>
          ) : (
            <div />
          )}
          <div className="modal-footer-right">
            <button className="btn-outline" onClick={onClose} type="button">
              Cancel
            </button>
            <button
              className="btn-primary"
              onClick={save}
              disabled={!name.trim() || saving}
              type="button"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
