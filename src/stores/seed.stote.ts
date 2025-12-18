import { create } from "zustand";
import { persist } from "zustand/middleware";
import { getSeedUsers as fetchSeedUsersAPI } from "../../apis/comments";

export interface SeedUser {
  username: string;
  avatarUrl: string;
}

interface SeedState {
  seedUsers: SeedUser[];
  fetchSeedUsers: (force?: boolean) => Promise<void>;
  getSeedUsers: () => SeedUser[];
}

export const useSeedUserStore = create<SeedState>()(
  persist(
    (set, get) => ({
      seedUsers: [],

      fetchSeedUsers: async (force = false) => {
        const currentUsers = get().seedUsers;

        // ✅ Không force & đã có data → skip fetch
        if (!force && currentUsers.length > 0) return;

        try {
          const users = await fetchSeedUsersAPI();
          set({ seedUsers: users });
        } catch (err) {
          console.error("Fetch seed users failed", err);
        }
      },

      getSeedUsers: () => {
        const users = get().seedUsers;
        if (!users.length) return [];
        return users;
      },
    }),
    {
      name: "seed-user-storage",
    }
  )
);
