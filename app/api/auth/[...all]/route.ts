import { auth } from '@/auth';
import { toNextJsHandler } from 'better-auth/next-js';

const handlers = toNextJsHandler(auth);

const serializeError = (error: unknown): unknown => {
  if (!(error instanceof Error)) {
    return error;
  }

  const base = {
    name: error.name,
    message: error.message,
    stack: error.stack,
    cause: serializeError(error.cause),
  };

  if (error instanceof AggregateError) {
    return {
      ...base,
      errors: error.errors.map((item) => serializeError(item)),
    };
  }

  const networkError = error as Error & {
    code?: string;
    errno?: number;
    syscall?: string;
    address?: string;
    port?: number;
    hostname?: string;
  };

  return {
    ...base,
    code: networkError.code,
    errno: networkError.errno,
    syscall: networkError.syscall,
    address: networkError.address,
    port: networkError.port,
    hostname: networkError.hostname,
  };
};

async function withDiagnostics(
  handler: (request: Request) => Promise<Response>,
  request: Request
) {
  try {
    return await handler(request);
  } catch (error) {
    console.error('[auth-route] handler failed', {
      method: request.method,
      url: request.url,
      error: serializeError(error),
    });
    throw error;
  }
}

export async function GET(request: Request) {
  return withDiagnostics(handlers.GET, request);
}

export async function POST(request: Request) {
  return withDiagnostics(handlers.POST, request);
}
