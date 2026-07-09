import { UserType } from "@/types/User";
import { create } from "zustand";

type AuthStateType = {
  user?: UserType;
};

const useAuthStore = create<AuthStateType>(() => ({
  user: undefined,
}));

export default useAuthStore;
