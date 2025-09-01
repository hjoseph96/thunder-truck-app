import graphqlClient from './graphql-client';

const FETCH_MENU_ITEM = `
  query fetchMenuItem($menuItemId: ID!) {
    fetchMenuItem(menuItemId: $menuItemId) {
      menuItem {
        id
        name
        price
        imageUrl
        categoryId
        optionGroups {
          id
          name
          description
          required
          limit
          options {
            id
            imageUrl
            name
            price
          }
        }
      }
      relatedMenuItems {
        id
        name
        price
        description
        imageUrl
      }
    }
  }
`;

export const fetchMenuItem = async (menuItemId) => {
  try {
    const response = await graphqlClient.post('', {
      query: FETCH_MENU_ITEM,
      variables: { menuItemId }
    });

    if (response.data.errors) {
      throw new Error(response.data.errors[0].message);
    }

    return response.data.data.fetchMenuItem;
  } catch (error) {
    console.error('Error fetching menu item:', error);
    throw error;
  }
};

// Cache for menu items
const menuItemCache = new Map();

export const getMenuItemWithCache = async (menuItemId) => {
  if (menuItemCache.has(menuItemId)) {
    return menuItemCache.get(menuItemId);
  }

  const result = await fetchMenuItem(menuItemId);
  menuItemCache.set(menuItemId, result);
  return result;
};
