export interface ApiEnvelope<T> {
  status: number;
  message: string;
  data: T;
}