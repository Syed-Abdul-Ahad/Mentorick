import { Link } from 'react-router-dom';

const BrandLogo = ({
  to = '/',
  className = 'h-10 w-auto object-contain',
  linkClassName = 'inline-flex items-center shrink-0',
  asLink = true,
}) => {
  const image = (
    <img
      src="/mentorick-logo.png"
      alt="Mentorick"
      className={className}
    />
  );

  if (!asLink) {
    return image;
  }

  return (
    <Link to={to} className={linkClassName} aria-label="Mentorick home">
      {image}
    </Link>
  );
};

export default BrandLogo;
