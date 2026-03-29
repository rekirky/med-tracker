import { useState, useEffect } from 'react'

function formatTime(isoStr) {
  if (!isoStr) return ''
  const d = new Date(isoStr)
  return d.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })
}

export default function History({ user }) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [logs, setLogs] = useState([])

  useEffect(() => {
    fetch(`/api/logs/user/${user.id}/date/${date}`)
      .then((r) => r.json())
      .then(setLogs)
  }, [user.id, date])

  // Group by medication name (preserving medication_name from log record)
  const grouped = logs.reduce((acc, log) => {
    const key = log.medication_name
    if (!acc[key]) acc[key] = []
    acc[key].push(log)
    return acc
  }, {})

  const total = logs.length
  const medCount = Object.keys(grouped).length

  return (
    <div>
      <div className="history-header">
        <label>Date</label>
        <input
          type="date"
          value={date}
          max={new Date().toISOString().split('T')[0]}
          onChange={(e) => setDate(e.target.value)}
        />
        {total > 0 && (
          <span style={{ color: '#64748b', fontSize: '0.85rem' }}>
            {total} dose{total !== 1 ? 's' : ''} across {medCount} medication{medCount !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {Object.keys(grouped).length === 0 ? (
        <div className="empty-state">
          <p>No medications recorded for this date.</p>
        </div>
      ) : (
        Object.entries(grouped).map(([medName, medLogs]) => (
          <div key={medName} className="history-card">
            <h3>{medName}</h3>
            <div className="row">
              {medLogs.map((log) => (
                <span key={log.id} className="chip chip-taken">
                  {formatTime(log.taken_at)}
                </span>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
