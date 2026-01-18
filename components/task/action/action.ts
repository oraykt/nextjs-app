"use server";

import { addItem, editItem } from "@/app/data";
import { revalidateTag } from "next/cache";

type Item = {
  id: string;
  label: string;
};

export async function addItemAction(formData: FormData) {
  const label = formData.get("label");
  if (typeof label !== "string" || label.trim() === "") {
    throw new Error("Invalid label");
  }

  if (label.toLocaleLowerCase().includes("error")) {
    throw new Error("Simulated server error for labels containing 'error'");
  }

  await addItem(label.trim());

  // Revalidate the shared cache tag - invalidates both items and stats
  revalidateTag("items-data");

  // Verify both are updated together
  // const [newItems, newStats] = await Promise.all([getItems(), getStats()]);
  // console.log("New items list:", newItems);
  // console.log("New stats:", newStats);
}

export async function editItemAction(id: string, label: string) {
  if (!id || typeof label !== "string" || label.trim() === "") {
    throw new Error("Invalid id or label");
  }

  await editItem(id, label.trim());

  // Revalidate the shared cache tag - invalidates both items and stats
  revalidateTag("items-data");
}

export async function selectItemAction(item: Item) {
  // console.log("Item selected on server:", item);
  await new Promise((res) => setTimeout(res, 1000));
  // console.log("Selected item executed");
}
