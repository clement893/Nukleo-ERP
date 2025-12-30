/**
 * Script Node.js pour créer le pipeline MAIN avec toutes les étapes
 * Utilise pg pour se connecter directement à PostgreSQL
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Charger les variables d'environnement depuis .env si disponible
try {
  const envFile = path.join(__dirname, '..', '.env');
  if (fs.existsSync(envFile)) {
    const envContent = fs.readFileSync(envFile, 'utf8');
    envContent.split('\n').forEach(line => {
      const match = line.match(/^([^#=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim().replace(/^["']|["']$/g, '');
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    });
  }
} catch (error) {
  // Ignorer les erreurs de lecture du fichier .env
}

// Lire le fichier SQL
const sqlFile = path.join(__dirname, 'seed_main_pipeline.sql');
const sql = fs.readFileSync(sqlFile, 'utf8');

// Configuration de la base de données depuis les variables d'environnement
// Format: postgresql+asyncpg://user:password@host:port/database
const databaseUrl = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/modele_db';

// Parser l'URL de la base de données
function parseDatabaseUrl(url) {
  // Enlever le préfixe postgresql+asyncpg:// ou postgresql://
  const cleanUrl = url.replace(/^postgresql\+?[^:]*:\/\//, '');
  
  // Parser user:password@host:port/database
  const match = cleanUrl.match(/^([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)$/);
  
  if (!match) {
    // Essayer sans port
    const match2 = cleanUrl.match(/^([^:]+):([^@]+)@([^/]+)\/(.+)$/);
    if (match2) {
      return {
        user: match2[1],
        password: match2[2],
        host: match2[3],
        port: 5432,
        database: match2[4],
      };
    }
    throw new Error(`Format d'URL de base de données invalide: ${url}`);
  }
  
  return {
    user: match[1],
    password: match[2],
    host: match[3],
    port: parseInt(match[4], 10),
    database: match[5],
  };
}

async function seedMainPipeline() {
  const config = parseDatabaseUrl(databaseUrl);
  
  console.log(`🔌 Connexion à la base de données: ${config.host}:${config.port}/${config.database}`);
  
  const client = new Client({
    user: config.user,
    password: config.password,
    host: config.host,
    port: config.port,
    database: config.database,
  });

  try {
    await client.connect();
    console.log('✅ Connecté à la base de données');
    
    // Exécuter le script SQL
    console.log('📝 Exécution du script SQL...');
    await client.query(sql);
    
    console.log('✅ Pipeline MAIN créé avec succès!');
    console.log('📋 15 étapes créées');
    
  } catch (error) {
    if (error.message && error.message.includes('existe déjà')) {
      console.log('ℹ️  Pipeline MAIN existe déjà');
    } else {
      console.error('❌ Erreur:', error.message || error);
      console.error('Détails:', error);
      if (error.code === 'ECONNREFUSED') {
        console.error('💡 Vérifiez que PostgreSQL est en cours d\'exécution');
      } else if (error.code === '3D000') {
        console.error('💡 La base de données n\'existe pas. Créez-la d\'abord.');
      } else if (error.code === '28P01') {
        console.error('💡 Identifiants incorrects. Vérifiez votre DATABASE_URL.');
      }
      process.exit(1);
    }
  } finally {
    await client.end();
  }
}

// Exécuter le script
seedMainPipeline().catch((error) => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});
