<template>
  <div class="min-h-screen bg-[#0a0a0a] text-gray-300 font-sans p-8 md:p-16">
    <div class="max-w-4xl mx-auto">
      <router-link to="/" class="inline-flex items-center text-yellow-500 hover:text-yellow-400 mb-12 transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to Home
      </router-link>

      <h1 class="text-4xl md:text-5xl font-black text-white mb-8 italic uppercase tracking-tighter">
        Get in <span class="text-yellow-500">Touch</span>
      </h1>

      <div class="grid md:grid-cols-2 gap-16">
        <div>
          <p class="text-xl leading-relaxed mb-8">
            Have questions about YayPoker? Want to report a bug or suggest a feature for your family game nights? We'd love to hear from you.
          </p>
          
          <div class="space-y-4">
            <div class="flex items-center gap-4 text-white font-bold">
              <div class="w-10 h-10 bg-yellow-500/10 rounded-lg flex items-center justify-center text-yellow-500">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              support@yaypoker.com
            </div>
            <div class="flex items-center gap-4 text-white font-bold">
              <div class="w-10 h-10 bg-yellow-500/10 rounded-lg flex items-center justify-center text-yellow-500">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                </svg>
              </div>
              Join our Community
            </div>
          </div>
        </div>

        <form @submit.prevent="handleSubmit" class="bg-white/5 p-8 rounded-3xl border border-white/10 space-y-6">
          <div>
            <label class="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">Nickname (Optional)</label>
            <input 
              type="text" 
              class="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-yellow-500 transition-colors"
              placeholder="How should we call you?"
            />
          </div>
          <div>
            <label class="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">Subject</label>
            <select class="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-yellow-500 transition-colors">
              <option>General Inquiry</option>
              <option>Bug Report</option>
              <option>Feature Request</option>
              <option>Other</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">Message</label>
            <textarea 
              rows="4"
              class="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-yellow-500 transition-colors"
              placeholder="Tell us what's on your mind..."
            ></textarea>
          </div>
          <button class="w-full py-4 bg-yellow-500 text-black font-black uppercase tracking-widest rounded-xl hover:bg-yellow-400 transition-colors">
            Send Message
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
const handleSubmit = () => {
  alert('Thank you for your message! This is a demo form.')
}
</script>
