'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const tokens = [
  { symbol: 'ETH', name: 'Ethereum', rate: 1 },
  { symbol: 'USDC', name: 'USD Coin', rate: 1800 },
  { symbol: 'DAI', name: 'Dai', rate: 1800 },
  { symbol: 'WBTC', name: 'Wrapped Bitcoin', rate: 30000 },
]

export default function BorrowingForm() {
  const [amount, setAmount] = useState('')
  const [borrowToken, setBorrowToken] = useState('')
  const [collateralToken, setCollateralToken] = useState('')
  const [collateralAmount, setCollateralAmount] = useState('0')

  useEffect(() => {
    if (amount && borrowToken && collateralToken) {
      const borrowRate = tokens.find(t => t.symbol === borrowToken)?.rate || 1
      const collateralRate = tokens.find(t => t.symbol === collateralToken)?.rate || 1
      const collateral = ((parseFloat(amount) * borrowRate) / collateralRate * 1.5).toFixed(6) // 150% collateralization
      setCollateralAmount(collateral)
    } else {
      setCollateralAmount('0')
    }
  }, [amount, borrowToken, collateralToken])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Borrowing:', { amount, borrowToken, collateralToken, collateralAmount })
    alert(`Borrowing ${amount} ${borrowToken} with ${collateralAmount} ${collateralToken} as collateral`)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Borrow Tokens</CardTitle>
        <CardDescription>Borrow tokens by providing collateral.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="borrow-amount">Amount to Borrow</Label>
            <Input
              id="borrow-amount"
              type="number"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="borrow-token">Token to Borrow</Label>
            <Select value={borrowToken} onValueChange={setBorrowToken} required>
              <SelectTrigger id="borrow-token">
                <SelectValue placeholder="Select token" />
              </SelectTrigger>
              <SelectContent>
                {tokens.map((token) => (
                  <SelectItem key={token.symbol} value={token.symbol}>
                    {token.name} ({token.symbol})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {/* <div className="space-y-2">
            <Label htmlFor="collateral-token">Collateral Token</Label>
            <Select value={collateralToken} onValueChange={setCollateralToken} required>
              <SelectTrigger id="collateral-token">
                <SelectValue placeholder="Select token" />
              </SelectTrigger>
              <SelectContent>
                {tokens.map((token) => (
                  <SelectItem key={token.symbol} value={token.symbol}>
                    {token.name} ({token.symbol})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div> */}
          {amount && borrowToken && collateralToken && (
            <div className="text-sm text-muted-foreground">
              You need to provide approximately {collateralAmount} {collateralToken} as collateral
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full">Submit Borrowing Request</Button>
        </CardFooter>
      </form>
    </Card>
  )
}