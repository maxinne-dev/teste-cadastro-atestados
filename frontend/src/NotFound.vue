<template>
  <div class="container" style="padding: 64px 0; text-align: center;">
    <i class="pi pi-exclamation-triangle" style="font-size: 48px; color: var(--color-warning);"></i>
    <h2>Página não encontrada</h2>
    <p>A rota acessada não existe.</p>
    <router-link class="btn" :to="{ name: 'dashboard' }">Voltar ao início</router-link>
  </div>
</template>
<script setup lang="ts"></script>
<style scoped>
.btn { padding: 8px 12px; border-radius: var(--radius-md); border: 1px solid var(--color-border); background: var(--color-surface); cursor: pointer; display: inline-block; }
</style>

