type Point = {
  latitude: number;
  longitude: number;
};

interface Restroom extends Point {
  restroomId: string;
  name: string | null;
  address?: string;
  amenities: AmenitiesList;
}

type AmenitiesList = {
  cleanliness?: number;
  paymentRequired?: boolean;
  accessible?: boolean;
  unisex?: boolean;
  singleOccupancy?: boolean;
  menstrualProductsAvailible?: boolean;
  babyChangingStation?: boolean;
};

interface GetRestroomsAPIResponse {
  restrooms: Restroom[];
  search: {
    latitude: number;
    longitude: number;
    radiusMeters?: number;
  };
}
