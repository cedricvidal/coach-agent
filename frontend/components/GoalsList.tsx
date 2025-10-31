'use client';

import { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { getGoals, createGoal, updateGoal, setAuthToken } from '@/lib/api';

interface Goal {
  id: string;
  title: string;
  description?: string;
  status: string;
  targetDate?: string;
  createdAt: string;
  updatedAt: string;
}

export default function GoalsList() {
  const { getAccessTokenSilently } = useAuth0();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    targetDate: '',
  });

  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = async () => {
    try {
      const token = await getAccessTokenSilently();
      setAuthToken(token);
      const data = await getGoals();
      setGoals(data);
    } catch (error) {
      console.error('Error loading goals:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoal.title.trim()) return;

    try {
      const token = await getAccessTokenSilently();
      setAuthToken(token);
      await createGoal(newGoal);
      setNewGoal({ title: '', description: '', targetDate: '' });
      setShowCreateForm(false);
      await loadGoals();
    } catch (error) {
      console.error('Error creating goal:', error);
      alert('Failed to create goal');
    }
  };

  const handleUpdateStatus = async (goalId: string, newStatus: string) => {
    try {
      const token = await getAccessTokenSilently();
      setAuthToken(token);
      await updateGoal(goalId, { status: newStatus });
      await loadGoals();
    } catch (error) {
      console.error('Error updating goal:', error);
      alert('Failed to update goal');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return <div className="p-4 text-center">Loading goals...</div>;
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">My Goals</h2>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          {showCreateForm ? 'Cancel' : 'New Goal'}
        </button>
      </div>

      {showCreateForm && (
        <form onSubmit={handleCreateGoal} className="mb-6 p-4 border border-gray-300 rounded-lg">
          <div className="mb-3">
            <label className="block text-sm font-medium mb-1">Title</label>
            <input
              type="text"
              value={newGoal.title}
              onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div className="mb-3">
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={newGoal.description}
              onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>
          <div className="mb-3">
            <label className="block text-sm font-medium mb-1">Target Date</label>
            <input
              type="date"
              value={newGoal.targetDate}
              onChange={(e) => setNewGoal({ ...newGoal, targetDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create Goal
          </button>
        </form>
      )}

      <div className="space-y-4">
        {goals.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            No goals yet. Create your first goal to get started!
          </div>
        ) : (
          goals.map((goal) => (
            <div key={goal.id} className="p-4 border border-gray-300 rounded-lg hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-semibold">{goal.title}</h3>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(goal.status)}`}>
                  {goal.status}
                </span>
              </div>
              {goal.description && (
                <p className="text-gray-700 mb-3">{goal.description}</p>
              )}
              {goal.targetDate && (
                <p className="text-sm text-gray-500 mb-3">
                  Target: {new Date(goal.targetDate).toLocaleDateString()}
                </p>
              )}
              <div className="flex space-x-2">
                {goal.status === 'active' && (
                  <>
                    <button
                      onClick={() => handleUpdateStatus(goal.id, 'completed')}
                      className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                    >
                      Complete
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(goal.id, 'paused')}
                      className="px-3 py-1 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700 transition-colors"
                    >
                      Pause
                    </button>
                  </>
                )}
                {goal.status === 'paused' && (
                  <button
                    onClick={() => handleUpdateStatus(goal.id, 'active')}
                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                  >
                    Resume
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
