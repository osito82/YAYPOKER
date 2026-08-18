<template>
  <div
    class="min-h-screen bg-white dark:bg-[#030712] text-gray-600 dark:text-gray-300 font-sans p-8 md:p-16 transition-colors duration-300"
  >
    <div class="max-w-4xl mx-auto">
      <router-link
        to="/"
        class="inline-flex items-center text-yellow-600 dark:text-yellow-500 hover:text-yellow-700 dark:hover:text-yellow-400 mb-12 transition-colors"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-5 w-5 mr-2"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M10 19l-7-7m0 0l7-7m-7 7h18"
          />
        </svg>
        {{ $t('pages.contact.back') }}
      </router-link>

      <h1
        class="text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-8 italic uppercase tracking-tighter"
        v-html="
          $t('pages.contact.headline', {
            span:
              '<span class=\'text-yellow-600 dark:text-yellow-500\'>' +
              $t('pages.contact.headline_span') +
              '</span>',
          })
        "
      ></h1>

      <div class="grid md:grid-cols-2 gap-16">
        <div>
          <p class="text-xl leading-relaxed mb-8">
            {{ $t('pages.contact.description') }}
          </p>

          <div class="space-y-4">
            <div
              class="flex items-center gap-4 text-gray-900 dark:text-white font-bold"
            >
              <div
                class="w-10 h-10 bg-yellow-500/10 rounded-lg flex items-center justify-center text-yellow-600 dark:text-yellow-500"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <a
                href="mailto:info@latinstartup.com"
                class="hover:text-yellow-600 dark:hover:text-yellow-500 transition-colors"
              >
                info@latinstartup.com
              </a>
            </div>
            <div
              class="flex items-center gap-4 text-gray-900 dark:text-white font-bold"
            >
              <div
                class="w-10 h-10 bg-yellow-500/10 rounded-lg flex items-center justify-center text-yellow-600 dark:text-yellow-500"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"
                  />
                </svg>
              </div>
              {{ $t('pages.contact.community') }}
            </div>
          </div>
        </div>

        <form
          @submit.prevent="handleSubmit"
          class="bg-gray-50 dark:bg-white/5 p-8 rounded-3xl border border-gray-200 dark:border-white/10 space-y-6"
        >
          <div>
            <label
              class="block text-xs font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2"
              >{{ $t('pages.contact.nickname') }}</label
            >
            <input
              v-model="form.nickname"
              type="text"
              class="w-full bg-white dark:bg-black/50 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-yellow-500 transition-colors shadow-sm dark:shadow-none"
              :placeholder="$t('pages.contact.nickname_placeholder')"
            />
          </div>
          <div>
            <label
              class="block text-xs font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2"
              >{{ $t('pages.contact.subject') }}</label
            >
            <select
              v-model="form.subject"
              class="w-full bg-white dark:bg-black/50 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-yellow-500 transition-colors shadow-sm dark:shadow-none"
            >
              <option :value="$t('pages.contact.subjects.general')">{{ $t('pages.contact.subjects.general') }}</option>
              <option :value="$t('pages.contact.subjects.bug')">{{ $t('pages.contact.subjects.bug') }}</option>
              <option :value="$t('pages.contact.subjects.feature')">{{ $t('pages.contact.subjects.feature') }}</option>
              <option :value="$t('pages.contact.subjects.other')">{{ $t('pages.contact.subjects.other') }}</option>
            </select>
          </div>
          <div>
            <label
              class="block text-xs font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2"
              >{{ $t('pages.contact.message') }}</label
            >
            <textarea
              v-model="form.message"
              required
              rows="4"
              class="w-full bg-white dark:bg-black/50 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-yellow-500 transition-colors shadow-sm dark:shadow-none"
              :placeholder="$t('pages.contact.message_placeholder')"
            ></textarea>
          </div>

          <div v-if="statusMessage" :class="statusIsError ? 'text-red-500' : 'text-green-500'" class="text-xs font-bold">
            {{ statusMessage }}
          </div>

          <button
            :disabled="isSubmitting"
            class="w-full py-4 bg-yellow-500 text-black font-black uppercase tracking-widest rounded-xl hover:bg-yellow-400 transition-colors shadow-lg hover:shadow-yellow-500/20 disabled:opacity-50"
          >
            {{ isSubmitting ? '...' : $t('pages.contact.send') }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { urlsFactory } from '../vutils'

const { t } = useI18n()
const { httpUrl } = urlsFactory()

const form = ref({
  nickname: '',
  subject: t('pages.contact.subjects.general'),
  message: '',
})

const isSubmitting = ref(false)
const statusMessage = ref('')
const statusIsError = ref(false)

const handleSubmit = async () => {
  if (!form.value.message || !form.value.message.trim()) return

  isSubmitting.value = true
  statusMessage.value = ''
  statusIsError.value = false

  try {
    const res = await fetch(`${httpUrl}/api/contact`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(form.value),
    })

    const data = await res.json()

    if (res.ok && data.success) {
      statusIsError.value = false
      statusMessage.value = '¡Mensaje enviado con éxito!'
      form.value.nickname = ''
      form.value.message = ''
    } else {
      statusIsError.value = true
      statusMessage.value = data.error || 'Error al enviar el mensaje.'
    }
  } catch (err) {
    statusIsError.value = true
    statusMessage.value = 'Error de conexión con el servidor.'
  } finally {
    isSubmitting.value = false
  }
}
</script>
