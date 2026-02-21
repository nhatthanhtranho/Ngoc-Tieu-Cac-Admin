"use client";

import { useState } from "react";
import { Plus, Users, Pencil, X } from "lucide-react";

type Translator = {
  id: string;
  name: string;
  bio?: string;
  avatar: string;
};

const initialMockData: Translator[] = [
  {
    id: "1",
    name: "Nguyễn Văn A",
    bio: "Chuyên dịch tiểu thuyết ngôn tình và fantasy.",
    avatar: "https://ui-avatars.com/api/?name=Nguyen+Van+A&background=random",
  },
  {
    id: "2",
    name: "Trần Thị B",
    bio: "Dịch giả truyện kiếm hiệp Trung Quốc.",
    avatar: "https://ui-avatars.com/api/?name=Tran+Thi+B&background=random",
  },
];

export default function DichGia() {
  const [translators, setTranslators] = useState<Translator[]>(initialMockData);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Translator | null>(null);

  const [name, setName] = useState("");
  const [bio, setBio] = useState("");

  const resetForm = () => {
    setName("");
    setBio("");
    setEditing(null);
  };

  const openCreate = () => {
    resetForm();
    setOpen(true);
  };

  const openEdit = (translator: Translator) => {
    setEditing(translator);
    setName(translator.name);
    setAvatarPreview(translator.avatar);
    setOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editing) {
      // Update
      setTranslators((prev) =>
        prev.map((t) =>
          t.id === editing.id
            ? {
                ...t,
                name,
                bio,
                avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(
                  name,
                )}&background=random`,
              }
            : t,
        ),
      );
    } else {
      // Create
      const newTranslator: Translator = {
        id: Date.now().toString(),
        name,
        bio,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(
          name,
        )}&background=random`,
      };
      setTranslators((prev) => [newTranslator, ...prev]);
    }

    setOpen(false);
    resetForm();
  };

  return (
    <div className="mx-auto px-20 py-10">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
          <Users className="w-7 h-7" />
          <h1 className="text-2xl font-bold">Danh sách Dịch Giả</h1>
        </div>

        <button
          onClick={openCreate}
          className=" bg-emerald-500 hover:bg-emerald-600 text-white p-2 rounded cursor-pointer"
        >
          <Plus className="w-4 h-4 text-white" />
        </button>
      </div>

      {/* List */}
      <div className="flex gap-6">
        {translators.map((translator) => (
          <div
            key={translator.id}
            className="group relative bg-white rounded-2xl border border-gray-100 
             shadow-sm hover:shadow-lg hover:-translate-y-1 
             transition-all duration-300 w-56 p-6 flex flex-col items-center text-center"
          >
            {/* Edit button */}
            <button
              onClick={() => openEdit(translator)}
              className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 
               transition text-gray-400 hover:text-indigo-600"
            >
              <Pencil className="w-4 h-4" />
            </button>

            {/* Avatar */}
            <div className="relative mb-4">
              <img
                src={translator.avatar}
                alt={translator.name}
                className="w-20 h-20 rounded-full object-cover ring-4 ring-indigo-50"
              />
            </div>

            {/* Name */}
            <h3 className="font-semibold text-base text-gray-800">
              {translator.name}
            </h3>

            {/* Optional subtle underline effect */}
            <div className="w-10 h-1 bg-indigo-500 rounded-full mt-3 opacity-70" />
          </div>
        ))}
      </div>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-sm p-6 relative">
            {/* Close button */}
            <button
              onClick={() => setOpen(false)}
              className="absolute top-3 right-3 cursor-pointer text-red-500"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-semibold mb-6 text-center">
              Chỉnh sửa dịch giả
            </h2>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!name.trim()) return;

                setTranslators((prev) =>
                  prev.map((t) =>
                    t.id === editing?.id
                      ? {
                          ...t,
                          name,
                          avatar: avatarPreview || t.avatar,
                        }
                      : t,
                  ),
                );

                setOpen(false);
              }}
              className="space-y-6"
            >
              {/* Avatar Upload */}
              <div className="flex flex-col items-center gap-3">
                <div className="relative">
                  <img
                    src={avatarPreview || editing?.avatar}
                    alt="avatar"
                    className="w-24 h-24 rounded-full object-cover ring-4 ring-indigo-50"
                  />
                </div>

                <label className="cursor-pointer text-sm text-emerald-600 underline">
                  Đổi avatar
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const previewUrl = URL.createObjectURL(file);
                        setAvatarPreview(previewUrl);
                      }
                    }}
                  />
                </label>
              </div>

              {/* Name input */}
              <div>
                <label className="text-sm text-gray-600 mb-1 block">
                  Tên dịch giả
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border rounded px-4 py-2"
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-2 rounded transition font-medium cursor-pointer"
              >
                Cập nhật
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
