export const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api";

export interface Market {
  publicKey: string;
  marketId: number;
  creator: string;
  title: string;
  description: string;
  feedId: string;
  targetPrice: number;
  targetAbove: boolean;
  deadline: number;
  resolutionDeadline: number;
  minBet: number;
  maxBet: number;
  totalYes: number;
  totalNo: number;
  totalYesSol: number;
  totalNoSol: number;
  yesCount: number;
  noCount: number;
  status: string;
  outcome: boolean | null;
  resolvedPrice: number | null;
  resolvedAt: number | null;
  createdAt: number;
  yesOdds?: string;
  noOdds?: string;
  vaultBalance?: number;
  vaultBalanceSol?: number;
}

export interface Bet {
  publicKey: string;
  bettor: string;
  market: string;
  amount: number;
  amountSol: number;
  position: string;
  claimed: boolean;
  placedAt: number;
}

export interface AgentReputation {
  agent: string;
  totalBets: number;
  wins: number;
  losses: number;
  accuracy: number;
  totalWageredSol: number;
  totalWonSol: number;
  totalLostSol: number;
  marketsCreated: number;
  lastActive: number;
}

export interface Protocol {
  admin: string;
  marketCount: number;
  totalVolume: number;
  totalVolumeSol: number;
  programId: string;
}

async function fetchApi<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }
  return res.json();
}

export async function getProtocol(): Promise<Protocol> {
  return fetchApi<Protocol>("/protocol");
}

export async function getMarkets(): Promise<{ markets: Market[]; count: number }> {
  return fetchApi("/markets");
}

export async function getMarket(id: number): Promise<Market> {
  return fetchApi<Market>(`/markets/${id}`);
}

export async function getMarketBets(marketId: number): Promise<{ bets: Bet[]; count: number }> {
  return fetchApi(`/bets/market/${marketId}`);
}

export async function getAgentBets(pubkey: string): Promise<{ bets: Bet[]; count: number }> {
  return fetchApi(`/bets/agent/${pubkey}`);
}

export async function getReputation(pubkey: string): Promise<AgentReputation> {
  return fetchApi<AgentReputation>(`/reputation/${pubkey}`);
}

export async function getLeaderboard(): Promise<{ leaderboard: AgentReputation[]; count: number }> {
  return fetchApi("/reputation");
}

export interface ActivityItem {
  id: string;
  type: "bet" | "market_created";
  timestamp: number;
  agent: string;
  details: {
    marketId?: number;
    marketPublicKey?: string;
    marketTitle?: string;
    amount?: number;
    amountSol?: number;
    position?: string;
  };
}

export async function getActivity(): Promise<{ activities: ActivityItem[]; count: number }> {
  return fetchApi("/activity");
}
