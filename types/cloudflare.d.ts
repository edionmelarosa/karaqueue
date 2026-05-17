/// <reference types="@cloudflare/workers-types" />

declare global {
  interface CloudflareEnv {
    QUEUE_KV: KVNamespace;
  }
}

export {};
