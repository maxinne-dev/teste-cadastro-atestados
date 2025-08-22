export function validateEnv(env: Record<string, any>) {
  const out: Record<string, any> = { ...env }

  const required = ['MONGODB_URI', 'JWT_SECRET']
  for (const key of required) {
    if (!out[key] || String(out[key]).trim() === '') {
      throw new Error(`Missing required env: ${key}`)
    }
  }

  // Optional but recommended
  if (!out['WHO_ICD_CLIENT_ID'] || !out['WHO_ICD_CLIENT_SECRET']) {
    // Allow missing in local/test; just warn at runtime via console
  }

  // Normalize
  out['API_PORT'] = Number(out['API_PORT'] || 3000)

  return out
}

