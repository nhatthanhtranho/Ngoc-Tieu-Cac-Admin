import { Book } from "../../../apis/books";

export const getChangedFields = (
  newData: Book,
  oldData: Book
): Partial<Book> => {
  const changed: Partial<Book> = {};

  (Object.keys(newData) as (keyof Book)[]).forEach((key) => {
    const newValue = newData[key];
    const oldValue = oldData[key];

    if (Array.isArray(newValue) && Array.isArray(oldValue)) {
      const isDifferent =
        newValue.length !== oldValue.length ||
        newValue.some((v, i) => v !== oldValue[i]);

      if (isDifferent) (changed as any)[key] = newValue;
    } else if (newValue !== oldValue) {
      (changed as any)[key] = newValue;
    }
  });

  return changed;
};

export const base64ToBlob = (b64: string) => {
  const arr = b64.split(",");
  const mime = arr[0].match(/:(.*?);/)![1];
  const bstr = atob(arr[1]);

  let n = bstr.length;
  const u8arr = new Uint8Array(n);

  while (n--) u8arr[n] = bstr.charCodeAt(n);

  return new Blob([u8arr], { type: mime });
};

export const randomViewValue = () => {
  const min = 56000;
  const max = 150000;
  return Math.floor(Math.random() * (max - min + 1)) + min;
};