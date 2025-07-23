import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

//  Plug in your actual credentials
const supabaseUrl = 'https://ffajyjqtidprerlmebvf.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZmYWp5anF0aWRwcmVybG1lYnZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4ODYyMzQsImV4cCI6MjA2NzQ2MjIzNH0.d4SZh6d8M8oKZk0fr5jsMRuZQo_lghIS2p0mbg74yQQ'

const supabase = createClient(supabaseUrl, supabaseKey)

//  Fetch data from a table (example: messages)
async function fetchMessages() {
  const { data, error } = await supabase
    .from('messages') // change table name if needed
    .select('*')

  const output = document.getElementById('output')

  // Check if output element exists before trying to use it
  if (!output) {
    console.warn(' Element with id "output" not found in the DOM')
    return
  }

  if (error) {
    console.error(' Error:', error)
    output.textContent = ' Failed to load data.'
  } else {
    console.log(' Data:', data)
    output.innerHTML = `<pre>${JSON.stringify(data, null, 2)}</pre>`
  }
}

fetchMessages()
