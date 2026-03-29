import { useState, useEffect, useCallback } from 'react'
import AddMedicationModal from './AddMedicationModal'

function formatTime(isoStr) {
  if (!isoStr) return ''
  const d = new Date(isoStr)
  return d.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })
}

export default function TodayChart({ user }) {
  const [medications, setMedications] = useState([])
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(false)
  const [showAddMed, setShowAddMed] = useState(false)
  const [editMed, setEditMed] = useState(null)

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

  const closeModal = () => {
    setShowAddMed(false)
    setEditMed(null)
  }

  const saveModal = () => {
    closeModal()
    fetchData()
  }

  return (
    <div className="today-chart">
      {medications.length === 0 && (
        <div className="empty-state">
          <p>No medications on this chart.</p>
          <p>Add one below.</p>
        </div>
      )}

      {medications.map((med) => {
        const medLogs = getMedLogs(med.id)
        const takenCount = medLogs.length
        const scheduledCount = med.scheduled_times.length
        const fullyTaken = scheduledCount > 0 && takenCount >= scheduledCount
        const partiallyTaken = takenCount > 0 && !fullyTaken

        return (
          <div
            key={med.id}
            className={`med-card${fullyTaken ? ' fully-taken' : partiallyTaken ? ' partially-taken' : ''}`}
          >
            <div className="med-card-header">
              <div className="med-info">
                <span className="med-name">{med.name}</span>
                {med.dosage && <span className="med-dosage">{med.dosage}</span>}
              </div>
              <div className="med-actions-header">
                <button className="btn-icon" onClick={() => setEditMed(med)} title="Edit medication">
                  ✏️
                </button>
                <button
                  className="btn-take"
                  onClick={() => takeMed(med)}
                  disabled={loading}
                >
                  Take Now
                </button>
              </div>
            </div>

            {med.scheduled_times.length > 0 && (
              <div className="row">
                <span className="row-label">Scheduled</span>
                {med.scheduled_times.map((t) => (
                  <span key={t} className="chip chip-sched">
                    {t}
                  </span>
                ))}
              </div>
            )}

            {medLogs.length > 0 ? (
              <div className="row">
                <span className="row-label">Taken</span>
                {medLogs.map((log) => (
                  <span key={log.id} className="chip chip-taken">
                    {formatTime(log.taken_at)}
                    <button
                      className="undo-btn"
                      onClick={() => undoLog(log.id)}
                      title="Undo this log"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <div className="not-taken">Not taken today</div>
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
