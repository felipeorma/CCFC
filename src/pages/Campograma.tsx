import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Download, Image as ImageIcon, X, User, Building2, Hash, Trophy, Plus, Edit, Trash } from 'lucide-react';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { toPng } from 'html-to-image';

interface PlayerData {
  name: string;
  team: string;
  age: number;
}

interface Position {
  id: string;
  x: number;
  y: number;
  players: PlayerData[];
}

const positions: Position[] = [
  { id: 'GK', x: 50, y: 90, players: [] },  // Adjusted Y position for GK
  { id: 'LCB', x: 35, y: 85, players: [] },
  { id: 'RCB', x: 65, y: 85, players: [] },
  { id: 'LB', x: 20, y: 75, players: [] },
  { id: 'RB', x: 80, y: 75, players: [] },
  { id: 'LCM', x: 35, y: 50, players: [] },
  { id: 'RCM', x: 65, y: 50, players: [] },
  { id: 'CAM', x: 50, y: 30, players: [] }, // Moved up from 35 to 30 to avoid overlap with ST
  { id: 'LW', x: 20, y: 25, players: [] },
  { id: 'RW', x: 80, y: 25, players: [] },
  { id: 'ST', x: 50, y: 10, players: [] }  // Moved up from 15 to 10 to avoid overlap with CAM
];

const PlayerCampogram: React.FC = () => {
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [formationData, setFormationData] = useState<Position[]>(positions);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<string>('');
  const [newPlayer, setNewPlayer] = useState<PlayerData>({
    name: '',
    team: '',
    age: 0
  });
  const [editMode, setEditMode] = useState(false);
  const [editPlayerIndex, setEditPlayerIndex] = useState<number>(-1);
  const formationRef = useRef<HTMLDivElement>(null);
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap';
    link.rel = 'stylesheet';
    
    link.onload = () => {
      setFontsLoaded(true);
    };

    document.head.appendChild(link);

    return () => {
      document.head.removeChild(link);
    };
  }, []);

  const downloadFormation = async () => {
    if (formationRef.current && fontsLoaded) {
      try {
        const dataUrl = await toPng(formationRef.current, {
          quality: 0.95,
          fontEmbedCSS: window.getComputedStyle(document.body).fontFamily
        });
        const link = document.createElement('a');
        link.download = 'formation.png';
        link.href = dataUrl;
        link.click();
      } catch (err) {
        console.error('Error downloading formation:', err);
      }
    }
  };

  const handlePlayerAdd = (positionId: string) => {
    // Check if position already has 3 players
    const position = formationData.find(p => p.id === positionId);
    if (position && position.players.length >= 3) {
      alert('Maximum 3 players allowed per position');
      return;
    }
    
    setSelectedPosition(positionId);
    setNewPlayer({
      name: '',
      team: '',
      age: 0
    });
    setEditMode(false);
    setEditPlayerIndex(-1);
    setDialogOpen(true);
  };

  const handlePlayerEdit = (positionId: string, playerIndex: number) => {
    const position = formationData.find(p => p.id === positionId);
    if (position && position.players[playerIndex]) {
      setSelectedPosition(positionId);
      setNewPlayer({...position.players[playerIndex]});
      setEditMode(true);
      setEditPlayerIndex(playerIndex);
      setDialogOpen(true);
    }
  };

  const handlePlayerSave = () => {
    if (newPlayer.name && newPlayer.team) {
      if (editMode && editPlayerIndex >= 0) {
        // Update existing player
        setFormationData(prev => prev.map(pos => 
          pos.id === selectedPosition 
            ? { 
                ...pos, 
                players: pos.players.map((p, idx) => 
                  idx === editPlayerIndex ? newPlayer : p
                ) 
              }
            : pos
        ));
      } else {
        // Add new player
        setFormationData(prev => prev.map(pos => 
          pos.id === selectedPosition 
            ? { ...pos, players: [...pos.players, newPlayer] }
            : pos
        ));
      }
      setDialogOpen(false);
    }
  };

  const handlePlayerRemove = (positionId: string, playerIndex: number) => {
    setFormationData(prev => prev.map(pos => 
      pos.id === positionId 
        ? {
            ...pos,
            players: pos.players.filter((_, idx) => idx !== playerIndex)
          }
        : pos
    ));
  };

  return (
    <div className="space-y-8">
      <div className="bg-background-light rounded-lg shadow-lg border border-background-lighter p-6">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <Trophy className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-text-primary">Player Campogram</h2>
          </div>
          <Button 
            onClick={downloadFormation} 
            variant="outline" 
            className="hover:bg-primary/10"
            disabled={!fontsLoaded}
          >
            <Download className="h-4 w-4 mr-2" />
            Download Formation
          </Button>
        </div>

        <div className="space-y-6">
          <div className="bg-background rounded-lg p-8 border border-background-lighter">
            <h3 className="text-lg font-semibold text-text-primary mb-8 flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              Formation Details
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-4">
                <Label className="text-text-primary font-medium text-lg">Title</Label>
                <div className="relative">
                  <Trophy className="absolute left-4 top-3.5 h-5 w-5 text-primary/60" />
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Best XI Chilean Premier League"
                    className="pl-12 py-3 text-lg bg-background border-background-lighter focus:border-primary text-text-primary"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <Label className="text-text-primary font-medium text-lg">Subtitle</Label>
                <div className="relative">
                  <Hash className="absolute left-4 top-3.5 h-5 w-5 text-primary/60" />
                  <Input
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    placeholder="GameWeek 5"
                    className="pl-12 py-3 text-lg bg-background border-background-lighter focus:border-primary text-text-primary"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <Label className="text-text-primary font-medium text-lg">Logo URL</Label>
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <ImageIcon className="absolute left-4 top-3.5 h-5 w-5 text-primary/60" />
                    <Input
                      value={logoUrl}
                      onChange={(e) => setLogoUrl(e.target.value)}
                      placeholder="https://example.com/logo.png"
                      className="pl-12 py-3 text-lg bg-background border-background-lighter focus:border-primary text-text-primary"
                    />
                  </div>
                  {logoUrl && (
                    <div className="h-12 w-12 rounded-lg bg-background border border-background-lighter p-1.5 flex items-center justify-center">
                      <img 
                        src={logoUrl} 
                        alt="Competition Logo" 
                        className="h-full w-full object-contain"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div 
            ref={formationRef}
            className="relative w-full aspect-[2/3] bg-[#0e1117] rounded-lg overflow-hidden"
            style={{
              backgroundImage: 'url(https://upload.wikimedia.org/wikipedia/commons/4/45/Football_field.svg)',
              backgroundSize: 'contain',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              opacity: 0.8
            }}
          >
            {(title || subtitle || logoUrl) && (
              <div className="absolute inset-x-0 top-0 bg-gradient-to-b from-[rgba(14,17,23,0.95)] to-transparent pt-6 pb-12 px-8">
                <div className="flex items-center gap-6">
                  {logoUrl && (
                    <div className="h-40 w-40 rounded-xl bg-white/10 backdrop-blur-sm p-3 shadow-lg border border-white/10">
                      <img 
                        src={logoUrl} 
                        alt="Competition Logo" 
                        className="h-full w-full object-contain"
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    {title && (
                      <h3 className="text-6xl font-bold text-white text-shadow-sm tracking-tight">
                        {title}
                      </h3>
                    )}
                    {subtitle && (
                      <p className="text-4xl text-white/90 text-shadow-sm mt-1 font-medium">
                        {subtitle}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {formationData.map(position => (
              <div
                key={position.id}
                className="absolute transform -translate-x-1/2"
                style={{
                  left: `${position.x}%`,
                  top: `${position.y}%`,
                  width: '220px'
                }}
              >
                {position.players.length === 0 ? (
                  <div className="flex flex-col items-center">
                    <div className="w-full px-2 py-1 bg-primary text-white text-xs font-bold rounded text-center mb-2">
                      {position.id}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full bg-black/60 backdrop-blur-sm hover:bg-black/70 transition-all border-white/40 text-white shadow-lg font-bold"
                      onClick={() => handlePlayerAdd(position.id)}
                    >
                      Add Player
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="w-full px-2 py-1 bg-primary text-white text-center mb-2 font-bold rounded">
                      {position.id}
                    </div>
                    {position.players.map((player, index) => (
                      <div
                        key={index}
                        className="bg-black/60 backdrop-blur-sm rounded-lg p-2 hover:bg-black/70 transition-all border border-white/40 shadow-lg"
                      >
                        <div className="flex flex-col items-center relative">
                          <div className="flex items-center justify-end w-full absolute top-0 right-0">
                            <div className="flex gap-1">
                              <button
                                className="h-4 w-4 flex items-center justify-center hover:bg-yellow-500/40 hover:text-yellow-500 text-white rounded-sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePlayerEdit(position.id, index);
                                }}
                              >
                                <Edit className="h-2.5 w-2.5" />
                              </button>
                              <button
                                className="h-4 w-4 flex items-center justify-center hover:bg-red-500/40 hover:text-red-500 text-white rounded-sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePlayerRemove(position.id, index);
                                }}
                              >
                                <Trash className="h-2.5 w-2.5" />
                              </button>
                            </div>
                          </div>
                          <span className="text-white text-xs font-bold truncate w-full text-center mt-1">
                            {player.name}
                          </span>
                          <div className="flex items-center justify-center gap-2">
                            <span className="text-white/80 text-xs truncate max-w-[100px] text-center">
                              {player.team}
                            </span>
                            <span className="text-white/80 text-xs">
                              {player.age} y/o
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {position.players.length < 3 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full h-5 bg-black/50 hover:bg-black/60 text-white hover:text-white border border-white/30 font-bold text-xs p-0"
                        onClick={() => handlePlayerAdd(position.id)}
                      >
                        <Plus className="h-2.5 w-2.5 mr-1" />
                        Add ({position.players.length}/3)
                      </Button>
                    )}
                  </div>
                )}
              </div>
            ))}

            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[rgba(14,17,23,0.95)] to-transparent pb-4 pt-12 px-6">
              <div className="flex flex-col items-end">
                <p className="text-white/90 text-shadow-sm text-sm font-medium">
                  By: Felipe Ormazabal
                </p>
                <div className="flex items-center gap-2 text-white/70 text-shadow-sm text-xs">
                  <span>Football Scout</span>
                  <span>•</span>
                  <span>Data Analyst</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-[#1A1D24] border border-[#2A2F3C]">
          <DialogHeader>
            <DialogTitle className="text-white font-semibold">
              {editMode ? 'Edit Player' : 'Add Player'} - {selectedPosition}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-white">Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 h-4 w-4 text-primary/60" />
                <Input
                  value={newPlayer.name}
                  onChange={(e) => setNewPlayer({ ...newPlayer, name: e.target.value })}
                  className="pl-9 bg-[#0e1117] border-[#2A2F3C] focus:border-primary text-white placeholder:text-gray-500"
                  placeholder="Player name"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-white">Age</Label>
              <div className="relative">
                <Hash className="absolute left-3 top-2.5 h-4 w-4 text-primary/60" />
                <Input
                  type="number"
                  value={newPlayer.age || ''}
                  onChange={(e) => setNewPlayer({ ...newPlayer, age: parseInt(e.target.value) || 0 })}
                  className="pl-9 bg-[#0e1117] border-[#2A2F3C] focus:border-primary text-white placeholder:text-gray-500"
                  placeholder="Player age"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-white">Team</Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-primary/60" />
                <Input
                  value={newPlayer.team}
                  onChange={(e) => setNewPlayer({ ...newPlayer, team: e.target.value })}
                  className="pl-9 bg-[#0e1117] border-[#2A2F3C] focus:border-primary text-white placeholder:text-gray-500"
                  placeholder="Team name"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <Button 
              variant="outline" 
              onClick={() => setDialogOpen(false)}
              className="bg-[#0e1117] text-white hover:bg-[#2A2F3C] border-[#2A2F3C]"
            >
              Cancel
            </Button>
            <Button 
              onClick={handlePlayerSave}
              className="bg-primary text-white hover:bg-primary/90"
              disabled={!newPlayer.name || !newPlayer.team}
            >
              {editMode ? 'Update Player' : 'Add Player'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default PlayerCampogram;