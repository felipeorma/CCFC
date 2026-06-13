import React, { useState } from 'react';
import { Card } from '../components/ui/card';
import UpcomingMatches from '../components/UpcomingMatches';
import { useAuth } from '../context/AuthContext';

const Dashboard: React.FC = () => {
  const { user, isAdmin } = useAuth();

  return (
    <div className="p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="space-y-1">
          <p className="text-text-primary">
            Signed in as <span className="font-semibold">{user?.email || 'User'}</span>, and you are <span className="font-semibold">{isAdmin() ? 'Admin' : 'Visitor'}</span>
          </p>
          <p className="text-sm text-text-secondary italic">
            Data obtained from Wyscout, and platform created by Felipe Ormazabal
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Upcoming Matches</h2>
          <UpcomingMatches />
        </Card>

        <Card className="p-6 flex flex-col items-center justify-center">
          <div className="flex flex-col items-center">
            <img 
              src="https://upload.wikimedia.org/wikipedia/en/c/c2/Cavalry_FC_logo.svg" 
              alt="Cavalry FC Logo" 
              className="w-40 h-40 object-contain mb-4"
            />
            <h3 className="text-xl font-bold text-primary">Cavalry FC</h3>
            <p className="text-text-secondary mt-2">Canadian Premier League</p>
            <div className="mt-4 flex items-center gap-2 text-sm text-text-secondary">
              <span>Est. 2018</span>
              <span>•</span>
              <span>Calgary, Alberta</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;