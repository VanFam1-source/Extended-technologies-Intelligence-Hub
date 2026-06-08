import { Partner, PartnerCategory } from './types';

export const PARTNERS: Partner[] = [
  // Server, Power & Cooling
  { id: 'vertiv', name: 'Vertiv', category: PartnerCategory.SERVER },
  { id: 'schneider-electric', name: 'Schneider Electric', category: PartnerCategory.SERVER },
  { id: 'apc', name: 'APC by Schneider Electric', category: PartnerCategory.SERVER },
  { id: 'eaton', name: 'Eaton', category: PartnerCategory.SERVER },
  { id: 'legrand', name: 'Legrand', category: PartnerCategory.SERVER },
  
  // Compute & AI
  { id: 'nvidia', name: 'NVIDIA', category: PartnerCategory.GPU_SERVER },
  { id: 'amd', name: 'AMD', category: PartnerCategory.GPU_SERVER },
  { id: 'intel', name: 'Intel', category: PartnerCategory.GPU_SERVER },
  
  // Networking
  { id: 'fortinet', name: 'Fortinet', category: PartnerCategory.NETWORKING },
  { id: 'sonicwall', name: 'SonicWall', category: PartnerCategory.NETWORKING },
  { id: 'paloalto', name: 'Palo Alto Networks', category: PartnerCategory.NETWORKING },
  { id: 'cisco', name: 'Cisco', category: PartnerCategory.NETWORKING },
  { id: 'juniper', name: 'Juniper Networks', category: PartnerCategory.NETWORKING },
  { id: 'broadcom', name: 'Broadcom', category: PartnerCategory.NETWORKING },
  { id: 'extreme', name: 'Extreme Networks', category: PartnerCategory.NETWORKING },
  { id: 'ciena', name: 'Ciena', category: PartnerCategory.NETWORKING },

  // Storage
  { id: 'datadobi', name: 'DataDobi', category: PartnerCategory.STORAGE },
  { id: 'superna', name: 'Superna', category: PartnerCategory.STORAGE },
  { id: 'samsung', name: 'Samsung', category: PartnerCategory.STORAGE },
  { id: 'micron', name: 'Micron', category: PartnerCategory.STORAGE },
  { id: 'seagate', name: 'Seagate', category: PartnerCategory.STORAGE },
  { id: 'wd', name: 'Western Digital', category: PartnerCategory.STORAGE },

  // Security (Software/SaaS focus)
  { id: 'crowdstrike', name: 'CrowdStrike', category: PartnerCategory.SECURITY },
  { id: 'zscaler', name: 'Zscaler', category: PartnerCategory.SECURITY },
  { id: 'netskope', name: 'Netskope', category: PartnerCategory.SECURITY },
  { id: 'absolute', name: 'Absolute Software', category: PartnerCategory.SECURITY },

  // Peripherals & Displays
  { id: 'logitech', name: 'Logitech', category: PartnerCategory.PERIPHERALS },
  { id: 'jabra', name: 'Jabra', category: PartnerCategory.PERIPHERALS },
  { id: 'poly', name: 'Poly', category: PartnerCategory.PERIPHERALS },
  { id: 'belkin', name: 'Belkin', category: PartnerCategory.PERIPHERALS },
  { id: 'viewsonic', name: 'ViewSonic', category: PartnerCategory.PERIPHERALS },
];

export const ASPECT_RATIOS = ["1:1", "16:9", "9:16", "4:3", "3:4"];

export const INFOGRAPHIC_STYLES = [
  { name: 'Minimalist', promptFragment: 'minimalist, data visualization, clean vector art, vibrant colors' },
  { name: 'Corporate', promptFragment: 'professional, blue and grey color palette, clean lines, corporate branding style' },
  { name: 'Futuristic', promptFragment: 'futuristic, sleek, neon accents, dark background, high-tech feel' },
  { name: 'Bold', promptFragment: 'bold typography, high contrast, impactful, strong shapes, energetic' },
  { name: 'Elegant', promptFragment: 'elegant, sophisticated, serif fonts, muted color palette, luxurious feel' },
  { name: 'Isometric', promptFragment: 'isometric 3D illustration, detailed, colorful, tech-focused' },
];