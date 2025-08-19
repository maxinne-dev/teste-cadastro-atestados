<template>
  <div class="p-4">
    <h1>Novo Atestado</h1>
    <input v-model="term" placeholder="Buscar CID..." @input="search" />
    <ul>
      <li v-for="r in results" :key="r.id">
        {{ r.theCode }} - {{ r.title?.['@value'] || r.title }}
      </li>
    </ul>
  </div>
</template>
<script setup lang="ts">
import axios from 'axios'
import { ref } from 'vue'
const term = ref('')
const results = ref<any[]>([])
const search = async () => {
  if (term.value.length < 2) { results.value = []; return }
  const { data } = await axios.get(`/api/icd/search?q=${encodeURIComponent(term.value)}`)
  results.value = data.results || []
}
</script>
