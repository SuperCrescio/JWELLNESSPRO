
import React, { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import Auth from './components/auth/Auth'
import Home from './pages/Home'

const App = () => {
  const [session, setSession] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <div>
      {!session ? <Auth /> : <Home key={session.user.id} session={session} />}
    </div>
  )
}

export default App
  