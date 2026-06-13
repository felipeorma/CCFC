import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import {
  FileText,
  Plus,
  Calendar,
  X,
  Edit2,
  Trash2,
  AlertTriangle,
  Trophy,
  User,
  MessageSquare,
  Download,
  Upload,
  Send,
  Cake
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';

interface ScoutReport {
  id: string;
  player_name: string;
  team: string;
  position: string | null;
  role: string | null;
  age: number | null;
  report_date: string;
  document_url: string | null;
  created_at: string;
  updated_at: string;
  created_by: string;
}

interface Comment {
  id: string;
  report_id: string;
  user_id: string;
  user_name: string;
  comment: string;
  rating: number;
  created_at: string;
  updated_at: string;
}

const ScoutReports: React.FC = () => {
  const { user, isAdmin } = useAuth();

  // State management
  const [scoutReports, setScoutReports] = useState<ScoutReport[]>([]);
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [selectedReport, setSelectedReport] = useState<ScoutReport | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [editingReport, setEditingReport] = useState<ScoutReport | null>(null);

  // Form data
  const [formData, setFormData] = useState({
    player_name: '',
    team: '',
    position: '',
    role: '',
    age: '',
    report_date: new Date().toISOString().split('T')[0]
  });

  // Comment form
  const [commentForm, setCommentForm] = useState({
    comment: '',
    rating: 5
  });

  // File upload
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchScoutReports();
  }, []);

  useEffect(() => {
    if (selectedReport) {
      fetchComments(selectedReport.id);
    }
  }, [selectedReport]);

  const fetchScoutReports = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('scout_reports')
        .select('*')
        .order('report_date', { ascending: false });

      if (error) throw error;
      setScoutReports(data || []);
    } catch (err: any) {
      console.error('Error fetching scout reports:', err);
      setError(`Failed to load scout reports: ${err.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async (reportId: string) => {
    try {
      const { data, error } = await supabase
        .from('scout_report_comments')
        .select('*')
        .eq('report_id', reportId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setComments(prev => ({ ...prev, [reportId]: data || [] }));
    } catch (err: any) {
      console.error('Error fetching comments:', err);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        setError('Only PDF files are allowed');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }
      setSelectedFile(file);
      setError(null);
    }
  };

  const uploadFileToSupabase = async (file: File): Promise<string> => {
    const fileName = `scout-reports/${Date.now()}-${file.name}`;

    const { data, error } = await supabase.storage
      .from('documents')
      .upload(fileName, file);

    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from('documents')
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAdmin()) {
      setError('Only admin users can manage scout reports');
      return;
    }

    try {
      setLoading(true);
      setUploading(true);
      setError(null);

      let documentUrl = '';

      if (selectedFile) {
        console.log('Uploading file:', selectedFile.name);
        documentUrl = await uploadFileToSupabase(selectedFile);
        console.log('File uploaded successfully:', documentUrl);
      } else if (editingReport) {
        documentUrl = editingReport.document_url || '';
      }

      const reportData = {
        player_name: formData.player_name,
        team: formData.team,
        position: formData.position || null,
        role: formData.role || null,
        age: formData.age ? parseInt(formData.age) : null,
        report_date: formData.report_date,
        document_url: documentUrl || null
      };

      console.log('Saving report with data:', reportData);

      if (editingReport) {
        const { data, error } = await supabase
          .from('scout_reports')
          .update(reportData)
          .eq('id', editingReport.id)
          .select();

        if (error) {
          console.error('Update error:', error);
          throw error;
        }
        console.log('Report updated:', data);
        setSuccess('Scout report updated successfully!');
      } else {
        const { data, error } = await supabase
          .from('scout_reports')
          .insert({
            ...reportData,
            created_by: user?.id
          })
          .select();

        if (error) {
          console.error('Insert error:', error);
          throw error;
        }
        console.log('Report created:', data);
        setSuccess('Scout report created successfully!');
      }

      resetForm();
      await fetchScoutReports();
    } catch (err: any) {
      console.error('Submit error:', err);
      setError(`Failed to save scout report: ${err.message || 'Unknown error'}. ${err.details || ''} ${err.hint || ''}`);
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedReport || !user) return;

    try {
      setError(null);

      // Get user's email from auth
      const { data: userData } = await supabase.auth.getUser();
      const userEmail = userData.user?.email || 'Unknown User';

      const { error } = await supabase
        .from('scout_report_comments')
        .insert({
          report_id: selectedReport.id,
          user_id: user.id,
          user_name: userEmail,
          comment: commentForm.comment,
          rating: commentForm.rating
        });

      if (error) throw error;

      setSuccess('Comment added successfully!');
      setCommentForm({ comment: '', rating: 5 });
      fetchComments(selectedReport.id);
    } catch (err: any) {
      setError(err.message || 'Failed to add comment');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      const { error } = await supabase
        .from('scout_report_comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;

      setSuccess('Comment deleted successfully!');
      if (selectedReport) {
        fetchComments(selectedReport.id);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete comment');
    }
  };

  const resetForm = () => {
    setFormData({
      player_name: '',
      team: '',
      position: '',
      role: '',
      age: '',
      report_date: new Date().toISOString().split('T')[0]
    });
    setSelectedFile(null);
    setShowUploadForm(false);
    setEditingReport(null);
  };

  const handleDelete = async (id: string) => {
    if (!isAdmin()) {
      setError('Only admin users can delete scout reports');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase
        .from('scout_reports')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setSuccess('Scout report deleted successfully!');
      setDeleteConfirm(null);
      fetchScoutReports();
    } catch (err: any) {
      setError(err.message || 'Failed to delete scout report');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (report: ScoutReport) => {
    setEditingReport(report);
    setFormData({
      player_name: report.player_name,
      team: report.team,
      position: report.position || '',
      role: report.role || '',
      age: report.age?.toString() || '',
      report_date: report.report_date
    });
    setSelectedFile(null);
    setShowUploadForm(true);
  };

  const getRatingColor = (rating: number) => {
    const percentage = (rating - 1) / 9;
    const hue = percentage * 120;
    return `hsl(${hue}, 70%, 50%)`;
  };

  const getAverageRating = (reportId: string) => {
    const reportComments = comments[reportId] || [];
    if (reportComments.length === 0) return null;
    const sum = reportComments.reduce((acc, c) => acc + c.rating, 0);
    return (sum / reportComments.length).toFixed(1);
  };

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="bg-background-light rounded-lg shadow-lg border border-background-lighter p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-text-primary">Scout Reports</h2>
          </div>

          {isAdmin() && (
            <Button
              onClick={() => {
                resetForm();
                setShowUploadForm(true);
              }}
              className="bg-primary text-white hover:bg-primary/90 flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Report
            </Button>
          )}
        </div>

        {/* Messages */}
        {error && (
          <div className="bg-error/10 border border-error/30 text-error px-4 py-3 rounded-lg mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-success/10 border border-success/30 text-success px-4 py-3 rounded-lg mb-4 flex items-center gap-2">
            <Trophy className="h-5 w-5 flex-shrink-0" />
            <p>{success}</p>
          </div>
        )}

        {/* Scout Reports List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : scoutReports.length === 0 ? (
          <div className="bg-background p-8 rounded-lg border border-border text-center">
            <FileText className="h-12 w-12 text-primary mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">No Scout Reports Available</h3>
            <p className="text-text-secondary mb-4">
              {isAdmin()
                ? 'Start by adding your first scout report using the "Add Report" button above.'
                : 'No scout reports have been uploaded yet.'}
            </p>
            {isAdmin() && (
              <Button
                onClick={() => {
                  resetForm();
                  setShowUploadForm(true);
                }}
                className="bg-primary text-white hover:bg-primary/90"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add First Report
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {scoutReports.map(report => {
              const avgRating = getAverageRating(report.id);
              const commentCount = comments[report.id]?.length || 0;

              return (
                <div
                  key={report.id}
                  className="bg-surface rounded-lg border border-border hover:border-primary transition-all cursor-pointer"
                  onClick={() => setSelectedReport(report)}
                >
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <User className="h-5 w-5 text-primary" />
                          <h3 className="text-xl font-bold">{report.player_name}</h3>
                          {avgRating && (
                            <div
                              className="px-3 py-1 rounded-full text-sm font-bold text-white"
                              style={{ backgroundColor: getRatingColor(parseFloat(avgRating)) }}
                            >
                              {avgRating}
                            </div>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-4 text-sm text-text-secondary">
                          <div className="flex items-center gap-2">
                            <Trophy className="h-4 w-4" />
                            <span>{report.team}</span>
                          </div>
                          {report.position && (
                            <div className="px-2 py-1 bg-primary/10 text-primary rounded-md font-medium">
                              {report.position}
                            </div>
                          )}
                          {report.role && (
                            <div className="px-2 py-1 bg-background rounded-md font-medium">
                              {report.role}
                            </div>
                          )}
                          {report.age && (
                            <div className="flex items-center gap-2">
                              <Cake className="h-4 w-4" />
                              <span>{report.age} years</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>{new Date(report.report_date).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>

                      {isAdmin() && (
                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(report)}
                            className="p-1 h-8 w-8"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>

                          {deleteConfirm === report.id ? (
                            <div className="flex items-center gap-1">
                              <Button
                                size="sm"
                                className="bg-error text-white hover:bg-error/90 h-8 px-2 text-xs"
                                onClick={() => handleDelete(report.id)}
                                disabled={loading}
                              >
                                Confirm
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setDeleteConfirm(null)}
                                className="h-8 px-2 text-xs"
                              >
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setDeleteConfirm(report.id)}
                              className="p-1 h-8 w-8 text-error"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-2 text-text-secondary">
                        <MessageSquare className="h-4 w-4" />
                        <span>{commentCount} {commentCount === 1 ? 'comment' : 'comments'}</span>
                      </div>

                      {report.document_url && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(report.document_url!, '_blank');
                          }}
                          className="flex items-center gap-2"
                        >
                          <Download className="h-4 w-4" />
                          Download PDF
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Upload/Edit Form Modal */}
      {showUploadForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-surface rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-border flex items-center justify-between sticky top-0 bg-surface z-10">
              <h2 className="text-lg font-bold">
                {editingReport ? 'Edit Scout Report' : 'Add Scout Report'}
              </h2>
              <button
                onClick={() => {
                  resetForm();
                  setError(null);
                }}
                className="p-1 hover:bg-background rounded-full"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <Label className="text-text-primary mb-2 block">Player Name *</Label>
                <input
                  type="text"
                  className="input-field"
                  value={formData.player_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, player_name: e.target.value }))}
                  placeholder="e.g., John Doe"
                  required
                />
              </div>

              <div>
                <Label className="text-text-primary mb-2 block">Team *</Label>
                <input
                  type="text"
                  className="input-field"
                  value={formData.team}
                  onChange={(e) => setFormData(prev => ({ ...prev, team: e.target.value }))}
                  placeholder="e.g., Cavalry FC"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-text-primary mb-2 block">Position *</Label>
                  <select
                    className="input-field"
                    value={formData.position}
                    onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                    required
                  >
                    <option value="">Select position</option>
                    <option value="GK">GK - Goalkeeper</option>
                    <option value="DEF">DEF - Defender</option>
                    <option value="MID">MID - Midfielder</option>
                    <option value="FWD">FWD - Forward</option>
                  </select>
                </div>

                <div>
                  <Label className="text-text-primary mb-2 block">Age</Label>
                  <input
                    type="number"
                    className="input-field"
                    value={formData.age}
                    onChange={(e) => setFormData(prev => ({ ...prev, age: e.target.value }))}
                    placeholder="e.g., 25"
                    min="15"
                    max="50"
                  />
                </div>
              </div>

              <div>
                <Label className="text-text-primary mb-2 block">Role / Playing Style</Label>
                <input
                  type="text"
                  className="input-field"
                  value={formData.role}
                  onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                  placeholder="e.g., Box-to-box midfielder, Target striker, Ball-playing defender"
                />
              </div>

              <div>
                <Label className="text-text-primary mb-2 block">Report Date *</Label>
                <input
                  type="date"
                  className="input-field"
                  value={formData.report_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, report_date: e.target.value }))}
                  required
                />
              </div>

              <div>
                <Label className="text-text-primary mb-2 block">Upload PDF Document</Label>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
                >
                  <Upload className="h-8 w-8 text-text-secondary mx-auto mb-2" />
                  <p className="text-text-secondary">
                    {selectedFile ? selectedFile.name : editingReport ? 'Click to replace PDF file' : 'Click to select PDF file'}
                  </p>
                  {selectedFile && (
                    <p className="text-xs text-text-secondary mt-1">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    resetForm();
                    setError(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-primary text-white hover:bg-primary/90"
                  disabled={loading || uploading}
                >
                  {uploading ? 'Uploading...' : loading ? 'Saving...' : editingReport ? 'Update Report' : 'Add Report'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Report Details & Comments Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-surface rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-border flex items-center justify-between sticky top-0 bg-surface z-10">
              <h2 className="text-lg font-bold">{selectedReport.player_name}</h2>
              <button
                onClick={() => {
                  setSelectedReport(null);
                  setCommentForm({ comment: '', rating: 5 });
                }}
                className="p-1 hover:bg-background rounded-full"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Player Info */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pb-6 border-b border-border">
                <div>
                  <span className="text-text-secondary text-sm">Team</span>
                  <p className="font-semibold">{selectedReport.team}</p>
                </div>
                {selectedReport.position && (
                  <div>
                    <span className="text-text-secondary text-sm">Position</span>
                    <p className="font-semibold">{selectedReport.position}</p>
                  </div>
                )}
                {selectedReport.role && (
                  <div>
                    <span className="text-text-secondary text-sm">Role</span>
                    <p className="font-semibold">{selectedReport.role}</p>
                  </div>
                )}
                {selectedReport.age && (
                  <div>
                    <span className="text-text-secondary text-sm">Age</span>
                    <p className="font-semibold">{selectedReport.age} years</p>
                  </div>
                )}
                <div>
                  <span className="text-text-secondary text-sm">Report Date</span>
                  <p className="font-semibold">{new Date(selectedReport.report_date).toLocaleDateString()}</p>
                </div>
                {selectedReport.document_url && (
                  <div>
                    <Button
                      size="sm"
                      onClick={() => window.open(selectedReport.document_url!, '_blank')}
                      className="bg-primary text-white hover:bg-primary/90 w-full"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download PDF
                    </Button>
                  </div>
                )}
              </div>

              {/* Add Comment Form */}
              <div className="bg-background p-4 rounded-lg">
                <h3 className="font-semibold mb-4">Add Your Evaluation</h3>
                <form onSubmit={handleCommentSubmit} className="space-y-4">
                  <div>
                    <Label className="text-text-primary mb-2 block">Your Rating (1-10)</Label>
                    <div className="flex items-center gap-4">
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={commentForm.rating}
                        onChange={(e) => setCommentForm(prev => ({ ...prev, rating: parseInt(e.target.value) }))}
                        className="flex-1"
                        style={{
                          background: `linear-gradient(to right, ${getRatingColor(1)}, ${getRatingColor(10)})`
                        }}
                      />
                      <div
                        className="px-4 py-2 rounded-lg text-lg font-bold text-white min-w-[60px] text-center"
                        style={{ backgroundColor: getRatingColor(commentForm.rating) }}
                      >
                        {commentForm.rating}
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label className="text-text-primary mb-2 block">Comment *</Label>
                    <textarea
                      className="input-field min-h-[100px]"
                      value={commentForm.comment}
                      onChange={(e) => setCommentForm(prev => ({ ...prev, comment: e.target.value }))}
                      placeholder="Share your evaluation of this player..."
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    className="bg-primary text-white hover:bg-primary/90 w-full"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Submit Evaluation
                  </Button>
                </form>
              </div>

              {/* Comments List */}
              <div>
                <h3 className="font-semibold mb-4">
                  Evaluations ({comments[selectedReport.id]?.length || 0})
                </h3>

                {comments[selectedReport.id]?.length === 0 ? (
                  <p className="text-text-secondary text-center py-8">
                    No evaluations yet. Be the first to comment!
                  </p>
                ) : (
                  <div className="space-y-4">
                    {comments[selectedReport.id]?.map(comment => (
                      <div key={comment.id} className="bg-background p-4 rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center">
                              <User className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <p className="font-semibold text-sm">{comment.user_name}</p>
                              <p className="text-xs text-text-secondary">
                                {new Date(comment.created_at).toLocaleDateString()} at {new Date(comment.created_at).toLocaleTimeString()}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <div
                              className="px-3 py-1 rounded-full text-sm font-bold text-white"
                              style={{ backgroundColor: getRatingColor(comment.rating) }}
                            >
                              {comment.rating}
                            </div>

                            {user?.id === comment.user_id && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteComment(comment.id)}
                                className="p-1 h-8 w-8 text-error"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>

                        <p className="text-text-secondary whitespace-pre-wrap ml-11">
                          {comment.comment}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScoutReports;
