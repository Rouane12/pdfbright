export function BrandLogo() {
  return (
    <span className="brand-logo" aria-label="PDFBright">
      <span className="brand-mark" aria-hidden="true">
        <svg viewBox="0 0 32 32" fill="none">
          <path d="M7.2 3.5h10.2l7.4 7.5v16.3c0 .7-.6 1.2-1.2 1.2H7.2c-.7 0-1.2-.6-1.2-1.2V4.8c0-.7.5-1.3 1.2-1.3Z" fill="white" stroke="currentColor" strokeWidth="2" />
          <path d="M17.4 3.8v6c0 .8.6 1.4 1.4 1.4h5.7" fill="#DDF3FF" stroke="currentColor" strokeWidth="2" />
          <path d="M10 13.5h7M10 17.3h8.5M10 21.1h5.8" stroke="#9FB2C8" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M22 16.2c.8 3.8 2.5 5.5 6.3 6.3-3.8.8-5.5 2.5-6.3 6.3-.8-3.8-2.5-5.5-6.3-6.3 3.8-.8 5.5-2.5 6.3-6.3Z" className="brand-spark" />
        </svg>
      </span>
      <span className="brand-wordmark" aria-hidden="true">
        <span className="brand-wordmark__pdf">PDF</span>
        <span className="brand-wordmark__bright">Br<span className="brand-wordmark__i">i</span>ght</span>
      </span>
    </span>
  );
}
