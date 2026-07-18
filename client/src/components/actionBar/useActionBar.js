import { ref, computed, watch, onBeforeUnmount } from 'vue'
import { usePokerStore } from '../../store/pokerStore'
import { useResponsiveStore } from '../../store/responsiveStore'

export function useActionBar(props, emit) {
  const pokerStore = usePokerStore()
  const responsive = useResponsiveStore()
  const progress = ref(100)
  let timerInterval = null

  const baseChips = [
    { color: 'bg-slate-50', text: 'text-slate-900', value: 1, label: '1' },
    { color: 'bg-red-600', text: 'text-white', value: 5, label: '5' },
    { color: 'bg-blue-700', text: 'text-white', value: 10, label: '10' },
    { color: 'bg-emerald-600', text: 'text-white', value: 25, label: '25' },
    { color: 'bg-slate-500', text: 'text-white', value: 100, label: '100' },
    { color: 'bg-purple-700', text: 'text-white', value: 500, label: '500' },
  ]

  const chips = computed(() => {
    return baseChips.map((chip) => {
      const isBlind =
        (props.options && props.options.includes('blind')) ||
        props.canBlind === true
      const exceedsBalance = chip.value > (props.balance || 0)
      const isDisabled = !props.isMyTurn || isBlind || exceedsBalance
      return {
        ...chip,
        disabled: isDisabled,
      }
    })
  })

  const addChip = (value) => {
    const current = props.betAmount || props.minBet
    const newAmount = Math.min(props.maxBet, current + value)
    emit('update:betAmount', newAmount)
  }

  const clearBet = () => {
    emit('update:betAmount', props.minBet)
  }

  const showChips = computed(() => {
    return props.balance > 0 || props.playerCards?.length > 0
  })

  const chipResponsiveSize = computed(() => {
    if (
      responsive.screenSize === 'xsmall' ||
      responsive.screenSize === 'small'
    ) {
      return 'small'
    }
    return 'medium'
  })

  const templateSuffix = computed(() => {
    const size = responsive.screenSize
    return 'Template' + size.charAt(0).toUpperCase() + size.slice(1)
  })

  const isSliderDisabled = computed(() => {
    if (!props.isMyTurn) return true
    if (props.options?.includes('blind') || props.canBlind) return true
    // El slider solo se bloquea si el jugador ya no tiene más fichas para agregar
    // (es decir, ya puso todo lo que tenía o su stack es 0)
    return props.balance <= 0
  })

  const isRaiseActionDisabled = computed(() => {
    if (!props.isMyTurn) return true
    const hasActionOption =
      props.options.includes('bet') || props.options.includes('raise')
    if (!hasActionOption) return true

    const tableHighestBet = pokerStore.getCurrentHighestBet || 0
    const isIncrease = props.betAmount > tableHighestBet
    const isLegalAmount = props.betAmount >= props.minBet

    // Se elimina la restricción de obligar al usuario a apostar más del mínimo.
    // Un "Bet" o "Raise" mínimo es una jugada 100% válida en el poker.
    // Al haber fijado el slider al mínimo al inicio del turno, ahora el jugador
    // simplemente puede clickear el botón si quiere hacer la apuesta/subida mínima.
    
    // Situación especial: Si minBet === maxBet, el jugador no tiene rango para elegir,
    // por lo que el botón de Raise se deshabilita para evitar confusión (debería usar Call/All-in)
    const hasRange = props.maxBet > props.minBet

    return !(isIncrease && isLegalAmount && hasRange)
  })

  const activePlayerName = computed(() => {
    const activeId = pokerStore.getActivePlayerId
    if (!activeId) return 'others'
    const player = pokerStore.getPlayers.find((p) => p.id === activeId)
    return player ? player.name : 'others'
  })

  const updateProgress = () => {
    if (!pokerStore.getAutofoldStartTime || !props.isMyTurn) {
      progress.value = 0
      return
    }
    const elapsed = (Date.now() - pokerStore.getAutofoldStartTime) / 1000
    const remaining = Math.max(0, pokerStore.getAutofoldDuration - elapsed)
    progress.value = (remaining / pokerStore.getAutofoldDuration) * 100
    if (remaining <= 0) clearInterval(timerInterval)
  }

  watch(
    () => props.isMyTurn,
    (newVal) => {
      if (newVal) {
        if (timerInterval) clearInterval(timerInterval)
        timerInterval = setInterval(updateProgress, 100)
      } else {
        clearInterval(timerInterval)
        progress.value = 0
      }
    },
    { immediate: true },
  )

  onBeforeUnmount(() => {
    if (timerInterval) clearInterval(timerInterval)
  })

  return {
    progress,
    chips,
    addChip,
    clearBet,
    showChips,
    chipResponsiveSize,
    templateSuffix,
    isSliderDisabled,
    isRaiseActionDisabled,
    activePlayerName,
    responsive,
  }
}
