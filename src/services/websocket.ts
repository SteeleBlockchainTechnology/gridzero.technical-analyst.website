import { priceStore } from './priceStore'; // Use price store instead of api directly

type WebSocketCallback = (data: any) => void;

class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout = 3000;
  private subscribers: Set<WebSocketCallback> = new Set();
  private isConnecting = false;
  private currentCrypto: string = 'bitcoin';
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private pricePollingInterval: NodeJS.Timeout | null = null;
  private lastPriceUpdate: number = 0;
  private PRICE_UPDATE_THRESHOLD = 10000; // 10 seconds

  private connect(): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) return;
    if (this.isConnecting) return; // Prevent multiple connection attempts
    
    this.isConnecting = true;

    try {
      // Clear any existing heartbeat
      if (this.heartbeatInterval) {
        clearInterval(this.heartbeatInterval);
      }

      // Use environment-based WebSocket URL
      // In dev, route through Vite proxy at /ws so it uses configured backend port
      const wsUrl = process.env.NODE_ENV === 'production'
        ? `wss://${window.location.host}`
        : `${window.location.protocol.replace('http', 'ws')}//${window.location.host}/ws`;
      
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('WebSocket connected successfully');
        this.reconnectAttempts = 0;
        this.isConnecting = false;
        
        // Start heartbeat
        this.heartbeatInterval = setInterval(() => {
          if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ type: 'ping' }));
          }
        }, 30000);

        // Send initial subscription
        this.sendMessage({ type: 'subscribe', crypto: this.currentCrypto });
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'pong') {
            return; // Ignore heartbeat responses
          }
          if (data && data[this.currentCrypto]) {
            const price = {
              price: parseFloat(data[this.currentCrypto].usd),
              change24h: parseFloat(data[this.currentCrypto].usd_24h_change),
              timestamp: Date.now()
            };
            this.notifySubscribers([price]);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onclose = (event) => {
        console.log('WebSocket disconnected', event.code, event.reason);
        this.isConnecting = false;
        this.ws = null;
        if (this.heartbeatInterval) {
          clearInterval(this.heartbeatInterval);
        }
        this.handleReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.isConnecting = false;
        if (this.ws) {
          this.ws.close();
          this.ws = null;
        }
      };

      // Start polling for price updates as fallback
      this.startPricePolling();

    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      this.isConnecting = false;
      this.handleReconnect();
    }
  }

  private async startPricePolling() {
    const pollPrice = async () => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        try {
          // Check if we need a new price update
          const now = Date.now();
          if (now - this.lastPriceUpdate > this.PRICE_UPDATE_THRESHOLD) {
            // Use price store instead of direct API calls
            const priceData = await priceStore.getPrice(this.currentCrypto);
            
            const price = {
              price: priceData.price,
              change24h: priceData.change24h,
              timestamp: now
            };
            
            this.lastPriceUpdate = now;
            this.notifySubscribers([price]);
          }
        } catch (error) {
          console.error('Error polling price:', error);
        }
      }
    };

    // Poll every 2 minutes (120 seconds) instead of 10 seconds to reduce API calls
    this.pricePollingInterval = setInterval(pollPrice, 120000);
    // Initial poll
    pollPrice();
  }

  private handleReconnect() {
    if (this.isConnecting) return; // Prevent multiple reconnection attempts
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      setTimeout(() => this.connect(), this.reconnectTimeout * this.reconnectAttempts);
    } else {
      console.error('Max reconnection attempts reached');
      // Start polling as fallback
      this.startPricePolling();
    }
  }

  subscribe(callback: WebSocketCallback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  private notifySubscribers(data: any) {
    this.subscribers.forEach(callback => callback(data));
  }

  updateCrypto(crypto: string) {
    this.currentCrypto = crypto;
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.sendMessage({ type: 'subscribe', crypto });
    }
  }

  sendMessage(message: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    if (this.pricePollingInterval) {
      clearInterval(this.pricePollingInterval);
      this.pricePollingInterval = null;
    }
    this.isConnecting = false;
    this.reconnectAttempts = 0;
  }
}

export const wsService = new WebSocketService();