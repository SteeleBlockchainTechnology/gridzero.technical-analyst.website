'use client'

import React from 'react'
import { Target, ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { TradingStrategy as TradingStrategyType } from '../../services/types'

interface TradingStrategyProps {
  data: TradingStrategyType
}

export const TradingStrategy: React.FC<TradingStrategyProps> = ({ data }) => {
  if (!data || !data.entries || !data.stopLoss || !data.targets) {
    return (
      <Card className="bg-black/30 backdrop-blur-lg border-none">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-blue-300 flex items-center gap-2">
            <Target className="w-5 h-5" />
            Trading Strategy
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-white">Loading trading strategy...</div>
        </CardContent>
      </Card>
    )
  }

  const formatPrice = (price: number | undefined) => 
    `$${(price || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`

  return (
    <Card className="bg-black/30 backdrop-blur-lg border-none">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-blue-300 flex items-center gap-2">
          <Target className="w-5 h-5" />
          Trading Strategy
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Recommendation */}
        <motion.div 
          className="bg-slate-800/50 p-4 rounded-lg backdrop-blur-sm"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-slate-300">Recommendation</span>
            <motion.div 
              className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                data.recommendation.includes('Buy') ? 'bg-green-500/20 text-green-400' :
                data.recommendation.includes('Sell') ? 'bg-red-500/20 text-red-400' :
                'bg-yellow-500/20 text-yellow-400'
              }`}
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.2, delay: 0.5 }}
            >
              {`${data.recommendation} (${data.confidence}%)`}
            </motion.div>
          </div>
          <div className="text-xs text-slate-400">
            Timeframe: {data.timeframe}
          </div>
        </motion.div>

        {/* Entry Points */}
        <motion.div 
          className="space-y-2"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h4 className="text-sm text-slate-300">Entry Points</h4>
          <div className="grid grid-cols-3 gap-2">
            {Object.entries(data.entries || {}).map(([type, price], index) => (
              <motion.div 
                key={type} 
                className="bg-slate-800/50 p-3 rounded-lg backdrop-blur-sm"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.3 + index * 0.1 }}
              >
                <div className="text-xs text-slate-400 mb-1">{type}</div>
                <div className="font-medium text-white">{formatPrice(price as number)}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Stop Losses */}
        <motion.div 
          className="space-y-2"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <h4 className="text-sm text-slate-300">Stop Loss Levels</h4>
          <div className="grid grid-cols-3 gap-2">
            {Object.entries(data.stopLoss).map(([type, price], index) => (
              <motion.div 
                key={type} 
                className="bg-slate-800/50 p-3 rounded-lg backdrop-blur-sm"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.5 + index * 0.1 }}
              >
                <div className="text-xs text-slate-400 mb-1">{type}</div>
                <div className="font-medium text-red-400">{formatPrice(price as number)}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Targets */}
        <motion.div 
          className="space-y-2"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <h4 className="text-sm text-slate-300">Price Targets</h4>
          <div className="grid grid-cols-3 gap-2">
            {Object.entries(data.targets).map(([type, price], index) => (
              <motion.div 
                key={type} 
                className="bg-slate-800/50 p-3 rounded-lg backdrop-blur-sm"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.7 + index * 0.1 }}
              >
                <div className="text-xs text-slate-400 mb-1">{type}</div>
                <div className="font-medium text-green-400">{formatPrice(price as number)}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Rationale */}
        <motion.div 
          className="space-y-2"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.8 }}
        >
          <h4 className="text-sm text-slate-300">Strategy Rationale</h4>
          <div className="space-y-1">
            {data.rationale.map((reason, index) => (
              <motion.div 
                key={index} 
                className="flex items-center gap-2 text-xs text-slate-400"
                initial={{ x: -10, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.9 + index * 0.1 }}
              >
                <ArrowRight className="w-3 h-3 text-blue-400" />
                <span>{reason}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </CardContent>
    </Card>
  )
}