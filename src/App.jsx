import React, { useEffect, useRef, useState } from 'react'

const DATA = [
  {
    category: 'Science',
    clues: [
      { value: 100, q: 'What planet is known as the Red Planet?', a: 'Mars' },
      { value: 200, q: 'What gas do plants absorb from the atmosphere?', a: 'Carbon dioxide' },
      { value: 300, q: 'What is the chemical symbol for water?', a: 'H2O' },
      { value: 400, q: 'What force keeps us on the ground?', a: 'Gravity' },
      { value: 500, q: 'What branch of science studies living organisms?', a: 'Biology' }
    ]
  },
  {
    category: 'History',
    clues: [
      { value: 100, q: 'Who was the first President of the United States?', a: 'George Washington' },
      { value: 200, q: 'In which year did the Titanic sink?', a: '1912' },
      { value: 300, q: 'Which empire was ruled by Julius Caesar?', a: 'Roman Empire' },
      { value: 400, q: 'The fall of the Berlin Wall happened in which year?', a: '1989' },
      { value: 500, q: 'Who was known as the Maid of Orléans?', a: 'Joan of Arc' }
    ]
  },
  {
    category: 'Literature',
    clues: [
      { value: 100, q: 'Who wrote "Romeo and Juliet"?', a: 'William Shakespeare' },
      { value: 200, q: 'What is the novel about a whale, by Herman Melville?', a: 'Moby-Dick' },
      { value: 300, q: 'Which novel features Atticus Finch?', a: 'To Kill a Mockingbird' },
      { value: 400, q: 'Who wrote "1984"?', a: 'George Orwell' },
      { value: 500, q: 'Who is the author of "The Divine Comedy"?', a: 'Dante Alighieri' }
    ]
  },
  {
    category: 'Sports',
    clues: [
      { value: 100, q: 'How many players are on a soccer team (on the field)?', a: '11' },
      { value: 200, q: 'In which sport would you perform a slam dunk?', a: 'Basketball' },
      { value: 300, q: 'Which country hosted the 2016 Summer Olympics?', a: 'Brazil' },
      { value: 400, q: 'How many holes are there in a full round of golf?', a: '18' },
      { value: 500, q: 'What is the term for three strikes in bowling?', a: 'Turkey' }
    ]
  },
  {
    category: 'Music',
    clues: [
      { value: 100, q: 'Who is known as the King of Pop?', a: 'Michael Jackson' },
      { value: 200, q: 'Which instrument has 88 keys?', a: 'Piano' },
      { value: 300, q: 'Which band released the album "Abbey Road"?', a: 'The Beatles' },
      { value: 400, q: 'What is the musical symbol for silence?', a: 'Rest' },
      { value: 500, q: 'Who composed the "Fifth Symphony"?', a: 'Ludwig van Beethoven' }
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
