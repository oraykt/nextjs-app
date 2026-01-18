"use client";

import { addItemAction } from "@/components/task/action/action";
import { useActionState, useEffect, useRef } from "react";

interface AddItemFormProps {
  onOptimisticAdd?: (label: string) => void;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export const AddItemForm = ({
  onOptimisticAdd,
  onSuccess,
  onError,
}: AddItemFormProps) => {
  const formRef = useRef<HTMLFormElement>(null);

  const [state, formAction, pending] = useActionState(
    async (_prevState: unknown, formData: FormData) => {
      const label = formData.get("label") as string;

      // Trigger optimistic update before the action
      if (label?.trim()) {
        onOptimisticAdd?.(label.trim());
      }

      try {
        await addItemAction(formData);
        return { success: true, error: null };
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err : new Error("Unknown error"),
        };
      }
    },
    null,
  );

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset();
      onSuccess?.();
    } else if (state?.error) {
      onError?.(state.error);
    }
  }, [state, onSuccess, onError]);

  return (
    <form ref={formRef} action={formAction}>
      <input
        name="label"
        type="text"
        placeholder="New item label"
        className="border rounded-md px-2 py-1 mr-2"
      />
      <button
        type="submit"
        className="bg-blue-500 text-white rounded-md px-4 py-1"
        disabled={pending}
      >
        {pending ? "Adding..." : "Add Item"}
      </button>
    </form>
  );
};
