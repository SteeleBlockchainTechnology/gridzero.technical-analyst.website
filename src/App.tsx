import React, { useEffect, useState } from 'react';
import { Layout } from './components/Layout';
import { NewsPanel } from './components/NewsPanel';
import { TradingView } from './components/TradingView';
import { MarketAnalysis } from './components/MarketAnalysis';
import { SentimentAnalysis } from './components/SentimentAnalysis';
import { AdvancedAnalysis } from './components/AdvancedAnalysis';
import { api } from './services/api';
import type { NewsItem, SentimentData, PredictionData, CryptoPrice } from './services/types';
import { Coins, Clock } from 'lucide-react';

function App() {
  const [crypto, setCrypto] = useState('bitcoin');
  const [news, setNews] = useState<NewsItem[]>([]);
  const [sentiment, setSentiment] = useState<SentimentData[]>([]);
  const [price, setPrice] = useState<CryptoPrice>({
    price: 0,
    change24h: 0,
    timestamp: Date.now()
  });
  const [predictions, setPredictions] = useState<PredictionData[]>([]);
  const [timeframe, setTimeframe] = useState('1D');

  const timeframes = ['1H', '4H', '1D', '1W', '1M'];
  const cryptos = [
    { id: 'bitcoin', symbol: 'BTC' },
    { id: 'ethereum', symbol: 'ETH' },
    { id: 'binancecoin', symbol: 'BNB' },
    { id: 'cardano', symbol: 'ADA' },
    { id: 'solana', symbol: 'SOL' }
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [newsData, sentimentData, priceData, predictionsData] = await Promise.all([
          api.getNews(crypto),
          api.getSentiment(crypto),
          api.getPrice(crypto),
          api.getPredictions(crypto)
        ]);

        setNews(newsData.news);
        setSentiment(sentimentData);
        setPrice(priceData);
        setPredictions(predictionsData);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 60000);

    return () => clearInterval(interval);
  }, [crypto]);

  return (
    <Layout>
      <div className="container mx-auto p-4 text-white">
        {/* Header - Updated styling */}
        <div className="flex items-center justify-between mb-6 bg-slate-800/50 p-4 rounded-lg backdrop-blur-sm">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Coins className="w-6 h-6 text-blue-400" />
              <select 
                value={crypto}
                onChange={(e) => setCrypto(e.target.value)}
                className="bg-slate-750 border-none rounded-lg text-lg font-semibold focus:ring-2 focus:ring-blue-500 text-white"
              >
                {cryptos.map(({ id, symbol }) => (
                  <option key={id} value={id} className="text-white bg-slate-800">
                    {symbol}/USD
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-blue-400" />
              <div className="flex gap-1 bg-slate-800 p-1 rounded-lg">
                {timeframes.map((tf) => (
                  <button
                    key={tf}
                    onClick={() => setTimeframe(tf)}
                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                      timeframe === tf 
                        ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' 
                        : 'text-slate-400 hover:bg-slate-700 hover:text-white'
                    }`}
                  >
                    {tf}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content - Updated grid layout */}
        <div className="grid grid-cols-12 gap-6">
          {/* Left Column - Chart and Analysis */}
          <div className="col-span-8 space-y-6">
            <div className="bg-slate-800 rounded-xl overflow-hidden shadow-xl shadow-black/10">
              <TradingView 
                crypto={crypto} 
                timeframe={timeframe}
                price={price}
              />
            </div>
            <div className="bg-slate-800 rounded-xl p-6 shadow-xl shadow-black/10">
              <MarketAnalysis crypto={crypto} />
            </div>
            <div className="bg-slate-800 rounded-xl p-6 shadow-xl shadow-black/10">
              <AdvancedAnalysis crypto={crypto} />
            </div>
          </div>

          {/* Right Column - Predictions, Alerts, News */}
          <div className="col-span-4 space-y-6">
       

            <div className="bg-slate-800 rounded-xl p-6 shadow-xl shadow-black/10">
              <SentimentAnalysis 
                crypto={crypto} 
                sentimentData={sentiment}
              />
            </div>
            <div className="bg-slate-800 rounded-xl p-6 shadow-xl shadow-black/10 max-h-[600px] overflow-y-auto">
              <NewsPanel crypto={crypto} news={news} />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default App;