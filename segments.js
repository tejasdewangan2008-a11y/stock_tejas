// Chartink Comprehensive Segment & Stock Universe Definitions for TejStockAI
// Full 29 segments with 100% stock associations covering Indices, Large, Mid, Small, Micro, ETFs, Bonds, and Derivatives.

const CHARTINK_SEGMENTS = [
  { id: 'cash', label: 'cash', desc: 'All cash market equity stocks & ETFs' },
  { id: 'all indices', label: 'all indices', desc: 'All NSE sectoral and benchmark indices' },
  { id: 'Banknifty', label: 'Banknifty', desc: 'Nifty Bank banking constituents' },
  { id: 'broad indices', label: 'broad indices', desc: 'Broad market benchmark indices' },
  { id: 'ETFs', label: 'ETFs', desc: 'Exchange Traded Funds on NSE' },
  { id: 'futures', label: 'futures', desc: 'F&O contracts & derivative eligible stocks' },
  { id: 'Gold ETFs', label: 'Gold ETFs', desc: 'Gold exchange traded funds' },
  { id: 'g-sec bonds', label: 'g-sec bonds', desc: 'Government securities and sovereign bonds' },
  { id: 'Midcap 50', label: 'Midcap 50', desc: 'Top 50 high momentum midcap companies' },
  { id: 'minor indices', label: 'minor indices', desc: 'Thematic & sectoral minor indices' },
  { id: 'nifty 100', label: 'nifty 100', desc: 'Top 100 large cap companies' },
  { id: 'nifty 200', label: 'nifty 200', desc: 'Top 200 large and midcap companies' },
  { id: 'nifty 50', label: 'nifty 50', desc: 'Top 50 flagship bluechip leaders' },
  { id: 'nifty 500', label: 'nifty 500', desc: 'Top 500 companies representing ~95% market cap' },
  { id: 'nifty 500 multicap 50:25:25', label: 'nifty 500 multicap 50:25:25', desc: 'Multicap allocation (50% Large, 25% Mid, 25% Small)' },
  { id: 'nifty and banknifty', label: 'nifty and banknifty', desc: 'Combined Nifty 50 and Bank Nifty universe' },
  { id: 'nifty large midcap 250', label: 'nifty large midcap 250', desc: 'Top 100 large + 150 midcap stocks' },
  { id: 'nifty microcap 250', label: 'nifty microcap 250', desc: 'Top 250 high-growth microcap stocks' },
  { id: 'nifty midcap 100', label: 'nifty midcap 100', desc: 'Top 100 midcap companies' },
  { id: 'nifty midcap 150', label: 'nifty midcap 150', desc: 'Full 150 midcap universe' },
  { id: 'nifty midcap 50', label: 'nifty midcap 50', desc: 'Top 50 midcaps based on market cap' },
  { id: 'nifty midcap select', label: 'nifty midcap select', desc: 'Nifty Midcap Select F&O index' },
  { id: 'nifty mid smallcap 400', label: 'nifty mid smallcap 400', desc: '150 midcap + 250 smallcap companies' },
  { id: 'nifty next 50', label: 'nifty next 50', desc: 'Next 50 potential bluechips (Nifty 51-100)' },
  { id: 'nifty smallcap 100', label: 'nifty smallcap 100', desc: 'Top 100 smallcap stocks' },
  { id: 'nifty smallcap 250', label: 'nifty smallcap 250', desc: 'Complete 250 smallcap universe' },
  { id: 'nifty smallcap 50', label: 'nifty smallcap 50', desc: 'Top 50 liquid smallcap stocks' },
  { id: 'Silver ETFs', label: 'Silver ETFs', desc: 'Silver exchange traded funds' },
  { id: 'watchlist', label: 'watchlist', desc: 'Personal tracked stocks watchlist' }
];

const NSE_MASTER_DIRECTORY = [
  // 1. Benchmark & Sectoral Indices (18 Kite Sectors + Benchmarks)
  { symbol: 'INDIA VIX', yahoo: '^INDIAVIX', name: 'India VIX Volatility Index', sector: 'Indices', segment: ['all indices', 'minor indices'], aliases: ['INDIAVIX', 'VIX', 'VOLATILITY'] },
  { symbol: 'NIFTY50', yahoo: '^NSEI', name: 'Nifty 50 Benchmark Index', sector: 'Indices', segment: ['all indices', 'broad indices', 'nifty and banknifty', 'futures'], aliases: ['NIFTY', 'NIFTY 50'] },
  { symbol: 'BANKNIFTY', yahoo: '^NSEBANK', name: 'Nifty Bank Index', sector: 'Indices', segment: ['all indices', 'broad indices', 'Banknifty', 'nifty and banknifty', 'futures'], aliases: ['BANK NIFTY', 'BANK', 'NIFTY BANK'] },
  { symbol: 'FINNIFTY', yahoo: 'NIFTY_FIN_SERVICE.NS', name: 'Nifty Financial Services', sector: 'Indices', segment: ['all indices', 'broad indices', 'futures'], aliases: ['FIN NIFTY', 'NIFTY FIN SERVICE'] },
  { symbol: 'MIDCPNIFTY', yahoo: 'NIFTY_MID_SELECT.NS', name: 'Nifty Midcap Select Index', sector: 'Indices', segment: ['all indices', 'broad indices', 'Midcap 50', 'nifty midcap select', 'futures'], aliases: ['MIDCAP', 'NIFTY MIDCAP', 'MIDCPNIFTY'] },
  { symbol: 'SENSEX', yahoo: '^BSESN', name: 'BSE Sensex 30', sector: 'Indices', segment: ['all indices', 'broad indices'], aliases: ['BSE 30'] },
  { symbol: 'NIFTY100', yahoo: '^CNX100', name: 'Nifty 100 Index', sector: 'Indices', segment: ['all indices', 'broad indices'], aliases: ['NIFTY 100'] },
  { symbol: 'NIFTY200', yahoo: '^CNX200', name: 'Nifty 200 Index', sector: 'Indices', segment: ['all indices', 'broad indices'], aliases: ['NIFTY 200'] },
  { symbol: 'NIFTY500', yahoo: '^CRSLDX', name: 'Nifty 500 Index', sector: 'Indices', segment: ['all indices', 'broad indices'], aliases: ['NIFTY 500'] },
  { symbol: 'NIFTYNEXT50', yahoo: '^NSMIDCP', name: 'Nifty Next 50 Index', sector: 'Indices', segment: ['all indices', 'broad indices'], aliases: ['NEXT 50'] },
  { symbol: 'NIFTYIT', yahoo: '^CNXIT', name: 'Nifty IT Index', sector: 'Indices', segment: ['all indices', 'minor indices', 'futures'], aliases: ['CNX IT', 'NIFTY IT'] },
  { symbol: 'NIFTYAUTO', yahoo: '^CNXAUTO', name: 'Nifty Auto Index', sector: 'Indices', segment: ['all indices', 'minor indices'], aliases: ['CNX AUTO', 'NIFTY AUTO'] },
  { symbol: 'NIFTYPHARMA', yahoo: '^CNXPHARMA', name: 'Nifty Pharma Index', sector: 'Indices', segment: ['all indices', 'minor indices'], aliases: ['CNX PHARMA', 'NIFTY PHARMA'] },
  { symbol: 'NIFTYMETAL', yahoo: '^CNXMETAL', name: 'Nifty Metal Index', sector: 'Indices', segment: ['all indices', 'minor indices'], aliases: ['CNX METAL', 'NIFTY METAL'] },
  { symbol: 'NIFTYFMCG', yahoo: '^CNXFMCG', name: 'Nifty FMCG Index', sector: 'Indices', segment: ['all indices', 'minor indices'], aliases: ['CNX FMCG', 'NIFTY FMCG'] },
  { symbol: 'NIFTYREALTY', yahoo: '^CNXREALTY', name: 'Nifty Realty Index', sector: 'Indices', segment: ['all indices', 'minor indices'], aliases: ['CNX REALTY', 'NIFTY REALTY'] },
  { symbol: 'NIFTYENERGY', yahoo: '^CNXENERGY', name: 'Nifty Energy Index', sector: 'Indices', segment: ['all indices', 'minor indices'], aliases: ['CNX ENERGY', 'NIFTY ENERGY'] },
  { symbol: 'NIFTYMEDIA', yahoo: '^CNXMEDIA', name: 'Nifty Media Index', sector: 'Indices', segment: ['all indices', 'minor indices'], aliases: ['CNX MEDIA', 'NIFTY MEDIA'] },
  { symbol: 'NIFTYPSE', yahoo: '^CNXPSE', name: 'Nifty Public Sector Enterprises', sector: 'Indices', segment: ['all indices', 'minor indices'], aliases: ['CNX PSE', 'NIFTY PSE'] },
  { symbol: 'NIFTYPSUBANK', yahoo: '^CNXPSUBANK', name: 'Nifty PSU Bank Index', sector: 'Indices', segment: ['all indices', 'minor indices'], aliases: ['PSU BANK', 'NIFTY PSU BANK'] },
  { symbol: 'NIFTYINFRA', yahoo: '^CNXINFRA', name: 'Nifty Infrastructure Index', sector: 'Indices', segment: ['all indices', 'minor indices'], aliases: ['INFRA', 'NIFTY INFRA'] },
  { symbol: 'NIFTYCPSE', yahoo: 'NIFTY_CPSE.NS', name: 'Nifty Central PSE Index', sector: 'Indices', segment: ['all indices', 'minor indices'], aliases: ['CPSE INDEX', 'NIFTY CPSE'] },
  { symbol: 'NIFTYCOMMODITIES', yahoo: '^CNXCMDT', name: 'Nifty Commodities Index', sector: 'Indices', segment: ['all indices', 'minor indices'], aliases: ['COMMODITIES', 'NIFTY COMMODITIES'] },
  { symbol: 'NIFTYCONSUMPTION', yahoo: '^CNXCONSUM', name: 'Nifty India Consumption Index', sector: 'Indices', segment: ['all indices', 'minor indices'], aliases: ['CONSUMPTION', 'NIFTY CONSUMPTION'] },
  { symbol: 'NIFTYOILGAS', yahoo: 'NIFTY_OIL_AND_GAS.NS', name: 'Nifty Oil & Gas Index', sector: 'Indices', segment: ['all indices', 'minor indices'], aliases: ['OIL & GAS', 'NIFTY OIL & GAS', 'NIFTY OIL GAS'] },

  // 2. ETFs, Gold ETFs, Silver ETFs, G-Sec Bonds
  { symbol: 'NIFTYBEES', yahoo: 'NIFTYBEES.NS', name: 'Nippon India ETF Nifty 50 BeES', sector: 'Exchange Traded Fund', segment: ['cash', 'ETFs'], aliases: ['NIFTY BEES'] },
  { symbol: 'BANKBEES', yahoo: 'BANKBEES.NS', name: 'Nippon India ETF Bank BeES', sector: 'Exchange Traded Fund', segment: ['cash', 'ETFs'], aliases: ['BANK BEES'] },
  { symbol: 'ITBEES', yahoo: 'ITBEES.NS', name: 'Nippon India ETF Nifty IT', sector: 'Exchange Traded Fund', segment: ['cash', 'ETFs'], aliases: ['IT BEES'] },
  { symbol: 'JUNIORBEES', yahoo: 'JUNIORBEES.NS', name: 'Nippon India ETF Junior BeES', sector: 'Exchange Traded Fund', segment: ['cash', 'ETFs'], aliases: ['JUNIOR BEES'] },
  { symbol: 'CPSEETF', yahoo: 'CPSEETF.NS', name: 'CPSE ETF (Nifty CPSE Index)', sector: 'Exchange Traded Fund', segment: ['cash', 'ETFs'], aliases: ['CPSE'] },
  { symbol: 'MON100', yahoo: 'MON100.NS', name: 'Motilal Oswal Nasdaq 100 ETF', sector: 'Exchange Traded Fund', segment: ['cash', 'ETFs'], aliases: ['NASDAQ ETF'] },
  { symbol: 'GOLDBEES', yahoo: 'GOLDBEES.NS', name: 'Nippon India ETF Gold BeES', sector: 'Precious Metals', segment: ['cash', 'ETFs', 'Gold ETFs'], aliases: ['GOLD BEES'] },
  { symbol: 'HDFCMFGETF', yahoo: 'HDFCMFGETF.NS', name: 'HDFC Gold Exchange Traded Fund', sector: 'Precious Metals', segment: ['cash', 'ETFs', 'Gold ETFs'], aliases: ['HDFC GOLD'] },
  { symbol: 'AXISGOLD', yahoo: 'AXISGOLD.NS', name: 'Axis Mutual Fund - Axis Gold ETF', sector: 'Precious Metals', segment: ['cash', 'ETFs', 'Gold ETFs'], aliases: ['AXIS GOLD'] },
  { symbol: 'KOTAKGOLD', yahoo: 'KOTAKGOLD.NS', name: 'Kotak Gold ETF Scheme', sector: 'Precious Metals', segment: ['cash', 'ETFs', 'Gold ETFs'], aliases: ['KOTAK GOLD'] },
  { symbol: 'SETFGOLD', yahoo: 'SETFGOLD.NS', name: 'SBI Mutual Fund - SBI Gold ETF', sector: 'Precious Metals', segment: ['cash', 'ETFs', 'Gold ETFs'], aliases: ['SBI GOLD'] },
  { symbol: 'SILVERBEES', yahoo: 'SILVERBEES.NS', name: 'Nippon India ETF Silver BeES', sector: 'Precious Metals', segment: ['cash', 'ETFs', 'Silver ETFs'], aliases: ['SILVER BEES'] },
  { symbol: 'HDFCSILVER', yahoo: 'HDFCSILVER.NS', name: 'HDFC Silver ETF Fund', sector: 'Precious Metals', segment: ['cash', 'ETFs', 'Silver ETFs'], aliases: ['HDFC SILVER'] },
  { symbol: 'ICICISILV', yahoo: 'ICICISILV.NS', name: 'ICICI Prudential Silver ETF', sector: 'Precious Metals', segment: ['cash', 'ETFs', 'Silver ETFs'], aliases: ['ICICI SILVER'] },
  { symbol: 'AXISSILVER', yahoo: 'AXISSILVER.NS', name: 'Axis Mutual Fund - Axis Silver ETF', sector: 'Precious Metals', segment: ['cash', 'ETFs', 'Silver ETFs'], aliases: ['AXIS SILVER'] },
  { symbol: 'TATASILV', yahoo: 'TATASILV.NS', name: 'Tata Silver Exchange Traded Fund', sector: 'Precious Metals', segment: ['cash', 'ETFs', 'Silver ETFs'], aliases: ['TATA SILVER'] },
  { symbol: 'GSEC10YR', yahoo: 'GSEC10YR.NS', name: 'Nippon India Nifty 8-13 yr G-Sec ETF', sector: 'Sovereign Debt', segment: ['cash', 'g-sec bonds'], aliases: ['10 YR GSEC'] },
  { symbol: 'BHARATBOND', yahoo: 'BHARATBOND.NS', name: 'Edelweiss Bharat Bond ETF Target 2030', sector: 'Govt Debt', segment: ['cash', 'g-sec bonds'], aliases: ['BHARAT BOND'] },
  { symbol: 'LIQUIDBEES', yahoo: 'LIQUIDBEES.NS', name: 'Nippon India ETF Liquid BeES', sector: 'Debt Liquid', segment: ['cash', 'ETFs', 'g-sec bonds'], aliases: ['LIQUID BEES'] },
  { symbol: 'GS2033', yahoo: 'GS2033.NS', name: 'Government of India 7.18% GS 2033 Bond', sector: 'Sovereign Debt', segment: ['cash', 'g-sec bonds'], aliases: ['GOI 2033'] },
  { symbol: 'GS2029', yahoo: 'GS2029.NS', name: 'Government of India 7.26% GS 2029 Bond', sector: 'Sovereign Debt', segment: ['cash', 'g-sec bonds'], aliases: ['GOI 2029'] },

  // 3. Bank Nifty Constituents & Banking Leaders
  { symbol: 'HDFCBANK', yahoo: 'HDFCBANK.NS', name: 'HDFC Bank Ltd', sector: 'Banking & Finance', segment: ['cash', 'nifty 50', 'nifty 100', 'nifty 200', 'nifty 500', 'Banknifty', 'nifty and banknifty', 'futures', 'nifty large midcap 250', 'nifty 500 multicap 50:25:25'], aliases: ['HDFC', 'HDFC BANK'] },
  { symbol: 'ICICIBANK', yahoo: 'ICICIBANK.NS', name: 'ICICI Bank Ltd', sector: 'Banking & Finance', segment: ['cash', 'nifty 50', 'nifty 100', 'nifty 200', 'nifty 500', 'Banknifty', 'nifty and banknifty', 'futures', 'nifty large midcap 250', 'nifty 500 multicap 50:25:25'], aliases: ['ICICI'] },
  { symbol: 'SBIN', yahoo: 'SBIN.NS', name: 'State Bank of India', sector: 'Banking & Finance', segment: ['cash', 'nifty 50', 'nifty 100', 'nifty 200', 'nifty 500', 'Banknifty', 'nifty and banknifty', 'futures', 'nifty large midcap 250', 'nifty 500 multicap 50:25:25'], aliases: ['SBI', 'STATE BANK'] },
  { symbol: 'KOTAKBANK', yahoo: 'KOTAKBANK.NS', name: 'Kotak Mahindra Bank', sector: 'Banking & Finance', segment: ['cash', 'nifty 50', 'nifty 100', 'nifty 200', 'nifty 500', 'Banknifty', 'nifty and banknifty', 'futures', 'nifty large midcap 250', 'nifty 500 multicap 50:25:25'], aliases: ['KOTAK'] },
  { symbol: 'AXISBANK', yahoo: 'AXISBANK.NS', name: 'Axis Bank Ltd', sector: 'Banking & Finance', segment: ['cash', 'nifty 50', 'nifty 100', 'nifty 200', 'nifty 500', 'Banknifty', 'nifty and banknifty', 'futures', 'nifty large midcap 250', 'nifty 500 multicap 50:25:25'], aliases: ['AXIS'] },
  { symbol: 'INDUSINDBK', yahoo: 'INDUSINDBK.NS', name: 'IndusInd Bank Ltd', sector: 'Banking & Finance', segment: ['cash', 'nifty 50', 'nifty 100', 'nifty 200', 'nifty 500', 'Banknifty', 'nifty and banknifty', 'futures', 'nifty large midcap 250', 'nifty 500 multicap 50:25:25'], aliases: ['INDUSIND'] },
  { symbol: 'BANKBARODA', yahoo: 'BANKBARODA.NS', name: 'Bank of Baroda', sector: 'Banking & Finance', segment: ['cash', 'nifty next 50', 'nifty 100', 'nifty 200', 'nifty 500', 'Banknifty', 'nifty and banknifty', 'futures', 'nifty large midcap 250', 'nifty 500 multicap 50:25:25'], aliases: ['BOB'] },
  { symbol: 'PNB', yahoo: 'PNB.NS', name: 'Punjab National Bank', sector: 'Banking & Finance', segment: ['cash', 'nifty next 50', 'nifty 100', 'nifty 200', 'nifty 500', 'Banknifty', 'nifty and banknifty', 'futures', 'nifty large midcap 250', 'nifty 500 multicap 50:25:25'], aliases: ['PUNJAB NATIONAL'] },
  { symbol: 'CANBK', yahoo: 'CANBK.NS', name: 'Canara Bank', sector: 'Banking & Finance', segment: ['cash', 'nifty next 50', 'nifty 100', 'nifty 200', 'nifty 500', 'Banknifty', 'nifty and banknifty', 'futures', 'nifty large midcap 250', 'nifty 500 multicap 50:25:25'], aliases: ['CANARA BANK'] },
  { symbol: 'FEDERALBNK', yahoo: 'FEDERALBNK.NS', name: 'The Federal Bank Ltd', sector: 'Banking & Finance', segment: ['cash', 'Midcap 50', 'nifty midcap 50', 'nifty midcap 100', 'nifty midcap 150', 'nifty midcap select', 'nifty 200', 'nifty 500', 'Banknifty', 'nifty and banknifty', 'futures', 'nifty large midcap 250', 'nifty mid smallcap 400', 'nifty 500 multicap 50:25:25'], aliases: ['FEDERAL BANK'] },
  { symbol: 'IDFCFIRSTB', yahoo: 'IDFCFIRSTB.NS', name: 'IDFC First Bank Ltd', sector: 'Banking & Finance', segment: ['cash', 'Midcap 50', 'nifty midcap 50', 'nifty midcap 100', 'nifty midcap 150', 'nifty midcap select', 'nifty 200', 'nifty 500', 'Banknifty', 'nifty and banknifty', 'futures', 'nifty large midcap 250', 'nifty mid smallcap 400', 'nifty 500 multicap 50:25:25'], aliases: ['IDFC FIRST'] },
  { symbol: 'AUBANK', yahoo: 'AUBANK.NS', name: 'AU Small Finance Bank Ltd', sector: 'Banking & Finance', segment: ['cash', 'Midcap 50', 'nifty midcap 50', 'nifty midcap 100', 'nifty midcap 150', 'nifty midcap select', 'nifty 200', 'nifty 500', 'Banknifty', 'nifty and banknifty', 'futures', 'nifty large midcap 250', 'nifty mid smallcap 400', 'nifty 500 multicap 50:25:25'], aliases: ['AU SMALL FINANCE'] },

  // 4. Flagship Nifty 50 Leaders
  { symbol: 'RELIANCE', yahoo: 'RELIANCE.NS', name: 'Reliance Industries Ltd', sector: 'Energy & Petrochem', segment: ['cash', 'nifty 50', 'nifty 100', 'nifty 200', 'nifty 500', 'nifty and banknifty', 'futures', 'nifty large midcap 250', 'nifty 500 multicap 50:25:25'], aliases: ['RIL', 'RELIANCE IND'] },
  { symbol: 'TCS', yahoo: 'TCS.NS', name: 'Tata Consultancy Services', sector: 'Information Tech', segment: ['cash', 'nifty 50', 'nifty 100', 'nifty 200', 'nifty 500', 'nifty and banknifty', 'futures', 'nifty large midcap 250', 'nifty 500 multicap 50:25:25'], aliases: ['TATA CONSULTANCY'] },
  { symbol: 'INFY', yahoo: 'INFY.NS', name: 'Infosys Ltd', sector: 'Information Tech', segment: ['cash', 'nifty 50', 'nifty 100', 'nifty 200', 'nifty 500', 'nifty and banknifty', 'futures', 'nifty large midcap 250', 'nifty 500 multicap 50:25:25'], aliases: ['INFOSYS'] },
  { symbol: 'BHARTIARTL', yahoo: 'BHARTIARTL.NS', name: 'Bharti Airtel Ltd', sector: 'Telecom', segment: ['cash', 'nifty 50', 'nifty 100', 'nifty 200', 'nifty 500', 'nifty and banknifty', 'futures', 'nifty large midcap 250', 'nifty 500 multicap 50:25:25'], aliases: ['AIRTEL'] },
  { symbol: 'ITC', yahoo: 'ITC.NS', name: 'ITC Ltd', sector: 'FMCG', segment: ['cash', 'nifty 50', 'nifty 100', 'nifty 200', 'nifty 500', 'nifty and banknifty', 'futures', 'nifty large midcap 250', 'nifty 500 multicap 50:25:25'], aliases: ['ITC LTD'] },
  { symbol: 'LT', yahoo: 'LT.NS', name: 'Larsen & Toubro Ltd', sector: 'Capital Goods & Infra', segment: ['cash', 'nifty 50', 'nifty 100', 'nifty 200', 'nifty 500', 'nifty and banknifty', 'futures', 'nifty large midcap 250', 'nifty 500 multicap 50:25:25'], aliases: ['L&T', 'LARSEN'] },
  { symbol: 'HINDUNILVR', yahoo: 'HINDUNILVR.NS', name: 'Hindustan Unilever Ltd', sector: 'FMCG', segment: ['cash', 'nifty 50', 'nifty 100', 'nifty 200', 'nifty 500', 'nifty and banknifty', 'futures', 'nifty large midcap 250', 'nifty 500 multicap 50:25:25'], aliases: ['HUL', 'UNILEVER'] },
  { symbol: 'MARUTI', yahoo: 'MARUTI.NS', name: 'Maruti Suzuki India Ltd', sector: 'Automobile', segment: ['cash', 'nifty 50', 'nifty 100', 'nifty 200', 'nifty 500', 'nifty and banknifty', 'futures', 'nifty large midcap 250', 'nifty 500 multicap 50:25:25'], aliases: ['MARUTI SUZUKI'] },
  { symbol: 'SUNPHARMA', yahoo: 'SUNPHARMA.NS', name: 'Sun Pharmaceutical Ind', sector: 'Pharma & Healthcare', segment: ['cash', 'nifty 50', 'nifty 100', 'nifty 200', 'nifty 500', 'nifty and banknifty', 'futures', 'nifty large midcap 250', 'nifty 500 multicap 50:25:25'], aliases: ['SUN PHARMA'] },
  { symbol: 'BAJFINANCE', yahoo: 'BAJFINANCE.NS', name: 'Bajaj Finance Ltd', sector: 'Financial Services', segment: ['cash', 'nifty 50', 'nifty 100', 'nifty 200', 'nifty 500', 'nifty and banknifty', 'futures', 'nifty large midcap 250', 'nifty 500 multicap 50:25:25'], aliases: ['BAJAJ FINANCE'] },
  { symbol: 'BAJAJFINSV', yahoo: 'BAJAJFINSV.NS', name: 'Bajaj Finserv Ltd', sector: 'Financial Services', segment: ['cash', 'nifty 50', 'nifty 100', 'nifty 200', 'nifty 500', 'nifty and banknifty', 'futures', 'nifty large midcap 250', 'nifty 500 multicap 50:25:25'], aliases: ['BAJAJ FINSERV'] },
  { symbol: 'BAJAJ-AUTO', yahoo: 'BAJAJ-AUTO.NS', name: 'Bajaj Auto Ltd', sector: 'Automobile', segment: ['cash', 'nifty 50', 'nifty 100', 'nifty 200', 'nifty 500', 'nifty and banknifty', 'futures', 'nifty large midcap 250', 'nifty 500 multicap 50:25:25'], aliases: ['BAJAJ AUTO'] },
  { symbol: 'TATAMOTORS', yahoo: 'TMPV.NS', name: 'Tata Motors Ltd (TMPV / TMCV)', sector: 'Automobile', segment: ['cash', 'nifty 50', 'nifty 100', 'nifty 200', 'nifty 500', 'nifty and banknifty', 'futures', 'nifty large midcap 250', 'nifty 500 multicap 50:25:25'], aliases: ['TATA MOTORS', 'TMPV', 'TMCV'] },
  { symbol: 'TATASTEEL', yahoo: 'TATASTEEL.NS', name: 'Tata Steel Ltd', sector: 'Metals & Mining', segment: ['cash', 'nifty 50', 'nifty 100', 'nifty 200', 'nifty 500', 'nifty and banknifty', 'futures', 'nifty large midcap 250', 'nifty 500 multicap 50:25:25'], aliases: ['TATA STEEL'] },
  { symbol: 'TITAN', yahoo: 'TITAN.NS', name: 'Titan Company Ltd', sector: 'Consumer Durables', segment: ['cash', 'nifty 50', 'nifty 100', 'nifty 200', 'nifty 500', 'nifty and banknifty', 'futures', 'nifty large midcap 250', 'nifty 500 multicap 50:25:25'], aliases: ['TITAN COMPANY'] },
  { symbol: 'TRENT', yahoo: 'TRENT.NS', name: 'Trent Ltd', sector: 'Retail', segment: ['cash', 'nifty 50', 'nifty 100', 'nifty 200', 'nifty 500', 'nifty and banknifty', 'futures', 'nifty large midcap 250', 'nifty 500 multicap 50:25:25'], aliases: ['ZUDIO', 'WESTSIDE'] },
  { symbol: 'TATACONSUM', yahoo: 'TATACONSUM.NS', name: 'Tata Consumer Products Ltd', sector: 'FMCG', segment: ['cash', 'nifty 50', 'nifty 100', 'nifty 200', 'nifty 500', 'nifty and banknifty', 'futures', 'nifty large midcap 250', 'nifty 500 multicap 50:25:25'], aliases: ['TATA CONSUMER'] },
  { symbol: 'ADANIENT', yahoo: 'ADANIENT.NS', name: 'Adani Enterprises Ltd', sector: 'Metals & Mining', segment: ['cash', 'nifty 50', 'nifty 100', 'nifty 200', 'nifty 500', 'nifty and banknifty', 'futures', 'nifty large midcap 250', 'nifty 500 multicap 50:25:25'], aliases: ['ADANI ENT'] },
  { symbol: 'ADANIPORTS', yahoo: 'ADANIPORTS.NS', name: 'Adani Ports and SEZ', sector: 'Infrastructure', segment: ['cash', 'nifty 50', 'nifty 100', 'nifty 200', 'nifty 500', 'nifty and banknifty', 'futures', 'nifty large midcap 250', 'nifty 500 multicap 50:25:25'], aliases: ['ADANI PORTS'] },
  { symbol: 'NTPC', yahoo: 'NTPC.NS', name: 'NTPC Ltd', sector: 'Power & Utilities', segment: ['cash', 'nifty 50', 'nifty 100', 'nifty 200', 'nifty 500', 'nifty and banknifty', 'futures', 'nifty large midcap 250', 'nifty 500 multicap 50:25:25'], aliases: ['NATIONAL THERMAL'] },
  { symbol: 'POWERGRID', yahoo: 'POWERGRID.NS', name: 'Power Grid Corp of India', sector: 'Power & Utilities', segment: ['cash', 'nifty 50', 'nifty 100', 'nifty 200', 'nifty 500', 'nifty and banknifty', 'futures', 'nifty large midcap 250', 'nifty 500 multicap 50:25:25'], aliases: ['POWER GRID'] },
  { symbol: 'ONGC', yahoo: 'ONGC.NS', name: 'Oil & Natural Gas Corp', sector: 'Energy & Oil', segment: ['cash', 'nifty 50', 'nifty 100', 'nifty 200', 'nifty 500', 'nifty and banknifty', 'futures', 'nifty large midcap 250', 'nifty 500 multicap 50:25:25'], aliases: ['OIL AND NATURAL GAS'] },
  { symbol: 'COALINDIA', yahoo: 'COALINDIA.NS', name: 'Coal India Ltd', sector: 'Mining', segment: ['cash', 'nifty 50', 'nifty 100', 'nifty 200', 'nifty 500', 'nifty and banknifty', 'futures', 'nifty large midcap 250', 'nifty 500 multicap 50:25:25'], aliases: ['COAL INDIA'] },
  { symbol: 'ULTRACEMCO', yahoo: 'ULTRACEMCO.NS', name: 'UltraTech Cement Ltd', sector: 'Cement & Building', segment: ['cash', 'nifty 50', 'nifty 100', 'nifty 200', 'nifty 500', 'nifty and banknifty', 'futures', 'nifty large midcap 250', 'nifty 500 multicap 50:25:25'], aliases: ['ULTRATECH'] },
  { symbol: 'GRASIM', yahoo: 'GRASIM.NS', name: 'Grasim Industries Ltd', sector: 'Diversified', segment: ['cash', 'nifty 50', 'nifty 100', 'nifty 200', 'nifty 500', 'nifty and banknifty', 'futures', 'nifty large midcap 250', 'nifty 500 multicap 50:25:25'], aliases: ['GRASIM IND'] },
  { symbol: 'HINDALCO', yahoo: 'HINDALCO.NS', name: 'Hindalco Industries Ltd', sector: 'Metals & Aluminium', segment: ['cash', 'nifty 50', 'nifty 100', 'nifty 200', 'nifty 500', 'nifty and banknifty', 'futures', 'nifty large midcap 250', 'nifty 500 multicap 50:25:25'], aliases: ['HINDALCO'] },
  { symbol: 'JSWSTEEL', yahoo: 'JSWSTEEL.NS', name: 'JSW Steel Ltd', sector: 'Metals & Steel', segment: ['cash', 'nifty 50', 'nifty 100', 'nifty 200', 'nifty 500', 'nifty and banknifty', 'futures', 'nifty large midcap 250', 'nifty 500 multicap 50:25:25'], aliases: ['JSW STEEL'] },
  { symbol: 'WIPRO', yahoo: 'WIPRO.NS', name: 'Wipro Ltd', sector: 'Information Tech', segment: ['cash', 'nifty 50', 'nifty 100', 'nifty 200', 'nifty 500', 'nifty and banknifty', 'futures', 'nifty large midcap 250', 'nifty 500 multicap 50:25:25'], aliases: ['WIPRO'] },
  { symbol: 'TECHM', yahoo: 'TECHM.NS', name: 'Tech Mahindra Ltd', sector: 'Information Tech', segment: ['cash', 'nifty 50', 'nifty 100', 'nifty 200', 'nifty 500', 'nifty and banknifty', 'futures', 'nifty large midcap 250', 'nifty 500 multicap 50:25:25'], aliases: ['TECH MAHINDRA'] },
  { symbol: 'HCLTECH', yahoo: 'HCLTECH.NS', name: 'HCL Technologies Ltd', sector: 'Information Tech', segment: ['cash', 'nifty 50', 'nifty 100', 'nifty 200', 'nifty 500', 'nifty and banknifty', 'futures', 'nifty large midcap 250', 'nifty 500 multicap 50:25:25'], aliases: ['HCL TECH'] },
  { symbol: 'NESTLEIND', yahoo: 'NESTLEIND.NS', name: 'Nestle India Ltd', sector: 'FMCG', segment: ['cash', 'nifty 50', 'nifty 100', 'nifty 200', 'nifty 500', 'nifty and banknifty', 'futures', 'nifty large midcap 250', 'nifty 500 multicap 50:25:25'], aliases: ['NESTLE'] },
  { symbol: 'CIPLA', yahoo: 'CIPLA.NS', name: 'Cipla Ltd', sector: 'Pharma & Healthcare', segment: ['cash', 'nifty 50', 'nifty 100', 'nifty 200', 'nifty 500', 'nifty and banknifty', 'futures', 'nifty large midcap 250', 'nifty 500 multicap 50:25:25'], aliases: ['CIPLA PHARMA'] },
  { symbol: 'DRREDDY', yahoo: 'DRREDDY.NS', name: 'Dr Reddys Laboratories', sector: 'Pharma & Healthcare', segment: ['cash', 'nifty 50', 'nifty 100', 'nifty 200', 'nifty 500', 'nifty and banknifty', 'futures', 'nifty large midcap 250', 'nifty 500 multicap 50:25:25'], aliases: ['DR REDDYS'] },
  { symbol: 'APOLLOHOSP', yahoo: 'APOLLOHOSP.NS', name: 'Apollo Hospitals Enterprise Ltd', sector: 'Pharma & Healthcare', segment: ['cash', 'nifty 50', 'nifty 100', 'nifty 200', 'nifty 500', 'nifty and banknifty', 'futures', 'nifty large midcap 250', 'nifty 500 multicap 50:25:25'], aliases: ['APOLLO HOSP'] },
  { symbol: 'EICHERMOT', yahoo: 'EICHERMOT.NS', name: 'Eicher Motors Ltd', sector: 'Automobile', segment: ['cash', 'nifty 50', 'nifty 100', 'nifty 200', 'nifty 500', 'nifty and banknifty', 'futures', 'nifty large midcap 250', 'nifty 500 multicap 50:25:25'], aliases: ['ROYAL ENFIELD'] },
  { symbol: 'DIVISLAB', yahoo: 'DIVISLAB.NS', name: 'Divis Laboratories Ltd', sector: 'Pharma & Healthcare', segment: ['cash', 'nifty 50', 'nifty 100', 'nifty 200', 'nifty 500', 'nifty and banknifty', 'futures', 'nifty large midcap 250', 'nifty 500 multicap 50:25:25'], aliases: ['DIVIS LAB'] },
  { symbol: 'HEROMOTOCO', yahoo: 'HEROMOTOCO.NS', name: 'Hero MotoCorp Ltd', sector: 'Automobile', segment: ['cash', 'nifty 50', 'nifty 100', 'nifty 200', 'nifty 500', 'nifty and banknifty', 'futures', 'nifty large midcap 250', 'nifty 500 multicap 50:25:25'], aliases: ['HERO HONDA', 'HERO'] },
  { symbol: 'BRITANNIA', yahoo: 'BRITANNIA.NS', name: 'Britannia Industries Ltd', sector: 'FMCG', segment: ['cash', 'nifty 50', 'nifty 100', 'nifty 200', 'nifty 500', 'nifty and banknifty', 'futures', 'nifty large midcap 250', 'nifty 500 multicap 50:25:25'], aliases: ['BRITANNIA'] },
  { symbol: 'BPCL', yahoo: 'BPCL.NS', name: 'Bharat Petroleum Corp Ltd', sector: 'Energy & Oil', segment: ['cash', 'nifty 50', 'nifty 100', 'nifty 200', 'nifty 500', 'nifty and banknifty', 'futures', 'nifty large midcap 250', 'nifty 500 multicap 50:25:25'], aliases: ['BHARAT PETROLEUM'] },
  { symbol: 'SHRIRAMFIN', yahoo: 'SHRIRAMFIN.NS', name: 'Shriram Finance Ltd', sector: 'Financial Services', segment: ['cash', 'nifty 50', 'nifty 100', 'nifty 200', 'nifty 500', 'nifty and banknifty', 'futures', 'nifty large midcap 250', 'nifty 500 multicap 50:25:25'], aliases: ['SHRIRAM TRANSPORT'] },
  { symbol: 'BEL', yahoo: 'BEL.NS', name: 'Bharat Electronics Ltd', sector: 'Defence & Aerospace', segment: ['cash', 'nifty 50', 'nifty 100', 'nifty 200', 'nifty 500', 'nifty and banknifty', 'futures', 'nifty large midcap 250', 'nifty 500 multicap 50:25:25'], aliases: ['BHARAT ELECTRONICS'] },
  { symbol: 'ASIANPAINT', yahoo: 'ASIANPAINT.NS', name: 'Asian Paints Ltd', sector: 'Paints & Consumer', segment: ['cash', 'nifty 50', 'nifty 100', 'nifty 200', 'nifty 500', 'nifty and banknifty', 'futures', 'nifty large midcap 250', 'nifty 500 multicap 50:25:25'], aliases: ['ASIAN PAINTS'] },

  // 5. Nifty Next 50 Growth Giants
  { symbol: 'ZOMATO', yahoo: 'ETERNAL.NS', name: 'Zomato Ltd (Eternal Ltd)', sector: 'Consumer Internet', segment: ['cash', 'nifty next 50', 'nifty 100', 'nifty 200', 'nifty 500', 'futures', 'nifty large midcap 250', 'nifty 500 multicap 50:25:25'], aliases: ['ETERNAL', 'BLINKIT', 'ZOMTO'] },
  { symbol: 'JIOFIN', yahoo: 'JIOFIN.NS', name: 'Jio Financial Services Ltd', sector: 'Financial Services', segment: ['cash', 'nifty next 50', 'nifty 100', 'nifty 200', 'nifty 500', 'futures', 'nifty large midcap 250', 'nifty 500 multicap 50:25:25'], aliases: ['JFS', 'JIO FINANCIAL'] },
  { symbol: 'HAL', yahoo: 'HAL.NS', name: 'Hindustan Aeronautics Ltd', sector: 'Defence & Aerospace', segment: ['cash', 'nifty next 50', 'nifty 100', 'nifty 200', 'nifty 500', 'futures', 'nifty large midcap 250', 'nifty 500 multicap 50:25:25'], aliases: ['HINDUSTAN AERO'] },
  { symbol: 'DLF', yahoo: 'DLF.NS', name: 'DLF Limited', sector: 'Real Estate & Infra', segment: ['cash', 'nifty next 50', 'nifty 100', 'nifty 200', 'nifty 500', 'futures', 'nifty large midcap 250', 'nifty 500 multicap 50:25:25'], aliases: ['DLF REALTY'] },
  { symbol: 'GAIL', yahoo: 'GAIL.NS', name: 'GAIL (India) Ltd', sector: 'Gas Transmission', segment: ['cash', 'nifty next 50', 'nifty 100', 'nifty 200', 'nifty 500', 'futures', 'nifty large midcap 250', 'nifty 500 multicap 50:25:25'], aliases: ['GAS AUTHORITY'] },
  { symbol: 'GODREJCP', yahoo: 'GODREJCP.NS', name: 'Godrej Consumer Products', sector: 'FMCG', segment: ['cash', 'nifty next 50', 'nifty 100', 'nifty 200', 'nifty 500', 'futures', 'nifty large midcap 250', 'nifty 500 multicap 50:25:25'], aliases: ['GODREJ CONSUMER'] },
  { symbol: 'INDIGO', yahoo: 'INDIGO.NS', name: 'InterGlobe Aviation Ltd (IndiGo)', sector: 'Aviation', segment: ['cash', 'nifty next 50', 'nifty 100', 'nifty 200', 'nifty 500', 'futures', 'nifty large midcap 250', 'nifty 500 multicap 50:25:25'], aliases: ['INTERGLOBE'] },
  { symbol: 'SIEMENS', yahoo: 'SIEMENS.NS', name: 'Siemens Ltd', sector: 'Capital Goods & Engg', segment: ['cash', 'nifty next 50', 'nifty 100', 'nifty 200', 'nifty 500', 'futures', 'nifty large midcap 250', 'nifty 500 multicap 50:25:25'], aliases: ['SIEMENS INDIA'] },
  { symbol: 'ABB', yahoo: 'ABB.NS', name: 'ABB India Ltd', sector: 'Capital Goods & Robotics', segment: ['cash', 'nifty next 50', 'nifty 100', 'nifty 200', 'nifty 500', 'futures', 'nifty large midcap 250', 'nifty 500 multicap 50:25:25'], aliases: ['ABB INDIA'] },
  { symbol: 'CHOLAFIN', yahoo: 'CHOLAFIN.NS', name: 'Cholamandalam Investment & Finance', sector: 'Financial Services', segment: ['cash', 'nifty next 50', 'nifty 100', 'nifty 200', 'nifty 500', 'futures', 'nifty large midcap 250', 'nifty 500 multicap 50:25:25'], aliases: ['CHOLA'] },
  { symbol: 'PIDILITIND', yahoo: 'PIDILITIND.NS', name: 'Pidilite Industries Ltd', sector: 'Chemicals & Adhesives', segment: ['cash', 'nifty next 50', 'nifty 100', 'nifty 200', 'nifty 500', 'futures', 'nifty large midcap 250', 'nifty 500 multicap 50:25:25'], aliases: ['FEVICOL', 'PIDILITE'] },
  { symbol: 'AMBUJACEM', yahoo: 'AMBUJACEM.NS', name: 'Ambuja Cements Ltd', sector: 'Cement & Building', segment: ['cash', 'nifty next 50', 'nifty 100', 'nifty 200', 'nifty 500', 'futures', 'nifty large midcap 250', 'nifty 500 multicap 50:25:25'], aliases: ['AMBUJA CEMENT'] },
  { symbol: 'VEDL', yahoo: 'VEDL.NS', name: 'Vedanta Ltd', sector: 'Metals & Mining', segment: ['cash', 'nifty next 50', 'nifty 100', 'nifty 200', 'nifty 500', 'futures', 'nifty large midcap 250', 'nifty 500 multicap 50:25:25'], aliases: ['VEDANTA'] },
  { symbol: 'HAVELLS', yahoo: 'HAVELLS.NS', name: 'Havells India Ltd', sector: 'Consumer Electricals', segment: ['cash', 'nifty next 50', 'nifty 100', 'nifty 200', 'nifty 500', 'futures', 'nifty large midcap 250', 'nifty 500 multicap 50:25:25'], aliases: ['HAVELLS'] },
  { symbol: 'NAUKRI', yahoo: 'NAUKRI.NS', name: 'Info Edge (India) Ltd', sector: 'Internet & Software', segment: ['cash', 'nifty next 50', 'nifty 100', 'nifty 200', 'nifty 500', 'futures', 'nifty large midcap 250', 'nifty 500 multicap 50:25:25'], aliases: ['INFO EDGE'] },
  { symbol: 'TVSMOTOR', yahoo: 'TVSMOTOR.NS', name: 'TVS Motor Company Ltd', sector: 'Automobile', segment: ['cash', 'nifty next 50', 'nifty 100', 'nifty 200', 'nifty 500', 'futures', 'nifty large midcap 250', 'nifty 500 multicap 50:25:25'], aliases: ['TVS MOTOR'] },
  { symbol: 'MOTHERSON', yahoo: 'MOTHERSON.NS', name: 'Samvardhana Motherson Int', sector: 'Auto Ancillaries', segment: ['cash', 'nifty next 50', 'nifty 100', 'nifty 200', 'nifty 500', 'futures', 'nifty large midcap 250', 'nifty 500 multicap 50:25:25'], aliases: ['MOTHERSON SUMI'] },
  { symbol: 'DABUR', yahoo: 'DABUR.NS', name: 'Dabur India Ltd', sector: 'FMCG', segment: ['cash', 'nifty next 50', 'nifty 100', 'nifty 200', 'nifty 500', 'futures', 'nifty large midcap 250', 'nifty 500 multicap 50:25:25'], aliases: ['DABUR'] },
  { symbol: 'MARICO', yahoo: 'MARICO.NS', name: 'Marico Ltd', sector: 'FMCG', segment: ['cash', 'nifty next 50', 'nifty 100', 'nifty 200', 'nifty 500', 'futures', 'nifty large midcap 250', 'nifty 500 multicap 50:25:25'], aliases: ['PARACHUTE OIL'] },
  { symbol: 'BERGEPAINT', yahoo: 'BERGEPAINT.NS', name: 'Berger Paints India Ltd', sector: 'Paints & Coatings', segment: ['cash', 'nifty next 50', 'nifty 100', 'nifty 200', 'nifty 500', 'futures', 'nifty large midcap 250', 'nifty 500 multicap 50:25:25'], aliases: ['BERGER PAINTS'] },
  { symbol: 'SBILIFE', yahoo: 'SBILIFE.NS', name: 'SBI Life Insurance Company', sector: 'Insurance', segment: ['cash', 'nifty next 50', 'nifty 100', 'nifty 200', 'nifty 500', 'futures', 'nifty large midcap 250', 'nifty 500 multicap 50:25:25'], aliases: ['SBI LIFE'] },
  { symbol: 'HDFCLIFE', yahoo: 'HDFCLIFE.NS', name: 'HDFC Life Insurance Co', sector: 'Insurance', segment: ['cash', 'nifty next 50', 'nifty 100', 'nifty 200', 'nifty 500', 'futures', 'nifty large midcap 250', 'nifty 500 multicap 50:25:25'], aliases: ['HDFC LIFE'] },

  // 6. Midcap Universe (Midcap 50, 100, 150, Select, Mid-Smallcap 400)
  { symbol: 'SUZLON', yahoo: 'SUZLON.NS', name: 'Suzlon Energy Ltd', sector: 'Renewable Wind', segment: ['cash', 'Midcap 50', 'nifty midcap 50', 'nifty midcap 100', 'nifty midcap 150', 'nifty midcap select', 'nifty 200', 'nifty 500', 'nifty large midcap 250', 'nifty mid smallcap 400', 'futures', 'nifty 500 multicap 50:25:25'], aliases: ['SUZLON ENERGY'] },
  { symbol: 'DIXON', yahoo: 'DIXON.NS', name: 'Dixon Technologies Ltd', sector: 'Electronics Mfg', segment: ['cash', 'Midcap 50', 'nifty midcap 50', 'nifty midcap 100', 'nifty midcap 150', 'nifty midcap select', 'nifty 200', 'nifty 500', 'nifty large midcap 250', 'nifty mid smallcap 400', 'futures', 'nifty 500 multicap 50:25:25'], aliases: ['DIXON TECH'] },
  { symbol: 'POLYCAB', yahoo: 'POLYCAB.NS', name: 'Polycab India Ltd', sector: 'Cables & Wires', segment: ['cash', 'Midcap 50', 'nifty midcap 50', 'nifty midcap 100', 'nifty midcap 150', 'nifty midcap select', 'nifty 200', 'nifty 500', 'nifty large midcap 250', 'nifty mid smallcap 400', 'futures', 'nifty 500 multicap 50:25:25'], aliases: ['POLYCAB WIRES'] },
  { symbol: 'MAZDOCK', yahoo: 'MAZDOCK.NS', name: 'Mazagon Dock Shipbuilders', sector: 'Defence & Marine', segment: ['cash', 'Midcap 50', 'nifty midcap 50', 'nifty midcap 100', 'nifty midcap 150', 'nifty midcap select', 'nifty 200', 'nifty 500', 'nifty large midcap 250', 'nifty mid smallcap 400', 'futures', 'nifty 500 multicap 50:25:25'], aliases: ['MAZAGON DOCK'] },
  { symbol: 'COCHINSHIP', yahoo: 'COCHINSHIP.NS', name: 'Cochin Shipyard Ltd', sector: 'Defence & Marine', segment: ['cash', 'Midcap 50', 'nifty midcap 50', 'nifty midcap 100', 'nifty midcap 150', 'nifty midcap select', 'nifty 200', 'nifty 500', 'nifty large midcap 250', 'nifty mid smallcap 400', 'futures', 'nifty 500 multicap 50:25:25'], aliases: ['COCHIN SHIP'] },
  { symbol: 'BDL', yahoo: 'BDL.NS', name: 'Bharat Dynamics Ltd', sector: 'Defence & Missiles', segment: ['cash', 'Midcap 50', 'nifty midcap 50', 'nifty midcap 100', 'nifty midcap 150', 'nifty midcap select', 'nifty 200', 'nifty 500', 'nifty large midcap 250', 'nifty mid smallcap 400', 'futures', 'nifty 500 multicap 50:25:25'], aliases: ['BHARAT DYNAMICS'] },
  { symbol: 'BHEL', yahoo: 'BHEL.NS', name: 'Bharat Heavy Electricals Ltd', sector: 'Heavy Engineering', segment: ['cash', 'Midcap 50', 'nifty midcap 50', 'nifty midcap 100', 'nifty midcap 150', 'nifty midcap select', 'nifty 200', 'nifty 500', 'nifty large midcap 250', 'nifty mid smallcap 400', 'futures', 'nifty 500 multicap 50:25:25'], aliases: ['BHARAT HEAVY'] },
  { symbol: 'RVNL', yahoo: 'RVNL.NS', name: 'Rail Vikas Nigam Ltd', sector: 'Railways & Infra', segment: ['cash', 'Midcap 50', 'nifty midcap 50', 'nifty midcap 100', 'nifty midcap 150', 'nifty midcap select', 'nifty 200', 'nifty 500', 'nifty large midcap 250', 'nifty mid smallcap 400', 'futures', 'nifty 500 multicap 50:25:25'], aliases: ['RAIL VIKAS'] },
  { symbol: 'IRFC', yahoo: 'IRFC.NS', name: 'Indian Railway Finance Corp', sector: 'Railways Finance', segment: ['cash', 'Midcap 50', 'nifty midcap 50', 'nifty midcap 100', 'nifty midcap 150', 'nifty midcap select', 'nifty 200', 'nifty 500', 'nifty large midcap 250', 'nifty mid smallcap 400', 'futures', 'nifty 500 multicap 50:25:25'], aliases: ['RAILWAY FINANCE'] },
  { symbol: 'IRCTC', yahoo: 'IRCTC.NS', name: 'Indian Railway Catering & Tourism', sector: 'Tourism & Catering', segment: ['cash', 'Midcap 50', 'nifty midcap 50', 'nifty midcap 100', 'nifty midcap 150', 'nifty midcap select', 'nifty 200', 'nifty 500', 'nifty large midcap 250', 'nifty mid smallcap 400', 'futures', 'nifty 500 multicap 50:25:25'], aliases: ['RAIL TICKET'] },
  { symbol: 'IREDA', yahoo: 'IREDA.NS', name: 'Indian Renewable Energy Dev Agency', sector: 'Green Finance', segment: ['cash', 'Midcap 50', 'nifty midcap 50', 'nifty midcap 100', 'nifty midcap 150', 'nifty midcap select', 'nifty 200', 'nifty 500', 'nifty large midcap 250', 'nifty mid smallcap 400', 'futures', 'nifty 500 multicap 50:25:25'], aliases: ['IREDA'] },
  { symbol: 'TATAPOWER', yahoo: 'TATAPOWER.NS', name: 'Tata Power Company Ltd', sector: 'Power & Utilities', segment: ['cash', 'Midcap 50', 'nifty midcap 50', 'nifty midcap 100', 'nifty midcap 150', 'nifty midcap select', 'nifty 200', 'nifty 500', 'nifty large midcap 250', 'nifty mid smallcap 400', 'futures', 'nifty 500 multicap 50:25:25'], aliases: ['TATA POWER'] },
  { symbol: 'TATACHEM', yahoo: 'TATACHEM.NS', name: 'Tata Chemicals Ltd', sector: 'Chemicals', segment: ['cash', 'Midcap 50', 'nifty midcap 50', 'nifty midcap 100', 'nifty midcap 150', 'nifty midcap select', 'nifty 200', 'nifty 500', 'nifty large midcap 250', 'nifty mid smallcap 400', 'futures', 'nifty 500 multicap 50:25:25'], aliases: ['TATA CHEMICALS'] },
  { symbol: 'TATAELXSI', yahoo: 'TATAELXSI.NS', name: 'Tata Elxsi Ltd', sector: 'Information Tech', segment: ['cash', 'Midcap 50', 'nifty midcap 50', 'nifty midcap 100', 'nifty midcap 150', 'nifty midcap select', 'nifty 200', 'nifty 500', 'nifty large midcap 250', 'nifty mid smallcap 400', 'futures', 'nifty 500 multicap 50:25:25'], aliases: ['TATA ELXSI'] },
  { symbol: 'TATACOMM', yahoo: 'TATACOMM.NS', name: 'Tata Communications Ltd', sector: 'Telecom Infra', segment: ['cash', 'Midcap 50', 'nifty midcap 50', 'nifty midcap 100', 'nifty midcap 150', 'nifty midcap select', 'nifty 200', 'nifty 500', 'nifty large midcap 250', 'nifty mid smallcap 400', 'futures', 'nifty 500 multicap 50:25:25'], aliases: ['TATA COMM'] },
  { symbol: 'VOLTAS', yahoo: 'VOLTAS.NS', name: 'Voltas Ltd (A Tata Enterprise)', sector: 'Air Conditioning & Cooling', segment: ['cash', 'Midcap 50', 'nifty midcap 50', 'nifty midcap 100', 'nifty midcap 150', 'nifty midcap select', 'nifty 200', 'nifty 500', 'nifty large midcap 250', 'nifty mid smallcap 400', 'futures', 'nifty 500 multicap 50:25:25'], aliases: ['TATA VOLTAS'] },
  { symbol: 'PERSISTENT', yahoo: 'PERSISTENT.NS', name: 'Persistent Systems Ltd', sector: 'Information Tech', segment: ['cash', 'Midcap 50', 'nifty midcap 50', 'nifty midcap 100', 'nifty midcap 150', 'nifty midcap select', 'nifty 200', 'nifty 500', 'nifty large midcap 250', 'nifty mid smallcap 400', 'futures', 'nifty 500 multicap 50:25:25'], aliases: ['PERSISTENT SYSTEMS'] },
  { symbol: 'COFORGE', yahoo: 'COFORGE.NS', name: 'Coforge Ltd', sector: 'Information Tech', segment: ['cash', 'Midcap 50', 'nifty midcap 50', 'nifty midcap 100', 'nifty midcap 150', 'nifty midcap select', 'nifty 200', 'nifty 500', 'nifty large midcap 250', 'nifty mid smallcap 400', 'futures', 'nifty 500 multicap 50:25:25'], aliases: ['NIIT TECH'] },
  { symbol: 'KPITTECH', yahoo: 'KPITTECH.NS', name: 'KPIT Technologies Ltd', sector: 'Auto Tech & Software', segment: ['cash', 'Midcap 50', 'nifty midcap 50', 'nifty midcap 100', 'nifty midcap 150', 'nifty midcap select', 'nifty 200', 'nifty 500', 'nifty large midcap 250', 'nifty mid smallcap 400', 'futures', 'nifty 500 multicap 50:25:25'], aliases: ['KPIT'] },
  { symbol: 'LTTS', yahoo: 'LTTS.NS', name: 'L&T Technology Services', sector: 'Engineering Tech', segment: ['cash', 'Midcap 50', 'nifty midcap 50', 'nifty midcap 100', 'nifty midcap 150', 'nifty midcap select', 'nifty 200', 'nifty 500', 'nifty large midcap 250', 'nifty mid smallcap 400', 'futures', 'nifty 500 multicap 50:25:25'], aliases: ['L&T TECH'] },
  { symbol: 'LUPIN', yahoo: 'LUPIN.NS', name: 'Lupin Ltd', sector: 'Pharma & Biotech', segment: ['cash', 'Midcap 50', 'nifty midcap 50', 'nifty midcap 100', 'nifty midcap 150', 'nifty midcap select', 'nifty 200', 'nifty 500', 'nifty large midcap 250', 'nifty mid smallcap 400', 'futures', 'nifty 500 multicap 50:25:25'], aliases: ['LUPIN PHARMA'] },
  { symbol: 'AUROPHARMA', yahoo: 'AUROPHARMA.NS', name: 'Aurobindo Pharma Ltd', sector: 'Pharma & Generics', segment: ['cash', 'Midcap 50', 'nifty midcap 50', 'nifty midcap 100', 'nifty midcap 150', 'nifty midcap select', 'nifty 200', 'nifty 500', 'nifty large midcap 250', 'nifty mid smallcap 400', 'futures', 'nifty 500 multicap 50:25:25'], aliases: ['AUROBINDO'] },
  { symbol: 'ASHOKLEY', yahoo: 'ASHOKLEY.NS', name: 'Ashok Leyland Ltd', sector: 'Commercial Vehicles', segment: ['cash', 'Midcap 50', 'nifty midcap 50', 'nifty midcap 100', 'nifty midcap 150', 'nifty midcap select', 'nifty 200', 'nifty 500', 'nifty large midcap 250', 'nifty mid smallcap 400', 'futures', 'nifty 500 multicap 50:25:25'], aliases: ['ASHOK LEYLAND'] },
  { symbol: 'CUMMINSIND', yahoo: 'CUMMINSIND.NS', name: 'Cummins India Ltd', sector: 'Engines & Powergen', segment: ['cash', 'Midcap 50', 'nifty midcap 50', 'nifty midcap 100', 'nifty midcap 150', 'nifty midcap select', 'nifty 200', 'nifty 500', 'nifty large midcap 250', 'nifty mid smallcap 400', 'futures', 'nifty 500 multicap 50:25:25'], aliases: ['CUMMINS'] },
  { symbol: 'ESCORTS', yahoo: 'ESCORTS.NS', name: 'Escorts Kubota Ltd', sector: 'Agri Machinery & Tractors', segment: ['cash', 'Midcap 50', 'nifty midcap 50', 'nifty midcap 100', 'nifty midcap 150', 'nifty midcap select', 'nifty 200', 'nifty 500', 'nifty large midcap 250', 'nifty mid smallcap 400', 'futures', 'nifty 500 multicap 50:25:25'], aliases: ['ESCORTS KUBOTA'] },
  { symbol: 'OBEROIRLTY', yahoo: 'OBEROIRLTY.NS', name: 'Oberoi Realty Ltd', sector: 'Real Estate Development', segment: ['cash', 'Midcap 50', 'nifty midcap 50', 'nifty midcap 100', 'nifty midcap 150', 'nifty midcap select', 'nifty 200', 'nifty 500', 'nifty large midcap 250', 'nifty mid smallcap 400', 'futures', 'nifty 500 multicap 50:25:25'], aliases: ['OBEROI REALTY'] },
  { symbol: 'ASTRAL', yahoo: 'ASTRAL.NS', name: 'Astral Ltd', sector: 'Pipes & Adhesives', segment: ['cash', 'Midcap 50', 'nifty midcap 50', 'nifty midcap 100', 'nifty midcap 150', 'nifty midcap select', 'nifty 200', 'nifty 500', 'nifty large midcap 250', 'nifty mid smallcap 400', 'futures', 'nifty 500 multicap 50:25:25'], aliases: ['ASTRAL PIPES'] },
  { symbol: 'DEEPAKNTR', yahoo: 'DEEPAKNTR.NS', name: 'Deepak Nitrite Ltd', sector: 'Speciality Chemicals', segment: ['cash', 'Midcap 50', 'nifty midcap 50', 'nifty midcap 100', 'nifty midcap 150', 'nifty midcap select', 'nifty 200', 'nifty 500', 'nifty large midcap 250', 'nifty mid smallcap 400', 'futures', 'nifty 500 multicap 50:25:25'], aliases: ['DEEPAK NITRITE'] },
  { symbol: 'ADANIPOWER', yahoo: 'ADANIPOWER.NS', name: 'Adani Power Ltd', sector: 'Thermal Power', segment: ['cash', 'Midcap 50', 'nifty midcap 50', 'nifty midcap 100', 'nifty midcap 150', 'nifty midcap select', 'nifty 200', 'nifty 500', 'nifty large midcap 250', 'nifty mid smallcap 400', 'futures', 'nifty 500 multicap 50:25:25'], aliases: ['ADANI POWER'] },
  { symbol: 'ADANIENSOL', yahoo: 'ADANIENSOL.NS', name: 'Adani Energy Solutions Ltd', sector: 'Power Transmission', segment: ['cash', 'Midcap 50', 'nifty midcap 50', 'nifty midcap 100', 'nifty midcap 150', 'nifty midcap select', 'nifty 200', 'nifty 500', 'nifty large midcap 250', 'nifty mid smallcap 400', 'futures', 'nifty 500 multicap 50:25:25'], aliases: ['ADANI TRANS'] },
  { symbol: 'ADANIGREEN', yahoo: 'ADANIGREEN.NS', name: 'Adani Green Energy Ltd', sector: 'Renewable Solar', segment: ['cash', 'Midcap 50', 'nifty midcap 50', 'nifty midcap 100', 'nifty midcap 150', 'nifty midcap select', 'nifty 200', 'nifty 500', 'nifty large midcap 250', 'nifty mid smallcap 400', 'nifty 500 multicap 50:25:25'], aliases: ['ADANI GREEN'] },
  { symbol: 'NHPC', yahoo: 'NHPC.NS', name: 'NHPC Ltd', sector: 'Hydro Power', segment: ['cash', 'Midcap 50', 'nifty midcap 50', 'nifty midcap 100', 'nifty midcap 150', 'nifty midcap select', 'nifty 200', 'nifty 500', 'nifty large midcap 250', 'nifty mid smallcap 400', 'futures', 'nifty 500 multicap 50:25:25'], aliases: ['HYDRO POWER'] },
  { symbol: 'APLAPOLLO', yahoo: 'APLAPOLLO.NS', name: 'APL Apollo Tubes Ltd', sector: 'Structural Steel', segment: ['cash', 'Midcap 50', 'nifty midcap 50', 'nifty midcap 100', 'nifty midcap 150', 'nifty midcap select', 'nifty 200', 'nifty 500', 'nifty large midcap 250', 'nifty mid smallcap 400', 'futures', 'nifty 500 multicap 50:25:25'], aliases: ['APL APOLLO'] },
  { symbol: 'APOLLOTYRE', yahoo: 'APOLLOTYRE.NS', name: 'Apollo Tyres Ltd', sector: 'Tyres & Rubber', segment: ['cash', 'Midcap 50', 'nifty midcap 50', 'nifty midcap 100', 'nifty midcap 150', 'nifty midcap select', 'nifty 200', 'nifty 500', 'nifty large midcap 250', 'nifty mid smallcap 400', 'futures', 'nifty 500 multicap 50:25:25'], aliases: ['APOLLO TYRE'] },

  // 7. Smallcap & Microcap High Growth (Smallcap 50, 100, 250, Microcap 250, Mid-Smallcap 400)
  { symbol: 'APOLLO', yahoo: 'APOLLO.NS', name: 'Apollo Micro Systems Ltd', sector: 'Defence Electronics', segment: ['cash', 'nifty smallcap 50', 'nifty smallcap 100', 'nifty smallcap 250', 'nifty microcap 250', 'nifty 500', 'nifty mid smallcap 400', 'nifty 500 multicap 50:25:25'], aliases: ['APOLLO MICRO'] },
  { symbol: 'CDSL', yahoo: 'CDSL.NS', name: 'Central Depository Services Ltd', sector: 'Capital Markets', segment: ['cash', 'nifty smallcap 50', 'nifty smallcap 100', 'nifty smallcap 250', 'nifty microcap 250', 'nifty 500', 'nifty mid smallcap 400', 'futures', 'nifty 500 multicap 50:25:25'], aliases: ['CDSL DEPOSITORY'] },
  { symbol: 'BSE', yahoo: 'BSE.NS', name: 'BSE Limited', sector: 'Stock Exchanges', segment: ['cash', 'nifty smallcap 50', 'nifty smallcap 100', 'nifty smallcap 250', 'nifty microcap 250', 'nifty 500', 'nifty mid smallcap 400', 'futures', 'nifty 500 multicap 50:25:25'], aliases: ['BSE EXCHANGE'] },
  { symbol: 'MCX', yahoo: 'MCX.NS', name: 'Multi Commodity Exchange of India', sector: 'Commodity Exchanges', segment: ['cash', 'nifty smallcap 50', 'nifty smallcap 100', 'nifty smallcap 250', 'nifty microcap 250', 'nifty 500', 'nifty mid smallcap 400', 'futures', 'nifty 500 multicap 50:25:25'], aliases: ['MCX INDIA'] },
  { symbol: 'PAYTM', yahoo: 'PAYTM.NS', name: 'One97 Communications (Paytm)', sector: 'Fintech & Payments', segment: ['cash', 'nifty smallcap 50', 'nifty smallcap 100', 'nifty smallcap 250', 'nifty microcap 250', 'nifty 500', 'nifty mid smallcap 400', 'nifty 500 multicap 50:25:25'], aliases: ['PAYTM'] },
  { symbol: 'SWIGGY', yahoo: 'SWIGGY.NS', name: 'Swiggy Ltd', sector: 'Food Delivery & Quick Commerce', segment: ['cash', 'nifty smallcap 50', 'nifty smallcap 100', 'nifty smallcap 250', 'nifty microcap 250', 'nifty 500', 'nifty mid smallcap 400', 'nifty 500 multicap 50:25:25'], aliases: ['SWIGGY INSTAMART'] },
  { symbol: 'KALYANKJIL', yahoo: 'KALYANKJIL.NS', name: 'Kalyan Jewellers India Ltd', sector: 'Jewellery Retail', segment: ['cash', 'nifty smallcap 50', 'nifty smallcap 100', 'nifty smallcap 250', 'nifty microcap 250', 'nifty 500', 'nifty mid smallcap 400', 'nifty 500 multicap 50:25:25'], aliases: ['KALYAN JEWELLERS'] },
  { symbol: 'HUDCO', yahoo: 'HUDCO.NS', name: 'Housing & Urban Dev Corp', sector: 'Housing Finance', segment: ['cash', 'nifty smallcap 50', 'nifty smallcap 100', 'nifty smallcap 250', 'nifty microcap 250', 'nifty 500', 'nifty mid smallcap 400', 'nifty 500 multicap 50:25:25'], aliases: ['HUDCO'] },
  { symbol: 'NBCC', yahoo: 'NBCC.NS', name: 'NBCC (India) Ltd', sector: 'Civil Construction', segment: ['cash', 'nifty smallcap 50', 'nifty smallcap 100', 'nifty smallcap 250', 'nifty microcap 250', 'nifty 500', 'nifty mid smallcap 400', 'nifty 500 multicap 50:25:25'], aliases: ['NBCC'] },
  { symbol: 'RAILTEL', yahoo: 'RAILTEL.NS', name: 'RailTel Corporation of India', sector: 'Telecom & OFC', segment: ['cash', 'nifty smallcap 50', 'nifty smallcap 100', 'nifty smallcap 250', 'nifty microcap 250', 'nifty 500', 'nifty mid smallcap 400', 'nifty 500 multicap 50:25:25'], aliases: ['RAILTEL'] },
  { symbol: 'OLECTRA', yahoo: 'OLECTRA.NS', name: 'Olectra Greentech Ltd', sector: 'Electric Buses & Mobility', segment: ['cash', 'nifty smallcap 50', 'nifty smallcap 100', 'nifty smallcap 250', 'nifty microcap 250', 'nifty 500', 'nifty mid smallcap 400', 'nifty 500 multicap 50:25:25'], aliases: ['OLECTRA GREEN'] },
  { symbol: 'TEJASNET', yahoo: 'TEJASNET.NS', name: 'Tejas Networks Ltd (A Tata Enterprise)', sector: 'Telecom Hardware & 5G', segment: ['cash', 'nifty smallcap 50', 'nifty smallcap 100', 'nifty smallcap 250', 'nifty microcap 250', 'nifty 500', 'nifty mid smallcap 400', 'nifty 500 multicap 50:25:25'], aliases: ['TEJAS NETWORKS'] },
  { symbol: 'IDEA', yahoo: 'IDEA.NS', name: 'Vodafone Idea Ltd', sector: 'Telecom Cellular', segment: ['cash', 'nifty smallcap 50', 'nifty smallcap 100', 'nifty smallcap 250', 'nifty microcap 250', 'nifty 500', 'nifty mid smallcap 400', 'futures', 'nifty 500 multicap 50:25:25'], aliases: ['VI', 'VODAFONE IDEA'] },
  { symbol: 'RPOWER', yahoo: 'RPOWER.NS', name: 'Reliance Power Ltd', sector: 'Thermal & Clean Power', segment: ['cash', 'nifty smallcap 50', 'nifty smallcap 100', 'nifty smallcap 250', 'nifty microcap 250', 'nifty 500', 'nifty mid smallcap 400', 'nifty 500 multicap 50:25:25'], aliases: ['RELIANCE POWER'] },
  { symbol: 'YESBANK', yahoo: 'YESBANK.NS', name: 'Yes Bank Ltd', sector: 'Banking Services', segment: ['cash', 'nifty smallcap 50', 'nifty smallcap 100', 'nifty smallcap 250', 'nifty microcap 250', 'nifty 500', 'nifty mid smallcap 400', 'nifty 500 multicap 50:25:25'], aliases: ['YES BANK'] },
  { symbol: 'HFCL', yahoo: 'HFCL.NS', name: 'HFCL Ltd', sector: 'Optic Fibres & Telecom', segment: ['cash', 'nifty smallcap 50', 'nifty smallcap 100', 'nifty smallcap 250', 'nifty microcap 250', 'nifty 500', 'nifty mid smallcap 400', 'nifty 500 multicap 50:25:25'], aliases: ['HFCL'] },
  { symbol: 'SJVN', yahoo: 'SJVN.NS', name: 'SJVN Ltd', sector: 'Hydro & Solar Energy', segment: ['cash', 'nifty smallcap 50', 'nifty smallcap 100', 'nifty smallcap 250', 'nifty microcap 250', 'nifty 500', 'nifty mid smallcap 400', 'nifty 500 multicap 50:25:25'], aliases: ['SJVN'] },
  { symbol: 'IRCON', yahoo: 'IRCON.NS', name: 'Ircon International Ltd', sector: 'Railway Infra EPC', segment: ['cash', 'nifty smallcap 50', 'nifty smallcap 100', 'nifty smallcap 250', 'nifty microcap 250', 'nifty 500', 'nifty mid smallcap 400', 'nifty 500 multicap 50:25:25'], aliases: ['IRCON'] },
  { symbol: 'SONATSOFTW', yahoo: 'SONATSOFTW.NS', name: 'Sonata Software Ltd', sector: 'Information Tech', segment: ['cash', 'nifty smallcap 50', 'nifty smallcap 100', 'nifty smallcap 250', 'nifty microcap 250', 'nifty 500', 'nifty mid smallcap 400', 'nifty 500 multicap 50:25:25'], aliases: ['SONATA'] },
  { symbol: 'HAPPSSTMNDS', yahoo: 'HAPPSTMNDS.NS', name: 'Happiest Minds Technologies', sector: 'Digital IT & Cloud', segment: ['cash', 'nifty smallcap 50', 'nifty smallcap 100', 'nifty smallcap 250', 'nifty microcap 250', 'nifty 500', 'nifty mid smallcap 400', 'nifty 500 multicap 50:25:25'], aliases: ['HAPPIEST MINDS', 'HAPPSTMNDS'] },
  { symbol: 'KARURVYSYA', yahoo: 'KARURVYSYA.NS', name: 'Karur Vysya Bank Ltd', sector: 'Private Sector Banking', segment: ['cash', 'nifty smallcap 50', 'nifty smallcap 100', 'nifty smallcap 250', 'nifty microcap 250', 'nifty 500', 'nifty mid smallcap 400', 'nifty 500 multicap 50:25:25'], aliases: ['KVB', 'KARUR VYSYA'] },
  { symbol: 'INOXWIND', yahoo: 'INOXWIND.NS', name: 'Inox Wind Ltd', sector: 'Wind Energy OEM', segment: ['cash', 'nifty smallcap 50', 'nifty smallcap 100', 'nifty smallcap 250', 'nifty microcap 250', 'nifty 500', 'nifty mid smallcap 400', 'nifty 500 multicap 50:25:25'], aliases: ['INOX WIND'] },
  { symbol: 'PRAJIND', yahoo: 'PRAJIND.NS', name: 'Praj Industries Ltd', sector: 'Biofuels & Engineering', segment: ['cash', 'nifty smallcap 50', 'nifty smallcap 100', 'nifty smallcap 250', 'nifty microcap 250', 'nifty 500', 'nifty mid smallcap 400', 'nifty 500 multicap 50:25:25'], aliases: ['PRAJ'] },
  { symbol: 'CEATLTD', yahoo: 'CEATLTD.NS', name: 'CEAT Ltd', sector: 'Tyres Manufacturing', segment: ['cash', 'nifty smallcap 50', 'nifty smallcap 100', 'nifty smallcap 250', 'nifty microcap 250', 'nifty 500', 'nifty mid smallcap 400', 'nifty 500 multicap 50:25:25'], aliases: ['CEAT'] },
  { symbol: 'MRF', yahoo: 'MRF.NS', name: 'MRF Ltd', sector: 'Tyres Manufacturing', segment: ['cash', 'nifty smallcap 50', 'nifty smallcap 100', 'nifty smallcap 250', 'nifty 500', 'nifty mid smallcap 400', 'futures', 'nifty 500 multicap 50:25:25'], aliases: ['MRF TYRES'] },
  { symbol: 'ROUTE', yahoo: 'ROUTE.NS', name: 'Route Mobile Ltd', sector: 'Cloud Communications CPaaS', segment: ['cash', 'nifty smallcap 50', 'nifty smallcap 100', 'nifty smallcap 250', 'nifty microcap 250', 'nifty 500', 'nifty mid smallcap 400', 'nifty 500 multicap 50:25:25'], aliases: ['ROUTE MOBILE'] },
  { symbol: 'TANLA', yahoo: 'TANLA.NS', name: 'Tanla Platforms Ltd', sector: 'CPaaS & SMS Gateway', segment: ['cash', 'nifty smallcap 50', 'nifty smallcap 100', 'nifty smallcap 250', 'nifty microcap 250', 'nifty 500', 'nifty mid smallcap 400', 'nifty 500 multicap 50:25:25'], aliases: ['TANLA'] },
  { symbol: 'CASTROL', yahoo: 'CASTROLIND.NS', name: 'Castrol India Ltd', sector: 'Lubricants & Oils', segment: ['cash', 'nifty smallcap 50', 'nifty smallcap 100', 'nifty smallcap 250', 'nifty microcap 250', 'nifty 500', 'nifty mid smallcap 400', 'nifty 500 multicap 50:25:25'], aliases: ['CASTROL', 'CASTROLIND'] },
  { symbol: 'MMTC', yahoo: 'MMTC.NS', name: 'MMTC Ltd', sector: 'Minerals Trading', segment: ['cash', 'nifty smallcap 50', 'nifty smallcap 100', 'nifty smallcap 250', 'nifty microcap 250', 'nifty 500', 'nifty mid smallcap 400', 'nifty 500 multicap 50:25:25'], aliases: ['MMTC'] },
  { symbol: 'UJJIVANSFB', yahoo: 'UJJIVANSFB.NS', name: 'Ujjivan Small Finance Bank', sector: 'Financial Inclusion', segment: ['cash', 'nifty smallcap 50', 'nifty smallcap 100', 'nifty smallcap 250', 'nifty microcap 250', 'nifty 500', 'nifty mid smallcap 400', 'nifty 500 multicap 50:25:25'], aliases: ['UJJIVAN'] },
  { symbol: 'TMPV', yahoo: 'TMPV.NS', name: 'Tata Motors Passenger Vehicles Ltd', sector: 'Automobile', segment: ['cash', 'nifty 500', 'nifty large midcap 250', 'nifty and banknifty'], aliases: ['TATA PASSENGER', 'TATA MOTORS PV', 'TATA EV', 'TMPV', 'TATAMOTORS'] },
  { symbol: 'M&M', yahoo: 'M&M.NS', name: 'Mahindra & Mahindra Ltd', sector: 'Automobile', segment: ['cash', 'nifty 50', 'nifty 100', 'nifty 200', 'nifty 500', 'futures'], aliases: ['MAHINDRA', 'M AND M', 'M&M'] },
  { symbol: 'BHARATFORG', yahoo: 'BHARATFORG.NS', name: 'Bharat Forge Ltd', sector: 'Automobile', segment: ['cash', 'nifty 200', 'nifty 500', 'futures'], aliases: ['BHARAT FORGE'] }
];

// Kite 18 Sector Universes with Exact Constituent Mapping
const KITE_SECTORS_18 = [
  {
    id: 'india-vix',
    symbol: 'INDIA VIX',
    name: 'India VIX Volatility',
    category: 'INDICES',
    basePrice: 11.00,
    change: -0.25,
    changePct: -2.22,
    stocks: ['RELIANCE', 'HDFCBANK', 'ICICIBANK', 'INFY', 'TCS', 'TATAMOTORS', 'SBIN', 'BAJFINANCE', 'BHARTIARTL', 'ADANIENT', 'TATASTEEL', 'MARUTI', 'SUNPHARMA', 'LT', 'AXISBANK', 'KOTAKBANK']
  },
  {
    id: 'nifty-50',
    symbol: 'NIFTY 50',
    name: 'Nifty 50 Benchmark',
    category: 'INDICES',
    basePrice: 23329.00,
    change: -85.30,
    changePct: -0.36,
    stocks: ['RELIANCE', 'TCS', 'HDFCBANK', 'BHARTIARTL', 'ICICIBANK', 'INFY', 'ITC', 'LT', 'HINDUNILVR', 'MARUTI', 'BAJFINANCE', 'SUNPHARMA', 'TATASTEEL', 'TATAMOTORS', 'TITAN', 'NTPC', 'POWERGRID', 'ONGC', 'COALINDIA', 'WIPRO', 'BAJAJ-AUTO', 'ADANIENT', 'ADANIPORTS', 'JSWSTEEL', 'GRASIM', 'ULTRACEMCO', 'HINDALCO', 'TECHM', 'HCLTECH', 'NESTLEIND', 'CIPLA', 'DRREDDY', 'EICHERMOT', 'DIVISLAB', 'HEROMOTOCO', 'BRITANNIA', 'BPCL', 'SHRIRAMFIN', 'BEL', 'ASIANPAINT', 'APOLLOHOSP']
  },
  {
    id: 'nifty-bank',
    symbol: 'NIFTY BANK',
    name: 'Nifty Bank',
    category: 'INDICES',
    basePrice: 56215.55,
    change: -255.10,
    changePct: -0.45,
    stocks: ['HDFCBANK', 'ICICIBANK', 'SBIN', 'KOTAKBANK', 'AXISBANK', 'INDUSINDBK', 'BANKBARODA', 'PNB', 'CANBK', 'FEDERALBNK', 'IDFCFIRSTB', 'AUBANK', 'YESBANK', 'KARURVYSYA', 'UJJIVANSFB', 'EQUITASBNK']
  },
  {
    id: 'nifty-fin-service',
    symbol: 'NIFTY FIN SERVICE',
    name: 'Nifty Financial Services',
    category: 'INDICES',
    basePrice: 25417.95,
    change: -106.75,
    changePct: -0.41,
    stocks: ['HDFCBANK', 'ICICIBANK', 'SBIN', 'BAJFINANCE', 'BAJAJFINSV', 'CHOLAFIN', 'JIOFIN', 'SHRIRAMFIN', 'SBILIFE', 'HDFCLIFE', 'IRFC', 'IREDA', 'HUDCO', 'CDSL']
  },
  {
    id: 'nifty-auto',
    symbol: 'NIFTY AUTO',
    name: 'Nifty Auto',
    category: 'INDICES',
    basePrice: 27086.30,
    change: -64.80,
    changePct: -0.23,
    stocks: ['MARUTI', 'TATAMOTORS', 'TMPV', 'BAJAJ-AUTO', 'M&M', 'EICHERMOT', 'HEROMOTOCO', 'TVSMOTOR', 'BHARATFORG', 'ASHOKLEY', 'MOTHERSON', 'APOLLOTYRE', 'MRF', 'CEATLTD', 'OLECTRA', 'CUMMINSIND', 'ESCORTS']
  },
  {
    id: 'nifty-fmcg',
    symbol: 'NIFTY FMCG',
    name: 'Nifty FMCG',
    category: 'INDICES',
    basePrice: 45657.75,
    change: -243.15,
    changePct: -0.52,
    stocks: ['HINDUNILVR', 'ITC', 'NESTLEIND', 'BRITANNIA', 'TATACONSUM', 'DABUR', 'MARICO', 'GODREJCP']
  },
  {
    id: 'nifty-it',
    symbol: 'NIFTY IT',
    name: 'Nifty IT',
    category: 'INDICES',
    basePrice: 28582.10,
    change: -248.30,
    changePct: -0.86,
    stocks: ['TCS', 'INFY', 'WIPRO', 'TECHM', 'HCLTECH', 'PERSISTENT', 'COFORGE', 'KPITTECH', 'LTTS', 'TATAELXSI', 'SONATSOFTW', 'HAPPSSTMNDS']
  },
  {
    id: 'nifty-pharma',
    symbol: 'NIFTY PHARMA',
    name: 'Nifty Pharma',
    category: 'INDICES',
    basePrice: 21430.50,
    change: 45.20,
    changePct: 0.21,
    stocks: ['SUNPHARMA', 'CIPLA', 'DRREDDY', 'DIVISLAB', 'LUPIN', 'AUROPHARMA', 'APOLLOHOSP']
  },
  {
    id: 'nifty-metal',
    symbol: 'NIFTY METAL',
    name: 'Nifty Metal',
    category: 'INDICES',
    basePrice: 9120.40,
    change: -32.10,
    changePct: -0.35,
    stocks: ['TATASTEEL', 'JSWSTEEL', 'HINDALCO', 'VEDL', 'COALINDIA', 'APLAPOLLO', 'MMTC']
  },
  {
    id: 'nifty-realty',
    symbol: 'NIFTY REALTY',
    name: 'Nifty Realty',
    category: 'INDICES',
    basePrice: 1045.20,
    change: 8.90,
    changePct: 0.86,
    stocks: ['DLF', 'OBEROIRLTY', 'NBCC']
  },
  {
    id: 'nifty-energy',
    symbol: 'NIFTY ENERGY',
    name: 'Nifty Energy',
    category: 'INDICES',
    basePrice: 39450.15,
    change: -120.40,
    changePct: -0.30,
    stocks: ['RELIANCE', 'NTPC', 'POWERGRID', 'ONGC', 'COALINDIA', 'BPCL', 'TATAPOWER', 'SUZLON', 'ADANIGREEN', 'ADANIPOWER', 'ADANIENSOL', 'NHPC', 'SJVN', 'INOXWIND', 'RPOWER']
  },
  {
    id: 'nifty-psu-bank',
    symbol: 'NIFTY PSU BANK',
    name: 'Nifty PSU Bank',
    category: 'INDICES',
    basePrice: 6890.30,
    change: -42.10,
    changePct: -0.61,
    stocks: ['SBIN', 'BANKBARODA', 'PNB', 'CANBK']
  },
  {
    id: 'nifty-media',
    symbol: 'NIFTY MEDIA',
    name: 'Nifty Media',
    category: 'INDICES',
    basePrice: 2120.60,
    change: -15.40,
    changePct: -0.72,
    stocks: ['NAUKRI', 'ROUTE', 'TANLA']
  },
  {
    id: 'nifty-infra',
    symbol: 'NIFTY INFRA',
    name: 'Nifty Infrastructure',
    category: 'INDICES',
    basePrice: 8530.25,
    change: -18.70,
    changePct: -0.22,
    stocks: ['LT', 'ADANIPORTS', 'RVNL', 'IRFC', 'IRCON', 'BHEL', 'MAZDOCK', 'COCHINSHIP', 'BDL', 'BEL', 'HAL']
  },
  {
    id: 'nifty-commodities',
    symbol: 'NIFTY COMMODITIES',
    name: 'Nifty Commodities',
    category: 'INDICES',
    basePrice: 8940.80,
    change: -28.50,
    changePct: -0.32,
    stocks: ['TATASTEEL', 'HINDALCO', 'VEDL', 'AMBUJACEM', 'ULTRACEMCO', 'GRASIM', 'TATACHEM', 'DEEPAKNTR', 'PRAJIND']
  },
  {
    id: 'nifty-consumption',
    symbol: 'NIFTY CONSUMPTION',
    name: 'Nifty Consumption',
    category: 'INDICES',
    basePrice: 10350.60,
    change: -40.10,
    changePct: -0.39,
    stocks: ['TITAN', 'TRENT', 'ASIANPAINT', 'BERGEPAINT', 'HAVELLS', 'VOLTAS', 'ZOMATO', 'SWIGGY', 'KALYANKJIL']
  },
  {
    id: 'nifty-pse',
    symbol: 'NIFTY PSE',
    name: 'Nifty Public Sector Enterprises',
    category: 'INDICES',
    basePrice: 10180.40,
    change: -55.20,
    changePct: -0.54,
    stocks: ['BEL', 'HAL', 'BHEL', 'COALINDIA', 'ONGC', 'NTPC', 'POWERGRID', 'NHPC', 'GAIL', 'RVNL', 'IRFC', 'IRCTC', 'IREDA', 'SJVN', 'MAZDOCK', 'COCHINSHIP', 'BDL']
  },
  {
    id: 'nifty-oil-gas',
    symbol: 'NIFTY OIL & GAS',
    name: 'Nifty Oil & Gas',
    category: 'INDICES',
    basePrice: 11840.10,
    change: -38.60,
    changePct: -0.33,
    stocks: ['RELIANCE', 'ONGC', 'BPCL', 'GAIL', 'CASTROL']
  }
];

// Zerodha Kite Watchlist Multi-Tabs (including user's exact BIG B watchlist)
const KITE_WATCHLIST_TABS = {
  'STOCK MAIN': {
    type: 'sectors',
    label: 'STOCK MAIN',
    count: 42,
    maxCount: 250
  },
  'BIG B': {
    type: 'stocks',
    label: 'BIG B',
    stocks: ['TCS', 'ADANIENSOL', 'HAL', 'LUPIN', 'WIPRO', 'TMPV', 'BAJAJ-AUTO', 'MRF']
  },
  'KHOJ': {
    type: 'stocks',
    label: 'KHOJ',
    stocks: ['ZOMATO', 'SUZLON', 'DIXON', 'POLYCAB', 'RVNL', 'MAZDOCK', 'COCHINSHIP', 'IREDA']
  },
  'SRISHTY': {
    type: 'stocks',
    label: 'SRISHTY',
    stocks: ['HDFCBANK', 'RELIANCE', 'TITAN', 'TRENT', 'TATAMOTORS', 'BEL', 'BHARTIARTL', 'CDSL']
  },
  'TEJAS': {
    type: 'stocks',
    label: 'TEJAS',
    stocks: ['TATAMOTORS', 'TMPV', 'RELIANCE', 'SUZLON', 'BEL', 'HAL', 'ZOMATO', 'TITAN']
  }
};

const fs = require('fs');
const path = require('path');

function resolveAssetPath(filename) {
  const candidates = [
    path.join(__dirname, filename),
    path.join(process.cwd(), filename),
    path.join(__dirname, '..', filename),
    path.join(__dirname, '..', '..', filename),
    path.join('/var/task', filename)
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return path.join(__dirname, filename);
}

try {
  const existingSymbols = new Set(NSE_MASTER_DIRECTORY.map(s => s.symbol.toUpperCase()));
  const masterDataPath = resolveAssetPath('nse-master.json');
  if (fs.existsSync(masterDataPath)) {
    const raw = fs.readFileSync(masterDataPath, 'utf8').replace(/^\uFEFF/, '');
    const masterData = JSON.parse(raw);
    for (const item of masterData) {
      const sym = (item.symbol || '').toUpperCase().trim();
      if (sym && !existingSymbols.has(sym)) {
        existingSymbols.add(sym);
        NSE_MASTER_DIRECTORY.push({
          symbol: sym,
          name: item.name || sym,
          sector: item.sector || 'NSE Equities',
          segment: ['cash', 'NSE'],
          yahoo: sym + '.NS'
        });
      }
    }
  }

  // Also supplement from EQUITY_L.csv for complete 2,500+ NSE market coverage
  const equityCsvPath = resolveAssetPath('EQUITY_L.csv');
  if (fs.existsSync(equityCsvPath)) {
    const lines = fs.readFileSync(equityCsvPath, 'utf8').split('\n');
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const parts = line.split(',');
      if (parts.length >= 2) {
        const sym = parts[0].trim().toUpperCase();
        const companyName = parts[1].trim();
        if (sym && !existingSymbols.has(sym)) {
          existingSymbols.add(sym);
          NSE_MASTER_DIRECTORY.push({
            symbol: sym,
            name: companyName || sym,
            sector: 'NSE Equities',
            segment: ['cash', 'NSE'],
            yahoo: sym + '.NS'
          });
        }
      }
    }
  }
  console.log(`[TejStockAI] Master NSE Directory loaded with ${NSE_MASTER_DIRECTORY.length} equities and indices.`);
} catch (e) {
  console.error('Error loading master NSE directory:', e);
}

module.exports = {
  CHARTINK_SEGMENTS,
  NSE_MASTER_DIRECTORY,
  KITE_SECTORS_18,
  KITE_WATCHLIST_TABS
};
