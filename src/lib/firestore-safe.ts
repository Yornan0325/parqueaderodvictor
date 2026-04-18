import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocFromCache,
  getDocs,
  getDocsFromCache,
  setDoc,
  updateDoc,
  type CollectionReference,
  type DocumentData,
  type DocumentReference,
  type Query,
} from "firebase/firestore"

import { db } from "@/firebase/firebase"

type OfflineOperation = {
  id: string
  kind: "add" | "set" | "update" | "delete"
  path: string
  data?: Record<string, unknown>
  merge?: boolean
  createdAt: number
}

const QUEUE_KEY = "dvictor_offline_ops_v1"
let initialized = false
let processing = false

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null

const randomId = () =>
  `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`

export const isOfflineError = (error: unknown) => {
  const code =
    isRecord(error) && typeof error.code === "string"
      ? error.code.toLowerCase()
      : ""
  const message =
    isRecord(error) && typeof error.message === "string"
      ? error.message.toLowerCase()
      : ""

  return (
    code.includes("unavailable") ||
    code.includes("network") ||
    code.includes("failed-precondition") ||
    message.includes("offline") ||
    message.includes("network")
  )
}

const readQueue = (): OfflineOperation[] => {
  try {
    const raw = localStorage.getItem(QUEUE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const writeQueue = (operations: OfflineOperation[]) => {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(operations))
  } catch {
    // If storage is full/unavailable, we silently ignore to avoid breaking UX.
  }
}

const enqueueOperation = (operation: OfflineOperation) => {
  const queue = readQueue()
  queue.push(operation)
  writeQueue(queue)
}

const splitPath = (path: string) => path.split("/").filter(Boolean)

const toDocumentRef = (path: string) => {
  const segments = splitPath(path)
  return doc(db, segments[0], ...segments.slice(1))
}

const toCollectionRef = (path: string) => {
  const segments = splitPath(path)
  return collection(db, segments[0], ...segments.slice(1)) as CollectionReference<DocumentData>
}

const replayOperation = async (operation: OfflineOperation) => {
  if (operation.kind === "add") {
    await addDoc(toCollectionRef(operation.path), operation.data ?? {})
    return
  }

  if (operation.kind === "set") {
    await setDoc(toDocumentRef(operation.path), operation.data ?? {}, {
      merge: operation.merge,
    })
    return
  }

  if (operation.kind === "update") {
    await updateDoc(toDocumentRef(operation.path), operation.data ?? {})
    return
  }

  await deleteDoc(toDocumentRef(operation.path))
}

export const processOfflineQueue = async () => {
  if (processing || !navigator.onLine) return
  processing = true

  try {
    const queue = readQueue()
    if (queue.length === 0) return

    const pending: OfflineOperation[] = []

    for (const operation of queue) {
      try {
        await replayOperation(operation)
      } catch (error) {
        if (isOfflineError(error)) {
          pending.push(operation)
        }
      }
    }

    writeQueue(pending)
  } finally {
    processing = false
  }
}

export const initializeOfflineSync = () => {
  if (initialized || typeof window === "undefined") return
  initialized = true

  window.addEventListener("online", () => {
    processOfflineQueue().catch(() => undefined)
  })

  processOfflineQueue().catch(() => undefined)
}

const toSerializableData = (data: unknown): Record<string, unknown> => {
  if (!isRecord(data)) return {}
  return JSON.parse(JSON.stringify(data)) as Record<string, unknown>
}

export const safeGetDocs = async <T extends DocumentData>(queryRef: Query<T>) => {
  try {
    return await getDocs(queryRef)
  } catch (error) {
    if (!isOfflineError(error)) throw error
    return getDocsFromCache(queryRef)
  }
}

export const safeGetDoc = async <T extends DocumentData>(docRef: DocumentReference<T>) => {
  try {
    return await getDoc(docRef)
  } catch (error) {
    if (!isOfflineError(error)) throw error
    return getDocFromCache(docRef)
  }
}

export const safeAddDoc = async <T extends DocumentData>(
  collectionRef: CollectionReference<T>,
  data: T
) => {
  try {
    return await addDoc(collectionRef, data)
  } catch (error) {
    if (!isOfflineError(error)) throw error

    enqueueOperation({
      id: randomId(),
      kind: "add",
      path: collectionRef.path,
      data: toSerializableData(data),
      createdAt: Date.now(),
    })

    return { id: `offline_${randomId()}` }
  }
}

export const safeSetDoc = async <T extends DocumentData>(
  docRef: DocumentReference<T>,
  data: Partial<T>,
  options?: any
) => {
  try {
    if (options) {
      await setDoc(docRef, data as T, options)
    } else {
      await setDoc(docRef, data as T)
    }
  } catch (error) {
    if (!isOfflineError(error)) throw error

    enqueueOperation({
      id: randomId(),
      kind: "set",
      path: docRef.path,
      data: toSerializableData(data),
      merge: options?.merge,
      createdAt: Date.now(),
    })
  }
}

export const safeUpdateDoc = async <T extends DocumentData>(
  docRef: DocumentReference<T>,
  data: Partial<T>
) => {
  try {
    await updateDoc(docRef, data as DocumentData)
  } catch (error) {
    if (!isOfflineError(error)) throw error

    enqueueOperation({
      id: randomId(),
      kind: "update",
      path: docRef.path,
      data: toSerializableData(data),
      createdAt: Date.now(),
    })
  }
}

export const safeDeleteDoc = async (docRef: DocumentReference<DocumentData>) => {
  try {
    await deleteDoc(docRef)
  } catch (error) {
    if (!isOfflineError(error)) throw error

    enqueueOperation({
      id: randomId(),
      kind: "delete",
      path: docRef.path,
      createdAt: Date.now(),
    })
  }
}
