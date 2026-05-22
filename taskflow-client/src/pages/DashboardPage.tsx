import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { getBoards, createBoard, deleteBoard } from '../api/boardsApi';
import type { Board } from '../api/boardsApi';
import { useEffect } from 'react';

export default function DashboardPage() {
  const navigate   = useNavigate();
  const user       = useAuthStore(state => state.user);
  const logout     = useAuthStore(state => state.logout);

  const [boards,      setBoards]      = useState<Board[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');
  const [creating,    setCreating]    = useState(false);
  const [newBoardName, setNewBoardName] = useState('');
  const [showForm,    setShowForm]    = useState(false);

  // ── Load boards on mount ───────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const data = await getBoards();
        setBoards(data);
      } catch {
        setError('Failed to load boards.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // ── Create board ───────────────────────────────────────────
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBoardName.trim()) return;
    setCreating(true);

    try {
      const board = await createBoard(newBoardName.trim());
      setBoards(prev => [...prev, board]);
      setNewBoardName('');
      setShowForm(false);
    } catch {
      setError('Failed to create board.');
    } finally {
      setCreating(false);
    }
  };

  // ── Delete board ───────────────────────────────────────────
  const handleDelete = async (id: string) => {
    try {
      await deleteBoard(id);
      setBoards(prev => prev.filter(b => b.id !== id));
    } catch {
      setError('Failed to delete board.');
    }
  };

  // ── Logout ─────────────────────────────────────────────────
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <h1 className="text-lg font-bold text-blue-600">TaskFlow</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">
            Hello, {user?.displayName}
          </span>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-500 hover:text-gray-800 transition"
          >
            Logout
          </button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-gray-800">My Boards</h2>
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
          >
            + New Board
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* New board form */}
        {showForm && (
          <form
            onSubmit={handleCreate}
            className="bg-white border border-gray-200 rounded-xl p-4 mb-6 flex gap-3"
          >
            <input
              type="text"
              value={newBoardName}
              onChange={e => setNewBoardName(e.target.value)}
              placeholder="Board name"
              autoFocus
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={creating}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition disabled:opacity-50"
            >
              {creating ? 'Creating...' : 'Create'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-sm text-gray-500 hover:text-gray-800 px-3 py-2 transition"
            >
              Cancel
            </button>
          </form>
        )}

        {/* Loading */}
        {loading && (
          <div className="text-center text-gray-400 py-20">
            Loading boards...
          </div>
        )}

        {/* Empty state */}
        {!loading && boards.length === 0 && (
          <div className="text-center py-20">
            <p className="text-gray-400 text-sm mb-4">No boards yet.</p>
            <button
              onClick={() => setShowForm(true)}
              className="text-blue-600 hover:underline text-sm"
            >
              Create your first board
            </button>
          </div>
        )}

        {/* Boards grid */}
        {!loading && boards.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {boards.map(board => (
              <div
                key={board.id}
                className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition cursor-pointer group"
                onClick={() => navigate(`/board/${board.id}`)}
              >
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold text-gray-800 group-hover:text-blue-600 transition">
                    {board.name}
                  </h3>
                  <button
                    onClick={e => {
                      e.stopPropagation(); // prevent navigating to board
                      handleDelete(board.id);
                    }}
                    className="text-gray-300 hover:text-red-500 transition text-sm"
                  >
                    ✕
                  </button>
                </div>
                {board.description && (
                  <p className="text-gray-400 text-sm mt-1">{board.description}</p>
                )}
                <p className="text-gray-300 text-xs mt-4">
                  {new Date(board.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}