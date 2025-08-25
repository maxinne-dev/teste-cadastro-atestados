import { useToast } from 'primevue/usetoast'

type Severity = 'success' | 'info' | 'warn' | 'error'

export function useNotify() {
  let toast: { add: (args: any) => void }
  try {
    toast = useToast() as any
  } catch {
    // In unit tests or when ToastService is not installed, provide a no-op
    toast = { add: () => {} }
  }

  function notify(
    severity: Severity,
    summary: string,
    detail?: string,
    life = 3000,
  ) {
    toast.add({ severity, summary, detail, life })
  }

  return {
    notify,
    notifySuccess: (summary: string, detail?: string, life?: number) =>
      notify('success', summary, detail, life),
    notifyInfo: (summary: string, detail?: string, life?: number) =>
      notify('info', summary, detail, life),
    notifyWarn: (summary: string, detail?: string, life?: number) =>
      notify('warn', summary, detail, life),
    notifyError: (summary: string, detail?: string, life?: number) =>
      notify('error', summary, detail, life),
  }
}
