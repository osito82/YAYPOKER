import { computed } from 'vue'
import { useResponsiveStore } from '../store/responsiveStore'

/**
 * Shared seat-positioning logic (super-ellipse) used by PlayerMap
 * and by the chip-flight animation layer so both agree on where
 * each player sits on the felt.
 *
 * Positions are returned as percentages relative to the felt container.
 */
export function useSeatPositions(players, myPlayerId) {
  const responsive = useResponsiveStore()

  const isMobile = computed(() =>
    ['xsmall', 'small'].includes(responsive.screenSize),
  )

  const semiAxes = computed(() =>
    isMobile.value ? { a: 47, b: 32 } : { a: 45, b: 36 },
  )

  function getEllipseSeatPositions(playerCount) {
    if (playerCount < 2) return []
    const positions = []
    const startAngle = -Math.PI / 2
    for (let i = 0; i < playerCount; i++) {
      const angle = startAngle + (i * 2 * Math.PI) / playerCount
      positions.push({ angle, index: i })
    }
    return positions
  }

  const positionedSeats = computed(() => {
    const playerList = [...(players.value || [])]
      .filter((p) => p && p.playerNumber != null)
      .sort((a, b) => a.playerNumber - b.playerNumber)

    if (playerList.length < 2) return []

    const myIndex = playerList.findIndex((p) => p.id === myPlayerId.value)
    let rotatedList = playerList
    if (myIndex > 0) {
      rotatedList = [
        ...playerList.slice(myIndex),
        ...playerList.slice(0, myIndex),
      ]
    }

    const ellipsePositions = getEllipseSeatPositions(rotatedList.length)
    const axes = semiAxes.value
    const myAngleOffset = Math.PI

    return rotatedList.map((player, idx) => {
      const { angle } = ellipsePositions[idx]
      const adjustedAngle = angle + myAngleOffset
      const n = 3.5
      const absCos = Math.pow(Math.abs(Math.cos(adjustedAngle)), 2 / n)
      const absSin = Math.pow(Math.abs(Math.sin(adjustedAngle)), 2 / n)

      const left = 50 + axes.a * absCos * Math.sign(Math.cos(adjustedAngle))
      const top = 53 + axes.b * absSin * Math.sign(Math.sin(adjustedAngle))
      return { player, left, top }
    })
  })

  /**
   * Returns the {left, top} percentages for a given player id or name,
   * or null if the player is not seated.
   */
  function getSeatPosition({ id = null, name = null } = {}) {
    const seat = positionedSeats.value.find(
      (s) =>
        (id && s.player.id === id) ||
        (name && s.player.name === name),
    )
    return seat ? { left: seat.left, top: seat.top } : null
  }

  return { positionedSeats, getSeatPosition, isMobile }
}
