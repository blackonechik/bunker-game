type DatabaseConnectionOptions = {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
};

const DEFAULT_MYSQL_PORT = 3306;

export function getDatabaseConnectionOptions(): DatabaseConnectionOptions {
  const databaseUrl = process.env.DATABASE_URL?.trim();

  if (databaseUrl) {
    const url = new URL(databaseUrl);

    if (url.protocol !== 'mysql:') {
      throw new Error(`Unsupported DATABASE_URL protocol: ${url.protocol}`);
    }

    return {
      host: url.hostname,
      port: url.port ? Number(url.port) : DEFAULT_MYSQL_PORT,
      user: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
      database: decodeURIComponent(url.pathname.replace(/^\//, '')),
    };
  }

  return {
    host: process.env.DB_HOST ?? 'localhost',
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : DEFAULT_MYSQL_PORT,
    user: process.env.DB_USERNAME ?? '',
    password: process.env.DB_PASSWORD ?? '',
    database: process.env.DB_DATABASE ?? '',
  };
}
