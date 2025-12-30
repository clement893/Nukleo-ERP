/**
 * Script pour créer le pipeline MAIN via l'API backend
 * Utilise l'API si le serveur est disponible, sinon affiche les instructions
 */

const https = require('https');
const http = require('http');

const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:8000';

const pipelineData = {
  name: 'MAIN',
  description: 'Pipeline principal pour la gestion des opportunités commerciales',
  is_default: true,
  is_active: true,
  stages: [
    { name: '00 - Idées de projet', order: 0, color: '#94A3B8' },
    { name: '00 - Idées de contact', order: 1, color: '#94A3B8' },
    { name: '01 - Suivi /Emails', order: 2, color: '#3B82F6' },
    { name: '02 - Leads', order: 3, color: '#3B82F6' },
    { name: '03 - Rencontre booké', order: 4, color: '#8B5CF6' },
    { name: '04 - En discussion', order: 5, color: '#8B5CF6' },
    { name: '05 - Proposal to do', order: 6, color: '#F59E0B' },
    { name: '06 - Proposal sent', order: 7, color: '#F59E0B' },
    { name: '07 - Contract to do', order: 8, color: '#EF4444' },
    { name: '08 - Contract sent', order: 9, color: '#EF4444' },
    { name: '09 - Closed Won', order: 10, color: '#10B981' },
    { name: 'Closed Lost', order: 11, color: '#6B7280' },
    { name: 'En attente ou Silence radio', order: 12, color: '#FBBF24' },
    { name: 'Renouvellement à venir', order: 13, color: '#10B981' },
    { name: 'Renouvellements potentiels', order: 14, color: '#10B981' },
  ],
};

function makeRequest(url, options, data) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;
    
    const req = client.request(url, options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try {
          const parsed = body ? JSON.parse(body) : {};
          resolve({ status: res.statusCode, headers: res.headers, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, data: body });
        }
      });
    });
    
    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function createPipelineViaAPI() {
  console.log(`🔌 Tentative de connexion à l'API: ${API_URL}`);
  
  try {
    // Vérifier si l'API est disponible
    const healthCheck = await makeRequest(`${API_URL}/api/v1/health`, { method: 'GET' });
    
    if (healthCheck.status !== 200) {
      throw new Error(`API non disponible (status: ${healthCheck.status})`);
    }
    
    console.log('✅ API disponible');
    console.log('⚠️  Note: La création via API nécessite une authentification.');
    console.log('💡 Pour créer le pipeline, utilisez plutôt le script SQL:');
    console.log('   node scripts/seed_main_pipeline.js');
    console.log('');
    console.log('   Ou exécutez le script SQL directement dans PostgreSQL:');
    console.log('   psql -U postgres -d modele_db -f scripts/seed_main_pipeline.sql');
    
  } catch (error) {
    console.error('❌ API non disponible:', error.message);
    console.log('');
    console.log('💡 Pour créer le pipeline MAIN:');
    console.log('   1. Assurez-vous que PostgreSQL est en cours d\'exécution');
    console.log('   2. Exécutez: node scripts/seed_main_pipeline.js');
    console.log('   Ou directement avec psql:');
    console.log('   psql -U postgres -d modele_db -f scripts/seed_main_pipeline.sql');
  }
}

createPipelineViaAPI();
