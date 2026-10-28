import { useMemo, useState, type CSSProperties, type FormEvent } from 'react'

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

const formations: Record<number, Position[]> = {
  5: ['ARQ', 'DEF', 'DEF', 'DEL', 'DEL'],
  6: ['ARQ', 'DEF', 'DEF', 'MED', 'MED', 'DEL'],
  7: ['ARQ', 'DEF', 'DEF', 'MED', 'MED', 'DEL', 'DEL'],
  8: ['ARQ', 'DEF', 'DEF', 'DEF', 'MED', 'MED', 'DEL', 'DEL'],
  11: ['ARQ', 'DEF', 'DEF', 'DEF', 'DEF', 'MED', 'MED', 'MED', 'DEL', 'DEL', 'DEL'],
}

type TeamInfo = { name: string; color: string }

// Dark enough for white text on the jerseys
const teamColors = [
  '#3976e8', '#ef755f', '#d63b3b', '#2f9e5b', '#7b5cd6',
  '#e8892b', '#1a9aa0', '#d6457f', '#b8901f', '#1f2a24',
]

const defaultTeams: [TeamInfo, TeamInfo] = [
  { name: 'Equipo Azul', color: '#3976e8' },
  { name: 'Equipo Coral', color: '#ef755f' },
]

const benchColor = '#9aa6a0'

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
          onBlur={() => !team.name.trim() && onChange({ ...team, name: label })}
        />
      </label>
      <div className="swatches" role="radiogroup" aria-label={`Color de ${team.name || label}`}>
        {teamColors.map((color) => (
          <button
            key={color}
            type="button"
            role="radio"
            aria-checked={team.color === color}
            aria-label={`Color ${color}`}
            className={`swatch ${team.color === color ? 'selected' : ''}`}
            style={{ background: color }}
            onClick={() => onChange({ ...team, color })}
          />
        ))}
        <label
          className={`swatch swatch-custom ${teamColors.includes(team.color) ? '' : 'selected'}`}
          title="Otro color"
          style={teamColors.includes(team.color) ? undefined : { background: team.color }}
        >
          <input type="color" value={team.color} onChange={(e) => onChange({ ...team, color: e.target.value })} />
        </label>
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
function buildSingleTeam(players: Player[], teamSize: number) {
  const remaining = [...players].sort((a, b) => score(b) - score(a))
  const starters: Player[] = []

  formations[teamSize].forEach((wanted) => {
    const index = remaining.findIndex((player) => player.position === wanted)
    if (index >= 0) starters.push(remaining.splice(index, 1)[0])
  })
  // Fill empty slots (no player for that position) with the best remaining players
  while (starters.length < teamSize && remaining.length) starters.push(remaining.shift()!)

  return [starters, remaining] as [Player[], Player[]]
}

function buildTeams(players: Player[], teamSize: number, teamCount: TeamCount) {
  return teamCount === 1 ? buildSingleTeam(players, teamSize) : splitTeams(players, teamSize)
}

function PlayerAvatar({ player, small = false }: { player: Player; small?: boolean }) {
  return <span className={`avatar ${small ? 'avatar-small' : ''}`}>{initials(player.name)}</span>
}

function Rating({ value }: { value: number }) {
  const tone = value >= 8 ? 'great' : value >= 7 ? 'good' : 'fair'
  return <span className={`rating ${tone}`}>{value.toFixed(1)}</span>
}

function Pitch({ players, teamSize, team }: { players: Player[]; teamSize: number; team: 'a' | 'b' }) {
  const ordered = useMemo(() => {
    const remaining = [...players]
    return formations[teamSize]
      .map((wanted) => {
        let index = remaining.findIndex((player) => player.position === wanted)
        if (index < 0) index = 0
        return remaining.splice(index, 1)[0]
      })
      .filter(Boolean)
  }, [players, teamSize])

  const rows = formations[teamSize].reduce<Position[][]>((result, position) => {
    if (position === 'ARQ') result.push([position])
    else if (!result.length || result[result.length - 1][0] !== position) result.push([position])
    else result[result.length - 1].push(position)
    return result
  }, [])

  let index = 0
  return (
    <div className={`pitch pitch-${team}`}>
      <div className="pitch-lines" aria-hidden="true">
        <span className="center-line" />
        <span className="center-circle" />
        <span className="area area-top" />
        <span className="area area-bottom" />
      </div>
      <div className="formation">
        {rows.map((row, rowIndex) => (
          <div className="formation-row" key={`${row[0]}-${rowIndex}`}>
            {row.map(() => {
              const player = ordered[index++]
              if (!player) return null
              return (
                <div className="pitch-player" key={player.id}>
                  <span className="jersey">{initials(player.name)}</span>
                  <span className="pitch-name">{player.name.split(' ')[0]}</span>
                  <span className="pitch-position">{player.position}</span>
                </div>
              )
            })}
          </div>
        ))}
      </div>
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
  const [teamInfo, setTeamInfo] = useState<[TeamInfo, TeamInfo]>(defaultTeams)
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
  const teamName = (index: 0 | 1) => teamInfo[index].name.trim() || defaultTeams[index].name
  const squadNames = single ? [teamName(0), 'Suplentes'] : [teamName(0), teamName(1)]
  const colorVars = {
    '--team-a': teamInfo[0].color,
    '--team-b': single ? benchColor : teamInfo[1].color,
  } as CSSProperties

  const updateTeam = (index: 0 | 1, info: TeamInfo) => {
    setTeamInfo((current) => {
      const next: [TeamInfo, TeamInfo] = [current[0], current[1]]
      next[index] = info
      return next
    })
  }

  const generate = () => {
    setTeams(buildTeams(players, teamSize, teamCount))
    setActiveTeam('a')
  }

  const changeFormat = (size: number) => {
    setTeamSize(size)
    setTeams(buildTeams(players, size, teamCount))
  }

  const changeTeamCount = (count: TeamCount) => {
    setTeamCount(count)
    setTeams(buildTeams(players, teamSize, count))
    setActiveTeam('a')
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

          <Pitch
            players={teams[single || activeTeam === 'a' ? 0 : 1]}
            teamSize={teamSize}
            team={single ? 'a' : activeTeam}
          />
          <p className="pitch-caption">
            Formación sugerida para F{teamSize} ·{' '}
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