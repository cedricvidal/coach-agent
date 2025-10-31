'use client';

import { useAuth0 } from '@auth0/auth0-react';
import { useState, useEffect } from 'react';
import ChatInterface from '@/components/ChatInterface';
import GoalsList from '@/components/GoalsList';
import AccessDenied from '@/components/AccessDenied';
import { hasPermission } from '@/lib/permissions';

export default function Home() {
  const { isAuthenticated, isLoading, loginWithRedirect, logout, user, getAccessTokenSilently } = useAuth0();
  const [activeTab, setActiveTab] = useState<'chat' | 'goals'>('chat');
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);

  // Check for api:access permission when authenticated
  useEffect(() => {
    async function checkPermissions() {
      if (isAuthenticated) {
        try {
          const token = await getAccessTokenSilently();
          const hasApiAccess = hasPermission(token, 'api:access');
          setHasAccess(hasApiAccess);
        } catch (error) {
          console.error('Error checking permissions:', error);
          setHasAccess(false);
        }
      }
    }

    checkPermissions();
  }, [isAuthenticated, getAccessTokenSilently]);

  if (isLoading || (isAuthenticated && hasAccess === null)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center p-8 bg-white rounded-lg shadow-xl max-w-md">
          <h1 className="text-4xl font-bold mb-4 text-gray-900">Personal Coach AI</h1>
          <p className="text-gray-600 mb-8">
            Your AI-powered personal coach to help you set goals, track progress, and stay motivated.
          </p>
          <button
            onClick={() => loginWithRedirect()}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
          >
            Sign In to Get Started
          </button>
        </div>
      </div>
    );
  }

  // Check if user has api:access permission
  if (!hasAccess) {
    return <AccessDenied />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Personal Coach AI</h1>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-700">
              Welcome, <span className="font-semibold">{user?.name || user?.email}</span>
            </div>
            <button
              onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('chat')}
              className={`py-4 px-2 border-b-2 font-medium transition-colors ${
                activeTab === 'chat'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Chat
            </button>
            <button
              onClick={() => setActiveTab('goals')}
              className={`py-4 px-2 border-b-2 font-medium transition-colors ${
                activeTab === 'goals'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Goals
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto">
        <div className="h-full bg-white shadow-sm">
          {activeTab === 'chat' ? <ChatInterface /> : <GoalsList />}
        </div>
      </main>
    </div>
  );
}
