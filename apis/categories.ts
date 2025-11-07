import axios from "axios";

export interface Category {
  name: string;
  slug: string;
}

export async function fetchAllCategories(
  setCategories: (categories: Array<{ value: string; label: string }>) => void
) {
  const res = await axios.get<Category[]>(`http://localhost:3002/categories`);
  setCategories(
    res.data.map((category) => ({ value: category.slug, label: category.name }))
  );
}
