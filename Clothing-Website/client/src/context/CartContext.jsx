import { createContext, useContext, useState, useEffect } from 'react';
import { authFetch } from '../utils/authFetch';

const CartContext = createContext();

const STORAGE_KEY = 'sumathi_cart';

function loadCart() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState(loadCart);
  const [isLoaded, setIsLoaded] = useState(false);

  // 1. Initial Load & Listen for User Updates
  useEffect(() => {
    const fetchUserCart = async () => {
      const token = localStorage.getItem('clientToken');
      const userJson = localStorage.getItem('clientUser');

      if (token && userJson) {
        try {
          const user = JSON.parse(userJson);
          const identifier = user.customerId || user._id || (user.uids && user.uids[0]);
          
          const res = await authFetch(`/api/client-auth/profile/${identifier}`);
          const data = await res.json();
          
          if (data.success && data.user) {
            const serverCart = (data.user.cart || []).map(item => ({
              ...item,
              id: item.productId || item.id // Map back to frontend 'id'
            }));
            
            // Update local state from server
            setCartItems(serverCart);
          }
        } catch (err) {
          console.error('❌ Failed to fetch user cart:', err);
        } finally {
          setIsLoaded(true);
        }
      } else {
        // Logged out or no user session
        setCartItems([]);
        localStorage.removeItem(STORAGE_KEY);
        setIsLoaded(true);
      }
    };

    fetchUserCart();

    const handleUserUpdate = (e) => {
      // If it's a storage event, only respond if auth keys changed
      if (e && e.type === 'storage' && e.key !== 'clientToken' && e.key !== 'clientUser') return;
      fetchUserCart();
    };

    window.addEventListener('client_user_updated', handleUserUpdate);
    window.addEventListener('storage', handleUserUpdate);

    return () => {
      window.removeEventListener('client_user_updated', handleUserUpdate);
      window.removeEventListener('storage', handleUserUpdate);
    };
  }, []);

  // 2. Persist to localStorage and Sync to Server
  useEffect(() => {
    // Save to local storage for persistence across reloads
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cartItems));

    // Only sync to server if we've finished the initial load 
    // (to avoid overwriting server cart with empty local state on mount)
    const token = localStorage.getItem('clientToken');
    const userJson = localStorage.getItem('clientUser');
    
    if (!isLoaded || !token || !userJson) return;

    const syncTimeout = setTimeout(async () => {
      try {
        const user = JSON.parse(userJson);
        const uid = user.customerId || user._id || (user.uids && user.uids[0]);
        if (!uid) return;

        const syncData = cartItems.map(item => ({
          productId: item.id,
          name: item.name,
          img: item.img,
          price: item.price,
          size: item.size,
          color: item.color,
          qty: item.qty,
          stock: item.stock
        }));

        await authFetch('/api/client-auth/sync-cart', {
          method: 'POST',
          body: JSON.stringify({ uid, cart: syncData })
        });
      } catch (err) {
        console.error('❌ Failed to sync cart:', err);
      }
    }, 1500); // Debounce sync

    return () => clearTimeout(syncTimeout);
  }, [cartItems, isLoaded]);

  const addToCart = (product) => {
    // Expected product: { id, name, price, size, color, img, stock }
    setCartItems(prev => {
      const existing = prev.find(
        i => i.id === product.id && i.size === product.size && i.color === product.color
      );
      if (existing) {
        if (existing.qty + 1 > product.stock) {
          alert(`Maximum available stock (${product.stock}) reached for this item.`);
          return prev;
        }
        return prev.map(i =>
          i.id === product.id && i.size === product.size && i.color === product.color
            ? { ...i, qty: i.qty + 1 }
            : i
        );
      }
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const updateQty = (id, size, color, delta) => {
    setCartItems(prev =>
      prev.map(i => {
        if (i.id === id && i.size === size && i.color === color) {
          const newQty = i.qty + delta;
          if (newQty > i.stock && delta > 0) {
            alert(`Only ${i.stock} units are currently in stock.`);
            return i;
          }
          return { ...i, qty: Math.max(1, newQty) };
        }
        return i;
      })
    );
  };

  const removeItem = (id, size, color) => {
    setCartItems(prev =>
      prev.filter(i => !(i.id === id && i.size === size && i.color === color))
    );
  };

  const cartCount = cartItems.reduce((sum, i) => sum + i.qty, 0);
  const subtotal  = cartItems.reduce(
    (sum, i) => sum + parseFloat(String(i.price).replace(/[₹$,]/g, '')) * i.qty, 0
  );

  const clearCart = () => {
    setCartItems([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <CartContext.Provider value={{ cartItems, addToCart, updateQty, removeItem, clearCart, cartCount, subtotal, isLoaded }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
