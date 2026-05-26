import { apiUrl } from './client'
import type { PipelineResult } from '../types/pipeline'

export async function runPipeline(): Promise<PipelineResult> {
  const response = await fetch(apiUrl('/api/pipeline/run'), { method: 'POST' })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || `Pipeline failed (${response.status})`)
  }

  return response.json() as Promise<PipelineResult>
}

export async function checkApiHealth(): Promise<boolean> {
  try {
    const response = await fetch(apiUrl('/api/health'))
    return response.ok
  } catch {
    return false
  }
}
