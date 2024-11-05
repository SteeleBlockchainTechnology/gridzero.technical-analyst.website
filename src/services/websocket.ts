import axios from 'axios';

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

  async connect() {
    if (this.isConnecting || this.ws?.readyState === WebSocket.OPEN) return;
    this.isConnecting = true;

    try {
      // Clear any existing heartbeat
      if (this.heartbeatInterval) {
        clearInterval(this.heartbeatInterval);
      }

      this.ws = new WebSocket(`ws://localhost:3001`);

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
          const response = await axios.get(`http://localhost:3001/api/crypto/price/${this.currentCrypto}`);
          if (response.data && response.data[this.currentCrypto]) {
            const price = {
              price: parseFloat(response.data[this.currentCrypto].usd),
              change24h: parseFloat(response.data[this.currentCrypto].usd_24h_change),
              timestamp: Date.now()
            };
            this.notifySubscribers([price]);
          }
        } catch (error) {
          console.error('Error polling price:', error);
        }
      }
    };

    // Poll immediately and then every 5 seconds
    pollPrice();
    return setInterval(pollPrice, 5000);
  }

  private handleReconnect() {
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
    }
    this.isConnecting = false;
    this.reconnectAttempts = 0;
  }
}

export const wsService = new WebSocketService();