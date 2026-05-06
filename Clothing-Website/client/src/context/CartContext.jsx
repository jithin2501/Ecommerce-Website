import { createContext, useContext, useState, useEffect } from 'react';

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

  // Persist to localStorage whenever cart changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cartItems));

    // Sync with server if logged in
    const token = localStorage.getItem('clientToken');
    const userJson = localStorage.getItem('clientUser');
    if (token && userJson) {
      try {
        const user = JSON.parse(userJson);
        const uid = user.customerId || (user.uids && user.uids[0]);
        if (uid) {
          // Map 'id' to 'productId' for server schema compatibility
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

          fetch('/api/client-auth/sync-cart', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ uid, cart: syncData })
          }).catch(err => console.error("❌ Failed to sync cart:", err));
        }
      } catch (e) {
        console.error("❌ Error parsing user for cart sync:", e);
      }
    }
  }, [cartItems]);

  // Listen for user login/logout to sync cart
  useEffect(() => {
    const handleUserUpdate = () => {
      const userJson = localStorage.getItem('clientUser');
      if (userJson) {
        try {
          const user = JSON.parse(userJson);
          if (user.cart && Array.isArray(user.cart)) {
            // Restore cart from user profile upon login
            // Map 'productId' back to 'id' for frontend compatibility
            const mappedCart = user.cart.map(item => ({
              ...item,
              id: item.productId || item.id
            }));
            setCartItems(mappedCart);
          }
        } catch (e) {
          console.error("❌ Error parsing user cart:", e);
        }
      } else {
        // User logged out, clear cart
        setCartItems([]);
        localStorage.removeItem(STORAGE_KEY);
      }
    };

    window.addEventListener('client_user_updated', handleUserUpdate);
    window.addEventListener('storage', handleUserUpdate); // Handle multi-tab logout

    return () => {
      window.removeEventListener('client_user_updated', handleUserUpdate);
      window.removeEventListener('storage', handleUserUpdate);
    };
  }, []);

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
    <CartContext.Provider value={{ cartItems, addToCart, updateQty, removeItem, clearCart, cartCount, subtotal }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
