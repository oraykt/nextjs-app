"use server";

import { addItem, editItem } from "@/components/task/data";
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

  revalidateTag("items-data");
}

export async function editItemAction(id: string, label: string) {
  if (!id || typeof label !== "string" || label.trim() === "") {
    throw new Error("Invalid id or label");
  }

  await editItem(id, label.trim());

  revalidateTag("items-data");
}

export async function selectItemAction(item: Item) {
  await new Promise((res) => setTimeout(res, 1000));
}
