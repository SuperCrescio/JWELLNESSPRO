import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from '@/lib/supabase';
import { getAIUIResponse } from '@/lib/openaiClient';
import { LogOut, BrainCircuit, Upload, Watch, Activity, FileJson, MessageSquare, AlertTriangle, ExternalLink, CheckCircle, BarChart3, HeartPulse, Moon } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FileUpload from '@/components/FileUpload';
import DynamicUIComponent from '@/components/DynamicUIComponent';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog.jsx"

const initialAIResponse = {
  type: 'card',
  title: 'Benvenuto in JWellness AI!',
  description: 'Sono qui per aiutarti a raggiungere i tuoi obiettivi di benessere. Carica i tuoi dati o connetti il tuo smartwatch per iniziare.',
  children: [
    {
      type: 'text',
      content: 'Cosa vorresti fare oggi?',
      size: 'lg',
      bold: true,
    },
    {
      type: 'buttonGroup',
      buttons: [
        { label: 'Analizza i miei ultimi pasti', action: 'analyze_meals_actual', payload: { period: 'last_week' } },
        { label: 'Suggerisci un allenamento', action: 'suggest_workout_actual', payload: { type: 'cardio' } },
        { label: 'Mostra progressi InBody', action: 'show_inbody_progress_actual' },
      ],
    },
  ],
};


const Home = ({ session }) => {
  const { toast } = useToast();
  const [currentUISchema, setCurrentUISchema] = useState(initialAIResponse);
  const [showFileUpload, setShowFileUpload] = useState(true);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [isOpenAIConfigured, setIsOpenAIConfigured] = useState(false);
  const [isCheckingConfig, setIsCheckingConfig] = useState(true);
  const [userBiometricData, setUserBiometricData] = useState([]);
  const [openAIKey, setOpenAIKey] = useState(() => localStorage.getItem('openaiApiKey') || '');
  const [connectedDevice, setConnectedDevice] = useState(null);

  const fetchUserBiometricData = useCallback(async () => {
    if (!session || !session.user) return;
    try {
      const { data, error } = await supabase
        .from('user_biometric_data')
        .select('data_type, value, unit, source, recorded_at')
        .eq('user_id', session.user.id)
        .order('recorded_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      setUserBiometricData(data || []);
    } catch (error) {
      console.error("Errore nel recuperare i dati biometrici:", error);
      toast({ title: "Errore Dati Biometrici", description: "Impossibile caricare i dati biometrici.", variant: "destructive" });
    }
  }, [session, toast]);

  useEffect(() => {
    fetchUserBiometricData();
  }, [fetchUserBiometricData]);


  const checkOpenAIConfig = useCallback((showToastNotification = false) => {
    setIsCheckingConfig(true);
    const key = localStorage.getItem('openaiApiKey') || '';
    if (key) {
      setIsOpenAIConfigured(true);
      setOpenAIKey(key);
      if (showToastNotification) {
        toast({
          title: 'OpenAI Configurato Correttamente!',
          description: "Le funzionalità AI sono ora attive.",
          variant: 'default',
          action: <CheckCircle className="h-5 w-5 text-green-500" />
        });
      }
    } else {
      setIsOpenAIConfigured(false);
      if (showToastNotification) {
        toast({
          title: 'Configurazione OpenAI Mancante',
          description: "La chiave API OpenAI non è stata ancora impostata. Le funzionalità AI non saranno disponibili.",
          variant: 'destructive',
          duration: 10000,
        });
      }
    }
    setIsCheckingConfig(false);
  }, [toast]);

  useEffect(() => {
    checkOpenAIConfig(true);
  }, [checkOpenAIConfig]);


  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({ title: 'Errore', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'A presto!', description: 'Sei stato disconnesso.' });
      setCurrentUISchema(initialAIResponse);
      setShowFileUpload(true);
    }
  };

  const fetchAIResponse = useCallback(async (action, payload) => {
    if (!isOpenAIConfigured || !openAIKey) {
      toast({
        title: 'Funzionalità AI non disponibile',
        description: 'La chiave API OpenAI non è configurata. Forniscila per continuare.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoadingAI(true);
    setShowFileUpload(false);
    toast({ title: 'Elaborazione AI in corso...', description: `Sto analizzando la tua richiesta: ${action}` });

    try {
      const { data: filesData, error: filesError } = await supabase
        .from('user_files')
        .select('file_name, file_type, created_at, file_path')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (filesError) {
        console.error('Errore nel recuperare i file utente:', filesError);
      }

      const messages = [
        { role: 'system', content: 'Sei un assistente per il benessere. Rispondi solo con JSON valido per definire una UI react secondo lo schema fornito.' },
        { role: 'user', content: JSON.stringify({ action, payload, userFiles: filesData || [] }) }
      ];

      const uiSchema = await getAIUIResponse(openAIKey, messages);

      setCurrentUISchema(uiSchema);

    } catch (error) {
      console.error('Errore durante la chiamata OpenAI:', error);
      toast({
        title: 'Errore AI',
        description: `Si è verificato un errore: ${error.message}. Utilizzo UI di fallback.`,
        variant: 'destructive',
      });
      setCurrentUISchema({
         type: 'card',
         title: 'Errore Comunicazione AI',
         description: 'Non è stato possibile ottenere una risposta dal motore AI. Riprova più tardi.',
         children: [{ type: 'button', label: 'Torna alla Home', action: 'go_back_main' }]
      });
    } finally {
      setIsLoadingAI(false);
    }

  }, [toast, isOpenAIConfigured, session, openAIKey]);


  const handleAIAction = (action, payload) => {
    if (action === 'go_back_main') {
      setShowFileUpload(true);
      setCurrentUISchema(initialAIResponse);
      setIsLoadingAI(false);
      fetchUserBiometricData(); 
      return;
    }
    if (action === 'sync_wearable_data_placeholder') {
      syncWearableData(payload.wearable);
      fetchAIResponse(action, payload);
      return;
    }
    fetchAIResponse(action, payload);
  };
  
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  useEffect(() => {
    const fileChannel = supabase.channel('user_files_changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'user_files' }, (payloadEntry) => {
        if(payloadEntry.new.user_id === session.user.id){
            toast({ title: 'Nuovo file caricato!', description: `${payloadEntry.new.file_name} pronto per l'analisi.`});
            if (isOpenAIConfigured) {
              setShowFileUpload(false);
              fetchAIResponse('new_file_uploaded', { fileName: payloadEntry.new.file_name, fileType: payloadEntry.new.file_type });
            } else {
               toast({ title: 'Analisi AI in pausa', description: 'Configura OpenAI per analizzare il file.', variant: 'default'});
            }
        }
      })
      .subscribe();
    
    const biometricChannel = supabase.channel('user_biometric_data_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_biometric_data' }, (payload) => {
        if (payload.new?.user_id === session.user.id || payload.old?.user_id === session.user.id) {
          fetchUserBiometricData();
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(fileChannel);
      supabase.removeChannel(biometricChannel);
    };
  }, [session.user.id, toast, fetchAIResponse, isOpenAIConfigured, fetchUserBiometricData]);

  const handleHeartRate = async (event) => {
    const value = event.target.value;
    const hr = value.getUint8(1);
    await supabase.from('user_biometric_data').insert({
      user_id: session.user.id,
      data_type: 'heart_rate',
      value: hr.toString(),
      unit: 'bpm',
      source: connectedDevice?.wearable || 'Wearable',
      recorded_at: new Date().toISOString(),
    });
  };

  const connectWearableDevice = async (wearableName) => {
    if (!navigator.bluetooth) {
      toast({ title: 'Bluetooth non supportato', description: 'Il browser non supporta Web Bluetooth', variant: 'destructive' });
      return;
    }
    try {
      const device = await navigator.bluetooth.requestDevice({ filters: [{ services: ['heart_rate'] }] });
      const server = await device.gatt.connect();
      const service = await server.getPrimaryService('heart_rate');
      const char = await service.getCharacteristic('heart_rate_measurement');
      await char.startNotifications();
      char.addEventListener('characteristicvaluechanged', handleHeartRate);
      setConnectedDevice({ device, char, wearable: wearableName });
      toast({ title: `Connesso a ${wearableName}`, description: device.name || wearableName });
    } catch (err) {
      console.error('Errore connessione wearable:', err);
      toast({ title: 'Errore Wearable', description: err.message, variant: 'destructive' });
    }
  };

  const syncWearableData = async (wearableName) => {
    if (!connectedDevice) {
      await connectWearableDevice(wearableName);
    }
    toast({ title: 'Sincronizzazione avviata', description: `Raccolgo dati da ${wearableName}` });
  };

  const wearableIntegrationAction = (wearableName) => {
    connectWearableDevice(wearableName);
  };

  const syncWearableDataAction = (wearableName) => {
    syncWearableData(wearableName);
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f0f4f8] to-[#d9e2ec] text-[#191919] font-sans flex flex-col">
      <motion.header 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 50 }}
        className="flex justify-between items-center p-4 border-b border-gray-300 sticky top-0 bg-white/80 backdrop-blur-md z-50 shadow-sm">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <BrainCircuit className="h-7 w-7 text-blue-600" />
          JWellness AI
        </h1>
        <div className="flex items-center gap-2">
          {isCheckingConfig ? (
             <Button variant="outline" size="sm" disabled>
                <Activity className="mr-2 h-4 w-4 animate-spin" />
                Verifica AI...
             </Button>
          ) : !isOpenAIConfigured ? (
             <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm"><AlertTriangle className="mr-2 h-4 w-4"/>Configura AI</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Configura OpenAI</AlertDialogTitle>
                  <AlertDialogDescription>
                    Inserisci la tua chiave API OpenAI per attivare le funzionalità di intelligenza artificiale.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="py-2 space-y-2">
                  <Input type="password" value={openAIKey} onChange={(e) => setOpenAIKey(e.target.value)} placeholder="sk-..." />
                  <Button variant="link" className="p-0" onClick={() => window.open('https://platform.openai.com/api-keys', '_blank')}>
                    Ottieni una chiave API <ExternalLink className="ml-1 h-4 w-4" />
                  </Button>
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annulla</AlertDialogCancel>
                  <AlertDialogAction onClick={() => { localStorage.setItem('openaiApiKey', openAIKey); checkOpenAIConfig(true); }}>
                    Salva Chiave
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : (
            <Button variant="ghost" size="sm" className="text-green-600 pointer-events-none">
                <CheckCircle className="mr-2 h-4 w-4"/>AI Attiva
            </Button>
          )}
          <Button variant="ghost" onClick={handleLogout} className="text-gray-700 hover:text-blue-600">
              <LogOut className="mr-2 h-4 w-4" />
              Esci
          </Button>
        </div>
      </motion.header>

      <main className="container mx-auto px-4 py-8 flex flex-col items-center flex-grow">
        <motion.div 
          className="w-full max-w-3xl"
          initial="hidden"
          animate="visible"
          variants={cardVariants}
        >
          {isLoadingAI ? (
            <Card className="w-full bg-white/80 backdrop-blur-sm shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Activity className="animate-spin h-6 w-6 text-blue-500" />Il Tuo Assistente AI sta Pensando...</CardTitle>
                <CardDescription>Un momento, sto preparando la tua esperienza personalizzata.</CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center py-10">
                 <div className="loader ease-linear rounded-full border-4 border-t-4 border-gray-200 h-12 w-12 mb-4 border-t-blue-500 animate-spin"></div>
              </CardContent>
            </Card>
          ) : showFileUpload ? (
            <motion.div variants={cardVariants} className="space-y-8">
              <Card className="bg-white/80 backdrop-blur-sm shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Upload className="h-6 w-6 text-blue-500"/>Carica i Tuoi Dati</CardTitle>
                  <CardDescription>Fornisci i tuoi documenti per un'analisi AI approfondita.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="Alimentazione" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 bg-gray-100">
                      <TabsTrigger value="Alimentazione">Alimentazione</TabsTrigger>
                      <TabsTrigger value="Allenamenti">Allenamenti</TabsTrigger>
                      <TabsTrigger value="InBody">Report InBody</TabsTrigger>
                    </TabsList>
                    <TabsContent value="Alimentazione" className="pt-4">
                      <FileUpload category="Alimentazione" session={session} />
                    </TabsContent>
                    <TabsContent value="Allenamenti" className="pt-4">
                      <FileUpload category="Allenamenti" session={session} />
                    </TabsContent>
                    <TabsContent value="InBody" className="pt-4">
                      <FileUpload category="InBody" session={session} />
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Watch className="h-6 w-6 text-teal-500"/>Dati Biometrici e Wearable</CardTitle>
                  <CardDescription>Collega il tuo smartwatch e sincronizza i dati biometrici tramite Web Bluetooth.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <img  alt="Illustrazione di vari smartwatch e fitness tracker connessi" className="w-full h-40 mb-2 object-contain rounded-lg shadow-inner bg-slate-100 p-2" src="https://images.unsplash.com/photo-1702500461144-db32f73ecd18" />
                  <p className="text-center text-gray-600 text-sm">
                    Assicurati che il dispositivo sia vicino e con Bluetooth attivo.
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <Button onClick={() => wearableIntegrationAction('Apple Watch')} className="bg-gray-800 hover:bg-gray-900 text-white w-full">Collega Apple Watch</Button>
                    <Button onClick={() => wearableIntegrationAction('Garmin')} className="bg-blue-700 hover:bg-blue-800 text-white w-full">Collega Garmin</Button>
                    <Button onClick={() => wearableIntegrationAction('Fitbit')} className="bg-teal-500 hover:bg-teal-600 text-white w-full">Collega Fitbit</Button>
                    <Button onClick={() => wearableIntegrationAction('Altro Dispositivo')} className="bg-gray-500 hover:bg-gray-600 text-white w-full">Collega Altro</Button>
                  </div>
                  <Button onClick={() => syncWearableDataAction('Wearable WebBT')} variant="outline" className="w-full border-dashed border-sky-500 text-sky-600 hover:bg-sky-50">
                    Sincronizza Dati Wearable
                  </Button>
                  {userBiometricData.length > 0 && (
                    <div className="pt-4">
                      <h3 className="text-md font-semibold mb-2 text-gray-700">Ultimi Dati Biometrici:</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                        {userBiometricData.slice(0,3).map(data => (
                          <div key={data.recorded_at + data.data_type} className="p-2 border rounded-md bg-slate-50">
                            <span className="font-medium capitalize text-slate-700">{data.data_type.replace('_', ' ')}: </span>
                            <span className="text-slate-600">{data.value} {data.unit}</span>
                            <span className="block text-slate-400 text-[10px]">({data.source} - {new Date(data.recorded_at).toLocaleTimeString()})</span>
                          </div>
                        ))}
                      </div>
                       {userBiometricData.length > 3 && <p className="text-xs text-center mt-2 text-gray-500">E altri {userBiometricData.length -3} record...</p>}
                    </div>
                  )}
                </CardContent>
              </Card>

               <Card className="bg-white/80 backdrop-blur-sm shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><MessageSquare className="h-6 w-6 text-purple-500"/>Interazione Diretta con l'AI</CardTitle>
                  <CardDescription>Se hai già caricato dati o vuoi provare l'AI, inizia qui.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center">
                   <DynamicUIComponent uiSchema={initialAIResponse} onAction={handleAIAction} />
                </CardContent>
              </Card>


            </motion.div>
          ) : (
            <motion.div variants={cardVariants}>
              <DynamicUIComponent uiSchema={currentUISchema} onAction={handleAIAction} />
            </motion.div>
          )}
        </motion.div>
      </main>
      
      <footer className="py-6 border-t border-gray-300 bg-white/70 backdrop-blur-sm">
          <div className="container mx-auto px-4 text-center text-gray-600">
              <p className="text-sm">&copy; {new Date().getFullYear()} JWellness AI. Sviluppato con passione.
                <Button variant="link" className="ml-1 p-0 h-auto text-sm text-blue-600 hover:text-blue-800" onClick={() => {
                    toast({
                        title: "JSON UI Schema Attuale",
                        description: <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4 overflow-x-auto"><code className="text-white">{JSON.stringify(currentUISchema, null, 2)}</code></pre>,
                        duration: 20000,
                        className: "max-w-lg",
                        action: <FileJson className="h-5 w-5 text-white"/>
                    });
                }}>
                    (Debug UI)
                </Button>
              </p>
          </div>
      </footer>
    </div>
  );
};

export default Home;
