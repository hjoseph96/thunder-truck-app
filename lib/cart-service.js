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
      foodTruck {
        id
        name
        coverImageUrl
        logoUrl
      }
      itemCount
      totalPrice
      totalItems
      cartItems {
        id
        quantity
        menuItem {
          id
          name
          description
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

const CHANGE_CART_ITEM = `
  mutation changeCartItem($input: ChangeCartItemInput!) {
    changeCartItem(input: $input) {
      cartItem {
        id
        quantity
        menuItemId
      }
      errors
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
 * Change cart item quantity using the changeCartItem mutation
 * @param {string} cartItemId - The ID of the cart item to change
 * @param {number} quantity - New quantity for the cart item
 * @returns {Promise<Object>} The updated cart data
 */
export const changeCartItemQuantity = async (cartItemId, quantity) => {
  try {
    const result = await executeGraphQL(CHANGE_CART_ITEM, {
      input: {
        params: {
          cartItemId,
          quantity
        }
      }
    });

    const changeResult = result.changeCartItem;
    
    if (changeResult.errors && changeResult.errors.length > 0) {
      throw new Error(changeResult.errors.join(', '));
    }

    return changeResult.cartItem;
  } catch (error) {
    console.error('Error changing cart item quantity:', error);
    throw error;
  }
};