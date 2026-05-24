import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const functionDir = dirname(fileURLToPath(import.meta.url))
const testResponse = JSON.parse(
  readFileSync(join(functionDir, 'test-response1.json'), 'utf8'),
)

const TEST_DELAY_MS = 1500

export default async (req) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 })
  }

  const url = new URL(req.url)
  const isTestMode = url.searchParams.has('test')

  if (isTestMode) {
    await new Promise((resolve) => setTimeout(resolve, TEST_DELAY_MS))
    return Response.json(testResponse)
  }

  const apiToken = process.env.AUDD_API_TOKEN ?? process.env.VITE_AUDD_API_TOKEN
  if (!apiToken) {
    return Response.json({ error: 'Missing AUDD API token' }, { status: 500 })
  }

  const formData = await req.formData()
  const file = formData.get('file')
  if (!file || !(file instanceof Blob)) {
    return Response.json({ error: 'Missing audio file' }, { status: 400 })
  }

  const auddForm = new FormData()
  auddForm.append('file', file, file.name || 'recording.webm')
  auddForm.append('api_token', apiToken)
  auddForm.append('return', 'spotify')

  try {
    const auddResponse = await fetch('https://api.audd.io/', {
      method: 'POST',
      body: auddForm,
    })

    const data = await auddResponse.json()
    return Response.json(data, { status: auddResponse.ok ? 200 : auddResponse.status })
  } catch (error) {
    console.error('AudD API error:', error)
    return Response.json({ error: 'Recognition request failed' }, { status: 502 })
  }
}
