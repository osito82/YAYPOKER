<script setup>
import { useThemeStore } from './store/themeStore'
const themeStore = useThemeStore()
</script>

<template>
  <router-view />
</template>
