const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');

// 1. Reutilizamos la misma llave maestra que ya tenemos en la carpeta
const serviceAccount = require('./serviceAccountKey.json');

// 2. Inicializar la conexión (solo si no se ha inicializado antes)
initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function importarUsuarios() {
  try {
    // 3. Leer el archivo JSON de los participantes
    const data = fs.readFileSync('./usuarios.json', 'utf8');
    const usuarios = JSON.parse(data);
    
    const batch = db.batch();
    
    console.log(`Preparando la carga de ${usuarios.length} participantes...`);
    
    usuarios.forEach((usuario) => {
      // Convertimos el nombre a minúsculas y cambiamos espacios por guiones bajos para el ID
      // Ejemplo: "Carlos Perez" -> "carlos_perez"
      const idUsuario = usuario.nombre.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '_');
      
      const usuarioRef = db.collection('usuarios').doc(idUsuario);
      
      // Guardamos el objeto en Firestore
      batch.set(usuarioRef, {
        nombre: usuario.nombre,
        puntos_totales: usuario.puntos_totales
      });
    });
    
    // 4. Enviar el lote a Firestore
    await batch.commit();
    console.log('¡Éxito! Todos los participantes fueron inyectados correctamente en Firestore.');
    process.exit(0);
    
  } catch (error) {
    console.error('Error crítico durante la importación de usuarios:', error);
    process.exit(1);
  }
}

importarUsuarios();