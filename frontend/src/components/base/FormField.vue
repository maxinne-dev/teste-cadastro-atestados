<template>
  <div class="form-field">
    <label
      v-if="label"
      class="label"
      :for="forId"
    >
      {{ label }}<span
        v-if="required"
        aria-hidden="true"
      > *</span>
    </label>
    <div class="control">
      <slot />
      <div class="extra">
        <slot name="extra" />
      </div>
    </div>
    <p
      v-if="hint"
      class="hint"
    >
      {{ hint }}
    </p>
    <ul
      v-if="errorList.length"
      class="error"
      role="alert"
    >
      <li
        v-for="(err, i) in errorList"
        :key="i"
      >
        {{ err }}
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  label?: string
  hint?: string
  error?: string | string[]
  required?: boolean
  for?: string
}>()
const forId = computed(() => props.for)
const errorList = computed(() =>
  props.error ? (Array.isArray(props.error) ? props.error : [props.error]) : [],
)
</script>

<style scoped>
.form-field {
  margin-bottom: var(--space-4);
}
.label {
  display: inline-block;
  margin-bottom: var(--space-2);
  font-weight: var(--font-weight-medium);
}
.hint {
  color: var(--color-text-secondary);
  margin-top: var(--space-1);
}
.error {
  color: var(--color-error);
  margin: var(--space-1) 0 0;
  padding-left: var(--space-4);
}
.control {
  position: relative;
}
.extra {
  position: absolute;
  right: var(--space-2);
  top: 50%;
  transform: translateY(-50%);
}
</style>
