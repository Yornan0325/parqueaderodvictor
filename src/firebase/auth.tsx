// #region IMPORTS
import {
  signInWithEmailAndPassword,
  type User
} from 'firebase/auth'
import { auth } from './firebase'

 // #endregion

// #region TYPES
/**
 * Parámetros para iniciar sesión
 */
interface SignInParams {
  email: string
  password: string
}

/**
 * Error estándar de autenticación
 */
interface AuthError {
  code: string
  message: string
}

/**
 * Respuesta estándar de operaciones de autenticación
 */
interface AuthResponse<T> {
  data: T | null
  error: AuthError | null
}

interface CreateUserParams {
  email: string
  password: string
  name: string
}
// #endregion

// #region VALIDATIONS
/**
 * Mensajes de error para los códigos de Firebase Auth
 */
const AUTH_ERROR_MESSAGES: Record<string, string> = {
  // Errores de registro
  'auth/email-already-in-use': 'Este correo electrónico ya está registrado',
  // Errores de red y configuración
  'auth/internal-error': 'Error interno del servidor. Intenta más tarde',
  // Errores de autenticación
  'auth/invalid-credential':
    'Credenciales incorrectas. Verifica tu email y contraseña',
  'auth/invalid-email': 'El formato del correo electrónico no es válido',
  // Errores de sesión
  'auth/invalid-user-token': 'Tu sesión ha expirado. Inicia sesión nuevamente',
  'auth/network-request-failed': 'Error de conexión. Verifica tu internet',

  'auth/operation-not-allowed':
    'El registro con email/contraseña no está habilitado',
  'auth/requires-recent-login':
    'Esta acción requiere que inicies sesión nuevamente',
  'auth/timeout': 'La operación tardó demasiado. Intenta nuevamente',

  'auth/too-many-requests': 'Demasiados intentos fallidos. Intenta más tarde',
  'auth/user-disabled': 'Esta cuenta ha sido deshabilitada',
  'auth/user-not-found': 'No existe una cuenta con este correo electrónico',

  'auth/user-token-expired': 'Tu sesión ha expirado. Inicia sesión nuevamente',
  'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres',
  'auth/wrong-password': 'La contraseña es incorrecta',

  // Error genérico
  unknown: 'Ha ocurrido un error inesperado. Intenta nuevamente'
} as const

/**
 * Normaliza los errores de Firebase a un formato consistente
 *
 * @param {unknown} error - Error original de Firebase o cualquier otro error
 * @returns {AuthError} Error normalizado con código y mensaje
 */
const createAuthError = (error: unknown): AuthError => {
  if (error && typeof error === 'object' && 'code' in error) {
    const firebaseError = error as { code: string }
    // El emulador devuelve auth/wrong-password; producción devuelve
    // auth/invalid-credential. Se normaliza para tener un único mensaje.
    const code =
      firebaseError.code === 'auth/wrong-password'
        ? 'auth/invalid-credential'
        : firebaseError.code
    const message = AUTH_ERROR_MESSAGES[code] || AUTH_ERROR_MESSAGES.unknown
    return { code, message }
  }

  return {
    code: 'unknown',
    message: AUTH_ERROR_MESSAGES.unknown
  }
}
// #endregion

// #region SERVICES
/**
 * Inicia sesión con email y contraseña
 *
 * @description Autentica al usuario utilizando Firebase Authentication
 *
 * @param {SignInParams} params - Objeto con email y contraseña
 * @param {string} params.email - Correo electrónico del usuario
 * @param {string} params.password - Contraseña del usuario
 * @returns {Promise<AuthResponse<null>>} Respuesta con error en caso de fallo
 *
 * @example
 * const response = await signInWithEmail({
 *   email: 'user@example.com',
 *   password: '123456'
 * })
 */
const signInWithEmail = async ({
  email,
  password
}: SignInParams): Promise<AuthResponse<null>> => {
  try {
    await signInWithEmailAndPassword(auth, email, password)
    return { data: null, error: null }
  } catch (error) {
    return {
      data: null,
      error: createAuthError(error)
    }
  }
}

/**
 * Cierra la sesión actual
 *
 * @description Termina la sesión del usuario actual en Firebase
 *
 * @returns {Promise<AuthResponse<null>>} Respuesta con error en caso de fallo
 *
 * @example
 * await signOut()
 */
const signOutSession = async (): Promise<AuthResponse<null>> => {
  try {
    await auth.signOut()
    return { data: null, error: null }
  } catch (error) {
    return {
      data: null,
      error: createAuthError(error)
    }
  }
}

/**
 * Crea un nuevo usuario con email y contraseña
 *
 * @description Registra un nuevo usuario utilizando Firebase Authentication
 *
 * Flujo:
 * 1. Valida los parámetros de entrada
 * 2. Intenta crear el usuario con Firebase Auth
 * 3. Retorna los datos del usuario creado o error normalizado
 * 4. Maneja errores específicos de creación de usuario
 *
 * @param {CreateUserParams} params - Objeto con email y contraseña
 * @param {string} params.email - Correo electrónico del nuevo usuario
 * @param {string} params.password - Contraseña del nuevo usuario (mínimo 6 caracteres)
 * @returns {Promise<AuthResponse<User>>} Respuesta con datos del usuario o error
 *
 * @example
 * const response = await createUserWithEmail({
 *   email: 'newuser@example.com',
 *   password: 'securePassword123'
 * })
 *
 * if (response.error) {
 *   console.error('Error al crear usuario:', response.error.message)
 * } else {
 *   console.log('Usuario creado:', response.data?.uid)
 * }
 */
const createUserWithEmail = async ({
  email: _email,
  password: _password,
  name: _name
}: CreateUserParams): Promise<AuthResponse<User>> => {
  return {
    data: null,
    error: {
      code: 'auth/operation-not-allowed',
      message:
        'El registro publico esta deshabilitado. Solicita a un administrador la creacion de tu cuenta.'
    }
  }
}
// #endregion

// #region EXPORTS
export type { AuthError, AuthResponse, CreateUserParams, SignInParams }

export { createAuthError, createUserWithEmail, signInWithEmail, signOutSession }
// #endregion
