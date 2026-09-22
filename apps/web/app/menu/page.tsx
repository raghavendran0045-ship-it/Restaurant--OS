"use client";

import { FormEvent, useEffect, useState } from "react";
import { api } from "../lib/api";

type Category = {
  id: string;
  name: string;
};

type MenuItem = {
  id: string;
  name: string;
  description?: string | null;
  price: number | string;
  imageUrl?: string | null;
  isAvailable: boolean;
  categoryId: string;
  category?: Category;
};

type MenuResponse = {
  items: MenuItem[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
};

function getToken() {
  if (typeof window === "undefined") {
    return "";
  }

  return localStorage.getItem("token") || "";
}

function getErrorMessage(error: unknown, fallback: string) {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error
  ) {
    const response = (
      error as {
        response?: {
          data?: {
            message?: string;
          };
        };
      }
    ).response;

    return response?.data?.message || fallback;
  }

  return fallback;
}

export default function MenuPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [showItemForm, setShowItemForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);

  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [editingCategory, setEditingCategory] =
    useState<Category | null>(null);

  const [categoryName, setCategoryName] = useState("");

  const [itemName, setItemName] = useState("");
  const [itemDescription, setItemDescription] = useState("");
  const [itemPrice, setItemPrice] = useState("");
  const [itemImageUrl, setItemImageUrl] = useState("");
  const [itemCategoryId, setItemCategoryId] = useState("");
  const [itemAvailable, setItemAvailable] = useState(true);

  async function loadCategories() {
    const token = getToken();

    if (!token) {
      throw new Error("Please login first.");
    }

    const response = await api.get("/categories", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    setCategories(response.data);
  }

  async function loadMenuItems() {
    const token = getToken();

    if (!token) {
      throw new Error("Please login first.");
    }

    const params: Record<string, string | number> = {
      page: 1,
      limit: 100,
    };

    if (search.trim()) {
      params.search = search.trim();
    }

    if (categoryFilter) {
      params.categoryId = categoryFilter;
    }

    const response = await api.get<MenuResponse>("/menu-items", {
      params,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    setItems(response.data.items);
  }

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      await Promise.all([
        loadCategories(),
        loadMenuItems(),
      ]);
    } catch (err) {
      console.error(err);
      setError(
        getErrorMessage(err, "Unable to load menu data.")
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadMenuItems().catch((err) => {
        console.error(err);
        setError(
          getErrorMessage(err, "Unable to search menu items.")
        );
      });
    }, 300);

    return () => clearTimeout(timer);
  }, [search, categoryFilter]);

  function resetItemForm() {
    setItemName("");
    setItemDescription("");
    setItemPrice("");
    setItemImageUrl("");
    setItemCategoryId(categories[0]?.id || "");
    setItemAvailable(true);
    setEditingItem(null);
  }

  function openAddItem() {
    resetItemForm();
    setShowItemForm(true);
    setMessage("");
    setError("");
  }

  function openEditItem(item: MenuItem) {
    setEditingItem(item);

    setItemName(item.name);
    setItemDescription(item.description || "");
    setItemPrice(String(item.price));
    setItemImageUrl(item.imageUrl || "");
    setItemCategoryId(item.categoryId);
    setItemAvailable(item.isAvailable);

    setShowItemForm(true);
    setMessage("");
    setError("");
  }

  function closeItemForm() {
    setShowItemForm(false);
    resetItemForm();
  }

  async function handleItemSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!itemName.trim()) {
      setError("Menu item name is required.");
      return;
    }

    if (!itemPrice || Number(itemPrice) <= 0) {
      setError("Please enter a valid price.");
      return;
    }

    if (!itemCategoryId) {
      setError("Please select a category.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const token = getToken();

      const body: {
        name: string;
        description?: string;
        price: number;
        imageUrl?: string;
        categoryId: string;
        isAvailable: boolean;
      } = {
        name: itemName.trim(),
        description: itemDescription.trim(),
        price: Number(itemPrice),
        categoryId: itemCategoryId,
        isAvailable: itemAvailable,
      };

      if (itemImageUrl.trim()) {
        body.imageUrl = itemImageUrl.trim();
      }

      if (editingItem) {
        await api.patch(
          `/menu-items/${editingItem.id}`,
          body,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setMessage("Menu item updated successfully.");
      } else {
        await api.post("/menu-items", body, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setMessage("Menu item created successfully.");
      }

      closeItemForm();

      await loadMenuItems();
    } catch (err) {
      console.error(err);
      setError(
        getErrorMessage(err, "Unable to save menu item.")
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggleAvailability(item: MenuItem) {
    try {
      setError("");
      setMessage("");

      const token = getToken();

      await api.patch(
        `/menu-items/${item.id}/availability`,
        {
          isAvailable: !item.isAvailable,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setMessage(
        `${item.name} is now ${
          !item.isAvailable ? "available" : "unavailable"
        }.`
      );

      await loadMenuItems();
    } catch (err) {
      console.error(err);
      setError(
        getErrorMessage(
          err,
          "Unable to change item availability."
        )
      );
    }
  }

  async function deleteItem(item: MenuItem) {
    const confirmed = window.confirm(
      `Delete "${item.name}"? This cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setMessage("");

      const token = getToken();

      await api.delete(`/menu-items/${item.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setMessage("Menu item deleted successfully.");

      await loadMenuItems();
    } catch (err) {
      console.error(err);
      setError(
        getErrorMessage(err, "Unable to delete menu item.")
      );
    }
  }

  function openAddCategory() {
    setEditingCategory(null);
    setCategoryName("");
    setShowCategoryForm(true);
    setMessage("");
    setError("");
  }

  function openEditCategory(category: Category) {
    setEditingCategory(category);
    setCategoryName(category.name);
    setShowCategoryForm(true);
    setMessage("");
    setError("");
  }

  function closeCategoryForm() {
    setShowCategoryForm(false);
    setEditingCategory(null);
    setCategoryName("");
  }

  async function handleCategorySubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (categoryName.trim().length < 2) {
      setError(
        "Category name must be at least 2 characters."
      );
      return;
    }

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const token = getToken();

      if (editingCategory) {
        await api.patch(
          `/categories/${editingCategory.id}`,
          {
            name: categoryName.trim(),
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setMessage("Category updated successfully.");
      } else {
        await api.post(
          "/categories",
          {
            name: categoryName.trim(),
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setMessage("Category created successfully.");
      }

      closeCategoryForm();

      await loadCategories();
      await loadMenuItems();
    } catch (err) {
      console.error(err);
      setError(
        getErrorMessage(err, "Unable to save category.")
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteCategory(category: Category) {
    const confirmed = window.confirm(
      `Delete category "${category.name}"?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setMessage("");

      const token = getToken();

      await api.delete(`/categories/${category.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (categoryFilter === category.id) {
        setCategoryFilter("");
      }

      setMessage("Category deleted successfully.");

      await loadCategories();
      await loadMenuItems();
    } catch (err) {
      console.error(err);
      setError(
        getErrorMessage(
          err,
          "Unable to delete category. Make sure it has no menu items."
        )
      );
    }
  }

  function formatPrice(price: number | string) {
    const numericPrice = Number(price);

    if (Number.isNaN(numericPrice)) {
      return "₹0";
    }

    return `₹${numericPrice.toLocaleString("en-IN", {
      maximumFractionDigits: 2,
    })}`;
  }

  if (loading) {
    return (
      <main className="menu-page">
        <div className="menu-loading">
          Loading Menu Management...
        </div>
      </main>
    );
  }

  return (
    <main className="menu-page">
      <header className="menu-header">
        <div>
          <p className="menu-label">RESTAURANTOS</p>

          <h1>Menu Management</h1>

          <p className="menu-subtitle">
            Manage categories, menu items, prices and availability.
          </p>
        </div>

        <div className="menu-header-actions">
          <a
            href="/dashboard"
            className="menu-secondary-button"
          >
            Dashboard
          </a>

          <button
            type="button"
            className="menu-primary-button"
            onClick={openAddItem}
          >
            + Add Menu Item
          </button>
        </div>
      </header>

      {message && (
        <div className="menu-message">
          {message}
        </div>
      )}

      {error && (
        <div className="menu-error">
          {error}
        </div>
      )}

      <section className="menu-panel">
        <div className="menu-panel-header">
          <div>
            <h2>Categories</h2>

            <p>
              Organize your restaurant menu.
            </p>
          </div>

          <button
            type="button"
            className="menu-primary-button"
            onClick={openAddCategory}
          >
            + Add Category
          </button>
        </div>

        <div className="category-list">
          <button
            type="button"
            className={`category-chip ${
              categoryFilter === "" ? "active" : ""
            }`}
            onClick={() => setCategoryFilter("")}
          >
            All
          </button>

          {categories.map((category) => (
            <div
              className={`category-chip-wrapper ${
                categoryFilter === category.id
                  ? "selected"
                  : ""
              }`}
              key={category.id}
            >
              <button
                type="button"
                className="category-chip"
                onClick={() =>
                  setCategoryFilter(category.id)
                }
              >
                {category.name}
              </button>

              <button
                type="button"
                className="category-edit"
                onClick={() => openEditCategory(category)}
                title={`Edit ${category.name}`}
              >
                ✎
              </button>

              <button
                type="button"
                className="category-delete"
                onClick={() => deleteCategory(category)}
                title={`Delete ${category.name}`}
              >
                ×
              </button>
            </div>
          ))}

          {categories.length === 0 && (
            <span className="empty-inline">
              No categories yet.
            </span>
          )}
        </div>
      </section>

      <section className="menu-panel">
        <div className="menu-panel-header">
          <div>
            <h2>Menu Items</h2>

            <p>
              {items.length} item
              {items.length === 1 ? "" : "s"} found.
            </p>
          </div>
        </div>

        <div className="menu-filters">
          <input
            type="text"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search menu items..."
            className="menu-search"
          />

          <select
            value={categoryFilter}
            onChange={(event) =>
              setCategoryFilter(event.target.value)
            }
            className="menu-select"
          >
            <option value="">All Categories</option>

            {categories.map((category) => (
              <option
                value={category.id}
                key={category.id}
              >
                {category.name}
              </option>
            ))}
          </select>

          <button
            type="button"
            className="menu-secondary-button"
            onClick={loadData}
          >
            Refresh
          </button>
        </div>

        {items.length === 0 ? (
          <div className="menu-empty">
            <h3>No menu items found</h3>

            <p>
              Add your first menu item to start building
              your restaurant menu.
            </p>

            <button
              type="button"
              className="menu-primary-button"
              onClick={openAddItem}
            >
              + Add Menu Item
            </button>
          </div>
        ) : (
          <div className="menu-items-grid">
            {items.map((item) => (
              <article
                className="menu-item-card"
                key={item.id}
              >
                <div className="menu-item-top">
                  <div>
                    <span
                      className={`availability-badge ${
                        item.isAvailable
                          ? "available"
                          : "unavailable"
                      }`}
                    >
                      {item.isAvailable
                        ? "AVAILABLE"
                        : "UNAVAILABLE"}
                    </span>

                    <h3>{item.name}</h3>
                  </div>

                  <strong className="menu-price">
                    {formatPrice(item.price)}
                  </strong>
                </div>

                <p className="menu-category">
                  {item.category?.name || "No category"}
                </p>

                {item.description && (
                  <p className="menu-description">
                    {item.description}
                  </p>
                )}

                <div className="menu-item-actions">
                  <button
                    type="button"
                    className="menu-toggle-button"
                    onClick={() =>
                      toggleAvailability(item)
                    }
                  >
                    {item.isAvailable
                      ? "Mark Unavailable"
                      : "Mark Available"}
                  </button>

                  <button
                    type="button"
                    className="menu-edit-button"
                    onClick={() => openEditItem(item)}
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    className="menu-delete-button"
                    onClick={() => deleteItem(item)}
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {showCategoryForm && (
        <div className="menu-modal-backdrop">
          <div className="menu-modal">
            <div className="menu-modal-header">
              <div>
                <p className="menu-label">CATEGORY</p>

                <h2>
                  {editingCategory
                    ? "Edit Category"
                    : "Add Category"}
                </h2>
              </div>

              <button
                type="button"
                className="modal-close"
                onClick={closeCategoryForm}
              >
                ×
              </button>
            </div>

            <form
              onSubmit={handleCategorySubmit}
              className="menu-form"
            >
              <label>
                Category Name
                <input
                  value={categoryName}
                  onChange={(event) =>
                    setCategoryName(event.target.value)
                  }
                  placeholder="e.g. Main Course"
                  maxLength={100}
                  autoFocus
                />
              </label>

              <div className="form-actions">
                <button
                  type="button"
                  className="menu-secondary-button"
                  onClick={closeCategoryForm}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="menu-primary-button"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editingCategory
                    ? "Update Category"
                    : "Create Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showItemForm && (
        <div className="menu-modal-backdrop">
          <div className="menu-modal menu-item-modal">
            <div className="menu-modal-header">
              <div>
                <p className="menu-label">MENU ITEM</p>

                <h2>
                  {editingItem
                    ? "Edit Menu Item"
                    : "Add Menu Item"}
                </h2>
              </div>

              <button
                type="button"
                className="modal-close"
                onClick={closeItemForm}
              >
                ×
              </button>
            </div>

            <form
              onSubmit={handleItemSubmit}
              className="menu-form"
            >
              <label>
                Item Name
                <input
                  value={itemName}
                  onChange={(event) =>
                    setItemName(event.target.value)
                  }
                  placeholder="e.g. Chicken Biryani"
                  maxLength={100}
                  autoFocus
                />
              </label>

              <label>
                Description
                <textarea
                  value={itemDescription}
                  onChange={(event) =>
                    setItemDescription(event.target.value)
                  }
                  placeholder="Describe the menu item..."
                  rows={3}
                />
              </label>

              <div className="form-two-columns">
                <label>
                  Price
                  <input
                    type="number"
                    value={itemPrice}
                    onChange={(event) =>
                      setItemPrice(event.target.value)
                    }
                    placeholder="249"
                    min="0.01"
                    step="0.01"
                  />
                </label>

                <label>
                  Category
                  <select
                    value={itemCategoryId}
                    onChange={(event) =>
                      setItemCategoryId(
                        event.target.value
                      )
                    }
                  >
                    <option value="">
                      Select Category
                    </option>

                    {categories.map((category) => (
                      <option
                        value={category.id}
                        key={category.id}
                      >
                        {category.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label>
                Image URL
                <input
                  value={itemImageUrl}
                  onChange={(event) =>
                    setItemImageUrl(event.target.value)
                  }
                  placeholder="https://example.com/image.jpg"
                />
              </label>

              <label className="availability-checkbox">
                <input
                  type="checkbox"
                  checked={itemAvailable}
                  onChange={(event) =>
                    setItemAvailable(
                      event.target.checked
                    )
                  }
                />

                <span>
                  Item is currently available
                </span>
              </label>

              <div className="form-actions">
                <button
                  type="button"
                  className="menu-secondary-button"
                  onClick={closeItemForm}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="menu-primary-button"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editingItem
                    ? "Update Menu Item"
                    : "Create Menu Item"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .menu-page {
          min-height: 100vh;
          padding: 42px 5%;
          background: #f5f7fb;
          color: #111827;
        }

        .menu-header {
          max-width: 1250px;
          margin: 0 auto 28px;
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 24px;
        }

        .menu-label {
          margin: 0 0 5px;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 3px;
          color: #667085;
        }

        .menu-header h1 {
          margin: 0;
          font-size: 34px;
        }

        .menu-subtitle {
          margin: 7px 0 0;
          color: #667085;
        }

        .menu-header-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .menu-panel {
          max-width: 1250px;
          margin: 0 auto 24px;
          padding: 24px;
          background: white;
          border: 1px solid #e4e7ec;
          border-radius: 16px;
          box-shadow: 0 5px 18px rgba(16, 24, 40, 0.05);
        }

        .menu-panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
          margin-bottom: 20px;
        }

        .menu-panel-header h2 {
          margin: 0;
          font-size: 20px;
        }

        .menu-panel-header p {
          margin: 5px 0 0;
          color: #667085;
          font-size: 14px;
        }

        .menu-primary-button,
        .menu-secondary-button,
        .menu-toggle-button,
        .menu-edit-button,
        .menu-delete-button {
          border: 0;
          border-radius: 9px;
          padding: 10px 15px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: 0.15s ease;
        }

        .menu-primary-button {
          background: #101828;
          color: white;
        }

        .menu-primary-button:hover {
          background: #1d2939;
        }

        .menu-primary-button:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        .menu-secondary-button {
          background: white;
          color: #101828;
          border: 1px solid #d0d5dd;
        }

        .menu-secondary-button:hover {
          background: #f9fafb;
        }

        .category-list {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 9px;
        }

        .category-chip-wrapper {
          display: flex;
          align-items: center;
          border: 1px solid #d0d5dd;
          border-radius: 9px;
          overflow: hidden;
          background: white;
        }

        .category-chip-wrapper.selected {
          border-color: #101828;
        }

        .category-chip {
          border: 0;
          padding: 9px 13px;
          background: transparent;
          color: #344054;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
        }

        .category-list > .category-chip:first-child {
          border: 1px solid #d0d5dd;
          border-radius: 9px;
        }

        .category-list > .category-chip:first-child.active {
          background: #101828;
          color: white;
          border-color: #101828;
        }

        .category-edit,
        .category-delete {
          width: 29px;
          height: 31px;
          border: 0;
          background: transparent;
          cursor: pointer;
          color: #667085;
          font-weight: 700;
        }

        .category-delete {
          font-size: 18px;
        }

        .category-edit:hover,
        .category-delete:hover {
          background: #f2f4f7;
          color: #101828;
        }

        .empty-inline {
          color: #98a2b3;
          font-size: 14px;
        }

        .menu-filters {
          display: flex;
          gap: 10px;
          margin-bottom: 22px;
        }

        .menu-search,
        .menu-select,
        .menu-form input,
        .menu-form textarea,
        .menu-form select {
          width: 100%;
          box-sizing: border-box;
          border: 1px solid #d0d5dd;
          border-radius: 9px;
          padding: 11px 12px;
          font: inherit;
          outline: none;
          background: white;
        }

        .menu-search {
          flex: 1;
        }

        .menu-select {
          width: 230px;
        }

        .menu-search:focus,
        .menu-form input:focus,
        .menu-form textarea:focus,
        .menu-form select:focus {
          border-color: #667085;
          box-shadow: 0 0 0 3px rgba(16, 24, 40, 0.06);
        }

        .menu-items-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
        }

        .menu-item-card {
          border: 1px solid #e4e7ec;
          border-radius: 13px;
          padding: 20px;
          background: #fff;
        }

        .menu-item-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 20px;
        }

        .menu-item-top h3 {
          margin: 8px 0 0;
          font-size: 19px;
        }

        .availability-badge {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 999px;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 0.6px;
        }

        .availability-badge.available {
          background: #ecfdf3;
          color: #027a48;
        }

        .availability-badge.unavailable {
          background: #fef3f2;
          color: #b42318;
        }

        .menu-price {
          font-size: 20px;
          white-space: nowrap;
        }

        .menu-category {
          margin: 8px 0;
          color: #667085;
          font-size: 13px;
          font-weight: 700;
        }

        .menu-description {
          margin: 13px 0;
          color: #667085;
          font-size: 14px;
          line-height: 1.5;
        }

        .menu-item-actions {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-top: 18px;
          padding-top: 15px;
          border-top: 1px solid #eaecf0;
        }

        .menu-toggle-button {
          background: #f2f4f7;
          color: #344054;
        }

        .menu-edit-button {
          background: #eef4ff;
          color: #175cd3;
        }

        .menu-delete-button {
          background: #fef3f2;
          color: #b42318;
        }

        .menu-empty,
        .menu-loading {
          padding: 55px 20px;
          text-align: center;
          color: #667085;
        }

        .menu-empty h3 {
          color: #101828;
          margin: 0 0 8px;
        }

        .menu-empty p {
          margin: 0 0 20px;
        }

        .menu-message,
        .menu-error {
          max-width: 1250px;
          margin: 0 auto 18px;
          padding: 12px 15px;
          border-radius: 9px;
          font-size: 14px;
        }

        .menu-message {
          background: #ecfdf3;
          color: #027a48;
          border: 1px solid #abefc6;
        }

        .menu-error {
          background: #fef3f2;
          color: #b42318;
          border: 1px solid #fecdca;
        }

        .menu-modal-backdrop {
          position: fixed;
          inset: 0;
          z-index: 100;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          background: rgba(16, 24, 40, 0.55);
        }

        .menu-modal {
          width: min(500px, 100%);
          max-height: 90vh;
          overflow-y: auto;
          background: white;
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 25px 60px rgba(16, 24, 40, 0.25);
        }

        .menu-item-modal {
          width: min(650px, 100%);
        }

        .menu-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 22px;
        }

        .menu-modal-header h2 {
          margin: 0;
        }

        .modal-close {
          width: 34px;
          height: 34px;
          border: 0;
          border-radius: 8px;
          background: #f2f4f7;
          font-size: 22px;
          cursor: pointer;
        }

        .menu-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .menu-form label {
          display: flex;
          flex-direction: column;
          gap: 7px;
          font-size: 13px;
          font-weight: 700;
          color: #344054;
        }

        .menu-form textarea {
          resize: vertical;
        }

        .form-two-columns {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }

        .availability-checkbox {
          flex-direction: row !important;
          align-items: center;
          cursor: pointer;
        }

        .availability-checkbox input {
          width: auto;
        }

        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 9px;
          padding-top: 5px;
        }

        @media (max-width: 800px) {
          .menu-page {
            padding: 25px 16px;
          }

          .menu-header {
            align-items: flex-start;
            flex-direction: column;
          }

          .menu-items-grid {
            grid-template-columns: 1fr;
          }

          .menu-filters {
            flex-direction: column;
          }

          .menu-select {
            width: 100%;
          }
        }

        @media (max-width: 520px) {
          .menu-panel {
            padding: 17px;
          }

          .menu-panel-header {
            align-items: flex-start;
            flex-direction: column;
          }

          .form-two-columns {
            grid-template-columns: 1fr;
          }

          .menu-header-actions {
            width: 100%;
          }

          .menu-header-actions > * {
            flex: 1;
          }
        }
      `}</style>
    </main>
  );
}