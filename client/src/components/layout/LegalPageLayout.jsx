import { Link } from 'react-router-dom';
import Footer from '../shared/Footer';
import Seo from '../seo/Seo';

const LegalPageLayout = ({
  title,
  description,
  canonical,
  children,
}) => (
  <>
    <Seo title={`${title} | Mentorick`} description={description} canonical={canonical} />
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav aria-label="Breadcrumb">
            <Link to="/" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
              ← Back to Mentorick
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{title}</h1>
          <p className="text-gray-600 mb-8">{description}</p>
          <div className="prose prose-gray max-w-none text-gray-700 space-y-4">{children}</div>
        </article>
      </main>

      <Footer />
    </div>
  </>
);

export default LegalPageLayout;
