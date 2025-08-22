<template>
  <div class="container py-4">
    <PageHeader title="Dashboard" />
    <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(220px,1fr)); gap:16px;" class="mt-4">
      <StatCard icon="pi-users" title="Colaboradores" :value="collaboratorCount" />
      <StatCard icon="pi-id-card" title="Atestados" :value="certificateCount" />
      <StatCard icon="pi-check-circle" title="Ativos" :value="activeCertificates" />
    </div>
    <div class="mt-4">
      <Card>
        <h3 style="margin-top:0">Atividades Recentes</h3>
        <ul>
          <li>João Pereira alterou status de colaborador</li>
          <li>Novo atestado para Maria da Silva</li>
        </ul>
      </Card>
    </div>
    <div class="mt-4">
      <Card>
        <h3 style="margin-top:0">Indicadores</h3>
        <div class="chart-placeholder">Gráfico placeholder</div>
      </Card>
    </div>
  </div>
</template>
<script setup lang="ts">
import PageHeader from './components/PageHeader.vue'
import StatCard from './components/StatCard.vue'
import Card from './components/Card.vue'
import { collaborators, certificates } from './mocks/data'

const collaboratorCount = collaborators.length
const certificateCount = certificates.length
const activeCertificates = certificates.filter(c => c.status === 'active').length
</script>
<style scoped>
.chart-placeholder { height: 220px; border: 1px dashed var(--color-border); border-radius: var(--radius-md); display: grid; place-items: center; color: var(--color-text-secondary); }
</style>
