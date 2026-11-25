import { useEffect, useState } from 'react';
import { getMateriales } from '../api/inventarioApi.js';

export default function useInventario() {
  const [materiales, setMateriales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;

    getMateriales()
      .then((result) => {
        if (active) setMateriales(result);
      })
      .catch((requestError) => {
        if (active) setError(requestError);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return { materiales, loading, error };
}
