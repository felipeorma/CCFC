import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutGrid as Layout, BarChart3, Users, Settings, Calendar, Flag, Goal, Trophy, TrendingUp, Map, FileText, ArrowLeftRight, PieChart, Award, BarChart as ChartBar, ScatterChart, Gauge, Brain, Lock, Shield } from 'lucide-react';

const Sidebar: React.FC = () => {
  const location = useLocation();
  const { isAdmin } = useAuth();
  const isActive = (path: string) => location.pathname === path;

  const baseItem =
    'group relative flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all';
  const activeItem =
    'bg-red-50 text-red-900 shadow-sm ring-1 ring-red-100';
  const idleItem =
    'text-gray-800 hover:bg-gray-100 hover:shadow-sm';
  const disabledItem =
    'flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl text-gray-400 opacity-60 cursor-not-allowed';

  const LeftIndicator = ({ active }: { active: boolean }) => (
    <span
      className={`absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full transition-all ${
        active ? 'bg-red-500' : 'bg-transparent group-hover:bg-red-200'
      }`}
      aria-hidden
    />
  );

  const AppLogo = () => (
    <div className="flex items-center justify-center px-2 py-4">
      <img
        src="/Gemini_Generated_Image_2pj6ev2pj6ev2pj6.png"
        alt="Cavalry Football Center"
        className="w-full h-auto object-contain"
      />
    </div>
  );

  return (
    <div className="h-full flex flex-col bg-white text-gray-900 border-r border-gray-200">
      {/* Header con logo */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/75 border-b border-gray-200">
        <AppLogo />
      </div>

      <nav className="flex-1 py-4 overflow-y-auto">
        <ul className="space-y-1 px-2">

          <li>
            <Link to="/" className={`${baseItem} ${isActive('/') ? activeItem : idleItem}`}>
              <LeftIndicator active={isActive('/')} />
              <Layout className="h-5 w-5 text-red-600" />
              <span>Dashboard</span>
            </Link>
          </li>

          <li>
            <Link to="/schedule" className={`${baseItem} ${isActive('/schedule') ? activeItem : idleItem}`}>
              <LeftIndicator active={isActive('/schedule')} />
              <Calendar className="h-5 w-5 text-red-600" />
              <span>Schedule</span>
            </Link>
          </li>

          <li>
            <Link to="/season-analysis" className={`${baseItem} ${isActive('/season-analysis') ? activeItem : idleItem}`}>
              <LeftIndicator active={isActive('/season-analysis')} />
              <BarChart3 className="h-5 w-5 text-red-600" />
              <span>Quick Season Overview</span>
            </Link>
          </li>

          <li>
            <Link to="/analysis" className={`${baseItem} ${isActive('/analysis') ? activeItem : idleItem}`}>
              <LeftIndicator active={isActive('/analysis')} />
              <Brain className="h-5 w-5 text-red-600" />
              <span>Advanced Analysis</span>
            </Link>
          </li>

          <li>
            <Link to="/season-analysis/ppda" className={`${baseItem} ${isActive('/season-analysis/ppda') ? activeItem : idleItem}`}>
              <LeftIndicator active={isActive('/season-analysis/ppda')} />
              <Gauge className="h-5 w-5 text-red-600" />
              <span>PPDA</span>
            </Link>
          </li>

          <li>
            <Link to="/season-analysis/shots" className={`${baseItem} ${isActive('/season-analysis/shots') ? activeItem : idleItem}`}>
              <LeftIndicator active={isActive('/season-analysis/shots')} />
              <Goal className="h-5 w-5 text-red-600" />
              <span>Shots &amp; xG</span>
            </Link>
          </li>

          <li>
            <Link to="/season-analysis/team-play-comparison" className={`${baseItem} ${isActive('/season-analysis/team-play-comparison') ? activeItem : idleItem}`}>
              <LeftIndicator active={isActive('/season-analysis/team-play-comparison')} />
              <ChartBar className="h-5 w-5 text-red-600" />
              <span>Team Comparison</span>
            </Link>
          </li>

          <li>
            <Link to="/season-analysis/player-comparison" className={`${baseItem} ${isActive('/season-analysis/player-comparison') ? activeItem : idleItem}`}>
              <LeftIndicator active={isActive('/season-analysis/player-comparison')} />
              <ArrowLeftRight className="h-5 w-5 text-red-600" />
              <span>Player Comparison</span>
            </Link>
          </li>

          <li>
            <Link to="/season-analysis/team-rankings" className={`${baseItem} ${isActive('/season-analysis/team-rankings') ? activeItem : idleItem}`}>
              <LeftIndicator active={isActive('/season-analysis/team-rankings')} />
              <Trophy className="h-5 w-5 text-red-600" />
              <span>Team Rankings</span>
            </Link>
          </li>

          <li>
            <Link to="/player-rankings" className={`${baseItem} ${isActive('/player-rankings') ? activeItem : idleItem}`}>
              <LeftIndicator active={isActive('/player-rankings')} />
              <Award className="h-5 w-5 text-red-600" />
              <span>Player Rankings</span>
            </Link>
          </li>

          <li>
            <Link to="/season-analysis/scatter-plots" className={`${baseItem} ${isActive('/season-analysis/scatter-plots') ? activeItem : idleItem}`}>
              <LeftIndicator active={isActive('/season-analysis/scatter-plots')} />
              <TrendingUp className="h-5 w-5 text-red-600" />
              <span>Player Scatter</span>
            </Link>
          </li>

          <li>
            <Link to="/season-analysis/team-scatter-plot" className={`${baseItem} ${isActive('/season-analysis/team-scatter-plot') ? activeItem : idleItem}`}>
              <LeftIndicator active={isActive('/season-analysis/team-scatter-plot')} />
              <ScatterChart className="h-5 w-5 text-red-600" />
              <span>Team Scatter</span>
            </Link>
          </li>

          <li>
            <Link to="/scout-reports" className={`${baseItem} ${isActive('/scout-reports') ? activeItem : idleItem}`}>
              <LeftIndicator active={isActive('/scout-reports')} />
              <FileText className="h-5 w-5 text-red-600" />
              <span>Scout Reports</span>
            </Link>
          </li>

          <li>
            <Link to="/campograma" className={`${baseItem} ${isActive('/campograma') ? activeItem : idleItem}`}>
              <LeftIndicator active={isActive('/campograma')} />
              <Map className="h-5 w-5 text-red-600" />
              <span>Campogram</span>
            </Link>
          </li>

          {isAdmin() && (
            <>
              <li>
                <Link to="/settings" className={`${baseItem} ${isActive('/settings') ? activeItem : idleItem}`}>
                  <LeftIndicator active={isActive('/settings')} />
                  <Settings className="h-5 w-5 text-red-600" />
                  <span>Settings</span>
                </Link>
              </li>

              <li>
                <Link to="/user-management" className={`${baseItem} ${isActive('/user-management') ? activeItem : idleItem}`}>
                  <LeftIndicator active={isActive('/user-management')} />
                  <Shield className="h-5 w-5 text-red-600" />
                  <span>User Management</span>
                </Link>
              </li>
            </>
          )}

          <li className="h-24" />
        </ul>
      </nav>

      {/* Footer */}
      <div className="sticky bottom-0 left-0 right-0 p-3 border-t border-gray-200 bg-white/90 backdrop-blur">
        <div className="text-xs text-center">
          <p className="text-gray-900 font-medium">Felipe Ormazabal</p>
          <p className="text-gray-500">Soccer Data Analyst · Scout</p>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
