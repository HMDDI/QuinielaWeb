import React, { useState, useEffect } from 'react';
import { Trophy, Activity, RefreshCw, Search, ChevronLeft } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, collection, getDocs 
} from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';

// Configuración de Firebase (Se asume inyectada en el entorno, o pega la tuya aquí)
const firebaseConfig = {
  apiKey: "AIzaSyBfl4KjCjacixbErImt8PkI72GpI2J_1EU",
  authDomain: "quiniela-worldcup-43262.firebaseapp.com",
  projectId: "quiniela-worldcup-43262",
  storageBucket: "quiniela-worldcup-43262.appspot.com",
  messagingSenderId: "25784077559",
  appId: "1:25784077559:web:b9eb933e906725929517f2"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export default function App() {
  const [usuarios, setUsuarios] = useState([]);
  const [partidos, setPartidos] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [pronosticosUsuario, setPronosticosUsuario] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // 2. Función de carga a demanda (Ahorra lecturas de Firebase)
  const cargarDatosDeQuiniela = async () => {
    try {
      // Consulta única para partidos
      const snapP = await getDocs(collection(db, 'partidos'));
      const partidosData = snapP.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPartidos(partidosData);

      // Consulta única para usuarios
      const snapU = await getDocs(collection(db, 'usuarios'));
      const usersData = snapU.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsuarios(usersData);
    } catch (error) {
      console.error("Error al traer los datos de Firebase:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // 3. Efecto inicial (Solo se ejecuta UNA vez al entrar a la página)
  useEffect(() => {
    const initAuthAndData = async () => {
      await signInAnonymously(auth);
      await cargarDatosDeQuiniela();
    };
    initAuthAndData();
  }, []);

  // Función para el botón de refrescar manual
  const handleRefresh = () => {
    setRefreshing(true);
    cargarDatosDeQuiniela();
  };

  // 4. Detalle del usuario y orden de fechas
  const handleVerDetalle = async (usuario) => {
    setSelectedUser(usuario);
    const pronosRef = collection(db, 'usuarios', usuario.id, 'pronosticos');
    const querySnapshot = await getDocs(pronosRef);

    const listaPronos = querySnapshot.docs.map(docSnapshot => {
      const prono = docSnapshot.data();
      const partidoReal = partidos.find(p => String(p.id_api) === String(prono.partido_id));

      return {
        ...prono,
        partido: partidoReal ? `${partidoReal.equipo_local} VS ${partidoReal.equipo_visitante}` : "Partido Desconocido",
        fecha: partidoReal?.fecha || "9999-12-31", // Para ordenar
        local_real: partidoReal?.goles_local,
        visita_real: partidoReal?.goles_visitante,
        finalizado: partidoReal?.estado === "finalizado"
      };
    });

    // Ordenar de forma ascendente: del primero (antiguo) al más reciente
    listaPronos.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
    
    setPronosticosUsuario(listaPronos);
  };

  // 5. Filtrar usuarios por buscador
  const filteredUsers = usuarios.filter(u => 
    u.nombre && u.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-10">
      
      {/* HEADER CON BOTÓN DE ACTUALIZAR */}
      <header className="bg-emerald-600 text-white p-4 shadow-md sticky top-0 z-10">
        <div className="max-w-3xl mx-auto flex justify-between items-center">
          <h1 className="font-bold text-xl flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-300" /> Quiniela
          </h1>
          
          <div className="flex gap-2">
            {!selectedUser && (
              <button 
                onClick={handleRefresh} 
                disabled={refreshing}
                className="flex items-center gap-2 text-sm bg-emerald-700 hover:bg-emerald-800 px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Actualizar</span>
              </button>
            )}
            
            {selectedUser && (
              <button 
                onClick={() => setSelectedUser(null)} 
                className="flex items-center gap-1 text-sm bg-emerald-700 hover:bg-emerald-800 px-3 py-2 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-4 h-4" /> Volver
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-emerald-600">
            <Activity className="w-10 h-10 animate-spin mb-4" />
            <p className="text-sm font-medium animate-pulse">Cargando datos...</p>
          </div>
        ) : !selectedUser ? (
          <div className="animate-in fade-in duration-500">
            {/* BUSCADOR */}
            <div className="relative mb-6 shadow-sm rounded-xl overflow-hidden flex items-center bg-white">
              <Search className="w-5 h-5 text-slate-400 absolute left-4" />
              <input 
                type="text" 
                placeholder="Busca tu nombre..." 
                className="w-full pl-12 pr-4 py-4 border-none bg-transparent outline-none focus:ring-2 focus:ring-emerald-500 transition-all" 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
              />
            </div>
            
            {/* LISTA CON PODIO (Top 3) */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <ul className="divide-y divide-slate-50">
                {[...filteredUsers]
                  .sort((a, b) => (b.puntos_totales || 0) - (a.puntos_totales || 0))
                  .map((user, index) => {
                    const esTop3 = index < 3 && !searchTerm; // Solo muestra podio si no se está buscando
                    
                    return (
                      <li 
                        key={user.id} 
                        onClick={() => handleVerDetalle(user)} 
                        className={`px-4 py-4 flex justify-between items-center cursor-pointer hover:bg-emerald-50 transition-colors ${esTop3 ? 'bg-amber-50/50' : ''}`}
                      >
                        <div className="flex items-center gap-3">
                          <span className={`font-bold w-6 text-center ${esTop3 ? 'text-amber-700 text-lg' : 'text-slate-400 text-sm'}`}>
                            {esTop3 ? (index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉') : index + 1}
                          </span>
                          <span className={`font-semibold ${esTop3 ? 'text-amber-900' : 'text-slate-700'}`}>
                            {user.nombre}
                          </span>
                        </div>
                        <span className={`text-xl font-black ${esTop3 ? 'text-amber-600' : 'text-emerald-600'}`}>
                          {user.puntos_totales || 0} <span className="text-xs text-slate-400 font-normal">pts</span>
                        </span>
                      </li>
                    );
                  })}
                
                {filteredUsers.length === 0 && (
                  <li className="p-8 text-center text-slate-500">No se encontraron participantes.</li>
                )}
              </ul>
            </div>
          </div>
        ) : (
          /* DETALLE DE PRONÓSTICOS DEL USUARIO SELECCIONADO */
          <div className="animate-in fade-in duration-300">
            <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl p-6 mb-6 text-white text-center shadow-md relative overflow-hidden">
              <div className="absolute top-0 right-0 opacity-10 transform translate-x-4 -translate-y-4">
                <Trophy className="w-32 h-32" />
              </div>
              <h2 className="text-2xl font-bold relative z-10">{selectedUser.nombre}</h2>
              <div className="text-5xl font-black mt-2 relative z-10">{selectedUser.puntos_totales || 0} pts</div>
            </div>
            
            <div className="space-y-4">
              <h3 className="font-bold text-slate-700 mb-2 px-1">Historial de Pronósticos</h3>
              {pronosticosUsuario.length === 0 ? (
                <div className="text-center p-8 bg-white rounded-xl text-slate-500">Sin pronósticos registrados.</div>
              ) : (
                pronosticosUsuario.map((prono, index) => (
                  <div key={index} className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
                    <div className="flex justify-between items-center mb-3">
                      <div className="text-xs font-semibold text-slate-400 bg-slate-100 px-2 py-1 rounded">
                        {prono.fecha !== "9999-12-31" ? prono.fecha : "Sin fecha"}
                      </div>
                      <div className="text-center font-bold text-sm flex-1">{prono.partido}</div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 text-center items-center">
                      <div className="bg-slate-50 border border-slate-100 rounded-lg p-2 font-bold text-slate-700">
                        <div className="text-[10px] uppercase text-slate-400 tracking-wider mb-1">Tu Pronóstico</div>
                        {prono.local_prono} - {prono.visita_prono}
                      </div>
                      <div className={`text-xl font-black flex flex-col justify-center ${prono.finalizado ? 'text-emerald-600' : 'text-slate-300'}`}>
                         {prono.finalizado ? `+${prono.puntos || 0}` : '-'}
                         {prono.finalizado && <span className="text-[10px] text-slate-400 font-normal mt-1">puntos</span>}
                      </div>
                      <div className="bg-slate-50 border border-slate-100 rounded-lg p-2 font-bold text-slate-700">
                        <div className="text-[10px] uppercase text-slate-400 tracking-wider mb-1">Resultado Real</div>
                        {prono.finalizado ? `${prono.local_real} - ${prono.visita_real}` : 'Pendiente'}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}