export interface CartItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

export interface UserData {
  email: string;
  cart: Record<string, CartItem>;
}
