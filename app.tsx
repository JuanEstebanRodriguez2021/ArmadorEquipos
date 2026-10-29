import { useEffect, useMemo, useState, type CSSProperties, type FormEvent } from 'react'

type Position = 'ARQ' | 'DEF' | 'MED' | 'DEL'
type TeamCount = 1 | 2
type Player = {
  id: number
  name: string
  position: Position
  skill: number
  fitness: number
}

const starters: Player[] = []

const positionNames: Record<Position, string> = {
  ARQ: 'Arquero',
  DEF: 'Defensor',
  MED: 'Mediocampista',
  DEL: 'Delantero',
}

/**
 * Formations per format, written without the goalkeeper (e.g. "4-3-3").
 * First line = defenders, last line = forwards, any lines in between = midfielders.
 * The first option of each format is the default.
 */
const formationOptions: Record<number, string[]> = {
  5: ['2-2'],
  6: ['2-2-1', '2-1-2'],
  7: ['2-2-2', '3-2-1', '2-3-1', '2-1-3', '3-1-2'],
  8: [
    '3-2-2', '3-3-1', '2-3-2', '3-1-3', '2-4-1', '4-2-1', '4-1-2', '2-2-3',
    '3-1-2-1', '3-2-1-1', '2-3-1-1', '2-1-3-1',
  ],
  11: [
    '4-3-3', '4-4-2', '4-2-3-1', '4-5-1', '4-1-4-1', '4-4-1-1', '4-3-2-1', '4-3-1-2',
    '4-1-2-1-2', '4-2-2-2', '4-1-3-2', '4-2-4',
    '3-5-2', '3-4-3', '3-4-1-2', '3-4-2-1', '3-1-4-2', '3-5-1-1', '3-3-3-1',
    '5-3-2', '5-4-1', '5-2-3', '5-2-1-2',
  ],
}

const defaultFormation = (teamSize: number) => formationOptions[teamSize][0]

/** Lines of the formation from back to front, goalkeeper first. */
function formationLines(formation: string): Position[][] {
  const sizes = formation.split('-').map(Number)
  const lines = sizes.map((size, index) => {
    const role: Position = index === 0 ? 'DEF' : index === sizes.length - 1 ? 'DEL' : 'MED'
    return Array<Position>(size).fill(role)
  })
  return [['ARQ'], ...lines]
}

const formationSlots = (formation: string) => formationLines(formation).flat()

/** Assigns players to slots: matching positions first, then anyone left over. */
function placePlayers(players: Player[], slots: Position[]) {
  const remaining = [...players]
  const placed: (Player | undefined)[] = slots.map((wanted) => {
    const index = remaining.findIndex((player) => player.position === wanted)
    return index >= 0 ? remaining.splice(index, 1)[0] : undefined
  })
  return placed.map((player) => player ?? remaining.shift())
}

type TeamInfo = { name: string; color: string }

/** Picks dark or white text so jersey initials stay readable on any color. */
function textOn(hex: string) {
  const value = hex.replace('#', '')
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(value.slice(i, i + 2), 16) / 255)
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b
  return luminance > 0.6 ? '#15271f' : '#ffffff'
}

const isHex = (value: string) => /^#[0-9a-f]{6}$/i.test(value)

// Teams start with no name and no color: each group sets their own.
const emptyTeams: [TeamInfo, TeamInfo] = [
  { name: '', color: '' },
  { name: '', color: '' },
]

/** Neutral gray used until a team picks a color, and for the bench. */
const neutralColor = '#8a968f'
const colorOf = (team: TeamInfo) => team.color || neutralColor

/** Text field for typing a color code; only applies complete #RRGGBB values. */
function HexInput({ value, onChange }: { value: string; onChange: (color: string) => void }) {
  const [draft, setDraft] = useState(value)
  useEffect(() => setDraft(value), [value])
  return (
    <input
      className="hex-input"
      value={draft}
      maxLength={7}
      spellCheck={false}
      aria-label="Código de color"
      placeholder="Sin color · #RRGGBB"
      onChange={(e) => {
        const next = e.target.value.startsWith('#') ? e.target.value : `#${e.target.value}`
        setDraft(next)
        if (isHex(next)) onChange(next.toLowerCase())
      }}
      onBlur={() => setDraft(value)}
    />
  )
}

function TeamEditor({
  label,
  team,
  onChange,
}: {
  label: string
  team: TeamInfo
  onChange: (team: TeamInfo) => void
}) {
  return (
    <div className="team-editor">
      <label>
        {label}
        <input
          value={team.name}
          maxLength={20}
          placeholder="Nombre del equipo"
          onChange={(e) => onChange({ ...team, name: e.target.value })}
        />
      </label>
      <div className="color-field">
        <span>Color</span>
        <div className="color-picker">
          <label
            className={`color-preview ${team.color ? '' : 'empty'}`}
            style={team.color ? { background: team.color } : undefined}
            title="Elegir color"
          >
            <input
              type="color"
              value={team.color || neutralColor}
              aria-label={`Color de ${team.name || label}`}
              onChange={(e) => onChange({ ...team, color: e.target.value })}
            />
          </label>
          <HexInput value={team.color} onChange={(color) => onChange({ ...team, color })} />
        </div>
      </div>
    </div>
  )
}

type IconName = 'users' | 'plus' | 'sparkle' | 'trash' | 'chevron' | 'shield' | 'trophy' | 'swap'

function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  const paths = {
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>,
    plus: <><path d="M12 5v14M5 12h14" /></>,
    sparkle: <><path d="m12 3-1.7 4.3L6 9l4.3 1.7L12 15l1.7-4.3L18 9l-4.3-1.7L12 3Z" /><path d="m5 16-.7 1.8L2.5 18.5l1.8.7L5 21l.7-1.8 1.8-.7-1.8-.7L5 16Z" /></>,
    trash: <><path d="M3 6h18M8 6V4h8v2M19 6l-1 15H6L5 6M10 11v6M14 11v6" /></>,
    chevron: <path d="m9 18 6-6-6-6" />,
    shield: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />,
    trophy: <><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4Z" /><path d="M7 6H4v2a4 4 0 0 0 4 4M17 6h3v2a4 4 0 0 1-4 4" /></>,
    swap: <><path d="m7 7-4 4 4 4M3 11h14M17 3l4 4-4 4M21 7H7" /></>,
  }
  return (
    <svg aria-hidden="true" className="icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {paths[name]}
    </svg>
  )
}

function score(player: Player) {
  return player.skill * 0.7 + player.fitness * 0.3
}

function initials(name: string) {
  return name.split(' ').map((part) => part[0]).slice(0, 2).join('')
}

function splitTeams(players: Player[], teamSize: number) {
  const selected = [...players].sort((a, b) => score(b) - score(a)).slice(0, teamSize * 2)
  const a: Player[] = []
  const b: Player[] = []

  const keepers = selected.filter((p) => p.position === 'ARQ')
  if (keepers[0]) a.push(keepers[0])
  if (keepers[1]) b.push(keepers[1])

  selected
    .filter((p) => !keepers.slice(0, 2).includes(p))
    .forEach((player) => {
      const scoreA = a.reduce((total, p) => total + score(p), 0)
      const scoreB = b.reduce((total, p) => total + score(p), 0)
      if (a.length >= teamSize) b.push(player)
      else if (b.length >= teamSize) a.push(player)
      else if (scoreA <= scoreB) a.push(player)
      else b.push(player)
    })
  return [a, b] as [Player[], Player[]]
}

/**
 * Picks the best player for each slot of the formation.
 * Returns [starters, bench].
 */
function buildSingleTeam(players: Player[], teamSize: number, formation: string) {
  const remaining = [...players].sort((a, b) => score(b) - score(a))
  const starters: Player[] = []

  formationSlots(formation).forEach((wanted) => {
    const index = remaining.findIndex((player) => player.position === wanted)
    if (index >= 0) starters.push(remaining.splice(index, 1)[0])
  })
  // Fill empty slots (no player for that position) with the best remaining players
  while (starters.length < teamSize && remaining.length) starters.push(remaining.shift()!)

  return [starters, remaining] as [Player[], Player[]]
}

function buildTeams(players: Player[], teamSize: number, teamCount: TeamCount, formation: string) {
  return teamCount === 1 ? buildSingleTeam(players, teamSize, formation) : splitTeams(players, teamSize)
}

function PlayerAvatar({ player, small = false }: { player: Player; small?: boolean }) {
  return <span className={`avatar ${small ? 'avatar-small' : ''}`}>{initials(player.name)}</span>
}

function Rating({ value }: { value: number }) {
  const tone = value >= 8 ? 'great' : value >= 7 ? 'good' : 'fair'
  return <span className={`rating ${tone}`}>{value.toFixed(1)}</span>
}

function Pitch({ players, formation, team }: { players: Player[]; formation: string; team: 'a' | 'b' }) {
  const lines = useMemo(() => formationLines(formation), [formation])
  const placed = useMemo(() => placePlayers(players, lines.flat()), [players, lines])

  let index = 0
  return (
    <div className={`pitch pitch-${team} lines-${lines.length}`}>
      <div className="pitch-lines" aria-hidden="true">
        <span className="center-line" />
        <span className="center-circle" />
        <span className="area area-top" />
        <span className="area area-bottom" />
      </div>
      <div className="formation">
        {lines.map((line, lineIndex) => (
          <div className="formation-row" key={lineIndex}>
            {line.map((slot) => {
              const player = placed[index++]
              if (!player) return null
              return (
                <div className="pitch-player" key={player.id}>
                  <span className="jersey">{initials(player.name)}</span>
                  <span className="pitch-name" title={player.name}>{player.name}</span>
                  <span className="pitch-position">
                    {player.position === slot ? slot : `${slot} (${player.position})`}
                  </span>
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

function FormationPicker({
  teamSize,
  value,
  onChange,
}: {
  teamSize: number
  value: string
  onChange: (formation: string) => void
}) {
  const options = formationOptions[teamSize]
  if (options.length === 1) {
    return <div className="formation-picker"><span className="formation-fixed">{value}</span><small>Única formación para F{teamSize}</small></div>
  }
  if (options.length <= 6) {
    return (
      <div className="formation-picker">
        <div className="format-control formation-chips" role="radiogroup" aria-label="Formación">
          {options.map((option) => (
            <button key={option} role="radio" aria-checked={value === option} className={value === option ? 'active' : ''} onClick={() => onChange(option)}>
              {option}
            </button>
          ))}
        </div>
      </div>
    )
  }
  return (
    <div className="formation-picker">
      <select className="formation-select" value={value} aria-label="Formación" onChange={(e) => onChange(e.target.value)}>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </div>
  )
}

export default function App() {
  const [teamSize, setTeamSize] = useState(7)
  const [teamCount, setTeamCount] = useState<TeamCount>(2)
  const [players, setPlayers] = useState<Player[]>(starters)
  const [teams, setTeams] = useState<[Player[], Player[]]>(() => splitTeams(starters, 7))
  const [activeTeam, setActiveTeam] = useState<'a' | 'b'>('a')
  const [formOpen, setFormOpen] = useState(false)
  const [teamInfo, setTeamInfo] = useState<[TeamInfo, TeamInfo]>(emptyTeams)
  const [teamFormations, setTeamFormations] = useState<[string, string]>([defaultFormation(7), defaultFormation(7)])
  const [newPlayer, setNewPlayer] = useState({ name: '', position: 'MED' as Position, skill: 7, fitness: 7 })
  const single = teamCount === 1
  const required = teamSize * teamCount
  const canGenerate = players.length >= required

  const averages = teams.map((team) =>
    team.length ? team.reduce((total, player) => total + score(player), 0) / team.length : 0,
  )
  const hasTeams = single ? teams[0].length > 0 : teams[0].length > 0 || teams[1].length > 0
  const difference = Math.abs(averages[0] - averages[1])
  const balance = hasTeams ? Math.max(0, Math.round(100 - difference * 18)) : 0
  // In single-team mode the ring shows the starters' average on a 0–100 scale
  const ringValue = single ? Math.round(averages[0] * 10) : balance
  // Placeholder labels only while the team has no name
  const teamName = (index: 0 | 1) =>
    teamInfo[index].name.trim() || (single ? 'Tu equipo' : `Equipo ${index + 1}`)
  const squadNames = single ? [teamName(0), 'Suplentes'] : [teamName(0), teamName(1)]
  const colorVars = {
    '--team-a': colorOf(teamInfo[0]),
    '--team-b': single ? neutralColor : colorOf(teamInfo[1]),
    '--team-a-text': textOn(colorOf(teamInfo[0])),
    '--team-b-text': textOn(single ? neutralColor : colorOf(teamInfo[1])),
  } as CSSProperties

  const updateTeam = (index: 0 | 1, info: TeamInfo) => {
    setTeamInfo((current) => {
      const next: [TeamInfo, TeamInfo] = [current[0], current[1]]
      next[index] = info
      return next
    })
  }

  const shownIndex: 0 | 1 = single || activeTeam === 'a' ? 0 : 1
  const shownFormation = teamFormations[shownIndex]

  const generate = () => {
    setTeams(buildTeams(players, teamSize, teamCount, teamFormations[0]))
    setActiveTeam('a')
  }

  const changeFormat = (size: number) => {
    setTeamSize(size)
    setTeamFormations([defaultFormation(size), defaultFormation(size)])
    setTeams(buildTeams(players, size, teamCount, defaultFormation(size)))
  }

  const changeTeamCount = (count: TeamCount) => {
    setTeamCount(count)
    setTeams(buildTeams(players, teamSize, count, teamFormations[0]))
    setActiveTeam('a')
  }

  const changeFormation = (formation: string) => {
    setTeamFormations((current) => {
      const next: [string, string] = [current[0], current[1]]
      next[shownIndex] = formation
      return next
    })
  }

  const addPlayer = (event: FormEvent) => {
    event.preventDefault()
    if (!newPlayer.name.trim()) return
    const player: Player = { ...newPlayer, name: newPlayer.name.trim(), id: Date.now() }
    setPlayers((current) => [...current, player])
    // With a single team already built, new players join the bench
    if (single && hasTeams) setTeams((current) => [current[0], [...current[1], player]])
    setNewPlayer({ name: '', position: 'MED', skill: 7, fitness: 7 })
    setFormOpen(false)
  }

  const removePlayer = (id: number) => {
    setPlayers((current) => current.filter((player) => player.id !== id))
    setTeams((current) => current.map((team) => team.filter((player) => player.id !== id)) as [Player[], Player[]])
  }

  const swapPlayer = (player: Player, from: 0 | 1) => {
    const to = from === 0 ? 1 : 0
    // The bench (single mode, index 1) has no limit
    const limit = single && to === 1 ? Infinity : teamSize
    if (teams[to].length >= limit) return
    const next: [Player[], Player[]] = [[...teams[0]], [...teams[1]]]
    next[from] = next[from].filter((item) => item.id !== player.id)
    next[to].push(player)
    setTeams(next)
  }

  return (
    <main className="app-shell" style={colorVars}>
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark"><Icon name="shield" size={22} /></span>
          <span>Paridad</span>
        </div>
        <div className="topbar-title">
          <strong>Armador de equipos</strong>
        </div>
        <div className="topbar-controls">
          <div className="format-control" aria-label="Cantidad de equipos">
            {([1, 2] as const).map((count) => (
              <button className={teamCount === count ? 'active' : ''} key={count} onClick={() => changeTeamCount(count)}>
                {count === 1 ? '1 equipo' : '2 equipos'}
              </button>
            ))}
          </div>
          <div className="format-control" aria-label="Formato del partido">
            {[5, 6, 7, 8, 11].map((size) => (
              <button className={teamSize === size ? 'active' : ''} key={size} onClick={() => changeFormat(size)}>
                F{size}
              </button>
            ))}
          </div>
        </div>
      </header>

      <section className="workspace">
        <aside className="roster-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">CONVOCATORIA</span>
              <h1>Jugadores</h1>
            </div>
            <span className="count">{players.length}/{required}</span>
          </div>

          <div className="progress-track">
            <span style={{ width: `${Math.min(100, (players.length / required) * 100)}%` }} />
          </div>
          <p className="helper">
            {canGenerate
              ? `Todo listo para generar ${single ? 'el equipo' : 'los equipos'}.`
              : `Faltan ${required - players.length} jugadores para ${single ? '1 equipo' : '2 equipos'} de F${teamSize}.`}
          </p>

          <div className="player-list">
            {players.length === 0 && <p className="helper">Todavía no hay jugadores. Agrega el primero abajo.</p>}
            {players.map((player) => (
              <article className="player-row" key={player.id}>
                <PlayerAvatar player={player} />
                <div className="player-main">
                  <strong>{player.name}</strong>
                  <span>{positionNames[player.position]} · Forma {player.fitness}</span>
                </div>
                <Rating value={score(player)} />
                <button className="icon-button remove-button" aria-label={`Quitar a ${player.name}`} onClick={() => removePlayer(player.id)}>
                  <Icon name="trash" size={16} />
                </button>
              </article>
            ))}
          </div>

          {formOpen ? (
            <form className="add-form" onSubmit={addPlayer}>
              <label>
                Nombre
                <input autoFocus value={newPlayer.name} onChange={(e) => setNewPlayer({ ...newPlayer, name: e.target.value })} placeholder="Nombre y apellido" />
              </label>
              <div className="form-grid">
                <label>
                  Posición
                  <select value={newPlayer.position} onChange={(e) => setNewPlayer({ ...newPlayer, position: e.target.value as Position })}>
                    {Object.entries(positionNames).map(([key, value]) => (
                      <option key={key} value={key}>{value}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Nivel
                  <select value={newPlayer.skill} onChange={(e) => setNewPlayer({ ...newPlayer, skill: Number(e.target.value) })}>
                    {[5, 6, 7, 8, 9, 10].map((value) => (
                      <option key={value} value={value}>{value}</option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="form-actions">
                <button type="button" className="button ghost" onClick={() => setFormOpen(false)}>Cancelar</button>
                <button className="button primary">Agregar</button>
              </div>
            </form>
          ) : (
            <button className="button add-button" onClick={() => setFormOpen(true)}>
              <Icon name="plus" />Agregar jugador
            </button>
          )}
        </aside>

        <section className="field-panel">
          <div className="field-header">
            <div>
              <span className="eyebrow">FORMACIÓN</span>
              <h2>Tu equipo en cancha</h2>
            </div>
            <button className="button generate-button" disabled={!canGenerate} onClick={generate}>
              <Icon name="sparkle" />
              {hasTeams ? 'Generar de nuevo' : single ? 'Generar equipo' : 'Generar equipos'}
            </button>
          </div>

          {single ? (
            <div className="team-tabs single">
              <button className="active team-a">
                <span><i className="team-dot" />{teamName(0)} · Titulares</span>
                <strong>{averages[0].toFixed(1)}</strong>
              </button>
            </div>
          ) : (
            <div className="team-tabs">
              <button className={activeTeam === 'a' ? 'active team-a' : 'team-a'} onClick={() => setActiveTeam('a')}>
                <span><i className="team-dot" />{teamName(0)}</span>
                <strong>{averages[0].toFixed(1)}</strong>
              </button>
              <button className={activeTeam === 'b' ? 'active team-b' : 'team-b'} onClick={() => setActiveTeam('b')}>
                <span><i className="team-dot" />{teamName(1)}</span>
                <strong>{averages[1].toFixed(1)}</strong>
              </button>
            </div>
          )}

          <div className="formation-bar">
            <span>Formación{single ? '' : ` de ${teamName(shownIndex)}`}</span>
            <FormationPicker teamSize={teamSize} value={shownFormation} onChange={changeFormation} />
          </div>

          <Pitch players={teams[shownIndex]} formation={shownFormation} team={single ? 'a' : activeTeam} />
          <p className="pitch-caption">
            {shownFormation} · F{teamSize} ·{' '}
            {single ? 'Los demás jugadores quedan como suplentes' : 'Tocá un equipo para ver su nómina'}
          </p>
        </section>

        <aside className="insights-panel">
          <div className="balance-card">
            <span className="eyebrow">{single ? 'NIVEL DEL EQUIPO' : 'EQUILIBRIO GENERAL'}</span>
            <div className="balance-score">
              <div className="score-ring" style={{ '--score': `${ringValue * 3.6}deg` } as CSSProperties}>
                <span>{hasTeams ? ringValue : '–'}</span>
              </div>
              {!hasTeams ? (
                <div>
                  <strong>{single ? 'Sin equipo todavía' : 'Sin equipos todavía'}</strong>
                  <span>Agrega jugadores y genera {single ? 'el equipo' : 'los equipos'}</span>
                </div>
              ) : single ? (
                <div>
                  <strong>{averages[0] >= 8 ? 'Equipo fuerte' : averages[0] >= 7 ? 'Buen nivel' : 'Nivel en desarrollo'}</strong>
                  <span>Promedio de {averages[0].toFixed(1)} · {teams[1].length} suplentes</span>
                </div>
              ) : (
                <div>
                  <strong>{balance >= 90 ? 'Muy parejo' : balance >= 75 ? 'Bien balanceado' : 'Puede mejorar'}</strong>
                  <span>Diferencia de {difference.toFixed(1)} pts</span>
                </div>
              )}
            </div>
            <div className="balance-bars">
              <div><span>{single ? 'Titulares' : teamName(0)}</span><i><b style={{ width: `${averages[0] * 10}%` }} /></i><strong>{averages[0].toFixed(1)}</strong></div>
              <div><span>{single ? 'Suplentes' : teamName(1)}</span><i><b style={{ width: `${averages[1] * 10}%` }} /></i><strong>{averages[1].toFixed(1)}</strong></div>
            </div>
          </div>

          <div className="customize-card">
            <span className="eyebrow">PERSONALIZA {single ? 'TU EQUIPO' : 'TUS EQUIPOS'}</span>
            <TeamEditor label={single ? 'Tu equipo' : 'Equipo 1'} team={teamInfo[0]} onChange={(info) => updateTeam(0, info)} />
            {!single && (
              <TeamEditor label="Equipo 2" team={teamInfo[1]} onChange={(info) => updateTeam(1, info)} />
            )}
          </div>

          <div className="detail-heading">
            <div><Icon name="users" /><h3>Nóminas</h3></div>
            <span>{single ? `${teamSize} titulares` : `${teamSize} por lado`}</span>
          </div>
          {([0, 1] as const).map((teamIndex) => (
            <div className={`squad squad-${teamIndex} ${single && teamIndex === 1 ? 'squad-bench' : ''}`} key={teamIndex}>
              <div className="squad-title">
                <span>{squadNames[teamIndex]}</span>
                <strong>{single && teamIndex === 1 ? teams[1].length : `${teams[teamIndex].length}/${teamSize}`}</strong>
              </div>
              {single && teamIndex === 1 && teams[1].length === 0 && (
                <p className="squad-empty">Sin suplentes</p>
              )}
              {teams[teamIndex].map((player) => (
                <div className="squad-player" key={player.id}>
                  <PlayerAvatar player={player} small />
                  <div><strong>{player.name}</strong><span>{player.position}</span></div>
                  <Rating value={score(player)} />
                  <button className="icon-button" aria-label={single
                      ? `Pasar a ${player.name} a ${teamIndex === 0 ? 'suplentes' : 'titulares'}`
                      : `Mover a ${player.name} al otro equipo`} onClick={() => swapPlayer(player, teamIndex)}>
                    <Icon name="swap" size={15} />
                  </button>
                </div>
              ))}
            </div>
          ))}
        </aside>
      </section>
    </main>
  )
}