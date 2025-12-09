import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { productService } from '../../api/productService';
import { Product } from '../../types';
import { authUtils } from '../../utils/auth';
import { useCart } from '../../context/CartContext';
import Alert from '../../components/Alert/Alert';
import { Card, CardContent, CardDescription, CardTitle } from '../../components/UI/card';
import { Button } from '../../components/UI/button';
import { Input } from '../../components/UI/input';
import { Skeleton } from '../../components/UI/skeleton';
import './ProductsList.css';

const ProductsList: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { addToCart } = useCart();

  useEffect(() => {
    loadProducts();
    const refParam = searchParams.get('ref');
    if (refParam) {
      const refId = parseInt(refParam, 10);
      if (!isNaN(refId)) {
        authUtils.setReferralId(refId);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const productsData = await productService.getAllProducts();
      setProducts(productsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleBuyNow = (productId: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    navigate(`/orders/${productId}`);
  };

  const handleAddToCart = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    // guard: ensure product has stock before adding (extra safety)
    if (product.stock && product.stock > 0) {
      addToCart(product, 1);
    }
  };

  const handleProductClick = (productId: number) => {
    navigate(`/products/${productId}`);
  };

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products;
    const query = searchQuery.toLowerCase();
    return products.filter(
      (product) =>
        product.name.toLowerCase().includes(query) ||
        product.description?.toLowerCase().includes(query)
    );
  }, [products, searchQuery]);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-8 space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-text-primary">Products</h1>
            <p className="text-text-secondary text-sm">Discover Tycon’s G1 Prash and more.</p>
          </div>
          <div className="w-full sm:w-80">
            <div className="relative">
              <Input
                placeholder="🔍 Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>

        {error && <Alert variant="danger" message={error} onClose={() => setError(null)} />}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="shadow-soft">
                <Skeleton className="h-48 w-full rounded-2xl" />
                <CardContent className="space-y-2 pt-4">
                  <Skeleton className="h-5 w-2/3" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <>
            {filteredProducts.length === 0 ? (
              <Card className="shadow-soft">
                <CardContent className="py-10 text-center space-y-3">
                  <div className="text-4xl">📦</div>
                  <CardTitle>No products found</CardTitle>
                  <CardDescription>
                    {searchQuery ? 'Try adjusting your search query.' : 'No products available at the moment.'}
                  </CardDescription>
                  {searchQuery && (
                    <Button variant="outline" onClick={() => setSearchQuery('')}>
                      Clear Search
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {searchQuery && (
                  <p className="text-sm text-text-secondary">
                    Found {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''}
                  </p>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredProducts.map((product) => {
                    const isOutOfStock = !product.stock || product.stock < 1;
                    const isLowStock = !isOutOfStock && product.stock < 5;

                    return (
                      <Card
                        key={product.productId}
                        className="shadow-soft cursor-pointer group flex flex-col overflow-hidden"
                        onClick={() => handleProductClick(product.productId)}
                      >
                        <div className="relative overflow-hidden rounded-t-2xl">
                          <img
                            src={product.imageUrl || '/images/Tycon-G-1-Prash.png'}
                            alt={product.name}
                            className="h-48 w-full object-cover transition duration-300 group-hover:scale-105"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/images/Tycon-G-1-Prash.png';
                            }}
                          />

                          {/* Overlay gradient on hover */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent opacity-0 group-hover:opacity-100 transition"></div>

                          {/* Stock badge in top-left */}
                          <div className="absolute top-3 left-3 z-10">
                            {isOutOfStock ? (
                              <div className="bg-red-600 text-white rounded-full px-3 py-1 text-xs font-semibold">Sold Out</div>
                            ) : (
                              <div className="bg-green-600 text-white rounded-full px-3 py-1 text-xs font-semibold">In Stock</div>
                            )}
                          </div>

                          {/* Low stock / count in bottom-left */}
                          <div className="absolute bottom-3 left-3 z-10">
                            {!isOutOfStock && isLowStock && (
                              <div className="bg-yellow-600 text-black rounded px-2 py-1 text-xs font-medium">
                                Only {product.stock} left
                              </div>
                            )}
                          </div>

                          {/* Big sold-out overlay if out of stock */}
                          {isOutOfStock && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                              <div className="text-center text-white">
                                <div className="text-2xl font-bold">Sold Out</div>
                                <div className="text-sm mt-1">Currently unavailable</div>
                              </div>
                            </div>
                          )}
                        </div>

                        <CardContent className="flex flex-1 flex-col gap-3 pt-4">
                          <div className="space-y-1">
                            <CardTitle className="text-lg">{product.name}</CardTitle>
                            {product.description && (
                              <CardDescription>
                                {product.description.length > 90
                                  ? `${product.description.substring(0, 90)}...`
                                  : product.description}
                              </CardDescription>
                            )}
                          </div>

                          <div className="mt-auto space-y-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-xl font-semibold text-primary">₹{product.price.toFixed(2)}</p>
                                <p className="text-xs text-text-secondary">
                                  {isOutOfStock ? (
                                    <span className="text-red-600 font-medium">Out of stock</span>
                                  ) : (
                                    <span className="text-green-600 font-medium">Available: {product.stock}</span>
                                  )}
                                </p>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <Button
                                variant="outline"
                                onClick={(e) => handleAddToCart(product, e)}
                                disabled={isOutOfStock}
                              >
                                ➕ to Cart
                              </Button>
                              <Button onClick={(e) => handleBuyNow(product.productId, e)} disabled={isOutOfStock}>
                                🛒 Buy Now
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ProductsList;
