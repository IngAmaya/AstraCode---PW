import { createContext, useState } from 'react';

const ProyectoContext = createContext(null);

export function ProyectoProvider({ children }) {
  const [proyecto, setProyecto] = useState(null);

  return (
    <ProyectoContext.Provider value={{ proyecto, setProyecto }}>
      {children}
    </ProyectoContext.Provider>
  );
}

export default ProyectoContext;
