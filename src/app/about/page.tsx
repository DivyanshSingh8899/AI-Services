'use client'

import Navigation from '@/components/Navigation'
import { motion } from 'framer-motion'
import { Users, Target, Zap, Heart } from 'lucide-react'

export default function About() {
  const values = [
    {
      icon: Target,
      title: 'Our Mission',
      description: 'To make AI technology accessible and affordable for small businesses, helping them compete with larger enterprises.'
    },
    {
      icon: Users,
      title: 'Our Team',
      description: 'A passionate group of AI engineers, business strategists, and customer success specialists dedicated to your success.'
    },
    {
      icon: Zap,
      title: 'Innovation',
      description: 'Constantly evolving our AI solutions to meet the changing needs of modern businesses.'
    },
    {
      icon: Heart,
      title: 'Customer First',
      description: 'Your success is our success. We build long-term partnerships with every client.'
    }
  ]

  return (
    <div className="min-h-screen gradient-bg">
      <Navigation />
      
      {/* Hero Section */}
      <section className="pt-20 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6"
          >
            About{' '}
            <span className="gradient-text">AI Hub</span>
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto"
          >
            We're on a mission to democratize AI technology for small businesses, 
            making powerful automation tools accessible and affordable.
          </motion.p>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
              Our Story
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              Founded in 2023, AI Hub was born from a simple observation: while large corporations 
              were rapidly adopting AI technology, small businesses were being left behind due to 
              high costs and complexity.
            </p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="text-lg text-gray-600 leading-relaxed space-y-4"
          >
            <p>
              We started with a simple goal: create AI solutions that small businesses could actually 
              afford and implement without needing a team of data scientists. Our first product, the 
              AI Support Bot, was designed specifically for the needs of local shops, clinics, and 
              service providers.
            </p>
            <p>
              Today, we've helped hundreds of small businesses across India automate their customer 
              support, streamline operations, and increase revenue. Our approach remains the same: 
              simple, effective, and affordable AI solutions that work for real businesses.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Our Values
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              The principles that guide everything we do
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center mx-auto mb-6">
                  <value.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">{value.title}</h3>
                <p className="text-gray-600">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
              Join Our Team
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              We're always looking for passionate individuals who want to make AI accessible to everyone.
            </p>
            <p className="text-lg text-gray-600">
              If you're interested in joining our mission, send us a message at{' '}
              <a href="mailto:careers@aihub.com" className="text-blue-600 hover:text-blue-700 font-semibold">
                careers@aihub.com
              </a>
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
