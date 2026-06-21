import React, { useState, useEffect } from 'react';
import { Trophy, Search, ChevronLeft, User, Activity, Medal, CheckCircle2, XCircle, MinusCircle } from 'lucide-react';

// ============================================================================
// 🔧 CONFIGURACIÓN DE FIREBASE (Para cuando lo lleves a tu proyecto local) 
// ============================================================================
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, orderBy, onSnapshot, where, getDocs } from 'firebase/firestore';

// Pega aquí la configuración de tu proyecto Firebase (la encuentras en Project Settings)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ============================================================================
// 🗂️ DATOS DE PRUEBA (Solo para la previsualización de esta interfaz)
// ============================================================================
const MOCK_USERS = [
  { id: 'carlos_perez', nombre: 'Carlos Perez', puntos_totales: 45 },
  { id: 'maria_sanchez', nombre: 'Maria Sanchez', puntos_totales: 42 },
  { id: 'luis_moran', nombre: 'Luis Moran', puntos_totales: 38 },
  { id: 'juan_guisado', nombre: 'Juan Guisado', puntos_totales: 35 },
  { id: 'lilibeth_copete', nombre: 'Lilibeth Copete', puntos_totales: 30 },
  { id: 'wottmar', nombre: 'Wottmar', puntos_totales: 28 },
  { id: 'marcos', nombre: 'Marcos', puntos_totales: 25 }
];

const MOCK_PRONOSTICOS = [
  { id: 1, partido: 'MEXICO VS SUDAFRICA', local_prono: 2, visita_prono: 1, local_real: 2, visita_real: 1, puntos: 5, finalizado: true },
  { id: 2, partido: 'COREA DEL SUR VS REP. CHECA', local_prono: 1, visita_prono: 1, local_real: 1, visita_real: 0, puntos: 0, finalizado: true },
  { id: 3, partido: 'CANADA VS BOSNIA', local_prono: 2, visita_prono: 0, local_real: 3, visita_real: 1, puntos: 3, finalizado: true },
  { id: 4, partido: 'ESTADOS UNIDOS VS PARAGUAY', local_prono: 1, visita_prono: 2, local_real: null, visita_real: null, puntos: 0, finalizado: false }
];

// ============================================================================
// 📱 COMPONENTE PRINCIPAL DE LA APLICACIÓN
// ============================================================================
export default function App() {
  const [usuarios, setUsuarios] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [pronosticosUsuario, setPronosticosUsuario] = useState([]);
  const [loading, setLoading] = useState(true);

  // Efecto para cargar la tabla de posiciones al iniciar
  useEffect(() => {
    // 🔴 Lógica real de Firebase (Descomentar en tu proyecto local):
    
    const q = query(collection(db, 'usuarios'), orderBy('puntos_totales', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsuarios(usersData);
      setLoading(false);
    });
    return () => unsubscribe();

  }, []);

  // Función para ver el detalle de un usuario
  const handleVerDetalle = async (usuario) => {
    setSelectedUser(usuario);
    
    // 🔴 Lógica real de Firebase (Descomentar en tu proyecto local):
    
    const q = query(collection(db, 'partidos'), where('usuario_id', '==', usuario.id));
    const snapshot = await getDocs(q);
    const pronosticosData = snapshot.docs.map(doc => doc.data());
    // Aquí idealmente cruzarías con la colección 'partidos' para obtener los nombres de los equipos
    setPronosticosUsuario(pronosticosData);
  };

  // Filtrado de búsqueda
  const filteredUsers = usuarios.filter(u => 
    u.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-emerald-200">
      
      {/* HEADER PRINCIPAL */}
      <header className="bg-emerald-600 text-white shadow-md sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-300" />
            <h1 className="font-bold text-xl tracking-tight">Quiniela Mundial</h1>
          </div>
          {selectedUser && (
            <button 
              onClick={() => setSelectedUser(null)}
              className="flex items-center gap-1 text-sm font-medium bg-emerald-700 hover:bg-emerald-800 px-3 py-1.5 rounded-full transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> Volver
            </button>
          )}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-emerald-600">
            <Activity className="w-10 h-10 animate-spin mb-4" />
            <p className="font-medium animate-pulse">Cargando resultados en vivo...</p>
          </div>
        ) : !selectedUser ? (
          
          /* ================================================================== */
          /* VISTA 1: TABLA DE POSICIONES (LEADERBOARD)                         */
          /* ================================================================== */
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {/* Buscador */}
            <div className="relative mb-6 shadow-sm rounded-xl overflow-hidden">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="Busca tu nombre..."
                className="block w-full pl-10 pr-3 py-3 border-none bg-white focus:ring-2 focus:ring-emerald-500 text-base"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Tabla */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="bg-slate-50 px-4 py-3 border-b border-slate-100 flex justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
                <span>Participante</span>
                <span>Puntos</span>
              </div>
              <ul className="divide-y divide-slate-50">
                {filteredUsers.map((user, index) => (
                  <li 
                    key={user.id}
                    onClick={() => handleVerDetalle(user)}
                    className="px-4 py-4 flex items-center justify-between hover:bg-emerald-50 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm
                        ${index === 0 ? 'bg-yellow-100 text-yellow-700' : 
                          index === 1 ? 'bg-slate-200 text-slate-700' : 
                          index === 2 ? 'bg-amber-100 text-amber-700' : 
                          'bg-slate-100 text-slate-500 group-hover:bg-emerald-100 group-hover:text-emerald-700'}`}
                      >
                        {index === 0 ? <Medal className="w-4 h-4" /> : index + 1}
                      </div>
                      <span className="font-semibold text-slate-700 group-hover:text-emerald-700 transition-colors">{user.nombre}</span>
                    </div>
                    <div className="text-xl font-black text-emerald-600 tracking-tighter">
                      {user.puntos_totales}
                    </div>
                  </li>
                ))}
                {filteredUsers.length === 0 && (
                  <div className="py-10 text-center text-slate-400">
                    No se encontraron participantes con ese nombre.
                  </div>
                )}
              </ul>
            </div>
          </div>

        ) : (

          /* ================================================================== */
          /* VISTA 2: DETALLE DEL USUARIO Y SUS PRONÓSTICOS                     */
          /* ================================================================== */
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            
            {/* Tarjeta de Perfil */}
            <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl shadow-md p-6 mb-6 text-white text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Trophy className="w-32 h-32" />
              </div>
              <div className="relative z-10">
                <div className="w-16 h-16 bg-white/20 rounded-full mx-auto flex items-center justify-center mb-3 backdrop-blur-sm">
                  <User className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold mb-1">{selectedUser.nombre}</h2>
                <p className="text-emerald-100 font-medium">Puntaje Acumulado</p>
                <div className="text-5xl font-black mt-2 tracking-tighter">
                  {selectedUser.puntos_totales}
                </div>
              </div>
            </div>

            {/* Lista de Partidos */}
            <h3 className="font-bold text-slate-800 text-lg mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-500" />
              Historial de Pronósticos
            </h3>

            <div className="space-y-4">
              {pronosticosUsuario.map((prono) => (
                <div key={prono.id} className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
                  
                  {/* Título del Partido */}
                  <div className="text-center font-bold text-slate-700 mb-3 text-sm">
                    {prono.partido}
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-center items-center">
                    
                    {/* El Pronóstico */}
                    <div className="bg-slate-50 rounded-lg p-2 border border-slate-100">
                      <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Tu Pronóstico</p>
                      <div className="font-bold text-lg text-slate-700">
                        {prono.local_prono} - {prono.visita_prono}
                      </div>
                    </div>

                    {/* Puntos Ganados */}
                    <div className="flex flex-col items-center justify-center">
                      {prono.finalizado ? (
                        <>
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-lg text-white shadow-sm mb-1
                            ${prono.puntos === 5 ? 'bg-emerald-500' : prono.puntos === 3 ? 'bg-amber-400' : 'bg-slate-300'}`}
                          >
                            +{prono.puntos}
                          </div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Puntos</span>
                        </>
                      ) : (
                        <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-bold uppercase border border-blue-100">
                          Pendiente
                        </span>
                      )}
                    </div>

                    {/* Marcador Real */}
                    <div className="bg-slate-50 rounded-lg p-2 border border-slate-100">
                      <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Resultado Real</p>
                      <div className="font-bold text-lg text-slate-700">
                        {prono.finalizado ? `${prono.local_real} - ${prono.visita_real}` : '? - ?'}
                      </div>
                    </div>
                  </div>

                  {/* Etiqueta de Feedback */}
                  {prono.finalizado && (
                    <div className="mt-3 flex justify-center">
                      <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold
                        ${prono.puntos === 5 ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 
                          prono.puntos === 3 ? 'bg-amber-50 text-amber-700 border border-amber-100' : 
                          'bg-slate-50 text-slate-500 border border-slate-100'}`}
                      >
                        {prono.puntos === 5 && <><CheckCircle2 className="w-3.5 h-3.5" /> Marcador Exacto</>}
                        {prono.puntos === 3 && <><MinusCircle className="w-3.5 h-3.5" /> Acertó Ganador</>}
                        {prono.puntos === 0 && <><XCircle className="w-3.5 h-3.5" /> Falló</>}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

          </div>
        )}
      </main>
    </div>
  );
}