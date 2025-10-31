'use client';

import { useAuth0 } from '@auth0/auth0-react';

export default function AccessDenied() {
  const { logout, user } = useAuth0();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-100">
      <div className="text-center p-8 bg-white rounded-lg shadow-xl max-w-md">
        <div className="mb-6">
          <svg
            className="mx-auto h-16 w-16 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        <h1 className="text-3xl font-bold mb-4 text-gray-900">Access Denied</h1>

        <p className="text-gray-600 mb-6">
          Your account does not have permission to access this application.
          Please contact the administrator to request access.
        </p>

        {user?.email && (
          <div className="mb-6 p-4 bg-gray-100 rounded-lg">
            <p className="text-sm text-gray-700">
              <span className="font-semibold">Account:</span> {user.email}
            </p>
          </div>
        )}

        <div className="space-y-3">
          <p className="text-sm text-gray-500">
            If you believe this is an error, please contact your administrator
            and provide them with your email address.
          </p>

          <button
            onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
            className="w-full px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-semibold"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
