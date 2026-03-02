import { motion } from 'motion/react';
import { ClipboardList } from 'lucide-react';

export function Manejos() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-6xl mx-auto space-y-6"
      >
        {/* Header */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">
            Suplemento Control
          </p>
          <h1 className="text-3xl font-bold text-gray-900">Manejos</h1>
          <p className="text-sm text-gray-500 mt-1">
            Registros de manejo: vacinações, pesagens, marcações e outras operações.
          </p>
        </div>

        {/* Placeholder */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm py-24 flex flex-col items-center justify-center gap-4">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: 'rgba(26,96,64,0.08)' }}
          >
            <ClipboardList className="w-8 h-8 text-teal-600" />
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold text-gray-700">Módulo em desenvolvimento</p>
            <p className="text-sm text-gray-400 mt-1">Em breve: registros de vacinação, pesagem, marcação e mais.</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
