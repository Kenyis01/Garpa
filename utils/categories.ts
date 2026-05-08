export const CATEGORY_ICONS: Record<string, string> = {
  // Parents
  food_drink: 'food-fork-drink',
  home: 'home',
  transportation: 'car',
  entertainment: 'ticket',
  life: 'shopping',
  travel: 'airplane',
  uncategorized: 'dots-horizontal',
  // Subcategories
  restaurants: 'silverware-fork-knife',
  groceries: 'cart',
  alcohol: 'glass-wine',
  coffee: 'coffee',
  rent: 'home-city',
  mortgage: 'home-account',
  utilities: 'lightning-bolt',
  cleaning: 'broom',
  furniture: 'sofa',
  maintenance: 'tools',
  gas: 'gas-station',
  parking: 'parking',
  taxi: 'taxi',
  transit: 'train',
  flights: 'airplane',
  tolls: 'road-variant',
  movies: 'movie-open',
  music: 'music',
  sports: 'basketball',
  games: 'gamepad-variant',
  clothing: 'tshirt-crew',
  electronics: 'cellphone',
  gifts: 'gift',
  medical: 'medical-bag',
  gym: 'dumbbell',
  education: 'school',
  hotel: 'bed',
  rental_car: 'car-key',
  vacation: 'beach',
  general: 'dots-horizontal',
};

export function categoryIcon(cat: string | null | undefined): string {
  if (!cat) return 'receipt';
  return CATEGORY_ICONS[cat] ?? 'receipt';
}

export function categoryLabel(cat: string | null | undefined): string {
  if (!cat) return 'Other';
  return cat.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}
