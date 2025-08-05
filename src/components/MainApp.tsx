import { useEffect, useState } from 'react'
import { Layout } from './Layout'
import { NewsPanel } from './NewsPanel'
import { TradingView } from './TradingView'
import { MarketAnalysis } from './MarketAnalysis'
import { AdvancedAnalysis } from './AdvancedAnalysis'
import { ErrorBoundary } from './ErrorBoundary'
import { api } from '../services/api'
import type { NewsItem, PredictionData, CryptoPrice, FeaturedCoin } from '../services/types'
import { Coins, Clock} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Button } from "./ui/button"
import { featuredCoinsService } from '../services/featuredCoins'
import { FeaturedCoinsManager } from './FeaturedCoinsManager'

export default function MainApp() {
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
  const [loading, setLoading] = useState(true); // Add loading state

  const timeframes = ['1H', '4H', '1D', '1W', '1M']

  useEffect(() => {
    const fetchPriceData = async () => {
      try {
        const priceData = await api.getPrice(crypto);
        setPrice(priceData);
        setLoading(false); // Set loading to false when data is loaded
      } catch (error) {
        console.error('Error fetching price data:', error);
        setLoading(false); // Set loading to false even on error
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

  // Add loading state to prevent rendering before data is ready
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
        <div className="text-white text-xl">Loading crypto data...</div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <Layout>
        {/* Header with Crypto Selection and Price Display */}
        <div className="flex flex-col xl:flex-row items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Coins className="h-8 w-8 text-blue-400" />
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                CryptoSensei
              </h1>
            </div>
            
            <Select value={crypto} onValueChange={setCrypto}>
              <SelectTrigger className="w-[200px] bg-gray-800/50 border-gray-700 text-white">
                <SelectValue placeholder="Select crypto" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="bitcoin">Bitcoin (BTC)</SelectItem>
                <SelectItem value="ethereum">Ethereum (ETH)</SelectItem>
                <SelectItem value="cardano">Cardano (ADA)</SelectItem>
                <SelectItem value="polkadot">Polkadot (DOT)</SelectItem>
                <SelectItem value="chainlink">Chainlink (LINK)</SelectItem>
                <SelectItem value="solana">Solana (SOL)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="w-full xl:w-auto">
            <Card className="border-none bg-gradient-to-r from-green-500/20 to-blue-500/20 backdrop-blur-lg">
              <CardContent className="p-4">
                <div className="text-center xl:text-right">
                  <div className="text-2xl xl:text-3xl font-bold text-green-400">
                    ${price.price?.toLocaleString() || '0'}
                  </div>
                  <div className={`text-sm ${
                    (price.change24h || 0) >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {(price.change24h || 0) >= 0 ? '+' : ''}{(price.change24h || 0).toFixed(2)}% (24h)
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Main Content Grid */}
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
                <Card className="border-none bg-black/30 backdrop-blur-lg">
                  <CardHeader>
                    <CardTitle className="text-xl font-bold text-blue-300">Live Chart</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <ErrorBoundary>
                      <TradingView crypto={crypto} timeframe={timeframe} price={price} />
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
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <Card className="border-none bg-black/30 backdrop-blur-lg">
                  <CardHeader>
                    <CardTitle className="text-xl font-bold text-purple-300">Market Analysis</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <ErrorBoundary>
                      <MarketAnalysis crypto={crypto} predictions={predictions} />
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
                    <CardTitle className="text-xl font-bold text-yellow-300">Advanced Analysis</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
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
      </Layout>
    </ErrorBoundary>
  );
}
