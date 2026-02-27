<template>
  <div
    class="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4"
  >
    <div
      class="w-full max-w-md bg-gray-800 rounded-xl shadow-2xl overflow-hidden border border-gray-700"
    >
      <!-- Header -->
      <div
        class="bg-gray-700 p-6 flex flex-col items-center border-b border-gray-600"
      >
        <Logo class="mb-4 transform scale-125" />
        <h2 class="text-gray-300 text-lg font-light tracking-wide">
          Texas Hold'em Lobby
        </h2>
      </div>

      <!-- Form -->
      <div class="p-8 space-y-6">
        <!-- Player Name -->
        <div>
          <label
            class="block text-gray-400 text-sm font-bold mb-2"
            for="username"
          >
            Your Name
          </label>
          <input
            v-model="playerName"
            class="shadow appearance-none border border-gray-600 rounded w-full py-3 px-4 text-gray-200 bg-gray-900 leading-tight focus:outline-none focus:border-yellow-500 transition-colors"
            id="username"
            type="text"
            placeholder="Enter your name"
          />
        </div>

        <!-- Divider -->
        <div class="relative flex py-2 items-center">
          <div class="flex-grow border-t border-gray-600"></div>
          <span class="flex-shrink mx-4 text-gray-500 text-xs"
            >JOIN OR CREATE</span
          >
          <div class="flex-grow border-t border-gray-600"></div>
        </div>

        <!-- Join Game -->
        <div class="space-y-3">
          <label
            class="block text-gray-400 text-sm font-bold mb-1"
            for="gamecode"
          >
            Game Code
          </label>
          <div class="flex space-x-2">
            <input
              v-model="gameCode"
              class="shadow appearance-none border border-gray-600 rounded w-full py-3 px-4 text-gray-200 bg-gray-900 leading-tight focus:outline-none focus:border-blue-500 transition-colors font-mono"
              id="gamecode"
              type="text"
              placeholder="Ex: TABLE-123"
            />
            <button
              @click="joinGame"
              :disabled="!isValidJoin"
              class="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-6 rounded focus:outline-none focus:shadow-outline transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Join
            </button>
          </div>
        </div>

        <!-- Create Game -->
        <button
          @click="createGame"
          :disabled="!playerName"
          class="w-full bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-gray-900 font-bold py-3 px-4 rounded focus:outline-none focus:shadow-outline transition-all transform hover:-translate-y-0.5 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Create New Table
        </button>
      </div>

      <!-- Footer -->
      <div class="bg-gray-900 p-4 text-center text-gray-500 text-xs">
        &copy; 2026 OsoPoker. All chips are virtual.
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import Logo from '../components/Logo.vue'
import { v4 as uuidv4 } from 'uuid'

const router = useRouter()
const playerName = ref('')
const gameCode = ref('')

const isValidJoin = computed(() => {
  return playerName.value.trim().length > 0 && gameCode.value.trim().length > 0
})

const joinGame = () => {
  if (isValidJoin.value) {
    router.push({
      name: 'game',
      params: { gameCode: gameCode.value },
      query: { playerName: playerName.value },
    })
  }
}

const createGame = () => {
  if (playerName.value.trim().length > 0) {
    const newCode =
      gameCode.value.trim() ||
      `TABLE-${Math.floor(1000 + Math.random() * 9000)}`
    router.push({
      name: 'game',
      params: { gameCode: newCode },
      query: { playerName: playerName.value },
    })
  }
}
</script>

<style scoped></style>
