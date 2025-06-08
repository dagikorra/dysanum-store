import { createClient } from '@sanity/client'

console.log("Project ID:", process.env.NEXT_PUBLIC_SANITY_PROJECT_ID)
console.log("Dataset:", process.env.NEXT_PUBLIC_SANITY_DATASET)

export const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: '2023-01-01',
  useCdn: true,
})
