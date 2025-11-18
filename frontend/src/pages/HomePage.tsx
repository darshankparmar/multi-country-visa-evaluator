import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/common/Button'

interface FeatureCardProps {
  icon: string
  title: string
  description: string
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 text-center hover:shadow-lg transition-shadow">
      <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">{icon}</div>
      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm sm:text-base text-gray-600">{description}</p>
    </div>
  )
}

const HomePage: React.FC = () => {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8 sm:py-12 lg:py-16">
        <div className="max-w-4xl mx-auto text-center">
          {/* Hero Section */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 sm:mb-6 px-2">
            Multi-Country Visa Evaluation Tool
          </h1>
          <p className="text-base sm:text-lg lg:text-xl text-gray-600 mb-6 sm:mb-8 px-4">
            Get instant evaluation of your visa application chances for multiple countries
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mb-12 sm:mb-16 px-4">
            <Button onClick={() => navigate('/evaluation')} size="lg" className="w-full sm:w-auto">
              Start Evaluation
            </Button>
            {/* <Button onClick={() => navigate('/search')} variant="outline" size="lg" className="w-full sm:w-auto">
              Search Results
            </Button> */}
            <Button onClick={() => navigate('/partner-dashboard')} variant="outline" size="lg" className="w-full sm:w-auto">
              Partner Dashboard
            </Button>
            <Button onClick={() => navigate('/partner-api-guide')} variant="outline" size="lg" className="w-full sm:w-auto">
              Partner API Guide
            </Button>
          </div>
          
          {/* Feature Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 px-2">
            <FeatureCard 
              icon="🌍"
              title="Multiple Countries"
              description="Support for US, Ireland, Poland, France, Netherlands, Germany"
            />
            <FeatureCard 
              icon="⚡"
              title="Instant Results"
              description="Get your evaluation score and recommendations immediately"
            />
            <FeatureCard 
              icon="🔒"
              title="Secure & Private"
              description="Your documents and information are handled securely"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default HomePage
