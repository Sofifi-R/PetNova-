/* =====================================================
   Pet Nova – js/locations.js
   ★ HERE you add, edit or remove the places on the map.
   You do not need to touch js/map.js.

   Fields of each place:
     id          unique, no spaces or accents
     name        name of the place
     category    one of: "Parks & walks", "Vets", "Restaurants & cafés",
                 "Shops & grooming", "Getaways"  (a new name creates a new filter)
     province    province or area (used by the search box)
     address     address or area (text)
     lat, lng    coordinates (right-click in Google Maps → copy)
     description short text
     offers      list of services or details
     mapsQuery   (optional) text used by "How to get there" in Google Maps
     approx      true = the pin is placed by neighborhood, not by exact address.
                 Delete this line once you put the exact coordinates.
   Tip: open functions.html?edit=1 to click the map and copy a ready block.
   ===================================================== */
const LOCATIONS = [
  {
    id: "parque-omar",
    name: "Parque Omar – Dog Park",
    category: "Parks & walks",
    province: "Panamá",
    address: "Parque Recreativo Omar, Panama City",
    lat: 8.9995, lng: -79.5115,
    description: "Fenced area where dogs can stay off-leash, with separate zones for small, medium and large dogs.",
    offers: ["Zones by dog size", "Off-leash fenced area", "Free entry"],
    mapsQuery: "Parque Recreativo Omar, Ciudad de Panamá",
    approx: true
  },
  {
    id: "parque-andres-bello",
    name: "Parque Andrés Bello – Dog Area",
    category: "Parks & walks",
    province: "Panamá",
    address: "Bella Vista / El Cangrejo, Vía Argentina",
    lat: 8.9895, lng: -79.524,
    description: "Neighborhood park with a dog area where pets can play and burn off energy.",
    offers: ["Dog area", "Walks around El Cangrejo"],
    mapsQuery: "Parque Andrés Bello, Bella Vista, Panamá",
    approx: true
  },
  {
    id: "cinta-costera",
    name: "Cinta Costera",
    category: "Parks & walks",
    province: "Panamá",
    address: "Avenida Balboa, Panama City",
    lat: 8.962, lng: -79.529,
    description: "Seaside promenade for walking with your pet. Bring water and bags for cleanup.",
    offers: ["Walk along the bay", "Sea views"],
    mapsQuery: "Cinta Costera, Ciudad de Panamá",
    approx: true
  },
  {
    id: "albrook-mall",
    name: "Albrook Mall",
    category: "Parks & walks",
    province: "Panamá",
    address: "Albrook, Panama City",
    lat: 8.9738, lng: -79.5558,
    description: "Shopping mall with a pet policy that sets rules for animals and their owners.",
    offers: ["Pet policy", "Check the rules before you go"],
    mapsQuery: "Albrook Mall, Panamá",
    approx: true
  },
  {
    id: "pccs-san-francisco",
    name: "Pet Care & Control Services (PCCS)",
    category: "Vets",
    province: "Panamá",
    address: "San Francisco, Panama City",
    lat: 8.999, lng: -79.505,
    description: "Veterinary clinic listed with 24-hour service.",
    offers: ["24-hour veterinary clinic"],
    mapsQuery: "Pet Care & Control Services PCCS San Francisco Panamá",
    approx: true
  },
  {
    id: "servicios-veterinarios-multiples",
    name: "Servicios Veterinarios Múltiples",
    category: "Vets",
    province: "Panamá",
    address: "Av. Ernesto T. Lefevre #86 (Av. Santa Elena), Panama City",
    lat: 9.006, lng: -79.4985,
    description: "Veterinary service near Parque Lefevre.",
    offers: ["Vet consultations"],
    mapsQuery: "Servicios Veterinarios Multiples, Ave Ernesto T. Lefevre, Panamá",
    approx: true
  },
  {
    id: "mas-colas",
    name: "Más Colas – Municipal Vet Clinic",
    category: "Vets",
    province: "San Miguelito",
    address: "Los Andes 2, behind the court, next to the school, San Miguelito",
    lat: 9.072, lng: -79.462,
    description: "The country’s first municipal vet clinic, with low-cost services for dogs and cats.",
    offers: ["Consultations", "Surgery", "Vaccines", "Deworming", "Ultrasound"],
    mapsQuery: "Más Colas clínica veterinaria Los Andes 2 San Miguelito",
    approx: true
  },
  {
    id: "pets-village-chanis",
    name: "Pets Village",
    category: "Vets",
    province: "Panamá",
    address: "Chanis, Panama City",
    lat: 9.023, lng: -79.513,
    description: "Veterinary clinic with feline medicine, pet shop and pharmacy.",
    offers: ["Veterinary clinic", "Feline medicine", "Pet shop", "Pharmacy"],
    mapsQuery: "Pets Village Chanis Panamá",
    approx: true
  },
  {
    id: "mundo-animal-bella-vista",
    name: "Mundo Animal",
    category: "Vets",
    province: "Panamá",
    address: "Bella Vista, Panama City",
    lat: 8.982, lng: -79.523,
    description: "Veterinary clinic with grooming, pharmacy and pet shop.",
    offers: ["Veterinary clinic", "Grooming", "Pharmacy", "Pet shop"],
    mapsQuery: "Mundo Animal Bella Vista Panamá",
    approx: true
  },
  {
    id: "avila-burger",
    name: "Ávila Burger",
    category: "Restaurants & cafés",
    province: "Panamá",
    address: "Obarrio, Panama City",
    lat: 8.9885, lng: -79.5175,
    description: "Restaurant mentioned as pet friendly in Panama.",
    offers: ["Pets welcome"],
    mapsQuery: "Ávila Burger Obarrio Panamá",
    approx: true
  },
  {
    id: "we-panama",
    name: "We Panamá",
    category: "Restaurants & cafés",
    province: "Panamá",
    address: "San Francisco and Costa del Este, Panama City",
    lat: 8.9985, lng: -79.506,
    description: "Pet-friendly restaurant with locations in San Francisco and Costa del Este.",
    offers: ["Pets welcome"],
    mapsQuery: "We Panamá restaurante San Francisco",
    approx: true
  },
  {
    id: "sabor-de-la-india",
    name: "Sabor de la India",
    category: "Restaurants & cafés",
    province: "Panamá",
    address: "Calle 51, Bella Vista, Panama City",
    lat: 8.9835, lng: -79.5195,
    description: "Bella Vista restaurant mentioned as pet friendly.",
    offers: ["Pets welcome"],
    mapsQuery: "Sabor de la India Calle 51 Bella Vista Panamá",
    approx: true
  },
  {
    id: "miranda-bakery",
    name: "Miranda Bakery & Café",
    category: "Restaurants & cafés",
    province: "Panamá",
    address: "San Francisco (Calle 74 Este at Andrés Mojica), Panama City",
    lat: 8.998, lng: -79.5045,
    description: "San Francisco bakery and café that shows up on pet-friendly lists.",
    offers: ["Coffee and bakery", "Pets welcome"],
    mapsQuery: "Miranda Bakery & Café San Francisco Panamá",
    approx: true
  },
  {
    id: "nomada-eatery",
    name: "Nómada Eatery",
    category: "Restaurants & cafés",
    province: "Panamá",
    address: "Calle Novena, San Felipe (Old Town)",
    lat: 8.9515, lng: -79.5355,
    description: "Old Town restaurant listed among places that welcome dogs.",
    offers: ["Pet friendly", "Old Town"],
    mapsQuery: "Nomada Eatery San Felipe Panamá",
    approx: true
  },
  {
    id: "work-cafe",
    name: "@Work Café",
    category: "Restaurants & cafés",
    province: "Panamá",
    address: "Panama City",
    lat: 8.983, lng: -79.52,
    description: "Café and co-working space presented as pet friendly, serving breakfast and lunch.",
    offers: ["Café", "Co-working", "Organic food"],
    mapsQuery: "@Work Café Panamá",
    approx: true
  },
  {
    id: "melo-coronado",
    name: "Melo Pet And Garden – Coronado",
    category: "Shops & grooming",
    province: "Panamá Oeste",
    address: "Plaza Bayside Center, Coronado",
    lat: 8.524, lng: -79.909,
    description: "Pet and garden shop with a branch in Coronado.",
    offers: ["Pet shop", "Pet supplies"],
    mapsQuery: "Melo Pet And Garden Coronado Bayside Center",
    approx: true
  },
  {
    id: "melo-arraijan",
    name: "Melo Pet And Garden – Arraiján",
    category: "Shops & grooming",
    province: "Panamá Oeste",
    address: "Plaza Paseo Arraiján, Arraiján",
    lat: 8.95, lng: -79.66,
    description: "Melo Pet And Garden branch in Arraiján, close to La Chorrera.",
    offers: ["Pet shop", "Pet supplies"],
    mapsQuery: "Melo Pet And Garden Arraiján Plaza Paseo Arraiján",
    approx: true
  },
  {
    id: "melo-colon",
    name: "Melo Pet And Garden – Colón",
    category: "Shops & grooming",
    province: "Colón",
    address: "Colón",
    lat: 9.355, lng: -79.899,
    description: "Melo Pet And Garden branch in the Colón province.",
    offers: ["Pet shop", "Pet supplies"],
    mapsQuery: "Melo Pet And Garden Colón Panamá",
    approx: true
  },
  {
    id: "petsfashion",
    name: "Petsfashion",
    category: "Shops & grooming",
    province: "Panamá",
    address: "Vía Argentina, Panama City",
    lat: 8.9905, lng: -79.5255,
    description: "Shop with a veterinary clinic, grooming and pharmacy.",
    offers: ["Veterinary clinic", "Grooming", "Pharmacy", "Pet shop"],
    mapsQuery: "Petsfashion Vía Argentina Panamá",
    approx: true
  },
  {
    id: "tiempo-el-valle",
    name: "Tiempo – Hotel La Compañía del Valle",
    category: "Getaways",
    province: "Coclé",
    address: "El Valle de Antón",
    lat: 8.6, lng: -80.125,
    description: "Dog-friendly restaurant inside the hotel, serving Panamanian and international dishes.",
    offers: ["Dog-friendly restaurant", "Breakfast, lunch and dinner"],
    mapsQuery: "Hotel La Compañía del Valle El Valle de Antón",
    approx: true
  }
];
