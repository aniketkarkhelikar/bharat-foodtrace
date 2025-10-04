const API_BASE_URL = 'http://localhost:8000';

// A helper function to handle API requests and errors
async function fetchApi(path, options = {}) {
  const url = `${API_BASE_URL}${path}`;
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const response = await fetch(url, { ...options, headers });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || `API error: ${response.statusText}`);
  }

  // Handle responses with no content, like a successful PUT
  if (response.status === 204) {
    return null;
  }
  
  // Handle responses that might not have a JSON body
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch (err) {
    return text; // Return text if it's not JSON
  }
}

// === AUTHENTICATION ===
export const loginManufacturer = (email, password) => {
  const formData = new URLSearchParams();
  formData.append('username', email);
  formData.append('password', password);
  return fetch(API_BASE_URL + '/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: formData,
  }).then(res => res.json());
};

export const loginConsumer = (email, password) => {
    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);
    return fetch(API_BASE_URL + '/users/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData,
    }).then(res => res.json());
};

export const registerConsumer = (email, password) => {
    return fetchApi('/users/register', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
    });
};

// === CONSUMER & SWASTH WALLET ===
export const getConsumerProfile = (token) => {
    return fetchApi('/users/me', {
        headers: { 'Authorization': `Bearer ${token}` },
    });
};

export const updateConsumerProfile = (token, walletData) => {
    return fetchApi('/users/me', {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(walletData),
    });
};


// === PRODUCTS ===
export const getProductDetails = (productId) => {
    return fetchApi(`/product/${productId}`);
};

export const getManufacturerProducts = (token) => {
    return fetchApi('/manufacturer/products', {
        headers: { 'Authorization': `Bearer ${token}` },
    });
};

export const addProduct = (token, productData) => {
    return fetchApi('/products/add', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(productData),
    });
};

// === TRACEABILITY ===
export const addTraceabilityEvent = (eventData) => {
    return fetchApi('/traceability/add', {
        method: 'POST',
        body: JSON.stringify(eventData),
    });
};

// === REVIEWS ===
export const addReview = (token, reviewData) => {
    return fetchApi('/reviews/add', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(reviewData),
    });
};

// === RECALLS ===
export const addRecall = (token, recallData) => {
    return fetchApi('/recalls/add', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(recallData),
    });
};
