'use client';

import { motion } from 'framer-motion';
import { Settings, Database, Globe, Bell, Shield, ChevronRight } from 'lucide-react';

const settingsSections = [
  {
    icon: Database,
    title: 'Database',
    description: 'Configure your database connection settings',
    items: [
      { label: 'Host', value: process.env.DATABASE_HOST || 'localhost' },
      { label: 'Port', value: '5432' },
      { label: 'Schema', value: 'website_builder' },
    ],
  },
  {
    icon: Globe,
    title: 'Application',
    description: 'General application settings',
    items: [
      { label: 'App URL', value: 'http://localhost:7777' },
      { label: 'Environment', value: 'development' },
    ],
  },
  {
    icon: Bell,
    title: 'Notifications',
    description: 'Manage notification preferences',
    items: [
      { label: 'Email notifications', value: 'Enabled' },
      { label: 'Push notifications', value: 'Disabled' },
    ],
  },
  {
    icon: Shield,
    title: 'Security',
    description: 'Security and privacy settings',
    items: [
      { label: 'Two-factor auth', value: 'Not configured' },
      { label: 'Session timeout', value: '24 hours' },
    ],
  },
];

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.4,
      type: 'spring' as const,
      stiffness: 100,
    },
  }),
};

export default function SettingsPage() {
  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 mb-8"
        >
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-100 to-brand-50 flex items-center justify-center">
            <Settings className="w-6 h-6 text-brand-500" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Settings</h1>
            <p className="text-gray-600 font-light">Manage your application preferences</p>
          </div>
        </motion.div>

        {/* Settings Sections */}
        <div className="space-y-6">
          {settingsSections.map((section, index) => (
            <motion.div
              key={section.title}
              custom={index}
              initial="hidden"
              animate="visible"
              variants={cardVariants}
              className="bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-100 to-brand-50 flex items-center justify-center flex-shrink-0">
                    <section.icon className="w-5 h-5 text-brand-500" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-lg font-semibold text-gray-900">{section.title}</h2>
                    <p className="text-sm text-gray-600 font-light mb-4">{section.description}</p>
                    <div className="space-y-3">
                      {section.items.map((item) => (
                        <div
                          key={item.label}
                          className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer group"
                        >
                          <span className="text-sm text-gray-700 font-medium">{item.label}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">{item.value}</span>
                            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-brand-500 transition-colors" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Info Banner */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 p-6 bg-gradient-to-r from-brand-50 to-brand-100/50 rounded-2xl border border-brand-100"
        >
          <p className="text-sm text-brand-800">
            <strong className="font-semibold">Note:</strong> To configure database settings, edit the{' '}
            <code className="bg-brand-200/50 px-2 py-0.5 rounded-md font-mono text-brand-900">
              .env.local
            </code>{' '}
            file in your project root.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
