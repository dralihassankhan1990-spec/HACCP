import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  AlertTriangle, 
  CheckCircle2, 
  X, 
  Clock, 
  User, 
  Shield,
  Briefcase,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Notification {
  id: string;
  type: 'critical' | 'warning' | 'success' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  role: string;
  actionRequired: boolean;
}

interface NotificationCenterProps {
  isDemoMode?: boolean;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ isDemoMode = false }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Simulate incoming notifications
  useEffect(() => {
    if (isDemoMode) {
      // Add demo notifications
      const demoNotifications: Notification[] = [
        {
          id: '1',
          type: 'critical',
          title: 'CCP-1A Temperature Breach',
          message: 'Pasteurization temperature dropped to 68.5°C - diversion valve activated',
          timestamp: new Date(Date.now() - 2 * 60 * 1000),
          role: 'QC Operator',
          actionRequired: true
        },
        {
          id: '2',
          type: 'warning',
          title: 'Batch Hold Required',
          message: 'BATCH-402 placed on hold pending quality verification',
          timestamp: new Date(Date.now() - 5 * 60 * 1000),
          role: 'Production Manager',
          actionRequired: true
        },
        {
          id: '3',
          type: 'info',
          title: 'CAPA Initiated',
          message: 'Corrective action plan created for deviation #CAPA-2024-001',
          timestamp: new Date(Date.now() - 10 * 60 * 1000),
          role: 'Quality Manager',
          actionRequired: false
        }
      ];
      
      setNotifications(demoNotifications);
      setUnreadCount(demoNotifications.filter(n => n.actionRequired).length);
    }
  }, [isDemoMode]);

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'critical':
        return <AlertTriangle className="w-4 h-4" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4" />;
      case 'success':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'info':
        return <Bell className="w-4 h-4" />;
    }
  };

  const getNotificationColor = (type: Notification['type']) => {
    switch (type) {
      case 'critical':
        return 'bg-haccp-critical-950/80 border-haccp-critical-700 text-haccp-critical-300';
      case 'warning':
        return 'bg-haccp-warm-950/80 border-haccp-warm-700 text-haccp-warm-300';
      case 'success':
        return 'bg-haccp-950/80 border-haccp-700 text-haccp-300';
      case 'info':
        return 'bg-haccp-teal-950/80 border-haccp-teal-700 text-haccp-teal-300';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'QC Operator':
        return <User className="w-3 h-3" />;
      case 'Production Manager':
        return <Briefcase className="w-3 h-3" />;
      case 'Quality Manager':
        return <Shield className="w-3 h-3" />;
      default:
        return <User className="w-3 h-3" />;
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg bg-haccp-surface-800 hover:bg-haccp-surface-700 text-haccp-surface-400 hover:text-haccp-surface-100 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-haccp-critical-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 top-12 w-80 bg-haccp-surface-900 border border-haccp-surface-800 rounded-xl shadow-[0_20px_40px_-10px_rgba(0,0,0,0.5)] overflow-hidden z-50"
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-haccp-surface-800 flex items-center justify-between bg-haccp-surface-950">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-haccp-400" />
                <span className="text-sm font-bold text-haccp-surface-50">Notifications</span>
                {unreadCount > 0 && (
                  <span className="text-xs bg-haccp-critical-500 text-white px-2 py-0.5 rounded-full">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded hover:bg-haccp-surface-800 text-haccp-surface-400 hover:text-haccp-surface-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Notifications List */}
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="w-8 h-8 text-haccp-surface-600 mx-auto mb-2" />
                  <p className="text-sm text-haccp-surface-400">No notifications</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`p-4 border-b border-haccp-surface-800 hover:bg-haccp-surface-800/50 transition-colors cursor-pointer ${getNotificationColor(notification.type)}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${getNotificationColor(notification.type)}`}>
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold text-haccp-surface-50">
                            {notification.title}
                          </span>
                          {notification.actionRequired && (
                            <span className="text-[9px] bg-haccp-critical-500 text-white px-1.5 py-0.2 rounded">
                              Action Required
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-haccp-surface-300 mb-2 line-clamp-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center gap-2 text-[10px] text-haccp-surface-500">
                          <div className="flex items-center gap-1">
                            {getRoleIcon(notification.role)}
                            <span>{notification.role}</span>
                          </div>
                          <span>•</span>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{formatTime(notification.timestamp)}</span>
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-haccp-surface-600 flex-shrink-0" />
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-2 border-t border-haccp-surface-800 bg-haccp-surface-950">
              <button className="w-full text-xs text-haccp-surface-400 hover:text-haccp-surface-200 transition-colors py-1">
                Mark all as read
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};