import { useState } from 'react'
import { Button } from '@workspace/ui/components/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@workspace/ui/components/card'
import { Input } from '@workspace/ui/components/input'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center gap-8 mb-8">
          <a href="https://vite.dev" target="_blank">
            <img src={viteLogo} className="logo" alt="Vite logo" />
          </a>
          <a href="https://react.dev" target="_blank">
            <img src={reactLogo} className="logo react" alt="React logo" />
          </a>
        </div>
        
        <h1 className="text-4xl font-bold text-center mb-8">Dashboard</h1>
        
        <div className="max-w-md mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Welcome to your Dashboard</CardTitle>
              <CardDescription>
                This is a sample dashboard built with Vite, React, and shadcn/ui components.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="sample-input" className="text-sm font-medium">
                  Sample Input
                </label>
                <Input 
                  id="sample-input" 
                  placeholder="Type something here..." 
                />
              </div>
              
              <Button 
                onClick={() => setCount((count) => count + 1)}
                className="w-full"
              >
                Count is {count}
              </Button>
              
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  Secondary
                </Button>
                <Button variant="destructive" size="sm">
                  Destructive
                </Button>
                <Button variant="ghost" size="sm">
                  Ghost
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Another Card</CardTitle>
              <CardDescription>
                Demonstrating the card component with different content.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Edit <code>src/App.tsx</code> and save to test HMR with shadcn/ui components.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default App
