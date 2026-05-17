import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'

// Hardcoded for the script
const supabaseUrl = 'https://mwkdloytzwejqpdfcgov.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13a2Rsb3l0endlanFwZGZjZ292Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzU1NTcyMCwiZXhwIjoyMDkzMTMxNzIwfQ.Zm9nq7Pl8tZx6ZFbHo4EKd0UFfDeIkSiLtaX4OUpKr0'

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function run() {
  const email = 'himanshurathi341@gmail.com'
  const password = 'himansh3244l'
  
  const hash = await bcrypt.hash(password, 10)
  
  // Check if user exists
  const { data: user } = await supabase.from('users').select('id').eq('email', email).single()
  
  if (user) {
    const { error } = await supabase.from('users').update({ password_hash: hash, role: 'ADMIN' }).eq('id', user.id)
    if (error) console.error('Error updating:', error)
    else console.log('Admin password updated successfully!')
  } else {
    // Insert new user
    // We need an ID, let Supabase auto-generate if it's uuid, or generate one.
    const { error } = await supabase.from('users').insert({
      email: email,
      password_hash: hash,
      role: 'ADMIN'
    })
    if (error) console.error('Error inserting:', error)
    else console.log('Admin user created successfully!')
  }
}

run()
