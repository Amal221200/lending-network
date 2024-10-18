'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import LendingForm from '@/components/lending/LendingComponents'
import BorrowingForm from '@/components/borrowing/BorrowingComponent'
import KlasterProvider from './KlasterProvider'

export default function TokenExchangeTabs() {
  const [activeTab, setActiveTab] = useState('lend')

  return (
    <KlasterProvider>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full max-w-md mx-auto">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="lend">Lend</TabsTrigger>
          <TabsTrigger value="borrow">Borrow</TabsTrigger>
        </TabsList>
        <TabsContent value="lend">
          <LendingForm />
        </TabsContent>
        <TabsContent value="borrow">
          <BorrowingForm />
        </TabsContent>
      </Tabs>
    </KlasterProvider>
  )
}