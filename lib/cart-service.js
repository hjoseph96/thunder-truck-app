import { executeGraphQL } from './graphql-client';

const ADD_MENU_ITEM_TO_CART = `
  mutation AddMenuItemToCart($input: AddMenuItemToCartInput!) {
    addMenuItemToCart(input: $input) {
      cart {
        id
        itemCount
        totalPrice
        totalItems
        cartItems {
          id
          quantity
          menuItem {
            id
            name
            price
            imageUrl
          }
          cartItemOptions {
            id
            option {
              id
              name
              price
            }
          }
        }
      }
      errors
    }
  }
`;

const GET_CART = `
  query fetchCart($foodTruckId: ID!) {
    fetchCart(foodTruckId: $foodTruckId) {
      id
      itemCount
      totalPrice
      totalItems
      cartItems {
        id
        quantity
        menuItem {
          id
          name
          price
          imageUrl
        }
        cartItemOptions {
          id
          option {
            id
            name
            price
          }
        }
      }
    }
  }
`;

/**
 * Add a menu item to the user's cart
 * @param {string} menuItemId - The ID of the menu item to add
 * @param {Array} cartItemOptions - Optional array of selected options
 * @returns {Promise<Object>} The updated cart data
 */
export const addMenuItemToCart = async (menuItemId, cartItemOptions = []) => {
  const result = await executeGraphQL(ADD_MENU_ITEM_TO_CART, {
    input: {
      menuItemId,
      cartItemOptions
    }
  });

  const cartResult = result.addMenuItemToCart;
  
  if (cartResult.errors && cartResult.errors.length > 0) {
    throw new Error(cartResult.errors.join(', '));
  }

  return cartResult.cart;
};

/**
 * Get the current user's cart using the fetchCart query
 * @returns {Promise<Object>} The cart data
 */
export const getCart = async (foodTruckId) => {
  const result = await executeGraphQL(GET_CART, { foodTruckId });
  
  return result.fetchCart;
};

/**
 * Update quantity of a cart item by adding/removing the same menu item
 * @param {string} menuItemId - The ID of the menu item
 * @param {Array} cartItemOptions - Optional array of selected options
 * @returns {Promise<Object>} The updated cart data
 */
export const updateCartItemQuantity = async (menuItemId, cartItemOptions = []) => {
  return addMenuItemToCart(menuItemId, cartItemOptions);
};
