import { Helmet } from 'react-helmet-async';

const JsonLd = ({ data }) => {
  if (!data) return null;

  const payload = Array.isArray(data) ? data : [data];

  return (
    <Helmet>
      {payload.map((entry, index) => (
        <script key={index} type="application/ld+json">
          {JSON.stringify(entry)}
        </script>
      ))}
    </Helmet>
  );
};

export default JsonLd;
