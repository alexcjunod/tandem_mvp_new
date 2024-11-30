import { NextResponse } from 'next/server'
import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { WebhookEvent } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const headersList = headers()
  const svix_id = headersList.get("svix-id")
  const svix_timestamp = headersList.get("svix-timestamp")
  const svix_signature = headersList.get("svix-signature")

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return NextResponse.json({ error: 'Missing svix headers' }, { status: 400 })
  }

  // Get the body
  const payload = await req.json()
  const body = JSON.stringify(payload)

  const wh = new Webhook(process.env.WEBHOOK_SECRET || '')

  try {
    const evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent

    // Handle the webhook
    if (evt.type === 'user.created' || evt.type === 'user.updated') {
      const { data } = evt
      if ('email_addresses' in data) {
        const email = data.email_addresses?.[0]?.email_address
        const firstName = 'first_name' in data ? data.first_name : ''
        const lastName = 'last_name' in data ? data.last_name : ''
        const imageUrl = 'image_url' in data ? data.image_url : ''

        const { error: upsertError } = await supabase
          .from('profiles')
          .upsert({
            id: data.id,
            email,
            full_name: `${firstName || ''} ${lastName || ''}`.trim(),
            avatar_url: imageUrl,
            updated_at: new Date().toISOString()
          })

        if (upsertError) {
          console.error('Error upserting profile:', upsertError)
          return NextResponse.json({ error: 'Database error' }, { status: 500 })
        }
      }
    }

    return NextResponse.json({ message: 'Success' }, { status: 200 })
  } catch (err) {
    console.error('Error verifying webhook:', err)
    return NextResponse.json({ error: 'Error verifying webhook' }, { status: 400 })
  }
} 