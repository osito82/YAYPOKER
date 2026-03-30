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
        Privacy <span class="text-yellow-500">Policy</span>
      </h1>

      <div class="space-y-8 text-lg leading-relaxed">
        <section>
          <h2 class="text-2xl font-bold text-white mb-4">1. Our Commitment to Your Privacy</h2>
          <p>
            At YayPoker, we believe that your business is your business. Our platform is designed from the ground up to be a safe, private, and "zero-data" environment for you to enjoy poker with your friends and family.
          </p>
        </section>

        <section class="bg-white/5 border border-white/10 p-6 rounded-2xl">
          <h2 class="text-2xl font-bold text-yellow-500 mb-4">2. No Personal Information (PII)</h2>
          <p class="mb-4">
            We do <strong>not</strong> collect, store, or process any Personally Identifiable Information (PII). 
          </p>
          <ul class="list-disc list-inside space-y-2 text-gray-400">
            <li>No Email Addresses required</li>
            <li>No Phone Numbers required</li>
            <li>No Real Names required</li>
            <li>No Credit Card or Financial Information</li>
          </ul>
        </section>

        <section>
          <h2 class="text-2xl font-bold text-white mb-4">3. What We Do Collect</h2>
          <p>
            The only information we use is the <strong>Nickname</strong> you choose when joining a table. This nickname is transient and used only to identify you to other players at your specific table. We do not link this nickname to any real-world identity.
          </p>
        </section>

        <section>
          <h2 class="text-2xl font-bold text-white mb-4">4. Cookies and Tracking</h2>
          <p>
            YayPoker does not use tracking cookies, advertising beacons, or third-party analytics that profile your behavior across the web. We may use local storage only to remember your preferences (like your last used nickname) for your convenience.
          </p>
        </section>

        <section>
          <h2 class="text-2xl font-bold text-white mb-4">5. Children's Privacy</h2>
          <p>
            While YayPoker is a "play money" social game intended for friendly entertainment, we encourage parents to supervise their children's online activities. Since we collect no personal data, we do not knowingly profile or target children.
          </p>
        </section>

        <section class="pt-8 border-t border-white/10">
          <p class="text-sm text-gray-500 italic">
            Last updated: March 2026. This policy is designed to comply with the spirit of modern privacy laws (GDPR, CCPA) by simply not collecting the data they protect.
          </p>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup>
// Privacy Policy Page
</script>
