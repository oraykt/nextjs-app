"use client";

import React, {
  ChangeEvent,
  useEffect,
  useMemo,
  useOptimistic,
  useState,
  useTransition,
} from "react";
import { AddItemForm } from "./ui/addItemForm";
import { editItemAction } from "@/components/task/action/action";

type Item = {
  id: string;
  label: string;
};

type Stats = {
  total: number;
};

interface Props {
  list: Item[];
  stats: Stats;
  onSelect(item: Item): void;
  debounceMs?: number;
}

export const SearchableList = ({
  list,
  stats,
  onSelect,
  debounceMs = 300,
}: Props) => {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [inputValue, setInputValue] = useState<string>("");
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const [isPending, startTransition] = useTransition();
  const [addItemMode, setAddItemMode] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState<string>("");

  // Optimistic state for items and stats
  const [optimisticItems, setOptimisticItems] = useOptimistic(
    list,
    (
      currentItems,
      action:
        | { type: "add"; item: Item }
        | { type: "edit"; id: string; label: string },
    ) => {
      if (action.type === "add") {
        return [...currentItems, action.item];
      } else if (action.type === "edit") {
        return currentItems.map((item) =>
          item.id === action.id ? { ...item, label: action.label } : item,
        );
      }
      return currentItems;
    },
  );
  const [optimisticStats, addOptimisticStats] = useOptimistic(
    stats,
    (currentStats) => ({ total: currentStats.total + 1 }),
  );

  const handleOptimisticAdd = (label: string) => {
    setError(null);
    const optimisticItem = { id: crypto.randomUUID(), label };
    setOptimisticItems({ type: "add", item: optimisticItem });
    addOptimisticStats(null);
  };

  const handleEditStart = (item: Item) => {
    setEditingItemId(item.id);
    setEditingValue(item.label);
    setError(null);
  };

  const handleEditSave = () => {
    if (!editingItemId || !editingValue.trim()) return;

    const originalItem = list.find((item) => item.id === editingItemId);
    if (!originalItem) return;

    const idToEdit = editingItemId;
    const labelToEdit = editingValue.trim();

    // Clear editing state immediately
    setEditingItemId(null);
    setEditingValue("");

    // Wrap optimistic update and action in startTransition
    startTransition(async () => {
      // Optimistic update
      setOptimisticItems({
        type: "edit",
        id: idToEdit,
        label: labelToEdit,
      });

      try {
        await editItemAction(idToEdit, labelToEdit);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Failed to edit item"));
      }
    });
  };

  const handleEditCancel = () => {
    setEditingItemId(null);
    setEditingValue("");
  };

  const handleEditKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleEditSave();
    } else if (e.key === "Escape") {
      handleEditCancel();
    }
  };

  const handleAddError = (err: Error) => {
    setError(err);
    setAddItemMode(false);
  };

  useEffect(() => {
    const id = setTimeout(() => {
      setSearchTerm(inputValue);
      setActiveIndex(-1);
    }, debounceMs);
    return () => clearTimeout(id);
  }, [inputValue, debounceMs]);

  const filteredList = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return optimisticItems;

    return optimisticItems.filter((item) =>
      item.label.toLowerCase().includes(term),
    );
  }, [optimisticItems, searchTerm]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (filteredList.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % filteredList.length);
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex(
        (prev) => (prev - 1 + filteredList.length) % filteredList.length,
      );
    }
    if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      startTransition(() => {
        onSelect(filteredList[activeIndex]);
      });
    }
  };

  return (
    <div className="p-4 border rounded-md w-fit">
      <div className="mb-2 text-sm text-gray-600">
        Total items:{" "}
        <span className="font-semibold">{optimisticStats.total}</span>
      </div>
      {error && (
        <div className="mb-2 p-2 bg-red-100 text-red-700 rounded-md text-sm">
          {error.message}
        </div>
      )}
      {addItemMode && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setAddItemMode(false)}
        />
      )}
      {addItemMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="pointer-events-auto">
            <AddItemForm
              onOptimisticAdd={handleOptimisticAdd}
              onSuccess={() => {
                setAddItemMode(false);
                setError(null);
              }}
              onError={handleAddError}
            />
          </div>
        </div>
      )}
      <div className="p-1 border flex flex-row gap-4 justify-between">
        <input
          type="text"
          placeholder="Search..."
          className="w-60 outline-none"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button
          type="button"
          className="bg-green-300 rounded-2xl px-2 py-1 flex items-center justify-center"
          disabled={isPending}
          onClick={() => setAddItemMode(true)}
        >
          +
        </button>
      </div>
      {filteredList.length === 0 ? (
        <div>No items found.</div>
      ) : (
        <ul>
          {filteredList.map((item, index) => (
            <li
              className="p-1"
              key={item.id}
              onClick={() => {
                if (editingItemId !== item.id) {
                  setActiveIndex(index);
                  startTransition(() => {
                    onSelect(item);
                  });
                }
              }}
              onDoubleClick={() => handleEditStart(item)}
              onMouseEnter={() => setActiveIndex(index)}
              role="option"
              aria-selected={activeIndex === index}
              style={{
                backgroundColor: activeIndex === index ? "#ddd" : "transparent",
                color: activeIndex === index ? "red" : "black",
                cursor: "pointer",
              }}
            >
              {editingItemId === item.id ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={editingValue}
                    onChange={(e) => setEditingValue(e.target.value)}
                    onKeyDown={handleEditKeyDown}
                    onBlur={handleEditSave}
                    autoFocus
                    className="flex-1 px-1 border rounded outline-none"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              ) : (
                item.label
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
