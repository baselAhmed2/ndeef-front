import { StaticImageData } from 'next/image';
export interface ServiceItem {
  id: string;
  name: string;
  category: 'wash' | 'dry_clean' | 'iron' | 'specialty';
  price: number;
  unit: string;
  available: boolean;
  turnaround?: string;
}

export interface Laundry {
  id: string;
  name: string;
  image: string | StaticImageData;
  rating: number;
  reviews: number;
  deliveryTime: string;
  distance: number; // in km, numeric for sorting
  distanceLabel: string;
  status: 'active' | 'inactive';
  isAvailable: boolean;
  category?: string;
  featured?: boolean;
  discount?: string;
  address: string;
  services: ServiceItem[];
}
import l1Img from '../../assets/58b151bb9307cca21700c7d57fa6f7b844e0995c.png';
import l2Img from '../../assets/5c123ba856ecc04491c6ccc9c72966bfe212fa77.png';
import l3Img from '../../assets/ef8edca0fb59017ab6c288dae29be2b489893829.png';
import l4Img from '../../assets/5f2f04ac02729c31fd1d3d807e15f16a15fff872.png';
import l5Img from '../../assets/63cb0e9ca701369a32ede4db72c20c3b4a49e93f.png';

export const laundries: Laundry[] = [
  {
    id: '1',
    name: 'Smart Clean Laundry',
    image: l1Img,
    rating: 4.8,
    reviews: 250,
    deliveryTime: '2 hours',
    distance: 0.8,
    distanceLabel: '0.8 km',
    status: 'active',
    isAvailable: true,
    featured: true,
    discount: '20% OFF',
    address: '14 Tahrir Square, Cairo',
    services: [
      { id: 'wash-kg', name: 'Wash & Fold', category: 'wash', price: 15, unit: 'per kg', available: true, turnaround: '2 hrs' },
      { id: 'wash-dry', name: 'Wash & Dry', category: 'wash', price: 18, unit: 'per kg', available: true, turnaround: '3 hrs' },
      { id: 'iron-shirt', name: 'Iron – Shirt', category: 'iron', price: 10, unit: 'per item', available: true, turnaround: '1 hr' },
      { id: 'iron-suit', name: 'Iron – Suit', category: 'iron', price: 22, unit: 'per item', available: true, turnaround: '2 hrs' },
      { id: 'dry-shirt', name: 'Dry Clean – Shirt', category: 'dry_clean', price: 35, unit: 'per item', available: true, turnaround: '24 hrs' },
      { id: 'dry-dress', name: 'Dry Clean – Dress', category: 'dry_clean', price: 55, unit: 'per item', available: true, turnaround: '24 hrs' },
      { id: 'sp-blanket', name: 'Blanket / Duvet', category: 'specialty', price: 80, unit: 'per item', available: true, turnaround: '48 hrs' },
    ],
  },
  {
    id: '2',
    name: 'Comfort Laundry',
    image: l2Img,
    rating: 4.6,
    reviews: 180,
    deliveryTime: '3 hours',
    distance: 1.2,
    distanceLabel: '1.2 km',
    status: 'active',
    isAvailable: true,
    address: '7 El-Nasr Road, New Cairo',
    services: [
      { id: 'wash-kg', name: 'Wash & Fold', category: 'wash', price: 12, unit: 'per kg', available: true, turnaround: '3 hrs' },
      { id: 'iron-shirt', name: 'Iron – Shirt', category: 'iron', price: 8, unit: 'per item', available: true, turnaround: '1 hr' },
      { id: 'iron-trouser', name: 'Iron – Trousers', category: 'iron', price: 10, unit: 'per item', available: true, turnaround: '1 hr' },
      { id: 'dry-shirt', name: 'Dry Clean – Shirt', category: 'dry_clean', price: 30, unit: 'per item', available: true, turnaround: '24 hrs' },
      { id: 'sp-blanket', name: 'Blanket / Duvet', category: 'specialty', price: 70, unit: 'per item', available: false, turnaround: '48 hrs' },
    ],
  },
  {
    id: '3',
    name: 'Express Clean',
    image: l3Img,
    rating: 4.9,
    reviews: 320,
    deliveryTime: '1.5 hours',
    distance: 0.5,
    distanceLabel: '0.5 km',
    status: 'active',
    isAvailable: true,
    featured: true,
    discount: '15% OFF',
    address: '3 Al-Haram Street, Giza',
    services: [
      { id: 'wash-kg', name: 'Wash & Fold', category: 'wash', price: 18, unit: 'per kg', available: true, turnaround: '1.5 hrs' },
      { id: 'wash-dry', name: 'Wash & Dry', category: 'wash', price: 22, unit: 'per kg', available: true, turnaround: '2 hrs' },
      { id: 'iron-shirt', name: 'Iron – Shirt', category: 'iron', price: 12, unit: 'per item', available: true, turnaround: '45 min' },
      { id: 'iron-suit', name: 'Iron – Suit', category: 'iron', price: 25, unit: 'per item', available: true, turnaround: '1.5 hrs' },
      { id: 'dry-shirt', name: 'Dry Clean – Shirt', category: 'dry_clean', price: 40, unit: 'per item', available: true, turnaround: '24 hrs' },
      { id: 'dry-coat', name: 'Dry Clean – Coat', category: 'dry_clean', price: 75, unit: 'per item', available: true, turnaround: '36 hrs' },
      { id: 'sp-blanket', name: 'Blanket / Duvet', category: 'specialty', price: 90, unit: 'per item', available: true, turnaround: '48 hrs' },
      { id: 'sp-curtain', name: 'Curtains', category: 'specialty', price: 120, unit: 'per set', available: true, turnaround: '72 hrs' },
    ],
  },
  {
    id: '4',
    name: 'Elegance Laundry',
    image: l4Img,
    rating: 4.7,
    reviews: 200,
    deliveryTime: '2.5 hours',
    distance: 1.5,
    distanceLabel: '1.5 km',
    status: 'active',
    isAvailable: false,
    address: '22 Corniche El-Nil, Maadi',
    services: [
      { id: 'wash-kg', name: 'Wash & Fold', category: 'wash', price: 14, unit: 'per kg', available: true, turnaround: '2.5 hrs' },
      { id: 'iron-shirt', name: 'Iron – Shirt', category: 'iron', price: 9, unit: 'per item', available: true, turnaround: '1 hr' },
      { id: 'dry-dress', name: 'Dry Clean – Dress', category: 'dry_clean', price: 50, unit: 'per item', available: true, turnaround: '24 hrs' },
    ],
  },
  {
    id: '5',
    name: 'Fresh & Clean',
    image: l5Img,
    rating: 4.3,
    reviews: 95,
    deliveryTime: '4 hours',
    distance: 2.1,
    distanceLabel: '2.1 km',
    status: 'inactive',
    isAvailable: false,
    address: '9 Mohamed Farid St, Downtown',
    services: [],
  },
];

export const categoryLabels: Record<string, string> = {
  wash: 'Wash & Fold',
  iron: 'Ironing',
  dry_clean: 'Dry Cleaning',
  specialty: 'Specialty Items',
};



export const categoryOrder = ['wash', 'iron', 'dry_clean', 'specialty'];