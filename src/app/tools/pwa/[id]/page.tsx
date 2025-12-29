'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { PwaEditor } from '../components/PwaEditor'
import { PwaEmulator } from '../components/PwaEmulator'
import { Button } from '@/components/ui/button'
import { ChevronLeft } from 'lucide-react'
import { toast } from 'react-hot-toast'

export default function PwaProjectPage() {
  const params = useParams()
  const router = useRouter()
  // Ensure we assert id as string, though useParams usually returns string | string[]
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id as string

  const [pwaData, setPwaData] = useState<any>(null)

  if (!id) return null

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="bg-background border-b p-4 flex items-center gap-4">
         <Button variant="ghost" size="sm" onClick={() => router.push('/tools/pwa')}>
            <ChevronLeft className="h-4 w-4 mr-1" /> Back
         </Button>
         <h1 className="text-xl font-bold">PWA Studio</h1>
      </div>
      <div className="flex-1 flex overflow-hidden">
         <div className="flex-1 flex flex-col min-w-0 border-r">
            <PwaEditor pwaId={id} onDataChange={setPwaData} />
         </div>
         <div className="w-[400px] hidden xl:block bg-muted/10 border-l">
            {pwaData ? <PwaEmulator config={pwaData} /> : <div className="p-8 text-center text-muted-foreground">Loading preview...</div>}
         </div>
      </div>
    </div>
  )
}
