import React, { useEffect, useState } from 'react'
import DashboardLayout from '../../components/layouts/DashboardLayout'
import useApi from '../../hooks/useApi'
import moment from 'moment'
import 'moment/locale/es'

import { LuDollarSign, LuShoppingCart, LuPackage, LuTrendingUp, LuTrophy } from 'react-icons/lu'
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts'

export default function Dashboard() {
  const api = useApi();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const data = await api.get('/dashboard/stats');
      setStats(data);
    } catch (error) {
      console.error("Error cargando dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, subtext, icon, color }) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
      <div className={`p-4 rounded-full ${color} text-white text-2xl`}>
        {icon}
      </div>
      <div>
        <p className="text-gray-500 text-sm font-medium">{title}</p>
        <h3 className="text-2xl font-bold text-gray-800">{value}</h3>
        {subtext && <p className="text-xs text-gray-400 mt-1">{subtext}</p>}
      </div>
    </div>
  );

  return (
    <DashboardLayout activeMenu="/admin/dashboard">
      <div className="my-5 max-w-6xl mx-auto space-y-8">
        
        <div>
          <h2 className="text-2xl font-bold text-gray-800">¡Hola, bienvenido! 👋</h2>
          <p className="text-gray-500 mt-1 capitalize">
            {moment().format("dddd D [de] MMMM, YYYY")}
          </p>
        </div>

        {loading ? (
          <p>Cargando estadísticas...</p>
        ) : stats ? (
          <>
            {/* TARJETAS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCard 
                title="Ventas de Hoy"
                value={`S/ ${Number(stats.today?.total_money || 0).toFixed(2)}`}
                subtext={`${stats.today?.total_count || 0} ventas realizadas`}
                icon={<span className="font-bold text-xl">S/.</span>}
                color="bg-blue-600"
              />
              <StatCard 
                title="Ventas del Mes"
                value={`S/ ${Number(stats.month?.total_money || 0).toFixed(2)}`}
                subtext="Acumulado este mes"
                icon={<LuShoppingCart />}
                color="bg-purple-600"
              />
               <StatCard 
                title="Productos Activos"
                value={stats.products || 0}
                subtext="En catálogo"
                icon={<LuPackage />}
                color="bg-green-600"
              />
            </div>

            {/* SECCIÓN INFERIOR: GRÁFICO + TOP PRODUCTOS */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* COLUMNA IZQUIERDA: GRÁFICO (Ocupa 2 espacios) */}
                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="p-2 bg-orange-100 text-orange-600 rounded-lg"><LuTrendingUp size={20}/></div>
                        <h3 className="text-lg font-bold text-gray-800">Tendencia de Ventas</h3>
                    </div>
                    <div className="flex justify-center">
                        {stats.chart && stats.chart.length > 0 ? (
                            <BarChart width={600} height={300} data={stats.chart}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                                <XAxis dataKey="date" tick={{fontSize: 12}} />
                                <YAxis tick={{fontSize: 12}} />
                                <Tooltip cursor={{fill: '#F9FAFB'}} />
                                <Bar dataKey="total" fill="#4F46E5" radius={[4, 4, 0, 0]} barSize={40} name="Ventas" />
                            </BarChart>
                        ) : (
                            <div className="h-32 flex items-center justify-center text-gray-400"><p>Sin datos</p></div>
                        )}
                    </div>
                </div>

                {/* COLUMNA DERECHA: TOP PRODUCTOS (Ocupa 1 espacio) */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="p-2 bg-yellow-100 text-yellow-600 rounded-lg"><LuTrophy size={20}/></div>
                        <h3 className="text-lg font-bold text-gray-800">Más Vendidos</h3>
                    </div>
                    <div className="space-y-4">
                        {stats.topProducts && stats.topProducts.length > 0 ? (
                            stats.topProducts.map((prod, index) => (
                                <div key={index} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg border border-transparent hover:border-gray-100 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <span className={`font-bold w-6 h-6 flex items-center justify-center rounded-full text-xs ${index === 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'}`}>
                                            {index + 1}
                                        </span>
                                        <p className="text-sm font-medium text-gray-700 truncate max-w-[150px]" title={prod.name}>
                                            {prod.name}
                                        </p>
                                    </div>
                                    <span className="text-xs font-semibold bg-blue-50 text-blue-600 px-2 py-1 rounded-full">
                                        {prod.quantity} u.
                                    </span>
                                </div>
                            ))
                        ) : (
                            <p className="text-center text-gray-400 text-sm py-4">No hay datos aún</p>
                        )}
                    </div>
                </div>

            </div>
          </>
        ) : (
          <p className="text-red-500">No se pudieron cargar los datos.</p>
        )}
      </div>
    </DashboardLayout>
  )
}