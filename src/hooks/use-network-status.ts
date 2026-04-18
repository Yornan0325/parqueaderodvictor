// #region IMPORTS
import { useEffect } from 'react'
import { toast } from 'sonner'
// #endregion

// #region CONSTANTS
const TOAST_ID_OFFLINE = 'network-offline'
// #endregion

// #region HOOKS
/**
 * Escucha los eventos `online` y `offline` del navegador y muestra
 * toasts de Sonner para informar al usuario sobre el estado de la red.
 *
 * @description Al perder conexión muestra un toast de advertencia persistente.
 * Al recuperar la conexión, descarta el toast de offline y muestra uno de
 * confirmación. Se integra con el sistema de toasts ya existente en la app.
 *
 * @example
 * // Usar una sola vez en el componente raíz
 * useNetworkStatus()
 *
 * @flow
 * 1. Registra listeners para `online` y `offline` en `window`
 * 2. `offline` → toast.warning persistente con id fijo para poder descartarlo
 * 3. `online` → descarta el toast de offline + toast.success efímero
 * 4. Limpia los listeners al desmontar
 */
const useNetworkStatus = (): void => {
  useEffect(() => {
    const handleOffline = () => {
      toast.warning('Sin conexión', {
        description:
          'Trabajando con datos locales. Los cambios se sincronizarán al reconectar.',
        duration: Infinity,
        id: TOAST_ID_OFFLINE
      })
    }

    const handleOnline = () => {
      toast.dismiss(TOAST_ID_OFFLINE)
      toast.success('Conexión restaurada', {
        description: 'Los datos se están sincronizando.'
      })
    }

    window.addEventListener('offline', handleOffline)
    window.addEventListener('online', handleOnline)

    return () => {
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('online', handleOnline)
    }
  }, [])
}
// #endregion

// #region EXPORTS
export { useNetworkStatus }
// #endregion
