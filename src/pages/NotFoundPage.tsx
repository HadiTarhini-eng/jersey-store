import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';

export function NotFoundPage() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 gap-6">
      <div>
        <p className="text-8xl font-black text-gradient-accent">404</p>
        <h1 className="text-2xl font-bold text-primary mt-3">Page not found</h1>
        <p className="text-secondary text-sm mt-2 max-w-sm mx-auto">
          The page you're looking for doesn't exist or has been moved.
        </p>
      </div>
      <div className="flex items-center gap-4">
        <Link to="/">
          <Button variant="primary">Go Home</Button>
        </Link>
        <Link to="/shop">
          <Button variant="ghost">Browse Shop</Button>
        </Link>
      </div>
    </div>
  );
}
