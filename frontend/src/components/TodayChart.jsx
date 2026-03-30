import { useState, useEffect, useCallback } from 'react'
import AddMedicationModal from './AddMedicationModal'

const FREQUENCY_LABEL = {
  'on-demand': 'On demand',
  'daily':     'Daily',
  '4h':        'Every 4h',
  '6h':        'Every 6h',
}

function formatTime(isoStr) {
  if (!isoStr) return ''
  return new Date(isoStr).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })
}

function formatTimeOfDay(hhmm) {
  if (!hhmm) return ''
  const [h, m] = hhmm.split(':').map(Number)
  const d = new Date()
  d.setHours(h, m, 0, 0)
  return d.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })
}

/**
 * Returns { status, label } for the next-due display.
 *
 * status: 'normal' | 'due-soon' | 'overdue' | 'taken' | 'on-demand'
 */
function getNextDue(med, medLogs) {
  const now = new Date()

  if (med.frequency === 'on-demand') {
    return { status: 'on-demand', label: 'On demand' }
  }

  if (med.frequency === 'daily') {
    if (!med.daily_time) return { status: 'normal', label: 'Daily' }

    const [h, m] = med.daily_time.split(':').map(Number)
    const dueAt = new Date()
    dueAt.setHours(h, m, 0, 0)

    // Taken any time today (including before the scheduled time)?
    const takenToday = medLogs.length > 0
    if (takenToday) return { status: 'taken', label: `Taken for today ✓` }

    const diffMin = Math.round((dueAt - now) / 60_000)
    if (diffMin > 30) return { status: 'normal',   label: `Due at ${formatTimeOfDay(med.daily_time)}` }
    if (diffMin >= 0) return { status: 'due-soon', label: `Due at ${formatTimeOfDay(med.daily_time)}` }
    return { status: 'overdue', label: `Overdue by ${Math.abs(diffMin)} min` }
  }

  // 4h or 6h
  const hours = med.frequency === '4h' ? 4 : 6
  if (medLogs.length === 0) {
    return { status: 'normal', label: `Every ${hours}h — not yet taken` }
  }

  const lastTaken = new Date(medLogs[medLogs.length - 1].taken_at)
  const nextDue = new Date(lastTaken.getTime() + hours * 3_600_000)
  const diffMin = Math.round((nextDue - now) / 60_000)

  if (diffMin > 30)  return { status: 'normal',   label: `Next due ${formatTime(nextDue.toISOString())}` }
  if (diffMin >= 0)  return { status: 'due-soon', label: `Due at ${formatTime(nextDue.toISOString())}` }
  if (med.is_optional) return { status: 'available', label: `Available since ${formatTime(nextDue.toISOString())}` }
  if (diffMin > -60) return { status: 'overdue',  label: `Overdue by ${Math.abs(diffMin)} min` }
  return { status: 'overdue', label: `Overdue by ${Math.abs(Math.round(diffMin / 60))}h ${Math.abs(diffMin % 60)}min` }
}

function statusToCardClass(status) {
  if (status === 'taken')     return ' fully-taken'
  if (status === 'overdue')   return ' overdue'
  if (status === 'due-soon')  return ' partially-taken'
  if (status === 'available') return ' available'
  return ''
}

export default function TodayChart({ user }) {
  const [medications, setMedications] = useState([])
  const [logs, setLogs]               = useState([])
  const [loading, setLoading]         = useState(false)
  const [showAddMed, setShowAddMed]   = useState(false)
  const [editMed, setEditMed]         = useState(null)

  const fetchData = useCallback(async () => {
    const [medsRes, logsRes] = await Promise.all([
      fetch(`/api/medications/user/${user.id}`),
      fetch(`/api/logs/user/${user.id}/today`),
    ])
    setMedications(await medsRes.json())
    setLogs(await logsRes.json())
  }, [user.id])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 60_000)
    return () => clearInterval(interval)
  }, [fetchData])

  const takeMed = async (med) => {
    setLoading(true)
    await fetch('/api/logs/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ medication_id: med.id, user_id: user.id }),
    })
    await fetchData()
    setLoading(false)
  }

  const undoLog = async (logId) => {
    await fetch(`/api/logs/${logId}`, { method: 'DELETE' })
    await fetchData()
  }

  const getMedLogs = (medId) => logs.filter((l) => l.medication_id === medId)

  const closeModal = () => { setShowAddMed(false); setEditMed(null) }
  const saveModal  = () => { closeModal(); fetchData() }

  return (
    <div className="today-chart">
      {medications.length === 0 && (
        <div className="empty-state">
          <p>No medications on this chart.</p>
          <p>Add one below.</p>
        </div>
      )}

      {medications.map((med) => {
        const medLogs  = getMedLogs(med.id)
        const nextDue  = getNextDue(med, medLogs)
        const cardClass = statusToCardClass(nextDue.status)

        return (
          <div key={med.id} className={`med-card${cardClass}`}>
            <div className="med-card-header">
              <div className="med-info">
                <span className="med-name">{med.name}</span>
                {med.dosage && <span className="med-dosage">{med.dosage}</span>}
                <span className="freq-badge">{FREQUENCY_LABEL[med.frequency] ?? med.frequency}</span>
                {med.is_optional && <span className="freq-badge optional-badge">OPTIONAL</span>}
              </div>
              <div className="med-actions-header">
                <button className="btn-icon" onClick={() => setEditMed(med)} title="Edit medication">
                  ✏️
                </button>
                <button className="btn-take" onClick={() => takeMed(med)} disabled={loading}>
                  Take Now
                </button>
              </div>
            </div>

            {/* Next due / status row */}
            <div className={`next-due next-due--${nextDue.status}`}>
              {nextDue.label}
            </div>

            {/* Taken today */}
            {medLogs.length > 0 && (
              <div className="row">
                <span className="row-label">Taken</span>
                {medLogs.map((log) => (
                  <span key={log.id} className="chip chip-taken">
                    {formatTime(log.taken_at)}
                    <button className="undo-btn" onClick={() => undoLog(log.id)} title="Undo">×</button>
                  </span>
                ))}
              </div>
            )}

            {med.notes && <div className="med-notes-text">{med.notes}</div>}
          </div>
        )
      })}

      <button className="btn-add-med" onClick={() => setShowAddMed(true)}>
        + Add Medication
      </button>

      {(showAddMed || editMed) && (
        <AddMedicationModal
          user={user}
          medication={editMed}
          onClose={closeModal}
          onSave={saveModal}
        />
      )}
    </div>
  )
}
