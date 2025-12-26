'use client';

import { useState, useEffect, useRef } from 'react';
import Input from '@/components/ui/Input';
import { Search, X, Loader2 } from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import { useDebounce } from '@/hooks/useDebounce';

interface SearchBarProps {
  entityType: 'users' | 'projects';
  onResults?: (results: unknown[]) => void;
  onSelect?: (item: unknown) => void;
  placeholder?: string;
  className?: string;
  showAutocomplete?: boolean;
}

export function SearchBar({
  entityType,
  onResults,
  onSelect,
  placeholder,
  className = '',
  showAutocomplete = true,
}: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<Array<{ id: unknown; label: string; value: unknown }>>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchRef = useRef<HTMLDivElement>(null);
  const debouncedQuery = useDebounce(query, 300);

  // Fetch autocomplete suggestions
  useEffect(() => {
    if (debouncedQuery.length >= 2 && showAutocomplete) {
      fetchAutocomplete(debouncedQuery);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [debouncedQuery, entityType, showAutocomplete]);

  // Close suggestions on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchAutocomplete = async (searchQuery: string) => {
    try {
      setIsSearching(true);
      const response = await apiClient.get<{
        suggestions: Array<{ id: unknown; label: string; value: unknown }>;
        query: string;
      }>(`/api/v1/search/autocomplete`, {
        params: {
          q: searchQuery,
          entity_type: entityType,
          limit: 10,
        },
      });

      if (response.data?.suggestions) {
        setSuggestions(response.data.suggestions);
        setShowSuggestions(true);
      }
    } catch (error) {
      console.error('Autocomplete error:', error);
      setSuggestions([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = async (searchQuery: string = query) => {
    if (!searchQuery.trim()) return;

    try {
      setIsSearching(true);
      const response = await apiClient.post<{
        results: unknown[];
        total: number;
        query: string;
      }>('/api/v1/search/search', {
        query: searchQuery,
        entity_type: entityType,
        limit: 50,
        offset: 0,
      });

      if (response.data?.results) {
        onResults?.(response.data.results);
        setShowSuggestions(false);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (selectedIndex >= 0 && suggestions[selectedIndex]) {
        handleSelect(suggestions[selectedIndex]);
      } else {
        handleSearch();
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => 
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }
  };

  const handleSelect = (suggestion: { id: unknown; label: string; value: unknown }) => {
    setQuery(suggestion.label);
    setShowSuggestions(false);
    setSelectedIndex(-1);
    onSelect?.(suggestion);
    handleSearch(suggestion.label);
  };

  const handleClear = () => {
    setQuery('');
    setSuggestions([]);
    setShowSuggestions(false);
    onResults?.([]);
  };

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <Input
          type="text"
          placeholder={placeholder || `Search ${entityType}...`}
          value={query}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            setQuery(e.target.value);
            setSelectedIndex(-1);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) {
              setShowSuggestions(true);
            }
          }}
          className="pl-10 pr-10"
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        {isSearching && (
          <div className="absolute right-10 top-1/2 transform -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
          </div>
        )}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <button
              key={String(suggestion.id || index)}
              onClick={() => handleSelect(suggestion)}
              className={`w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 ${
                index === selectedIndex ? 'bg-gray-100 dark:bg-gray-700' : ''
              }`}
            >
              {suggestion.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}



