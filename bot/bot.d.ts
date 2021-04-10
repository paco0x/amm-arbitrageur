interface Token {
  readonly symbol: string;
  readonly address: string;
}

interface Tokens {
  readonly [key: string]: Token;
}

interface TokenPair {
  symbols: string;
  pairs: string[];
}

interface ArbitragePair {
  symbols: string;
  pairs: [string, string];
}

interface AmmFactories {
  readonly [propName: string]: string;
}
