import { useState } from 'react';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Column } from '../../api/columnsApi';
import { createCard, deleteCard } from '../../api/cardsApi';
import type { Card } from '../../api/cardsApi';
import CardItem from './CardItem';

interface Props {
  column:   Column;
  cards:    Card[];
  onCardAdded:   (card: Card) => void;
  onCardDeleted: (cardId: string, columnId: string) => void;
  onDeleteColumn: (columnId: string) => void;
}

export default function KanbanColumn({
  column,
  cards,
  onCardAdded,
  onCardDeleted,
  onDeleteColumn,
}: Props) {
  const [showForm,  setShowForm]  = useState(false);
  const [cardTitle, setCardTitle] = useState('');
  const [adding,    setAdding]    = useState(false);

  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: column.id, data: { type: 'column', column: column } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleAddCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardTitle.trim()) return;
    setAdding(true);

    try {
      const card = await createCard(cardTitle.trim(), column.id);
      onCardAdded(card);
      setCardTitle('');
      setShowForm(false);
    } finally {
      setAdding(false);
    }
  };

  return (
    <div ref={setNodeRef} style={style} className="flex-shrink-0 w-72">
      <div className="bg-gray-100 rounded-xl p-3 flex flex-col gap-2">

        {/* Column header */}
        <div className="flex items-center justify-between px-1">
          <h3
            {...attributes}
            {...listeners}
            className="font-semibold text-gray-700 text-sm cursor-grab"
          >
            {column.name}
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">{cards.length}</span>
            <button
              onClick={() => onDeleteColumn(column.id)}
              className="text-gray-300 hover:text-red-500 transition text-xs"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Cards */}
        <SortableContext
          items={cards.map(c => c.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="flex flex-col gap-2 min-h-[4px]">
            {cards.map(card => (
              <CardItem
                key={card.id}
                card={card}
                onDelete={() => onCardDeleted(card.id, column.id)}
              />
            ))}
          </div>
        </SortableContext>

        {/* Add card form */}
        {showForm ? (
          <form onSubmit={handleAddCard} className="flex flex-col gap-2 mt-1">
            <input
              type="text"
              value={cardTitle}
              onChange={e => setCardTitle(e.target.value)}
              placeholder="Card title"
              autoFocus
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={adding}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium py-1.5 rounded-lg transition disabled:opacity-50"
              >
                {adding ? 'Adding...' : 'Add card'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="text-gray-400 hover:text-gray-600 text-xs px-2 transition"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setShowForm(true)}
            className="text-gray-400 hover:text-gray-600 text-sm text-left px-1 py-1 transition"
          >
            + Add card
          </button>
        )}

      </div>
    </div>
  );
}