import graphqlClient from './graphql-client';

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
  try {
    const response = await graphqlClient.post('', {
      query: ADD_MENU_ITEM_TO_CART,
      variables: {
        input: {
          menuItemId,
          cartItemOptions
        }
      }
    });

    const result = response.data.data.addMenuItemToCart;
    
    if (result.errors && result.errors.length > 0) {
      throw new Error(result.errors.join(', '));
    }

    return result.cart;
  } catch (error) {
    console.error('Error adding menu item to cart:', error);
    throw error;
  }
};

/**
 * Get the current user's cart using the fetchCart query
 * @returns {Promise<Object>} The cart data
 */
export const getCart = async (foodTruckId) => {
  try {
    const response = await graphqlClient.post('', {
      query: GET_CART,
      variables: { foodTruckId: foodTruckId }
    });

    const result = response.data.data.fetchCart;
    
    return result;
  } catch (error) {
    console.error('Error fetching cart:', error);
    throw error;
  }
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
