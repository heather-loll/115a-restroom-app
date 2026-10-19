type Restroom = {
  restroomId: number; // Can be changed to a string if needed
  name: string;
  address?: string;
  latitude: number;
  longitude: number;

  amenities: { // Undefined if we have no data, don't assume true or false
    cleanliness?: number;
    paymentRequired?: boolean;
    accessible?: boolean;
    unisex?: boolean;
    singleOccupancy?: boolean;
    menstrualProductsAvailible?: boolean;
    babyChangingStation?: boolean;
  }
}
