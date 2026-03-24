<template>
  <div
    class="verify-page min-h-screen bg-neutral-950 flex items-center justify-center p-6 relative overflow-hidden font-sans"
  >
    <!-- Decorative background -->
    <div class="absolute inset-0 pointer-events-none">
      <div
        class="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_0%,rgba(212,168,83,0.05)_0%,transparent_60%)]"
      ></div>
      <div
        class="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_2px,rgba(255,255,255,0.01)_2px,rgba(255,255,255,0.01)_4px)]"
      ></div>
    </div>

    <div
      class="page-content relative z-10 w-full max-w-[520px] flex flex-col items-center gap-6"
    >
      <!-- Header -->
      <header class="header text-center animate-fade-down">
        <span class="logo-mark text-[36px] mb-2 block">🃏</span>
        <p
          class="site-name font-mono text-[10px] tracking-[4px] text-[#8A6A2A] uppercase mb-3"
        >
          Deush Poker
        </p>
        <h1
          class="page-title font-bebas text-[clamp(36px,8vw,52px)] tracking-[2px] bg-gradient-to-br from-[#F5D78E] to-[#D4A853] bg-clip-text text-transparent"
        >
          VERIFICADOR
        </h1>
        <p class="page-sub text-[13px] text-[#7A7268] mt-1 leading-relaxed">
          Ingresa el ID del torneo y el código de 4 dígitos<br />para confirmar
          la identidad del ganador
        </p>
      </header>

      <div class="divider w-10 h-px bg-[#D4A853]/30 mx-auto"></div>

      <!-- Input Card -->
      <div
        v-if="!result"
        class="input-card w-full bg-[#142A16] border border-[#D4A853]/20 rounded-2xl p-7 animate-fade-up shadow-2xl"
      >
        <div class="field-group mb-5">
          <label
            class="field-label font-mono text-[9px] tracking-[3px] uppercase text-[#D4A853] block mb-2"
            >ID del Torneo</label
          >
          <input
            v-model="torneoId"
            class="field-input w-full bg-black/40 border border-white/10 rounded-xl p-3 px-4 text-[#F5F0E8] font-mono text-sm outline-none transition-colors tracking-widest focus:border-[#D4A853]/50 focus:ring-4 focus:ring-[#D4A853]/5"
            placeholder="ej: abc1-9f3d"
            autocomplete="off"
            spellcheck="false"
            :class="{ 'shake-animation border-red-500/70': errors.torneoId }"
          />
        </div>

        <div class="field-group mb-5">
          <label
            class="field-label font-mono text-[9px] tracking-[3px] uppercase text-[#D4A853] block mb-2"
            >Código del Ganador (4 dígitos)</label
          >
          <div class="code-input-row flex gap-2.5 items-center justify-center">
            <input
              v-for="(digit, i) in codeDigits"
              :key="i"
              :id="`digit-${i}`"
              ref="digitInputs"
              v-model="codeDigits[i]"
              type="text"
              inputmode="numeric"
              maxlength="1"
              class="digit-input w-16 h-20 bg-black/50 border-2 border-white/10 rounded-xl text-center text-[#F5D78E] font-bebas text-[42px] outline-none transition-all focus:border-[#D4A853] focus:ring-4 focus:ring-[#D4A853]/10 focus:bg-[#D4A853]/5"
              :class="{
                'filled border-[#D4A853]/40': codeDigits[i],
                'shake-animation border-red-500/70': errors.code,
              }"
              @input="onInput($event, i)"
              @keydown="onKeyDown($event, i)"
              @paste="onPaste"
            />
          </div>
        </div>

        <button
          @click="verify"
          :disabled="isVerifying"
          class="verify-btn w-full p-4 bg-gradient-to-br from-[#D4A853] to-[#8A6A2A] border-none rounded-xl text-[#060E07] font-bebas text-[20px] tracking-[3px] cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(212,168,83,0.3)] active:translate-y-0 disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none relative overflow-hidden group"
        >
          <span class="relative z-10">{{
            isVerifying ? 'VERIFICANDO...' : 'VERIFICAR CERTIFICADO'
          }}</span>
          <div
            class="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer"
          ></div>
        </button>
      </div>

      <!-- Result Panel -->
      <div
        v-else
        class="result-panel w-full rounded-2xl p-6 px-7 animate-result-pop shadow-2xl"
        :class="
          result.valid
            ? 'valid bg-emerald-500/10 border border-emerald-500/40'
            : 'invalid bg-red-500/10 border border-red-500/30'
        "
      >
        <span class="result-icon text-4xl block mb-3">{{
          result.valid ? '✅' : '❌'
        }}</span>
        <p
          class="result-status font-bebas text-2xl tracking-widest mb-1"
          :class="result.valid ? 'text-[#27AE60]' : 'text-[#C0392B]'"
        >
          {{ result.valid ? 'CERTIFICADO VÁLIDO' : 'CERTIFICADO INVÁLIDO' }}
        </p>
        <p class="result-msg text-[13px] text-[#7A7268] mb-4 leading-relaxed">
          {{
            result.valid
              ? 'Este código ha sido verificado exitosamente. El jugador es el ganador oficial de este torneo.'
              : result.error
          }}
        </p>

        <div
          v-if="result.valid && result.certificate"
          class="winner-detail bg-black/30 rounded-xl p-4 grid grid-cols-2 gap-3 mb-4"
        >
          <div class="detail-item col-span-2">
            <p
              class="detail-label font-mono text-[8px] tracking-[2px] uppercase text-[#7A7268] mb-0.5"
            >
              Ganador del Torneo
            </p>
            <p
              class="detail-value name font-bebas text-2xl text-[#F5D78E] tracking-wider"
            >
              {{ result.certificate.winnerName.toUpperCase() }}
            </p>
          </div>
          <div class="detail-item">
            <p
              class="detail-label font-mono text-[8px] tracking-[2px] uppercase text-[#7A7268] mb-0.5"
            >
              Torneo ID
            </p>
            <p
              class="detail-value font-mono text-[13px] text-[#F5F0E8] font-medium"
            >
              {{ result.certificate.torneoId }}
            </p>
          </div>
          <div class="detail-item">
            <p
              class="detail-label font-mono text-[8px] tracking-[2px] uppercase text-[#7A7268] mb-0.5"
            >
              Fecha
            </p>
            <p
              class="detail-value font-mono text-[13px] text-[#F5F0E8] font-medium"
            >
              {{ formatDate(result.certificate.date) }}
            </p>
          </div>
          <div class="detail-item">
            <p
              class="detail-label font-mono text-[8px] tracking-[2px] uppercase text-[#7A7268] mb-0.5"
            >
              Jugadores
            </p>
            <p
              class="detail-value font-mono text-[13px] text-[#F5F0E8] font-medium"
            >
              {{ result.certificate.totalPlayers }} jugadores
            </p>
          </div>
          <div class="detail-item">
            <p
              class="detail-label font-mono text-[8px] tracking-[2px] uppercase text-[#7A7268] mb-0.5"
            >
              Fichas Finales
            </p>
            <p
              class="detail-value font-mono text-[13px] text-[#F5F0E8] font-medium"
            >
              {{ result.certificate.chipsWon.toLocaleString() }} chips
            </p>
          </div>
        </div>

        <div
          v-if="result.valid"
          class="seal inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-full font-mono text-[10px] tracking-[2px] text-[#27AE60]"
        >
          <div class="seal-dot w-1.5 h-1.5 bg-[#27AE60] rounded-full"></div>
          VERIFICADO POR DEUSH POKER
        </div>

        <button
          @click="reset"
          class="try-again mt-6 bg-transparent border border-white/15 rounded-lg text-[#7A7268] font-mono text-[10px] tracking-[2px] p-2 px-4 cursor-pointer transition-colors hover:border-white/30 hover:text-[#F5F0E8]"
        >
          ← VERIFICAR OTRO
        </button>
      </div>

      <footer
        class="footer font-mono text-[9px] tracking-[2px] text-[#8A6A2A]/50 text-center"
      >
        SISTEMA DE CERTIFICACIÓN OFICIAL · DEUSH POKER v1.0
      </footer>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { urlsFactory } from '../vutils'

const route = useRoute()
const urls = urlsFactory()

const torneoId = ref('')
const codeDigits = ref(['', '', '', ''])
const digitInputs = ref([])
const isVerifying = ref(false)
const result = ref(null)
const errors = ref({ torneoId: false, code: false })

onMounted(() => {
  if (route.params.torneoId) {
    torneoId.value = route.params.torneoId
  }
  if (route.params.code) {
    const code = route.params.code.toString().padStart(4, '0')
    const digits = code.split('').slice(0, 4)
    for (let i = 0; i < 4; i++) {
      codeDigits.value[i] = digits[i] || ''
    }
    nextTick(() => {
      verify()
    })
  }
})

const onInput = (e, i) => {
  const val = e.target.value.replace(/\D/g, '')
  codeDigits.value[i] = val
  if (val && i < 3) {
    digitInputs.value[i + 1].focus()
  }
}

const onKeyDown = (e, i) => {
  if (e.key === 'Backspace' && !codeDigits.value[i] && i > 0) {
    digitInputs.value[i - 1].focus()
    codeDigits.value[i - 1] = ''
  }
  if (e.key === 'Enter') {
    verify()
  }
}

const onPaste = (e) => {
  e.preventDefault()
  const pasted = (e.clipboardData.getData('text') || '')
    .replace(/\D/g, '')
    .slice(0, 4)
  const digits = pasted.split('')
  for (let j = 0; j < 4; j++) {
    codeDigits.value[j] = digits[j] || ''
  }
  if (pasted.length === 4) {
    verify()
  }
}

const verify = async () => {
  if (isVerifying.value) return

  errors.value.torneoId = !torneoId.value.trim()
  const fullCode = codeDigits.value.join('')
  errors.value.code = fullCode.length < 4

  if (errors.value.torneoId || errors.value.code) {
    setTimeout(() => {
      errors.value.torneoId = false
      errors.value.code = false
    }, 500)
    return
  }

  isVerifying.value = true
  try {
    const res = await fetch(
      `${urls.serverHttp}/verify/${torneoId.value}/${fullCode}`,
    )
    if (!res.ok) throw new Error('Error de servidor')
    result.value = await res.json()
  } catch (err) {
    result.value = { valid: false, error: 'Error de conexión con el servidor.' }
  } finally {
    isVerifying.value = false
  }
}

const reset = () => {
  result.value = null
  codeDigits.value = ['', '', '', '']
  torneoId.value = ''
}

const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}
</script>

<style scoped>
.font-bebas {
  font-family: var(--font-display);
}
.font-mono {
  font-family: var(--font-mono);
}
.font-sans {
  font-family: var(--font-sans);
}

.animate-fade-down {
  animation: fade-down 0.5s both;
}
.animate-fade-up {
  animation: fade-up 0.5s 0.1s both;
}
.animate-result-pop {
  animation: result-pop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

@keyframes fade-down {
  from {
    opacity: 0;
    transform: translateY(-16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
@keyframes fade-up {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
@keyframes result-pop {
  from {
    transform: scale(0.9);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}
@keyframes shimmer {
  to {
    transform: translateX(100%);
  }
}
@keyframes shake {
  0%,
  100% {
    transform: translateX(0);
  }
  20% {
    transform: translateX(-6px);
  }
  40% {
    transform: translateX(6px);
  }
  60% {
    transform: translateX(-4px);
  }
  80% {
    transform: translateX(4px);
  }
}

.shake-animation {
  animation: shake 0.35s ease;
}

.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(212, 168, 83, 0.2);
  border-radius: 10px;
}
</style>
