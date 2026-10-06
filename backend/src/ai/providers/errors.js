/** kind: timeout | network | rate_limited | unavailable | bad_request | empty */
export class ProviderError extends Error {
  constructor(kind, message) {
    super(message);
    this.kind = kind;
  }
}
