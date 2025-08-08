interface PriceData {
  price: number;
  change24h: number;
  timestamp: number;
}

interface PriceSubscriber {
  id: string;
  callback: (crypto: string, price: PriceData) => void;
}

class PriceStore {
  private static instance: PriceStore;
  private prices: Map<string, PriceData> = new Map();
  private subscribers: PriceSubscriber[] = [];
  private activeRequests: Map<string, Promise<PriceData>> = new Map();
  private intervals: Map<string, NodeJS.Timeout> = new Map();
  private currentCrypto: string = 'bitcoin';
  
  private readonly UPDATE_INTERVAL = 120000; // 2 minutes
  private readonly CACHE_DURATION = 180000; // 3 minutes

  static getInstance(): PriceStore {
    if (!PriceStore.instance) {
      PriceStore.instance = new PriceStore();
    }
    return PriceStore.instance;
  }

  // Subscribe to price updates for a specific crypto
  subscribe(id: string, callback: (crypto: string, price: PriceData) => void): () => void {
    this.subscribers.push({ id, callback });
    
    // Immediately provide current price if available
    const currentPrice = this.prices.get(this.currentCrypto);
    if (currentPrice && this.isDataFresh(currentPrice)) {
      callback(this.currentCrypto, currentPrice);
    }
    
    // Return unsubscribe function
    return () => {
      this.subscribers = this.subscribers.filter(sub => sub.id !== id);
    };
  }

  // Set the active crypto and start fetching its price
  async setActiveCrypto(crypto: string): Promise<void> {
    if (this.currentCrypto === crypto) return;
    
    console.log(`PriceStore: Switching to ${crypto}`);
    
    // Clear previous interval
    const oldInterval = this.intervals.get(this.currentCrypto);
    if (oldInterval) {
      clearInterval(oldInterval);
      this.intervals.delete(this.currentCrypto);
    }
    
    this.currentCrypto = crypto;
    
    // Get price immediately (will use cache if fresh)
    await this.fetchPrice(crypto);
    
    // Start interval for this crypto
    const interval = setInterval(() => {
      this.fetchPrice(crypto);
    }, this.UPDATE_INTERVAL);
    
    this.intervals.set(crypto, interval);
  }

  // Get current price (from cache or fetch fresh)
  async getPrice(crypto: string): Promise<PriceData> {
    const cached = this.prices.get(crypto);
    
    // Return cached if fresh
    if (cached && this.isDataFresh(cached)) {
      console.log(`PriceStore: Using cached price for ${crypto}`);
      return cached;
    }
    
    // Fetch fresh data
    return this.fetchPrice(crypto);
  }

  // Internal method to fetch price (prevents duplicate requests)
  private async fetchPrice(crypto: string): Promise<PriceData> {
    // Check if request is already in progress
    const existingRequest = this.activeRequests.get(crypto);
    if (existingRequest) {
      console.log(`PriceStore: Request already in progress for ${crypto}`);
      return existingRequest;
    }

    console.log(`PriceStore: Fetching fresh price for ${crypto}`);
    
    // Create the request promise
    const requestPromise = this.performFetch(crypto);
    this.activeRequests.set(crypto, requestPromise);
    
    try {
      const price = await requestPromise;
      this.prices.set(crypto, price);
      
      // Notify all subscribers
      this.notifySubscribers(crypto, price);
      
      return price;
    } finally {
      // Clean up the active request
      this.activeRequests.delete(crypto);
    }
  }

  private async performFetch(crypto: string): Promise<PriceData> {
    try {
      const response = await fetch(`/api/crypto/price/${crypto}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      
      return {
        price: data.price || 0,
        change24h: data.change24h || 0,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error(`PriceStore: Error fetching ${crypto}:`, error);
      
      // Return cached data if available, even if stale
      const cached = this.prices.get(crypto);
      if (cached) {
        console.log(`PriceStore: Returning stale cached data for ${crypto}`);
        return cached;
      }
      
      // Return zero data as last resort
      return {
        price: 0,
        change24h: 0,
        timestamp: Date.now()
      };
    }
  }

  private isDataFresh(data: PriceData): boolean {
    return Date.now() - data.timestamp < this.CACHE_DURATION;
  }

  private notifySubscribers(crypto: string, price: PriceData): void {
    this.subscribers.forEach(subscriber => {
      try {
        subscriber.callback(crypto, price);
      } catch (error) {
        console.error(`Error notifying subscriber ${subscriber.id}:`, error);
      }
    });
  }

  // Clean up method
  destroy(): void {
    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals.clear();
    this.subscribers = [];
    this.activeRequests.clear();
  }

  // Get current crypto for reference
  getCurrentCrypto(): string {
    return this.currentCrypto;
  }

  // Batch update multiple cryptos (for featured coins)
  async getBatchPrices(cryptos: string[]): Promise<Record<string, PriceData>> {
    console.log(`PriceStore: Batch fetching prices for ${cryptos.length} cryptos`);
    
    const results: Record<string, PriceData> = {};
    
    // Use Promise.allSettled to handle partial failures
    const promises = cryptos.map(async (crypto) => {
      try {
        const price = await this.getPrice(crypto);
        results[crypto] = price;
      } catch (error) {
        console.error(`Failed to fetch price for ${crypto}:`, error);
        // Add a default/fallback entry
        results[crypto] = {
          price: 0,
          change24h: 0,
          timestamp: Date.now()
        };
      }
    });

    await Promise.allSettled(promises);
    return results;
  }
}

export const priceStore = PriceStore.getInstance();
export type { PriceData };
