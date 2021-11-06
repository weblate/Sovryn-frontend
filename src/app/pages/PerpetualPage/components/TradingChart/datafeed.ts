/**
 * TradingChart Datafeed
 *
 * Implementation of TradingView Charting Library JS API (v18.043):
 * https://github.com/tradingview/charting_library/wiki/JS-Api/f62fddae9ad1923b9f4c97dbbde1e62ff437b924
 *
 * If the version of the library is updated, then modifications may
 * be necessary to this file and the realtime streaming.ts file in
 * this directory. Refer to:
 * https://github.com/tradingview/charting_library/wiki/Breaking-Changes
 */

import { subscribeOnStream, unsubscribeFromStream } from './streaming';
import {
  CandleDuration,
  CandleDictionary,
} from '../../hooks/graphql/useGetCandles';
import {
  Bar,
  config,
  supportedResolutions,
  resolutionMap,
  symbolMap,
  makeApiRequest,
} from './helpers';

const lastBarsCache = new Map<string, Bar>();

const tradingChartDataFeeds = {
  // https://github.com/tradingview/charting_library/wiki/JS-Api/f62fddae9ad1923b9f4c97dbbde1e62ff437b924#onreadycallback
  onReady: callback => {
    console.log('[onReady]: Method call');
    setTimeout(() => callback(config));
  },

  // https://github.com/tradingview/charting_library/wiki/JS-Api/f62fddae9ad1923b9f4c97dbbde1e62ff437b924#searchsymbolsuserinput-exchange-symboltype-onresultreadycallback
  searchSymbols: async (
    userInput,
    exchange,
    symbolType,
    onResultReadyCallback,
  ) => {
    console.log('[searchSymbols]: Method call');
    // disabled via chart config in index.tsx
  },

  // https://github.com/tradingview/charting_library/wiki/JS-Api/f62fddae9ad1923b9f4c97dbbde1e62ff437b924#resolvesymbolsymbolname-onsymbolresolvedcallback-onresolveerrorcallback-extension
  resolveSymbol: async (
    symbolName,
    onSymbolResolvedCallback,
    onResolveErrorCallback,
  ) => {
    console.log('[resolveSymbol]: Method call', symbolName);
    const symbolInfo = {
      name: symbolName,
      description: '',
      type: 'crypto',
      session: '24x7',
      timezone: 'Etc/UTC',
      ticker: symbolName,
      minmov: 1, //0.00000001,
      pricescale: 100,
      has_intraday: true,
      intraday_multipliers: ['1', '15'],
      supported_resolution: supportedResolutions,
      has_no_volume: true,
      has_empty_bars: true,
      has_daily: true,
      has_weekly_and_monthly: false,
      data_status: 'streaming',
    };
    console.log('[resolveSymbol]: Symbol resolved', symbolName);
    setTimeout(() => onSymbolResolvedCallback(symbolInfo));
  },

  // https://github.com/tradingview/charting_library/wiki/JS-Api/f62fddae9ad1923b9f4c97dbbde1e62ff437b924#getbarssymbolinfo-resolution-periodparams-onhistorycallback-onerrorcallback
  getBars: async (
    symbolInfo,
    resolution,
    from,
    to,
    onHistoryCallback,
    onErrorCallback,
    firstDataRequest,
  ) => {
    console.log('[getBars]: Method call', symbolInfo, resolution);
    const startTime = from;
    const candleDuration: CandleDuration = resolutionMap[resolution];
    try {
      const data = await makeApiRequest(
        candleDuration,
        symbolMap[symbolInfo.name],
        startTime,
      );
      console.log('[getBars]: Data', data);
      let bars: Bar[] = [];
      if (data.length > 0) {
        bars = data;
      } else {
        bars = [];
      }

      if (firstDataRequest) {
        lastBarsCache.set(symbolInfo.name, { ...bars[bars.length - 1] });
      }
      console.log(`[getBars]: returned ${bars.length} bar(s)`);

      if (!bars.length) {
        onHistoryCallback([], {
          noData: true,
        });
        return;
      }

      const lastBar = lastBarsCache.get(symbolInfo.name);
      const newestBar = bars[bars.length - 1];
      if (lastBar) {
        if (newestBar.time >= lastBar.time) {
          lastBarsCache.set(symbolInfo.name, newestBar);
        }
      } else {
        lastBarsCache.set(symbolInfo.name, newestBar);
      }

      onHistoryCallback(bars, {
        noData: false,
      });
    } catch (error) {
      onErrorCallback(error);
    }
  },
  // https://github.com/tradingview/charting_library/wiki/JS-Api/f62fddae9ad1923b9f4c97dbbde1e62ff437b924#calculatehistorydepthresolution-resolutionback-intervalback
  calculateHistoryDepth: (resolution, resolutionBack, intervalBack) => {
    const candleDetails = CandleDictionary.get(resolutionMap[resolution]);
    return {
      resolutionBack: candleDetails.resolutionBack,
      intervalBack: candleDetails.intervalBack,
    };
  },
  // https://github.com/tradingview/charting_library/wiki/JS-Api/f62fddae9ad1923b9f4c97dbbde1e62ff437b924#subscribebarssymbolinfo-resolution-onrealtimecallback-subscriberuid-onresetcacheneededcallback
  subscribeBars: (
    symbolInfo,
    resolution,
    onRealtimeCallback,
    subscribeUID,
    onResetCacheNeededCallback,
  ) => {
    console.log(
      '[subscribeBars]: Method call with subscribeUID:',
      subscribeUID,
      symbolInfo,
      resolution,
    );
    console.log('[lastBarsCache]: ', lastBarsCache);
    const lastBar = lastBarsCache.get(symbolInfo.name);
    console.log('[lastBar]', lastBar);
    subscribeOnStream(
      symbolInfo,
      resolution,
      onRealtimeCallback,
      subscribeUID,
      onResetCacheNeededCallback,
      lastBar,
    );
  },

  // // // https://github.com/tradingview/charting_library/wiki/JS-Api/f62fddae9ad1923b9f4c97dbbde1e62ff437b924#unsubscribebarssubscriberuid
  unsubscribeBars: subscriberUID => {
    console.log(
      '[unsubscribeBars]: Method call with subscriberUID:',
      subscriberUID,
    );
    unsubscribeFromStream(subscriberUID);
  },
};

export default tradingChartDataFeeds;
