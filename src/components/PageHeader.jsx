export default function PageHeader({ icon: Icon, eyebrow, title, children }) {
  return (
    <div className="page-header">
      {eyebrow && (
        <div className="page-header-row">
          <span className="page-header-eyebrow">{eyebrow}</span>
        </div>
      )}
      <h1 className="page-header-title">
        {Icon && (
          <span className="page-header-title-icon" aria-hidden="true">
            <Icon size={24} />
          </span>
        )}
        <span>{title}</span>
      </h1>
      {children}
    </div>
  );
}
