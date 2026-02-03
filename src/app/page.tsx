'use client';

import { motion } from 'framer-motion';
import { Database, Zap, Palette, Code, ArrowRight } from 'lucide-react';
import AnimatedCard from '@/components/AnimatedCard';
import Link from 'next/link';

const features = [
  {
    icon: Database,
    title: 'Database Ready',
    description: 'Knex.js configured with PostgreSQL support and migrations ready to go.',
  },
  {
    icon: Zap,
    title: 'Framer Motion',
    description: 'Beautiful animations with Framer Motion for a polished user experience.',
  },
  {
    icon: Palette,
    title: 'Tailwind CSS',
    description: 'Utility-first CSS framework for rapid UI development.',
  },
  {
    icon: Code,
    title: 'TypeScript',
    description: 'Full TypeScript support with strict type checking enabled.',
  },
];

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              Full-Stack{' '}
              <span className="bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
                Next.js
              </span>{' '}
              App
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-8">
              A production-ready template with TypeScript, Tailwind CSS, Knex.js, Framer Motion, and
              Lucide icons.
            </p>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Link
                href="/users"
                className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium hover:opacity-90 transition-opacity"
              >
                View Users
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
              <Link
                href="/api/health"
                className="inline-flex items-center justify-center px-6 py-3 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                Check API Health
              </Link>
            </motion.div>
          </motion.div>
        </div>

        {/* Background gradient */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-blue-500/20 to-purple-600/20 rounded-full blur-3xl" />
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12"
          >
            Features
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <AnimatedCard key={feature.title} delay={index * 0.1}>
                <feature.icon className="w-10 h-10 text-blue-500 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">{feature.description}</p>
              </AnimatedCard>
            ))}
          </div>
        </div>
      </section>

      {/* API Endpoints Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12"
          >
            API Endpoints
          </motion.h2>
          <div className="max-w-2xl mx-auto">
            <AnimatedCard>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <code className="text-sm text-gray-800 dark:text-gray-200">GET /api/health</code>
                  <span className="text-xs text-green-500 font-medium">Health Check</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <code className="text-sm text-gray-800 dark:text-gray-200">GET /api/users</code>
                  <span className="text-xs text-blue-500 font-medium">List Users</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <code className="text-sm text-gray-800 dark:text-gray-200">POST /api/users</code>
                  <span className="text-xs text-yellow-500 font-medium">Create User</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <code className="text-sm text-gray-800 dark:text-gray-200">
                    GET /api/users/:id
                  </code>
                  <span className="text-xs text-blue-500 font-medium">Get User</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <code className="text-sm text-gray-800 dark:text-gray-200">
                    PUT /api/users/:id
                  </code>
                  <span className="text-xs text-orange-500 font-medium">Update User</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <code className="text-sm text-gray-800 dark:text-gray-200">
                    DELETE /api/users/:id
                  </code>
                  <span className="text-xs text-red-500 font-medium">Delete User</span>
                </div>
              </div>
            </AnimatedCard>
          </div>
        </div>
      </section>
    </div>
  );
}
