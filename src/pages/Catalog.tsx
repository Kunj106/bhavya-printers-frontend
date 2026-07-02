import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { products, Product } from '@/lib/api';
import { formatRupee } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, ShoppingCart, Loader2 } from 'lucide-react';
import { Link } from 'wouter';
import { useAuth } from '@/context/AuthContext';
import { motion } from 'framer-motion';

export default function Catalog() {
  const { data: allProducts, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: products.list,
  });
  
  const { role } = useAuth();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('All');

  const categories = ['All', ...Array.from(new Set(allProducts?.map((p) => p.category) || []))];

  const filteredProducts = allProducts?.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === 'All' || p.category === category;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto px-4 flex flex-col md:flex-row gap-8">
        
        {/* Sidebar Filters */}
        <aside className="w-full md:w-64 flex-shrink-0">
          <div className="sticky top-24 bg-card border rounded-xl p-6">
            <h3 className="font-semibold text-lg mb-4">Categories</h3>
            <div className="flex flex-col gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`text-left px-3 py-2 rounded-md text-sm transition-colors ${
                    category === cat 
                      ? 'bg-primary text-primary-foreground font-medium' 
                      : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Product Catalog</h1>
              <p className="text-muted-foreground mt-1">Browse our premium stationery collection</p>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search products..." 
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {isLoading ? (
            <div className="flex-1 flex items-center justify-center py-24">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredProducts?.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-24 text-center border rounded-xl bg-card border-dashed">
              <ShoppingCart className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
              <h3 className="text-lg font-medium text-foreground">No products found</h3>
              <p className="text-muted-foreground mt-1 max-w-sm">
                We couldn't find any products matching your search criteria. Try selecting a different category or adjusting your search term.
              </p>
              <Button variant="outline" className="mt-6" onClick={() => { setSearch(''); setCategory('All'); }}>
                Clear Filters
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts?.map((product, index) => (
                <ProductCard key={product.id} product={product} role={role} index={index} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ProductCard({ product, role, index }: { product: Product; role: string | null; index: number }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="group flex flex-col bg-card border rounded-xl overflow-hidden hover:border-primary/50 hover:shadow-md transition-all"
    >
      <div className="aspect-square bg-secondary flex items-center justify-center p-6 relative overflow-hidden">
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={product.name} className="object-contain w-full h-full mix-blend-multiply dark:mix-blend-normal" />
        ) : (
          <PackagePlaceholder />
        )}
        <div className="absolute top-3 left-3">
          <span className="inline-flex items-center rounded-full bg-background/80 backdrop-blur-sm px-2.5 py-0.5 text-xs font-semibold text-foreground border shadow-sm">
            {product.category}
          </span>
        </div>
      </div>
      <div className="p-5 flex flex-col flex-1">
        <h3 className="font-semibold text-foreground leading-tight line-clamp-2" title={product.name}>{product.name}</h3>
        <p className="text-xs text-muted-foreground mt-2 line-clamp-2 flex-1" title={product.description}>{product.description}</p>
        <div className="mt-4 flex items-center justify-between">
          <span className="font-bold text-lg text-primary">{formatRupee(product.price)}</span>
          {role === 'bank' ? (
            <Link href={`/orders/new?product=${product.id}`}>
              <Button size="sm">Order Now</Button>
            </Link>
          ) : role === 'admin' ? (
            <Link href={`/admin/products`}>
              <Button size="sm" variant="outline">Manage</Button>
            </Link>
          ) : (
            <Link href="/login">
              <Button size="sm" variant="secondary">Login to Order</Button>
            </Link>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function PackagePlaceholder() {
  return (
    <div className="text-muted-foreground/20 flex flex-col items-center">
      <ShoppingCart className="h-16 w-16 mb-2" />
      <span className="text-xs font-medium tracking-wider uppercase">Image Coming Soon</span>
    </div>
  );
}
