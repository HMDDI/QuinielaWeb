const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');

const serviceAccount = require('./serviceAccountKey.json');

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function subirPronosticos() {
  try {
    const data = JSON.parse(fs.readFileSync('./pronosticos.json', 'utf8'));
    
    // Firestore batch limita a 500 operaciones
    const chunks = [];
    for (let i = 0; i < data.length; i += 500) {
      chunks.push(data.slice(i, i + 500));
    }

    for (const chunk of chunks) {
      const batch = db.batch();
      
      chunk.forEach((p) => {
        // IMPORTANTE: Aseguramos que el usuario_id coincida con la normalización de tu script de usuarios
        // Si ya viene normalizado en el JSON, perfecto. Si no, lo normalizamos aquí:
        const idUsuario = p.usuario_id.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '_');
        
        // Estructura: /usuarios/{idUsuario}/pronosticos/{partido_id}
        // Así vinculas cada pronóstico directamente a su dueño
        const pronosticoRef = db.collection('usuarios')
                               .doc(idUsuario)
                               .collection('pronosticos')
                               .doc(String(p.partido_id));
        
        batch.set(pronosticoRef, {
          goles_local: p.goles_local_prono,
          goles_visita: p.goles_visitante_prono,
          partido_id: p.partido_id,
          procesado: false,
          puntos_ganados: 0
        });
      });

      await batch.commit();
      console.log(`Lote de ${chunk.length} pronósticos procesado.`);
    }

    console.log('¡Éxito! Todos los pronósticos vinculados a sus usuarios.');
    process.exit(0);
  } catch (error) {
    console.error('Error al subir los pronósticos:', error);
    process.exit(1);
  }
}

subirPronosticos();