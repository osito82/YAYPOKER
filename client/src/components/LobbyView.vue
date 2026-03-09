<template>
  <div class="lobby-container">
    <div class="lobby-card">
      <h1 class="lobby-title">Game Lobby</h1>
      <p class="lobby-subtitle">Game Code: <span class="game-code">{{ gameCode }}</span></p>
      
      <div class="players-list">
        <div v-for="player in players" :key="player.id" class="player-item" :class="{ 'is-host': player.id === hostId }">
          <div class="player-name">
            {{ player.name }}
            <span v-if="player.id === hostId" class="host-badge">HOST</span>
            <span v-if="player.id === myId" class="me-badge">(YOU)</span>
          </div>
          <div class="player-status" :class="{ connected: player.connected }">
            {{ player.connected ? 'Connected' : 'Disconnected' }}
          </div>
        </div>
      </div>

      <div class="lobby-actions">
        <div v-if="isHost" class="host-controls">
          <p v-if="players.length < 2" class="warning-text">
            Waiting for at least 2 players to start...
          </p>
          <button 
            @click="$emit('start')" 
            :disabled="players.length < 2"
            class="start-button"
          >
            Start Game
          </button>
        </div>
        <div v-else class="waiting-message">
          <p>Waiting for the host to start the game...</p>
          <div class="loader"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  players: { type: Array, required: true },
  hostId: { type: String, default: null },
  myId: { type: String, default: null },
  gameCode: { type: String, required: true }
})

const isHost = computed(() => props.myId === props.hostId)

defineEmits(['start'])
</script>

<style scoped>
.lobby-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 80vh;
  padding: 20px;
}

.lobby-card {
  background: rgba(30, 41, 59, 0.9);
  border: 1px solid #334155;
  border-radius: 12px;
  padding: 30px;
  width: 100%;
  max-width: 500px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
}

.lobby-title {
  font-size: 2rem;
  font-weight: bold;
  margin-bottom: 5px;
  text-align: center;
  color: #f8fafc;
}

.lobby-subtitle {
  text-align: center;
  color: #94a3b8;
  margin-bottom: 30px;
}

.game-code {
  color: #38bdf8;
  font-family: monospace;
  font-weight: bold;
}

.players-list {
  margin-bottom: 30px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.player-item {
  background: #1e293b;
  padding: 12px 15px;
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border: 1px solid transparent;
}

.player-item.is-host {
  border-color: #38bdf8;
}

.player-name {
  color: #f1f5f9;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
}

.host-badge {
  background: #0369a1;
  color: #e0f2fe;
  font-size: 0.7rem;
  padding: 2px 6px;
  border-radius: 4px;
}

.me-badge {
  color: #94a3b8;
  font-size: 0.8rem;
}

.player-status {
  font-size: 0.85rem;
  color: #ef4444;
}

.player-status.connected {
  color: #22c55e;
}

.lobby-actions {
  text-align: center;
  margin-top: 20px;
}

.start-button {
  background: #0284c7;
  color: white;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: bold;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  width: 100%;
  font-size: 1.1rem;
}

.start-button:hover:not(:disabled) {
  background: #0369a1;
}

.start-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.warning-text {
  color: #fbbf24;
  font-size: 0.9rem;
  margin-bottom: 10px;
}

.waiting-message {
  color: #94a3b8;
}

.loader {
  border: 3px solid #1e293b;
  border-top: 3px solid #38bdf8;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  animation: spin 1s linear infinite;
  margin: 10px auto;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
