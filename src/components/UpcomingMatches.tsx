import React, { useEffect, useState } from 'react';
import { Calendar, Clock } from 'lucide-react';

interface Match {
  fecha: string;
  hora: string;
  oponente: string;
  local: boolean;
  resultado?: string;
}

const matches: Match[] = [
  {"fecha": "2025-04-05", "hora": "16:30", "oponente": "Forge FC", "local": false, "resultado": "0-1"},
  {"fecha": "2025-04-17", "hora": "19:00", "oponente": "Vancouver FC", "local": true, "resultado": "1-1"},
  {"fecha": "2025-04-26", "hora": "17:00", "oponente": "Atlético Ottawa", "local": true, "resultado": "2-0"},
  {"fecha": "2025-05-02", "hora": "20:00", "oponente": "York United FC", "local": false, "resultado": "1-2"},
  {"fecha": "2025-05-10", "hora": "16:30", "oponente": "HFX Wanderers FC", "local": false, "resultado": "0-2"},
  {"fecha": "2025-05-17", "hora": "17:00", "oponente": "Pacific FC", "local": true, "resultado": "1-1"},
  {"fecha": "2025-05-25", "hora": "17:00", "oponente": "Valour FC", "local": true, "resultado": "2-0"},
  {"fecha": "2025-05-31", "hora": "16:00", "oponente": "Forge FC", "local": false, "resultado": "1-2"},
  {"fecha": "2025-06-08", "hora": "18:00", "oponente": "York United FC", "local": true, "resultado": "3-0"},
  {"fecha": "2025-06-14", "hora": "15:00", "oponente": "HFX Wanderers FC", "local": false, "resultado": "0-2"},
  {"fecha": "2025-06-21", "hora": "18:00", "oponente": "Pacific FC", "local": true, "resultado": "1-1"},
  {"fecha": "2025-06-28", "hora": "18:00", "oponente": "Atlético Ottawa", "local": true, "resultado": "2-0"},
  {"fecha": "2025-07-13", "hora": "21:00", "oponente": "Vancouver FC", "local": false},
  {"fecha": "2025-07-20", "hora": "15:00", "oponente": "Valour FC", "local": false},
  {"fecha": "2025-07-26", "hora": "17:00", "oponente": "York United FC", "local": true},
  {"fecha": "2025-07-29", "hora": "20:00", "oponente": "Valour FC", "local": false},
  {"fecha": "2025-08-04", "hora": "18:00", "oponente": "Pacific FC", "local": false},
  {"fecha": "2025-08-09", "hora": "17:00", "oponente": "HFX Wanderers FC", "local": true},
  {"fecha": "2025-08-17", "hora": "18:00", "oponente": "Vancouver FC", "local": true},
  {"fecha": "2025-08-23", "hora": "19:00", "oponente": "Atlético Ottawa", "local": false},
  {"fecha": "2025-08-30", "hora": "16:00", "oponente": "Forge FC", "local": true},
  {"fecha": "2025-09-05", "hora": "19:30", "oponente": "York United FC", "local": false},
  {"fecha": "2025-09-13", "hora": "16:00", "oponente": "HFX Wanderers FC", "local": true},
  {"fecha": "2025-09-20", "hora": "18:00", "oponente": "Valour FC", "local": true},
  {"fecha": "2025-09-27", "hora": "13:00", "oponente": "Atlético Ottawa", "local": false},
  {"fecha": "2025-10-05", "hora": "18:00", "oponente": "Pacific FC", "local": false},
  {"fecha": "2025-10-10", "hora": "21:00", "oponente": "Forge FC", "local": true},
  {"fecha": "2025-10-18", "hora": "16:00", "oponente": "Vancouver FC", "local": false}
];

const UpcomingMatches: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [visibleMatches, setVisibleMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Update current time every second
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Get upcoming matches (matches that haven't happened yet)
    const now = new Date();
    const upcoming = matches.filter(match => {
      const matchDate = new Date(`${match.fecha}T${match.hora}:00`);
      return matchDate > now;
    });

    // Take the next 5 matches
    setVisibleMatches(upcoming.slice(0, 5));
    setLoading(false);
  }, [currentTime]);

  const getCountdown = (matchDate: Date) => {
    const diff = matchDate.getTime() - currentTime.getTime();
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    if (days > 0) {
      return `${days}d ${hours}h`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  };

  if (loading) {
    return (
      <div className="card p-6">
        <h3 className="font-bold text-lg mb-4">Upcoming Matches</h3>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border-l-4 border-gray-700 pl-3 py-2">
              <div className="h-6 bg-gray-700 rounded w-2/3 mb-2"></div>
              <div className="h-4 bg-gray-700 rounded w-1/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="card p-6">
      <h3 className="font-bold text-lg mb-4">Upcoming Matches</h3>
      <div className="space-y-4">
        {visibleMatches.length === 0 ? (
          <p className="text-text-secondary text-center py-4">No upcoming matches scheduled</p>
        ) : (
          visibleMatches.map((match, index) => {
            const matchDate = new Date(`${match.fecha}T${match.hora}:00`);
            const countdown = getCountdown(matchDate);
            
            return (
              <div 
                key={index}
                className={`border-l-4 ${
                  match.local ? 'border-green-500' : 'border-red-500'
                } pl-3 py-2`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">
                      {match.local ? 'vs' : '@'} {match.oponente}
                    </p>
                    <div className="flex items-center text-text-secondary text-sm mt-1">
                      <Calendar className="h-4 w-4 mr-1" />
                      <span>
                        {matchDate.toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                      <span className="mx-2">•</span>
                      <Clock className="h-4 w-4 mr-1" />
                      <span>{match.hora}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <div className="flex items-center gap-1">
                      <span className="text-sm text-text-secondary">
                      {match.resultado ? (
                        <div className="text-right">
                          <div className="text-sm text-text-secondary">Result</div>
                          <div className={`font-bold text-lg ${
                            match.local ? 'text-green-500' : 'text-red-500'
                          }`}>
                            {match.resultado}
                          </div>
                        </div>
                      ) : (
                        <div className="text-xs font-mono text-text-secondary">
                          {countdown}
                        </div>
                      )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default UpcomingMatches;