export interface TokenIssuer {
  issue(userId: string): Promise<string>;
}
