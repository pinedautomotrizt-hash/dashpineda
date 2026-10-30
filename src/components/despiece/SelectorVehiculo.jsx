import React from 'react';
import { VEHICULOS } from '../../config/vehiculosDespiece';

// Lista de vehiculos 3D para cambiar el modelo del despiece.
export default function SelectorVehiculo({ value, onChange, className = '' }) {
  return (
    <label className={`flex items-center gap-2 text-xs text-slate-500 ${className}`}>
      Vehículo
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs font-medium text-slate-900"
      >
        {VEHICULOS.map((vehiculo) => <option key={vehiculo.id} value={vehiculo.id}>{vehiculo.nombre}</option>)}
      </select>
    </label>
  );
}
