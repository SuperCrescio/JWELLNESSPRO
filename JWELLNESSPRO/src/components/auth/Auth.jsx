
import React, { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from "@/components/ui/use-toast"
import { motion } from 'framer-motion'
import { BrainCircuit } from 'lucide-react'

export default function Auth() {
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { toast } = useToast()

  const handleLogin = async (event) => {
    event.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      toast({ title: 'Errore', description: error.message, variant: 'destructive' })
    } else {
      toast({ title: 'Successo!', description: 'Accesso effettuato. Benvenuto!' })
    }
    setLoading(false)
  }

  const handleSignup = async (event) => {
    event.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signUp({ email, password })

    if (error) {
      toast({ title: 'Errore', description: error.message, variant: 'destructive' })
    } else {
      toast({ title: 'Successo!', description: 'Controlla la tua email per il link di verifica!' })
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f7f4]">
      <motion.div 
        className="w-full max-w-md p-8 space-y-8 bg-white rounded-2xl shadow-lg"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-center">
            <BrainCircuit className="mx-auto h-12 w-12 text-blue-500"/>
            <h1 className="text-3xl font-bold text-gray-900 mt-4">JWellness AI</h1>
            <p className="mt-2 text-sm text-gray-600">Accedi o registrati per iniziare la tua conversazione con il benessere.</p>
        </div>
        <form className="mt-8 space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="email">Indirizzo Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                required
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@esempio.com"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                required
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-1"
              />
            </div>
          </div>

          <div className="flex flex-col space-y-2">
             <Button onClick={handleLogin} disabled={loading} className="w-full bg-[#191919] text-white hover:bg-[#333]">
              {loading ? 'Accesso in corso...' : 'Accedi'}
            </Button>
            <Button onClick={handleSignup} disabled={loading} variant="outline" className="w-full">
              {loading ? 'Registrazione...' : 'Registrati'}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}
  