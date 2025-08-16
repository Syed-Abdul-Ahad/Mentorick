// Currency conversion service using real-time exchange rates
class CurrencyService {
  constructor() {
    this.baseURL = 'https://api.exchangerate-api.com/v4/latest';
    this.fallbackURL = 'https://api.fxratesapi.com/latest';
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes cache
  }

  // Get exchange rates with caching
  async getExchangeRates(baseCurrency = 'USD') {
    const cacheKey = `rates_${baseCurrency}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
      return cached.rates;
    }

    try {
      // Try primary API first
      let response = await fetch(`${this.baseURL}/${baseCurrency}`);
      
      if (!response.ok) {
        // Fallback to secondary API
        response = await fetch(`${this.fallbackURL}?base=${baseCurrency}`);
      }
      
      if (!response.ok) {
        throw new Error('Failed to fetch exchange rates');
      }
      
      const data = await response.json();
      const rates = data.rates;
      
      // Cache the results
      this.cache.set(cacheKey, {
        rates,
        timestamp: Date.now()
      });
      
      return rates;
    } catch (error) {
      console.error('Error fetching exchange rates:', error);
      
      // Return fallback rates if API fails
      return this.getFallbackRates(baseCurrency);
    }
  }

  // Fallback rates (approximate, update as needed)
  getFallbackRates(baseCurrency) {
    const fallbackRates = {
      USD: {
        PKR: 280,
        EUR: 0.85,
        GBP: 0.73,
        CAD: 1.35,
        AUD: 1.50
      },
      PKR: {
        USD: 0.0036,
        EUR: 0.003,
        GBP: 0.0026,
        CAD: 0.0048,
        AUD: 0.0054
      }
    };

    return fallbackRates[baseCurrency] || fallbackRates.USD;
  }

  // Convert amount from one currency to another
  async convertCurrency(amount, fromCurrency, toCurrency) {
    if (fromCurrency === toCurrency) {
      return parseFloat(amount);
    }

    try {
      const rates = await this.getExchangeRates(fromCurrency);
      const rate = rates[toCurrency];
      
      if (!rate) {
        throw new Error(`Exchange rate not found for ${fromCurrency} to ${toCurrency}`);
      }
      
      return parseFloat((amount * rate).toFixed(2));
    } catch (error) {
      console.error('Currency conversion error:', error);
      return parseFloat(amount); // Return original amount if conversion fails
    }
  }

  // Get both USD and PKR prices from any currency
  async getBothCurrencies(amount, originalCurrency) {
    try {
      let usdAmount, pkrAmount;

      if (originalCurrency === 'USD') {
        usdAmount = parseFloat(amount);
        pkrAmount = await this.convertCurrency(amount, 'USD', 'PKR');
      } else if (originalCurrency === 'PKR') {
        pkrAmount = parseFloat(amount);
        usdAmount = await this.convertCurrency(amount, 'PKR', 'USD');
      } else {
        // Convert from other currency to both USD and PKR
        usdAmount = await this.convertCurrency(amount, originalCurrency, 'USD');
        pkrAmount = await this.convertCurrency(amount, originalCurrency, 'PKR');
      }

      return {
        usd: Math.round(usdAmount * 100) / 100, // Round to 2 decimal places
        pkr: Math.round(pkrAmount)
      };
    } catch (error) {
      console.error('Error getting both currencies:', error);
      // Return fallback conversion
      const fallbackRate = 280; // 1 USD = 280 PKR (approximate)
      
      if (originalCurrency === 'USD') {
        return {
          usd: parseFloat(amount),
          pkr: Math.round(amount * fallbackRate)
        };
      } else if (originalCurrency === 'PKR') {
        return {
          usd: Math.round((amount / fallbackRate) * 100) / 100,
          pkr: parseFloat(amount)
        };
      } else {
        // Assume other currencies are similar to USD for fallback
        return {
          usd: parseFloat(amount),
          pkr: Math.round(amount * fallbackRate)
        };
      }
    }
  }

  // Format currency for display
  formatCurrency(amount, currency) {
    const formatters = {
      USD: new Intl.NumberFormat('en-US', { 
        style: 'currency', 
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
      }),
      PKR: new Intl.NumberFormat('en-PK', { 
        style: 'currency', 
        currency: 'PKR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }),
      EUR: new Intl.NumberFormat('en-EU', { 
        style: 'currency', 
        currency: 'EUR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
      })
    };

    const formatter = formatters[currency] || formatters.USD;
    return formatter.format(amount);
  }
}

// Create and export a singleton instance
const currencyService = new CurrencyService();
export default currencyService;
