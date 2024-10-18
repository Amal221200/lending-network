'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { parseEther, formatEther } from 'viem'
import { encodeSupplyItx, executeItx, getUnifiedBalance, mcChainLink } from '@/tokenMappings'
import { useKlasterContext } from '../token-exchange/KlasterProvider'
import { useAccount } from '@particle-network/connectkit'

// Mock token data
const tokens = [
  { symbol: 'ETH', name: 'Ethereum', rate: 1 },
  { symbol: 'USDC', name: 'USD Coin', rate: 1800 },
  { symbol: 'DAI', name: 'Dai', rate: 1800 },
  { symbol: 'WBTC', name: 'Wrapped Bitcoin', rate: 30000 },
]

export default function LendingForm() {
  const { klaster } = useKlasterContext()
  const [amount, setAmount] = useState('')
  const [haveToken, setHaveToken] = useState('')
  const [lendToken, setLendToken] = useState('')
  const [convertedAmount, setConvertedAmount] = useState('0')
  const { address } = useAccount()

  useEffect(() => {
    if (amount && haveToken) {
      const haveRate = tokens.find(t => t.symbol === haveToken)?.rate || 1
      // const lendRate = tokens.find(t => t.symbol === lendToken)?.rate || 1
      // const converted = ((parseFloat(amount) * haveRate) / lendRate).toFixed(6)
      // setConvertedAmount(converted)
    } else {
      setConvertedAmount('0')
    }

    if (klaster) {
      console.log(klaster);

      getUnifiedBalance(klaster).then((uBalance) => {
        console.log(uBalance);
      })
    }

  }, [amount, haveToken, klaster])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // Here you would typically send the form data to your backend or smart contract
    const itx = await encodeSupplyItx({
      klasterSDK: klaster,
      tokenMapping: mcChainLink,
      destChainId: 421614,
      inputAmount: parseEther(amount),
      paymentChainId: 11155111,
      paymentToken: "LINK",
      recipientAddress: klaster.account.address
    })

    const result = await executeItx(itx, klaster, "0xD5E6249774b6738364220A430f7c7ca7aE9C500a");

    console.log(result);
    
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Convert & Lend Tokens</CardTitle>
        <CardDescription>Convert your available tokens into tokens you want to lend.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount to Convert</Label>
            <Input
              id="amount"
              type="number"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              step="any"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="have-token">Token You Have</Label>
            <Select value={haveToken} onValueChange={setHaveToken} required>
              <SelectTrigger id="have-token">
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
            <Label htmlFor="lend-token">Token to Lend</Label>
            <Select value={lendToken} onValueChange={setLendToken} required>
              <SelectTrigger id="lend-token">
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
          {amount && haveToken && lendToken && (
            <div className="text-sm text-muted-foreground">
              You will be able to lend approximately {convertedAmount} {lendToken}
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full">Submit Lending Request</Button>
        </CardFooter>
      </form>
    </Card>
  )
}