import { FeaturedCoin } from './types';

const MAX_ACTIVE_COINS = 5;

class FeaturedCoinsService {
  private readonly STORAGE_KEY = 'featured_coins';
  
  private readonly DEFAULT_COINS: FeaturedCoin[] = [
    { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin', isActive: true },
    { id: 'ethereum', symbol: 'ETH', name: 'Ethereum', isActive: true },
    { id: 'binancecoin', symbol: 'BNB', name: 'BNB', isActive: false },
    { id: 'cardano', symbol: 'ADA', name: 'Cardano', isActive: false },
    { id: 'solana', symbol: 'SOL', name: 'Solana', isActive: false }
  ];
  
  getFeaturedCoins(): FeaturedCoin[] {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    
    // Initialize with default coins if nothing is stored
    this.updateFeaturedCoins(this.DEFAULT_COINS);
    return this.DEFAULT_COINS;
  }

  updateFeaturedCoins(coins: FeaturedCoin[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(coins));
  }

  getActiveFeaturedCoins(): FeaturedCoin[] {
    return this.getFeaturedCoins().filter(coin => coin.isActive);
  }

  toggleCoinStatus(coinId: string): FeaturedCoin[] {
    const coins = this.getFeaturedCoins();
    const activeCount = coins.filter(c => c.isActive).length;
    const coin = coins.find(c => c.id === coinId);
    
    // If trying to activate and already at max, don't allow
    if (coin && !coin.isActive && activeCount >= MAX_ACTIVE_COINS) {
      throw new Error(`Maximum of ${MAX_ACTIVE_COINS} active coins allowed`);
    }

    const updatedCoins = coins.map(coin => 
      coin.id === coinId ? { ...coin, isActive: !coin.isActive } : coin
    );
    
    this.updateFeaturedCoins(updatedCoins);
    return updatedCoins;
  }

  addCoin(coin: FeaturedCoin): FeaturedCoin[] {
    const coins = this.getFeaturedCoins();
    if (coins.find(c => c.id === coin.id)) return coins;
    
    // When adding a new coin, set it as inactive by default
    const updatedCoins = [...coins, { ...coin, isActive: false }];
    this.updateFeaturedCoins(updatedCoins);
    return updatedCoins;
  }

  removeCoin(coinId: string): FeaturedCoin[] {
    const coins = this.getFeaturedCoins();
    const updatedCoins = coins.filter(coin => coin.id !== coinId);
    this.updateFeaturedCoins(updatedCoins);
    return updatedCoins;
  }

  reorderCoins(coins: FeaturedCoin[]): void {
    this.updateFeaturedCoins(coins);
  }

  async searchCoins(query: string): Promise<FeaturedCoin[]> {
    try {
      // Use CoinGecko API for searching coins
      const response = await fetch(
        `https://api.coingecko.com/api/v3/search?query=${query}`
      );
      const data = await response.json();
      
      return data.coins.map((coin: any) => ({
        id: coin.id,
        symbol: coin.symbol.toUpperCase(),
        name: coin.name,
        isActive: false
      }));
    } catch (error) {
      console.error('Error searching coins:', error);
      return [];
    }
  }
}

export const featuredCoinsService = new FeaturedCoinsService();