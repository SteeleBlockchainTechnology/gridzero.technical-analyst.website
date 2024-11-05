import { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { TradingView } from './components/TradingView';
import { PredictionPanel } from './components/PredictionPanel';
import { SentimentAnalysis } from './components/SentimentAnalysis';
import { NewsPanel } from './components/NewsPanel';
import { AlertsPanel } from './components/AlertsPanel';
import { Bitcoin, ChevronDown } from 'lucide-react';
import { CryptoPrice, NewsItem, SentimentData, PredictionData } from './services/types';
import { MarketAnalysis } from './components/MarketAnalysis';
import { wsService } from './services/websocket';
import { api } from './services/api';

function App() {
  const [selectedCrypto, setSelectedCrypto] = useState('bitcoin');
  const [timeframe, setTimeframe] = useState('1D');
  const [showCryptoDropdown, setShowCryptoDropdown] = useState(false);
  const timeframes = ['1H', '4H', '1D', '1W', '1M'];
  const [price, setPrice] = useState<CryptoPrice | null>(null);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [sentiment, setSentiment] = useState<SentimentData[]>([]);
  const [predictions, setPredictions] = useState<PredictionData[]>([]);
  const [wsConnected, setWsConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  const cryptoOptions = [
    { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin' },
    { id: 'ethereum', symbol: 'ETH', name: 'Ethereum' },
    { id: 'binancecoin', symbol: 'BNB', name: 'Binance Coin' },
    { id: 'cardano', symbol: 'ADA', name: 'Cardano' },
    { id: 'solana', symbol: 'SOL', name: 'Solana' },
  ];

  const selectedCryptoData = cryptoOptions.find(crypto => crypto.id === selectedCrypto);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [newsData, sentimentData] = await Promise.all([
          api.getNews(selectedCrypto),
          api.getSentiment(selectedCrypto)
        ]);

        setNews(newsData);
        setSentiment(sentimentData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [selectedCrypto]);

  useEffect(() => {
    // Connect to WebSocket
    wsService.connect();

    // Subscribe to price updates
    const unsubscribe = wsService.subscribe((data) => {
      const cryptoData = data.find((d: any) => d[selectedCrypto]);
      if (cryptoData) {
        setPrice({
          price: cryptoData[selectedCrypto].usd,
          change24h: cryptoData[selectedCrypto].usd_24h_change,
          timestamp: Date.now()
        });
        setWsConnected(true);
      }
    });

    // Cleanup
    return () => {
      unsubscribe();
      wsService.disconnect();
    };
  }, [selectedCrypto]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setShowCryptoDropdown(false);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Add connection status indicator
  const ConnectionStatus = () => (
    <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
      wsConnected ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
    }`}>
      <div className={`w-2 h-2 rounded-full ${
        wsConnected ? 'bg-green-400' : 'bg-red-400'
      }`} />
      {wsConnected ? 'Live' : 'Connecting...'}
    </div>
  );

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6 text-white">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <Bitcoin className="w-8 h-8 text-yellow-500" />
            <div>
              <h1 className="text-2xl font-bold">Crypto Trading Dashboard</h1>
              <p className="text-slate-400">Real-time analysis and predictions</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <ConnectionStatus />
            <div className="relative">
              <button 
                className="flex items-center gap-2 bg-slate-800 px-4 py-2 rounded-lg hover:bg-slate-700"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowCryptoDropdown(!showCryptoDropdown);
                }}
              >
                {selectedCryptoData?.symbol}/USD
                <ChevronDown className="w-4 h-4" />
              </button>
              
              {showCryptoDropdown && (
                <div className="absolute top-full mt-2 w-48 bg-slate-800 rounded-lg shadow-lg py-1 z-10">
                  {cryptoOptions.map((crypto) => (
                    <button
                      key={crypto.id}
                      className="w-full px-4 py-2 text-left hover:bg-slate-700 flex items-center gap-2"
                      onClick={() => {
                        setSelectedCrypto(crypto.id);
                        setShowCryptoDropdown(false);
                      }}
                    >
                      <span className="font-medium">{crypto.symbol}</span>
                      <span className="text-sm text-slate-400">{crypto.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="flex bg-slate-800 rounded-lg p-1">
              {timeframes.map((tf) => (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className={`px-4 py-1 rounded-md transition-colors ${
                    timeframe === tf
                      ? 'bg-blue-500 text-white'
                      : 'text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-12 gap-6">
          {/* Left Column - Chart */}
          <div className="col-span-8 space-y-6">
            <div className="bg-slate-800 rounded-xl p-4">
              <TradingView 
                crypto={selectedCrypto} 
                timeframe={timeframe} 
                price={price}
              />
            </div>
            
            {/* Add Market Analysis Component */}
            <div className="bg-slate-800 rounded-xl p-4">
              <MarketAnalysis crypto={selectedCrypto} />
            </div>
          </div>

          {/* Right Column - Predictions & Alerts */}
          <div className="col-span-4 space-y-6">
            <div className="bg-slate-800 rounded-xl p-4">
              <PredictionPanel 
                crypto={selectedCrypto} 
                timeframe={timeframe} 
                predictions={predictions}
              />
            </div>
            <div className="bg-slate-800 rounded-xl p-4">
              <AlertsPanel crypto={selectedCrypto} />
            </div>
            <div className="bg-slate-800 rounded-xl p-4">
              <SentimentAnalysis 
                crypto={selectedCrypto} 
                sentimentData={sentiment}
              />
            </div>
            <div className="bg-slate-800 rounded-xl p-4">
              <NewsPanel 
                crypto={selectedCrypto} 
                news={news}
              />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default App;