"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Upload, Users, Shuffle, RotateCcw, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface SelectedPair {
  name1: string
  name2: string
  round: number
}

export default function RandomNameSelector() {
  const [allNames, setAllNames] = useState<string[]>([])
  const [remainingNames, setRemainingNames] = useState<string[]>([])
  const [selectedPairs, setSelectedPairs] = useState<SelectedPair[]>([])
  const [currentPair, setCurrentPair] = useState<SelectedPair | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const { toast } = useToast()

  const parseCSV = (text: string): string[] => {
    const lines = text.split("\n").filter((line) => line.trim())
    const names: string[] = []

    lines.forEach((line) => {
      // Handle CSV with commas, semicolons, or just line breaks
      const values = line.split(/[,;]/).map((val) => val.trim().replace(/"/g, ""))
      values.forEach((val) => {
        if (val && val.length > 0) {
          names.push(val)
        }
      })
    })

    return [...new Set(names)] // Remove duplicates
  }

  const handleFileUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (!file) return

      setIsUploading(true)

      try {
        const text = await file.text()
        const names = parseCSV(text)

        if (names.length < 2) {
          toast({
            title: "Error",
            description: "Please upload a file with at least 2 names.",
            variant: "destructive",
          })
          return
        }

        setAllNames(names)
        setRemainingNames([...names])
        setSelectedPairs([])
        setCurrentPair(null)

        toast({
          title: "Success",
          description: `Loaded ${names.length} names from the file.`,
        })
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to parse the file. Please check the format.",
          variant: "destructive",
        })
      } finally {
        setIsUploading(false)
      }
    },
    [toast],
  )

  const selectRandomPair = () => {
    if (remainingNames.length < 2) {
      toast({
        title: "No more pairs",
        description: "All names have been selected!",
        variant: "destructive",
      })
      return
    }

    // Randomly select two different names
    const shuffled = [...remainingNames].sort(() => Math.random() - 0.5)
    const name1 = shuffled[0]
    const name2 = shuffled[1]

    const newPair: SelectedPair = {
      name1,
      name2,
      round: selectedPairs.length + 1,
    }

    // Remove selected names from remaining list
    const updatedRemaining = remainingNames.filter((name) => name !== name1 && name !== name2)

    setCurrentPair(newPair)
    setSelectedPairs((prev) => [...prev, newPair])
    setRemainingNames(updatedRemaining)
  }

  const removePairFromHistory = (pairToRemove: SelectedPair) => {
    // Remove the pair from selected pairs
    const updatedSelectedPairs = selectedPairs.filter((pair) => pair.round !== pairToRemove.round)
    setSelectedPairs(updatedSelectedPairs)

    // Add the names back to remaining names if they're not already there
    const updatedRemainingNames = [...remainingNames]
    if (!updatedRemainingNames.includes(pairToRemove.name1)) {
      updatedRemainingNames.push(pairToRemove.name1)
    }
    if (!updatedRemainingNames.includes(pairToRemove.name2)) {
      updatedRemainingNames.push(pairToRemove.name2)
    }
    setRemainingNames(updatedRemainingNames)

    // If the removed pair was the current pair, clear it
    if (currentPair && currentPair.round === pairToRemove.round) {
      setCurrentPair(null)
    }

    toast({
      title: "Pair removed",
      description: `${pairToRemove.name1} and ${pairToRemove.name2} are now available for selection again.`,
    })
  }

  const resetApp = () => {
    setAllNames([])
    setRemainingNames([])
    setSelectedPairs([])
    setCurrentPair(null)
  }

  return (
    <div className="min-h-screen bg-white p-4 my-0 py-[50px]">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-gray-900">ArawUday India 2025</h1>
          <h2 className="text-2xl font-semibold text-gray-700">SLGS Quiz Contest</h2>
          <p className="text-gray-600">Upload a CSV/Excel file and randomly select pairs of names</p>
        </div>

        {/* File Upload Section - Only show when no names are loaded */}
        {allNames.length === 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload Attendee List
              </CardTitle>
              <CardDescription>
                Upload a CSV or Excel file with names. Each name should be on a new line or separated by commas.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="file-upload">Choose File</Label>
                  <Input
                    id="file-upload"
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileUpload}
                    disabled={isUploading}
                    className="mt-1"
                  />
                </div>

                {allNames.length > 0 && (
                  <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-green-600" />
                      <span className="text-green-800 font-medium">{allNames.length} names loaded</span>
                    </div>
                    <Badge variant="secondary">{remainingNames.length} remaining</Badge>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Selection Section */}
        {allNames.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shuffle className="h-5 w-5" />
                Random Selection
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <Button onClick={selectRandomPair} disabled={remainingNames.length < 2} size="lg" className="flex-1">
                    <Shuffle className="h-4 w-4 mr-2" />
                    Select Randomly
                  </Button>
                  <Button onClick={resetApp} variant="outline" size="lg">
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset
                  </Button>
                </div>

                {/* Current Selection Display */}
                {currentPair && (
                  <div className="p-6 bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg border-2 border-purple-200 px-3.5 py-3.5">
                    <h3 className="text-base font-semibold text-center mb-4 text-purple-800">
                      Round {currentPair.round} - Selected Pair
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-white p-4 rounded-lg shadow-sm text-center px-2.5 py-2.5 leading-[1.15rem]">
                        <div className="text-lg font-bold text-purple-600">{currentPair.name1}</div>
                      </div>
                      <div className="bg-white p-4 rounded-lg shadow-sm text-center px-2.5 py-2.5 leading-[1.15rem]">
                        <div className="text-lg font-bold text-purple-600">{currentPair.name2}</div>
                      </div>
                    </div>
                  </div>
                )}

                {remainingNames.length === 0 && selectedPairs.length > 0 && (
                  <div className="p-4 bg-green-100 rounded-lg border border-green-300 text-center">
                    <h3 className="text-lg font-semibold text-green-800">🎉 All names have been selected!</h3>
                    <p className="text-green-600">Total rounds completed: {selectedPairs.length}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* History Section */}
        {selectedPairs.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Selection History</CardTitle>
              <CardDescription>
                All previously selected pairs (click trash icon to remove and make names available again)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {selectedPairs.map((pair, index) => (
                  <div
                    key={`round-${pair.round}`}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <Badge variant="outline">Round {pair.round}</Badge>
                      <span className="font-medium">{pair.name1}</span>
                      <span className="text-gray-400">+</span>
                      <span className="font-medium">{pair.name2}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removePairFromHistory(pair)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2"
                      title="Remove this pair"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Remaining Names Count */}
        {remainingNames.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Remaining Names</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{remainingNames.length}</div>
                <p className="text-gray-600 mt-1">names left to select</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
