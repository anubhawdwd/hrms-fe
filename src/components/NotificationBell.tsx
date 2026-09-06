// src/components/NotificationBell.tsx
import React, { useState, useEffect, useCallback } from 'react'
import {
  Box,
  IconButton,
  Badge,
  Popover,
  Typography,
  Stack,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Tabs,
  Tab,
  CircularProgress,
  Tooltip,
  useTheme,
  alpha,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material'
import NotificationsIcon from '@mui/icons-material/Notifications'
import DoneAllIcon from '@mui/icons-material/DoneAll'
import CheckIcon from '@mui/icons-material/Check'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep'
import BeachAccessIcon from '@mui/icons-material/BeachAccess'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CancelIcon from '@mui/icons-material/Cancel'
import CelebrationIcon from '@mui/icons-material/Celebration'
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { useNavigate } from 'react-router-dom'
import { notificationApi } from '../api/notification.api'
import type { NotificationItem, NotificationType } from '../types/notification.types'
import { useSocketSync } from '../context/SocketContext'
import toast from 'react-hot-toast'

dayjs.extend(relativeTime)

export const NotificationBell: React.FC = () => {
  const theme = useTheme()
  const navigate = useNavigate()
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [activeTab, setActiveTab] = useState<'ALL' | 'UNREAD'>('ALL')
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [unreadCount, setUnreadCount] = useState<number>(0)
  const [loading, setLoading] = useState<boolean>(false)
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({})
  const [confirmDeleteAllOpen, setConfirmDeleteAllOpen] = useState(false)
  const [deletingAll, setDeletingAll] = useState(false)

  const isOpen = Boolean(anchorEl)

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true)
      const data = await notificationApi.listNotifications({
        limit: 50,
      })
      setNotifications(data.items || [])
      setUnreadCount(data.unreadCount || 0)
    } catch (err) {
      console.error('Failed to fetch notifications', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchUnreadCountOnly = useCallback(async () => {
    try {
      const data = await notificationApi.getUnreadCount()
      setUnreadCount(data.unreadCount || 0)
    } catch (err) {
      console.error('Failed to fetch unread count', err)
    }
  }, [])

  // Initial mount fetch
  useEffect(() => {
    fetchUnreadCountOnly()
  }, [fetchUnreadCountOnly])

  // Live WebSocket update on notification receipt or sync
  useSocketSync('notifications', () => {
    fetchUnreadCountOnly()
    if (isOpen) {
      fetchNotifications()
    }
  })

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
    fetchNotifications()
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const handleMarkAsRead = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    setActionLoading((prev) => ({ ...prev, [id]: true }))
    try {
      await notificationApi.markAsRead(id)
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n))
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch (err) {
      console.error('Failed to mark notification read', err)
    } finally {
      setActionLoading((prev) => ({ ...prev, [id]: false }))
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await notificationApi.markAllAsRead()
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true, readAt: new Date().toISOString() }))
      )
      setUnreadCount(0)
      toast.success('All marked as read')
    } catch (err) {
      console.error('Failed to mark all notifications read', err)
    }
  }

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    setActionLoading((prev) => ({ ...prev, [id]: true }))
    try {
      await notificationApi.deleteNotification(id)
      const deletedItem = notifications.find((n) => n.id === id)
      if (deletedItem && !deletedItem.isRead) {
        setUnreadCount((prev) => Math.max(0, prev - 1))
      }
      setNotifications((prev) => prev.filter((n) => n.id !== id))
    } catch (err) {
      console.error('Failed to delete notification', err)
    } finally {
      setActionLoading((prev) => ({ ...prev, [id]: false }))
    }
  }

  const handleDeleteAllConfirm = async () => {
    setDeletingAll(true)
    try {
      await notificationApi.deleteAll()
      setNotifications([])
      setUnreadCount(0)
      toast.success('All notifications deleted')
      setConfirmDeleteAllOpen(false)
      handleClose()
    } catch {
      toast.error('Failed to delete notifications')
    } finally {
      setDeletingAll(false)
    }
  }

  const handleItemClick = async (notif: NotificationItem) => {
    if (!notif.isRead) {
      try {
        await notificationApi.markAsRead(notif.id)
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
        )
        setUnreadCount((prev) => Math.max(0, prev - 1))
      } catch {
        // ignore
      }
    }
    handleClose()
    if (notif.link) {
      navigate(notif.link)
    }
  }

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'LEAVE_SUBMITTED':
        return <BeachAccessIcon color="warning" sx={{ fontSize: 20 }} />
      case 'LEAVE_STAGE_APPROVED':
        return <CheckCircleIcon color="info" sx={{ fontSize: 20 }} />
      case 'LEAVE_APPROVED':
        return <CheckCircleIcon color="success" sx={{ fontSize: 20 }} />
      case 'LEAVE_REJECTED':
        return <CancelIcon color="error" sx={{ fontSize: 20 }} />
      case 'HOLIDAY_ADDED':
        return <CelebrationIcon color="secondary" sx={{ fontSize: 20 }} />
      case 'MANAGER_NUDGE':
        return <NotificationsActiveIcon color="warning" sx={{ fontSize: 20 }} />
      default:
        return <NotificationsIcon color="primary" sx={{ fontSize: 20 }} />
    }
  }

  // Filter items based on active tab
  const displayedNotifications =
    activeTab === 'UNREAD'
      ? notifications.filter((n) => !n.isRead)
      : notifications

  return (
    <>
      <Tooltip title="Notifications">
        <IconButton
          color="inherit"
          onClick={handleOpen}
          aria-label="Notifications"
          sx={{
            p: 1,
            position: 'relative',
          }}
        >
          <Badge badgeContent={unreadCount} color="error" max={99}>
            <NotificationsIcon />
          </Badge>
        </IconButton>
      </Tooltip>

      <Popover
        open={isOpen}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{
          sx: {
            width: { xs: 340, sm: 400 },
            maxHeight: 520,
            borderRadius: 2.5,
            boxShadow: '0 10px 32px rgba(0,0,0,0.14)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          },
        }}
      >
        {/* Header */}
        <Box sx={{ p: 2, pb: 1.5, bgcolor: 'background.paper' }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography variant="subtitle1" fontWeight={700}>
                Notifications
              </Typography>
              {unreadCount > 0 && (
                <Chip
                  label={`${unreadCount} new`}
                  size="small"
                  color="error"
                  sx={{ height: 20, fontSize: '0.6875rem', fontWeight: 700 }}
                />
              )}
            </Stack>

            <Stack direction="row" spacing={0.75} alignItems="center">
              {unreadCount > 0 && (
                <Tooltip title="Mark all as read">
                  <IconButton
                    size="small"
                    onClick={handleMarkAllAsRead}
                    aria-label="Mark all as read"
                    sx={{
                      p: 0.75,
                      borderRadius: 1.5,
                      color: 'primary.main',
                      bgcolor: alpha(theme.palette.primary.main, 0.08),
                      '&:hover': {
                        bgcolor: alpha(theme.palette.primary.main, 0.16),
                      },
                    }}
                  >
                    <DoneAllIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </Tooltip>
              )}
              {notifications.length > 0 && (
                <Tooltip title="Delete all notifications">
                  <IconButton
                    size="small"
                    onClick={() => setConfirmDeleteAllOpen(true)}
                    aria-label="Delete all notifications"
                    sx={{
                      p: 0.75,
                      borderRadius: 1.5,
                      color: 'error.main',
                      bgcolor: alpha(theme.palette.error.main, 0.08),
                      '&:hover': {
                        bgcolor: alpha(theme.palette.error.main, 0.16),
                      },
                    }}
                  >
                    <DeleteSweepIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </Tooltip>
              )}
            </Stack>
          </Stack>

          <Tabs
            value={activeTab}
            onChange={(_, val) => setActiveTab(val)}
            variant="fullWidth"
            sx={{
              minHeight: 32,
              '& .MuiTab-root': {
                minHeight: 32,
                py: 0.5,
                fontSize: '0.8125rem',
                fontWeight: 600,
                textTransform: 'none',
              },
            }}
          >
            <Tab label="All" value="ALL" />
            <Tab label={`Unread (${unreadCount})`} value="UNREAD" />
          </Tabs>
        </Box>

        <Divider />

        {/* Content List */}
        <Box sx={{ flex: 1, overflowY: 'auto', p: 0 }}>
          {loading ? (
            <Box sx={{ py: 6, display: 'flex', justifyContent: 'center' }}>
              <CircularProgress size={28} />
            </Box>
          ) : displayedNotifications.length === 0 ? (
            <Box sx={{ py: 6, px: 3, textAlign: 'center' }}>
              <NotificationsIcon sx={{ fontSize: 44, color: 'text.disabled', mb: 1, opacity: 0.5 }} />
              <Typography variant="body2" fontWeight={600} color="text.secondary">
                {activeTab === 'UNREAD' ? 'No unread notifications' : 'No notifications yet'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {activeTab === 'UNREAD'
                  ? "You've read all your notifications."
                  : "You're all caught up with leave and company updates."}
              </Typography>
            </Box>
          ) : (
            <List disablePadding>
              {displayedNotifications.map((item) => {
                const isProcessing = actionLoading[item.id]
                return (
                  <ListItem
                    key={item.id}
                    onClick={() => handleItemClick(item)}
                    sx={{
                      py: 1.5,
                      px: 2,
                      alignItems: 'flex-start',
                      cursor: 'pointer',
                      borderBottom: `1px solid ${theme.palette.divider}`,
                      bgcolor: item.isRead
                        ? 'transparent'
                        : alpha(theme.palette.primary.main, 0.04),
                      transition: 'background-color 0.15s ease',
                      '&:hover': {
                        bgcolor: item.isRead
                          ? alpha(theme.palette.primary.main, 0.04)
                          : alpha(theme.palette.primary.main, 0.08),
                      },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 32, mt: 0.25 }}>
                      {getNotificationIcon(item.type)}
                    </ListItemIcon>

                    <ListItemText
                      primary={
                        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
                          <Typography
                            variant="body2"
                            fontWeight={item.isRead ? 600 : 700}
                            color={item.isRead ? 'text.primary' : 'primary.main'}
                            sx={{ lineHeight: 1.3 }}
                          >
                            {item.title}
                          </Typography>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ whiteSpace: 'nowrap', fontSize: '0.6875rem' }}
                          >
                            {dayjs(item.createdAt).fromNow()}
                          </Typography>
                        </Stack>
                      }
                      secondary={
                        <Box sx={{ mt: 0.5 }}>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ display: 'block', lineHeight: 1.4 }}
                          >
                            {item.message}
                          </Typography>
                          <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ mt: 1 }}>
                            {!item.isRead && (
                              <Tooltip title="Mark as read">
                                <IconButton
                                  size="small"
                                  disabled={isProcessing}
                                  onClick={(e) => handleMarkAsRead(e, item.id)}
                                  sx={{ p: 0.5 }}
                                >
                                  <CheckIcon sx={{ fontSize: 16 }} />
                                </IconButton>
                              </Tooltip>
                            )}
                            <Tooltip title="Delete">
                              <IconButton
                                size="small"
                                disabled={isProcessing}
                                onClick={(e) => handleDelete(e, item.id)}
                                sx={{
                                  p: 0.5,
                                  color: 'text.secondary',
                                  '&:hover': { color: 'error.main' },
                                }}
                              >
                                <DeleteOutlineIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </Box>
                      }
                    />
                  </ListItem>
                )
              })}
            </List>
          )}
        </Box>
      </Popover>

      {/* ─── Confirm Delete All Dialog ─── */}
      <Dialog
        open={confirmDeleteAllOpen}
        onClose={() => !deletingAll && setConfirmDeleteAllOpen(false)}
        PaperProps={{ sx: { borderRadius: 3, p: 1, maxWidth: 400 } }}
      >
        <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>Delete All Notifications?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            This will permanently remove all notifications from your account history. This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, pt: 1, gap: 1 }}>
          <Button
            variant="outlined"
            onClick={() => setConfirmDeleteAllOpen(false)}
            disabled={deletingAll}
            sx={{ borderRadius: 2 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteAllConfirm}
            disabled={deletingAll}
            startIcon={deletingAll ? <CircularProgress size={14} color="inherit" /> : <DeleteSweepIcon sx={{ fontSize: 16 }} />}
            sx={{ borderRadius: 2, fontWeight: 700 }}
          >
            {deletingAll ? 'Deleting...' : 'Delete All'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
