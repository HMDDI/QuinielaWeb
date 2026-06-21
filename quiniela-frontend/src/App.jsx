import React, { useState, useEffect } from 'react';
import { Trophy, Search, ChevronLeft, User, Activity, Medal, CheckCircle2, XCircle, MinusCircle } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';

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

// LÓGICA CORREGIDA CON TUS CAMPOS:
// estado == "finalizado"
// goles_local / goles_visitante (reales)
const calcularPuntos = (prono) => {
  if (prono.estado !== "finalizado") return 0;

  const pLocal = Number(prono.local_prono); // Asumiendo que guardas tu pronóstico así
  const pVisita = Number(prono.visita_prono);
  const rLocal = Number(prono.goles_local);
  const rVisita = Number(prono.goles_visitante);

  if (pLocal === rLocal && pVisita === rVisita) return 5;
  
  const diffProno = pLocal - pVisita;
  const diffReal = rLocal - rVisita;
  if ((diffProno > 0 && diffReal > 0) || (diffProno < 0 && diffReal < 0) || (diffProno === 0 && diffReal === 0)) return 3;

  return 0;
};

export default function App() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState(null);

  const guardarPuntosEnFirestore = async (partidoId, puntos) => {
    try {
      await updateDoc(doc(db, 'partidos', partidoId), { puntos: puntos });
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'usuarios'), (snapU) => {
      const users = snapU.docs.map(d => ({ id: d.id, ...d.data() }));
      const unsubP = onSnapshot(collection(db, 'partidos'), (snapP) => {
        const partidos = snapP.docs.map(d => ({ id: d.id, ...d.data() }));
        
        const conPuntos = users.map(u => {
          const misPartidos = partidos.filter(p => p.usuario_id === u.id);
          const conP = misPartidos.map(p => {
            const pts = calcularPuntos(p);
            if (p.estado === "finalizado" && p.puntos !== pts) guardarPuntosEnFirestore(p.id, pts);
            return { ...p, puntos: pts };
          });
          return { ...u, pronosticos: conP, puntos_totales: conP.reduce((a, b) => a + (b.puntos || 0), 0) };
        });

        setUsuarios(conPuntos.sort((a, b) => b.puntos_totales - a.puntos_totales));
        setLoading(false);
      });
      return () => unsubP();
    });
    return () => unsub();
  }, []);
  
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      <header className="bg-emerald-600 text-white shadow-md sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-300" />
            <h1 className="font-bold text-xl">Quiniela Mundial</h1>
          </div>
          {selectedUser && (
            <button onClick={() => setSelectedUserId(null)} className="flex items-center gap-1 text-sm bg-emerald-700 px-3 py-1.5 rounded-full">
              <ChevronLeft className="w-4 h-4" /> Volver
            </button>
          )}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex flex-col items-center py-20 text-emerald-600">
            <Activity className="w-10 h-10 animate-spin mb-4" />
            <p>Calculando y sincronizando resultados...</p>
          </div>
        ) : !selectedUser ? (
          <div className="space-y-6">
            <div className="relative shadow-sm rounded-xl overflow-hidden">
              <Search className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
              <input type="text" placeholder="Busca tu nombre..." className="w-full pl-10 pr-3 py-3 border-none bg-white focus:ring-2 focus:ring-emerald-500" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <ul className="divide-y divide-slate-50">
                {filteredUsers.map((user, index) => (
                  <li key={user.id} onClick={() => setSelectedUserId(user.id)} className="px-4 py-4 flex items-center justify-between hover:bg-emerald-50 cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${index < 3 ? 'bg-yellow-100' : 'bg-slate-100'}`}>
                        {index + 1}
                      </div>
                      <span className="font-semibold text-slate-700">{user.nombre}</span>
                    </div>
                    <div className="text-xl font-black text-emerald-600">{user.puntos_totales}</div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-emerald-600 rounded-2xl p-6 text-white text-center">
              <h2 className="text-2xl font-bold">{selectedUser.nombre}</h2>
              <p className="text-5xl font-black mt-2">{selectedUser.puntos_totales}</p>
            </div>
            {pronosticosUsuario.map((prono) => (
              <div key={prono.id} className="bg-white p-4 rounded-xl shadow-sm border">
                <div className="text-center font-bold mb-2">{prono.partido}</div>
                <div className="flex justify-between items-center text-center">
                   <div><p className="text-[10px] uppercase font-bold">Pronóstico</p>{prono.local_prono}-{prono.visita_prono}</div>
                   <div className="w-10 h-10 bg-emerald-500 text-white rounded-full flex items-center justify-center font-bold">+{prono.puntos}</div>
                   <div><p className="text-[10px] uppercase font-bold">Real</p>{prono.finalizado ? `${prono.local_real}-${prono.visita_real}` : '?-?'}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}