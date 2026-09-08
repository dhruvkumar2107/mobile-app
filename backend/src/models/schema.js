const dataStore = {
  users: [],
  products: [],
  categories: [],
  brands: [],
  cart: [],
  wishlist: [],
  orders: [],
  payments: [],
  reviews: [],
  coupons: [],
  notifications: [],
  addresses: [],
  inventory: [],
  campaigns: [],
  recentlyViewed: [],
  searchHistory: [],
  variantAttributes: [],
  variants: [],
  priceRules: [],
  auditLogs: [],
  variantWishlist: [],
  priceHistory: [],
};

function getCollection(name) {
  if (!dataStore[name]) {
    dataStore[name] = [];
  }
  return dataStore[name];
}

function findById(collection, id) {
  return getCollection(collection).find((item) => item.id === id) || null;
}

function findByField(collection, field, value) {
  return getCollection(collection).find((item) => item[field] === value) || null;
}

function filterByField(collection, field, value) {
  return getCollection(collection).filter((item) => item[field] === value);
}

function insertOne(collection, item) {
  getCollection(collection).push(item);
  return item;
}

function updateById(collection, id, updates) {
  const items = getCollection(collection);
  const index = items.findIndex((item) => item.id === id);
  if (index === -1) return null;
  items[index] = { ...items[index], ...updates };
  return items[index];
}

function deleteById(collection, id) {
  const items = getCollection(collection);
  const index = items.findIndex((item) => item.id === id);
  if (index === -1) return false;
  items.splice(index, 1);
  return true;
}

function countAll(collection, filterFn) {
  const items = getCollection(collection);
  if (filterFn) return items.filter(filterFn).length;
  return items.length;
}

function paginate(items, page = 1, limit = 20) {
  const start = (page - 1) * limit;
  const end = start + limit;
  return {
    items: items.slice(start, end),
    total: items.length,
    page: Number(page),
    limit: Number(limit),
    totalPages: Math.ceil(items.length / limit),
  };
}

module.exports = {
  dataStore,
  getCollection,
  findById,
  findByField,
  filterByField,
  insertOne,
  updateById,
  deleteById,
  countAll,
  paginate,
};
