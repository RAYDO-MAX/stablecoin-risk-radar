import type {Asset} from './types';
const rows = [
 ['usdt','USDT','Tether USD','Tether','fiat','https://tether.to/en/','https://tether.to/en/transparency/','#26a17b'],
 ['usdc','USDC','USD Coin','Circle','fiat','https://www.circle.com/usdc','https://www.circle.com/transparency','#2775ca'],
 ['usds','USDS','Sky Dollar','Sky','crypto','https://sky.money','https://docs.sky.money/','#7b5dea'],
 ['dai','DAI','Dai','Sky / Maker','crypto','https://makerdao.com','https://docs.makerdao.com/','#d7a13b'],
 ['usde','USDe','Ethena USDe','Ethena','synthetic','https://ethena.fi','https://docs.ethena.fi/','#29323d'],
 ['pyusd','PYUSD','PayPal USD','Paxos','fiat','https://www.paypal.com/pyusd','https://www.paxos.com/pyusd-transparency','#173e89'],
 ['rlusd','RLUSD','Ripple USD','Ripple','fiat','https://ripple.com/solutions/stablecoin/','https://ripple.com/solutions/stablecoin/','#2a313b'],
 ['usd1','USD1','World Liberty Financial USD','World Liberty Financial','fiat','https://worldlibertyfinancial.com','https://worldlibertyfinancial.com/','#aa8c43'],
 ['usdg','USDG','Global Dollar','Paxos','fiat','https://globaldollar.com','https://www.paxos.com/','#2a947b'],
 ['usdd','USDD','USDD','USDD','crypto','https://usdd.io','https://usdd.io/','#d44d52'],
] as const;
export const CATALOG:Asset[] = rows.map(([id,symbol,name,issuer,mechanism,website,source,color])=>({id,symbol,name,issuer,mechanism,website,source_urls:[...new Set([source,website])],color,description:{ru:'Оценка будет опубликована после исследования документов и проверки доказательств.',en:'An assessment will be published after document research and evidence review.'},versions:[],market_cap:null,price:null,market_checked_at:null,assessment:null}));
