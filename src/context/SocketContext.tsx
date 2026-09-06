// src/context/SocketContext.tsx
import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { Box, Typography, IconButton, Paper } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive'
import { getToken } from '../api/client'
import { useAuth } from '../hooks/useAuth'

interface SocketContextValue {
  socket: Socket | null
  isConnected: boolean
  subscribeSync: (topic: string, callback: () => void) => () => void
}

const SocketContext = createContext<SocketContextValue>({
  socket: null,
  isConnected: false,
  subscribeSync: () => () => {},
})

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth()
  const [isConnected, setIsConnected] = useState(false)
  const socketRef = useRef<Socket | null>(null)
  const syncListenersRef = useRef<Map<string, Set<() => void>>>(new Map())
  const navigate = useNavigate()

  const subscribeSync = useCallback((topic: string, callback: () => void) => {
    if (!syncListenersRef.current.has(topic)) {
      syncListenersRef.current.set(topic, new Set())
    }
    syncListenersRef.current.get(topic)!.add(callback)

    return () => {
      syncListenersRef.current.get(topic)?.delete(callback)
    }
  }, [])

  useEffect(() => {
    const token = getToken()
    if (!token || !user) {
      if (socketRef.current) {
        socketRef.current.disconnect()
        socketRef.current = null
        setIsConnected(false)
      }
      return
    }

    const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'
    const socketInstance = io(apiUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    })

    socketRef.current = socketInstance

    socketInstance.on('connect', () => {
      setIsConnected(true)
      // Reconcile on (re)connect: trigger all active sync listeners
      syncListenersRef.current.forEach((callbacks) => {
        callbacks.forEach((cb) => {
          try {
            cb()
          } catch (err) {
            console.error('[SOCKET RECONNECT REFETCH ERROR]', err)
          }
        })
      })
    })

    socketInstance.on('disconnect', () => {
      setIsConnected(false)
    })

    // ─── Real-Time Toast on Notification Receipt ───
    socketInstance.on('notification:new', (notification: any) => {
      // Trigger manual-dismiss-only toast with duration: Infinity
      toast.custom(
        (t) => (
          <Paper
            elevation={4}
            sx={{
              p: 1.75,
              borderRadius: 2.5,
              bgcolor: 'background.paper',
              borderLeft: '4px solid',
              borderLeftColor: 'primary.main',
              maxWidth: 360,
              width: '100%',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 1.5,
              boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            }}
          >
            <NotificationsActiveIcon color="primary" sx={{ mt: 0.25, fontSize: 22 }} />
            <Box
              sx={{ flex: 1, cursor: notification.link ? 'pointer' : 'default' }}
              onClick={() => {
                if (notification.link) {
                  navigate(notification.link)
                  toast.dismiss(t.id)
                }
              }}
            >
              <Typography variant="subtitle2" fontWeight={700} color="text.primary" sx={{ lineHeight: 1.2 }}>
                {notification.title}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, lineHeight: 1.4 }}>
                {notification.message}
              </Typography>
            </Box>
            <IconButton
              size="small"
              onClick={() => toast.dismiss(t.id)}
              aria-label="Dismiss notification"
              sx={{ p: 0.5, color: 'text.secondary', '&:hover': { color: 'text.primary' } }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Paper>
        ),
        { duration: 3000, id: notification.id || undefined }
      )

      // Also trigger badge and notification counts refetch
      const badgeCallbacks = syncListenersRef.current.get('badges')
      badgeCallbacks?.forEach((cb) => cb())
      const notifCallbacks = syncListenersRef.current.get('notifications')
      notifCallbacks?.forEach((cb) => cb())
    })

    // ─── Real-Time Dashboard Synchronization ───
    socketInstance.on('dashboard:sync', (data: { topic: string; [key: string]: any }) => {
      const topicCallbacks = syncListenersRef.current.get(data.topic)
      topicCallbacks?.forEach((cb) => cb())
      // Also notify general sync subscribers
      const allCallbacks = syncListenersRef.current.get('all')
      allCallbacks?.forEach((cb) => cb())
    })

    return () => {
      socketInstance.disconnect()
      socketRef.current = null
      setIsConnected(false)
    }
  }, [user, navigate])

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, isConnected, subscribeSync }}>
      {children}
    </SocketContext.Provider>
  )
}

export const useSocket = () => useContext(SocketContext)

export const useSocketSync = (topic: string, callback: () => void) => {
  const { subscribeSync } = useSocket()
  useEffect(() => {
    return subscribeSync(topic, callback)
  }, [subscribeSync, topic, callback])
}
