import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';
import type {DragEndEvent, DragStartEvent} from '@dnd-kit/core';
import {
  SortableContext,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { getColumns, createColumn, deleteColumn } from '../api/columnsApi';
import type { Column } from '../api/columnsApi';
import { getCards, moveCard, deleteCard } from '../api/cardsApi';
import type { Card } from '../api/cardsApi';
import KanbanColumn from '../components/Board/kanbanColumn';
import CardItem from '../components/Board/CardItem';

export default function BoardPage() {
  const { id }   = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [columns,     setColumns]     = useState<Column[]>([]);
  const [cards,       setCards]       = useState<Record<string, Card[]>>({});
  const [loading,     setLoading]     = useState(true);
  const [newColName,  setNewColName]  = useState('');
  const [showColForm, setShowColForm] = useState(false);
  const [activeCard,  setActiveCard]  = useState<Card | null>(null);
  const [activeCardColumnId, setActiveCardColumnId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  // ── Load columns and cards ─────────────────────────────────
  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        const cols = await getColumns(id);
        setColumns(cols);

        const cardMap: Record<string, Card[]> = {};
        await Promise.all(
          cols.map(async col => {
            cardMap[col.id] = await getCards(col.id);
          })
        );
        setCards(cardMap);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  // ── Add column ─────────────────────────────────────────────
  const handleAddColumn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColName.trim() || !id) return;

    const col = await createColumn(newColName.trim(), id);
    setColumns(prev => [...prev, col]);
    setCards(prev => ({ ...prev, [col.id]: [] }));
    setNewColName('');
    setShowColForm(false);
  };

  // ── Delete column ──────────────────────────────────────────
  const handleDeleteColumn = async (columnId: string) => {
    await deleteColumn(columnId);
    setColumns(prev => prev.filter(c => c.id !== columnId));
    setCards(prev => {
      const next = { ...prev };
      delete next[columnId];
      return next;
    });
  };

  // ── Card added ─────────────────────────────────────────────
  const handleCardAdded = (card: Card) => {
    setCards(prev => ({
      ...prev,
      [card.columnId]: [...(prev[card.columnId] ?? []), card],
    }));
  };

  // ── Card deleted ───────────────────────────────────────────
  const handleCardDeleted = async (cardId: string, columnId: string) => {
    await deleteCard(cardId);
    setCards(prev => ({
      ...prev,
      [columnId]: prev[columnId].filter(c => c.id !== cardId),
    }));
  };

  // ── Find which column a card belongs to ────────────────────
  const findColumnOfCard = (cardId: string): string | undefined => {
    return Object.entries(cards).find(([, colCards]) =>
      colCards.some(c => c.id === cardId)
    )?.[0];
  };

  // ── Drag start ─────────────────────────────────────────────
  const handleDragStart = (event: DragStartEvent) => {
    const cardId     = event.active.id as string;
    const columnId   = findColumnOfCard(cardId);
    if (!columnId) return;

    const card = cards[columnId]?.find(c => c.id === cardId);
    if (card) {
      setActiveCard(card);
      setActiveCardColumnId(columnId);
    }
  };

  // ── Drag end ───────────────────────────────────────────────
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveCard(null);
    setActiveCardColumnId(null);

    if (!over || !activeCard || !activeCardColumnId) return;

    const cardId = active.id as string;

    // figure out target column
    let targetColumnId: string | undefined;

    // dropped over a column directly
    if (columns.some(c => c.id === over.id)) {
      targetColumnId = over.id as string;
    } else {
      // dropped over a card — find which column that card is in
      targetColumnId = findColumnOfCard(over.id as string);
    }

    if (!targetColumnId) return;

    // find position in target column
    const targetCards = cards[targetColumnId] ?? [];
    const overIndex   = targetCards.findIndex(c => c.id === over.id);
    const position    = overIndex === -1 ? targetCards.length : overIndex;

    // optimistically update state
    setCards(prev => {
      const sourceCards = prev[activeCardColumnId].filter(c => c.id !== cardId);
      const destCards   = [...(prev[targetColumnId!] ?? [])];

      // remove card from dest if it's already there (same column reorder)
      const existingIndex = destCards.findIndex(c => c.id === cardId);
      if (existingIndex !== -1) destCards.splice(existingIndex, 1);

      const updatedCard = { ...activeCard, columnId: targetColumnId! };
      destCards.splice(position, 0, updatedCard);

      return {
        ...prev,
        [activeCardColumnId]: sourceCards,
        [targetColumnId!]:    destCards,
      };
    });

    // persist to backend
    try {
      await moveCard(cardId, targetColumnId, position);
    } catch (err) {
      console.error('Move failed:', err);
      // reload on failure to reset state
      const cols = await getColumns(id!);
      const cardMap: Record<string, Card[]> = {};
      await Promise.all(cols.map(async col => {
        cardMap[col.id] = await getCards(col.id);
      }));
      setCards(cardMap);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center text-gray-400">
      Loading board...
    </div>
  );

  return (
    <div className="min-h-screen bg-blue-600 flex flex-col">

      {/* Navbar */}
      <nav className="bg-blue-700 px-6 py-4 flex items-center gap-4">
        <button
          onClick={() => navigate('/')}
          className="text-blue-200 hover:text-white text-sm transition"
        >
          ← Back
        </button>
        <h1 className="text-white font-bold">Board</h1>
      </nav>

      {/* Board */}
      <div className="flex-1 overflow-x-auto p-6">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={columns.map(c => c.id)}
            strategy={horizontalListSortingStrategy}
          >
            <div className="flex gap-4 items-start">
              {columns.map(col => (
                <KanbanColumn
                  key={col.id}
                  column={col}
                  cards={cards[col.id] ?? []}
                  onCardAdded={handleCardAdded}
                  onCardDeleted={handleCardDeleted}
                  onDeleteColumn={handleDeleteColumn}
                />
              ))}

              {/* Add column */}
              {showColForm ? (
                <form
                  onSubmit={handleAddColumn}
                  className="flex-shrink-0 w-72 bg-gray-100 rounded-xl p-3 flex flex-col gap-2"
                >
                  <input
                    type="text"
                    value={newColName}
                    onChange={e => setNewColName(e.target.value)}
                    placeholder="Column name"
                    autoFocus
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium py-1.5 rounded-lg transition"
                    >
                      Add column
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowColForm(false)}
                      className="text-gray-400 hover:text-gray-600 text-xs px-2 transition"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  onClick={() => setShowColForm(true)}
                  className="flex-shrink-0 w-72 bg-blue-500 hover:bg-blue-400 text-white text-sm font-medium px-4 py-3 rounded-xl transition"
                >
                  + Add column
                </button>
              )}
            </div>
          </SortableContext>

          {/* Drag overlay */}
          <DragOverlay>
            {activeCard && (
              <CardItem
                card={activeCard}
                onDelete={() => {}}
              />
            )}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
}