import React, { useState, useEffect } from 'react';
import {
  Trophy, Search, ChevronLeft, User, Activity, Medal,
  CheckCircle2, XCircle, MinusCircle, Wifi, WifiOff, AlertCircle
} from 'lucide-react';

import { initializeApp } from 'firebase/app';
import {
  getFirestore, collection, query, orderBy, onSnapshot,
  getDocs, doc, updateDoc
} from 'firebase/firestore';

// Configuración de Firebase simplificada para evitar errores de importación
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

export default function App() {
  const [usuarios, setUsuarios] = useState([]);
  const [partidos, setPartidos] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [pronosticosUsuario, setPronosticosUsuario] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingPronos, setLoadingPronos] = useState(false);
  const [connectionMode, setConnectionMode] = useState('conectando');
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    let isMounted = true;
    let unsubscribeUsuarios = () => { };
    let unsubscribePartidos = () => { };

    try {
      unsubscribePartidos = onSnapshot(collection(db, 'partidos'), (snapP) => {
        if (!isMounted) return;
        const partidosData = snapP.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setPartidos(partidosData);

        unsubscribeUsuarios = onSnapshot(collection(db, 'usuarios'), async (snapU) => {
          if (!isMounted) return;
          if (!snapU.empty) {
            const usersData = snapU.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            const usuariosCalculados = await Promise.all(usersData.map(async (user) => {
              try {
                const pronosSnap = await getDocs(collection(db, 'usuarios', user.id, 'pronosticos'));
                const pronosticos = pronosSnap.docs.map(d => d.data());

                let totalPuntos = 0;
                pronosticos.forEach(prono => {
                  const partidoReal = partidosData.find(p => String(p.id_api) === String(prono.partido_id));

                  if (partidoReal && partidoReal.estado === "finalizado") {
                    const pL = Number(prono.goles_local);
                    const pV = Number(prono.goles_visita);
                    const rL = Number(partidoReal.goles_local);
                    const rV = Number(partidoReal.goles_visitante);

                    if (pL === rL && pV === rV) totalPuntos += 5;
                    else if ((pL - pV > 0 && rL - rV > 0) || (pL - pV < 0 && rL - rV < 0) || (pL - pV === 0 && rL - rV === 0)) totalPuntos += 3;
                  }
                });

                if (user.puntos_totales !== totalPuntos) {
                  updateDoc(doc(db, 'usuarios', user.id), { puntos_totales: totalPuntos }).catch(() => { });
                }

                return { ...user, puntos_totales: totalPuntos };
              } catch (e) {
                return { ...user };
              }
            }));

            usuariosCalculados.sort((a, b) => b.puntos_totales - a.puntos_totales);
            setUsuarios(usuariosCalculados);
            setConnectionMode('online');
            setErrorMessage(null);
          } else {
            setUsuarios(MOCK_USERS);
            setConnectionMode('fallback');
          }
          setLoading(false);
        }, (error) => {
          setUsuarios(MOCK_USERS);
          setConnectionMode('fallback');
          setLoading(false);
        });
      });
    } catch (err) {
      setUsuarios(MOCK_USERS);
      setConnectionMode('fallback');
      setLoading(false);
    }

    return () => {
      isMounted = false;
      unsubscribeUsuarios();
      unsubscribePartidos();
    };
  }, []);

  const handleVerDetalle = async (usuario) => {
    setSelectedUser(usuario);
    setLoadingPronos(true);
    setPronosticosUsuario([]);

    if (connectionMode === 'online') {
      try {
        const pronosRef = collection(db, 'usuarios', usuario.id, 'pronosticos');
        const querySnapshot = await getDocs(pronosRef);

        if (!querySnapshot.empty) {
          const listaPronos = querySnapshot.docs.map(docSnapshot => {
            const prono = docSnapshot.data();
            const partidoReal = partidos.find(p => String(p.id_api) === String(prono.partido_id));

            let puntos_calc = 0;
            let finalizado = false;

            if (partidoReal && partidoReal.estado === "finalizado") {
              finalizado = true;
              const pL = Number(prono.goles_local);
              const pV = Number(prono.goles_visita);
              const rL = Number(partidoReal.goles_local);
              const rV = Number(partidoReal.goles_visitante);

              if (pL === rL && pV === rV) puntos_calc = 5;
              else if ((pL - pV > 0 && rL - rV > 0) || (pL - pV < 0 && rL - rV < 0) || (pL - pV === 0 && rL - rV === 0)) puntos_calc = 3;
            }

            return {
              id: docSnapshot.id,
              partido: partidoReal ? `${partidoReal.equipo_local.toUpperCase()} VS ${partidoReal.equipo_visitante.toUpperCase()}` : `Partido ${prono.partido_id}`,
              // Asegúrate de que el formato de fecha sea compatible con Date.parse() (ej: YYYY-MM-DD)
              fecha: partidoReal?.fecha || "9999-12-31",
              local_prono: prono.goles_local ?? '-',
              visita_prono: prono.goles_visita ?? '-',
              local_real: partidoReal ? partidoReal.goles_local : null,
              visita_real: partidoReal ? partidoReal.goles_visitante : null,
              puntos: puntos_calc,
              finalizado: finalizado
            };
          });
          listaPronos.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
          setPronosticosUsuario(listaPronos);
        }
      } catch (error) {
        setErrorMessage("Error al cargar pronósticos.");
      } finally {
        setLoadingPronos(false);
      }
    } else {
      setTimeout(() => {
        setPronosticosUsuario(MOCK_PRONOSTICOS);
        setLoadingPronos(false);
      }, 500);
    }
  };

  const filteredUsers = usuarios.filter(u => u.nombre && u.nombre.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      <header className="bg-emerald-600 text-white shadow-md sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-300" />
            <h1 className="font-bold text-xl">Mundial - CEDI</h1>
          </div>
          {selectedUser && (
            <button onClick={() => setSelectedUser(null)} className="text-sm bg-emerald-700 px-3 py-1.5 rounded-full">Volver</button>
          )}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-emerald-600">
            <Activity className="w-10 h-10 animate-spin mb-4" />
          </div>
        ) : !selectedUser ? (
          <div className="animate-in fade-in duration-500">
            <div className="relative mb-6 shadow-sm rounded-xl overflow-hidden">
              <input
                type="text"
                placeholder="Busca tu nombre..."
                className="w-full pl-4 py-3 border-none bg-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <ul className="divide-y divide-slate-50">
                {/* Ordenamos los usuarios filtrados por puntos de mayor a menor */}
                {[...filteredUsers]
                  .sort((a, b) => (b.puntos_totales || 0) - (a.puntos_totales || 0))
                  .map((user, index) => {
                    const esTop3 = index < 3;
                    return (
                      <li
                        key={user.id}
                        onClick={() => handleVerDetalle(user)}
                        className={`px-4 py-4 flex justify-between items-center cursor-pointer hover:bg-emerald-50 ${esTop3 ? 'bg-amber-50' : ''}`}
                      >
                        <div className="flex items-center gap-3">
                          {/* Número de posición con medalla */}
                          <span className={`font-bold w-6 text-center ${esTop3 ? 'text-amber-700' : 'text-slate-400'}`}>
                            {esTop3 ? (index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉') : index + 1}
                          </span>
                          <span className={`font-semibold ${esTop3 ? 'text-amber-900' : 'text-slate-800'}`}>
                            {user.nombre}
                          </span>
                        </div>
                        <span className="text-xl font-black text-emerald-600">
                          {user.puntos_totales || 0}
                        </span>
                      </li>
                    );
                  })}
              </ul>
            </div>
          </div>
        ) : (
          <div className="animate-in fade-in duration-300">
            <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl p-6 mb-6 text-white text-center">
              <h2 className="text-2xl font-bold">{selectedUser.nombre}</h2>
              <div className="text-5xl font-black mt-2">{selectedUser.puntos_totales}</div>
            </div>
            <div className="space-y-4">
              {pronosticosUsuario.map((prono) => (
                <div key={prono.id} className="bg-white rounded-xl shadow-sm p-4">
                  <div className="text-center font-bold text-sm mb-3">{prono.partido}</div>
                  <div className="grid grid-cols-3 gap-4 text-center items-center">
                    <div className="bg-slate-50 rounded-lg p-2 font-bold">{prono.local_prono} - {prono.visita_prono}</div>
                    <div className={`text-xl font-black ${prono.finalizado ? 'text-emerald-600' : 'text-slate-400'}`}>
                      {prono.finalizado ? `+${prono.puntos}` : '-'}
                    </div>
                    <div className="bg-slate-50 rounded-lg p-2 font-bold">{prono.finalizado ? `${prono.local_real} - ${prono.visita_real}` : '? - ?'}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}