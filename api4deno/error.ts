export class EmptyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EmptyError";
  }
}
