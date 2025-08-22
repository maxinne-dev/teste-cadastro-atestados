import type { Directive } from 'vue'
import { formatCpf, normalizeCpf } from '../utils/formatters'

function applyCpf(el: HTMLInputElement) {
  const raw = el.value
  const digits = normalizeCpf(raw)
  const formatted = formatCpf(digits)
  el.value = formatted
  // place caret at end for simplicity
  try {
    el.setSelectionRange(formatted.length, formatted.length)
  } catch {}
  // Do not dispatch another input event to avoid recursion
}

export const mask: Directive<HTMLInputElement, 'cpf' | undefined> = {
  mounted(el, binding) {
    const type = binding.value
    if (type === 'cpf') {
      const handler = () => applyCpf(el)
      ;(el as any).__maskHandler = handler
      el.addEventListener('input', handler)
      // format initial value if present
      if (el.value) handler()
    }
  },
  unmounted(el) {
    const handler = (el as any).__maskHandler
    if (handler) el.removeEventListener('input', handler)
  },
}

export default mask
