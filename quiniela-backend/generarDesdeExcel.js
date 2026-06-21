const xlsx = require('xlsx');
const fs = require('fs');

// 1. Cargar el archivo Excel maestro (cambia el nombre si es necesario)
const workbook = xlsx.readFile('./pronosticos_completos.xlsx');

let pronosticosGlobales = [];

// 2. Diccionario para cruzar el nombre del partido con el ID numérico de tu base de datos
const mapaPartidos = {
    "MEXICO VS SUDAFRICA":1,
    "COREA DEL SUR VS REPUBLICA CHECA":2,
    "CANADA VS BOSNIA Y HERZEGOVINA":3,
    "ESTADOS UNIDOS VS PARAGUAY":4,
    "CATAR VS SUIZA":5,
    "BRASIL VS MARRUECOS":6,
    "HAITI VS ESCOCIA":7,
    "ASTRALIA VS TURQUIA":8,
    "ALEMANIA VS CURAZAO":9,
    "PAISES BAJOS VS JAPON":10,
    "COSTA DE MARFIL VS ECUADOR":11,
    "SUECIA VS TUNEZ":12,
    "ESPAÑA VS CABO VERDE":13,
    "BELGICA VS EGIPTO":14,
    "ARABIA SAUDITA VS URUGUAY":15,
    "IRAN VS NUEVA ZELANDA":16,
    "FRANCIA VS SENEGAL":17,
    "IRAK VS NORUEGA":18,
    "ARGENTINA VS ARGELIA":19,
    "AUSTRIA VS JORDANIA":20,
    "PORTUGAL VS RD CONGO":21,
    "INGLATERRA VS CROACIA":22,
    "GHANA VS PANAMA":23,
    "UZBEKISTAN VS COLOMBIA":24,
    "REPUBLICA CHECA VS SUDAFRICA":25,
    "SUIZA VS BOSNIA Y HERZEGOVINA":26,
    "CANADA VS CATAR":27,
    "MEXICO VS COREA DEL SUR":28,
    "ESTADOS UNIDOS VS AUSTRALIA":29,
    "ESCOCIA VS MARRUECOS":30,
    "BRASIL VS HAITI":31,
    "TURQUIA VS PARAGUAY":32,
    "PAISES BAJOS VS SUECIA":33,
    "ALEMANIA VS COSTA DE MARFIL":34,
    "ECUADOR VS CURAZAO":35,
    "TUNEZ VS JAPON":36,
    "ESPANA VS ARABIA SAUDITA":37,
    "BELGICA VS IRAN":38,
    "URUGUAY VS CABO VERDE":39,
    "NUEVA ZELANDA VS EGIPTO":40,
    "ARGENTINA VS AUSTRIA":41,
    "FRANCIA VS IRAK":42,
    "NORUEGA VS SENEGAL":43,
    "JORDANIA VS ARGELIA":44,
    "PORTUGAL VS UZBEKISTAN":45,
    "INGLATERRA VS GHANA":46,
    "PANAMA VS CROACIA":47,
    "COLOMBIA VS RD CONGO":48,
    "SUIZA VS CANADA":49,
    "BOSNIA Y HERZEGOBINA VS CATAR":50,
    "MARRUECOS VS HAITI":51,
    "ESCOCIA VS BRASIL":52,
    "SUDAFRICA VS COREA DEL SUR":53,
    "REPUBLICA CHECA VS MEXICO":54,
    "CURAZAO VS COSTA DE MARFIL":55,
    "ECUADOR VS ALEMANIA":56,
    "TUNEZ VS PAISES BAJOS":57,
    "JAPON VS SUECIA":58,
    "TURQUIA VS ESTADOS UNIDOS":59,
    "PARAGUAY VS AUSTRALIA":60,
    "NORUEGA VS FRANCIA":61,
    "SENEGAL VS IRAK":62,
    "CABO VERDE VS ARABIA SAUDITA":63,
    "URUGUAY VS ESPAÑA":64
  // ... (Debes agregar el resto de la lista aquí)
};

console.log(`Leyendo el archivo Excel con ${workbook.SheetNames.length} participantes...`);

// 3. Recorrer cada pestaña (hoja) del Excel
workbook.SheetNames.forEach(nombreHoja => {
  
  // Convertir el nombre de la hoja en el ID de usuario (ej. "CARLOS CARRION" -> "carlos_carrion")
  let idUsuario = nombreHoja.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '_');

  // Extraer los datos de esta hoja específica y convertirlos a formato manejable
  const datosHoja = xlsx.utils.sheet_to_json(workbook.Sheets[nombreHoja]);

  // 4. Recorrer cada fila (partido) de ese participante
  datosHoja.forEach(fila => {
    // Tomamos los valores usando los nombres exactos de tus columnas
    const nombrePartido = fila['Partido'];
    const golesLocal = parseInt(fila['Mi Predicción Local']);
    const golesVisita = parseInt(fila['Mi Predicción Visita']);

    // Validar que la fila realmente tenga un pronóstico numérico
    if (nombrePartido && !isNaN(golesLocal) && !isNaN(golesVisita)) {
      
      const partidoId = mapaPartidos[nombrePartido] || nombrePartido;

      pronosticosGlobales.push({
        usuario_id: idUsuario,
        partido_id: partidoId,
        goles_local_prono: golesLocal,
        goles_visitante_prono: golesVisita,
        puntos_ganados: 0, // Inicia en 0 para todos
        procesado: false   // Aún no se ha jugado
      });
    }
  });
});

// 5. Guardar el súper JSON final
fs.writeFileSync('./pronosticos.json', JSON.stringify(pronosticosGlobales, null, 2));

console.log(`¡Magia hecha! Se generó pronosticos.json con ${pronosticosGlobales.length} registros listos para subir a Firestore.`);