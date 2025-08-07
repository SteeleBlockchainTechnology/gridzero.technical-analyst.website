import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown, X } from 'lucide-react';
import { Input } from './input';
import { Button } from './button';
import { Card } from './card';
import { featuredCoinsService } from '../../services/featuredCoins';

interface CoinOption {
  id: string;
  symbol: string;
  name: string;
}

interface CoinSearchSelectProps {
  value: string;
  onValueChange: (coinId: string) => void;
  placeholder?: string;
}

export const CoinSearchSelect: React.FC<CoinSearchSelectProps> = ({
  value,
  onValueChange,
  placeholder = "Search for a cryptocurrency..."
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<CoinOption[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedCoin, setSelectedCoin] = useState<CoinOption | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Popular coins to show by default
  const popularCoins: CoinOption[] = [
    { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin' },
    { id: 'ethereum', symbol: 'ETH', name: 'Ethereum' },
    { id: 'binancecoin', symbol: 'BNB', name: 'BNB' },
    { id: 'cardano', symbol: 'ADA', name: 'Cardano' },
    { id: 'solana', symbol: 'SOL', name: 'Solana' },

  ];

  // Set initial selected coin based on value prop
  useEffect(() => {
    if (value && !selectedCoin) {
      const coin = popularCoins.find(c => c.id === value);
      if (coin) {
        setSelectedCoin(coin);
      }
    }
  }, [value]);

  // Handle search
  useEffect(() => {
    if (!searchTerm.trim()) {
      setSearchResults(popularCoins);
      return;
    }

    const searchCoins = async () => {
      setIsSearching(true);
      try {
        // Reuse the existing search functionality from featuredCoinsService
        const results = await featuredCoinsService.searchCoins(searchTerm);
        setSearchResults(results.slice(0, 8)); // Limit to 8 results
      } catch (error) {
        console.error('Search failed:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    const debounceTimer = setTimeout(searchCoins, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectCoin = (coin: CoinOption) => {
    setSelectedCoin(coin);
    onValueChange(coin.id);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClearSelection = () => {
    setSelectedCoin(null);
    onValueChange('');
    setSearchTerm('');
  };

  return (
    <div ref={containerRef} className="relative w-full xl:w-[280px]">
      {/* Trigger Button */}
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full justify-between h-10 px-3 text-left font-normal"
      >
        <div className="flex items-center gap-2">
          {selectedCoin ? (
            <>
              <span className="font-semibold text-green-400">{selectedCoin.symbol}</span>
              <span className="text-muted-foreground">{selectedCoin.name}</span>
            </>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {selectedCoin && (
            <X 
              className="h-4 w-4 hover:text-red-400 transition-colors" 
              onClick={(e) => {
                e.stopPropagation();
                handleClearSelection();
              }}
            />
          )}
          <ChevronDown className="h-4 w-4" />
        </div>
      </Button>

      {/* Dropdown */}
      {isOpen && (
        <Card className="absolute top-12 left-0 right-0 z-50 border border-border bg-background shadow-lg">
          <div className="p-3 space-y-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search cryptocurrencies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                autoFocus
              />
            </div>

            {/* Results */}
            <div className="max-h-64 overflow-y-auto space-y-1">
              {isSearching ? (
                <div className="text-center py-4 text-muted-foreground">
                  <div className="animate-spin h-4 w-4 border-2 border-green-400 border-t-transparent rounded-full mx-auto mb-2"></div>
                  Searching...
                </div>
              ) : searchResults.length > 0 ? (
                <>
                  {!searchTerm && (
                    <div className="text-xs text-muted-foreground px-2 py-1 border-b">
                      Popular Cryptocurrencies
                    </div>
                  )}
                  {searchResults.map((coin) => (
                    <button
                      key={coin.id}
                      onClick={() => handleSelectCoin(coin)}
                      className="w-full flex items-center gap-3 p-2 hover:bg-accent rounded-md transition-colors text-left"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-green-400">{coin.symbol}</span>
                          <span className="text-sm text-muted-foreground">{coin.name}</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  {searchTerm ? 'No cryptocurrencies found' : 'Start typing to search'}
                </div>
              )}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};