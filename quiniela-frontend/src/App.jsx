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

const calcularPuntos = (prono) => {
  if (prono.estado !== "finalizado") return 0;

  const pLocal = Number(prono.local_prono || 0);
  const pVisita = Number(prono.visita_prono || 0);
  const rLocal = Number(prono.goles_local || 0);
  const rVisita = Number(prono.goles_visitante || 0);

  if (pLocal === rLocal && pVisita === rVisita) return 5;
  
  const diffProno = pLocal - pVisita;
  const diffReal = rLocal - rVisita;
  if ((diffProno > 0 && diffReal > 0) || (diffProno < 0 && diffReal < 0) || (diffProno === 0 && diffReal === 0)) return 3;

  return 0;
};

export default function App() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const guardarPuntosEnFirestore = async (partidoId, puntos) => {
    try {
      await updateDoc(doc(db, 'partidos', partidoId), { puntos: puntos });
    } catch (e) { console.error("Error guardando puntos:", e); }
  };

  useEffect(() => {
    const unsubUsuarios = onSnapshot(collection(db, 'usuarios'), (snapU) => {
      const users = snapU.docs.map(d => ({ id: d.id, ...d.data() }));
      
      const unsubPartidos = onSnapshot(collection(db, 'partidos'), (snapP) => {
        const partidos = snapP.docs.map(d => ({ id: d.id, ...d.data() }));
        
        const conPuntos = users.map(u => {
          const misPartidos = partidos.filter(p => p.usuario_id === u.id);
          const conP = misPartidos.map(p => {
            const pts = calcularPuntos(p);
            if (p.estado === "finalizado" && p.puntos !== pts) {
              guardarPuntosEnFirestore(p.id, pts);
            }
            return { ...p, puntos: pts };
          });
          return { ...u, pronosticos: conP, puntos_totales: conP.reduce((a, b) => a + (b.puntos || 0), 0) };
        });

        setUsuarios(conPuntos.sort((a, b) => b.puntos_totales - a.puntos_totales));
        setLoading(false);
      }, (err) => {
        setError("Error al cargar partidos: " + err.message);
        setLoading(false);
      });
      return () => unsubPartidos();
    }, (err) => {
      setError("Error al cargar usuarios: " + err.message);
      setLoading(false);
    });

    return () => unsubUsuarios();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 p-4">
      <header className="max-w-3xl mx-auto mb-6">
        <h1 className="text-2xl font-bold text-emerald-600 flex items-center gap-2">
          <Trophy className="w-6 h-6" /> Tabla de Posiciones
        </h1>
      </header>

      <main className="max-w-3xl mx-auto">
        {loading ? (
          <div className="text-center py-10 text-slate-500 animate-pulse">Cargando datos...</div>
        ) : error ? (
          <div className="text-center py-10 text-red-500 bg-red-50 rounded-xl p-4">{error}</div>
        ) : (
          <div className="bg-white rounded-xl shadow border border-slate-100 overflow-hidden">
            {usuarios.length > 0 ? (
              usuarios.map((u, i) => (
                <div key={u.id} className="flex justify-between px-6 py-4 border-b last:border-b-0 hover:bg-slate-50">
                  <span className="font-semibold text-slate-700">{i + 1}. {u.nombre}</span>
                  <span className="font-black text-emerald-600">{u.puntos_totales} pts</span>
                </div>
              ))
            ) : (
              <div className="p-10 text-center text-slate-400">No hay usuarios para mostrar.</div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}