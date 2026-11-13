import fs from 'fs';
import path from 'path';
import pg from 'pg';

const { Client } = pg;

export async function runSupabaseMigration(customConnOrPassword?: string): Promise<{
  success: boolean;
  message: string;
  tablesStatus?: Record<string, boolean>;
}> {
  const defaultHost = 'db.nbfnspscgwktzfzagzxt.supabase.co';
  const defaultPort = 5432;
  const defaultDatabase = 'postgres';
  const defaultUser = 'postgres';

  let connectionString = process.env.DATABASE_URL;
  let password = process.env.SUPABASE_DB_PASSWORD || process.env.POSTGRES_PASSWORD;

  const arg = customConnOrPassword?.trim();
  if (arg) {
    if (arg.startsWith('postgres://') || arg.startsWith('postgresql://')) {
      connectionString = arg;
    } else {
      password = arg;
    }
  }

  const clientConfig: pg.ClientConfig = connectionString
    ? {
        connectionString,
        ssl: { rejectUnauthorized: false },
      }
    : {
        host: defaultHost,
        port: defaultPort,
        database: defaultDatabase,
        user: defaultUser,
        password: password || '',
        ssl: { rejectUnauthorized: false },
      };

  if (!connectionString && !password) {
    return {
      success: false,
      message:
        'Password database belum diberikan. Berikan password database Supabase atau Connection String (postgres://...) untuk menjalankan skrip migrasi.',
    };
  }

  const client = new Client(clientConfig);

  try {
    console.log('Menghubungkan ke database Supabase PostgreSQL...');
    await client.connect();
    console.log('Berhasil terhubung ke Supabase PostgreSQL!');

    // Baca skema SQL
    const sqlPath = path.resolve(process.cwd(), 'schema.sql');
    if (!fs.existsSync(sqlPath)) {
      throw new Error(`File ${sqlPath} tidak ditemukan.`);
    }

    const sql = fs.readFileSync(sqlPath, 'utf8');
    console.log('Menjalankan skrip pendaftaran tabel & relasi...');

    await client.query(sql);
    console.log('Skrip pendaftaran tabel & RLS berhasil dieksekusi!');

    // Verifikasi tabel
    const requiredTables = ['user_profiles', 'journals', 'agendas', 'wallets', 'targets', 'habits'];
    const tablesStatus: Record<string, boolean> = {};

    for (const table of requiredTables) {
      const checkRes = await client.query(
        `SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        );`,
        [table]
      );
      const exists = checkRes.rows[0]?.exists === true;
      tablesStatus[table] = exists;
      console.log(`Tabel [${table}]: ${exists ? 'AKTIF & TERDAFTAR' : 'TIDAK TERDETEKSI'}`);
    }

    await client.end();

    const allCreated = Object.values(tablesStatus).every(Boolean);
    if (allCreated) {
      return {
        success: true,
        message: 'Seluruh 6 tabel database Supabase berhasil didaftarkan dan siap menyimpan data!',
        tablesStatus,
      };
    } else {
      return {
        success: false,
        message: 'Beberapa tabel belum terdaftar sempurna. Periksa log detail.',
        tablesStatus,
      };
    }
  } catch (err: any) {
    try {
      await client.end();
    } catch {}
    console.error('Gagal menjalankan migrasi:', err.message);
    return {
      success: false,
      message: `Gagal menjalankan migrasi: ${err.message}`,
    };
  }
}

// Support CLI execution: npx tsx scripts/migrate.ts [passwordOrConnectionString]
if (process.argv[1]?.endsWith('migrate.ts') || process.argv[1]?.endsWith('migrate.js')) {
  const param = process.argv[2];
  runSupabaseMigration(param)
    .then((res) => {
      console.log('Hasil Migrasi:', res);
      if (!res.success) {
        process.exit(1);
      }
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
