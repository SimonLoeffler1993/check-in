import { existsSync } from 'node:fs'
import { defineConfig } from 'prisma/config'

if (existsSync('.env')) process.loadEnvFile('.env')

export default defineConfig({
  schema: 'prisma/schema.prisma',
  // process.env statt env(): "prisma generate" soll auch ohne Datenbank laufen
  datasource: { url: process.env.DATABASE_URL ?? '' },
})
