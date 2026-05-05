import { useState } from 'react'

function parseFreqToState(freq) {
  if (!freq || freq === 'on-demand') return { type: 'on-demand', value: 1 }
  if (freq === 'daily') return { type: 'day', value: 1 }
  const h = freq.match(/^(\d+)h$/)
  if (h) return { type: 'hour', value: parseInt(h[1]) }
  const d = freq.match(/^(\d+)d$/)
  if (d) return { type: 'day', value: parseInt(d[1]) }
  return { type: 'on-demand', value: 1 }
}

function buildFreq(type, value) {
  if (type === 'on-demand') return 'on-demand'
  return `${value}${type === 'hour' ? 'h' : 'd'}`
}

export default function AddMedicationModal({ user, medication, onClose, onSave }) {
  const isEdit = !!medication
  const initFreq = parseFreqToState(medication?.frequency)

  const [name, setName]         = useState(medication?.name ?? '')
  const [dosage, setDosage]     = useState(medication?.dosage ?? '')
  const [freqType, setFreqType] = useState(initFreq.type)
  const [freqValue, setFreqValue] = useState(initFreq.value)
  const [lastTaken, setLastTaken] = useState('')
  const [notes, setNotes]       = useState(medication?.notes ?? '')
  const [isOptional, setIsOptional] = useState(medication?.is_optional ?? false)
  const [saving, setSaving]     = useState(false)

  const frequency = buildFreq(freqType, freqValue)

  const save = async () => {
    if (!name.trim()) return
    setSaving(true)
    const payload = {
      user_id: user.id,
      name: name.trim(),
      dosage: dosage.trim() || null,
      frequency,
      daily_time: null,
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

  const setFreqValueSafe = (v) => setFreqValue(Math.max(1, parseInt(v) || 1))

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
        <div className="freq-row">
          <select
            value={freqType}
            onChange={(e) => setFreqType(e.target.value)}
            className="modal-select freq-row-select"
          >
            <option value="on-demand">On demand</option>
            <option value="hour">Every N hours</option>
            <option value="day">Every N days</option>
          </select>
          {freqType !== 'on-demand' && (
            <input
              type="number"
              min="1"
              max="99"
              value={freqValue}
              onChange={(e) => setFreqValueSafe(e.target.value)}
              className="freq-value-input"
            />
          )}
        </div>

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
