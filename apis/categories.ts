import axios from "axios";
import { getEndpoint } from ".";

export interface Category {
  name: string;
  slug: string;
}

export async function fetchAllCategories(
  setCategories: (categories: Array<{ value: string; label: string }>) => void
) {
  const res = await axios.get<Category[]>(getEndpoint('categories'));
  setCategories(
    res.data.map((category) => ({ value: category.slug, label: category.name }))
  );
}
