interface DigestString {
  digest: string;
  string: string;
}

interface WorkerMessage {
  numWorker: number;
  data: DigestString;
}

interface MineOptions {
  algorithm: string;
  seconds: number;
  signature?: string;
  startNumber?: number;
  incrementNumber?: number;
}

export { DigestString, WorkerMessage, MineOptions };
