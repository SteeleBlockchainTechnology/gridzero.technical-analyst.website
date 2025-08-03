'use client'

import { useEffect, useState } from 'react'
import { Layout } from './components/Layout'
import { NewsPanel } from './components/NewsPanel'
import { TradingView } from './components/TradingView'
import { MarketAnalysis } from './components/MarketAnalysis'
import { AdvancedAnalysis } from './components/AdvancedAnalysis'
import { ErrorBoundary } from './components/ErrorBoundary'
import { api } from './services/api'
import type { NewsItem, PredictionData, CryptoPrice, FeaturedCoin } from './services/types'
import { Coins, Clock} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './components/ui/select'
import { Button } from "./components/ui/button"
import { featuredCoinsService } from './services/featuredCoins'
import { FeaturedCoinsManager } from './components/FeaturedCoinsManager';

export default function App() {
  const [crypto, setCrypto] = useState('bitcoin')
  const [news, setNews] = useState<NewsItem[]>([])
  const [price, setPrice] = useState<CryptoPrice>({
    price: 0,
    change24h: 0,
    timestamp: Date.now()
  })
  const [predictions, setPredictions] = useState<PredictionData[]>([])
  const [timeframe, setTimeframe] = useState('1D')
  const [featuredCoins, setFeaturedCoins] = useState<FeaturedCoin[]>([]);

  const timeframes = ['1H', '4H', '1D', '1W', '1M']


  useEffect(() => {
    const fetchPriceData = async () => {
      try {
        const priceData = await api.getPrice(crypto);
        setPrice(priceData);
      } catch (error) {
        console.error('Error fetching price data:', error);
      }
    };

    fetchPriceData();
    const priceInterval = setInterval(fetchPriceData, 60000);

    return () => clearInterval(priceInterval);
  }, [crypto]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [newsData, predictionsData] = await Promise.all([
          api.getNews(crypto),
          api.getPredictions(crypto)
        ]);

        setNews(newsData.news);
        setPredictions(predictionsData);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, [crypto]);

  useEffect(() => {
    setFeaturedCoins(featuredCoinsService.getFeaturedCoins());
  }, []);

  const handleToggleCoin = (coinId: string) => {
    const updatedCoins = featuredCoinsService.toggleCoinStatus(coinId);
    setFeaturedCoins(updatedCoins);
  };

  const activeFeaturedCoins = featuredCoins.filter(coin => coin.isActive);

  return (
    <Layout>
      <div className="max-w-screen-2xl mx-auto p-9 text-white min-h-screen bg-black/10 backdrop-blur-lg">
        {/* Header Section - Made responsive */}
        <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 mb-6">
          <div className="flex flex-col w-full xl:w-auto gap-4">
            {/* Crypto Selection */}
            <div className="flex items-center gap-2">
              <Coins className="w-8 h-8 text-green-400" />
              <Select onValueChange={(value: string) => setCrypto(value)} defaultValue={crypto}>
                <SelectTrigger className="w-full xl:w-[180px]">
                  <SelectValue placeholder="Select Crypto" />
                </SelectTrigger>
                <SelectContent>
                  {activeFeaturedCoins.length > 0 ? (
                    activeFeaturedCoins.map(({ id, symbol }) => (
                      <SelectItem key={id} value={id}>
                        {symbol}/USD
                      </SelectItem>
                    ))
                  ) : (
                    <div className="p-3 text-center text-slate-400 text-sm">
                      Add featured coins to get started
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Price Display */}
            <div className="flex items-center gap-2">
              <span className="text-2xl xl:text-3xl text-white font-bold">
                ${price.price.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Timeframe Selection - Scrollable on mobile */}
          <div className="flex items-center gap-3 w-full xl:w-auto overflow-x-auto pb-2 xl:pb-0">
            <Clock className="w-6 h-6 text-green-400 flex-shrink-0" />
            <div className="flex gap-1 bg-gray-800/50 p-1 rounded-full">
              {timeframes.map((tf) => (
                <Button
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  variant={timeframe === tf ? "default" : "ghost"}
                  className={`px-3 xl:px-4 py-2 rounded-full text-sm font-medium transition-all flex-shrink-0 ${
                    timeframe === tf 
                      ? 'bg-green-500 text-white shadow-lg shadow-green-500/20' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {tf}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content Grid - Responsive layout */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          {/* Left Column */}
          <div className="col-span-1 xl:col-span-8 space-y-6">
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
              >
                <Card className="overflow-hidden border-none text-white/60 bg-black/30 backdrop-blur-lg">
                  <CardContent className="p-0">
                    <ErrorBoundary>
                      <TradingView 
                        crypto={crypto} 
                        timeframe={timeframe}
                        price={price}
                      />
                    </ErrorBoundary>
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
                    <CardTitle className="text-xl font-bold text-green-300">Market Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ErrorBoundary>
                      <MarketAnalysis 
                        crypto={crypto} 
                        predictions={predictions}
                      />
                    </ErrorBoundary>
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
                    <CardTitle className="text-xl font-bold text-green-300">Advanced Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ErrorBoundary>
                      <AdvancedAnalysis 
                        crypto={crypto} 
                        predictions={predictions}
                      />
                    </ErrorBoundary>
                  </CardContent>
                </Card>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Right Column */}
          <div className="col-span-1 xl:col-span-4 space-y-6">
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.5 }}
              >
                <FeaturedCoinsManager 
                  coins={featuredCoins}
                  onToggleCoin={handleToggleCoin}
                  onReorderCoins={(coins) => {
                    featuredCoinsService.reorderCoins(coins);
                    setFeaturedCoins(coins);
                  }}
                  onAddCoin={(coin) => {
                    const updatedCoins = featuredCoinsService.addCoin(coin);
                    setFeaturedCoins(updatedCoins);
                  }}
                  onRemoveCoin={(coinId) => {
                    const updatedCoins = featuredCoinsService.removeCoin(coinId);
                    setFeaturedCoins(updatedCoins);
                  }}
                />
              </motion.div>
            </AnimatePresence>

            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Card className="border-none bg-black/30 backdrop-blur-lg">
                  <CardHeader>
                    <CardTitle className="text-xl font-bold text-green-300">Latest News</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <ErrorBoundary>
                      <NewsPanel crypto={crypto} news={news} />
                    </ErrorBoundary>
                  </CardContent>
                </Card>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </Layout>
  );
}