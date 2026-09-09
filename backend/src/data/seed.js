const { v4: uuidv4 } = require('uuid');
const bcryptjs = require('bcryptjs');
const { dataStore, insertOne } = require('../models/schema');

function seed() {
  const brands = [
    { id: 'b1', name: 'Apple', slug: 'apple', logo: 'https://images.unsplash.com/photo-1621768216002-5ac171876625?w=100', isFeatured: true },
    { id: 'b2', name: 'Samsung', slug: 'samsung', logo: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=100', isFeatured: true },
    { id: 'b3', name: 'OnePlus', slug: 'oneplus', logo: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=100', isFeatured: true },
    { id: 'b4', name: 'Google', slug: 'google', logo: 'https://images.unsplash.com/photo-1573804633927-bfcbcd909acd?w=100', isFeatured: true },
    { id: 'b5', name: 'Xiaomi', slug: 'xiaomi', logo: 'https://images.unsplash.com/photo-1585060544812-6b45742d762f?w=100', isFeatured: false },
    { id: 'b6', name: 'Sony', slug: 'sony', logo: 'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=100', isFeatured: true },
    { id: 'b7', name: 'LG', slug: 'lg', logo: 'https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?w=100', isFeatured: true },
    { id: 'b8', name: 'HP', slug: 'hp', logo: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=100', isFeatured: false },
  ];

  const categories = [
    { id: 'c1', name: 'Electronics', slug: 'electronics', icon: 'cpu', image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400', parentId: null, order: 1 },
    { id: 'c2', name: 'Smartphones', slug: 'smartphones', icon: 'smartphone', image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400', parentId: 'c1', order: 1 },
    { id: 'c3', name: 'Laptops', slug: 'laptops', icon: 'laptop', image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400', parentId: 'c1', order: 2 },
    { id: 'c4', name: 'Televisions', slug: 'televisions', icon: 'tv', image: 'https://images.unsplash.com/photo-1461151304265-3855494db9f1?w=400', parentId: 'c1', order: 3 },
    { id: 'c5', name: 'Audio', slug: 'audio', icon: 'headphones', image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400', parentId: 'c1', order: 4 },
    { id: 'c6', name: 'Wearables', slug: 'wearables', icon: 'watch', image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400', parentId: 'c1', order: 5 },
    { id: 'c7', name: 'Cameras', slug: 'cameras', icon: 'camera', image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400', parentId: 'c1', order: 6 },
    { id: 'c8', name: 'Gaming', slug: 'gaming', icon: 'gamepad-2', image: 'https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?w=400', parentId: 'c1', order: 7 },
    { id: 'c9', name: 'Computer Accessories', slug: 'computer-accessories', icon: 'keyboard', image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400', parentId: 'c1', order: 8 },
    { id: 'c10', name: 'Home Appliances', slug: 'home-appliances', icon: 'fan', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400', parentId: 'c1', order: 9 },
    { id: 'c11', name: 'Mobile Accessories', slug: 'mobile-accessories', icon: 'smartphone', image: 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=400', parentId: 'c1', order: 10 },
  ];
  const products = [
    {
      name: 'iPhone 16 Pro Max', price: 159900, mrp: 179900, brand: 'b1', category: 'c2', sku: 'ELEC-PHP-001',
      description: 'Apple iPhone 16 Pro Max with A18 Pro chip, 48MP camera system, and titanium design.',
      highlights: ['A18 Pro Chip', '48MP Camera System', 'Titanium Design', 'USB-C'],
      specifications: { display: '6.9 inch Super Retina XDR OLED', processor: 'A18 Pro', ram: '8GB', storage: '256GB', battery: '4685mAh', camera: '48MP + 12MP + 12MP', os: 'iOS 18' },
      tags: ['iphone', 'apple', 'smartphone', 'premium'], images: ['https://images.unsplash.com/photo-1695048065739-2e4f4e3e0e1a?w=600'],
    },
    {
      name: 'iPhone 16', price: 79900, mrp: 89900, brand: 'b1', category: 'c2', sku: 'ELEC-PHP-002',
      description: 'iPhone 16 with A18 chip and advanced dual camera system for stunning photos.',
      highlights: ['A18 Chip', '48MP Main Camera', 'Dynamic Island', 'Ceramic Shield'],
      specifications: { display: '6.1 inch Super Retina XDR OLED', processor: 'A18', ram: '8GB', storage: '128GB', battery: '3561mAh', camera: '48MP + 12MP', os: 'iOS 18' },
      tags: ['iphone', 'apple', 'smartphone'], images: ['https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=600'],
    },
    {
      name: 'Samsung Galaxy S24 Ultra', price: 134999, mrp: 149999, brand: 'b2', category: 'c2', sku: 'ELEC-PHP-003',
      description: 'Samsung Galaxy S24 Ultra with Snapdragon 8 Gen 3, S Pen, and 200MP camera.',
      highlights: ['Snapdragon 8 Gen 3', '200MP Camera', 'S Pen Built-in', 'Titanium Frame'],
      specifications: { display: '6.8 inch Dynamic AMOLED 2X', processor: 'Snapdragon 8 Gen 3', ram: '12GB', storage: '256GB', battery: '5000mAh', camera: '200MP + 12MP + 50MP + 10MP', os: 'Android 14' },
      tags: ['samsung', 'galaxy', 'smartphone', 'premium'], images: ['https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=600'],
    },
    {
      name: 'Samsung Galaxy S24', price: 74999, mrp: 79999, brand: 'b2', category: 'c2', sku: 'ELEC-PHP-004',
      description: 'Galaxy S24 with AI-powered features, stunning AMOLED display, and versatile cameras.',
      highlights: ['Galaxy AI', 'Exynos 2400', '50MP Camera', 'IP68 Water Resistant'],
      specifications: { display: '6.2 inch Dynamic AMOLED 2X', processor: 'Exynos 2400', ram: '8GB', storage: '128GB', battery: '4000mAh', camera: '50MP + 12MP + 10MP', os: 'Android 14' },
      tags: ['samsung', 'galaxy', 'smartphone'], images: ['https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=600'],
    },
    {
      name: 'OnePlus 12', price: 64999, mrp: 69999, brand: 'b3', category: 'c2', sku: 'ELEC-PHP-005',
      description: 'OnePlus 12 featuring Snapdragon 8 Gen 3, Hasselblad camera, and 100W SUPERVOOC charging.',
      highlights: ['Snapdragon 8 Gen 3', 'Hasselblad Camera', '100W SUPERVOOC', '2K 120Hz Display'],
      specifications: { display: '6.82 inch 2K LTPO AMOLED', processor: 'Snapdragon 8 Gen 3', ram: '12GB', storage: '256GB', battery: '5400mAh', camera: '50MP + 48MP + 64MP', os: 'Android 14' },
      tags: ['oneplus', 'smartphone', 'fast-charging'], images: ['https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=600'],
    },
    {
      name: 'OnePlus Nord CE4', price: 24999, mrp: 27999, brand: 'b3', category: 'c2', sku: 'ELEC-PHP-006',
      description: 'OnePlus Nord CE4 with Snapdragon 7 Gen 3 and 100W SUPERVOOC fast charging.',
      highlights: ['Snapdragon 7 Gen 3', '100W SUPERVOOC', '50MP Sony Camera', '5500mAh Battery'],
      specifications: { display: '6.7 inch AMOLED 120Hz', processor: 'Snapdragon 7 Gen 3', ram: '8GB', storage: '128GB', battery: '5500mAh', camera: '50MP + 2MP', os: 'Android 14' },
      tags: ['oneplus', 'smartphone', 'mid-range'], images: ['https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=600'],
    },
    {
      name: 'Google Pixel 8 Pro', price: 89999, mrp: 99999, brand: 'b4', category: 'c2', sku: 'ELEC-PHP-007',
      description: 'Google Pixel 8 Pro powered by Tensor G3 with pro-level camera and 7 years of updates.',
      highlights: ['Tensor G3 Chip', '50MP Pro Camera', '7 Years of Updates', 'AI Photo Editing'],
      specifications: { display: '6.7 inch LTPO OLED 120Hz', processor: 'Google Tensor G3', ram: '12GB', storage: '128GB', battery: '5050mAh', camera: '50MP + 48MP + 48MP', os: 'Android 14' },
      tags: ['google', 'pixel', 'smartphone', 'camera'], images: ['https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=600'],
    },
    {
      name: 'Google Pixel 8a', price: 49999, mrp: 54999, brand: 'b4', category: 'c2', sku: 'ELEC-PHP-008',
      description: 'Affordable Google Pixel 8a with Tensor G3, flagship cameras, and 7 years of support.',
      highlights: ['Tensor G3', '64MP Camera', '120Hz Display', 'IP67 Water Resistant'],
      specifications: { display: '6.1 inch OLED 120Hz', processor: 'Google Tensor G3', ram: '8GB', storage: '128GB', battery: '4492mAh', camera: '64MP + 13MP', os: 'Android 14' },
      tags: ['google', 'pixel', 'smartphone', 'value'], images: ['https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=600'],
    },
    {
      name: 'Xiaomi 14', price: 69999, mrp: 74999, brand: 'b5', category: 'c2', sku: 'ELEC-PHP-009',
      description: 'Xiaomi 14 co-engineered with Leica featuring Snapdragon 8 Gen 3 and premium cameras.',
      highlights: ['Leica Optics', 'Snapdragon 8 Gen 3', '90W HyperCharge', 'Leica Summilux Lens'],
      specifications: { display: '6.36 inch LTPO AMOLED', processor: 'Snapdragon 8 Gen 3', ram: '12GB', storage: '256GB', battery: '4610mAh', camera: '50MP + 50MP + 50MP', os: 'Android 14' },
      tags: ['xiaomi', 'smartphone', 'camera', 'premium'], images: ['https://images.unsplash.com/photo-1585060544812-6b45742d762f?w=600'],
    },
    {
      name: 'Xiaomi Redmi Note 13 Pro', price: 19999, mrp: 22999, brand: 'b5', category: 'c2', sku: 'ELEC-PHP-010',
      description: 'Xiaomi Redmi Note 13 Pro with 200MP camera, 120Hz AMOLED, and 5100mAh battery.',
      highlights: ['200MP Camera', '120Hz AMOLED', '5100mAh Battery', '33W Fast Charging'],
      specifications: { display: '6.67 inch AMOLED 120Hz', processor: 'Snapdragon 7s Gen 2', ram: '8GB', storage: '128GB', battery: '5100mAh', camera: '200MP + 8MP + 2MP', os: 'Android 13' },
      tags: ['xiaomi', 'redmi', 'smartphone', 'budget'], images: ['https://images.unsplash.com/photo-1585060544812-6b45742d762f?w=600'],
    },
    {
      name: 'Samsung Galaxy Z Flip 6', price: 109999, mrp: 119999, brand: 'b2', category: 'c2', sku: 'ELEC-PHP-011',
      description: 'Samsung Galaxy Z Flip 6 foldable phone with Flex Mode and advanced AI features.',
      highlights: ['Snapdragon 8 Gen 3', 'Flex Mode', '3.4 inch Cover Screen', 'Galaxy AI'],
      specifications: { display: '6.7 inch Dynamic AMOLED 2X Foldable', processor: 'Snapdragon 8 Gen 3', ram: '12GB', storage: '256GB', battery: '4000mAh', camera: '50MP + 12MP', os: 'Android 14' },
      tags: ['samsung', 'foldable', 'smartphone', 'premium'], images: ['https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=600'],
    },
    {
      name: 'OnePlus Open', price: 139999, mrp: 149999, brand: 'b3', category: 'c2', sku: 'ELEC-PHP-012',
      description: 'OnePlus Open foldable phone with a 7.82 inch inner display and triple camera system.',
      highlights: ['Snapdragon 8 Gen 2', '7.82 inch Inner Display', 'Hasselblad Camera', '4805mAh Battery'],
      specifications: { display: '7.82 inch 2K Foldable AMOLED', processor: 'Snapdragon 8 Gen 2', ram: '16GB', storage: '512GB', battery: '4805mAh', camera: '48MP + 48MP + 64MP', os: 'Android 13' },
      tags: ['oneplus', 'foldable', 'smartphone', 'premium'], images: ['https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=600'],
    },
    {
      name: 'Samsung Galaxy A55', price: 32999, mrp: 37999, brand: 'b2', category: 'c2', sku: 'ELEC-PHP-013',
      description: 'Samsung Galaxy A55 with metal frame, 50MP OIS camera, and IP67 water resistance.',
      highlights: ['Exynos 1480', '50MP OIS Camera', 'IP67 Water Resistant', '5000mAh Battery'],
      specifications: { display: '6.6 inch Super AMOLED 120Hz', processor: 'Exynos 1480', ram: '8GB', storage: '128GB', battery: '5000mAh', camera: '50MP + 12MP + 5MP', os: 'Android 14' },
      tags: ['samsung', 'galaxy', 'smartphone', 'mid-range'], images: ['https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=600'],
    },
    {
      name: 'iQOO 12', price: 52999, mrp: 57999, brand: 'b5', category: 'c2', sku: 'ELEC-PHP-014',
      description: 'iQOO 12 with Snapdragon 8 Gen 3, 144Hz display, and 120W fast charging.',
      highlights: ['Snapdragon 8 Gen 3', '144Hz AMOLED', '120W FlashCharge', '50MP OIS Camera'],
      specifications: { display: '6.78 inch 1.5K AMOLED 144Hz', processor: 'Snapdragon 8 Gen 3', ram: '12GB', storage: '256GB', battery: '5000mAh', camera: '50MP + 13MP + 8MP', os: 'Android 14' },
      tags: ['iqoo', 'xiaomi', 'smartphone', 'gaming'], images: ['https://images.unsplash.com/photo-1585060544812-6b45742d762f?w=600'],
    },
    {
      name: 'MacBook Pro 14 inch M3 Pro', price: 199900, mrp: 219900, brand: 'b1', category: 'c3', sku: 'ELEC-LPT-015',
      description: 'Apple MacBook Pro 14 inch with M3 Pro chip, 18GB unified memory, and stunning Liquid Retina XDR display.',
      highlights: ['M3 Pro Chip', '18GB Unified Memory', 'Liquid Retina XDR Display', 'Up to 18hr Battery'],
      specifications: { processor: 'Apple M3 Pro', ram: '18GB Unified Memory', storage: '512GB SSD', display: '14.2 inch Liquid Retina XDR', gpu: '18-core GPU', battery: 'Up to 18 hours' },
      tags: ['macbook', 'apple', 'laptop', 'professional'], images: ['https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600'],
    },
    {
      name: 'MacBook Air 13 inch M3', price: 114900, mrp: 124900, brand: 'b1', category: 'c3', sku: 'ELEC-LPT-016',
      description: 'Thinnest MacBook Air with M3 chip, 15hr battery life, and fanless design.',
      highlights: ['M3 Chip', 'Fanless Design', '15hr Battery Life', 'Liquid Retina Display'],
      specifications: { processor: 'Apple M3', ram: '8GB Unified Memory', storage: '256GB SSD', display: '13.6 inch Liquid Retina', gpu: '10-core GPU', battery: 'Up to 15 hours' },
      tags: ['macbook', 'apple', 'laptop', 'ultrabook'], images: ['https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600'],
    },
    {
      name: 'Dell XPS 15', price: 149999, mrp: 169999, brand: 'b8', category: 'c3', sku: 'ELEC-LPT-017',
      description: 'Dell XPS 15 with Intel Core Ultra 7, OLED InfinityEdge display, and premium build quality.',
      highlights: ['Intel Core Ultra 7', '3.5K OLED Display', '32GB DDR5 RAM', '1TB SSD'],
      specifications: { processor: 'Intel Core Ultra 7 155H', ram: '32GB DDR5', storage: '1TB NVMe SSD', display: '15.6 inch 3.5K OLED', gpu: 'Intel Arc', battery: 'Up to 13 hours' },
      tags: ['dell', 'xps', 'laptop', 'premium'], images: ['https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?w=600'],
    },
    {
      name: 'HP Spectre x360 14', price: 129999, mrp: 144999, brand: 'b8', category: 'c3', sku: 'ELEC-LPT-018',
      description: 'HP Spectre x360 14 convertible laptop with 2.8K OLED touchscreen and Intel Evo platform.',
      highlights: ['Intel Core Ultra 7', '2.8K OLED Touch', '360-degree Hinge', 'Bang & Olufsen Audio'],
      specifications: { processor: 'Intel Core Ultra 7 155H', ram: '16GB LPDDR5x', storage: '1TB SSD', display: '14 inch 2.8K OLED Touch', gpu: 'Intel Arc', battery: 'Up to 15 hours' },
      tags: ['hp', 'spectre', 'laptop', '2-in-1'], images: ['https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=600'],
    },
    {
      name: 'Lenovo ThinkPad X1 Carbon Gen 12', price: 159999, mrp: 179999, brand: 'b8', category: 'c3', sku: 'ELEC-LPT-019',
      description: 'Lenovo ThinkPad X1 Carbon Gen 12 ultralight business laptop with Intel Core Ultra and MIL-STD durability.',
      highlights: ['Intel Core Ultra 7', '14 inch 2.8K OLED', 'MIL-STD-810H', 'TrackPoint'],
      specifications: { processor: 'Intel Core Ultra 7 155H', ram: '32GB LPDDR5x', storage: '1TB SSD', display: '14 inch 2.8K OLED', gpu: 'Intel Arc', battery: 'Up to 15 hours' },
      tags: ['lenovo', 'thinkpad', 'laptop', 'business'], images: ['https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=600'],
    },
    {
      name: 'ASUS ROG Strix G16', price: 139999, mrp: 159999, brand: 'b8', category: 'c3', sku: 'ELEC-LPT-020',
      description: 'ASUS ROG Strix G16 gaming laptop with Intel Core i9, RTX 4070, and 165Hz display.',
      highlights: ['Intel Core i9-14900HX', 'RTX 4070 8GB', '165Hz QHD Display', 'RGB Keyboard'],
      specifications: { processor: 'Intel Core i9-14900HX', ram: '16GB DDR5', storage: '1TB PCIe Gen4 SSD', display: '16 inch QHD 165Hz', gpu: 'NVIDIA RTX 4070 8GB', battery: 'Up to 8 hours' },
      tags: ['asus', 'rog', 'gaming', 'laptop'], images: ['https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?w=600'],
    },
    {
      name: 'HP Victus 16', price: 79999, mrp: 89999, brand: 'b8', category: 'c3', sku: 'ELEC-LPT-021',
      description: 'HP Victus 16 gaming laptop with Intel Core i7 and RTX 4060 for smooth gameplay.',
      highlights: ['Intel Core i7-14700HX', 'RTX 4060 8GB', '144Hz FHD Display', 'OMEN Gaming Hub'],
      specifications: { processor: 'Intel Core i7-14700HX', ram: '16GB DDR5', storage: '512GB SSD', display: '16.1 inch FHD 144Hz', gpu: 'NVIDIA RTX 4060 8GB', battery: 'Up to 7 hours' },
      tags: ['hp', 'victus', 'gaming', 'laptop'], images: ['https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=600'],
    },
    {
      name: 'MacBook Pro 16 inch M3 Max', price: 349900, mrp: 379900, brand: 'b1', category: 'c3', sku: 'ELEC-LPT-022',
      description: 'Most powerful MacBook Pro with M3 Max chip, 40-core GPU, and up to 128GB unified memory.',
      highlights: ['M3 Max Chip', '40-core GPU', '36GB Unified Memory', '22hr Battery Life'],
      specifications: { processor: 'Apple M3 Max', ram: '36GB Unified Memory', storage: '1TB SSD', display: '16.2 inch Liquid Retina XDR', gpu: '40-core GPU', battery: 'Up to 22 hours' },
      tags: ['macbook', 'apple', 'laptop', 'workstation'], images: ['https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600'],
    },
    {
      name: 'LG 65 inch OLED C4 4K Smart TV', price: 169990, mrp: 209990, brand: 'b7', category: 'c4', sku: 'ELEC-TVS-023',
      description: 'LG OLED C4 with a9 Gen7 AI Processor, Dolby Vision and Atmos, and perfect blacks.',
      highlights: ['OLED evo Panel', 'a9 Gen7 AI Processor', 'Dolby Vision & Atmos', '120Hz Refresh Rate'],
      specifications: { display: '65 inch OLED evo 4K', refreshRate: '120Hz', hdr: 'Dolby Vision, HDR10, HLG', sound: '40W 2.2ch', os: 'webOS 24', ports: '4 HDMI 2.1' },
      tags: ['lg', 'oled', 'tv', '4k', 'smart-tv'], images: ['https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=600'],
    },
    {
      name: 'Samsung 55 inch QN90C Neo QLED 4K TV', price: 109990, mrp: 139990, brand: 'b2', category: 'c4', sku: 'ELEC-TVS-024',
      description: 'Samsung Neo QLED with Quantum Matrix Technology, Anti-Glare screen, and Object Tracking Sound.',
      highlights: ['Neo QLED', 'Quantum Matrix Technology', 'Anti-Glare Screen', 'Object Tracking Sound+'],
      specifications: { display: '55 inch Neo QLED 4K', refreshRate: '120Hz', hdr: 'HDR10+, Dolby Atmos', sound: '60W OTS+', os: 'Tizen', ports: '4 HDMI 2.1' },
      tags: ['samsung', 'qled', 'tv', '4k'], images: ['https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=600'],
    },
    {
      name: 'Sony BRAVIA XR A80L 65 inch OLED 4K TV', price: 199990, mrp: 249990, brand: 'b6', category: 'c4', sku: 'ELEC-TVS-025',
      description: 'Sony BRAVIA XR A80L with Cognitive Processor XR and Acoustic Surface Audio+.',
      highlights: ['Cognitive Processor XR', 'Acoustic Surface Audio+', 'Dolby Vision & Atmos', 'Google TV'],
      specifications: { display: '65 inch OLED 4K', refreshRate: '120Hz', hdr: 'Dolby Vision, HDR10', sound: 'Acoustic Surface Audio+', os: 'Google TV', ports: '4 HDMI 2.1' },
      tags: ['sony', 'bravia', 'oled', 'tv', '4k'], images: ['https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=600'],
    },
    {
      name: 'Xiaomi TV A Pro 55 inch 4K', price: 36999, mrp: 44999, brand: 'b5', category: 'c4', sku: 'ELEC-TVS-026',
      description: 'Xiaomi TV A Pro 55 inch with 4K HDR, Dolby Audio, and built-in Chromecast.',
      highlights: ['4K HDR', 'Dolby Audio', 'Chromecast Built-in', 'PatchWall 4.0'],
      specifications: { display: '55 inch VA 4K', refreshRate: '60Hz', hdr: 'HDR10, HLG', sound: '30W Dolby Audio', os: 'PatchWall / Google TV', ports: '3 HDMI' },
      tags: ['xiaomi', 'tv', '4k', 'budget'], images: ['https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=600'],
    },
    {
      name: 'LG 43 inch UR7300 4K Smart TV', price: 37990, mrp: 44990, brand: 'b7', category: 'c4', sku: 'ELEC-TVS-027',
      description: 'LG UR7300 4K Smart TV with a5 Gen6 AI Processor and webOS 24.',
      highlights: ['a5 Gen6 AI Processor', '4K Upscaling', 'webOS 24', 'Active HDR'],
      specifications: { display: '43 inch UHD 4K', refreshRate: '60Hz', hdr: 'HDR10, HLG, Active HDR', sound: '20W 2.0ch', os: 'webOS 24', ports: '3 HDMI' },
      tags: ['lg', 'tv', '4k', 'smart-tv'], images: ['https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=600'],
    },
    {
      name: 'Sony BRAVIA X80L 55 inch 4K Google TV', price: 64990, mrp: 79990, brand: 'b6', category: 'c4', sku: 'ELEC-TVS-028',
      description: 'Sony BRAVIA X80L with 4K HDR Processor X1, Dolby Atmos, and Google TV.',
      highlights: ['4K HDR Processor X1', 'Dolby Atmos', 'Google TV', 'X-Balanced Speaker'],
      specifications: { display: '55 inch LED 4K', refreshRate: '60Hz', hdr: 'Dolby Vision, HDR10', sound: '20W X-Balanced', os: 'Google TV', ports: '4 HDMI' },
      tags: ['sony', 'bravia', 'tv', '4k'], images: ['https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=600'],
    },
    {
      name: 'Samsung 43 inch Crystal UHD 4K TV', price: 32990, mrp: 39990, brand: 'b2', category: 'c4', sku: 'ELEC-TVS-029',
      description: 'Samsung Crystal UHD 4K TV with PurColor, Crystal Processor 4K, and Smart Hub.',
      highlights: ['Crystal Processor 4K', 'PurColor', 'Smart Hub', 'Q-Symphony'],
      specifications: { display: '43 inch Crystal UHD 4K', refreshRate: '60Hz', hdr: 'HDR10+', sound: '20W 2ch', os: 'Tizen', ports: '3 HDMI' },
      tags: ['samsung', 'crystal', 'tv', '4k', 'budget'], images: ['https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=600'],
    },
    {
      name: 'Xiaomi TV X 65 inch 4K', price: 54999, mrp: 64999, brand: 'b5', category: 'c4', sku: 'ELEC-TVS-030',
      description: 'Xiaomi TV X 65 inch with 4K Quantum Dot display, 120Hz MEMC, and Dolby Vision.',
      highlights: ['Quantum Dot', '120Hz MEMC', 'Dolby Vision', '30W Dolby Atmos'],
      specifications: { display: '65 inch Quantum Dot 4K', refreshRate: '60Hz', hdr: 'Dolby Vision, HDR10+', sound: '30W Dolby Atmos', os: 'PatchWall / Google TV', ports: '3 HDMI' },
      tags: ['xiaomi', 'tv', '4k', 'quantum-dot'], images: ['https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=600'],
    },
    {
      name: 'AirPods Pro 2nd Gen USB-C', price: 24900, mrp: 27900, brand: 'b1', category: 'c5', sku: 'ELEC-AUD-031',
      description: 'Apple AirPods Pro 2nd generation with USB-C, Adaptive Audio, and up to 6hr listening time.',
      highlights: ['Adaptive Audio', 'USB-C Charging', 'Up to 6hr Battery', 'Personalized Spatial Audio'],
      specifications: { driver: 'Custom Apple Driver', connectivity: 'Bluetooth 5.3', battery: '6hr + 30hr Case', charging: 'USB-C / MagSafe' },
      tags: ['airpods', 'apple', 'earbuds', 'wireless'], images: ['https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=600'],
    },
    {
      name: 'Sony WH-1000XM5', price: 29990, mrp: 34990, brand: 'b6', category: 'c5', sku: 'ELEC-AUD-032',
      description: 'Sony WH-1000XM5 industry-leading noise cancelling headphones with 30hr battery.',
      highlights: ['Industry-leading ANC', '30hr Battery Life', 'Multipoint Connection', 'Hi-Res Audio'],
      specifications: { driver: '30mm', connectivity: 'Bluetooth 5.2', battery: '30 hours', anc: 'Adaptive ANC' },
      tags: ['sony', 'headphones', 'noise-cancelling', 'premium'], images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600'],
    },
    {
      name: 'Samsung Galaxy Buds2 Pro', price: 17999, mrp: 20999, brand: 'b2', category: 'c5', sku: 'ELEC-AUD-033',
      description: 'Samsung Galaxy Buds2 Pro with 24-bit Hi-Fi sound and intelligent ANC.',
      highlights: ['24-bit Hi-Fi Sound', 'Intelligent ANC', '360 Audio', 'IPX7 Water Resistant'],
      specifications: { driver: '10mm + 5.3mm', connectivity: 'Bluetooth 5.3', battery: '5hr + 18hr Case', codec: 'Samsung Seamless Codec' },
      tags: ['samsung', 'galaxy-buds', 'earbuds', 'wireless'], images: ['https://images.unsplash.com/photo-1590658268037-6bf12f032f55?w=600'],
    },
    {
      name: 'JBL Charge 5', price: 17999, mrp: 20999, brand: 'b6', category: 'c5', sku: 'ELEC-AUD-034',
      description: 'JBL Charge 5 portable Bluetooth speaker with IP67 waterproof rating and powerbank feature.',
      highlights: ['IP67 Waterproof', '20hr Battery Life', 'Built-in Powerbank', 'JBL PartyBoost'],
      specifications: { power: '30W', connectivity: 'Bluetooth 5.1', battery: '20 hours', waterproof: 'IP67' },
      tags: ['jbl', 'speaker', 'bluetooth', 'portable'], images: ['https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600'],
    },
    {
      name: 'Sony WF-1000XM5', price: 27990, mrp: 31990, brand: 'b6', category: 'c5', sku: 'ELEC-AUD-035',
      description: 'Sony WF-1000XM5 true wireless earbuds with industry-leading noise cancelling.',
      highlights: ['Industry-leading ANC', '8hr + 24hr Battery', 'Hi-Res Audio Wireless', 'LDAC Codec'],
      specifications: { driver: '8.4mm', connectivity: 'Bluetooth 5.3', battery: '8hr + 24hr Case', codec: 'LDAC, AAC' },
      tags: ['sony', 'earbuds', 'wireless', 'premium'], images: ['https://images.unsplash.com/photo-1590658268037-6bf12f032f55?w=600'],
    },
    {
      name: 'Marshall Stanmore III', price: 24999, mrp: 29999, brand: 'b6', category: 'c5', sku: 'ELEC-AUD-036',
      description: 'Marshall Stanmore III Bluetooth home speaker with iconic design and rich sound.',
      highlights: ['80W Output', 'Bluetooth 5.2', 'Classic Marshall Design', 'Multi-Host'],
      specifications: { power: '80W', connectivity: 'Bluetooth 5.2 + 3.5mm + RCA', drivers: '2 x 15W + 1 x 50W', bass: 'Adjustable' },
      tags: ['marshall', 'speaker', 'home', 'bluetooth'], images: ['https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600'],
    },
    {
      name: 'OnePlus Buds Pro 2', price: 11999, mrp: 14999, brand: 'b3', category: 'c5', sku: 'ELEC-AUD-037',
      description: 'OnePlus Buds Pro 2 with Dynaudio tuning and 49dB adaptive noise cancellation.',
      highlights: ['Dynaudio Co-Created', '49dB ANC', '11hr Battery Life', 'LHDC 5.0'],
      specifications: { driver: '11mm + 6mm', connectivity: 'Bluetooth 5.3', battery: '11hr + 36hr Case', codec: 'LHDC 5.0, AAC' },
      tags: ['oneplus', 'earbuds', 'wireless', 'anc'], images: ['https://images.unsplash.com/photo-1590658268037-6bf12f032f55?w=600'],
    },
    {
      name: 'JBL Flip 6', price: 12999, mrp: 15999, brand: 'b6', category: 'c5', sku: 'ELEC-AUD-038',
      description: 'JBL Flip 6 portable speaker with IP67 waterproof, 12hr playtime, and PartyBoost.',
      highlights: ['IP67 Waterproof', '12hr Battery Life', 'PartyBoost', 'JBL Pro Sound'],
      specifications: { power: '20W', connectivity: 'Bluetooth 5.1', battery: '12 hours', waterproof: 'IP67' },
      tags: ['jbl', 'speaker', 'bluetooth', 'portable'], images: ['https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600'],
    },
    {
      name: 'Sony SRS-XB100', price: 4990, mrp: 5990, brand: 'b6', category: 'c5', sku: 'ELEC-AUD-039',
      description: 'Sony SRS-XB100 compact portable speaker with Extra Bass and IP67 waterproof rating.',
      highlights: ['Extra Bass', 'IP67 Waterproof', '16hr Battery Life', 'Compact Design'],
      specifications: { power: '5W', connectivity: 'Bluetooth 5.3', battery: '16 hours', waterproof: 'IP67' },
      tags: ['sony', 'speaker', 'bluetooth', 'compact'], images: ['https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600'],
    },
    {
      name: 'Sennheiser Momentum 4 Wireless', price: 34990, mrp: 39990, brand: 'b6', category: 'c5', sku: 'ELEC-AUD-040',
      description: 'Sennheiser Momentum 4 Wireless headphones with 42hr battery and audiophile-grade sound.',
      highlights: ['42hr Battery Life', 'Adaptive ANC', 'Audiophile Sound', 'Multipoint'],
      specifications: { driver: '42mm', connectivity: 'Bluetooth 5.2', battery: '42 hours', anc: 'Adaptive ANC' },
      tags: ['sennheiser', 'headphones', 'premium', 'wireless'], images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600'],
    },
    {
      name: 'Apple Watch Series 9 45mm', price: 44900, mrp: 49900, brand: 'b1', category: 'c6', sku: 'ELEC-WAR-041',
      description: 'Apple Watch Series 9 with S9 chip, always-on Retina display, and advanced health sensors.',
      highlights: ['S9 SiP', 'Always-On Retina Display', 'Blood Oxygen Sensor', 'ECG App'],
      specifications: { display: '1.9 inch Always-On Retina', processor: 'S9 SiP', battery: '18 hours', connectivity: 'GPS + Cellular', water_resistance: 'WR50' },
      tags: ['apple', 'smartwatch', 'fitness', 'health'], images: ['https://images.unsplash.com/photo-1546868871-af0de0ae72be?w=600'],
    },
    {
      name: 'Samsung Galaxy Watch 6 Classic 47mm', price: 37999, mrp: 42999, brand: 'b2', category: 'c6', sku: 'ELEC-WAR-042',
      description: 'Samsung Galaxy Watch 6 Classic with rotating bezel, sapphire crystal, and Wear OS.',
      highlights: ['Rotating Bezel', 'Sapphire Crystal Glass', 'BioActive Sensor', 'Wear OS 4'],
      specifications: { display: '1.5 inch Super AMOLED', processor: 'Exynos W930', battery: '40 hours', connectivity: 'Bluetooth + LTE', water_resistance: '5ATM + IP68' },
      tags: ['samsung', 'galaxy-watch', 'smartwatch', 'premium'], images: ['https://images.unsplash.com/photo-1546868871-af0de0ae72be?w=600'],
    },
    {
      name: 'Google Pixel Watch 2', price: 34999, mrp: 39999, brand: 'b4', category: 'c6', sku: 'ELEC-WAR-043',
      description: 'Google Pixel Watch 2 with Fitbit health tracking and Google AI integration.',
      highlights: ['Fitbit Health Tracking', 'Google AI', 'Snapdragon W5', 'Wear OS 4'],
      specifications: { display: '1.36 inch AMOLED', processor: 'Snapdragon W5 Gen 1', battery: '24 hours', connectivity: 'Bluetooth + LTE', water_resistance: '5ATM + IP68' },
      tags: ['google', 'pixel-watch', 'smartwatch', 'fitbit'], images: ['https://images.unsplash.com/photo-1546868871-af0de0ae72be?w=600'],
    },
    {
      name: 'Garmin Venu 3', price: 49990, mrp: 54990, brand: 'b6', category: 'c6', sku: 'ELEC-WAR-044',
      description: 'Garmin Venu 3 with AMOLED display, advanced sleep coaching, and up to 14-day battery.',
      highlights: ['AMOLED Display', 'Advanced Sleep Coaching', '14-day Battery', 'Body Battery'],
      specifications: { display: '1.4 inch AMOLED', processor: 'Garmin proprietary', battery: 'Up to 14 days', connectivity: 'Bluetooth + WiFi', water_resistance: '5ATM' },
      tags: ['garmin', 'smartwatch', 'fitness', 'premium'], images: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600'],
    },
    {
      name: 'Noise ColorFit Pro 5 Max', price: 4999, mrp: 6999, brand: 'b5', category: 'c6', sku: 'ELEC-WAR-045',
      description: 'Noise ColorFit Pro 5 Max with 1.96 inch AMOLED display and Bluetooth calling.',
      highlights: ['1.96 inch AMOLED', 'Bluetooth Calling', '100+ Sports Modes', 'SpO2 Monitoring'],
      specifications: { display: '1.96 inch AMOLED', battery: 'Up to 7 days', connectivity: 'Bluetooth 5.3', water_resistance: 'IP68' },
      tags: ['noise', 'smartwatch', 'budget', 'fitness'], images: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600'],
    },
    {
      name: 'Amazfit T-Rex Ultra', price: 29999, mrp: 34999, brand: 'b5', category: 'c6', sku: 'ELEC-WAR-046',
      description: 'Amazfit T-Rex Ultra rugged smartwatch with 1000 nit AMOLED and dual-band GPS.',
      highlights: ['1000 nit AMOLED', 'Dual-Band GPS', 'Military Grade', 'Free-Diving Mode'],
      specifications: { display: '1.39 inch AMOLED', battery: 'Up to 20 days', connectivity: 'Bluetooth 5.3', water_resistance: '10ATM' },
      tags: ['amazfit', 'smartwatch', 'rugged', 'outdoor'], images: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600'],
    },
    {
      name: 'Apple Watch Ultra 2', price: 89900, mrp: 94900, brand: 'b1', category: 'c6', sku: 'ELEC-WAR-047',
      description: 'Apple Watch Ultra 2 with rugged titanium case, precision dual-frequency GPS, and 36hr battery.',
      highlights: ['Titanium Case', 'Dual-Frequency GPS', '36hr Battery', 'Depth Gauge'],
      specifications: { display: '1.93 inch Always-On Retina', processor: 'S9 SiP', battery: '36 hours', connectivity: 'GPS + LTE', water_resistance: 'WR100' },
      tags: ['apple', 'smartwatch', 'rugged', 'premium'], images: ['https://images.unsplash.com/photo-1546868871-af0de0ae72be?w=600'],
    },
    {
      name: 'Samsung Galaxy Fit 3', price: 8999, mrp: 11999, brand: 'b2', category: 'c6', sku: 'ELEC-WAR-048',
      description: 'Samsung Galaxy Fit 3 fitness band with 1.6 inch AMOLED display and 13-day battery.',
      highlights: ['1.6 inch AMOLED', '13-day Battery', 'Heart Rate & Sleep', 'Water Resistant'],
      specifications: { display: '1.6 inch AMOLED', battery: 'Up to 13 days', connectivity: 'Bluetooth 5.3', water_resistance: '5ATM + IP68' },
      tags: ['samsung', 'fitness-band', 'budget', 'fitness'], images: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600'],
    },
    {
      name: 'Sony Alpha A7 IV', price: 199990, mrp: 229990, brand: 'b6', category: 'c7', sku: 'ELEC-CAM-049',
      description: 'Sony Alpha A7 IV full-frame mirrorless camera with 33MP sensor and real-time AF.',
      highlights: ['33MP Full-Frame CMOS', 'Real-time Eye AF', '4K 60fps', '10fps Continuous Shooting'],
      specifications: { sensor: '33MP Full-Frame Exmor R', iso: '100-51200', video: '4K 60fps', autofocus: '759-point Phase Detection', stabilization: '5-axis IBIS' },
      tags: ['sony', 'camera', 'mirrorless', 'full-frame'], images: ['https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600'],
    },
    {
      name: 'Canon EOS R6 Mark II', price: 249990, mrp: 279990, brand: 'b6', category: 'c7', sku: 'ELEC-CAM-050',
      description: 'Canon EOS R6 Mark II with 24.2MP sensor, 40fps shooting, and up to 8-stop IBIS.',
      highlights: ['24.2MP CMOS Sensor', '40fps Electronic Shutter', '8-stop IBIS', '4K 60fps Oversampled'],
      specifications: { sensor: '24.2MP Full-Frame CMOS', iso: '100-102400', video: '4K 60fps', autofocus: 'Dual Pixel CMOS AF II', stabilization: '8-stop IBIS' },
      tags: ['canon', 'camera', 'mirrorless', 'full-frame'], images: ['https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600'],
    },
    {
      name: 'GoPro HERO 12 Black', price: 39999, mrp: 45999, brand: 'b6', category: 'c7', sku: 'ELEC-CAM-051',
      description: 'GoPro HERO 12 Black with HyperSmooth 6.0, 5.3K video, and HDR photo capability.',
      highlights: ['5.3K Video', 'HyperSmooth 6.0', '27MP Photos', 'Waterproof 10m'],
      specifications: { sensor: '27MP', video: '5.3K 60fps / 4K 120fps', waterproof: '10m without housing', battery: '1720mAh', connectivity: 'WiFi 6, Bluetooth 5.0' },
      tags: ['gopro', 'action-camera', 'waterproof', '4k'], images: ['https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600'],
    },
    {
      name: 'Sony Alpha A6700', price: 129990, mrp: 144990, brand: 'b6', category: 'c7', sku: 'ELEC-CAM-052',
      description: 'Sony Alpha A6700 APS-C mirrorless camera with AI-based AF and 4K 120fps.',
      highlights: ['26MP APS-C Sensor', 'AI-based AF', '4K 120fps', 'S-Cinetone Color'],
      specifications: { sensor: '26MP APS-C Exmor R', iso: '100-32000', video: '4K 120fps', autofocus: '759-point Phase Detection', stabilization: '5-axis IBIS' },
      tags: ['sony', 'camera', 'mirrorless', 'aps-c'], images: ['https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600'],
    },
    {
      name: 'DJI Mini 4 Pro', price: 79999, mrp: 89999, brand: 'b6', category: 'c7', sku: 'ELEC-CAM-053',
      description: 'DJI Mini 4 Pro sub-250g drone with 4K HDR video and omnidirectional obstacle sensing.',
      highlights: ['4K HDR Video', 'Sub-250g', 'Omnidirectional Sensing', '34min Flight Time'],
      specifications: { sensor: '1/1.3 inch CMOS', video: '4K 100fps', weight: '249g', flight_time: '34 minutes', range: '20km' },
      tags: ['dji', 'drone', 'camera', '4k'], images: ['https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600'],
    },
    {
      name: 'Fujifilm X-T5', price: 159990, mrp: 179990, brand: 'b6', category: 'c7', sku: 'ELEC-CAM-054',
      description: 'Fujifilm X-T5 retro-style mirrorless camera with 40MP X-Trans sensor and film simulations.',
      highlights: ['40MP X-Trans Sensor', '6.2K Video', 'Film Simulations', '7-stop IBIS'],
      specifications: { sensor: '40.2MP APS-C X-Trans CMOS 5 HR', iso: '125-12800', video: '6.2K 30fps', autofocus: 'Hybrid AF', stabilization: '7-stop IBIS' },
      tags: ['fujifilm', 'camera', 'mirrorless', 'retro'], images: ['https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600'],
    },
    {
      name: 'Canon EOS R50', price: 74990, mrp: 82990, brand: 'b6', category: 'c7', sku: 'ELEC-CAM-055',
      description: 'Canon EOS R50 compact mirrorless camera with 24.2MP sensor and creative assist modes.',
      highlights: ['24.2MP APS-C Sensor', '4K 30fps', 'Dual Pixel CMOS AF II', 'Compact & Light'],
      specifications: { sensor: '24.2MP APS-C CMOS', iso: '100-32000', video: '4K 30fps', autofocus: 'Dual Pixel CMOS AF II', stabilization: 'Digital IS' },
      tags: ['canon', 'camera', 'mirrorless', 'beginner'], images: ['https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600'],
    },
    {
      name: 'Sony ZV-E10 II', price: 74990, mrp: 82990, brand: 'b6', category: 'c7', sku: 'ELEC-CAM-056',
      description: 'Sony ZV-E10 II vlogging camera with 26MP sensor and product showcase mode.',
      highlights: ['26MP APS-C Sensor', '4K 60fps', 'Product Showcase', 'Background Defocus'],
      specifications: { sensor: '26MP APS-C Exmor R', iso: '100-32000', video: '4K 60fps', autofocus: '759-point Phase Detection', stabilization: 'Electronic IS' },
      tags: ['sony', 'camera', 'vlogging', 'compact'], images: ['https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600'],
    },
    {
      name: 'Sony PlayStation 5 Slim', price: 54990, mrp: 59990, brand: 'b6', category: 'c8', sku: 'ELEC-GME-057',
      description: 'Sony PS5 Slim with 1TB SSD, DualSense controller, and ray tracing support.',
      highlights: ['1TB SSD', 'Ray Tracing', 'DualSense Controller', '4K 120fps Gaming'],
      specifications: { processor: 'AMD Zen 2, 8-core 3.5GHz', gpu: 'AMD RDNA 2, 10.28 TFLOPS', storage: '1TB NVMe SSD', ram: '16GB GDDR6', output: '4K 120fps / 8K' },
      tags: ['playstation', 'ps5', 'gaming', 'console'], images: ['https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=600'],
    },
    {
      name: 'Microsoft Xbox Series X', price: 49990, mrp: 54990, brand: 'b6', category: 'c8', sku: 'ELEC-GME-058',
      description: 'Xbox Series X with 1TB SSD, 12 TFLOPS GPU, and Quick Resume feature.',
      highlights: ['12 TFLOPS GPU', '1TB SSD', 'Quick Resume', 'Smart Delivery'],
      specifications: { processor: 'AMD Zen 2, 8-core 3.8GHz', gpu: 'AMD RDNA 2, 12 TFLOPS', storage: '1TB NVMe SSD', ram: '16GB GDDR6', output: '4K 120fps / 8K' },
      tags: ['xbox', 'gaming', 'console', 'microsoft'], images: ['https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=600'],
    },
    {
      name: 'Nintendo Switch OLED', price: 34990, mrp: 37990, brand: 'b6', category: 'c8', sku: 'ELEC-GME-059',
      description: 'Nintendo Switch OLED with 7 inch OLED screen, enhanced audio, and 64GB storage.',
      highlights: ['7 inch OLED Screen', '64GB Storage', 'Enhanced Audio', 'Tabletop Mode'],
      specifications: { processor: 'NVIDIA Tegra X1', display: '7 inch OLED 1280x720', storage: '64GB internal', battery: '4.5-9 hours', output: '1080p docked' },
      tags: ['nintendo', 'switch', 'gaming', 'portable'], images: ['https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=600'],
    },
    {
      name: 'Sony DualSense Edge Controller', price: 18990, mrp: 21990, brand: 'b6', category: 'c8', sku: 'ELEC-GME-060',
      description: 'Sony DualSense Edge wireless controller with customizable stick sensitivity and back buttons.',
      highlights: ['Custom Stick Sensitivity', 'Back Buttons', 'Haptic Feedback', 'Adaptive Triggers'],
      specifications: { connectivity: 'USB-C / Bluetooth 5.1', battery: 'Up to 12 hours', features: 'Profile switching, Remappable buttons', compatibility: 'PS5, PC' },
      tags: ['sony', 'controller', 'ps5', 'gaming'], images: ['https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=600'],
    },
    {
      name: 'ASUS ROG Ally X', price: 79999, mrp: 89999, brand: 'b8', category: 'c8', sku: 'ELEC-GME-061',
      description: 'ASUS ROG Ally X handheld gaming PC with AMD Z1 Extreme and 1080p 120Hz display.',
      highlights: ['AMD Z1 Extreme', '1080p 120Hz Display', 'Windows 11', '80Wh Battery'],
      specifications: { processor: 'AMD Ryzen Z1 Extreme', gpu: 'AMD RDNA 3 (integrated)', ram: '24GB LPDDR5X', storage: '1TB NVMe SSD', display: '7 inch FHD 120Hz' },
      tags: ['asus', 'rog', 'handheld', 'gaming'], images: ['https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=600'],
    },
    {
      name: 'Razer BlackShark V2 Pro', price: 16999, mrp: 19999, brand: 'b6', category: 'c8', sku: 'ELEC-GME-062',
      description: 'Razer BlackShark V2 Pro wireless gaming headset with THX Spatial Audio and TriForce 50mm drivers.',
      highlights: ['THX Spatial Audio', 'TriForce 50mm Drivers', 'HyperClear Mic', '70hr Battery'],
      specifications: { driver: '50mm TriForce Titanium', connectivity: 'HyperSpeed Wireless / Bluetooth', battery: '70 hours', microphone: 'Detachable HyperClear' },
      tags: ['razer', 'gaming', 'headset', 'wireless'], images: ['https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?w=600'],
    },
    {
      name: 'Logitech G502 X PLUS', price: 12999, mrp: 14999, brand: 'b8', category: 'c8', sku: 'ELEC-GME-063',
      description: 'Logitech G502 X PLUS wireless gaming mouse with LIGHTFORCE hybrid switches and 25K sensor.',
      highlights: ['LIGHTFORCE Switches', 'HERO 25K Sensor', 'LIGHTSYNC RGB', '95hr Battery'],
      specifications: { dpi: '25600', connectivity: 'LIGHTSPEED / Bluetooth', battery: '95 hours', buttons: '13 programmable', weight: '106g' },
      tags: ['logitech', 'gaming', 'mouse', 'wireless'], images: ['https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600'],
    },
    {
      name: 'Xbox Game Pass Ultimate 12 Month', price: 6999, mrp: 8388, brand: 'b6', category: 'c8', sku: 'ELEC-GME-064',
      description: 'Xbox Game Pass Ultimate 12-month subscription with access to hundreds of games.',
      highlights: ['Hundreds of Games', 'Day One Releases', 'Cloud Gaming', 'EA Play Included'],
      specifications: { duration: '12 months', platform: 'Xbox / PC / Cloud', games: '400+ titles', cloud_gaming: 'Included' },
      tags: ['xbox', 'game-pass', 'subscription', 'gaming'], images: ['https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=600'],
    },
    {
      name: 'Corsair K100 RGB', price: 17999, mrp: 19999, brand: 'b8', category: 'c8', sku: 'ELEC-GME-065',
      description: 'Corsair K100 RGB mechanical gaming keyboard with OPX optical switches and iCUE control wheel.',
      highlights: ['OPX Optical Switches', 'iCUE Control Wheel', '4000Hz Polling', 'Per-Key RGB'],
      specifications: { switches: 'Corsair OPX Optical', polling_rate: '4000Hz', backlighting: 'Per-key RGB', connectivity: 'USB-C', features: 'iCUE control wheel, macro keys' },
      tags: ['corsair', 'keyboard', 'gaming', 'mechanical'], images: ['https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600'],
    },
    {
      name: 'LG UltraGear 27GR95QE 27 inch OLED Monitor', price: 89990, mrp: 109990, brand: 'b7', category: 'c9', sku: 'ELEC-ACC-066',
      description: 'LG UltraGear 27 inch OLED gaming monitor with 240Hz refresh rate and 0.03ms response time.',
      highlights: ['240Hz Refresh Rate', '0.03ms Response Time', 'Anti-Glare Low Reflect', 'NVIDIA G-SYNC'],
      specifications: { display: '26.5 inch OLED', resolution: '2560x1440 QHD', refreshRate: '240Hz', responseTime: '0.03ms GtG', color: '98.5% DCI-P3' },
      tags: ['lg', 'monitor', 'oled', 'gaming'], images: ['https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600'],
    },
    {
      name: 'Samsung Odyssey G9 49 inch Curved Monitor', price: 129990, mrp: 149990, brand: 'b2', category: 'c9', sku: 'ELEC-ACC-067',
      description: 'Samsung Odyssey G9 49 inch super ultrawide curved monitor with Dual QHD and 240Hz.',
      highlights: ['49 inch Dual QHD', '240Hz Refresh Rate', '1000R Curvature', 'HDR 2000'],
      specifications: { display: '49 inch DQHD VA', resolution: '5120x1440', refreshRate: '240Hz', responseTime: '1ms', curvature: '1000R' },
      tags: ['samsung', 'monitor', 'ultrawide', 'gaming'], images: ['https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600'],
    },
    {
      name: 'Apple Studio Display 27 inch', price: 159900, mrp: 169900, brand: 'b1', category: 'c9', sku: 'ELEC-ACC-068',
      description: 'Apple Studio Display with 5K Retina, A13 chip, Center Stage, and six-speaker sound system.',
      highlights: ['5K Retina Display', 'A13 Bionic Chip', 'Center Stage', 'Six-Speaker Sound'],
      specifications: { display: '27 inch 5K Retina', resolution: '5120x2880', brightness: '600 nits', color: 'P3 Wide Color', features: 'Center Stage, A13 Bionic' },
      tags: ['apple', 'monitor', '5k', 'professional'], images: ['https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600'],
    },
    {
      name: 'Keychron Q1 Pro Mechanical Keyboard', price: 17999, mrp: 19999, brand: 'b8', category: 'c9', sku: 'ELEC-ACC-069',
      description: 'Keychron Q1 Pro wireless mechanical keyboard with hot-swappable Gateron Jupiter switches.',
      highlights: ['Hot-Swap Switches', 'Wireless & Wired', 'QMK/VIA Compatible', 'Aluminum Frame'],
      specifications: { switches: 'Gateron Jupiter (hot-swap)', connectivity: 'Bluetooth 5.1 / USB-C', battery: '4000mAh', layout: '75% Compact', features: 'QMK/VIA, RGB' },
      tags: ['keychron', 'keyboard', 'mechanical', 'wireless'], images: ['https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600'],
    },
    {
      name: 'Logitech MX Master 3S', price: 8999, mrp: 10999, brand: 'b8', category: 'c9', sku: 'ELEC-ACC-070',
      description: 'Logitech MX Master 3S wireless mouse with 8K DPI sensor and MagSpeed scroll wheel.',
      highlights: ['8K DPI Sensor', 'MagSpeed Scroll', 'USB-C Quick Charge', 'Multi-Device'],
      specifications: { dpi: '8000', connectivity: 'Bluetooth / Logi Bolt', battery: '70 days', features: 'App-specific profiles, Thumb wheel' },
      tags: ['logitech', 'mouse', 'wireless', 'premium'], images: ['https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600'],
    },
    {
      name: 'BenQ ScreenBar Halo Monitor Light', price: 6999, mrp: 8999, brand: 'b8', category: 'c9', sku: 'ELEC-ACC-071',
      description: 'BenQ ScreenBar Halo monitor light with wireless controller and asymmetric lighting.',
      highlights: ['Wireless Controller', 'Asymmetric Lighting', 'Auto Dimming', 'Backlight'],
      specifications: { light_output: '500 lux', color_temp: '2700-6500K', features: 'Wireless controller, auto dimming', compatibility: 'All monitors' },
      tags: ['benq', 'monitor-light', 'desk', 'productivity'], images: ['https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600'],
    },
    {
      name: 'Samsung T7 Shield 2TB Portable SSD', price: 16999, mrp: 21999, brand: 'b2', category: 'c9', sku: 'ELEC-ACC-072',
      description: 'Samsung T7 Shield 2TB portable SSD with IP65 rating and 1050MB/s read speed.',
      highlights: ['1050MB/s Read', 'IP65 Water & Dust Resistant', 'AES 256-bit Encryption', 'USB 3.2 Gen 2'],
      specifications: { capacity: '2TB', read_speed: '1050MB/s', write_speed: '1000MB/s', interface: 'USB 3.2 Gen 2', durability: 'IP65, 3m drop resistant' },
      tags: ['samsung', 'ssd', 'portable', 'storage'], images: ['https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=600'],
    },
    {
      name: 'Elgato Stream Deck MK.2', price: 14999, mrp: 17999, brand: 'b8', category: 'c9', sku: 'ELEC-ACC-073',
      description: 'Elgato Stream Deck MK.2 with 15 customizable LCD keys for streaming and productivity.',
      highlights: ['15 LCD Keys', 'Drag & Drop Setup', 'Multi Actions', 'OBS Integration'],
      specifications: { keys: '15 customizable LCD', connectivity: 'USB-C', display: '72x72px per key', features: 'Folders, Multi Actions, plugins' },
      tags: ['elgato', 'stream-deck', 'streaming', 'productivity'], images: ['https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600'],
    },
    {
      name: 'Dyson V15 Detect Absolute', price: 62900, mrp: 68900, brand: 'b6', category: 'c10', sku: 'ELEC-APL-074',
      description: 'Dyson V15 Detect Absolute cordless vacuum with laser dust detection and 240 AW suction.',
      highlights: ['Laser Dust Detection', '240 AW Suction', 'LCD Screen', '60min Runtime'],
      specifications: { suction: '240 AW', battery: '60 minutes', weight: '3.1 kg', features: 'Laser detect, piezo sensor, LCD screen' },
      tags: ['dyson', 'vacuum', 'cordless', 'premium'], images: ['https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600'],
    },
    {
      name: 'Dyson Pure Cool TP07 Air Purifier', price: 42900, mrp: 47900, brand: 'b6', category: 'c10', sku: 'ELEC-APL-075',
      description: 'Dyson Pure Cool TP07 air purifier with HEPA H13 filter and real-time air quality monitoring.',
      highlights: ['HEPA H13 Filter', 'Air Multiplier Technology', 'Real-time AQI', 'Dyson Link App'],
      specifications: { filter: 'HEPA H13 + Activated Carbon', coverage: '600 sq ft', airflow: '291 l/s', features: 'Oscillation 350 degrees, night mode' },
      tags: ['dyson', 'air-purifier', 'hepa', 'premium'], images: ['https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=600'],
    },
    {
      name: 'Ecovacs Deebat X2 Omni Robot Vacuum', price: 89999, mrp: 109999, brand: 'b6', category: 'c10', sku: 'ELEC-APL-076',
      description: 'Ecovacs Deebat X2 Omni robot vacuum with 8000Pa suction, self-emptying, and mopping.',
      highlights: ['8000Pa Suction', 'Self-Empty & Wash', 'Dual Rotating Mops', 'AIVI 3D Navigation'],
      specifications: { suction: '8000Pa', battery: '5200mAh (180min)', navigation: 'AIVI 3D', features: 'Self-empty dock, hot water mop wash, auto refill' },
      tags: ['ecovacs', 'robot-vacuum', 'smart-home', 'premium'], images: ['https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600'],
    },
    {
      name: 'Blue Star 1.5 Ton 5 Star Inverter AC', price: 42999, mrp: 56999, brand: 'b5', category: 'c10', sku: 'ELEC-APL-077',
      description: 'Blue Star 1.5 Ton 5 Star Inverter split AC with precision cooling and voice control.',
      highlights: ['5 Star Inverter', 'Precision Cooling', 'Voice Control', 'Copper Condenser'],
      specifications: { capacity: '1.5 Ton', rating: '5 Star BEE', refrigerant: 'R-32', compressor: 'Inverter', features: 'Wi-Fi, voice control, turbo mode' },
      tags: ['blue-star', 'ac', 'inverter', '5-star'], images: ['https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600'],
    },
    {
      name: 'iRobot Roomba j7 Plus', price: 54999, mrp: 64999, brand: 'b6', category: 'c10', sku: 'ELEC-APL-078',
      description: 'iRobot Roomba j7 Plus with PrecisionVision Navigation and auto-emptying capabilities.',
      highlights: ['PrecisionVision Navigation', 'Auto-Empty', 'Pet Hair Detection', 'Smart Mapping'],
      specifications: { suction: 'Professional', navigation: 'PrecisionVision', battery: '75 minutes', features: 'Auto-empty, obstacle avoidance, smart mapping' },
      tags: ['irobot', 'roomba', 'robot-vacuum', 'smart-home'], images: ['https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600'],
    },
    {
      name: 'LG 8 kg Front Load Washing Machine', price: 39999, mrp: 49999, brand: 'b7', category: 'c10', sku: 'ELEC-APL-079',
      description: 'LG 8 kg front load washing machine with AI DD technology, Steam wash, and 6 motion washing.',
      highlights: ['AI DD Technology', 'Steam Wash', '6 Motion DD', 'Smart ThinQ'],
      specifications: { capacity: '8 kg', rpm: '1400', motor: 'Direct Drive', features: 'AI DD, Steam, Smart Diagnosis, Allergy Care' },
      tags: ['lg', 'washing-machine', 'front-load', 'smart'], images: ['https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600'],
    },
    {
      name: 'Philips Airfryer XXL Premium', price: 16999, mrp: 21999, brand: 'b5', category: 'c10', sku: 'ELEC-APL-080',
      description: 'Philips Airfryer XXL Premium with Rapid Air technology and 7 pre-set cooking programs.',
      highlights: ['Rapid Air Technology', 'XXL Capacity', '7 Cooking Modes', 'Fat Removal Technology'],
      specifications: { capacity: '7.3L', power: '2200W', features: '7 pre-sets, keep warm, shake reminder, dishwasher safe parts' },
      tags: ['philips', 'airfryer', 'kitchen', 'premium'], images: ['https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600'],
    },
  ];

  const allProducts = products.map((p, i) => ({
    ...p,
    id: `p${i + 1}`,
    slug: p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, ''),
    rating: (3.8 + Math.random() * 1.2).toFixed(1),
    reviewCount: Math.floor(Math.random() * 451) + 50,
    stock: Math.floor(Math.random() * 91) + 10,
    isActive: true,
    createdAt: new Date(Date.now() - Math.floor(Math.random() * 90) * 86400000).toISOString(),
  }));

  brands.forEach((b) => insertOne('brands', b));
  categories.forEach((c) => insertOne('categories', c));
  allProducts.forEach((p) => {
    insertOne('products', p);
    insertOne('inventory', {
      id: `inv-${p.id}`,
      productId: p.id,
      sku: p.sku,
      stock: p.stock,
      reserved: 0,
      warehouse: 'Mumbai Central Warehouse',
      lastUpdated: new Date().toISOString(),
    });
  });

  const hashedPass = bcryptjs.hashSync('Password@123', 10);
  const users = [
    { id: 'u1', email: 'admin@luxe.in', name: 'Admin User', phone: '+919876543210', password: hashedPass, role: 'admin', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200', createdAt: '2025-01-01T00:00:00.000Z', loyaltyPoints: 5000, tier: 'Platinum' },
    { id: 'u2', email: 'priya.sharma@email.in', name: 'Priya Sharma', phone: '+919876543211', password: hashedPass, role: 'customer', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200', createdAt: '2025-03-15T10:30:00.000Z', loyaltyPoints: 2350, tier: 'Gold' },
    { id: 'u3', email: 'rahul.verma@email.in', name: 'Rahul Verma', phone: '+919876543212', password: hashedPass, role: 'customer', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200', createdAt: '2025-06-20T14:15:00.000Z', loyaltyPoints: 1200, tier: 'Silver' },
    { id: 'u4', email: 'ananya.patel@email.in', name: 'Ananya Patel', phone: '+919876543213', password: hashedPass, role: 'customer', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200', createdAt: '2025-08-10T09:00:00.000Z', loyaltyPoints: 890, tier: 'Silver' },
    { id: 'u5', email: 'vikram.singh@email.in', name: 'Vikram Singh', phone: '+919876543214', password: hashedPass, role: 'customer', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200', createdAt: '2025-11-05T16:45:00.000Z', loyaltyPoints: 450, tier: 'Bronze' },
  ];
  users.forEach((u) => insertOne('users', u));

  const addresses = [
    { id: 'a1', userId: 'u2', name: 'Priya Sharma', phone: '+919876543211', line1: '42, Jasmine Apartments', line2: 'Sector 15, Koramangala', city: 'Bengaluru', state: 'Karnataka', pincode: '560034', country: 'India', isDefault: true },
    { id: 'a2', userId: 'u2', name: 'Office - Priya', phone: '+919876543211', line1: '12th Floor, Prestige Towers', line2: 'Residency Road', city: 'Bengaluru', state: 'Karnataka', pincode: '560025', country: 'India', isDefault: false },
    { id: 'a3', userId: 'u3', name: 'Rahul Verma', phone: '+919876543212', line1: 'B-204, Greenwood Heights', line2: 'Andheri West', city: 'Mumbai', state: 'Maharashtra', pincode: '400053', country: 'India', isDefault: true },
    { id: 'a4', userId: 'u4', name: 'Ananya Patel', phone: '+919876543213', line1: '15, Lake View Enclave', line2: 'Salt Lake Sector V', city: 'Kolkata', state: 'West Bengal', pincode: '700091', country: 'India', isDefault: true },
    { id: 'a5', userId: 'u5', name: 'Vikram Singh', phone: '+919876543214', line1: '301, Sunridge Apartments', line2: 'DLF Phase 4', city: 'Gurugram', state: 'Haryana', pincode: '122002', country: 'India', isDefault: true },
  ];
  addresses.forEach((a) => insertOne('addresses', a));

  const coupons = [
    { id: 'cp1', code: 'WELCOME20', type: 'percentage', value: 20, minOrder: 999, maxDiscount: 500, usageLimit: 10000, usedCount: 3456, startDate: '2026-01-01', endDate: '2026-12-31', isActive: true, applicableTo: 'all' },
    { id: 'cp2', code: 'FLAT500', type: 'fixed', value: 500, minOrder: 2999, maxDiscount: 500, usageLimit: 5000, usedCount: 1234, startDate: '2026-06-01', endDate: '2026-09-30', isActive: true, applicableTo: 'all' },
    { id: 'cp3', code: 'FESTIVE30', type: 'percentage', value: 30, minOrder: 1999, maxDiscount: 2000, usageLimit: 8000, usedCount: 2100, startDate: '2026-10-01', endDate: '2026-11-30', isActive: true, applicableTo: 'all' },
    { id: 'cp4', code: 'ELECTRONICS15', type: 'percentage', value: 15, minOrder: 4999, maxDiscount: 3000, usageLimit: 3000, usedCount: 890, startDate: '2026-01-01', endDate: '2026-12-31', isActive: true, applicableTo: 'electronics' },
    { id: 'cp5', code: 'LUXE10', type: 'percentage', value: 10, minOrder: 499, maxDiscount: 200, usageLimit: 20000, usedCount: 8765, startDate: '2026-01-01', endDate: '2026-12-31', isActive: true, applicableTo: 'all' },
  ];
  coupons.forEach((c) => insertOne('coupons', c));
  const orders = [
    {
      id: 'o1', userId: 'u2',
      items: [{ productId: 'p1', name: 'iPhone 16 Pro Max', quantity: 1, price: 159900, image: 'https://images.unsplash.com/photo-1695048065739-2e4f4e3e0e1a?w=600' }],
      shippingAddress: { line1: '42, Jasmine Apartments', city: 'Bengaluru', state: 'Karnataka', pincode: '560034' },
      subtotal: 159900, discount: 2000, shipping: 0, tax: 24000, total: 181900,
      status: 'delivered', paymentStatus: 'completed', paymentMethod: 'card',
      trackingNumber: 'LXE9876543210', createdAt: '2026-07-15T10:30:00.000Z', updatedAt: '2026-07-20T14:00:00.000Z',
    },
    {
      id: 'o2', userId: 'u2',
      items: [{ productId: 'p31', name: 'AirPods Pro 2nd Gen USB-C', quantity: 1, price: 24900, image: 'https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=600' }, { productId: 'p41', name: 'Apple Watch Series 9 45mm', quantity: 1, price: 44900, image: 'https://images.unsplash.com/photo-1546868871-af0de0ae72be?w=600' }],
      shippingAddress: { line1: '42, Jasmine Apartments', city: 'Bengaluru', state: 'Karnataka', pincode: '560034' },
      subtotal: 69800, discount: 500, shipping: 0, tax: 10470, total: 79770,
      status: 'shipped', paymentStatus: 'completed', paymentMethod: 'upi',
      trackingNumber: 'LXE9876543211', createdAt: '2026-08-20T16:45:00.000Z', updatedAt: '2026-08-22T09:00:00.000Z',
    },
    {
      id: 'o3', userId: 'u3',
      items: [{ productId: 'p15', name: 'MacBook Pro 14 inch M3 Pro', quantity: 1, price: 199900, image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600' }],
      shippingAddress: { line1: 'B-204, Greenwood Heights', city: 'Mumbai', state: 'Maharashtra', pincode: '400053' },
      subtotal: 199900, discount: 0, shipping: 0, tax: 29985, total: 229885,
      status: 'processing', paymentStatus: 'completed', paymentMethod: 'card',
      trackingNumber: null, createdAt: '2026-09-01T11:00:00.000Z', updatedAt: '2026-09-01T11:00:00.000Z',
    },
    {
      id: 'o4', userId: 'u4',
      items: [{ productId: 'p23', name: 'LG 65 inch OLED C4 4K Smart TV', quantity: 1, price: 169990, image: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=600' }],
      shippingAddress: { line1: '15, Lake View Enclave', city: 'Kolkata', state: 'West Bengal', pincode: '700091' },
      subtotal: 169990, discount: 0, shipping: 0, tax: 25499, total: 195489,
      status: 'pending', paymentStatus: 'pending', paymentMethod: 'cod',
      trackingNumber: null, createdAt: '2026-09-02T14:20:00.000Z', updatedAt: '2026-09-02T14:20:00.000Z',
    },
    {
      id: 'o5', userId: 'u5',
      items: [{ productId: 'p57', name: 'Sony PlayStation 5 Slim', quantity: 1, price: 54990, image: 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=600' }, { productId: 'p32', name: 'Sony WH-1000XM5', quantity: 1, price: 29990, image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600' }],
      shippingAddress: { line1: '301, Sunridge Apartments', city: 'Gurugram', state: 'Haryana', pincode: '122002' },
      subtotal: 84980, discount: 500, shipping: 0, tax: 12747, total: 97227,
      status: 'shipped', paymentStatus: 'completed', paymentMethod: 'card',
      trackingNumber: 'LXE9876543212', createdAt: '2026-08-25T09:30:00.000Z', updatedAt: '2026-08-27T10:00:00.000Z',
    },
    {
      id: 'o6', userId: 'u3',
      items: [{ productId: 'p3', name: 'Samsung Galaxy S24 Ultra', quantity: 1, price: 134999, image: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=600' }],
      shippingAddress: { line1: 'B-204, Greenwood Heights', city: 'Mumbai', state: 'Maharashtra', pincode: '400053' },
      subtotal: 134999, discount: 1000, shipping: 0, tax: 20250, total: 154249,
      status: 'delivered', paymentStatus: 'completed', paymentMethod: 'upi',
      trackingNumber: 'LXE9876543213', createdAt: '2026-07-28T12:00:00.000Z', updatedAt: '2026-08-02T16:30:00.000Z',
    },
  ];
  orders.forEach((o) => insertOne('orders', o));

  const payments = [
    { id: 'pay1', orderId: 'o1', amount: 181900, method: 'card', gateway: 'razorpay', status: 'completed', transactionId: 'txn_luxe_001', createdAt: '2026-07-15T10:30:00.000Z' },
    { id: 'pay2', orderId: 'o2', amount: 79770, method: 'upi', gateway: 'razorpay', status: 'completed', transactionId: 'txn_luxe_002', createdAt: '2026-08-20T16:45:00.000Z' },
    { id: 'pay3', orderId: 'o3', amount: 229885, method: 'card', gateway: 'razorpay', status: 'completed', transactionId: 'txn_luxe_003', createdAt: '2026-09-01T11:00:00.000Z' },
    { id: 'pay4', orderId: 'o5', amount: 97227, method: 'card', gateway: 'razorpay', status: 'completed', transactionId: 'txn_luxe_004', createdAt: '2026-08-25T09:30:00.000Z' },
    { id: 'pay5', orderId: 'o6', amount: 154249, method: 'upi', gateway: 'razorpay', status: 'completed', transactionId: 'txn_luxe_005', createdAt: '2026-07-28T12:00:00.000Z' },
    { id: 'pay6', orderId: 'o4', amount: 195489, method: 'cod', gateway: 'cod', status: 'pending', transactionId: null, createdAt: '2026-09-02T14:20:00.000Z' },
  ];
  payments.forEach((p) => insertOne('payments', p));
  const reviews = [
    { id: 'r1', userId: 'u2', productId: 'p1', rating: 5, title: 'Best iPhone ever!', body: 'The titanium design is stunning, camera quality is incredible, and battery lasts all day. Worth every penny.', images: [], helpful: 24, verified: true, createdAt: '2026-07-25T08:00:00.000Z' },
    { id: 'r2', userId: 'u3', productId: 'p15', rating: 5, title: 'Absolute powerhouse', body: 'M3 Pro chip is blazing fast. The Liquid Retina XDR display is gorgeous and battery lasts 18+ hours easily.', images: [], helpful: 18, verified: true, createdAt: '2026-09-05T10:00:00.000Z' },
    { id: 'r3', userId: 'u4', productId: 'p23', rating: 4, title: 'Stunning OLED picture quality', body: 'The LG OLED C4 has the best picture quality I have seen. Perfect blacks and vibrant colors. Slightly pricey but worth it.', images: [], helpful: 12, verified: true, createdAt: '2026-09-10T12:00:00.000Z' },
    { id: 'r4', userId: 'u2', productId: 'p31', rating: 5, title: 'ANC is incredible', body: 'The noise cancellation on these AirPods Pro 2 is leagues ahead. Adaptive Audio works perfectly. USB-C is a welcome change.', images: [], helpful: 30, verified: true, createdAt: '2026-08-28T09:00:00.000Z' },
    { id: 'r5', userId: 'u5', productId: 'p57', rating: 5, title: 'Gaming perfection', body: 'The PS5 Slim is whisper quiet and the DualSense haptics are mind-blowing. Astro Bot is an incredible experience.', images: [], helpful: 15, verified: true, createdAt: '2026-08-30T11:00:00.000Z' },
    { id: 'r6', userId: 'u3', productId: 'p3', rating: 5, title: 'S24 Ultra is a beast', body: 'The 200MP camera is unreal, S Pen is super useful, and Galaxy AI features are genuinely helpful in daily use.', images: [], helpful: 20, verified: true, createdAt: '2026-08-05T14:00:00.000Z' },
    { id: 'r7', userId: 'u4', productId: 'p32', rating: 5, title: 'Best ANC headphones', body: 'Sony WH-1000XM5 has the best noise cancelling I have experienced. Comfortable for long flights and the sound is phenomenal.', images: [], helpful: 22, verified: true, createdAt: '2026-08-18T16:00:00.000Z' },
    { id: 'r8', userId: 'u2', productId: 'p5', rating: 4, title: 'OnePlus 12 delivers', body: 'Fantastic value flagship. The 100W charging is insanely fast, camera is great with Hasselblad tuning, and display is superb.', images: [], helpful: 14, verified: true, createdAt: '2026-07-20T10:00:00.000Z' },
    { id: 'r9', userId: 'u5', productId: 'p41', rating: 5, title: 'Apple Watch is essential', body: 'Series 9 health tracking is accurate and the always-on display is very useful. Battery easily lasts a full day.', images: [], helpful: 11, verified: true, createdAt: '2026-09-08T09:00:00.000Z' },
  ];
  reviews.forEach((r) => insertOne('reviews', r));

  const campaigns = [
    { id: 'cmp1', name: 'Independence Day Electronics Sale', type: 'percentage', discount: 20, products: [], categories: ['c1', 'c2', 'c3'], startDate: '2026-08-01', endDate: '2026-08-15', isActive: false },
    { id: 'cmp2', name: 'Festive Season Tech Deals', type: 'percentage', discount: 25, products: [], categories: ['c2', 'c3', 'c4', 'c5'], startDate: '2026-10-01', endDate: '2026-11-15', isActive: true },
    { id: 'cmp3', name: 'Year End Clearance', type: 'fixed', discount: 2000, products: [], categories: ['c1'], startDate: '2026-12-20', endDate: '2027-01-05', isActive: true },
  ];
  campaigns.forEach((c) => insertOne('campaigns', c));

  const notifications = [
    { id: 'n1', userId: 'u2', type: 'order', title: 'Order Shipped', body: 'Your order #o2 has been shipped via BlueDart. Expected delivery by Aug 24.', read: false, data: { orderId: 'o2' }, createdAt: '2026-08-22T09:00:00.000Z' },
    { id: 'n2', userId: 'u2', type: 'promo', title: 'Festive Tech Deals are Live!', body: 'Get up to 25% off on smartphones, laptops, and more. Use code FESTIVE30.', read: false, data: { campaignId: 'cmp2' }, createdAt: '2026-09-01T08:00:00.000Z' },
    { id: 'n3', userId: 'u3', type: 'order', title: 'Order Confirmed', body: 'Your MacBook Pro order #o3 has been confirmed. Processing will begin shortly.', read: true, data: { orderId: 'o3' }, createdAt: '2026-09-01T11:05:00.000Z' },
    { id: 'n4', userId: 'u4', type: 'order', title: 'Payment Pending', body: 'Please complete payment for order #o4 (LG OLED TV) within 24 hours.', read: false, data: { orderId: 'o4' }, createdAt: '2026-09-02T14:25:00.000Z' },
    { id: 'n5', userId: 'u5', type: 'promo', title: 'New Arrivals: Gaming Gear', body: 'Check out the latest ROG Ally X and Corsair K100 RGB keyboard now available!', read: true, data: { campaignId: 'cmp3' }, createdAt: '2026-08-15T10:00:00.000Z' },
  ];
  notifications.forEach((n) => insertOne('notifications', n));
  const variantAttributesData = [
    { id: 'va1', productId: 'p15', name: 'Storage', type: 'text', values: [{ name: '512GB' }, { name: '1TB' }] },
    { id: 'va2', productId: 'p15', name: 'RAM', type: 'text', values: [{ name: '18GB' }, { name: '36GB' }] },
    { id: 'va3', productId: 'p15', name: 'Color', type: 'color', values: [{ name: 'Space Black', hex: '#1a1a2e' }, { name: 'Silver', hex: '#c0c0c0' }] },
    { id: 'va4', productId: 'p1', name: 'Storage', type: 'text', values: [{ name: '256GB' }, { name: '512GB' }, { name: '1TB' }] },
    { id: 'va5', productId: 'p1', name: 'Color', type: 'color', values: [{ name: 'Natural Titanium', hex: '#B5A99A' }, { name: 'Blue Titanium', hex: '#4A5568' }, { name: 'White Titanium', hex: '#E2E8F0' }, { name: 'Black Titanium', hex: '#1a1a2e' }] },
    { id: 'va6', productId: 'p3', name: 'Storage', type: 'text', values: [{ name: '256GB' }, { name: '512GB' }, { name: '1TB' }] },
    { id: 'va7', productId: 'p3', name: 'Color', type: 'color', values: [{ name: 'Titanium Black', hex: '#1a1a2e' }, { name: 'Titanium Gray', hex: '#808080' }, { name: 'Titanium Violet', hex: '#9370DB' }, { name: 'Titanium Yellow', hex: '#FFD700' }] },
    { id: 'va8', productId: 'p5', name: 'Storage', type: 'text', values: [{ name: '256GB' }, { name: '512GB' }] },
    { id: 'va9', productId: 'p5', name: 'Color', type: 'color', values: [{ name: 'Silky Black', hex: '#1a1a2e' }, { name: 'Flowy Emerald', hex: '#2E8B57' }] },
    { id: 'va10', productId: 'p41', name: 'Size', type: 'text', values: [{ name: '41mm' }, { name: '45mm' }] },
    { id: 'va11', productId: 'p41', name: 'Color', type: 'color', values: [{ name: 'Midnight', hex: '#1a1a2e' }, { name: 'Starlight', hex: '#F5F5DC' }, { name: 'Silver', hex: '#c0c0c0' }] },
    { id: 'va12', productId: 'p17', name: 'RAM', type: 'text', values: [{ name: '16GB' }, { name: '32GB' }] },
    { id: 'va13', productId: 'p17', name: 'Storage', type: 'text', values: [{ name: '512GB' }, { name: '1TB' }] },
    { id: 'va14', productId: 'p17', name: 'Color', type: 'color', values: [{ name: 'Platinum Silver', hex: '#c0c0c0' }, { name: 'Graphite', hex: '#383838' }] },
  ];
  variantAttributesData.forEach((a) => insertOne('variantAttributes', a));

  const variants = [
    { id: 'v1', productId: 'p15', sku: 'ELEC-LPT-015-512-18-SBK', attributes: { Storage: '512GB', RAM: '18GB', Color: 'Space Black' }, priceDelta: 0, stock: 25, availability: 'in_stock', isActive: true, images: [], specifications: { processor: 'Apple M3 Pro', ram: '18GB', storage: '512GB SSD', display: '14.2 inch Liquid Retina XDR' }, createdAt: new Date().toISOString() },
    { id: 'v2', productId: 'p15', sku: 'ELEC-LPT-015-1TB-36-SBK', attributes: { Storage: '1TB', RAM: '36GB', Color: 'Space Black' }, priceDelta: 50000, stock: 12, availability: 'in_stock', isActive: true, images: [], specifications: { processor: 'Apple M3 Pro', ram: '36GB', storage: '1TB SSD', display: '14.2 inch Liquid Retina XDR' }, createdAt: new Date().toISOString() },
    { id: 'v3', productId: 'p15', sku: 'ELEC-LPT-015-1TB-36-SLV', attributes: { Storage: '1TB', RAM: '36GB', Color: 'Silver' }, priceDelta: 50000, stock: 8, availability: 'in_stock', isActive: true, images: [], specifications: { processor: 'Apple M3 Pro', ram: '36GB', storage: '1TB SSD', display: '14.2 inch Liquid Retina XDR' }, createdAt: new Date().toISOString() },
    { id: 'v4', productId: 'p1', sku: 'ELEC-PHP-001-256-NTI', attributes: { Storage: '256GB', Color: 'Natural Titanium' }, priceDelta: 0, stock: 30, availability: 'in_stock', isActive: true, images: [], specifications: { storage: '256GB', color: 'Natural Titanium' }, createdAt: new Date().toISOString() },
    { id: 'v5', productId: 'p1', sku: 'ELEC-PHP-001-512-BTI', attributes: { Storage: '512GB', Color: 'Black Titanium' }, priceDelta: 15000, stock: 20, availability: 'in_stock', isActive: true, images: [], specifications: { storage: '512GB', color: 'Black Titanium' }, createdAt: new Date().toISOString() },
    { id: 'v6', productId: 'p1', sku: 'ELEC-PHP-001-1TB-WTI', attributes: { Storage: '1TB', Color: 'White Titanium' }, priceDelta: 30000, stock: 10, availability: 'in_stock', isActive: true, images: [], specifications: { storage: '1TB', color: 'White Titanium' }, createdAt: new Date().toISOString() },
    { id: 'v7', productId: 'p3', sku: 'ELEC-PHP-003-256-TBK', attributes: { Storage: '256GB', Color: 'Titanium Black' }, priceDelta: 0, stock: 18, availability: 'in_stock', isActive: true, images: [], specifications: { storage: '256GB', color: 'Titanium Black' }, createdAt: new Date().toISOString() },
    { id: 'v8', productId: 'p3', sku: 'ELEC-PHP-003-512-TVIO', attributes: { Storage: '512GB', Color: 'Titanium Violet' }, priceDelta: 10000, stock: 14, availability: 'in_stock', isActive: true, images: [], specifications: { storage: '512GB', color: 'Titanium Violet' }, createdAt: new Date().toISOString() },
    { id: 'v9', productId: 'p5', sku: 'ELEC-PHP-005-256-SBK', attributes: { Storage: '256GB', Color: 'Silky Black' }, priceDelta: 0, stock: 22, availability: 'in_stock', isActive: true, images: [], specifications: { storage: '256GB', color: 'Silky Black' }, createdAt: new Date().toISOString() },
    { id: 'v10', productId: 'p5', sku: 'ELEC-PHP-005-512-GRN', attributes: { Storage: '512GB', Color: 'Flowy Emerald' }, priceDelta: 5000, stock: 10, availability: 'in_stock', isActive: true, images: [], specifications: { storage: '512GB', color: 'Flowy Emerald' }, createdAt: new Date().toISOString() },
    { id: 'v11', productId: 'p41', sku: 'ELEC-WAR-041-41-MID', attributes: { Size: '41mm', Color: 'Midnight' }, priceDelta: 0, stock: 20, availability: 'in_stock', isActive: true, images: [], specifications: { size: '41mm', color: 'Midnight' }, createdAt: new Date().toISOString() },
    { id: 'v12', productId: 'p41', sku: 'ELEC-WAR-041-45-SLV', attributes: { Size: '45mm', Color: 'Silver' }, priceDelta: 3000, stock: 15, availability: 'in_stock', isActive: true, images: [], specifications: { size: '45mm', color: 'Silver' }, createdAt: new Date().toISOString() },
    { id: 'v13', productId: 'p17', sku: 'ELEC-LPT-017-512-16-PLT', attributes: { RAM: '16GB', Storage: '512GB', Color: 'Platinum Silver' }, priceDelta: 0, stock: 12, availability: 'in_stock', isActive: true, images: [], specifications: { processor: 'Intel Core Ultra 7 155H', ram: '16GB', storage: '512GB NVMe SSD' }, createdAt: new Date().toISOString() },
    { id: 'v14', productId: 'p17', sku: 'ELEC-LPT-017-1TB-32-GRF', attributes: { RAM: '32GB', Storage: '1TB', Color: 'Graphite' }, priceDelta: 30000, stock: 6, availability: 'in_stock', isActive: true, images: [], specifications: { processor: 'Intel Core Ultra 7 155H', ram: '32GB', storage: '1TB NVMe SSD' }, createdAt: new Date().toISOString() },
  ];
  variants.forEach((v) => {
    insertOne('variants', v);
    insertOne('inventory', { id: `inv-${v.id}`, productId: v.productId, variantId: v.id, sku: v.sku, stock: v.stock, reserved: 0, warehouse: 'Mumbai Central Warehouse', lastUpdated: new Date().toISOString() });
  });

  const priceRules = [
    { id: 'pr1', productId: 'p15', variantId: null, type: 'percentage', value: 5, name: 'Back to School 5% Off on MacBook Pro', startDate: '2026-08-01', endDate: '2026-10-31', isActive: true, createdAt: new Date().toISOString() },
    { id: 'pr2', productId: 'p57', variantId: null, type: 'fixed', value: 2000, name: 'PS5 Slim Launch Offer Rs.2000 Off', startDate: '2026-09-01', endDate: '2026-12-31', isActive: true, createdAt: new Date().toISOString() },
  ];
  priceRules.forEach((r) => insertOne('priceRules', r));

  const trendingSearches = [
    'iPhone 16 Pro', 'MacBook Pro M3', 'Samsung S24 Ultra', 'Sony WH-1000XM5', 'PS5 Slim',
    'AirPods Pro', 'OnePlus 12', 'LG OLED TV', 'iPad', 'Gaming Laptop',
  ];

  const banners = [
    { id: 'bnr1', title: 'iPhone 16 Pro Max', subtitle: 'Titanium. So strong. So light. So Pro.', image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=1200', link: '/products/p1', type: 'hero', isActive: true, order: 1, createdAt: new Date().toISOString() },
    { id: 'bnr2', title: 'MacBook Pro M3 Pro', subtitle: 'Mind-blowing. Head-turning.', image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=1200', link: '/products/p15', type: 'hero', isActive: true, order: 2, createdAt: new Date().toISOString() },
    { id: 'bnr3', title: 'Samsung Galaxy S24 Ultra', subtitle: 'The AI phone is here.', image: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=1200', link: '/products/p3', type: 'hero', isActive: true, order: 3, createdAt: new Date().toISOString() },
    { id: 'bnr4', title: 'Sony WH-1000XM5', subtitle: 'Industry-leading noise cancellation.', image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1200', link: '/products/p29', type: 'promo', isActive: true, order: 4, createdAt: new Date().toISOString() },
    { id: 'bnr5', title: 'PS5 Slim Digital Edition', subtitle: 'Play has no limits.', image: 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=1200', link: '/products/p57', type: 'promo', isActive: true, order: 5, createdAt: new Date().toISOString() },
    { id: 'bnr6', title: 'LG OLED C4 65"', subtitle: 'Pixel. Perfect.', image: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=1200', link: '/products/p21', type: 'promo', isActive: true, order: 6, createdAt: new Date().toISOString() },
  ];
  banners.forEach((b) => insertOne('banners', b));

  return { trendingSearches };
}

module.exports = { seed };
