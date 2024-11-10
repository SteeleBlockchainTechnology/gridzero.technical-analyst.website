'use client'

import { useEffect, useState } from 'react'
import { Layout } from './components/Layout'
import { NewsPanel } from './components/NewsPanel'
import { TradingView } from './components/TradingView'
import { MarketAnalysis } from './components/MarketAnalysis'
import { AdvancedAnalysis } from './components/AdvancedAnalysis'
import { api } from './services/api'
import type { NewsItem, SentimentData, PredictionData, CryptoPrice } from './services/types'
import { Coins, Clock, TrendingUp, TrendingDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './components/ui/select'
import { Button } from "./components/ui/button"

export default function App() {
  const [crypto, setCrypto] = useState('bitcoin')
  const [news, setNews] = useState<NewsItem[]>([])
  const [sentiment, setSentiment] = useState<SentimentData[]>([])
  const [price, setPrice] = useState<CryptoPrice>({
    price: 0,
    change24h: 0,
    timestamp: Date.now()
  })
  const [predictions, setPredictions] = useState<PredictionData[]>([])
  const [timeframe, setTimeframe] = useState('1D')

  const timeframes = ['1H', '4H', '1D', '1W', '1M']
  const cryptos = [
    { id: 'bitcoin', symbol: 'BTC' },
    { id: 'ethereum', symbol: 'ETH' },
    { id: 'binancecoin', symbol: 'BNB' },
    { id: 'cardano', symbol: 'ADA' },
    { id: 'solana', symbol: 'SOL' }
  ]

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [newsData, sentimentData, priceData, predictionsData] = await Promise.all([
          api.getNews(crypto),
          api.getSentiment(crypto),
          api.getPrice(crypto),
          api.getPredictions(crypto)
        ])

        setNews(newsData.news)
        setSentiment(sentimentData)
        setPrice(priceData)
        setPredictions(predictionsData)
      } catch (error) {
        console.error('Error fetching data:', error)
      }
    }

    fetchData()
    const interval = setInterval(fetchData, 60000)

    return () => clearInterval(interval)
  }, [crypto])

  return (
    <Layout>
      <div className="container mx-auto p-4 text-white min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
        {/* Header - Futuristic design */}
        <Card className="mb-6 bg-black/30 border-none backdrop-blur-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Coins className="w-8 h-8 text-blue-400" />
                  <Select onValueChange={(value) => setCrypto(value)} defaultValue={crypto}>
                    <SelectTrigger className="w-[180px] bg-transparent border-none text-2xl font-bold text-gray-200">
                      <SelectValue placeholder="Select Crypto" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      {cryptos.map(({ id, symbol }) => (
                        <SelectItem key={id} value={id} className="text-white hover:bg-gray-700">
                          {symbol}/USD
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="w-6 h-6 text-blue-400" />
                  <div className="flex gap-1 bg-gray-800/50 p-1 rounded-full">
                    {timeframes.map((tf) => (
                      <Button
                        key={tf}
                        onClick={() => setTimeframe(tf)}
                        variant={timeframe === tf ? "default" : "ghost"}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                          timeframe === tf 
                            ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' 
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        {tf}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-3xl text-white font-bold">${price.price.toLocaleString()}</span>
                <span className={`flex items-center ${price.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {price.change24h >= 0 ? <TrendingUp className="w-5 h-5 mr-1" /> : <TrendingDown className="w-5 h-5 mr-1" />}
                  {Math.abs(price.change24h).toFixed(2)}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content - Enhanced grid layout with animations */}
        <div className="grid grid-cols-12 gap-6">
          {/* Left Column - Chart and Analysis */}
          <div className="col-span-8 space-y-6">
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
              >
                <Card className="overflow-hidden border-none text-white/60 bg-black/30 backdrop-blur-lg">
                  <CardContent className="p-0">
                    <TradingView 
                      crypto={crypto} 
                      timeframe={timeframe}
                      price={price}
                    />
                  </CardContent>
                </Card>
              </motion.div>
            </AnimatePresence>
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Card className="border-none bg-black/30 backdrop-blur-lg">
                  <CardHeader>
                    <CardTitle className="text-xl font-bold text-blue-300">Market Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <MarketAnalysis crypto={crypto} />
                  </CardContent>
                </Card>
              </motion.div>
            </AnimatePresence>
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <Card className="border-none bg-black/30 backdrop-blur-lg">
                  <CardHeader>
                    <CardTitle className="text-xl font-bold text-blue-300">Advanced Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <AdvancedAnalysis crypto={crypto} />
                  </CardContent>
                </Card>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Right Column - Sentiment Analysis and News */}
          <div className="col-span-4 space-y-6">
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.5 }}
              >
      
              </motion.div>
            </AnimatePresence>
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Card className="border-none bg-black/30 backdrop-blur-lg max-h-[800px] overflow-y-auto">
                  <CardHeader>
                    <CardTitle className="text-xl font-bold text-blue-300">Latest News</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <NewsPanel crypto={crypto} news={news} />
                  </CardContent>
                </Card>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </Layout>
  )
}