import renePhoto from '../assets/images/Rene.png';
import charlottePhoto from '../assets/images/models/Charlotte/imgi_1_4.jpg';

// Add new models here. When a backend exists, delete this file and update
// src/services/modelsService.js to call the API instead.
//
// Photos: place images in public/models/<slug>/ and reference as '/models/<slug>/cover.jpg'
// For now, imported assets are used directly.

// Stores temporary model data until the app is connected to a backend.
export const models = [
  {
    slug: 'rene',
    name: 'Rene',
    division: 'international',   // 'international' | 'local' | 'junior'
    location: 'Canada',
    basedIn: 'Calgary',
    agency: 'The Nobles Management',
    coverImage: renePhoto,
    portfolio: [renePhoto],
    stats: {
      height: "5'9\"",
      bust: '32"',
      waist: '24"',
      hips: '35"',
      shoeSize: '8',
      hairColor: 'Black',
      eyeColor: 'Brown',
    },
    bio: null,
    instagramHandle: null,
    runwayShows: [],
    featured: true,
  },
  {
    slug: 'charlotte',
    name: 'Charlotte',
    division: 'international',
    location: 'Canada',
    basedIn: 'Calgary',
    agency: 'The Nobles Management',
    coverImage: charlottePhoto,
    portfolio: [charlottePhoto],
    stats: {
      height: "5'11.5\"",
      bust: '32"',
      waist: '24"',
      hips: '35"',
      shoeSize: '38.5',
      hairColor: 'Blonde',
      eyeColor: 'Hazel',
    },
    bio: null,
    instagramHandle: null,
    runwayShows: [
      { name: 'Giorgio Armani Privé', season: 'Spring 2024' },
      { name: 'Yanina Haute Couture', season: 'Spring 2024' },
      { name: 'Rami Al Ali', season: 'Spring 2024' },
      { name: 'Julien Fournie', season: 'Spring 2024' },
      { name: 'Ronald van der Kemp', season: 'Fall 2022' },
    ],
    featured: false,
  },
];
