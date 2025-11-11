import React, { useEffect, useRef, useState } from 'react'

const DATA = [
  {
    category: 'Electronics Basics',
    clues: [
      { value: 100, q: 'Stores electrical charge.', a: 'Capacitor' },
      { value: 200, q: 'Total voltage around a closed loop equals sum of drops.', a: 'Kirchhoff\'s Voltage Law (KVL)' },
      { value: 300, q: 'Capacitors in series result in total capacitance becoming less than smallest.', a: 'Reciprocal formula (1/Ct = 1/C1 + 1/C2...)' },
      { value: 400, q: 'The part of a MOSFET that controls flow.', a: 'Gate' },
      { value: 500, q: 'Opposition to voltage or current change in AC circuits.', a: 'Reactance' }
    ]
  },
  {
    category: 'Microcontrollers & Boards',
    clues: [
      { value: 100, q: 'Arduino boards are programmed using this.', a: 'Arduino C/C++' },
      { value: 200, q: 'ESP32 runs on this CPU architecture.', a: 'Xtensa LX6' },
      { value: 300, q: 'Pin used on ESP32-CAM to enter flashing mode.', a: 'GPIO0' },
      { value: 400, q: 'Raspberry Pi GPIO operates at this logic level.', a: '3.3V' },
      { value: 500, q: 'Single program running directly without OS is called this model.', a: 'Bare-metal programming' }
    ]
  },
  {
    category: 'Sensors & Inputs',
    clues: [
      { value: 100, q: 'Detects light intensity.', a: 'LDR' },
      { value: 200, q: 'Ultrasonic sensors are inaccurate on soft surfaces because sound waves do this.', a: 'Get absorbed' },
      { value: 300, q: 'PIR detects sudden changes in this.', a: 'Infrared radiation' },
      { value: 400, q: 'Sensor with accelerometer + gyroscope.', a: 'MPU6050' },
      { value: 500, q: 'Required when two I²C devices share same address.', a: 'I²C multiplexer' }
    ]
  },
  {
    category: 'Networking & IoT',
    clues: [
      { value: 100, q: 'IoT stands for this.', a: 'Internet of Things' },
      { value: 200, q: 'MQTT QoS level ensuring exact once delivery.', a: 'QoS 2' },
      { value: 300, q: 'IPv6 uses this many bits.', a: '128 bits' },
      { value: 400, q: 'MQTT keeps connection open using this mechanism.', a: 'Persistent TCP connection' },
      { value: 500, q: 'LoRa long-range tradeoff parameter lost when range increases.', a: 'Data rate' }
    ]
  },
  {
    category: 'Power & Safety',
    clues: [
      { value: 100, q: 'Common 18650 battery type.', a: 'Lithium-ion' },
      { value: 200, q: 'TP4056 variant supports this feature.', a: 'Overcharge/discharge protection' },
      { value: 300, q: '7805 voltage regulator wastes excess voltage as this.', a: 'Heat' },
      { value: 400, q: 'Sudden voltage drop triggers ESP32 to do this.', a: 'Brown-out reset' },
      { value: 500, q: 'Li-ion cells get permanently damaged if below this voltage.', a: '2.7V–3.0V' }
    ]
  },
  {
    category: 'Disco Tech (Fun)',
    clues: [
      { value: 100, q: 'Individually addressable LED strip.', a: 'WS2812B / NeoPixel' },
      { value: 200, q: 'Driving too many LEDs directly can cause this.', a: 'GPIO pin overcurrent damage' },
      { value: 300, q: 'LED FPS is limited by this.', a: 'Data signal frequency (800 kHz)' },
      { value: 400, q: 'FFT converts signal to this domain.', a: 'Frequency domain' },
      { value: 500, q: 'Used in sound-reactive systems to avoid flicker.', a: 'Moving average' }
    ]
  }
]

const SESSION_KEY = 'jeopardy_revealed_tiles'
const SESSION_TEAMS_KEY = 'jeopardy_teams'
const SESSION_SETUP_KEY = 'jeopardy_setup_complete'

function SetupForm({ onStart }) {
  const [num, setNum] = useState(2)
  return (
    <div>
      <input
        type="number"
        min="1"
        max="20"
        value={num}
        onChange={e => setNum(e.target.value)}
        style={{ width: 80, marginRight: 8 }}
      />
      <button onClick={() => onStart(num)}>Start</button>
    </div>
  )
}

export default function App() {
  const [revealed, setRevealed] = useState(() => {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY)
      return raw ? JSON.parse(raw) : {}
    } catch (e) {
      return {}
    }
  })

  const [modal, setModal] = useState({ open: false, cat: null, row: null })
  const [showAnswer, setShowAnswer] = useState(false)
  const [seconds, setSeconds] = useState(60)
  const [timedOut, setTimedOut] = useState(false)
  const timerRef = useRef(null)
  // Teams and setup state
  const [setupComplete, setSetupComplete] = useState(() => {
    try {
      return sessionStorage.getItem(SESSION_SETUP_KEY) === 'true'
    } catch (e) {
      return false
    }
  })

  const [teams, setTeams] = useState(() => {
    try {
      const raw = sessionStorage.getItem(SESSION_TEAMS_KEY)
      return raw ? JSON.parse(raw) : []
    } catch (e) {
      return []
    }
  })

  useEffect(() => {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(revealed))
  }, [revealed])

  // persist teams and setup state
  useEffect(() => {
    try {
      sessionStorage.setItem(SESSION_TEAMS_KEY, JSON.stringify(teams))
      sessionStorage.setItem(SESSION_SETUP_KEY, setupComplete ? 'true' : 'false')
    } catch (e) {
      // ignore
    }
  }, [teams, setupComplete])

  useEffect(() => {
    if (!modal.open) {
      stopTimer()
      setShowAnswer(false)
      setSeconds(60)
      setTimedOut(false)
    }
  }, [modal.open])

  useEffect(() => {
    if (modal.open) startTimer()
    return () => stopTimer()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modal.open])

  function startTimer() {
    stopTimer()
    setSeconds(60)
    setTimedOut(false)
    timerRef.current = setInterval(() => {
      setSeconds(s => {
        if (s <= 1) {
          clearInterval(timerRef.current)
          setTimedOut(true)
          return 0
        }
        return s - 1
      })
    }, 1000)
  }

  function stopTimer() {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }

  function tileKey(c, r) {
    return `c${c}r${r}`
  }

  function handleTileClick(c, r) {
    const key = tileKey(c, r)
    // mark revealed immediately
    setRevealed(prev => ({ ...prev, [key]: true }))
    setModal({ open: true, cat: c, row: r })
  }

  function handleRevealAnswer() {
    setShowAnswer(true)
    stopTimer()
  }

  function closeModal() {
    setModal({ open: false, cat: null, row: null })
  }

  // -- Teams related handlers --
  function startSetup(numTeams) {
    const n = Math.max(1, Math.min(20, Number(numTeams) || 2))
    const initial = Array.from({ length: n }, (_, i) => ({ id: i, name: `Team ${i + 1}`, score: 0 }))
    setTeams(initial)
    setSetupComplete(true)
  }

  function updateTeamScore(index, delta) {
    setTeams(t => {
      const copy = t.slice()
      if (!copy[index]) return copy
      copy[index] = { ...copy[index], score: (copy[index].score || 0) + delta }
      return copy
    })
  }

  function startEditName(index) {
    setTeams(t => t.map((tm, i) => (i === index ? { ...tm, editing: true } : tm)))
  }

  function commitName(index, newName) {
    setTeams(t => t.map((tm, i) => (i === index ? { ...tm, name: newName || tm.name, editing: false } : tm)))
  }

  function handleNameKey(e, index) {
    if (e.key === 'Enter') {
      commitName(index, e.target.value.trim())
    }
  }

  return (
    <div className="app">
  <h1 className="sixtyfour-disco disco-title">Disco Dome</h1>
  {/* decorative second disco ball element (purely visual) */}
  <div className="disco-ball" aria-hidden="true" />
      <div className="board">
        <div className="header-row">
          {DATA.map((col, i) => (
            <div key={i} className="category">{col.category}</div>
          ))}
        </div>

        {[0, 1, 2, 3, 4].map(r => (
          <div key={r} className="row">
            {DATA.map((col, c) => {
              const clue = col.clues[r]
              const key = tileKey(c, r)
              const used = !!revealed[key]
              return (
                <div key={c} className={`cell ${used ? 'used' : ''}`}>
                  {used ? (
                    <div className="used-label">—</div>
                  ) : (
                    <button className="tile" onClick={() => handleTileClick(c, r)}>
                      ${clue.value}
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>

      <div className="teams-section">
        <h2>Teams</h2>
        <div className="teams">
          {teams.length === 0 && <div className="no-teams">No teams configured.</div>}
          {teams.map((team, i) => (
            <div key={team.id} className="team-box">
              <div className="team-name" onDoubleClick={() => startEditName(i)}>
                {team.editing ? (
                  <input
                    autoFocus
                    defaultValue={team.name}
                    onBlur={e => commitName(i, e.target.value.trim())}
                    onKeyDown={e => handleNameKey(e, i)}
                  />
                ) : (
                  <span>{team.name}</span>
                )}
              </div>
              <div className="team-score">{team.score || 0}</div>
              <div className="team-controls">
                <button onClick={() => updateTeamScore(i, 100)}>+100</button>
                <button onClick={() => updateTeamScore(i, -100)}>-100</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Setup modal: appears if setup not complete */}
      {!setupComplete && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Game Setup</h3>
            <p>Enter number of teams to start (1-20). Default: 2</p>
            <SetupForm onStart={startSetup} />
          </div>
        </div>
      )}

      {modal.open && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>{DATA[modal.cat].category} — ${DATA[modal.cat].clues[modal.row].value}</h3>
            <p className="question">{DATA[modal.cat].clues[modal.row].q}</p>

            <div className="timer-row">
              <div className={`timer ${timedOut ? 'timeout' : ''}`}>
                Time: {seconds}s {timedOut ? '(Time up)' : ''}
              </div>
              <div className="modal-buttons">
                {!showAnswer && (
                  <button onClick={handleRevealAnswer} className="reveal">Reveal Answer</button>
                )}
                <button onClick={closeModal} className="close">Close</button>
              </div>
            </div>

            {showAnswer && (
              <div className="answer">
                <strong>Answer:</strong> {DATA[modal.cat].clues[modal.row].a}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
