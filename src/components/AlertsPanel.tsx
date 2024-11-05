import React, { useEffect, useState } from 'react';
import { Bell, TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { api } from '../services/api';

interface Alert {
  id: string;
  type: string;
  message: string;
  severity: 'high' | 'medium' | 'low';
  timestamp: number;
}

interface AlertsPanelProps {
  crypto: string;
}

export function AlertsPanel({ crypto }: AlertsPanelProps) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [error, setError] = useState<string | null>(null);

  const severityColor = {
    high: 'text-red-400 bg-red-500/10',
    medium: 'text-yellow-400 bg-yellow-500/10',
    low: 'text-green-400 bg-green-500/10',
  };

  useEffect(() => {
    const generateAlerts = async () => {
      try {
        const priceData = await api.getPrice(crypto);
        if (!priceData) {
          throw new Error('No price data available');
        }

        const newAlerts: Alert[] = [];

        // Generate alerts based on price changes
        if (Math.abs(priceData.change24h) > 5) {
          newAlerts.push({
            id: 'price-movement',
            type: 'Price Movement',
            message: `${priceData.change24h > 0 ? 'Bullish' : 'Bearish'} movement: ${Math.abs(priceData.change24h).toFixed(2)}% ${priceData.change24h > 0 ? 'up' : 'down'}`,
            severity: Math.abs(priceData.change24h) > 10 ? 'high' : 'medium',
            timestamp: Date.now(),
          });
        }

        setAlerts(newAlerts);
        setError(null);
      } catch (error) {
        console.error('Error generating alerts:', error);
        setError('Unable to generate alerts at this time');
      }
    };

    generateAlerts();
    const interval = setInterval(generateAlerts, 60000);
    return () => clearInterval(interval);
  }, [crypto]);

  return (
    <div>
      <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
        <Bell className="w-5 h-5" />
        Active Alerts
      </h2>
      <div className="space-y-3">
        {alerts.length > 0 ? (
          alerts.map((alert) => (
            <div key={alert.id} className="bg-slate-750 p-3 rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <span className={`text-sm px-2 py-0.5 rounded ${severityColor[alert.severity]}`}>
                  {alert.type}
                </span>
                <span className="text-xs text-slate-400">
                  {new Date(alert.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <p className="text-sm text-slate-400">{alert.message}</p>
            </div>
          ))
        ) : (
          <div className="text-center text-slate-400 py-4">
            No active alerts
          </div>
        )}
      </div>
    </div>
  );
}