import cors from 'cors'
import express from 'express'

const app = express()
const PORT = 3000

app.use(cors({ origin: 'http://localhost:5500' }))
app.use(express.json())

app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
