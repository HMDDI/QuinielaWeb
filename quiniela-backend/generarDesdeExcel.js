const xlsx = require('xlsx');
const fs = require('fs');

// 1. Cargar el archivo Excel maestro
const workbook = xlsx.readFile('./pronosticos_completos.xlsx');

let pronosticosGlobales = [];

console.log(`Leyendo el archivo Excel con ${workbook.SheetNames.length} participantes...`);

// 2. Recorrer cada pestaña (hoja) del Excel
workbook.SheetNames.forEach(nombreHoja => {
  
  // Convertir el nombre de la hoja en el ID de usuario
  let idUsuario = nombreHoja.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '_');

  // Extraer los datos de esta hoja
  const datosHoja = xlsx.utils.sheet_to_json(workbook.Sheets[nombreHoja]);

  // 3. Recorrer cada fila (partido) de ese participante
  // Usamos un contador que se reinicia para cada usuario (cada hoja del Excel)
  let contadorPartidos = 1;

  datosHoja.forEach(fila => {
    // Tomamos los valores usando los nombres exactos de tus columnas
    const nombrePartido = fila['Partido'];
    const golesLocal = parseInt(fila['Mi Predicción Local']);
    const golesVisita = parseInt(fila['Mi Predicción Visita']);

    // Validar que la fila realmente tenga un pronóstico numérico
    if (nombrePartido && !isNaN(golesLocal) && !isNaN(golesVisita)) {
      
      // Ya no usamos el mapaPartidos, ahora usamos el contador ascendente
      const partidoId = contadorPartidos; 

      pronosticosGlobales.push({
        usuario_id: idUsuario,
        partido_id: partidoId, // ID asignado automáticamente (1, 2, 3...)
        goles_local_prono: golesLocal,
        goles_visitante_prono: golesVisita,
        puntos_ganados: 0,
        procesado: false
      });

      // Incrementamos el contador para el siguiente partido de este usuario
      contadorPartidos++;
    }
  });
});

// 4. Guardar el JSON final
fs.writeFileSync('./pronosticos.json', JSON.stringify(pronosticosGlobales, null, 2));

console.log(`¡Magia hecha! Se generó pronosticos.json con ${pronosticosGlobales.length} registros numerados automáticamente.`);