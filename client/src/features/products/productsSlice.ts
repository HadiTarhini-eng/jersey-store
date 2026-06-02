import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { productService } from '../../services/productService';
import type { ProductFilters, ProductsState, SortOption } from '../../types';

// ── Thunks ───────────────────────────────────────────────────────────────────

export const fetchProducts = createAsyncThunk(
  'products/fetchAll',
  async (
    { filters, sort, page, limit }: { filters?: ProductFilters; sort?: SortOption; page?: number; limit?: number },
    { rejectWithValue },
  ) => {
    try {
      return await productService.getProducts(filters, sort, page, limit);
    } catch (err: any) {
      return rejectWithValue(err?.message ?? 'Failed to load products.');
    }
  },
);

export const fetchProductBySlug = createAsyncThunk(
  'products/fetchOne',
  async (slug: string, { rejectWithValue }) => {
    try {
      const product = await productService.getProductBySlug(slug);
      return await productService.withVariants(product);
    } catch (err: any) {
      return rejectWithValue({
        slug,
        message: err?.message ?? 'Product not found.',
        status:  typeof err?.status === 'number' ? err.status : undefined,
      });
    }
  },
);

// ── Slice ─────────────────────────────────────────────────────────────────────

interface ExtendedProductsState extends ProductsState {
  /** Slug we last received a 404 for — distinguishes "no such product" from network errors. */
  notFoundSlug: string | null;
  /** Total number of products matching the current filters (across all pages). */
  total: number;
}

const initialState: ExtendedProductsState = {
  items:           [],
  selectedProduct: null,
  filters:         {},
  sort:            'newest',
  loading:         false,
  error:           null,
  notFoundSlug:    null,
  total:           0,
};

const productsSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    setFilters:           (state, action: PayloadAction<ProductFilters>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters:         (state) => { state.filters = {}; },
    setSort:              (state, action: PayloadAction<SortOption>) => { state.sort = action.payload; },
    clearSelectedProduct: (state) => { state.selectedProduct = null; },
    clearProductError:    (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending,   (state) => { state.loading = true; state.error = null; })
      .addCase(fetchProducts.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.items   = payload.data;
        state.total   = payload.total;
      })
      .addCase(fetchProducts.rejected,  (state, { payload }) => {
        state.loading = false;
        state.error   = payload as string;
      });

    builder
      .addCase(fetchProductBySlug.pending,   (state) => {
        state.loading      = true;
        state.error        = null;
        state.notFoundSlug = null;
      })
      .addCase(fetchProductBySlug.fulfilled, (state, { payload }) => {
        state.loading         = false;
        state.selectedProduct = payload;
      })
      .addCase(fetchProductBySlug.rejected,  (state, { payload }) => {
        state.loading = false;
        const p = payload as { slug?: string; message?: string; status?: number } | string | undefined;
        if (typeof p === 'object' && p !== null) {
          state.error        = p.message ?? 'Product not found.';
          state.notFoundSlug = p.status === 404 && p.slug ? p.slug : null;
        } else {
          state.error        = typeof p === 'string' ? p : 'Product not found.';
          state.notFoundSlug = null;
        }
      });
  },
});

export const {
  setFilters, clearFilters, setSort, clearSelectedProduct, clearProductError,
} = productsSlice.actions;

export default productsSlice.reducer;
