import { useCallback, useEffect, useState } from "react";

import { useAuth } from "./AuthContext.jsx";

/**
 * Loads an authenticated admin endpoint, refetchable after a mutation.
 *
 * `thunkFactory` is one of the api.* builders — it is called on every load so
 * the request always carries the current access token rather than one captured
 * at mount. Pass it memoised (or inline with a matching `deps`) to avoid loops.
 */
export function useAdminData(thunkFactory, deps = []) {
  const { call } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await call(thunkFactory()));
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [call, ...deps]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, error, loading, reload: load };
}
