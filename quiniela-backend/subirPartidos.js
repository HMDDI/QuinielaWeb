const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');

// 1. Cargar las credenciales usando el require normal
const serviceAccount = require('./serviceAccountKey.json');

// 2. Inicializar la conexión usando la nueva sintaxis modular
initializeApp({
  credential: cert(serviceAccount)
});

// 3. Conectar a Firestore
const db = getFirestore();

async function importarPartidos() {
  try {
    // 4. Leer el archivo JSON con los encuentros
    const data = fs.readFileSync('./partidos.json', 'utf8');
    const partidos = JSON.parse(data);
    
    // 5. Crear un lote (Batch)
    const batch = db.batch();
    
    console.log(`Preparando la carga de ${partidos.length} partidos...`);
    
    partidos.forEach((partido) => {
      const partidoRef = db.collection('partidos').doc(`partido_${partido.id_api}`);
      batch.set(partidoRef, partido);
    });
    
    // 6. Comprometer y enviar
    await batch.commit();
    console.log('¡Éxito! Todos los partidos fueron inyectados correctamente en Firestore.');
    process.exit(0);
    
  } catch (error) {
    console.error('Error crítico durante la importación de datos:', error);
    process.exit(1);
  }
}

importarPartidos();