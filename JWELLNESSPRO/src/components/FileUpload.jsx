import React, { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useToast } from "@/components/ui/use-toast"
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Upload, FileText, Trash2, Loader2 } from 'lucide-react'

const FileUpload = ({ category, session }) => {
  const { toast } = useToast()
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [selectedFile, setSelectedFile] = useState(null)
  const [userFiles, setUserFiles] = useState([])
  const [loadingFiles, setLoadingFiles] = useState(true)

  const fetchUserFiles = useCallback(async () => {
    setLoadingFiles(true)
    const { data, error } = await supabase
      .from('user_files')
      .select('id, file_name, created_at, file_size, file_path')
      .eq('user_id', session.user.id)
      .eq('file_type', category)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching files:', error)
      toast({ title: "Errore nel caricare i file", description: error.message, variant: "destructive" })
    } else {
      setUserFiles(data)
    }
    setLoadingFiles(false)
  }, [session.user.id, category, toast])

  useEffect(() => {
    fetchUserFiles()
  }, [fetchUserFiles])

  const handleFileChange = (event) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0]
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        toast({ title: "Tipo di file non valido", description: "Per favore carica solo file PDF, JPG o PNG.", variant: "destructive" });
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: "File troppo grande", description: "La dimensione massima del file è 5MB.", variant: "destructive" });
        return;
      }
      setSelectedFile(file)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({ title: "Nessun file selezionato", description: "Per favore, scegli un file da caricare.", variant: "destructive" })
      return
    }

    setUploading(true)
    setProgress(0)
    
    const fileName = `${Date.now()}_${selectedFile.name}`
    const filePath = `${session.user.id}/${category}/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('user_documents')
      .upload(filePath, selectedFile, {
        cacheControl: '3600',
        upsert: false,
        onUploadProgress: (event) => {
            if (event.lengthComputable) {
                const percentage = Math.round((event.loaded / event.total) * 100);
                setProgress(percentage);
            }
        }
      })

    if (uploadError) {
      toast({ title: "Errore di caricamento", description: uploadError.message, variant: "destructive" })
      setUploading(false)
      return
    }
    
    const { error: dbError } = await supabase
        .from('user_files')
        .insert({
            user_id: session.user.id,
            file_name: selectedFile.name,
            file_path: filePath,
            file_type: category,
            mime_type: selectedFile.type,
            file_size: selectedFile.size
        })

    if(dbError) {
        toast({ title: "Errore nel salvataggio del file", description: dbError.message, variant: "destructive" })
    } else {
        toast({ title: "Caricamento completato!", description: `${selectedFile.name} è stato caricato con successo.` })
        setSelectedFile(null)
        if (document.getElementById(`file-input-${category}`)) {
          document.getElementById(`file-input-${category}`).value = "";
        }
        fetchUserFiles();
    }
    
    setUploading(false)
  }

  const handleDelete = async (fileId, filePath) => {
    const { error: storageError } = await supabase.storage
        .from('user_documents')
        .remove([filePath]);

    if(storageError){
        toast({ title: "Errore di eliminazione", description: storageError.message, variant: "destructive" });
        return;
    }

    const { error: dbError } = await supabase
        .from('user_files')
        .delete()
        .eq('id', fileId);

    if(dbError){
        toast({ title: "Errore di eliminazione dal database", description: dbError.message, variant: "destructive" });
    } else {
        toast({ title: "File eliminato", description: "Il file è stato eliminato con successo." });
        fetchUserFiles();
    }
  }

  const formatBytes = (bytes, decimals = 2) => {
    if (!+bytes) return '0 Bytes'
    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
  }

  return (
    <Card className="w-full bg-white/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            Carica un file per {category}
        </CardTitle>
        <CardDescription>Carica i tuoi documenti (PDF, JPG, PNG - max 5MB). L'AI li analizzerà per te.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-2">
                <Input id={`file-input-${category}`} type="file" onChange={handleFileChange} accept=".pdf,.jpg,.jpeg,.png" disabled={uploading} className="flex-grow" />
                <Button onClick={handleUpload} disabled={uploading || !selectedFile} className="w-full sm:w-auto">
                    {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                    Carica
                </Button>
            </div>
            {uploading && (
                <div className="space-y-1 pt-2">
                    <p className="text-sm font-medium">Caricamento in corso: {selectedFile.name}</p>
                    <Progress value={progress} className="w-full" />
                </div>
            )}
            <div className="space-y-2 pt-4">
                <h4 className="font-semibold text-left">File caricati</h4>
                {loadingFiles ? (
                    <div className="flex items-center justify-center p-4"><Loader2 className="h-6 w-6 animate-spin" /></div>
                ) : userFiles.length > 0 ? (
                    <ul className="divide-y divide-gray-200 rounded-md border bg-white">
                        {userFiles.map((file) => (
                            <li key={file.id} className="flex items-center justify-between p-3">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <FileText className="h-5 w-5 text-gray-500 flex-shrink-0" />
                                    <div className="truncate">
                                        <p className="text-sm font-medium truncate">{file.file_name}</p>
                                        <p className="text-xs text-gray-500">
                                            {new Date(file.created_at).toLocaleDateString()} - {formatBytes(file.file_size)}
                                        </p>
                                    </div>
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => handleDelete(file.id, file.file_path)}>
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-sm text-center text-gray-500 py-4 border rounded-md bg-white">Nessun file caricato per questa categoria.</p>
                )}
            </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default FileUpload