import React, { useState } from 'react';
import { ScatterPlot } from '../components/ScatterPlot';
import { DataProvider } from '../context/DataContext';
import ErrorBoundary from '../components/ErrorBoundary';
import { AlertTriangle, RefreshCw, Bug, Database, Upload } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useNavigate } from 'react-router-dom';

const ScatterPlots: React.FC = () => {
  const [key, setKey] = useState(0);
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  const [errorDetails, setErrorDetails] = useState<{
    error: Error;
    info: React.ErrorInfo;
  } | null>(null);
  const navigate = useNavigate();

  const handleReset = () => {
    // Force re-mount the component by changing the key
    setKey(prevKey => prevKey + 1);
  };

  const navigateToSettings = () => {
    navigate('/settings');
  };

  const errorFallback = (
    <div className="space-y-8">
      <div className="bg-background-light rounded-lg shadow-lg border border-background-lighter p-6">
        <div className="flex items-center gap-4 mb-6">
          <AlertTriangle className="h-8 w-8 text-error" />
          <h2 className="text-2xl font-bold text-text-primary">Scatter Plot Error</h2>
        </div>
        
        <div className="bg-error/10 border border-error/30 rounded-lg p-6 text-error">
          <h3 className="text-lg font-semibold mb-2">The scatter plot visualization encountered an error</h3>
          <p className="mb-4">This could be due to invalid data or a problem with the visualization library.</p>
          
          {showDebugInfo && errorDetails && (
            <div className="bg-background/50 p-4 rounded-lg mb-4 text-sm font-mono">
              <h4 className="font-medium mb-2">Debug Information:</h4>
              <p>Error: {errorDetails.error.message}</p>
              <p>Browser: {navigator.userAgent}</p>
              <p>Viewport: {window.innerWidth}x{window.innerHeight}</p>
              <p>React Version: {React.version}</p>
              <p>Time: {new Date().toISOString()}</p>
            </div>
          )}
          
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2 bg-error/20 hover:bg-error/30 rounded-md text-sm font-medium transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Reset Visualization
            </button>
            
            <button
              onClick={() => setShowDebugInfo(!showDebugInfo)}
              className="flex items-center gap-2 px-4 py-2 bg-background/20 hover:bg-background/30 rounded-md text-sm font-medium transition-colors"
            >
              <Bug className="h-4 w-4" />
              {showDebugInfo ? 'Hide Debug Info' : 'Show Debug Info'}
            </button>
            
            <a
              href="https://github.com/reactchartjs/react-chartjs-2/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-background/20 hover:bg-background/30 rounded-md text-sm font-medium transition-colors"
            >
              <Database className="h-4 w-4" />
              Report Issue
            </a>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <DataProvider>
      <ErrorBoundary 
        fallback={errorFallback} 
        onReset={handleReset}
        componentName="Scatter Plot"
        onError={(error, info) => {
          console.error("ScatterPlot error:", error, info);
          setErrorDetails({ error, info });
        }}
      >
        <ScatterPlot key={key} />
      </ErrorBoundary>
    </DataProvider>
  );
};

export default ScatterPlots;