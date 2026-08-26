'use client';

import {
  Bell,
  CheckCircle2,
  ClipboardList,
  CreditCard,
  GraduationCap,
  XCircle,
  Clock3,
  Loader2,
} from 'lucide-react';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

type Notification = {
  id: number;
  type: string;
  title: string;
  message: string;
  application_id: number | null;
  is_read: boolean;
  created_at: string;
};

type NotificationResponse = {
  success: boolean;
  notifications: Notification[];
  unreadCount: number;
};

function getIcon(type: string) {
  switch (type) {
    case 'new_application':
      return <ClipboardList className="h-5 w-5 text-brand-green" />;

    case 'payment_approval':
      return <CreditCard className="h-5 w-5 text-brand-gold" />;

    case 'payment_approved':
      return <CheckCircle2 className="h-5 w-5 text-green-600" />;

    case 'payment_rejected':
      return <XCircle className="h-5 w-5 text-red-600" />;

    case 'application_approved':
      return <GraduationCap className="h-5 w-5 text-brand-green" />;

    default:
      return <Bell className="h-5 w-5 text-slate-500" />;
  }
}

function formatTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toLocaleString('en-KE', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function AdminNotifications() {
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const wrapperRef = useRef<HTMLDivElement>(null);

  async function loadNotifications() {
    try {
      const response = await fetch('/api/admin/notifications', {
        cache: 'no-store',
      });

      const result: NotificationResponse = await response.json();

      if (!response.ok || !result.success) {
        throw new Error('Unable to load notifications.');
      }

      setNotifications(result.notifications);
      setUnreadCount(result.unreadCount);
    } catch (error) {
      console.error('Notification loading error:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadNotifications();

    const interval = setInterval(() => {
      loadNotifications();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  async function markAsRead(notification: Notification) {
    try {
      await fetch('/api/admin/notifications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: notification.id,
        }),
      });

      setNotifications((current) =>
        current.map((item) =>
          item.id === notification.id
            ? { ...item, is_read: true }
            : item
        )
      );

      setUnreadCount((count) =>
        notification.is_read ? count : Math.max(0, count - 1)
      );

      setOpen(false);

      if (notification.application_id) {
        if (notification.type === 'payment_approval') {
          router.push('/admin/dashboard/payments');
        } else {
          router.push(
            `/admin/dashboard/applications/${notification.application_id}`
          );
        }
      }
    } catch (error) {
      console.error('Unable to mark notification as read:', error);
    }
  }

  async function markAllAsRead() {
    try {
      await fetch('/api/admin/notifications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          markAllRead: true,
        }),
      });

      setNotifications((current) =>
        current.map((item) => ({
          ...item,
          is_read: true,
        }))
      );

      setUnreadCount(0);
    } catch (error) {
      console.error('Unable to mark notifications as read:', error);
    }
  }

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-brand-green hover:text-brand-green"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />

        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-3 w-[380px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <h3 className="font-bold text-brand-dark">
                Notifications
              </h3>

              <p className="mt-0.5 text-xs text-slate-400">
                {unreadCount} unread
              </p>
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="text-xs font-bold text-brand-green hover:text-brand-gold"
              >
                Mark all as read
              </button>
            )}
          </div>

          <div className="max-h-[450px] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-brand-green" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <Bell className="mx-auto h-9 w-9 text-slate-200" />

                <p className="mt-3 text-sm font-semibold text-slate-500">
                  No notifications
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  New applications and payment requests will appear here.
                </p>
              </div>
            ) : (
              notifications.map((notification) => (
                <button
                  key={notification.id}
                  type="button"
                  onClick={() => markAsRead(notification)}
                  className={`flex w-full gap-3 border-b border-slate-100 px-5 py-4 text-left transition hover:bg-slate-50 ${
                    !notification.is_read
                      ? 'bg-brand-green/[0.03]'
                      : 'bg-white'
                  }`}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50">
                    {getIcon(notification.type)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p
                        className={`text-sm ${
                          notification.is_read
                            ? 'font-semibold text-slate-700'
                            : 'font-bold text-brand-dark'
                        }`}
                      >
                        {notification.title}
                      </p>

                      {!notification.is_read && (
                        <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-brand-green" />
                      )}
                    </div>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      {notification.message}
                    </p>

                    <p className="mt-2 text-[11px] font-medium text-slate-400">
                      {formatTime(notification.created_at)}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}