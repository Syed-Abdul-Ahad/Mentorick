import { Link } from 'react-router-dom';
import Seo from '../components/seo/Seo';

const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Seo
        title="Page Not Found | Mentorick"
        description="The page you requested could not be found on Mentorick."
        canonical="/404"
        noindex
      />
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <p className="text-9xl font-bold text-gray-200" aria-hidden="true">404</p>
          <h1 className="mt-6 text-3xl font-extrabold text-gray-900">
            Page not found
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Sorry, we couldn&apos;t find the page you&apos;re looking for.
          </p>
        </div>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Go back home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
