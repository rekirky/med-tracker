import { useState } from 'react'

const FREQUENCY_OPTIONS = [
  { value: 'on-demand', label: 'On demand' },
  { value: 'daily',     label: 'Daily' },
  { value: '4h',        label: 'Every 4 hours' },
  { value: '6h',        label: 'Every 6 hours' },
]

export default function AddMedicationModal({ user, medication, onClose, onSave }) {
  const isEdit = !!medication

  const [name, setName]           = useState(medication?.name ?? '')
  const [dosage, setDosage]       = useState(medication?.dosage ?? '')
  const [frequency, setFrequency] = useState(medication?.frequency ?? 'on-demand')
  const [dailyTime, setDailyTime] = useState(medication?.daily_time ?? '')
  const [lastTaken, setLastTaken] = useState('')   // only shown when adding new
  const [notes, setNotes]         = useState(medication?.notes ?? '')
  const [isOptional, setIsOptional] = useState(medication?.is_optional ?? false)
  const [saving, setSaving]       = useState(false)

  const save = async () => {
    if (!name.trim()) return
    setSaving(true)
    const payload = {
      user_id: user.id,
      name: name.trim(),
      dosage: dosage.trim() || null,
      frequency,
      daily_time: frequency === 'daily' ? dailyTime || null : null,
      notes: notes.trim() || null,
      is_optional: isOptional,
      ...(!isEdit && { last_taken: lastTaken || null }),
    }
    if (isEdit) {
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
    if (!confirm(`Remove ${medication.name} from ${user.name}'s chart?\n\nHistorical logs will be kept.`))
      return
    await fetch(`/api/medications/${medication.id}`, { method: 'DELETE' })
    onSave()
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h2>{isEdit ? 'Edit Medication' : 'Add Medication'}</h2>

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
          placeholder="e.g. 2 tablets, 500mg"
        />

        <label>Frequency</label>
        <select
          value={frequency}
          onChange={(e) => setFrequency(e.target.value)}
          className="modal-select"
        >
          {FREQUENCY_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        {frequency === 'daily' && (
          <>
            <label>Daily Time *</label>
            <input
              type="time"
              value={dailyTime}
              onChange={(e) => setDailyTime(e.target.value)}
            />
          </>
        )}

        {!isEdit && (
          <>
            <label>Last Taken Today (optional)</label>
            <input
              type="time"
              value={lastTaken}
              onChange={(e) => setLastTaken(e.target.value)}
            />
            <p className="field-hint">
              Set this if the medication has already been taken today so the next-due time is accurate.
            </p>
          </>
        )}

        <label>Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. Take with food"
        />

        <div className="optional-toggle">
          <input
            type="checkbox"
            id="is-optional"
            checked={isOptional}
            onChange={(e) => setIsOptional(e.target.checked)}
          />
          <label htmlFor="is-optional" className="optional-toggle-label">
            Optional — take only when needed (won't show as overdue)
          </label>
        </div>

        <div className="modal-footer">
          {isEdit ? (
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
              disabled={!name.trim() || (frequency === 'daily' && !dailyTime) || saving}
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
